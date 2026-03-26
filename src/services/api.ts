// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  username: string;
  role?: string;
  gender?: string;
  country?: string;
  birthdate?: string;
}

export interface User {
  id?: number;
  email: string;
  username: string;
  passwordHash?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  gender?: string;
  country?: string;
  countryId?: number;
  birthdate?: string; // ISO yyyy-mm-dd
  favoriteMovieId?: number;
}

const normalizeBirthdate = (raw: unknown): string | undefined => {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.slice(0, 10);
  }

  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw;
    if ([y, m, d].every((v) => typeof v === 'number' && Number.isFinite(v))) {
      const yyyy = String(y).padStart(4, '0');
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  if (raw && typeof raw === 'object') {
    const row = raw as Record<string, unknown>;
    const y = row.year;
    const m = row.monthValue ?? row.month;
    const d = row.dayOfMonth ?? row.day;
    if ([y, m, d].every((v) => typeof v === 'number' && Number.isFinite(v))) {
      const yyyy = String(y).padStart(4, '0');
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return undefined;
};

const normalizeUserObj = (raw: unknown): User | null => {
  if (!raw || typeof raw !== 'object') return null;

  const row = raw as Record<string, unknown>;
  const countryRaw = row.country;
  let countryName: string | undefined;
  let countryId: number | undefined;

  if (typeof countryRaw === 'string') {
    countryName = countryRaw;
  } else if (countryRaw && typeof countryRaw === 'object') {
    const c = countryRaw as Record<string, unknown>;
    countryName = typeof c.name === 'string' ? c.name : undefined;
    const parsed = Number(c.id);
    countryId = Number.isFinite(parsed) ? parsed : undefined;
  }

  const rawCountryId = row.countryId;
  if (countryId === undefined) {
    const parsedCountryId = Number(rawCountryId);
    countryId = Number.isFinite(parsedCountryId) ? parsedCountryId : undefined;
  }

  const rawId = row.id;
  const id = Number(rawId);

  const favoriteMovieIdParsed = Number(row.favoriteMovieId);

  return {
    id: Number.isFinite(id) ? id : undefined,
    email: typeof row.email === 'string' ? row.email : '',
    username: typeof row.username === 'string' ? row.username : '',
    passwordHash: typeof row.passwordHash === 'string' ? row.passwordHash : undefined,
    fullName: typeof row.fullName === 'string' ? row.fullName : undefined,
    phone: typeof row.phone === 'string' ? row.phone : undefined,
    role: typeof row.role === 'string' ? row.role : undefined,
    gender: typeof row.gender === 'string' ? row.gender : undefined,
    country: countryName,
    countryId,
    birthdate: normalizeBirthdate(row.birthdate),
    favoriteMovieId: Number.isFinite(favoriteMovieIdParsed) ? favoriteMovieIdParsed : undefined,
  };
};

export interface CountryOption {
  id: number;
  name: string;
}

export type UpdateUserProfileRequest = Partial<User> & {
  countryId?: number;
}

export interface UserSave {
  id?: number;
  email: string;
  username: string;
  passwordHash?: string;
  fullName?: string;
  phone?: string;
  createdAt?: string;
  role?: string;
  gender?: string;
  country?: string;
  birthdate?: string;
  favoriteMovie?: string;
  favoriteMovieId?: number;
}

export interface TMDBmovieDTO {
  id: number;
  title?: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  voteAverage?: number;
  genres?: Array<{ id: number; name: string }>;
}

export interface MyListMovieDTO extends TMDBmovieDTO {
  listItemId?: number;
  addedAt?: string;
}

const MY_LIST_PREFIX = 'pelipop:my-list:';
const TMDB_LIST_ID_PREFIX = 'pelipop:tmdb-list-id:';
const TMDB_SESSION_KEY = 'tmdbSessionId';

const mapMyListItem = (item: unknown): MyListMovieDTO => {
  const row = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
  const moviePayload = (row.movie && typeof row.movie === 'object') ? row.movie : row;

  const listItemId =
    typeof row.id === 'number'
      ? row.id
      : (typeof row.listItemId === 'number' ? row.listItemId : undefined);

  const addedAt =
    typeof row.addedAt === 'string'
      ? row.addedAt
      : (typeof row.createdAt === 'string' ? row.createdAt : undefined);

  return {
    ...normalizeMovieObj(moviePayload as any),
    listItemId,
    addedAt,
  };
};

// --- Nuevo helper: normalizar objetos película que vienen del backend/TMDB ---
function normalizeMovieObj(m: any): TMDBmovieDTO {
  if (!m) return {} as TMDBmovieDTO;
  const id = m.id ?? m.movieId ?? m.tmdbId;
  const title = m.title || m.name || m.original_title || m.originalTitle;
  const originalTitle = m.original_title || m.originalTitle || m.originalName;
  const overview = m.overview || m.description || m.tagline;
  const posterPath = m.poster_path || m.posterPath || m.poster || m.posterUrl || m.image;
  const backdropPath = m.backdrop_path || m.backdropPath || m.backdrop || undefined;
  const releaseDate = m.release_date || m.releaseDate || m.year || undefined;
  const voteAverage = typeof m.vote_average === 'number' ? m.vote_average : (typeof m.voteAverage === 'number' ? m.voteAverage : undefined);
  const genres = m.genres || m.genre_names || m.genreIds || [];
  return {
    id,
    title,
    originalTitle,
    overview,
    posterPath,
    backdropPath,
    releaseDate,
    voteAverage,
    genres,
  } as TMDBmovieDTO;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/pelipop`;
  }

  // Obtener el token del localStorage
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Headers con autenticación
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getCurrentUserId(): number | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
      const parsed = JSON.parse(rawUser) as { id?: number | string };
      const id = parsed?.id;
      if (typeof id === 'number' && Number.isFinite(id)) return id;
      if (typeof id === 'string' && id.trim().length > 0) {
        const parsedId = Number(id);
        return Number.isFinite(parsedId) ? parsedId : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private getCurrentUserScope(): string {
    const userId = this.getCurrentUserId();
    if (userId !== null) return String(userId);

    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { email?: string; username?: string };
        const email = parsed?.email?.trim();
        const username = parsed?.username?.trim();
        if (email) return email;
        if (username) return username;
      } catch {
        // fallback abajo
      }
    }

    return 'anon';
  }

  private getMyListStorageKey(): string {
    return `${MY_LIST_PREFIX}${this.getCurrentUserScope()}`;
  }

  private getTmdbListIdStorageKey(): string {
    return `${TMDB_LIST_ID_PREFIX}${this.getCurrentUserScope()}`;
  }

  private getTmdbSessionId(): string | null {
    const fromStorage = localStorage.getItem(TMDB_SESSION_KEY);
    if (fromStorage && fromStorage.trim().length > 0) return fromStorage.trim();

    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
      const parsed = JSON.parse(rawUser) as { sessionId?: string };
      const sessionId = parsed?.sessionId?.trim();
      return sessionId && sessionId.length > 0 ? sessionId : null;
    } catch {
      return null;
    }
  }

  private readLocalMyList(): MyListMovieDTO[] {
    const raw = localStorage.getItem(this.getMyListStorageKey());
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(mapMyListItem).filter((movie) => typeof movie.id === 'number');
    } catch {
      return [];
    }
  }

  private writeLocalMyList(movies: MyListMovieDTO[]): void {
    localStorage.setItem(this.getMyListStorageKey(), JSON.stringify(movies));
  }

  private getStoredTmdbListId(): number | null {
    const raw = localStorage.getItem(this.getTmdbListIdStorageKey());
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private setStoredTmdbListId(listId: number): void {
    localStorage.setItem(this.getTmdbListIdStorageKey(), String(listId));
  }

  private buildMyListPayload(movie: Pick<TMDBmovieDTO, 'id'> & Partial<TMDBmovieDTO>): Record<string, unknown> {
    const userId = this.getCurrentUserId();
    return {
      userId,
      movieId: movie.id,
      tmdbId: movie.id,
      id: movie.id,
      title: movie.title,
      originalTitle: movie.originalTitle,
      overview: movie.overview,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      releaseDate: movie.releaseDate,
      voteAverage: movie.voteAverage,
      genres: movie.genres,
    };
  }

  private async ensureTmdbListId(sessionId: string): Promise<number | null> {
    const existing = this.getStoredTmdbListId();
    if (existing !== null) return existing;

    const rawUser = localStorage.getItem('user');
    let username = 'Usuario';
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { username?: string; email?: string };
        username = parsed?.username || parsed?.email || username;
      } catch {
        // nombre por defecto
      }
    }

    const response = await fetch(`${this.baseUrl}/movies/lists`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        sessionId,
        name: `Mi Lista ${username}`,
        description: 'Lista creada desde PeliPop',
        language: 'es-ES',
      }),
    });

    if (!response.ok) return null;

    const payload = await response.json().catch(() => ({}));
    const listIdRaw = payload?.list_id ?? payload?.listId ?? payload?.id;
    const listId = Number(listIdRaw);
    if (!Number.isFinite(listId)) return null;

    this.setStoredTmdbListId(listId);
    return listId;
  }

  async getMyList(): Promise<MyListMovieDTO[]> {
    return this.readLocalMyList();
  }

  async addToMyList(movie: Pick<TMDBmovieDTO, 'id'> & Partial<TMDBmovieDTO>): Promise<void> {
    const normalized = mapMyListItem(this.buildMyListPayload(movie));
    if (typeof normalized.id !== 'number' || !Number.isFinite(normalized.id)) {
      throw new Error('La pelicula no tiene id valido.');
    }

    const current = this.readLocalMyList();
    const exists = current.some((m) => m.id === normalized.id);
    if (!exists) {
      const next: MyListMovieDTO[] = [{ ...normalized, addedAt: new Date().toISOString() }, ...current];
      this.writeLocalMyList(next);
    }

    // Sin sessionId no se puede sincronizar con TMDB, pero la lista local del usuario sigue funcionando.
    const sessionId = this.getTmdbSessionId();
    if (!sessionId) return;

    try {
      const listId = await this.ensureTmdbListId(sessionId);
      if (!listId) return;

      await fetch(`${this.baseUrl}/movies/lists/${listId}/items`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionId, mediaId: normalized.id }),
      });
    } catch {
      // No bloquea UX local si falla sincronizacion remota.
    }
  }

  async removeFromMyList(movieId: number): Promise<void> {
    const current = this.readLocalMyList();
    this.writeLocalMyList(current.filter((movie) => movie.id !== movieId));

    const sessionId = this.getTmdbSessionId();
    const listId = this.getStoredTmdbListId();
    if (!sessionId || !listId) return;

    try {
      await fetch(`${this.baseUrl}/movies/lists/${listId}/items/${movieId}?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
    } catch {
      // No bloquea UX local si falla sincronizacion remota.
    }
  }

  // LOGIN
  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/login`;
    console.log('🔍 Intentando login en:', url);
    console.log('📤 Datos enviados:', loginRequest);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest),
    });

    console.log('📥 Estado de respuesta:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Error del servidor:', errorText);
      throw new Error('Credenciales incorrectas');
    }

    return response.json();
  }

  // CREAR USUARIO
  async createUser(user: UserSave): Promise<UserSave> {
    const response = await fetch(`${this.baseUrl}/users/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      // intento parsear mensaje de error
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error al crear usuario');
    }

    return response.json();
  }

  // OBTENER TODOS LOS USUARIOS
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }

    return response.json();
  }

  // OBTENER USUARIO POR ID
  async getUserById(id: number): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/users/id/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    const payload = await response.json().catch(() => null);
    return normalizeUserObj(payload);
  }

  // OBTENER USUARIO POR EMAIL
  async getUserByEmail(email: string): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    const payload = await response.json().catch(() => null);
    return normalizeUserObj(payload);
  }

  // OBTENER USUARIO POR USERNAME
  async getUserByUsername(username: string): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/users/name/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    const payload = await response.json().catch(() => null);
    return normalizeUserObj(payload);
  }

  // ACTUALIZAR USUARIO
  async updateUser(id: number, user: UpdateUserProfileRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/update/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const detail = errorBody?.trim() || response.statusText || 'sin detalle';
      throw new Error(`Error al actualizar usuario (${response.status}): ${detail}`);
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeUserObj(payload);
    if (!normalized) {
      throw new Error('Error al actualizar usuario');
    }
    return normalized;
  }

  // ELIMINAR USUARIO
  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/delete/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar usuario');
    }
  }

  // Ejemplo: Buscar películas (usa el endpoint del backend) - ahora normalizamos la respuesta
  async searchMovies(query: string): Promise<TMDBmovieDTO[]> {
    if (!query || query.trim().length === 0) return [];
    const q = encodeURIComponent(query.trim());
    const url = `${this.baseUrl}/movies/search?query=${q}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(), // no hace daño incluir token si existe
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error buscando películas: ${res.status} ${text}`);
    }
    const data = await res.json().catch(() => []);
    if (!Array.isArray(data)) return [];
    return data.map(normalizeMovieObj);
  }

  // Obtener detalles de película por id (normalizado)
  async getMovieDetails(id: number): Promise<TMDBmovieDTO> {
    const url = `${this.baseUrl}/movies/details/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error obteniendo detalles de la película: ${res.status} ${text}`);
    }
    const raw = await res.json().catch(() => ({}));
    return normalizeMovieObj(raw);
  }

  // POPULARES
  async getPopularMovies(): Promise<TMDBmovieDTO[]> {
    const url = `${this.baseUrl}/movies/popular`;
    const res = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error cargando populares: ${res.status} ${text}`);
    }
    const data = await res.json().catch(() => []);
    if (!Array.isArray(data)) return [];
    return data.map(normalizeMovieObj);
  }

  // ANALYTICS
  async analyticsSync(): Promise<string> {
    const url = `${this.baseUrl}/admin/analytics/sync`;
    const res = await fetch(url, { method: 'POST', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al ejecutar ETL: ${res.status} ${text}`);
    }
    // backend responde texto simple
    return res.text();
  }

  async analyticsSummary<T = any>(): Promise<T> {
    const url = `${this.baseUrl}/admin/analytics/summary`;
    const res = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al obtener summary: ${res.status} ${text}`);
    }
    return res.json();
  }

  // Nuevos endpoints: countries y genders
  async getCountries(): Promise<CountryOption[]> {
    const url = `${this.baseUrl}/countries`;
    const res = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error cargando países: ${res.status} ${text}`);
    }
    const raw = await res.json().catch(() => [] as unknown[]);
    if (!Array.isArray(raw)) return [];

    return raw
      .map((country, index) => {
        if (typeof country === 'string') {
          const name = country.trim();
          if (!name) return null;
          return { id: index + 1, name };
        }

        if (country && typeof country === 'object') {
          const row = country as Record<string, unknown>;
          const parsedId = Number(row.id ?? row.countryId ?? index + 1);
          const id = Number.isFinite(parsedId) ? parsedId : index + 1;
          const nameCandidate = row.name ?? row.country;
          const name = typeof nameCandidate === 'string' ? nameCandidate.trim() : '';
          if (!name) return null;
          return { id, name };
        }

        return null;
      })
      .filter((country): country is CountryOption => country !== null);
  }

  async getGenders(): Promise<string[]> {
    const url = `${this.baseUrl}/genders`;
    const res = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error cargando géneros: ${res.status} ${text}`);
    }
    return res.json();
  }

  // LOGOUT (limpiar localStorage)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // VERIFICAR SI ESTÁ AUTENTICADO
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiService = new ApiService();