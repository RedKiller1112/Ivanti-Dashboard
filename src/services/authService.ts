import { ACCESS_CONFIG, ACCESS_SESSION_KEY } from '../config/accessControl';
import type { AppAccessSession } from '../types/auth';

const normalize = (value: string) => value.trim().toUpperCase();

type LoginStep1Result =
  | { status: 'authenticated'; session: AppAccessSession }
  | { status: 'requires_totp'; accessKey: string };

const scopeMap: Record<string, AppAccessSession['scope']> = {
  general: 'general_admin',
  region: 'region',
  servicio_mda: 'servicio_mda',
  super_admin: 'super_admin'
};

const roleMap: Record<string, AppAccessSession['role']> = {
  general: 'admin',
  region: 'region',
  servicio_mda: 'servicio_mda',
  super_admin: 'super_admin'
};

const toSha256 = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const base32ToBytes = (base32: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = '';

  for (const ch of cleaned) {
    const val = alphabet.indexOf(ch);
    if (val < 0) throw new Error('Secret TOTP inválido (Base32).');
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
};

const hmacSha1 = async (key: Uint8Array, data: Uint8Array): Promise<Uint8Array> => {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
};

const intToBytes8 = (value: number): Uint8Array => {
  const bytes = new Uint8Array(8);
  let v = Math.floor(value);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = v & 0xff;
    v = Math.floor(v / 256);
  }
  return bytes;
};

const generateTotp = async (secretBase32: string, timestampMs = Date.now(), stepSeconds = 30): Promise<string> => {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const key = base32ToBytes(secretBase32);
  const msg = intToBytes8(counter);
  const hmac = await hmacSha1(key, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = (binCode % 1_000_000).toString().padStart(6, '0');
  return otp;
};

const verifyTotp = async (secretBase32: string, token: string): Promise<boolean> => {
  const cleaned = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;

  const now = Date.now();
  const windows = [-1, 0, 1];
  for (const w of windows) {
    const expected = await generateTotp(secretBase32, now + w * 30_000);
    if (expected === cleaned) return true;
  }
  return false;
};

const buildSession = (accessKey: string): AppAccessSession => {
  const config = ACCESS_CONFIG.find((x) => normalize(x.key) === normalize(accessKey));
  if (!config) throw new Error('Clave de acceso no reconocida.');

  return {
    scope: scopeMap[config.scope] || 'region',
    role: roleMap[config.scope] || 'region',
    region: config.region,
    accessKey: config.key,
    loggedAt: new Date().toISOString()
  };
};

export const getAccessSession = (): AppAccessSession | null => {
  const raw = sessionStorage.getItem(ACCESS_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppAccessSession;
  } catch {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    return null;
  }
};

export const clearAccessSession = (): void => {
  sessionStorage.removeItem(ACCESS_SESSION_KEY);
  sessionStorage.removeItem('ivanti_pending_totp_access_key');
};

export const signOut = async (): Promise<void> => {
  clearAccessSession();
};

export const beginSignInWithRegionPassword = async (
  accessKey: string,
  password: string
): Promise<LoginStep1Result> => {
  const key = normalize(accessKey);
  if (!key) throw new Error('Debes ingresar región o clave de acceso.');
  if (!password.trim()) throw new Error('Debes ingresar la contraseña.');

  const config = ACCESS_CONFIG.find((x) => normalize(x.key) === key);
  if (!config) throw new Error('Clave de acceso no reconocida.');

  const hash = await toSha256(password);
  if (hash !== config.passwordHash) throw new Error('Contraseña incorrecta.');

  if (key === 'GENERAL' && config.totpSecret) {
    sessionStorage.setItem('ivanti_pending_totp_access_key', config.key);
    return { status: 'requires_totp', accessKey: config.key };
  }

  const session = buildSession(config.key);
  sessionStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  return { status: 'authenticated', session };
};

export const completeTotpSignIn = async (token: string): Promise<AppAccessSession> => {
  const pendingAccessKey = sessionStorage.getItem('ivanti_pending_totp_access_key');
  if (!pendingAccessKey) throw new Error('No hay un inicio de sesión pendiente para OTP.');

  const config = ACCESS_CONFIG.find((x) => normalize(x.key) === normalize(pendingAccessKey));
  if (!config) throw new Error('Clave de acceso pendiente no válida.');
  if (!config.totpSecret) throw new Error('Este usuario no tiene TOTP configurado.');

  const valid = await verifyTotp(config.totpSecret, token);
  if (!valid) throw new Error('Código OTP inválido o expirado.');

  const session = buildSession(config.key);
  sessionStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  sessionStorage.removeItem('ivanti_pending_totp_access_key');
  return session;
};

export const signInWithRegionPassword = async (
  accessKey: string,
  password: string
): Promise<AppAccessSession> => {
  const result = await beginSignInWithRegionPassword(accessKey, password);
  if (result.status === 'requires_totp') {
    throw new Error('Se requiere código OTP para este usuario.');
  }
  return result.session;
};

export const isGeneralAdminAccessKey = (value: string): boolean => normalize(value) === 'GENERAL';
export const getCurrentSession = async () => null;
export const onAuthStateChange = (callback: (session: null) => void) => {
  callback(null);
  return { unsubscribe: () => {} };
};
export const getMyProfile = async () => null;
export const createUserByAdmin = async () => {
  throw new Error('La creación de usuarios por admin no aplica en modo local sin backend.');
};
