import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './perfil.css';
import {
    apiService,
    type CountryOption,
    type UpdateUserProfileRequest,
    type User,
} from '../../services/api';

interface ProfileFormState {
    username: string;
    email: string;
    fullName: string;
    phone: string;
    birthdate: string;
    gender: string;
    countryId: string;
}

interface FormErrors {
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    birthdate?: string;
}

interface StoredUserIdentity {
    id: number | null;
    email: string;
    username: string;
    fullName: string;
    phone: string;
    birthdate: string;
    gender: string;
    country: string;
    countryId: number | null;
}

const getCurrentUserIdFromStorage = (): number | null => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { id?: number | string };
        if (typeof parsed.id === 'number' && Number.isFinite(parsed.id)) return parsed.id;
        if (typeof parsed.id === 'string' && parsed.id.trim().length > 0) {
            const converted = Number(parsed.id);
            return Number.isFinite(converted) ? converted : null;
        }
    } catch { return null; }
    return null;
};

const getStoredIdentity = (): StoredUserIdentity => {
    const raw = localStorage.getItem('user');
    if (!raw) return { id: null, email: '', username: '', fullName: '', phone: '', birthdate: '', gender: '', country: '', countryId: null };
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const rawId = parsed.id;
        const rawCountryId = parsed.countryId;
        const id = typeof rawId === 'number' ? rawId : (typeof rawId === 'string' && rawId.trim().length > 0 ? Number(rawId) : null);
        const countryId = typeof rawCountryId === 'number' ? rawCountryId : (typeof rawCountryId === 'string' && rawCountryId.trim().length > 0 ? Number(rawCountryId) : null);
        return {
            id: Number.isFinite(id as number) ? (id as number) : null,
            email: typeof parsed.email === 'string' ? parsed.email : '',
            username: typeof parsed.username === 'string' ? parsed.username : '',
            fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
            phone: typeof parsed.phone === 'string' ? parsed.phone : '',
            birthdate: typeof parsed.birthdate === 'string' ? parsed.birthdate : '',
            gender: typeof parsed.gender === 'string' ? parsed.gender : '',
            country: typeof parsed.country === 'string' ? parsed.country : '',
            countryId: Number.isFinite(countryId as number) ? (countryId as number) : null,
        };
    } catch {
        return { id: null, email: '', username: '', fullName: '', phone: '', birthdate: '', gender: '', country: '', countryId: null };
    }
};

// ── Icons ──────────────────────────────────────────────────────────────────
const IconUser = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
);
const IconMail = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
    </svg>
);
const IconId = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>
    </svg>
);
const IconPhone = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
);
const IconCalendar = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const IconGender = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="11" r="4"/><path d="M17 3h4v4"/><path d="m21 3-4.9 4.9"/><path d="M12 15v7"/><path d="M9 19h6"/>
    </svg>
);
const IconGlobe = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
);
const IconArrowLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
);
const IconSave = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
);
const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const IconAlert = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

// ── Validation ─────────────────────────────────────────────────────────────
const validateForm = (form: ProfileFormState): FormErrors => {
    const errors: FormErrors = {};

    if (!form.username.trim()) {
        errors.username = 'El nombre de usuario es obligatorio.';
    } else if (form.username.trim().length < 3) {
        errors.username = 'Mínimo 3 caracteres.';
    } else if (form.username.trim().length > 30) {
        errors.username = 'Máximo 30 caracteres.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) {
        errors.username = 'Solo letras, números, puntos, guiones y guiones bajos.';
    }

    if (!form.email.trim()) {
        errors.email = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = 'Ingresa un correo válido.';
    }

    if (!form.fullName.trim()) {
        errors.fullName = 'El nombre completo es obligatorio.';
    } else if (form.fullName.trim().length < 2) {
        errors.fullName = 'Mínimo 2 caracteres.';
    } else if (form.fullName.trim().length > 80) {
        errors.fullName = 'Máximo 80 caracteres.';
    }

    if (form.phone.trim() && !/^[+\d\s\-().]{7,20}$/.test(form.phone.trim())) {
        errors.phone = 'Formato de teléfono inválido.';
    }

    if (form.birthdate) {
        const birth = new Date(form.birthdate);
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear();
        if (birth > now) {
            errors.birthdate = 'La fecha no puede ser futura.';
        } else if (age > 120) {
            errors.birthdate = 'Fecha de nacimiento inválida.';
        } else if (age < 5) {
            errors.birthdate = 'Debes tener al menos 5 años.';
        }
    }

    return errors;
};

const initialForm: ProfileFormState = { username: '', email: '', fullName: '', phone: '', birthdate: '', gender: '', countryId: '' };

// ── Component ──────────────────────────────────────────────────────────────
const Perfil: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [genders, setGenders] = useState<string[]>([]);
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [form, setForm] = useState<ProfileFormState>(initialForm);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof ProfileFormState, boolean>>>({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login', { replace: true }); return; }

        const loadProfile = async (): Promise<void> => {
            setLoading(true); setError('');
            try {
                const storedIdentity = getStoredIdentity();
                const userId = storedIdentity.id ?? getCurrentUserIdFromStorage();
                const [countriesData, gendersData] = await Promise.all([
                    apiService.getCountries().catch(() => []),
                    apiService.getGenders().catch(() => []),
                ]);
                let userData: User | null = null;
                if (userId !== null) { try { userData = await apiService.getUserById(userId); } catch { userData = null; } }
                if (!userData && storedIdentity.email.trim().length > 0) { try { userData = await apiService.getUserByEmail(storedIdentity.email.trim()); } catch { userData = null; } }
                if (!userData && storedIdentity.username.trim().length > 0) { try { userData = await apiService.getUserByUsername(storedIdentity.username.trim()); } catch { userData = null; } }
                const effectiveUser: User = userData ?? { id: userId ?? undefined, email: storedIdentity.email, username: storedIdentity.username, fullName: storedIdentity.fullName, phone: storedIdentity.phone, birthdate: storedIdentity.birthdate, gender: storedIdentity.gender, country: storedIdentity.country, countryId: storedIdentity.countryId ?? undefined };
                if (!effectiveUser.id && !effectiveUser.email && !effectiveUser.username) { setError('No se pudo identificar al usuario. Inicia sesión nuevamente.'); setLoading(false); return; }
                const normalizedCountries = countriesData.slice().sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
                const countryByName = normalizedCountries.find(c => c.name.toLowerCase() === (effectiveUser.country || '').toLowerCase());
                setCurrentUser(effectiveUser); setCountries(normalizedCountries); setGenders(gendersData);
                setForm({ username: effectiveUser.username ?? '', email: effectiveUser.email ?? '', fullName: effectiveUser.fullName ?? '', phone: effectiveUser.phone ?? '', birthdate: effectiveUser.birthdate ? effectiveUser.birthdate.slice(0, 10) : '', gender: effectiveUser.gender ?? '', countryId: effectiveUser.countryId !== undefined ? String(effectiveUser.countryId) : countryByName ? String(countryByName.id) : '' });
                if (!userData) setError('Mostrando datos locales. Guarda para sincronizar.');
            } catch (e) { console.error(e); setError('No se pudieron cargar tus datos de perfil.'); }
            finally { setLoading(false); }
        };
        void loadProfile();
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (success) setSuccess('');
        // Validate on change if already touched
        if (touched[name as keyof ProfileFormState]) {
            const newForm = { ...form, [name]: value };
            const errs = validateForm(newForm);
            setFieldErrors(prev => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const errs = validateForm(form);
        setFieldErrors(prev => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        // Touch all fields
        const allTouched: Partial<Record<keyof ProfileFormState, boolean>> = {};
        (Object.keys(form) as Array<keyof ProfileFormState>).forEach(k => { allTouched[k] = true; });
        setTouched(allTouched);
        const errs = validateForm(form);
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) { setError('Corrige los errores antes de guardar.'); return; }
        if (!currentUser?.id) { setError('No se encontró el usuario para actualizar.'); return; }
        setSaving(true); setError(''); setSuccess('');
        const selectedCountry = countries.find(c => String(c.id) === form.countryId);
        try {
            const payload: UpdateUserProfileRequest = { email: form.email.trim(), username: form.username.trim(), fullName: form.fullName.trim(), role: currentUser.role, phone: form.phone.trim() || undefined, birthdate: form.birthdate || undefined, gender: form.gender || undefined, countryId: form.countryId ? Number(form.countryId) : undefined };
            const updated = await apiService.updateUser(currentUser.id, payload);
            setCurrentUser(updated); setSuccess('¡Perfil actualizado correctamente!');
            const storedRaw = localStorage.getItem('user');
            let storedUser: Record<string, unknown> = {};
            if (storedRaw) { try { storedUser = JSON.parse(storedRaw) as Record<string, unknown>; } catch { storedUser = {}; } }
            localStorage.setItem('user', JSON.stringify({ ...storedUser, id: updated.id ?? currentUser.id, email: updated.email ?? form.email.trim(), username: updated.username ?? form.username.trim(), role: updated.role ?? storedUser.role, gender: updated.gender ?? (form.gender || undefined), country: updated.country ?? selectedCountry?.name, countryId: updated.countryId ?? (form.countryId ? Number(form.countryId) : undefined), birthdate: updated.birthdate ?? (form.birthdate || undefined), fullName: updated.fullName ?? (form.fullName || undefined), phone: updated.phone ?? (form.phone || undefined) }));
        } catch (saveError) {
            console.error(saveError);
            const detail = saveError instanceof Error ? saveError.message : '';
            setError(detail ? `No se pudo actualizar el perfil: ${detail}` : 'No se pudo actualizar el perfil.');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="profile-page profile-loading">
                <div className="loading-dots"><span /><span /><span /></div>
                <span>Cargando perfil…</span>
            </div>
        );
    }

    const userInitial = (form.fullName || form.username || '?').charAt(0).toUpperCase();

    return (
        <div className="profile-page">
            <div className="profile-card">

                {/* Avatar strip */}
                <div className="profile-avatar-strip">
                    <div className="profile-avatar">{userInitial}</div>
                    <div className="profile-identity">
                        <span className="profile-identity-name">{form.fullName || form.username || 'Usuario'}</span>
                        <span className="profile-identity-email">{form.email}</span>
                    </div>
                </div>

                <div className="profile-divider" />

                <div className="profile-header">
                    <h2>Editar perfil</h2>
                    <p>Actualiza tus datos personales.</p>
                </div>

                {error && (
                    <div className="profile-alert profile-alert-error">
                        <IconAlert /><span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="profile-alert profile-alert-success">
                        <IconCheck /><span>{success}</span>
                    </div>
                )}

                <form className="profile-form" onSubmit={(e) => void handleSubmit(e)} noValidate>

                    {/* Row 1: username + email */}
                    <div className="profile-row">
                        <div className={`profile-field ${fieldErrors.username && touched.username ? 'has-error' : ''}`}>
                            <label htmlFor="username"><IconUser /> Nombre de usuario</label>
                            <input id="username" name="username" value={form.username} onChange={handleInputChange} onBlur={handleBlur} required disabled={saving} placeholder="ej. john_doe" autoComplete="username" />
                            {fieldErrors.username && touched.username && <span className="field-error">{fieldErrors.username}</span>}
                        </div>
                        <div className={`profile-field ${fieldErrors.email && touched.email ? 'has-error' : ''}`}>
                            <label htmlFor="email"><IconMail /> Correo electrónico</label>
                            <input id="email" type="email" name="email" value={form.email} onChange={handleInputChange} onBlur={handleBlur} required disabled={saving} placeholder="correo@ejemplo.com" autoComplete="email" />
                            {fieldErrors.email && touched.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>
                    </div>

                    {/* Row 2: fullName + phone */}
                    <div className="profile-row">
                        <div className={`profile-field ${fieldErrors.fullName && touched.fullName ? 'has-error' : ''}`}>
                            <label htmlFor="fullName"><IconId /> Nombre completo</label>
                            <input id="fullName" name="fullName" value={form.fullName} onChange={handleInputChange} onBlur={handleBlur} disabled={saving} placeholder="Tu nombre completo" autoComplete="name" />
                            {fieldErrors.fullName && touched.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                        </div>
                        <div className={`profile-field ${fieldErrors.phone && touched.phone ? 'has-error' : ''}`}>
                            <label htmlFor="phone"><IconPhone /> Teléfono</label>
                            <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleInputChange} onBlur={handleBlur} disabled={saving} placeholder="+57 300 000 0000" autoComplete="tel" />
                            {fieldErrors.phone && touched.phone && <span className="field-error">{fieldErrors.phone}</span>}
                        </div>
                    </div>

                    {/* Row 3: birthdate + gender */}
                    <div className="profile-row">
                        <div className={`profile-field ${fieldErrors.birthdate && touched.birthdate ? 'has-error' : ''}`}>
                            <label htmlFor="birthdate"><IconCalendar /> Fecha de nacimiento</label>
                            <input id="birthdate" type="date" name="birthdate" value={form.birthdate} onChange={handleInputChange} onBlur={handleBlur} disabled={saving} />
                            {fieldErrors.birthdate && touched.birthdate && <span className="field-error">{fieldErrors.birthdate}</span>}
                        </div>
                        <div className="profile-field">
                            <label htmlFor="gender"><IconGender /> Género</label>
                            <select id="gender" name="gender" value={form.gender} onChange={handleInputChange} disabled={saving}>
                                <option value="">Selecciona género</option>
                                {genders.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 4: country full width */}
                    <div className="profile-row">
                        <div className="profile-field profile-field--full">
                            <label htmlFor="countryId"><IconGlobe /> País</label>
                            <select id="countryId" name="countryId" value={form.countryId} onChange={handleInputChange} disabled={saving || countries.length === 0}>
                                <option value="">Selecciona país</option>
                                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button type="button" className="profile-btn-secondary" onClick={() => navigate('/home')} disabled={saving}>
                            <IconArrowLeft /> Volver
                        </button>
                        <button type="submit" className="profile-btn-primary" disabled={saving}>
                            {saving ? (
                                <><span className="btn-spinner" /> Guardando…</>
                            ) : (
                                <><IconSave /> Guardar cambios</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Perfil;