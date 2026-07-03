import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DataProcessed } from '../types';

interface TablesProps {
  data: DataProcessed;
}

type TableType = 'noReportados' | 'incorrectos' | 'general';

export const Tables = ({ data }: TablesProps) => {
  const [activeTable, setActiveTable] = useState<TableType>('noReportados');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'region' | 'usuario'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (column: 'nombre' | 'region' | 'usuario') => {
    if (sortBy === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const normalize = (value: string) => value.toLowerCase().trim();

  const filteredNoReportados = useMemo(() => {
    return data.equiposNoReportados
      .filter(item =>
        item.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.usuario.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'region') return normalize(a.region).localeCompare(normalize(b.region)) * dir;
        if (sortBy === 'usuario') return normalize(a.usuario).localeCompare(normalize(b.usuario)) * dir;
        return normalize(a.nombreEquipo).localeCompare(normalize(b.nombreEquipo)) * dir;
      });
  }, [data.equiposNoReportados, searchTerm, sortBy, sortDirection]);

  const filteredIncorrectos = useMemo(() => {
    return data.equiposConError.filter(item =>
      item.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mac.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.equiposConError, searchTerm]);

  const filteredGeneral = useMemo(() => {
    return data.equipos
      .filter(item =>
        item['Nombre de equipo'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item['Región'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item['Usuario'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item['Dirección IP'].toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'region') return normalize(a['Región']).localeCompare(normalize(b['Región'])) * dir;
        if (sortBy === 'usuario') return normalize(a['Usuario']).localeCompare(normalize(b['Usuario'])) * dir;
        return normalize(a['Nombre de equipo']).localeCompare(normalize(b['Nombre de equipo'])) * dir;
      })
      .slice(0, 100);
  }, [data.equipos, searchTerm, sortBy, sortDirection]);
  
  const renderNoReportadosTable = () => (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre Equipo</th>
            <th onClick={() => toggleSort('region')} style={{ cursor: 'pointer' }}>Región</th>
            <th onClick={() => toggleSort('usuario')} style={{ cursor: 'pointer' }}>Usuario</th>
            <th>Última Conexión</th>
          </tr>
        </thead>
        <tbody>
          {filteredNoReportados.length === 0 ? (
            <tr>
              <td colSpan={4} className="no-data">No hay equipos no reportados</td>
            </tr>
          ) : (
            filteredNoReportados.slice(0, 50).map((item, index) => (
              <tr key={index}>
                <td>{item.nombreEquipo}</td>
                <td>{item.region}</td>
                <td>{item.usuario}</td>
                <td>{item.ultimaConexion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredNoReportados.length > 50 && (
        <div className="table-footer">
          Mostrando 50 de {filteredNoReportados.length} registros
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
            <th>MAC</th>
            <th>Motivo del Error</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncorrectos.length === 0 ? (
            <tr>
              <td colSpan={3} className="no-data">No hay equipos con nombres incorrectos</td>
            </tr>
          ) : (
            filteredIncorrectos.slice(0, 50).map((item, index) => (
              <tr key={index}>
                <td>{item.equipo}</td>
                <td>{item.mac}</td>
                <td className="error-text">{item.motivo}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredIncorrectos.length > 50 && (
        <div className="table-footer">
          Mostrando 50 de {filteredIncorrectos.length} registros
        </div>
      )}
    </div>
  );
  
  const renderGeneralTable = () => (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre</th>
            <th>Tipo</th>
            <th onClick={() => toggleSort('region')} style={{ cursor: 'pointer' }}>Región</th>
            <th onClick={() => toggleSort('usuario')} style={{ cursor: 'pointer' }}>Usuario</th>
            <th>Estado</th>
            <th>Agente Ivanti</th>
            <th>Agente Sophos</th>
            <th>IP</th>
            <th>Último Reporte</th>
          </tr>
        </thead>
        <tbody>
          {filteredGeneral.map((item, index) => (
            <tr key={index}>
              <td>{item['Nombre de equipo']}</td>
              <td>{item['Tipo']}</td>
              <td>{item['Región']}</td>
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
              <td>{item['Dirección IP']}</td>
              <td>{item['Última actualización por el servidor de inventario']}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer">
        Mostrando 100 de {data.equipos.length} registros
      </div>
    </div>
  );
  
  return (
    <div className="tables-section">
      <div className="tables-header">
        <div className="tabs">
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
            className={`tab ${activeTable === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTable('general')}
          >
            Detalle General
          </button>
        </div>
        
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
