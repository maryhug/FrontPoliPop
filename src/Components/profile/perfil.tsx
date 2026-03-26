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
    if (typeof parsed.id === 'number' && Number.isFinite(parsed.id)) {
      return parsed.id;
    }
    if (typeof parsed.id === 'string' && parsed.id.trim().length > 0) {
      const converted = Number(parsed.id);
      return Number.isFinite(converted) ? converted : null;
    }
  } catch {
    return null;
  }

  return null;
};

const getStoredIdentity = (): StoredUserIdentity => {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return {
      id: null,
      email: '',
      username: '',
      fullName: '',
      phone: '',
      birthdate: '',
      gender: '',
      country: '',
      countryId: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawId = parsed.id;
    const rawCountryId = parsed.countryId;

    const id =
      typeof rawId === 'number'
        ? rawId
        : (typeof rawId === 'string' && rawId.trim().length > 0 ? Number(rawId) : null);

    const countryId =
      typeof rawCountryId === 'number'
        ? rawCountryId
        : (typeof rawCountryId === 'string' && rawCountryId.trim().length > 0 ? Number(rawCountryId) : null);

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
    return {
      id: null,
      email: '',
      username: '',
      fullName: '',
      phone: '',
      birthdate: '',
      gender: '',
      country: '',
      countryId: null,
    };
  }
};

const initialForm: ProfileFormState = {
  username: '',
  email: '',
  fullName: '',
  phone: '',
  birthdate: '',
  gender: '',
  countryId: '',
};

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadProfile = async (): Promise<void> => {
      setLoading(true);
      setError('');

      try {
        const storedIdentity = getStoredIdentity();
        const userId = storedIdentity.id ?? getCurrentUserIdFromStorage();

        const [countriesData, gendersData] = await Promise.all([
          apiService.getCountries().catch(() => []),
          apiService.getGenders().catch(() => []),
        ]);

        let userData: User | null = null;

        if (userId !== null) {
          try {
            userData = await apiService.getUserById(userId);
          } catch {
            userData = null;
          }
        }

        if (!userData && storedIdentity.email.trim().length > 0) {
          try {
            userData = await apiService.getUserByEmail(storedIdentity.email.trim());
          } catch {
            userData = null;
          }
        }

        if (!userData && storedIdentity.username.trim().length > 0) {
          try {
            userData = await apiService.getUserByUsername(storedIdentity.username.trim());
          } catch {
            userData = null;
          }
        }

        const effectiveUser: User = userData ?? {
          id: userId ?? undefined,
          email: storedIdentity.email,
          username: storedIdentity.username,
          fullName: storedIdentity.fullName,
          phone: storedIdentity.phone,
          birthdate: storedIdentity.birthdate,
          gender: storedIdentity.gender,
          country: storedIdentity.country,
          countryId: storedIdentity.countryId ?? undefined,
        };

        if (!effectiveUser.id && !effectiveUser.email && !effectiveUser.username) {
          setError('No se pudo identificar al usuario autenticado. Inicia sesión nuevamente.');
          setLoading(false);
          return;
        }

        const normalizedCountries = countriesData
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

        const countryByName = normalizedCountries.find(
          (country) => country.name.toLowerCase() === (effectiveUser.country || '').toLowerCase(),
        );

        setCurrentUser(effectiveUser);
        setCountries(normalizedCountries);
        setGenders(gendersData);
        setForm({
          username: effectiveUser.username ?? '',
          email: effectiveUser.email ?? '',
          fullName: effectiveUser.fullName ?? '',
          phone: effectiveUser.phone ?? '',
          birthdate: effectiveUser.birthdate ? effectiveUser.birthdate.slice(0, 10) : '',
          gender: effectiveUser.gender ?? '',
          countryId:
            effectiveUser.countryId !== undefined
              ? String(effectiveUser.countryId)
              : countryByName
                ? String(countryByName.id)
                : '',
        });

        if (!userData) {
          setError('Mostrando datos locales del perfil. Guarda cambios para sincronizar con el backend.');
        }
      } catch (loadError) {
        console.error(loadError);
        setError('No se pudieron cargar tus datos de perfil.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!currentUser?.id) {
      setError('No se encontro el usuario para actualizar.');
      return;
    }

    if (!form.email.trim()) {
      setError('El correo es obligatorio.');
      return;
    }

    if (!form.username.trim()) {
      setError('El nombre de usuario es obligatorio.');
      return;
    }

    if (!form.fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const selectedCountry = countries.find((country) => String(country.id) === form.countryId);

    try {
      const payload: UpdateUserProfileRequest = {
        email: form.email.trim(),
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        role: currentUser.role,
        phone: form.phone.trim() || undefined,
        birthdate: form.birthdate || undefined,
        gender: form.gender || undefined,
        countryId: form.countryId ? Number(form.countryId) : undefined,
      };

      const updated = await apiService.updateUser(currentUser.id, payload);
      setCurrentUser(updated);
      setSuccess('Perfil actualizado correctamente.');

      const storedRaw = localStorage.getItem('user');
      let storedUser: Record<string, unknown> = {};
      if (storedRaw) {
        try {
          storedUser = JSON.parse(storedRaw) as Record<string, unknown>;
        } catch {
          storedUser = {};
        }
      }
      const updatedLocalUser = {
        ...storedUser,
        id: updated.id ?? currentUser.id,
        email: updated.email ?? form.email.trim(),
        username: updated.username ?? form.username.trim(),
        role: updated.role ?? storedUser.role,
        gender: updated.gender ?? (form.gender || undefined),
        country: updated.country ?? selectedCountry?.name,
        countryId: updated.countryId ?? (form.countryId ? Number(form.countryId) : undefined),
        birthdate: updated.birthdate ?? (form.birthdate || undefined),
        fullName: updated.fullName ?? (form.fullName || undefined),
        phone: updated.phone ?? (form.phone || undefined),
      };
      localStorage.setItem('user', JSON.stringify(updatedLocalUser));
    } catch (saveError) {
      console.error(saveError);
      const detail = saveError instanceof Error ? saveError.message : '';
      setError(detail ? `No se pudo actualizar el perfil: ${detail}` : 'No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page profile-loading">Cargando perfil...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Mi Perfil</h2>
          <p>Edita tus datos personales (sin cambiar la contraseña por ahora).</p>
        </div>

        {error && <div className="profile-alert profile-alert-error">{error}</div>}
        {success && <div className="profile-alert profile-alert-success">{success}</div>}

        <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={handleInputChange}
            required
            disabled={saving}
          />

          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleInputChange}
            required
            disabled={saving}
          />

          <label htmlFor="fullName">Nombre completo</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleInputChange}
            disabled={saving}
          />

          <label htmlFor="phone">Telefono</label>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleInputChange}
            disabled={saving}
          />

          <label htmlFor="birthdate">Fecha de nacimiento</label>
          <input
            id="birthdate"
            type="date"
            name="birthdate"
            value={form.birthdate}
            onChange={handleInputChange}
            disabled={saving}
          />

          <label htmlFor="gender">Genero</label>
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleInputChange}
            disabled={saving}
          >
            <option value="">Selecciona genero</option>
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>

          <label htmlFor="countryId">Pais</label>
          <select
            id="countryId"
            name="countryId"
            value={form.countryId}
            onChange={handleInputChange}
            disabled={saving || countries.length === 0}
          >
            <option value="">Selecciona pais</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>

          <div className="profile-actions">
            <button type="button" className="profile-btn-secondary" onClick={() => navigate('/home')} disabled={saving}>
              Volver
            </button>
            <button type="submit" className="profile-btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Perfil;

