import { useState } from 'react';

interface LoginProps {
  onLogin: (accessKey: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export const Login = ({ onLogin, loading = false, error }: LoginProps) => {
  const [accessKey, setAccessKey] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(accessKey.trim(), password);
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content login-panel" style={{ maxWidth: 520 }}>
        <div className="login-branding">
          <div className="dashboard-branding branding-glass login-branding-simple">
            <img src="/ministerio.svg" alt="Ministerio Público" className="brand-logo ministerio-logo" />
            <img src="/fcom.png" alt="FCOM" className="brand-logo fcom-logo" />
          </div>
        </div>
        <h1>Dashboard Ivanti</h1>
        <p>Acceso restringido. Inicia sesión para continuar.</p>

        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: 20, textAlign: 'left' }}>
          <div className="filter-group login-field" style={{ marginBottom: 12 }}>
            <label>Región / Acceso</label>
            <input
              className="login-input"
              type="text"
              value={accessKey}
              required
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Ej: ORIENTE o GENERAL_ADMIN"
            />
          </div>

          <div className="filter-group login-field" style={{ marginBottom: 12 }}>
            <label>Contraseña</label>
            <input
              className="login-input"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>
              {error}
            </div>
          )}

          <button className="btn primary-btn login-submit-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
