import { useState } from 'react';

interface LoginProps {
  onLogin: (accessKey: string, password: string) => Promise<void>;
  onVerifyOtp: (otp: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  requiresOtp?: boolean;
  otpAccessKey?: string;
}

export const Login = ({
  onLogin,
  onVerifyOtp,
  loading = false,
  error,
  requiresOtp = false,
  otpAccessKey = ''
}: LoginProps) => {
  const [accessKey, setAccessKey] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(accessKey.trim(), password);
  };

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await onVerifyOtp(otp.trim());
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content login-panel" style={{ maxWidth: 520 }}>
        <div className="branding-grid">
          <div className="logo-card logo-card-white logo-card-ministerio">
            <img src="/ministerio.svg" alt="Ministerio Público" className="brand-logo" />
          </div>
          <div className="logo-card logo-card-white">
            <img src="/fcom.png" alt="FCOM" className="brand-logo" />
          </div>
          <div className="logo-card logo-card-ivanti">
            <img src="/ivanti.png" alt="Ivanti" className="partner-logo" />
          </div>
          <div className="logo-card logo-card-sophos">
            <img src="/sophos.png" alt="Sophos" className="partner-logo" />
          </div>
        </div>
        <h1>Dashboard Ivanti - Sophos</h1>
        <p>Acceso restringido. Inicia sesión para continuar.</p>

        {!requiresOtp ? (
          <form onSubmit={handleSubmitCredentials} className="login-form" style={{ marginTop: 20, textAlign: 'left' }}>
            <div className="filter-group login-field" style={{ marginBottom: 12 }}>
              <label>Región / Acceso</label>
              <input
                className="login-input"
                type="text"
                value={accessKey}
                required
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Ej: ORIENTE o GENERAL"
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
        ) : (
          <form onSubmit={handleSubmitOtp} className="login-form" style={{ marginTop: 20, textAlign: 'left' }}>
            <div style={{ marginBottom: 12, fontSize: 14, color: '#94a3b8' }}>
              Segundo factor requerido para: <strong>{otpAccessKey || 'GENERAL'}</strong>
            </div>

            <div className="filter-group login-field" style={{ marginBottom: 12 }}>
              <label>Código OTP (6 dígitos)</label>
              <input
                className="login-input"
                type="text"
                value={otp}
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button className="btn primary-btn login-submit-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Verificando...' : 'Verificar OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
