// Tipos para el inventario de equipos Ivanti

export interface RawExcelRow {
  [key: string]: unknown;
}

export interface Equipo {
  'Nombre de equipo': string;
  'Tipo': string;
  'Modelo': string;
  'Número de serie': string;
  'Dirección IP': string;
  'Dirección MAC': string;
  'Región': string;
  'Fiscalía': string;
  'Nombre de SO': string;
  'Versión de SO': string;
  'Revisión de SO': string;
  'Usuario': string;
  'Cuenta NT': string;
  'Agente Sophos': string;
  'Agente Ivanti': string;
  'Fecha de creación del registro': string;
  'Fecha de la última sincronización de políticas': string;
  'Última actualización por el servidor de inventario': string;
  'Estatus': string;
  noAtender?: boolean;
  _anioReporte: string;
}

export interface EquipoConError {
  equipo: string;
  serie: string;
  mac: string;
  motivo: string;
}

export interface EquipoNoReportado {
  nombreEquipo: string;
  serie: string;
  ip: string;
  region: string;
  usuario: string;
  cuentaNT: string;
  ultimaConexion: string;
}

export interface KPIs {
  totalEquipos: number;
  equiposReportados: number;
  equiposNoReportados: number;
  porcentajeCoberturaIvanti: number;
  porcentajeCoberturaSophos: number;
  equiposConNombreIncorrecto: number;
  fechaGeneracion: string;
}

export interface Filtros {
  region: string;
  anio: string;
  estadoIvanti: string;
  estadoSophos: string;
  usuario: string;
}

export interface DataProcessed {
  equipos: Equipo[];
  equiposConError: EquipoConError[];
  equiposNoReportados: EquipoNoReportado[];
  kpis: KPIs;
  porRegion: { name: string; value: number }[];
  porEstado: { name: string; value: number }[];
  porAnio: { name: string; value: number }[];
  noReportadosPorAnio: { name: string; value: number }[];
  porSophos: { name: string; value: number }[];
  porIvanti: { name: string; value: number }[];
  porTipo: { name: string; value: number }[];
  topRegiones: { name: string; value: number }[];
}
