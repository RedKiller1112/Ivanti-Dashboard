import { ACCESS_CONFIG, ACCESS_SESSION_KEY } from '../config/accessControl';
import type { AppAccessSession } from '../types/auth';

const normalize = (value: string) => value.trim().toUpperCase();

const toSha256 = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
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
};

export const signOut = async (): Promise<void> => {
  clearAccessSession();
};

export const signInWithRegionPassword = async (
  accessKey: string,
  password: string
): Promise<AppAccessSession> => {
  const key = normalize(accessKey);
  if (!key) throw new Error('Debes ingresar región o clave de acceso.');
  if (!password.trim()) throw new Error('Debes ingresar la contraseña.');

  const config = ACCESS_CONFIG.find((x) => normalize(x.key) === key);
  if (!config) {
    throw new Error('Clave de acceso no reconocida.');
  }

  const hash = await toSha256(password);
  if (hash !== config.passwordHash) {
    throw new Error('Contraseña incorrecta.');
  }

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

  const session: AppAccessSession = {
    scope: scopeMap[config.scope] || 'region',
    role: roleMap[config.scope] || 'region',
    region: config.region,
    accessKey: config.key,
    loggedAt: new Date().toISOString()
  };

  sessionStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
  return session;
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
