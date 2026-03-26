import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type User } from '../../services/api';
import './admin.css';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalyticsSummaryDTO { [key: string]: any; }
interface EditErrors { email?: string; username?: string; birthdate?: string; }

// ── Translations / formatters ──────────────────────────────────────────────
const keyTranslations: Record<string, string> = {
    totalUsers:'Usuarios', totalMovies:'Películas', totalLogins:'Inicios de sesión',
    lastSyncAt:'Última sincronización', favoritesCount:'Favoritos', avgRating:'Calificación promedio',
    byGender:'Por género', byCountry:'Por país', byRole:'Por rol', topGenres:'Géneros populares',
    topCountries:'Países con más usuarios', topMovies:'Películas destacadas',
    AverageAge:'Edad promedio', averageAge:'Edad promedio',
    topFavoriteMovies:'Top películas favoritas', topFavorites:'Top favoritos', favoriteMovies:'Películas favoritas',
};

const humanizeCamel = (k: string) =>
    k.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ')
        .replace(/^by\s/i,'Por ').replace(/^avg\s/i,'Promedio ').replace(/^top\s/i,'Top ')
        .replace(/^total\s/i,'Total ').replace(/\s+/g,' ').replace(/^\w/,c=>c.toUpperCase());

const translateKey = (k: string) => keyTranslations[k] || humanizeCamel(k);

const translateMetricLabel = (raw: string): string => {
    if (!raw) return raw;
    const key = raw.trim().toUpperCase();
    const map: Record<string,string> = {
        'F':'Femenino','FEMENINO':'Femenino','FEMALE':'Femenino',
        'M':'Masculino','MASCULINO':'Masculino','MALE':'Masculino',
        'O':'Otro','OTRO':'Otro','OTHER':'Otro',
        'U':'Desconocido','UNKNOWN':'Desconocido','DESCONOCIDO':'Desconocido',
        'ADMIN':'Admin','USER':'Usuario',
    };
    return map[key] || humanizeCamel(raw);
};

const formatMetricValue = (v: any): string => {
    if (v === null || v === undefined) return 'Sin datos';
    if (typeof v === 'number') return v.toLocaleString();
    if (typeof v === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T?/.test(v)) return v.replace('T',' ').slice(0,19);
        return translateMetricLabel(v);
    }
    if (Array.isArray(v)) {
        if (!v.length) return 'Sin datos';
        if (v.every(i=>typeof i==='string')) return (v as string[]).slice(0,5).map(s=>translateMetricLabel(s)).join(', ');
        const mapped = v.map(i=>{
            if(i&&typeof i==='object'){
                const title=(i.title||i.originalTitle||i.original_title||i.movieTitle||i.name||i.label||'') as string;
                const count=(i.count||i.value||i.total||i.times||i.freq||i.frequency) as number|undefined;
                if(title&&typeof count==='number') return `${title}: ${count}`;
                if(title) return title;
            }
            return '';
        }).filter(Boolean);
        return mapped.length ? mapped.slice(0,5).join(' · ') : 'Sin datos';
    }
    if (typeof v==='object') {
        const entries=Object.entries(v as Record<string,any>);
        if(!entries.length) return 'Sin datos';
        const sorted=entries.sort((a,b)=>{
            const av=typeof a[1]==='number'?a[1]:(typeof a[1]==='object'&&typeof(a[1] as any)?.count==='number'?(a[1] as any).count:0);
            const bv=typeof b[1]==='number'?b[1]:(typeof b[1]==='object'&&typeof(b[1] as any)?.count==='number'?(b[1] as any).count:0);
            return bv-av;
        });
        const shown=sorted.slice(0,5).map(([k,val])=>{
            if(val&&typeof val==='object'){
                const title=(val.title||(val as any).originalTitle||(val as any).original_title||(val as any).name||(val as any).label) as string|undefined;
                const cnt=(val as any).count as number|undefined;
                if(title&&typeof cnt==='number') return `${title}: ${cnt}`;
                if(title) return title;
            }
            return `${translateMetricLabel(k)}: ${typeof val==='number'?val.toLocaleString():String(val)}`;
        });
        return shown.join(' · ');
    }
    return String(v);
};

const extractTopItems = (v: any): Array<{label:string;count?:number}> => {
    const items: Array<{label:string;count?:number}> = [];
    if (!v&&v!==0) return items;
    if (Array.isArray(v)) {
        for(const i of v as any[]){
            if(i&&typeof i==='object'){
                const label=(i.title||i.originalTitle||i.original_title||i.movieTitle||i.name||i.label||'') as string;
                const count=(i.count||i.value||i.total||i.times||i.freq||i.frequency) as number|undefined;
                if(label) items.push({label,count});
            } else if(typeof(i as any)==='string') items.push({label:translateMetricLabel(String(i))});
        }
    } else if(typeof v==='object'){
        for(const [k,val] of Object.entries(v as Record<string,any>)){
            if(val&&typeof val==='object'){
                const label=(val.title||(val as any).originalTitle||(val as any).original_title||(val as any).name||(val as any).label||k) as string;
                const count=(val as any).count as number|undefined;
                items.push({label,count});
            } else if(typeof val==='number') items.push({label:translateMetricLabel(k),count:val});
            else items.push({label:translateMetricLabel(k)});
        }
    } else if(typeof v==='string') items.push({label:translateMetricLabel(v)});
    items.sort((a,b)=>(b.count??0)-(a.count??0));
    return items.slice(0,10);
};

const toLabelCountList = (v: any): Array<{label:string;rawLabel?:string;count:number}> => {
    const rows: Array<{label:string;rawLabel?:string;count:number}> = [];
    if(!v&&v!==0) return rows;
    if(Array.isArray(v)){
        for(const it of v as any[]){
            if(!it) continue;
            if(typeof it==='object'){
                const raw=(it.country||it.label||it.name||it.title||it.originalTitle||it.original_title||it.key||'') as string;
                const cnt=(it.count??it.value??it.total??it.times??it.freq??it.frequency) as number|undefined;
                if(raw&&typeof cnt==='number') rows.push({label:String(raw),rawLabel:String(raw),count:cnt});
            } else if(typeof it==='string') rows.push({label:it,rawLabel:it,count:1});
        }
        return rows;
    }
    if(typeof v==='object'){
        for(const [k,val] of Object.entries(v as Record<string,any>)){
            if(val&&typeof val==='object'){
                const cnt=(val as any).count as number|undefined;
                if(typeof cnt==='number') rows.push({label:k,rawLabel:k,count:cnt});
            } else if(typeof val==='number') rows.push({label:k,rawLabel:k,count:val});
        }
        return rows;
    }
    return rows;
};

// ── Edit field validation ──────────────────────────────────────────────────
const validateEditField = (field: keyof EditErrors, value: string): string => {
    switch(field){
        case 'email':
            if(!value.trim()) return 'El correo es obligatorio.';
            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Ingresa un correo válido.';
            return '';
        case 'username':
            if(!value.trim()) return 'El nombre de usuario es obligatorio.';
            if(value.trim().length<3) return 'Mínimo 3 caracteres.';
            if(value.trim().length>30) return 'Máximo 30 caracteres.';
            if(!/^[a-zA-Z0-9_.-]+$/.test(value.trim())) return 'Solo letras, números, puntos y guiones.';
            return '';
        case 'birthdate':
            if(!value) return '';
            const birth=new Date(value);
            const now=new Date();
            if(birth>now) return 'La fecha no puede ser futura.';
            const age=now.getFullYear()-birth.getFullYear();
            if(age>120) return 'Fecha inválida.';
            if(age<5) return 'Edad mínima: 5 años.';
            return '';
        default: return '';
    }
};

// ── Icons ──────────────────────────────────────────────────────────────────
const IcoMail = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>;
const IcoUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const IcoShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v5c0 4.5-3.1 8.7-7 10C8.1 19.7 5 15.5 5 11V6z"/></svg>;
const IcoGender = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="11" r="4"/><path d="M17 3h4v4"/><path d="m21 3-4.9 4.9"/><path d="M12 15v7"/><path d="M9 19h6"/></svg>;
const IcoCal = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

// ── Component ──────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [summary, setSummary] = useState<AnalyticsSummaryDTO|null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [summaryError, setSummaryError] = useState('');
    const [etlRunning, setEtlRunning] = useState(false);
    const [etlMsg, setEtlMsg] = useState('');
    const [query, setQuery] = useState('');
    const [queryLoading, setQueryLoading] = useState(false);
    const [queryError, setQueryError] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState<number|null>(null);
    const [deleteError, setDeleteError] = useState('');
    const [editingId, setEditingId] = useState<number|null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [editErrors, setEditErrors] = useState<EditErrors>({});
    const [editTouched, setEditTouched] = useState<Partial<Record<keyof EditErrors,boolean>>>({});
    const [editServerError, setEditServerError] = useState('');

    const openEdit = (u: User) => {
        if(!u||typeof u.id!=='number') return;
        setEditingId(u.id);
        setEditForm({ email:u.email||'', username:u.username||'', role:u.role||'USER', gender:u.gender||'', birthdate:u.birthdate||'' });
        setEditErrors({});
        setEditTouched({});
        setEditServerError('');
    };

    const closeEdit = () => { setEditingId(null); setEditForm({}); setEditErrors({}); setEditTouched({}); setEditServerError(''); };

    const onEditChange = (field: keyof User, value: string) => {
        setEditForm(prev=>({...prev,[field]:value}));
        if(editTouched[field as keyof EditErrors]){
            const err=validateEditField(field as keyof EditErrors,value);
            setEditErrors(prev=>({...prev,[field]:err||undefined}));
        }
    };

    const onEditBlur = (field: keyof EditErrors) => {
        setEditTouched(prev=>({...prev,[field]:true}));
        const val=(editForm[field as keyof User]||'') as string;
        const err=validateEditField(field,val);
        setEditErrors(prev=>({...prev,[field]:err||undefined}));
    };

    const saveEdit = async () => {
        if(!editingId) return;
        // Validate all edit fields
        const fields: Array<keyof EditErrors> = ['email','username','birthdate'];
        const allTouched: Partial<Record<keyof EditErrors,boolean>> = {};
        const allErrors: EditErrors = {};
        fields.forEach(f=>{
            allTouched[f]=true;
            const val=(editForm[f as keyof User]||'') as string;
            const err=validateEditField(f,val);
            if(err) allErrors[f]=err;
        });
        setEditTouched(allTouched);
        setEditErrors(allErrors);
        if(Object.keys(allErrors).length>0){ setEditServerError('Corrige los errores antes de guardar.'); return; }
        setEditLoading(true);
        setEditServerError('');
        try {
            const payload: User = { id:editingId, email:(editForm.email||'').trim(), username:(editForm.username||'').trim(), role:editForm.role, gender:editForm.gender, birthdate:editForm.birthdate } as User;
            const updated=await apiService.updateUser(editingId,payload);
            setUsers(prev=>prev.map(u=>(u.id===editingId?{...u,...updated}:u)));
            closeEdit();
        } catch(e:any){ setEditServerError(e?.message||'No se pudo guardar'); }
        finally{ setEditLoading(false); }
    };

    const selectableIds = useMemo(()=>users.map(u=>u.id).filter((id):id is number=>typeof id==='number'),[users]);
    const isAllSelected = useMemo(()=>selectableIds.length>0&&selectableIds.every(id=>selectedIds.has(id)),[selectableIds,selectedIds]);
    const toggleSelectAll = ()=>{ if(isAllSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(selectableIds)); };
    const toggleSelect = (id?:number)=>{ if(typeof id!=='number') return; setSelectedIds(prev=>{ const nxt=new Set(prev); if(nxt.has(id)) nxt.delete(id); else nxt.add(id); return nxt; }); };

    useEffect(()=>{
        const token=localStorage.getItem('token');
        if(!token){ navigate('/login',{replace:true}); return; }
        (async()=>{ setLoadingUsers(true); setUsersError(''); try{ const data=await apiService.getAllUsers(); setUsers(data||[]); } catch(e:any){ setUsersError(e?.message||'No se pudieron cargar los usuarios'); } finally{ setLoadingUsers(false); } })();
        (async()=>{ setLoadingSummary(true); setSummaryError(''); try{ const res=await apiService.analyticsSummary<any>(); setSummary(res??{}); } catch(e:any){ setSummaryError(e?.message||'No se pudo cargar el resumen'); } finally{ setLoadingSummary(false); } })();
    },[navigate]);

    const runETL = async()=>{ try{ setEtlRunning(true); setEtlMsg(''); const msg=await apiService.analyticsSync(); setEtlMsg(msg||'Sincronización completada'); const res=await apiService.analyticsSummary<any>(); setSummary(res??{}); } catch(e:any){ setEtlMsg(e?.message||'Fallo al ejecutar ETL'); } finally{ setEtlRunning(false); } };

    const reloadAllUsers = async()=>{ setQuery(''); setQueryError(''); try{ setQueryLoading(true); const data=await apiService.getAllUsers(); setUsers(data||[]); } catch(e:any){ setQueryError(e?.message||'No se pudieron recargar los usuarios'); } finally{ setQueryLoading(false); } };

    const performQuery = async()=>{
        const q=query.trim(); setQueryError(''); setQueryLoading(true);
        try{
            if(!q){ const data=await apiService.getAllUsers(); setUsers(data||[]); return; }
            const isId=/^\d+$/.test(q); const isEmail=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q);
            if(isId){ const u=await apiService.getUserById(Number(q)); setUsers(u?[u]:[]); if(!u) setQueryError('No se encontró usuario con ese ID.'); }
            else if(isEmail){ const u=await apiService.getUserByEmail(q); setUsers(u?[u]:[]); if(!u) setQueryError('No se encontró usuario con ese email.'); }
            else{ const u=await apiService.getUserByUsername(q); setUsers(u?[u]:[]); if(!u) setQueryError('No se encontró usuario con ese username.'); }
        } catch(e:any){
            const msg=(e&&(e.message||String(e)))||'';
            if(/Unexpected end|Failed to execute 'json'/i.test(msg)||e instanceof SyntaxError) setQueryError('No se encontró usuario. Respuesta vacía del servidor.');
            else if(/Failed to fetch|networkerror|network request failed|TypeError: Failed/i.test(msg)) setQueryError('No se pudo conectar al servidor.');
            else if(msg.includes('404')||/not found/i.test(msg)) setQueryError('No se encontró ningún usuario.');
            else if(/401|unauthorized/i.test(msg)) setQueryError('No autorizado. Inicia sesión de nuevo.');
            else setQueryError('No se encontró ningún usuario. '+(msg?`Detalle: ${msg}`:''));
            setUsers([]);
        } finally{ setQueryLoading(false); }
    };

    const deleteUserRow = async(id?:number,label?:string)=>{
        if(!id&&id!==0){ setDeleteError('ID inválido'); return; }
        const ok=window.confirm(`¿Eliminar usuario ${label??id}? Esta acción no se puede deshacer.`); if(!ok) return;
        try{ setDeletingId(id!); setDeleteError(''); await apiService.deleteUser(id!); setUsers(prev=>prev.filter(u=>u.id!==id)); setSelectedIds(prev=>{ const nxt=new Set(prev); nxt.delete(id!); return nxt; }); }
        catch(e:any){ setDeleteError(e?.message||'No se pudo eliminar el usuario'); }
        finally{ setDeletingId(null); }
    };

    const bulkDelete = async()=>{
        const ids=Array.from(selectedIds); if(!ids.length) return;
        const ok=window.confirm(`¿Eliminar ${ids.length} usuario(s) seleccionados? Esta acción no se puede deshacer.`); if(!ok) return;
        setBulkDeleting(true); setDeleteError(''); const failures:number[]=[];
        for(const id of ids){ try{ await apiService.deleteUser(id); } catch{ failures.push(id); } }
        setUsers(prev=>prev.filter(u=>typeof u.id==='number'&&!selectedIds.has(u.id!)));
        setSelectedIds(new Set()); if(failures.length) setDeleteError(`No se pudieron eliminar: ${failures.join(', ')}`);
        setBulkDeleting(false);
    };

    const normalizeGenderCode = (raw:string):'f'|'m'|'o'|'u'=>{ const k=(raw||'').trim().toUpperCase(); if(k==='F'||k==='FEMALE'||k==='FEMENINO') return 'f'; if(k==='M'||k==='MALE'||k==='MASCULINO') return 'm'; if(k==='O'||k==='OTHER'||k==='OTRO') return 'o'; return 'u'; };
    const computeAge = (birth?:string)=>{ if(!birth) return undefined; const d=new Date(birth); if(isNaN(d.getTime())) return undefined; const now=new Date(); let age=now.getFullYear()-d.getFullYear(); const m=now.getMonth()-d.getMonth(); if(m<0||(m===0&&now.getDate()<d.getDate())) age--; return age; };

    const renderSummary = ()=>{
        if(loadingSummary) return <div className="admin-loading">Cargando resumen…</div>;
        if(summaryError) return <div className="admin-error">{summaryError}</div>;
        if(!summary||!Object.keys(summary).length) return <div className="admin-muted">Sin datos de resumen</div>;

        const genderRows=toLabelCountList((summary as any).byGender);
        const genderTotal=genderRows.reduce((acc,r)=>acc+(r.count||0),0);
        const genderData=genderRows.map(r=>({code:normalizeGenderCode(r.rawLabel||r.label),label:translateMetricLabel(r.label),value:r.count})).filter(d=>d.value>0).sort((a,b)=>{const o:{[k:string]:number}={m:0,f:1,o:2,u:3};return(o[a.code]??99)-(o[b.code]??99);});
        const genderColors:{[k:string]:string}={m:'#0ea5e9',f:'#db2777',o:'#7c3aed',u:'#64748b'};

        const countryRows=toLabelCountList((summary as any).byCountry);
        const countryTotal=countryRows.reduce((acc,r)=>acc+(r.count||0),0);
        const countryData=countryRows.map(r=>({label:r.label,value:r.count,pct:countryTotal>0?Math.round((r.count/countryTotal)*100):0})).sort((a,b)=>b.value-a.value).slice(0,10);
        const countryColors=['#a78bfa','#60a5fa','#34d399','#f59e0b','#f472b6','#c084fc','#93c5fd','#86efac','#fde047','#fda4af'];
        const wideKeys=new Set(['topFavoriteMovies','favoriteMovies','topFavorites']);

        return (
            <div>
                <div className="analytics-grid">
                    <div className="kpi-item analytics-item">
                        <div className="kpi-key">Distribución por género {genderTotal?`(${genderTotal.toLocaleString()})`:''}</div>
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{top:8,right:8,bottom:8,left:8}}>
                                    <Pie data={genderData} dataKey="value" nameKey="label" innerRadius={60} outerRadius={92} paddingAngle={2}>
                                        {genderData.map((d,i)=><Cell key={i} fill={genderColors[d.code]}/>)}
                                    </Pie>
                                    <Tooltip formatter={(val:any,name:any)=>{const v=Number(val)||0;const pct=genderTotal?Math.round((v/genderTotal)*100):0;return[`${v.toLocaleString()} (${pct}%)`,name];}}/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="kpi-item analytics-item">
                        <div className="kpi-key">Países con más usuarios {countryTotal?`(${countryTotal.toLocaleString()})`:''}</div>
                        <div className="chart-box">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{top:8,right:8,bottom:8,left:8}}>
                                    <Pie data={countryData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={94} paddingAngle={1}>
                                        {countryData.map((_,i)=><Cell key={i} fill={countryColors[i%countryColors.length]}/>)}
                                    </Pie>
                                    <Tooltip formatter={(val:any,name:any,p:any)=>{const v=Number(val)||0;const pct=p?.payload?.pct??0;return[`${v.toLocaleString()} (${pct}%)`,name];}}/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="admin-kpis">
                    {Object.entries(summary).map(([k,v])=>{
                        if(k==='byGender'||k==='byCountry') return null;
                        if(wideKeys.has(k)){
                            const items=extractTopItems(v);
                            return(<div key={k} className="kpi-item kpi-item--wide"><div className="kpi-key">{translateKey(k)}</div>{items.length?<div className="kpi-list">{items.map((it,i)=><span key={i} className="kpi-pill">{it.label}{typeof it.count==='number'?` (${it.count})`:''}</span>)}</div>:<div className="kpi-val">Sin datos</div>}</div>);
                        }
                        return(<div key={k} className="kpi-item"><div className="kpi-key">{translateKey(k)}</div><div className="kpi-val">{formatMetricValue(v)}</div></div>);
                    })}
                </div>
            </div>
        );
    };

    // Field helper for modal
    const ef = (field: keyof EditErrors) => ({ hasError: !!(editErrors[field]&&editTouched[field]), error: editTouched[field]?editErrors[field]:undefined });

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Panel del Administrador</h2>
                <div className="admin-actions">
                    <button className="btn" onClick={()=>navigate('/home')}>Ir al catálogo</button>
                </div>
            </div>

            {/* Analytics */}
            <div className="admin-row admin-row--full">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Resumen de Analíticas</h3>
                        <div className="spacer"/>
                        <button className="btn" onClick={runETL} disabled={etlRunning}>{etlRunning?'Sincronizando…':'Sincronizar'}</button>
                    </div>
                    {etlMsg&&<div className="admin-hint">{etlMsg}</div>}
                    {renderSummary()}
                </div>
            </div>

            {/* Users */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h3>Usuarios ({users.length})</h3>
                    <div className="spacer"/>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <button className="btn-icon" onClick={bulkDelete} disabled={bulkDeleting||selectedIds.size===0} title={selectedIds.size>0?`Eliminar ${selectedIds.size} seleccionados`:'Eliminar seleccionados'} aria-label="Eliminar seleccionados">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Z"/></svg>
                        </button>
                        {selectedIds.size>0&&<span className="bulk-count" aria-hidden>{selectedIds.size}</span>}
                    </div>
                </div>

                <div className="admin-table-toolbar">
                    <div className="input-wrap toolbar-input">
                        <span className="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3a7 7 0 1 0 4.9 12l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/></svg></span>
                        <input type="text" placeholder="Buscar por ID, email o username" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') performQuery();}}/>
                    </div>
                    <button className="btn" onClick={performQuery} disabled={queryLoading}>{queryLoading?'Buscando…':'Buscar'}</button>
                    <button className="btn-outline" onClick={reloadAllUsers} disabled={queryLoading}>Limpiar</button>
                </div>
                {queryError&&<div className="admin-error" style={{marginTop:'.5rem'}}>{queryError}</div>}

                {loadingUsers ? <div className="admin-loading">Cargando usuarios…</div>
                    : usersError ? <div className="admin-error">{usersError}</div>
                        : (
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th className="col-select"><input type="checkbox" onChange={toggleSelectAll} checked={isAllSelected} aria-label="Seleccionar todo"/></th>
                                        <th>ID</th><th>Username</th><th>Email</th><th>Rol</th><th>Género</th><th>Edad</th><th>Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map(u=>(
                                        <tr key={u.id??u.email}>
                                            <td className="col-select"><input type="checkbox" aria-label={`Seleccionar ${u.email||u.username||u.id}`} checked={typeof u.id==='number'?selectedIds.has(u.id):false} onChange={()=>toggleSelect(u.id)} disabled={typeof u.id!=='number'}/></td>
                                            <td>{u.id??'—'}</td>
                                            <td>{u.username??'—'}</td>
                                            <td>{u.email??'—'}</td>
                                            <td><span className={`badge ${u.role==='ADMIN'?'badge-role-admin':'badge-role'}`}>{translateMetricLabel(u.role||'—')}</span></td>
                                            <td><span className="badge">{translateMetricLabel(u.gender||'—')}</span></td>
                                            <td>{(()=>{const a=computeAge(u.birthdate);return a!==undefined?a:'—';})()}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn-icon" onClick={()=>openEdit(u)} title="Editar usuario" aria-label="Editar usuario">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2 1.5h.88l9.9-9.9-.88-.88-9.9 9.9v.88ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>
                                                    </button>
                                                    <button className="btn-danger" onClick={()=>deleteUserRow(u.id,u.email||u.username)} disabled={deletingId===u.id} title="Eliminar usuario" aria-label="Eliminar usuario">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Zm-1 4a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Z"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {deleteError&&<div className="admin-error" style={{marginTop:'.5rem'}}>{deleteError}</div>}
                            </div>
                        )}
            </div>

            {/* Edit Modal */}
            {editingId!==null&&(
                <div className="admin-modal-backdrop" onClick={closeEdit}>
                    <div className="admin-modal" onClick={e=>e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h4>Editar usuario #{editingId}</h4>
                            <button className="modal-close" onClick={closeEdit} aria-label="Cerrar">✕</button>
                        </div>

                        <div className="admin-modal-body">
                            {/* Identidad */}
                            <div className="modal-section-label">Identidad</div>
                            <div className={`modal-form-row${ef('email').hasError?' has-error':''}`}>
                                <label><IcoMail/> Correo electrónico</label>
                                <input type="email" value={editForm.email||''} onChange={e=>onEditChange('email',e.target.value)} onBlur={()=>onEditBlur('email')} placeholder="correo@ejemplo.com" disabled={editLoading}/>
                                {ef('email').error&&<span className="modal-field-error">{ef('email').error}</span>}
                            </div>
                            <div className={`modal-form-row${ef('username').hasError?' has-error':''}`}>
                                <label><IcoUser/> Nombre de usuario</label>
                                <input type="text" value={editForm.username||''} onChange={e=>onEditChange('username',e.target.value)} onBlur={()=>onEditBlur('username')} placeholder="ej. john_doe" disabled={editLoading}/>
                                {ef('username').error&&<span className="modal-field-error">{ef('username').error}</span>}
                            </div>

                            {/* Configuración */}
                            <div className="modal-section-label" style={{marginTop:'.25rem'}}>Configuración</div>
                            <div className="modal-grid">
                                <div className="modal-form-row">
                                    <label><IcoShield/> Rol</label>
                                    <select value={editForm.role||'USER'} onChange={e=>onEditChange('role',e.target.value)} disabled={editLoading}>
                                        <option value="USER">Usuario</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="modal-form-row">
                                    <label><IcoGender/> Género</label>
                                    <select value={editForm.gender||''} onChange={e=>onEditChange('gender',e.target.value)} disabled={editLoading}>
                                        <option value="">—</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                        <option value="O">Otro</option>
                                    </select>
                                </div>
                                <div className={`modal-form-row${ef('birthdate').hasError?' has-error':''}`}>
                                    <label><IcoCal/> Nacimiento</label>
                                    <input type="date" value={editForm.birthdate||''} onChange={e=>onEditChange('birthdate',e.target.value)} onBlur={()=>onEditBlur('birthdate')} disabled={editLoading} style={{colorScheme:'dark'}}/>
                                    {ef('birthdate').error&&<span className="modal-field-error">{ef('birthdate').error}</span>}
                                </div>
                            </div>

                            {editServerError&&<div className="admin-error" style={{marginTop:'.25rem',padding:'.5rem .75rem',background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.3)',borderRadius:8}}>{editServerError}</div>}
                        </div>

                        <div className="admin-modal-actions">
                            <button className="btn-outline" onClick={closeEdit} disabled={editLoading}>Cancelar</button>
                            <button className="btn" onClick={saveEdit} disabled={editLoading}>
                                {editLoading&&<span className="modal-btn-spinner"/>}
                                {editLoading?'Guardando…':'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;