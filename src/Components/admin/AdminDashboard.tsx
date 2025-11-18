import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type User } from '../../services/api';
import './admin.css';

interface AnalyticsSummaryDTO {
  [key: string]: any;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string>('');

  // Analytics
  const [summary, setSummary] = useState<AnalyticsSummaryDTO | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string>('');
  const [etlRunning, setEtlRunning] = useState(false);
  const [etlMsg, setEtlMsg] = useState('');

  // Búsqueda de usuarios
  const [searchId, setSearchId] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    // Cargar usuarios
    (async () => {
      setLoadingUsers(true);
      setUsersError('');
      try {
        const data = await apiService.getAllUsers();
        setUsers(data || []);
      } catch (e: any) {
        setUsersError(e?.message || 'No se pudieron cargar los usuarios');
      } finally {
        setLoadingUsers(false);
      }
    })();
    // Cargar resumen analytics
    (async () => {
      setLoadingSummary(true);
      setSummaryError('');
      try {
        const res = await apiService.analyticsSummary<any>();
        setSummary(res ?? {});
      } catch (e: any) {
        setSummaryError(e?.message || 'No se pudo cargar el resumen');
      } finally {
        setLoadingSummary(false);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    apiService.logout();
    navigate('/login', { replace: true });
  };

  const runETL = async () => {
    try {
      setEtlRunning(true);
      setEtlMsg('');
      const msg = await apiService.analyticsSync();
      setEtlMsg(msg || 'ETL ejecutado');
      // Refrescar resumen
      const res = await apiService.analyticsSummary<any>();
      setSummary(res ?? {});
    } catch (e: any) {
      setEtlMsg(e?.message || 'Fallo al ejecutar ETL');
    } finally {
      setEtlRunning(false);
    }
  };

  const resetSearch = async () => {
    setSearchId('');
    setSearchEmail('');
    setSearchUsername('');
    setSearchError('');
    // Volver a cargar todos
    try {
      setSearchLoading(true);
      const data = await apiService.getAllUsers();
      setUsers(data || []);
    } catch (e: any) {
      setSearchError(e?.message || 'No se pudieron recargar los usuarios');
    } finally {
      setSearchLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearchError('');
    setSearchLoading(true);
    try {
      if (searchId.trim()) {
        const u = await apiService.getUserById(Number(searchId));
        setUsers(u ? [u] : []);
      } else if (searchEmail.trim()) {
        const u = await apiService.getUserByEmail(searchEmail.trim());
        setUsers(u ? [u] : []);
      } else if (searchUsername.trim()) {
        const u = await apiService.getUserByUsername(searchUsername.trim());
        setUsers(u ? [u] : []);
      } else {
        // si no hay criterios, recargar todo
        const data = await apiService.getAllUsers();
        setUsers(data || []);
      }
    } catch (e: any) {
      setUsers([]);
      setSearchError(e?.message || 'No se encontró el usuario');
    } finally {
      setSearchLoading(false);
    }
  };

  const renderSummary = () => {
    if (loadingSummary) return <div className="admin-loading">Cargando resumen…</div>;
    if (summaryError) return <div className="admin-error">{summaryError}</div>;
    if (!summary || Object.keys(summary).length === 0) return <div className="admin-muted">Sin datos de resumen</div>;
    const entries = Object.entries(summary).slice(0, 12); // limitar a 12 métricas visibles
    return (
      <div className="admin-kpis">
        {entries.map(([k, v]) => (
          <div key={k} className="kpi-item">
            <div className="kpi-key">{k}</div>
            <div className="kpi-val">{typeof v === 'number' ? v.toLocaleString() : String(v)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Panel de Administración</h2>
          <div className="admin-subtitle">Gestión de usuarios y analíticas</div>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => navigate('/home')}>Ir al catálogo</button>
          <button className="btn-outline" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* Fila de tarjetas: Resumen y Acciones */}
      <div className="admin-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Resumen de analytics</h3>
            <div className="spacer" />
            <button className="btn" onClick={runETL} disabled={etlRunning}>
              {etlRunning ? 'Ejecutando ETL…' : 'Ejecutar ETL'}
            </button>
          </div>
          {etlMsg && <div className="admin-hint">{etlMsg}</div>}
          {renderSummary()}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Buscar usuarios</h3>
          </div>
          <div className="admin-form">
            <div className="form-row">
              <label htmlFor="uid">ID</label>
              <input id="uid" type="number" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Ej: 12" />
            </div>
            <div className="form-row">
              <label htmlFor="uemail">Email</label>
              <input id="uemail" type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="usuario@correo.com" />
            </div>
            <div className="form-row">
              <label htmlFor="uname">Username</label>
              <input id="uname" type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} placeholder="usuario" />
            </div>
            <div className="form-actions">
              <button className="btn" onClick={searchUsers} disabled={searchLoading}>{searchLoading ? 'Buscando…' : 'Buscar'}</button>
              <button className="btn-outline" onClick={resetSearch} disabled={searchLoading}>Limpiar</button>
            </div>
            {searchError && <div className="admin-error" style={{marginTop: '.5rem'}}>{searchError}</div>}
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Usuarios ({users.length})</h3>
        </div>
        {loadingUsers ? (
          <div className="admin-loading">Cargando usuarios…</div>
        ) : usersError ? (
          <div className="admin-error">{usersError}</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id ?? u.email}>
                    <td>{u.id ?? '—'}</td>
                    <td>{u.username ?? '—'}</td>
                    <td>{u.email ?? '—'}</td>
                    <td>{u.role ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
