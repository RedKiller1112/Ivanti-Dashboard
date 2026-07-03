import {
  Menu,
  X,
  LayoutDashboard,
  FileSpreadsheet,
  Download,
  Moon,
  Sun,
  Filter
} from 'lucide-react';
import type { DataProcessed, Filtros } from '../types';
import type { AppRole } from '../types/auth';

interface SidebarProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  data: DataProcessed | null;
  isRegionalReadOnly?: boolean;
  userEmail?: string;
  userRole?: AppRole;
  onLogout?: () => Promise<void> | void;
  canExport?: boolean;
}

export const Sidebar = ({
  darkMode,
  onDarkModeChange,
  sidebarOpen,
  onSidebarOpenChange,
  onExportPDF,
  onExportExcel,
  filtros,
  onFiltrosChange,
  data,
  isRegionalReadOnly = false,
  onLogout,
  canExport = true
}: SidebarProps) => {
  const regiones = data
    ? [...new Set(data.equipos.map(e => e['Región']).filter(Boolean))].sort()
    : [];
  const anios = data
    ? [...new Set(data.equipos.map(e => e._anioReporte).filter(Boolean))].sort()
    : [];
  const estadosIvanti = data
    ? [...new Set(data.equipos.map(e => e['Agente Ivanti']).filter(Boolean))].sort()
    : [];
  const estadosSophos = data
    ? [...new Set(data.equipos.map(e => e['Agente Sophos']).filter(Boolean))].sort()
    : [];
  const usuarios = data
    ? [...new Set(data.equipos.map(e => e['Usuario']).filter(Boolean))].sort()
    : [];

  const handleFilterChange = (key: keyof Filtros, value: string) => {
    onFiltrosChange({
      ...filtros,
      [key]: value
    });
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      region: '',
      anio: '',
      estadoIvanti: '',
      estadoSophos: '',
      usuario: ''
    });
  };
  return (
    <>
      {/* Botón para móviles */}
      <button 
        className="sidebar-toggle mobile-only"
        onClick={() => onSidebarOpenChange(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <LayoutDashboard size={28} />
            <span>Dashboard Ivanti</span>
          </div>
          <button 
            className="sidebar-close desktop-only"
            onClick={() => onSidebarOpenChange(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {data && (
            <div className="nav-section">
              <span className="nav-section-title">
                <Filter size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Filtros
              </span>

              <div className="sidebar-filter-group">
                <label>Región</label>
                <select
                  value={filtros.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  disabled={isRegionalReadOnly}
                  title={isRegionalReadOnly ? 'Filtro bloqueado por enlace regional' : ''}
                >
                  <option value="">Todas las regiones</option>
                  {regiones.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar-filter-group">
                <label>Año</label>
                <select value={filtros.anio} onChange={(e) => handleFilterChange('anio', e.target.value)}>
                  <option value="">Todos los años</option>
                  {anios.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar-filter-group">
                <label>Estado Ivanti</label>
                <select value={filtros.estadoIvanti} onChange={(e) => handleFilterChange('estadoIvanti', e.target.value)}>
                  <option value="">Todos</option>
                  {estadosIvanti.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar-filter-group">
                <label>Estado Sophos</label>
                <select value={filtros.estadoSophos} onChange={(e) => handleFilterChange('estadoSophos', e.target.value)}>
                  <option value="">Todos</option>
                  {estadosSophos.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="sidebar-filter-group">
                <label>Usuario</label>
                <select value={filtros.usuario} onChange={(e) => handleFilterChange('usuario', e.target.value)}>
                  <option value="">Todos los usuarios</option>
                  {usuarios.slice(0, 200).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <button className="nav-item" onClick={limpiarFiltros}>
                <X size={18} />
                <span>Limpiar Filtros</span>
              </button>
            </div>
          )}

          <div className="nav-section">
            <span className="nav-section-title">Opciones</span>
            <button
              className={`nav-item ${!canExport ? 'disabled' : ''}`}
              onClick={onExportExcel}
              disabled={!canExport}
              title={!canExport ? 'Bloqueado para acceso regional' : 'Descargar Excel'}
            >
              <FileSpreadsheet size={20} />
              <span>Descargar Excel</span>
            </button>
            <button
              className={`nav-item ${!canExport ? 'disabled' : ''}`}
              onClick={onExportPDF}
              disabled={!canExport}
              title={!canExport ? 'Bloqueado para acceso regional' : 'Descargar PDF'}
            >
              <Download size={20} />
              <span>Descargar PDF</span>
            </button>
            {!canExport && (
              <p className="export-locked-text">Exportación bloqueada para accesos regionales</p>
            )}
            {onLogout && (
              <button className="nav-item" onClick={() => onLogout()}>
                <X size={18} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
          
          <div className="nav-section">
            <span className="nav-section-title">Apariencia</span>
            <button 
              className="nav-item" 
              onClick={() => onDarkModeChange(!darkMode)}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>

        </nav>
        
        <div className="sidebar-footer">
          <p>© 2024 Dashboard Ivanti · By Jordán Farías</p>
          <p>Versión 1.0.0</p>
        </div>
      </aside>
      
      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay mobile-only"
          onClick={() => onSidebarOpenChange(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
