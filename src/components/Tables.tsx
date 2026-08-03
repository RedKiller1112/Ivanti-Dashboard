import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { DataProcessed } from '../types';

interface TablesProps {
  data: DataProcessed;
  isServicioMda?: boolean;
  activeTable?: TableType;
  onActiveTableChange?: (table: TableType) => void;
  quickFilterFromApp?: 'connected' | 'noOperativoSophos' | 'noOperativoIvanti' | null;
}

type TableType = 'noReportados' | 'incorrectos' | 'general';

const FALLBACK_NO_ATENDER_SERIES_UI = new Set([
  'mj0lb5xt','mj0lb5xv','mj0kq9ww','mj0lb5xs','mj0jmp84','mj0jmp4y','mj0lathw','mj0lb5xw',
  'mj0jmyez','mj0lb5xk','mj0jmqg7','mj0jmqcd','mj0jmp1w','mj0jn449','mj0jm0ef','mj0lb5xy',
  'mj0jm03y','mj0jmprj','mj0jltcm','mj0lb5xq','mj0jmp1b','mj0jmpln','mj0jmp4x','mj0jm035',
  'mj0jlzgd','mj0jmplf','mj0jlzw5','mj0jlvwy','mj0kq9wp','mj0jmqjt','mj0jmp8p','mj0lb5xr',
  'mj0kq9ws','mj0lal5x','mj0lb5y3','mj0jlzzw','mj0lb5y4','mj0lb5y2','mj0laths','mj0lb5xp',
  'mj0jlt7h','mj0kq9vd','mj0jm088','mj0jmp8g','mj0lcwya','mj0lb5xz','mj0lb5xl','mj0lal5y',
  'mj0jmcs3','mj0jmqg3','mj0jm0cl','mj0jmqen','mj0jmp09','mj0kq9vq','mj0kq9wd','mj0lb5xm',
  'mj0jmpps','mj0jlvrh','mj0jmp1g','mj0jlt81','mj0jmp1n','mj0jmqgr'
]);

export const Tables = ({ data, isServicioMda = false, activeTable: externalActiveTable, onActiveTableChange, quickFilterFromApp }: TablesProps) => {
  const [internalActiveTable, setInternalActiveTable] = useState<TableType>('noReportados');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'region' | 'usuario'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [quickFilter, setQuickFilter] = useState<'connected' | 'noOperativoSophos' | 'noOperativoIvanti' | null>(quickFilterFromApp ?? null);
  const activeTable = externalActiveTable ?? internalActiveTable;

  useEffect(() => {
    if (quickFilterFromApp !== undefined) {
      setQuickFilter(quickFilterFromApp);
    }
  }, [quickFilterFromApp]);

  const setActiveTable = (table: TableType) => {
    if (onActiveTableChange) {
      onActiveTableChange(table);
      return;
    }
    setInternalActiveTable(table);
  };

  const toggleSort = (column: 'nombre' | 'region' | 'usuario') => {
    if (sortBy === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const normalize = (value: string) => value.toLowerCase().trim();
  const normalizeForSearch = (value: string) => value.toLowerCase().replace(/\s+/g, '').trim();
  const normalizedSearchTerm = normalizeForSearch(searchTerm);

  const filteredNoReportados = useMemo(() => {
    return data.equiposNoReportados
      .filter(item =>
        normalizeForSearch(item.nombreEquipo).includes(normalizedSearchTerm) ||
        normalizeForSearch(item.serie).includes(normalizedSearchTerm) ||
        normalizeForSearch(item.ip).includes(normalizedSearchTerm) ||
        normalizeForSearch(item.region).includes(normalizedSearchTerm) ||
        normalizeForSearch(item.usuario).includes(normalizedSearchTerm) ||
        normalizeForSearch(item.cuentaNT).includes(normalizedSearchTerm)
      )
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'region') return normalize(a.region).localeCompare(normalize(b.region)) * dir;
        if (sortBy === 'usuario') return normalize(a.cuentaNT).localeCompare(normalize(b.cuentaNT)) * dir;
        return normalize(a.nombreEquipo).localeCompare(normalize(b.nombreEquipo)) * dir;
      });
  }, [data.equiposNoReportados, searchTerm, sortBy, sortDirection]);

  const filteredIncorrectos = useMemo(() => {
    return data.equiposConError.filter(item =>
      normalizeForSearch(item.equipo).includes(normalizedSearchTerm) ||
      normalizeForSearch(item.serie).includes(normalizedSearchTerm) ||
      normalizeForSearch(item.mac).includes(normalizedSearchTerm)
    );
  }, [data.equiposConError, searchTerm]);

  const filteredGeneral = useMemo(() => {
    return data.equipos
      .filter(item =>
        normalizeForSearch(item['Nombre de equipo']).includes(normalizedSearchTerm) ||
        normalizeForSearch(item['Número de serie']).includes(normalizedSearchTerm) ||
        normalizeForSearch(item['Cuenta NT']).includes(normalizedSearchTerm) ||
        normalizeForSearch(item['Usuario']).includes(normalizedSearchTerm) ||
        normalizeForSearch(item['Dirección IP']).includes(normalizedSearchTerm) ||
        normalizeForSearch(item['Última actualización por el servidor de inventario']).includes(normalizedSearchTerm)
      )
      .filter((item) => {
        if (quickFilter === 'connected') {
          const status = String(item['Estatus'] || '');
          return /reportado|conectado/i.test(status) && !/no\s*reportado/i.test(status);
        }
        if (quickFilter === 'noOperativoSophos') {
          return /no\s*operativo/i.test(item['Agente Sophos'] || '');
        }
        if (quickFilter === 'noOperativoIvanti') {
          return /no\s*operativo/i.test(item['Agente Ivanti'] || '');
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'region') return normalize(a['Región']).localeCompare(normalize(b['Región'])) * dir;
        if (sortBy === 'usuario') return normalize(a['Cuenta NT']).localeCompare(normalize(b['Cuenta NT'])) * dir;
        return normalize(a['Nombre de equipo']).localeCompare(normalize(b['Nombre de equipo'])) * dir;
      });
  }, [data.equipos, searchTerm, sortBy, sortDirection, quickFilter]);

  const hasNoAtenderMatch = useMemo(() => {
    if (!isServicioMda) return false;
    if (!searchTerm.trim()) return false;

    const normalizedSearch = normalizeForSearch(searchTerm);

    return data.equipos.some((item) => {
      const matchSearch =
        normalizeForSearch(item['Nombre de equipo']).includes(normalizedSearch) ||
        normalizeForSearch(item['Número de serie']).includes(normalizedSearch) ||
        normalizeForSearch(item['Cuenta NT']).includes(normalizedSearch) ||
        normalizeForSearch(item['Usuario']).includes(normalizedSearch) ||
        normalizeForSearch(item['Dirección IP']).includes(normalizedSearch) ||
        normalizeForSearch(item['Última actualización por el servidor de inventario']).includes(normalizedSearch);

      const serieNorm = item['Número de serie'].toLowerCase().replace(/\s+/g, '');
      const noAtenderByUiFallback = FALLBACK_NO_ATENDER_SERIES_UI.has(serieNorm);

      return matchSearch && (Boolean(item.noAtender) || noAtenderByUiFallback);
    });
  }, [data.equipos, isServicioMda, searchTerm]);

  const connectedCount = useMemo(() => {
    return data.equipos.filter((item) => {
      const status = String(item['Estatus'] || '');
      return /reportado|conectado/i.test(status) && !/no\s*reportado/i.test(status);
    }).length;
  }, [data.equipos]);

  const noOperativoSophosCount = useMemo(() => {
    return data.equipos.filter((item) => /no\s*operativo/i.test(item['Agente Sophos'] || '')).length;
  }, [data.equipos]);

  const noOperativoIvantiCount = useMemo(() => {
    return data.equipos.filter((item) => /no\s*operativo/i.test(item['Agente Ivanti'] || '')).length;
  }, [data.equipos]);
  
  const renderNoReportadosTable = () => (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre Equipo</th>
            <th onClick={() => toggleSort('region')} style={{ cursor: 'pointer' }}>Región</th>
            <th>Serie</th>
            <th>IP</th>
            <th onClick={() => toggleSort('usuario')} style={{ cursor: 'pointer' }}>Cuenta NT</th>
            <th>Usuario</th>
            <th>Última Conexión</th>
          </tr>
        </thead>
        <tbody>
          {filteredNoReportados.length === 0 ? (
            <tr>
              <td colSpan={7} className="no-data">No hay equipos no reportados</td>
            </tr>
          ) : (
            filteredNoReportados.map((item, index) => (
              <tr key={index}>
                <td>{item.nombreEquipo}</td>
                <td>{item.region}</td>
                <td>{item.serie}</td>
                <td>{item.ip}</td>
                <td>{item.cuentaNT}</td>
                <td>{item.usuario}</td>
                <td>{item.ultimaConexion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredNoReportados.length > 0 && (
        <div className="table-footer">
          Mostrando {filteredNoReportados.length} registros
        </div>
      )}
    </div>
  );
  
  const renderIncorrectosTable = () => (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Serie</th>
            <th>MAC</th>
            <th>Motivo del Error</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncorrectos.length === 0 ? (
            <tr>
              <td colSpan={4} className="no-data">No hay equipos con nombres incorrectos</td>
            </tr>
          ) : (
            filteredIncorrectos.map((item, index) => (
              <tr key={index}>
                <td>{item.equipo}</td>
                <td>{item.serie}</td>
                <td>{item.mac}</td>
                <td className="error-text">{item.motivo}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredIncorrectos.length > 0 && (
        <div className="table-footer">
          Mostrando {filteredIncorrectos.length} registros
        </div>
      )}
    </div>
  );
  
  const renderGeneralTable = () => (
    <div className="table-wrapper">
      {isServicioMda && (
        <div
          className={hasNoAtenderMatch ? 'upload-error' : 'upload-success'}
          style={{ margin: '0 0 12px 0' }}
        >
          <span style={{ fontWeight: 700 }}>
            {hasNoAtenderMatch
              ? 'USUARIO NO DEBE SER ATENDIDO, por favor consultar su estado.'
              : 'sin alerta de no atender para los resultados actuales'}
          </span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre</th>
            <th>Serie</th>
            <th>IP</th>
            <th onClick={() => toggleSort('region')} style={{ cursor: 'pointer' }}>Región</th>
            <th>Fiscalía</th>
            <th onClick={() => toggleSort('usuario')} style={{ cursor: 'pointer' }}>Cuenta NT</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Agente Ivanti</th>
            <th>Agente Sophos</th>
            <th>Último Reporte</th>
          </tr>
        </thead>
        <tbody>
          {(isServicioMda ? filteredGeneral : filteredGeneral.slice(0, 100)).map((item, index) => (
            <tr key={index}>
              <td>{item['Nombre de equipo']}</td>
              <td>{item['Número de serie']}</td>
              <td>{item['Dirección IP']}</td>
              <td>{item['Región']}</td>
              <td>{item['Fiscalía']}</td>
              <td>{item['Cuenta NT']}</td>
              <td>{item['Usuario']}</td>
              <td>
                <span
                  className={`status-badge ${
                    /no\s*reportado/i.test(item['Estatus'])
                      ? 'not-reported'
                      : /reportado|conectado/i.test(item['Estatus'])
                        ? 'reported'
                        : 'not-reported'
                  }`}
                >
                  {item['Estatus']}
                </span>
              </td>
              <td>{item['Agente Ivanti']}</td>
              <td>{item['Agente Sophos']}</td>
              <td>{item['Última actualización por el servidor de inventario']}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isServicioMda && (
        <div className="table-footer">
          Mostrando 100 de {data.equipos.length} registros
        </div>
      )}
    </div>
  );
  
  return (
    <div className="tables-section">
      <div className="tables-header">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${quickFilter === 'connected' ? 'active' : ''}`}
            onClick={() => {
              setQuickFilter('connected');
              setActiveTable('general');
            }}
          >
            Equipos Conectados ({connectedCount.toLocaleString('es-CL')})
          </button>
          <button 
            className={`tab ${activeTable === 'noReportados' ? 'active' : ''}`}
            onClick={() => setActiveTable('noReportados')}
          >
            Equipos No Reportados ({data.equiposNoReportados.length})
          </button>
          <button 
            className={`tab ${activeTable === 'incorrectos' ? 'active' : ''}`}
            onClick={() => setActiveTable('incorrectos')}
          >
            Nombres Incorrectos ({data.equiposConError.length})
          </button>
          <button
            type="button"
            className={`tab ${quickFilter === 'noOperativoSophos' ? 'active' : ''}`}
            onClick={() => {
              setQuickFilter('noOperativoSophos');
              setActiveTable('general');
            }}
          >
            No Operativo Sophos ({noOperativoSophosCount.toLocaleString('es-CL')})
          </button>
          <button
            type="button"
            className={`tab ${quickFilter === 'noOperativoIvanti' ? 'active' : ''}`}
            onClick={() => {
              setQuickFilter('noOperativoIvanti');
              setActiveTable('general');
            }}
          >
            No Operativo Ivanti ({noOperativoIvantiCount.toLocaleString('es-CL')})
          </button>
          <button 
            className={`tab ${activeTable === 'general' && !quickFilter ? 'active' : ''}`}
            onClick={() => {
              setQuickFilter(null);
              setActiveTable('general');
            }}
          >
            Total de Equipos
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={isServicioMda ? 'Buscar usuario/equipo, serie o IP...' : 'Buscar...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
          </div>
        </div>
      </div>
      
      <div className="tables-content">
        {activeTable === 'noReportados' && renderNoReportadosTable()}
        {activeTable === 'incorrectos' && renderIncorrectosTable()}
        {activeTable === 'general' && renderGeneralTable()}
      </div>
    </div>
  );
};

export default Tables;
