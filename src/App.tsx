import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, KPICards, Charts, Tables, Sidebar } from './components';
import { exportarAExcel, exportarAPDF, procesarDatos } from './services';
import { slugifyRegion } from './constants/regions';
import type { DataProcessed, Filtros, Equipo } from './types';

function App() {
  const [data, setData] = useState<DataProcessed | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    region: '',
    anio: '',
    estadoIvanti: '',
    estadoSophos: '',
    usuario: ''
  });

  const regionFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const region = (params.get('region') || '').trim();
    return region;
  }, []);

  const isRegionalReadOnly = regionFromUrl.length > 0;
  
  const [loadingPublishedData, setLoadingPublishedData] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const buildFromEquipos = (equipos: Equipo[]): DataProcessed => {
    return procesarDatos(equipos);
  };

  const handleDataLoaded = (loadedData: DataProcessed) => {
    setData(loadedData);
    if (isRegionalReadOnly && regionFromUrl) {
      setFiltros((prev) => ({ ...prev, region: regionFromUrl }));
    }
  };
  
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    
    try {
      await exportarAPDF('dashboard-content');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar PDF');
    }
  };
  
  const handleExportExcel = () => {
    if (!data) return;
    
    try {
      exportarAExcel(data);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar Excel');
    }
  };
  
  useEffect(() => {
    if (!regionFromUrl) return;
    setFiltros((prev) => ({
      ...prev,
      region: regionFromUrl
    }));
  }, [regionFromUrl]);

  useEffect(() => {
    const loadPublishedData = async () => {
      try {
        setLoadingPublishedData(true);

        if (isRegionalReadOnly) {
          const regionSlug = slugifyRegion(regionFromUrl);
          const response = await fetch(`/data/regiones/${regionSlug}.json`, { cache: 'no-store' });

          if (response.ok) {
            const payload = await response.json();
            const equipos = Array.isArray(payload?.equipos) ? payload.equipos : [];
            if (equipos.length > 0) {
              const processed = buildFromEquipos(equipos);
              setData(processed);
              setFiltros((prev) => ({ ...prev, region: regionFromUrl }));
              return;
            }
          }
        }

        const generalResponse = await fetch('/data/general.json', { cache: 'no-store' });
        if (generalResponse.ok) {
          const payload = await generalResponse.json();
          const equipos = Array.isArray(payload?.equipos) ? payload.equipos : [];
          if (equipos.length > 0) {
            const processed = buildFromEquipos(equipos);
            setData(processed);
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar dataset publicado, se mantiene carga manual por Excel.', error);
      } finally {
        setLoadingPublishedData(false);
      }
    };

    loadPublishedData();
  }, [isRegionalReadOnly, regionFromUrl]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const equiposFiltrados = data.equipos.filter((e) => {
      if (filtros.region && e['Región'] !== filtros.region) return false;
      if (filtros.anio && e._anioReporte !== filtros.anio) return false;
      if (filtros.usuario && e['Usuario'] !== filtros.usuario) return false;
      if (filtros.estadoIvanti && e['Agente Ivanti'] !== filtros.estadoIvanti) return false;
      if (filtros.estadoSophos && e['Agente Sophos'] !== filtros.estadoSophos) return false;
      return true;
    });

    return procesarDatos(equiposFiltrados);
  }, [data, filtros]);
  
  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar 
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        data={data}
        isRegionalReadOnly={isRegionalReadOnly}
      />
      
      <main className="main-content">
        {loadingPublishedData ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Dashboard Ivanti</h1>
              <p>Cargando información publicada...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Dashboard Ivanti</h1>
              <p>Sube un archivo Excel para generar tu dashboard ejecutivo</p>
              <Upload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        ) : (
          <div className="dashboard" id="dashboard-content" ref={dashboardRef}>
            <div className="dashboard-header">
              <div>
                <h1>Dashboard Ejecutivo - Inventario Ivanti</h1>
                <p>Fecha de generación: {data.kpis.fechaGeneracion}</p>
              </div>
            </div>
            
            <KPICards kpis={(filteredData || data).kpis} />

            <Charts data={filteredData || data} />

            <Tables data={filteredData || data} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
