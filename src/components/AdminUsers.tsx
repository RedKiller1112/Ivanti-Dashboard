import { useState } from 'react';
import { REGIONES_OFICIALES } from '../constants/regions';
import type { AppRole } from '../types/auth';

interface AdminUsersProps {
  onCreateUser: (payload: {
    email: string;
    password: string;
    role: AppRole;
    region?: string | null;
    active?: boolean;
  }) => Promise<void>;
}

export const AdminUsers = ({ onCreateUser }: AdminUsersProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('region');
  const [region, setRegion] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiresRegion = role === 'region';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (requiresRegion && !region) {
      setError('Debes seleccionar una región para el rol regional.');
      return;
    }

    try {
      setLoading(true);
      await onCreateUser({
        email: email.trim(),
        password,
        role,
        region: requiresRegion ? region : null,
        active
      });
      setMessage('Usuario creado correctamente.');
      setEmail('');
      setPassword('');
      setRole('region');
      setRegion('');
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chart-card" style={{ marginBottom: 16 }}>
      <h3 className="chart-title">Administración de Usuarios</h3>
      <form onSubmit={handleSubmit}>
        <div className="filters-body">
          <div className="filter-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@organizacion.cl"
            />
          </div>

          <div className="filter-group">
            <label>Contraseña temporal</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="filter-group">
            <label>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
              <option value="admin">Administrador</option>
              <option value="general">General</option>
              <option value="region">Regional</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Región</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={!requiresRegion}
            >
              <option value="">Selecciona región</option>
              {REGIONES_OFICIALES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Sin Región">Sin Región</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado</label>
            <select
              value={active ? 'active' : 'inactive'}
              onChange={(e) => setActive(e.target.value === 'active')}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        {message && <p style={{ color: '#10b981', marginTop: 8 }}>{message}</p>}
        {error && <p style={{ color: '#ef4444', marginTop: 8 }}>{error}</p>}

        <button className="btn primary-btn" type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Creando usuario...' : 'Crear usuario'}
        </button>
      </form>
    </section>
  );
};

export default AdminUsers;
