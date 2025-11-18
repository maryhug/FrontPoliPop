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
}

export interface User {
  id?: number;
  email: string;
  username: string;
  passwordHash?: string;
  role?: string;
  gender?: string;
  birthdate?: string; // ISO yyyy-mm-dd
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
  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/id/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    return response.json();
  }

  // OBTENER USUARIO POR EMAIL
  async getUserByEmail(email: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    return response.json();
  }

  // OBTENER USUARIO POR USERNAME
  async getUserByUsername(username: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/name/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    return response.json();
  }

  // ACTUALIZAR USUARIO
  async updateUser(id: number, user: User): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/update/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar usuario');
    }

    return response.json();
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

  // Ejemplo: Buscar películas (usa el endpoint del backend)
  async searchMovies(query: string): Promise<any[]> {
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
    return res.json();
  }

  // Obtener detalles de película por id
  async getMovieDetails(id: number): Promise<any> {
    const url = `${this.baseUrl}/movies/details/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error obteniendo detalles de la película: ${res.status} ${text}`);
    }
    return res.json();
  }

  // POPULARES
  async getPopularMovies(): Promise<TMDBmovieDTO[]> {
    const url = `${this.baseUrl}/movies/popular`;
    const res = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error cargando populares: ${res.status} ${text}`);
    }
    return res.json();
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