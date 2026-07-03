import { Filter, X } from 'lucide-react';
import type { Filtros, DataProcessed } from '../types';

interface FiltersProps {
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  data: DataProcessed;
}

export const Filters = ({ filtros, onFiltrosChange, data }: FiltersProps) => {
  // Obtener valores únicos para cada filtro
  const regiones = [...new Set(data.equipos.map(e => e['Región'] as string).filter((x): x is string => !!x))].sort();
  const anios = [...new Set(data.equipos.map(e => e._anioReporte).filter((x): x is string => !!x))].sort();
  const estadosIvanti = [...new Set(data.porIvanti.map(i => i.name))].sort();
  const estadosSophos = [...new Set(data.porSophos.map(s => s.name))].sort();
  const usuarios = [...new Set(data.equipos.map(e => (e['Cuenta NT'] || e['Usuario']) as string).filter((x): x is string => !!x))].sort();
  
  const handleChange = (campo: keyof Filtros, valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
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
  
  const tieneFiltrosActivos = Object.values(filtros).some(v => v !== '');
  
  return (
    <div className="filters-container">
      <div className="filters-header">
        <div className="filters-title">
          <Filter size={18} />
          <span>Filtros</span>
        </div>
        {tieneFiltrosActivos && (
          <button className="clear-filters" onClick={limpiarFiltros}>
            <X size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>
      
      <div className="filters-body">
        <div className="filter-group">
          <label>Región</label>
          <select 
            value={filtros.region} 
            onChange={(e) => handleChange('region', e.target.value)}
          >
            <option value="">Todas las regiones</option>
            {regiones.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Año</label>
          <select 
            value={filtros.anio} 
            onChange={(e) => handleChange('anio', e.target.value)}
          >
            <option value="">Todos los años</option>
            {anios.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Estado Ivanti</label>
          <select 
            value={filtros.estadoIvanti} 
            onChange={(e) => handleChange('estadoIvanti', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {estadosIvanti.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Estado Sophos</label>
          <select 
            value={filtros.estadoSophos} 
            onChange={(e) => handleChange('estadoSophos', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {estadosSophos.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Cuenta NT</label>
          <select 
            value={filtros.usuario} 
            onChange={(e) => handleChange('usuario', e.target.value)}
          >
            <option value="">Todas las cuentas NT</option>
            {usuarios.slice(0, 100).map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;
