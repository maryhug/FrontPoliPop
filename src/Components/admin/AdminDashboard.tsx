import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type User } from '../../services/api';
import './admin.css';

interface AnalyticsSummaryDTO {
  [key: string]: any;
}

// Helpers para traducir y formatear métricas
const keyTranslations: Record<string, string> = {
  totalUsers: 'Usuarios',
  totalMovies: 'Películas',
  totalLogins: 'Inicios de sesión',
  lastSyncAt: 'Última sincronización',
  favoritesCount: 'Favoritos',
  avgRating: 'Calificación promedio',
  byGender: 'Por género',
  byCountry: 'Por país',
  byRole: 'Por rol',
  topGenres: 'Géneros populares',
  topCountries: 'Países con más usuarios',
  topMovies: 'Películas destacadas',
  AverageAge: 'Edad promedio',
  averageAge: 'Edad promedio',
  topFavoriteMovies: 'Top películas favoritas',
  topFavorites: 'Top favoritos',
  favoriteMovies: 'Películas favoritas',
};

const humanizeCamel = (k: string): string =>
  k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^by\s/i, 'Por ')
    .replace(/^avg\s/i, 'Promedio ')
    .replace(/^top\s/i, 'Top ')
    .replace(/^total\s/i, 'Total ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const translateKey = (k: string): string => keyTranslations[k] || humanizeCamel(k);

// Unificar etiquetas tipo género/rol/otros
const translateMetricLabel = (raw: string): string => {
  if (!raw) return raw;
  const key = raw.trim().toUpperCase();
  const map: Record<string, string> = {
    'F': 'Femenino', 'FEMENINO': 'Femenino', 'FEMALE': 'Femenino',
    'M': 'Masculino', 'MASCULINO': 'Masculino', 'MALE': 'Masculino',
    'O': 'Otro', 'OTRO': 'Otro', 'OTHER': 'Otro',
    'U': 'Desconocido', 'UNKNOWN': 'Desconocido', 'DESCONOCIDO': 'Desconocido',
    'ADMIN': 'Admin', 'USER': 'Usuario'
  };
  return map[key] || humanizeCamel(raw);
};

const formatMetricValue = (v: any): string => {
  if (v === null || v === undefined) return 'Sin datos';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T?/.test(v)) return v.replace('T', ' ').slice(0, 19);
    return translateMetricLabel(v);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return 'Sin datos';
    if (v.every((i) => typeof i === 'string')) return (v as string[]).slice(0, 5).map((s) => translateMetricLabel(s)).join(', ');
    const mapped = v
      .map((i) => {
        if (i && typeof i === 'object') {
          const title = (i.title || i.originalTitle || i.original_title || i.movieTitle || i.name || i.label || '') as string;
          const count = (i.count || i.value || i.total || i.times || i.freq || i.frequency) as number | undefined;
          if (title && typeof count === 'number') return `${title}: ${count}`;
          if (title) return title;
        }
        return '';
      })
      .filter(Boolean);
    return mapped.length ? mapped.slice(0, 5).join(' · ') : 'Sin datos';
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, any>);
    if (!entries.length) return 'Sin datos';
    const sorted = entries.sort((a, b) => {
      const av = typeof a[1] === 'number' ? a[1] : (typeof a[1] === 'object' && typeof (a[1] as any)?.count === 'number' ? (a[1] as any).count : 0);
      const bv = typeof b[1] === 'number' ? b[1] : (typeof b[1] === 'object' && typeof (b[1] as any)?.count === 'number' ? (b[1] as any).count : 0);
      return bv - av;
    });
    const shown = sorted.slice(0, 5).map(([k, val]) => {
      if (val && typeof val === 'object') {
        const title = (val.title || (val as any).originalTitle || (val as any).original_title || (val as any).name || (val as any).label) as string | undefined;
        const cnt = (val as any).count as number | undefined;
        if (title && typeof cnt === 'number') return `${title}: ${cnt}`;
        if (title) return title;
      }
      return `${translateMetricLabel(k)}: ${typeof val === 'number' ? val.toLocaleString() : String(val)}`;
    });
    return shown.join(' · ');
  }
  return String(v);
};

// Extraer lista de items (título y conteo) para métricas tipo "top favoritos"
const extractTopItems = (v: any): Array<{ label: string; count?: number }> => {
  const items: Array<{ label: string; count?: number }> = [];
  if (!v && v !== 0) return items;
  if (Array.isArray(v)) {
    for (const i of v) {
      if (i && typeof i === 'object') {
        const label = (i.title || i.originalTitle || i.original_title || i.movieTitle || i.name || i.label || '') as string;
        const count = (i.count || i.value || i.total || i.times || i.freq || i.frequency) as number | undefined;
        if (label) items.push({ label, count });
      } else if (typeof i === 'string') {
        items.push({ label: translateMetricLabel(i) });
      }
    }
  } else if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, any>)) {
      if (val && typeof val === 'object') {
        const label = (val.title || (val as any).originalTitle || (val as any).original_title || (val as any).name || (val as any).label || k) as string;
        const count = (val as any).count as number | undefined;
        items.push({ label, count });
      } else if (typeof val === 'number') {
        items.push({ label: translateMetricLabel(k), count: val });
      } else {
        items.push({ label: translateMetricLabel(k) });
      }
    }
  } else if (typeof v === 'string') {
    items.push({ label: translateMetricLabel(v) });
  }
  // ordenar por count desc si existe
  items.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return items.slice(0, 10);
};

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string>('');

  const openEdit = (u: User) => {
    if (!u || typeof u.id !== 'number') return;
    setEditingId(u.id);
    setEditForm({
      email: u.email || '',
      username: u.username || '',
      role: u.role || 'USER',
      gender: u.gender || '',
      birthdate: u.birthdate || '',
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditError('');
  };

  const onEditChange = (field: keyof User, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditError('');
    // Validaciones simples
    const email = (editForm.email || '').trim();
    const username = (editForm.username || '').trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEditError('Email inválido');
      return;
    }
    if (!username) {
      setEditError('Username requerido');
      return;
    }
    setEditLoading(true);
    try {
      const payload: User = {
        id: editingId,
        email,
        username,
        role: editForm.role,
        gender: editForm.gender,
        birthdate: editForm.birthdate,
      } as User;
      const updated = await apiService.updateUser(editingId, payload);
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...updated } : u)));
      closeEdit();
    } catch (e: any) {
      setEditError(e?.message || 'No se pudo guardar');
    } finally {
      setEditLoading(false);
    }
  };

  const selectableIds = useMemo(() => (users.map((u) => u.id).filter((id): id is number => typeof id === 'number')), [users]);
  const isAllSelected = useMemo(() => selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id)), [selectableIds, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const toggleSelect = (id?: number) => {
    if (typeof id !== 'number') return;
    setSelectedIds((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(id)) nxt.delete(id); else nxt.add(id);
      return nxt;
    });
  };

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


  const runETL = async () => {
    try {
      setEtlRunning(true);
      setEtlMsg('');
      const msg = await apiService.analyticsSync();
      setEtlMsg(msg || 'Sincronización completada');
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

  const deleteUserRow = async (id?: number, label?: string) => {
    if (!id && id !== 0) {
      setDeleteError('ID inválido');
      return;
    }
    const ok = window.confirm(`¿Eliminar usuario ${label ?? id}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      setDeletingId(id!);
      setDeleteError('');
      await apiService.deleteUser(id!);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedIds((prev) => { const nxt = new Set(prev); nxt.delete(id!); return nxt; });
    } catch (e: any) {
      setDeleteError(e?.message || 'No se pudo eliminar el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const renderSummary = () => {
    if (loadingSummary) return <div className="admin-loading">Cargando resumen…</div>;
    if (summaryError) return <div className="admin-error">{summaryError}</div>;
    if (!summary || Object.keys(summary).length === 0) return <div className="admin-muted">Sin datos de resumen</div>;
    const entries = Object.entries(summary);
    const wideKeys = new Set(['topFavoriteMovies', 'favoriteMovies', 'topFavorites']);
    return (
      <div className="admin-kpis">
        {entries.map(([k, v]) => {
          if (wideKeys.has(k)) {
            const items = extractTopItems(v);
            return (
              <div key={k} className="kpi-item kpi-item--wide">
                <div className="kpi-key">{translateKey(k)}</div>
                {items.length ? (
                  <div className="kpi-list">
                    {items.map((it, idx) => (
                      <span key={idx} className="kpi-pill">{it.label}{typeof it.count === 'number' ? ` (${it.count})` : ''}</span>
                    ))}
                  </div>
                ) : (
                  <div className="kpi-val">Sin datos</div>
                )}
              </div>
            );
          }
          return (
            <div key={k} className="kpi-item">
              <div className="kpi-key">{translateKey(k)}</div>
              <div className="kpi-val">{formatMetricValue(v)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const computeAge = (birth?: string) => {
    if (!birth) return undefined;
    const d = new Date(birth);
    if (isNaN(d.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = window.confirm(`¿Eliminar ${ids.length} usuario(s) seleccionados? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setBulkDeleting(true);
    setDeleteError('');
    const failures: number[] = [];
    for (const id of ids) {
      try {
        await apiService.deleteUser(id);
      } catch (e) {
        failures.push(id);
      }
    }
    setUsers((prev) => prev.filter((u) => typeof u.id === 'number' && !selectedIds.has(u.id!)));
    setSelectedIds(new Set());
    if (failures.length) setDeleteError(`No se pudieron eliminar: ${failures.join(', ')}`);
    setBulkDeleting(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Panel del Administrador</h2>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => navigate('/home')}>Ir al catálogo</button>
        </div>
      </div>

      {/* Fila de tarjetas: Resumen y Acciones */}
      <div className="admin-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Resumen de Analíticas</h3>
            <div className="spacer" />
            <button className="btn" onClick={runETL} disabled={etlRunning}>
              {etlRunning ? 'Sincronizando…' : 'Sincronizar'}
            </button>
          </div>
          {etlMsg && <div className="admin-hint">{etlMsg}</div>}
          {renderSummary()}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="header-title">
              <h3>Buscar usuarios</h3>
              <div className="card-subtitle">
                <span className="subtitle-icons" aria-hidden="true">
                  {/* ID */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3a7 7 0 1 0 4.9 12l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/></svg>
                  {/* Email */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.01L12 12l8-5.99V6H4Zm16 12V9.24l-7.37 5.52a2 2 0 0 1-2.26 0L3 9.24V18h17Z"/></svg>
                  {/* Username */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z"/></svg>
                </span>
              </div>
            </div>
          </div>
          <div className="admin-form">
            <div className="form-row">
              <label htmlFor="uid">ID</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3a7 7 0 1 0 4.9 12l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/></svg>
                </span>
                <input id="uid" type="number" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Ej: 12" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="uemail">Email</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.01L12 12l8-5.99V6H4Zm16 12V9.24l-7.37 5.52a2 2 0 0 1-2.26 0L3 9.24V18h17Z"/></svg>
                </span>
                <input id="uemail" type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="usuario@correo.com" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="uname">Username</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z"/></svg>
                </span>
                <input id="uname" type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} placeholder="usuario" />
              </div>
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
          <div className="spacer" />
          <button className="btn-danger" onClick={bulkDelete} disabled={bulkDeleting || selectedIds.size === 0} title="Eliminar seleccionados" aria-label="Eliminar seleccionados">
            Eliminar seleccionados ({selectedIds.size})
          </button>
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
                  <th className="col-select"><input type="checkbox" onChange={toggleSelectAll} checked={isAllSelected} aria-label="Seleccionar todo" /></th>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Género</th>
                  <th>Edad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id ?? u.email}>
                    <td className="col-select">
                      <input type="checkbox" aria-label={`Seleccionar usuario ${u.email || u.username || u.id}`} checked={typeof u.id === 'number' ? selectedIds.has(u.id) : false} onChange={() => toggleSelect(u.id)} disabled={typeof u.id !== 'number'} />
                    </td>
                    <td>{u.id ?? '—'}</td>
                    <td>{u.username ?? '—'}</td>
                    <td>{u.email ?? '—'}</td>
                    <td><span className={`badge badge-role`}>{translateMetricLabel(u.role || '—')}</span></td>
                    <td><span className={`badge`}>{translateMetricLabel(u.gender || '—')}</span></td>
                    <td>{(() => { const a = computeAge(u.birthdate); return a !== undefined ? a : '—'; })()}</td>
                    <td>
                      <button
                        className="btn-outline"
                        onClick={() => openEdit(u)}
                        title="Editar usuario"
                        aria-label="Editar usuario"
                        style={{ marginRight: 8 }}
                      >
                        {/* ícono lápiz */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2 1.5h.88l9.9-9.9-.88-.88-9.9 9.9v.88ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteUserRow(u.id, u.email || u.username)}
                        disabled={deletingId === u.id}
                        title="Eliminar usuario"
                        aria-label="Eliminar usuario"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Zm-1 4a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deleteError && <div className="admin-error" style={{ marginTop: '.5rem' }}>{deleteError}</div>}
          </div>
        )}
      </div>
      {editingId !== null && (
        <div className="admin-modal-backdrop" onClick={closeEdit}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>Editar usuario</h4>
              <button className="modal-close" onClick={closeEdit} aria-label="Cerrar">✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-form-row">
                <label>Email</label>
                <input type="email" value={editForm.email || ''} onChange={(e) => onEditChange('email', e.target.value)} />
              </div>
              <div className="modal-form-row">
                <label>Username</label>
                <input type="text" value={editForm.username || ''} onChange={(e) => onEditChange('username', e.target.value)} />
              </div>
              <div className="modal-grid">
                <div className="modal-form-row">
                  <label>Rol</label>
                  <select value={editForm.role || 'USER'} onChange={(e) => onEditChange('role', e.target.value)}>
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="modal-form-row">
                  <label>Género</label>
                  <select value={editForm.gender || ''} onChange={(e) => onEditChange('gender', e.target.value)}>
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div className="modal-form-row">
                  <label>Nacimiento</label>
                  <input type="date" value={editForm.birthdate || ''} onChange={(e) => onEditChange('birthdate', e.target.value)} />
                </div>
              </div>
              {editError && <div className="admin-error" style={{ marginTop: '.5rem' }}>{editError}</div>}
            </div>
            <div className="admin-modal-actions">
              <button className="btn-outline" onClick={closeEdit}>Cancelar</button>
              <button className="btn" onClick={saveEdit} disabled={editLoading}>{editLoading ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
