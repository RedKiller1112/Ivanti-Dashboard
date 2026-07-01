import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const ROOT = process.cwd();
const EXCEL_PATH = path.join(ROOT, '..', 'Equipos en Ivanti.xlsx');
const OUT_BASE = path.join(ROOT, 'public', 'data');
const OUT_GENERAL = path.join(OUT_BASE, 'general.json');
const OUT_REGIONES = path.join(OUT_BASE, 'regiones');

const REGIONES_OFICIALES = [
  'Fiscalia Nacional',
  'I Tarapacá',
  'II Antofagasta',
  'III Atacama',
  'IV Coquimbo',
  'IX La Araucanía',
  'RM Centro Norte',
  'RM Occidente',
  'RM Oriente',
  'RM Sur',
  'V Valparaíso',
  "VI O' Higgins",
  'VII Maule',
  'VIII Biobío',
  'X Los Lagos',
  'XI Aysén',
  'XII Magallanes',
  'XIV Los Ríos',
  'XV Arica y Parinacota',
  'XVI Ñuble',
  'Sin Región'
];

const slugifyRegion = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .toLowerCase()
    .trim()
    .replace(/['".]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const formatDate = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const excelSerialToDate = (serial) => {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
};

const normalizeDate = (value) => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = excelSerialToDate(value);
    if (!Number.isNaN(date.getTime())) return formatDate(date);
    return '';
  }

  const asString = String(value).trim();
  if (!asString) return '';

  const numericString = asString.replace(',', '.');
  const maybeSerial = Number(numericString);

  if (Number.isFinite(maybeSerial) && numericString !== '') {
    const date = excelSerialToDate(maybeSerial);
    if (!Number.isNaN(date.getTime())) return formatDate(date);
  }

  const isoLike = /^(\d{4})-(\d{2})-(\d{2})/;
  if (isoLike.test(asString)) {
    const parsedIso = new Date(asString);
    if (!Number.isNaN(parsedIso.getTime())) return formatDate(parsedIso);
  }

  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  const slashMatch = asString.match(slashDate);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const yearRaw = Number(slashMatch[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const manual = new Date(year, month - 1, day);
    if (!Number.isNaN(manual.getTime())) return formatDate(manual);
  }

  return '';
};

const normalizeRegion = (value) => {
  const region = String(value ?? '').trim();
  return region ? region : 'Sin Región';
};

const toYearFromDateString = (dateString) => {
  if (!dateString) return 'Sin año';
  const parts = dateString.split('/');
  if (parts.length === 3 && /^\d{4}$/.test(parts[2])) return parts[2];
  return 'Sin año';
};

const normalizeIP = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.includes('.')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  const partLength = Math.ceil(digits.length / 4);
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const start = i * partLength;
    if (start >= digits.length) break;
    const end = Math.min(start + partLength, digits.length);
    parts.push(digits.slice(start, end).padStart(3, '0'));
  }

  if (parts.length === 4) return parts.join('.');
  return raw;
};

const COLUMN_ALIASES = {
  nombreEquipo: ['nombre de equipo', 'equipo', 'nombre equipo'],
  tipo: ['tipo'],
  modelo: ['modelo'],
  numeroSerie: ['número de serie', 'numero de serie', 'serial'],
  direccionIP: ['dirección ip', 'direccion ip', 'ip'],
  direccionMAC: ['dirección mac', 'direccion mac', 'mac'],
  region: ['región', 'region'],
  fiscalia: ['fiscalía', 'fiscalia'],
  nombreSO: ['nombre de so', 'sistema operativo', 'so'],
  versionSO: ['versión de so', 'version de so'],
  revisionSO: ['revisión de so', 'revision de so'],
  usuario: ['usuario', 'user'],
  cuentaNT: ['cuenta nt'],
  agenteSophos: ['agente sophos', 'sophos'],
  agenteIvanti: ['agente ivanti', 'ivanti'],
  fechaCreacion: ['fecha de creación del registro', 'fecha de creacion del registro'],
  fechaSyncPoliticas: ['fecha de la última sincronización de políticas', 'fecha de la ultima sincronizacion de politicas'],
  ultimaActualizacion: ['última actualización por el servidor de inventario', 'ultima actualizacion por el servidor de inventario', 'último reporte', 'ultimo reporte'],
  estatus: ['estatus', 'estado del equipo', 'estado']
};

const resolveColumn = (headers, aliases) => {
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeText(h) }));
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const found = normalizedHeaders.find((h) => h.normalized === normalizedAlias);
    if (found) return found.original;
  }
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const found = normalizedHeaders.find((h) => h.normalized.includes(normalizedAlias));
    if (found) return found.original;
  }
  return undefined;
};

const mapRawRowToEquipo = (row, headers) => {
  const pick = (key) => {
    const col = resolveColumn(headers, COLUMN_ALIASES[key]);
    return String((col ? row[col] : '') ?? '').trim();
  };

  const ultimaActualizacion = normalizeDate(pick('ultimaActualizacion'));
  const region = normalizeRegion(pick('region'));

  return {
    'Nombre de equipo': pick('nombreEquipo'),
    'Tipo': pick('tipo'),
    'Modelo': pick('modelo'),
    'Número de serie': pick('numeroSerie'),
    'Dirección IP': normalizeIP(pick('direccionIP')),
    'Dirección MAC': pick('direccionMAC'),
    'Región': region,
    'Fiscalía': pick('fiscalia'),
    'Nombre de SO': pick('nombreSO'),
    'Versión de SO': pick('versionSO'),
    'Revisión de SO': pick('revisionSO'),
    'Usuario': pick('usuario'),
    'Cuenta NT': pick('cuentaNT'),
    'Agente Sophos': pick('agenteSophos'),
    'Agente Ivanti': pick('agenteIvanti'),
    'Fecha de creación del registro': normalizeDate(pick('fechaCreacion')),
    'Fecha de la última sincronización de políticas': normalizeDate(pick('fechaSyncPoliticas')),
    'Última actualización por el servidor de inventario': ultimaActualizacion,
    Estatus: pick('estatus') || 'Desconocido',
    _anioReporte: toYearFromDateString(ultimaActualizacion)
  };
};

const main = () => {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No se encontró el Excel en: ${EXCEL_PATH}`);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawData.length) throw new Error('El archivo Excel está vacío.');

  const headers = Object.keys(rawData[0] || {});
  const equipos = rawData.map((row) => mapRawRowToEquipo(row, headers));

  fs.mkdirSync(OUT_REGIONES, { recursive: true });

  fs.writeFileSync(
    OUT_GENERAL,
    JSON.stringify({ generatedAt: new Date().toISOString(), equipos }, null, 2),
    'utf-8'
  );

  const byRegion = new Map();
  for (const equipo of equipos) {
    const region = normalizeRegion(equipo['Región']);
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(equipo);
  }

  for (const region of REGIONES_OFICIALES) {
    const slug = slugifyRegion(region);
    const items = byRegion.get(region) || [];
    const outFile = path.join(OUT_REGIONES, `${slug}.json`);
    fs.writeFileSync(
      outFile,
      JSON.stringify({ generatedAt: new Date().toISOString(), region, slug, equipos: items }, null, 2),
      'utf-8'
    );
  }

  for (const [region, items] of byRegion.entries()) {
    if (REGIONES_OFICIALES.includes(region)) continue;
    const slug = slugifyRegion(region);
    const outFile = path.join(OUT_REGIONES, `${slug}.json`);
    fs.writeFileSync(
      outFile,
      JSON.stringify({ generatedAt: new Date().toISOString(), region, slug, equipos: items }, null, 2),
      'utf-8'
    );
  }

  console.log(`OK: generado general (${equipos.length} equipos) y ${byRegion.size} regiones en public/data`);
};

main();
