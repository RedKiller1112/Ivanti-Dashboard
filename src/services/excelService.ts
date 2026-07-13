import * as XLSX from 'xlsx';
import type { Equipo, EquipoConError, EquipoNoReportado, KPIs, DataProcessed, RawExcelRow } from '../types';

/**
 * Servicio para procesar archivos Excel del inventario Ivanti
 */

// Validar que el nombre del archivo contenga "Equipos en Ivanti"
export const validarNombreArchivo = (nombreArchivo: string): boolean => {
  const normalized = nombreArchivo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(xlsx|xls)$/i, '')
    .trim();

  const hasEquipos = normalized.includes('equipos');
  const hasIvanti = normalized.includes('ivanti');

  return hasEquipos && hasIvanti;
};

// Helpers de normalización
const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const excelSerialToDate = (serial: number): Date => {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
};

const normalizeDate = (value: unknown): string => {
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

const normalizeRegion = (value: unknown): string => {
  const region = String(value ?? '').trim();
  return region ? region : 'Sin Región';
};

const toYearFromDateString = (dateString: string): string => {
  if (!dateString) return 'Sin año';
  const parts = dateString.split('/');
  if (parts.length === 3 && /^\d{4}$/.test(parts[2])) return parts[2];
  return 'Sin año';
};

const normalizeIP = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (raw.includes('.')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  const partLength = Math.ceil(digits.length / 4);
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    const start = i * partLength;
    if (start >= digits.length) break;
    const end = Math.min(start + partLength, digits.length);
    parts.push(digits.slice(start, end).padStart(3, '0'));
  }

  if (parts.length === 4) {
    return parts.join('.');
  }

  return raw;
};

const FALLBACK_NO_ATENDER_SERIES = new Set([
  'mj0lb5xt','mj0lb5xv','mj0kq9ww','mj0lb5xs','mj0jmp84','mj0jmp4y','mj0lathw','mj0lb5xw',
  'mj0jmyez','mj0lb5xk','mj0jmqg7','mj0jmqcd','mj0jmp1w','mj0jn449','mj0jm0ef','mj0lb5xy',
  'mj0jm03y','mj0jmprj','mj0jltcm','mj0lb5xq','mj0jmp1b','mj0jmpln','mj0jmp4x','mj0jm035',
  'mj0jlzgd','mj0jmplf','mj0jlzw5','mj0jlvwy','mj0kq9wp','mj0jmqjt','mj0jmp8p','mj0lb5xr',
  'mj0kq9ws','mj0lal5x','mj0lb5y3','mj0jlzzw','mj0lb5y4','mj0lb5y2','mj0laths','mj0lb5xp',
  'mj0jlt7h','mj0kq9vd','mj0jm088','mj0jmp8g','mj0lcwya','mj0lb5xz','mj0lb5xl','mj0lal5y',
  'mj0jmcs3','mj0jmqg3','mj0jm0cl','mj0jmqen','mj0jmp09','mj0kq9vq','mj0kq9wd','mj0lb5xm',
  'mj0jmpps','mj0jlvrh','mj0jmp1g','mj0jlt81','mj0jmp1n','mj0jmqgr'
].map((s) => s.replace(/\s+/g, '').toLowerCase()));

const COLUMN_ALIASES: Record<string, string[]> = {
  nombreEquipo: ['nombre de equipo', 'equipo', 'nombre equipo', 'hostname', 'device name'],
  tipo: ['tipo', 'tipo de equipo', 'category'],
  modelo: ['modelo', 'model'],
  numeroSerie: ['número de serie', 'numero de serie', 'serial', 'serial number'],
  direccionIP: ['dirección ip', 'direccion ip', 'ip', 'ip address'],
  direccionMAC: ['dirección mac', 'direccion mac', 'mac', 'mac address'],
  region: ['región', 'region', 'zona'],
  fiscalia: ['fiscalía', 'fiscalia', 'fiscalia/unidad', 'unidad'],
  nombreSO: ['nombre de so', 'sistema operativo', 'so', 'os name'],
  versionSO: ['versión de so', 'version de so', 'version so', 'os version'],
  revisionSO: ['revisión de so', 'revision de so', 'build so', 'os build'],
  usuario: ['usuario', 'user', 'usuario actual', 'last logged on user'],
  cuentaNT: ['cuenta nt', 'cuenta', 'nt account', 'account'],
  agenteSophos: ['agente sophos', 'sophos', 'sophos agent'],
  agenteIvanti: ['agente ivanti', 'ivanti', 'ivanti agent'],
  fechaCreacion: ['fecha de creación del registro', 'fecha de creacion del registro', 'fecha creacion'],
  fechaSyncPoliticas: ['fecha de la última sincronización de políticas', 'fecha de la ultima sincronizacion de politicas', 'ultima sincronizacion politicas'],
  ultimaActualizacion: [
    'última actualización por el servidor de inventario',
    'ultima actualizacion por el servidor de inventario',
    'último reporte',
    'ultimo reporte',
    'ultima conexion',
    'last seen',
    'last report'
  ],
  estatus: ['estatus', 'estado del equipo', 'estado', 'status'],
  atencion: ['atención', 'atencion', 'atender', 'estado atencion', 'accion atencion']
};

const resolveColumn = (headers: string[], aliases: string[]): string | undefined => {
  const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalizeText(h) }));
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const found = normalizedHeaders.find(h => h.normalized === normalizedAlias);
    if (found) return found.original;
  }
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const found = normalizedHeaders.find(h => h.normalized.includes(normalizedAlias));
    if (found) return found.original;
  }
  return undefined;
};

const isRedLikeColor = (rgb: string): boolean => {
  const hex = rgb.replace(/^FF/i, '').toUpperCase();
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r >= 160 && g <= 120 && b <= 120;
};

const getStyleColorHex = (
  cell: (XLSX.CellObject & { s?: { fgColor?: { rgb?: string }; bgColor?: { rgb?: string }; fill?: { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } } } }) | undefined
): string[] => {
  const colors: string[] = [];
  const candidates = [
    cell?.s?.fgColor?.rgb,
    cell?.s?.bgColor?.rgb,
    cell?.s?.fill?.fgColor?.rgb,
    cell?.s?.fill?.bgColor?.rgb
  ];
  candidates.forEach((c) => {
    if (c && typeof c === 'string') colors.push(c);
  });
  return colors;
};

const getRowNoAtenderFromStyle = (worksheet: XLSX.WorkSheet, rowNumber: number, headers: string[]): boolean => {
  const cellsToInspect: string[] = [];
  const maxCols = Math.max(headers.length || 0, 40);
  for (let c = 0; c < maxCols; c++) {
    cellsToInspect.push(XLSX.utils.encode_cell({ r: rowNumber, c }));
  }

  return cellsToInspect.some((ref) => {
    const cell = worksheet[ref] as (XLSX.CellObject & {
      s?: {
        fgColor?: { rgb?: string };
        bgColor?: { rgb?: string };
        fill?: { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } };
      };
    }) | undefined;
    const colors = getStyleColorHex(cell);
    return colors.some(isRedLikeColor);
  });
};

const getRowNoAtenderFromText = (row: RawExcelRow): boolean => {
  const values = Object.values(row).map((v) => normalizeText(v));
  return values.some((v) =>
    v.includes('no atender') ||
    v.includes('no-atender') ||
    v.includes('noatender') ||
    v.includes('no se atiende') ||
    v.includes('no se atienda') ||
    v.includes('no debe ser atendido') ||
    v.includes('no atender usuario') ||
    v === 'na' ||
    v === 'n/a'
  );
};

const isNoAtenderValue = (value: string): boolean => {
  const v = normalizeText(value);
  if (!v) return false;
  return (
    v.includes('no atender') ||
    v.includes('no-atender') ||
    v.includes('noatender') ||
    v.includes('no se atiende') ||
    v.includes('no se atienda') ||
    v.includes('no debe ser atendido')
  );
};


const mapRawRowToEquipo = (
  row: RawExcelRow,
  headers: string[],
  noAtender = false,
  forcedAtencionValue = ''
): Equipo => {
  const pick = (key: keyof typeof COLUMN_ALIASES): string => {
    const col = resolveColumn(headers, COLUMN_ALIASES[key]);
    return String((col ? row[col] : '') ?? '').trim();
  };

  const ultimaActualizacion = normalizeDate(pick('ultimaActualizacion'));
  const region = normalizeRegion(pick('region'));
  const atencionRaw = forcedAtencionValue || pick('atencion');
  const atencion = normalizeText(atencionRaw);
  const noAtenderByColumn =
    atencion.includes('no atender') ||
    atencion.includes('no-atender') ||
    atencion.includes('noatender') ||
    atencion.includes('no atender usuario') ||
    atencion === 'na' ||
    atencion === 'n/a';

  const serieNorm = normalizeText(pick('numeroSerie')).replace(/\s+/g, '');
  const noAtenderByFallbackList = FALLBACK_NO_ATENDER_SERIES.has(serieNorm);

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
    'Estatus': pick('estatus') || 'Desconocido',
    noAtender: noAtender || noAtenderByColumn || noAtenderByFallbackList,
    _anioReporte: toYearFromDateString(ultimaActualizacion)
  };
};

// Leer y parsear archivo Excel
export const leerArchivoExcel = (file: File): Promise<DataProcessed> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        let rawData = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, { defval: '' });

        if (rawData.length === 0) {
          reject(new Error('El archivo está vacío'));
          return;
        }

        let headers = Object.keys(rawData[0] || {});

        const hasKnownHeaders = Object.values(COLUMN_ALIASES)
          .flat()
          .some(alias => headers.some(h => normalizeText(h).includes(normalizeText(alias))));

        if (!hasKnownHeaders) {
          rawData = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, { defval: '', range: 1 });
          if (rawData.length > 0) {
            headers = Object.keys(rawData[0] || {});
          }
        }

        const atencionHeader = resolveColumn(headers, COLUMN_ALIASES.atencion || []);
        let lastAtencionValue = '';

        const normalizedData: Equipo[] = rawData.map((row, index) => {
          const rowOffset = hasKnownHeaders ? 1 : 2;
          const rowNumber = index + rowOffset;
          const byStyle = getRowNoAtenderFromStyle(worksheet, rowNumber, headers);
          const byText = getRowNoAtenderFromText(row);

          const currentAtencion = atencionHeader ? normalizeText(row[atencionHeader]) : '';
          if (currentAtencion) {
            lastAtencionValue = currentAtencion;
          }

          const inheritedAtencion = currentAtencion || lastAtencionValue;
          const byAtencionColumn = isNoAtenderValue(inheritedAtencion);

          const noAtender = byStyle || byText || byAtencionColumn;
          return mapRawRowToEquipo(row, headers, noAtender, inheritedAtencion);
        });

        const processedData = procesarDatos(normalizedData);
        resolve(processedData);
      } catch {
        reject(new Error('Error al procesar el archivo Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Validar nombre de equipo (RFxxxx + últimos 6 caracteres de MAC)
export const validarNombreEquipo = (nombreEquipo: string, mac: string): { valido: boolean; motivo: string } => {
  // El nombre debe comenzar con "RF"
  if (!nombreEquipo.toUpperCase().startsWith('RF')) {
    return { valido: false, motivo: 'El nombre no comienza con "RF"' };
  }
  
  // Obtener los últimos 6 caracteres del nombre (sin RF)
  const ultimos6DelNombre = nombreEquipo.slice(-6).toUpperCase();
  
  // Limpiar la MAC (quitar guiones, dos puntos, etc.)
  const macLimpia = mac.replace(/[:-]/g, '').toUpperCase();
  const ultimos6DeLaMac = macLimpia.slice(-6);
  
  // Comparar
  if (ultimos6DelNombre !== ultimos6DeLaMac) {
    return { 
      valido: false, 
      motivo: `Los últimos 6 caracteres del nombre (${ultimos6DelNombre}) no coinciden con los últimos 6 de la MAC (${ultimos6DeLaMac})` 
    };
  }
  
  return { valido: true, motivo: '' };
};

// Procesar todos los datos del Excel
export const procesarDatos = (equipos: Equipo[]): DataProcessed => {
  // 1. Validar nombres incorrectos
  const equiposConError: EquipoConError[] = [];
  const equiposNoReportados: EquipoNoReportado[] = [];
  
  // Contadores para KPIs
  let reportados = 0;
  let noReportados = 0;
  let conIvanti = 0;
  let conSophos = 0;
  
  // Arrays para gráficos
  const regionMap = new Map<string, number>();
  const anioMap = new Map<string, number>();
  const noReportadosPorAnioMap = new Map<string, number>();
  const sophosMap = new Map<string, number>();
  const ivantiMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  
  const normalizeEstado = (estado: string): string => normalizeText(estado);

  const isAgentOperativo = (estadoAgente: string): boolean => {
    const v = normalizeText(estadoAgente);
    if (!v) return false;

    // Regla de negocio:
    // Cobertura = equipos con agente instalado/operativo vs total.
    // Si existe cualquier valor no vacío distinto de estados explícitos de "no instalado/no operativo",
    // se considera instalado para el KPI.
    if (
      v.includes('no operativo') ||
      v.includes('no-operativo') ||
      v.includes('not installed') ||
      v.includes('sin agente') ||
      v.includes('desinstalado') ||
      v.includes('inactivo') ||
      v.includes('offline') ||
      v === 'no' ||
      v === 'n/a' ||
      v === 'na' ||
      v === 'no instalado'
    ) {
      return false;
    }

    return true;
  };

  equipos.forEach((equipo) => {
    // Validar nombre
    const validacion = validarNombreEquipo(equipo['Nombre de equipo'], equipo['Dirección MAC']);
    if (!validacion.valido) {
      equiposConError.push({
        equipo: equipo['Nombre de equipo'],
        serie: equipo['Número de serie'],
        mac: equipo['Dirección MAC'],
        motivo: validacion.motivo
      });
    }
    
    // Verificar estado conectado / no reportado (alineado con visual del gráfico)
    const estadoNormalizado = normalizeEstado(equipo['Estatus']);
    const esNoReportado = estadoNormalizado.includes('no reportado') || estadoNormalizado.includes('no-reportado');
    const esConectado =
      estadoNormalizado.includes('conectado') ||
      estadoNormalizado.includes('connect') ||
      (estadoNormalizado.includes('reportado') && !esNoReportado);

    if (esConectado) {
      reportados++;
    } else if (esNoReportado) {
      noReportados++;
      equiposNoReportados.push({
        nombreEquipo: equipo['Nombre de equipo'],
        serie: equipo['Número de serie'],
        ip: equipo['Dirección IP'],
        region: equipo['Región'],
        usuario: equipo['Usuario'],
        cuentaNT: equipo['Cuenta NT'],
        ultimaConexion: equipo['Última actualización por el servidor de inventario']
      });

      const anioNoReportado = equipo._anioReporte || 'Sin año';
      noReportadosPorAnioMap.set(
        anioNoReportado,
        (noReportadosPorAnioMap.get(anioNoReportado) || 0) + 1
      );
    }
    
    // Verificar agente Ivanti/Sophos operativos
    const ivantiOperativo = isAgentOperativo(equipo['Agente Ivanti']);
    const sophosOperativo = isAgentOperativo(equipo['Agente Sophos']);

    if (ivantiOperativo) conIvanti++;
    if (sophosOperativo) conSophos++;
    
    // Agregar a región
    const region = equipo['Región'] || 'Sin Región';
    regionMap.set(region, (regionMap.get(region) || 0) + 1);
    
    // Agregar a año (de última actualización normalizada)
    const anio = equipo._anioReporte || 'Sin año';
    anioMap.set(anio, (anioMap.get(anio) || 0) + 1);
    
    // Agregar a Sophos (normalizado por operativo/no operativo)
    const sophos = sophosOperativo ? 'CON AGENTE' : 'NO OPERATIVO';
    sophosMap.set(sophos, (sophosMap.get(sophos) || 0) + 1);
    
    // Agregar a Ivanti (normalizado por operativo/no operativo)
    const ivanti = ivantiOperativo ? 'CON AGENTE' : 'NO OPERATIVO';
    ivantiMap.set(ivanti, (ivantiMap.get(ivanti) || 0) + 1);
    
    // Agregar a tipo
    const tipo = equipo['Tipo'] || 'Desconocido';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  
  // Calcular KPIs
  const kpis: KPIs = {
    totalEquipos: equipos.length,
    equiposReportados: reportados,
    equiposNoReportados: noReportados,
    porcentajeCoberturaIvanti: equipos.length > 0 ? Math.floor((conIvanti / equipos.length) * 100) : 0,
    porcentajeCoberturaSophos: equipos.length > 0 ? Math.floor((conSophos / equipos.length) * 100) : 0,
    equiposConNombreIncorrecto: equiposConError.length,
    fechaGeneracion: new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  };
  
  // Convertir mapas a arrays ordenados
  const porRegion = Array.from(regionMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const porAnio = Array.from(anioMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const noReportadosPorAnio = Array.from(noReportadosPorAnioMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const porSophos = Array.from(sophosMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const porIvanti = Array.from(ivantiMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const porTipo = Array.from(tipoMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  // Estado reportado normalizado (alineado con KPI de reportados/no reportados)
  const porEstado = [
    { name: 'Reportado', value: reportados },
    { name: 'No Reportado', value: noReportados }
  ];
  
  // Top 10 regiones
  const topRegiones = porRegion.slice(0, 10);
  
  return {
    equipos,
    equiposConError,
    equiposNoReportados,
    kpis,
    porRegion,
    porEstado,
    porAnio,
    noReportadosPorAnio,
    porSophos,
    porIvanti,
    porTipo,
    topRegiones
  };
};

// Exportar datos a Excel
export const exportarAExcel = (data: DataProcessed): void => {
  const workbook = XLSX.utils.book_new();
  
  // Hoja 1: Resumen de KPIs
  const kpisData = [
    ['Dashboard Ivanti - Resumen de KPIs'],
    [''],
    ['Total de Equipos', data.kpis.totalEquipos],
    ['Equipos Reportados', data.kpis.equiposReportados],
    ['Equipos No Reportados', data.kpis.equiposNoReportados],
    ['% Cobertura Ivanti', data.kpis.porcentajeCoberturaIvanti + '%'],
    ['% Cobertura Sophos', data.kpis.porcentajeCoberturaSophos + '%'],
    ['Equipos con Nombre Incorrecto', data.kpis.equiposConNombreIncorrecto],
    ['Fecha de Generación', data.kpis.fechaGeneracion]
  ];
  const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'Resumen KPIs');
  
  // Hoja 2: Equipos No Reportados
  if (data.equiposNoReportados.length > 0) {
    const noReportadosData = data.equiposNoReportados.map(e => [
      e.nombreEquipo,
      e.serie,
      e.ip,
      e.region,
      e.usuario,
      e.cuentaNT,
      e.ultimaConexion
    ]);
    noReportadosData.unshift(['Nombre Equipo', 'Serie', 'IP', 'Región', 'Usuario', 'Cuenta NT', 'Última Conexión']);
    const noReportadosSheet = XLSX.utils.aoa_to_sheet(noReportadosData);
    XLSX.utils.book_append_sheet(workbook, noReportadosSheet, 'No Reportados');
  }
  
  // Hoja 3: Equipos con Error
  if (data.equiposConError.length > 0) {
    const erroresData = data.equiposConError.map(e => [
      e.equipo,
      e.serie,
      e.mac,
      e.motivo
    ]);
    erroresData.unshift(['Equipo', 'Serie', 'MAC', 'Motivo del Error']);
    const erroresSheet = XLSX.utils.aoa_to_sheet(erroresData);
    XLSX.utils.book_append_sheet(workbook, erroresSheet, 'Nombres Incorrectos');
  }
  
  // Hoja 4: Detalle General
  if (data.equipos.length > 0) {
    const detalleData = data.equipos.map(e => [
      e['Nombre de equipo'],
      e['Número de serie'],
      e['Tipo'],
      e['Región'],
      e['Usuario'],
      e['Cuenta NT'],
      e['Estatus'],
      e['Agente Ivanti'],
      e['Agente Sophos']
    ]);
    detalleData.unshift(['Nombre', 'Serie', 'Tipo', 'Región', 'Usuario', 'Cuenta NT', 'Estado', 'Agente Ivanti', 'Agente Sophos']);
    const detalleSheet = XLSX.utils.aoa_to_sheet(detalleData);
    XLSX.utils.book_append_sheet(workbook, detalleSheet, 'Detalle General');
  }
  
  // Generar archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Dashboard_Ivanti_${fecha}.xlsx`);
};
