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
}

export interface User {
  id?: number;
  email: string;
  username: string;
  passwordHash?: string;
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
    const errorText = await response.text();
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
      throw new Error('Error al crear usuario');
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
    const response = await fetch(`${this.baseUrl}/users/email/${email}`, {
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
    const response = await fetch(`${this.baseUrl}/users/name/${username}`, {
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