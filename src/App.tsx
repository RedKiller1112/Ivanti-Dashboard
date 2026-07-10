import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, KPICards, Charts, Tables, Sidebar, Login } from './components';
import { exportarAExcel, exportarAPDF, procesarDatos } from './services';
import { slugifyRegion } from './constants/regions';
import {
  signOut,
  getCurrentSession,
  onAuthStateChange,
  getMyProfile,
  signInWithRegionPassword,
  getAccessSession
} from './services/authService';
import type { DataProcessed, Filtros, Equipo } from './types';
import type { AppAccessSession, UserProfile } from './types/auth';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessSession, setAccessSession] = useState<AppAccessSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
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

        if (accessSession?.scope !== 'general_admin') {
          const generalResponse = await fetch('/data/general.json', { cache: 'no-store' });
          if (generalResponse.ok) {
            const payload = await generalResponse.json();
            const equipos = Array.isArray(payload?.equipos) ? payload.equipos : [];
            if (equipos.length > 0) {
              const processed = buildFromEquipos(equipos);
              setData(processed);
            }
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar dataset publicado, se mantiene carga manual por Excel.', error);
      } finally {
        setLoadingPublishedData(false);
      }
    };

    loadPublishedData();
  }, [isRegionalReadOnly, regionFromUrl, accessSession?.scope]);

  const isServicioMda = accessSession?.scope === 'servicio_mda';
  const roleRegionalReadOnly = accessSession?.scope === 'region' || isServicioMda;
  const effectiveRegionalReadOnly = isRegionalReadOnly || roleRegionalReadOnly;

  const roleRegion = accessSession?.scope === 'region' ? (accessSession?.region || '') : '';
  const regionLocked = roleRegion || (isRegionalReadOnly ? regionFromUrl : '');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        setAuthLoading(true);
        const current = await getCurrentSession();
        const localAccess = getAccessSession();
        setAccessSession(localAccess);
        if (current) {
          const p = await getMyProfile();
          setProfile(p);
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Error inicializando sesión.');
        // Si Supabase no está configurado, no romper la app: mostrar login con error.
        setProfile(null);
      } finally {
        setAuthLoading(false);
      }

      try {
        const subscription = onAuthStateChange(async (nextSession) => {
          if (nextSession) {
            try {
              const p = await getMyProfile();
              setProfile(p);
              setAuthError('');
            } catch (err) {
              setAuthError(err instanceof Error ? err.message : 'Error cargando perfil.');
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
          setAccessSession(getAccessSession());
        });

        unsubscribe = () => {
          subscription.unsubscribe();
        };
      } catch {
        // Si falla registro de listener por falta de config, no bloquear render.
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (regionLocked) {
      setFiltros((prev) => ({ ...prev, region: regionLocked }));
    }
  }, [regionLocked]);

  const handleLogin = async (accessKey: string, password: string) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const nextAccess = await signInWithRegionPassword(accessKey, password);
      setAccessSession(nextAccess);

      setProfile(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Credenciales inválidas.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (accessSession?.scope === 'general_admin' || accessSession?.scope === 'super_admin') {
      const confirmationKey = window.prompt('Para cerrar sesión ingresa la clave de confirmación:');
      if (confirmationKey !== 'Minpu.2023!') {
        alert('Clave incorrecta. No se cerró la sesión.');
        return;
      }
    }

    await signOut();
    setData(null);
    setFiltros({
      region: '',
      anio: '',
      estadoIvanti: '',
      estadoSophos: '',
      usuario: ''
    });
    setAccessSession(null);
    setProfile(null);
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    const equiposFiltrados = data.equipos.filter((e) => {
      if (regionLocked && e['Región'] !== regionLocked) return false;
      if (!regionLocked && filtros.region && e['Región'] !== filtros.region) return false;
      if (filtros.anio && e._anioReporte !== filtros.anio) return false;
      if (filtros.usuario && (e['Cuenta NT'] || e['Usuario']) !== filtros.usuario) return false;
      if (filtros.estadoIvanti && e['Agente Ivanti'] !== filtros.estadoIvanti) return false;
      if (filtros.estadoSophos && e['Agente Sophos'] !== filtros.estadoSophos) return false;
      return true;
    });

    return procesarDatos(equiposFiltrados);
  }, [data, filtros, regionLocked]);

  if (authLoading) {
    return (
      <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
        <main className="main-content">
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Dashboard Ivanti</h1>
              <p>Validando sesión...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!accessSession) {
    return <Login onLogin={handleLogin} loading={authLoading} error={authError} />;
  }

  
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
        isRegionalReadOnly={effectiveRegionalReadOnly}
        userEmail={profile?.email || accessSession.accessKey}
        userRole={accessSession.scope === 'general_admin' || accessSession.scope === 'super_admin' ? profile?.role : accessSession.role}
        onLogout={handleLogout}
        canExport={accessSession.scope === 'general_admin' || accessSession.scope === 'super_admin'}
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
              <Upload
                onDataLoaded={handleDataLoaded}
                canUpload={accessSession?.scope === 'general_admin' || accessSession?.scope === 'super_admin'}
              />
            </div>
          </div>
        ) : (
          <div className="dashboard" id="dashboard-content" ref={dashboardRef}>
            <div className="dashboard-header">
              <div className="dashboard-title-block">
                <h1>Dashboard Ejecutivo - Inventario Ivanti</h1>
                <p>Fecha de generación: {data.kpis.fechaGeneracion}</p>
              </div>
              <div className="dashboard-branding">
                <img src="/ministerio.svg" alt="Ministerio Público" className="brand-logo ministerio-logo" />
                <img src="/fcom.png" alt="FCOM" className="brand-logo fcom-logo" />
              </div>
            </div>
            

            <KPICards kpis={(filteredData || data).kpis} />

            <Charts data={filteredData || data} hideRegionalSummaryCharts={isServicioMda} />

            <Tables data={filteredData || data} isServicioMda={isServicioMda} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
