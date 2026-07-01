export const REGIONES_OFICIALES: string[] = [
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

export const slugifyRegion = (value: string): string =>
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
