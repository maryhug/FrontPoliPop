// src/services/api.ts

// Obtiene la URL base de la API desde las variables de entorno o usa localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ========== INTERFACES DE TIPOS ==========

// Interface para la petición de login
export interface LoginRequest {
  email: string;      // Email del usuario
  password: string;   // Contraseña del usuario
}

// Interface para la respuesta de autenticación exitosa
export interface AuthResponse {
  token: string;    // JWT token para autenticación
  id: number;       // ID único del usuario
  email: string;    // Email del usuario
  username: string; // Nombre de usuario
}

// Interface básica de usuario (datos mínimos)
export interface User {
  id?: number;           // ID único (opcional porque puede no existir al crear)
  email: string;         // Email del usuario
  username: string;      // Nombre de usuario
  passwordHash?: string; // Hash de la contraseña (opcional)
}

// Interface extendida para guardar/actualizar usuario con todos los campos posibles
export interface UserSave {
  id?: number;              // ID único (opcional)
  email: string;            // Email del usuario
  username: string;         // Nombre de usuario
  passwordHash?: string;    // Hash de la contraseña
  fullName?: string;        // Nombre completo del usuario
  phone?: string;           // Número de teléfono
  createdAt?: string;       // Fecha de creación de la cuenta
  role?: string;            // Rol del usuario (USER, ADMIN, etc.)
  gender?: string;          // Género del usuario
  country?: string;         // País de residencia
  birthdate?: string;       // Fecha de nacimiento
  favoriteMovie?: string;   // Nombre de película favorita
  favoriteMovieId?: number; // ID de película favorita
}

// ========== CLASE DE SERVICIO API ==========

class ApiService {
  private baseUrl: string; // URL base para todas las peticiones

  // Constructor que inicializa la URL base
  constructor() {
    this.baseUrl = `${API_URL}/pelipop`;
  }

  // ========== MÉTODOS PRIVADOS (UTILIDADES) ==========

  /**
   * Obtiene el token JWT almacenado en localStorage
   * @returns Token de autenticación o null si no existe
   */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Genera los headers para peticiones autenticadas
   * @returns Headers con Content-Type y Authorization si existe token
   */
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      // Solo incluye Authorization si existe un token
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ========== AUTENTICACIÓN ==========

  /**
   * LOGIN - Autentica un usuario con email y contraseña
   * @param loginRequest - Objeto con email y password
   * @returns Promesa con datos de autenticación (token, id, email, username)
   * @throws Error si las credenciales son incorrectas
   */
  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/login`;
    console.log('🔍 Intentando login en:', url);
    console.log('📤 Datos enviados:', loginRequest);

    // Realiza la petición POST al endpoint de login
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest),
    });

    console.log('📥 Estado de respuesta:', response.status);

    // Verifica si la respuesta fue exitosa
    if (!response.ok) {
      // Intenta leer el mensaje de error del servidor
      const errorText = await response.text().catch(() => '');
      console.error('❌ Error del servidor:', errorText);
      throw new Error('Credenciales incorrectas');
    }

    // Retorna los datos parseados como JSON
    return response.json();
  }

  /**
   * LOGOUT - Limpia los datos de sesión del localStorage
   * Elimina el token y la información del usuario
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * VERIFICAR AUTENTICACIÓN - Comprueba si existe un token válido
   * @returns true si hay token, false si no
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ========== OPERACIONES CRUD DE USUARIOS ==========

  /**
   * CREAR USUARIO - Registra un nuevo usuario en el sistema
   * @param user - Objeto UserSave con todos los datos del usuario
   * @returns Promesa con los datos del usuario creado
   * @throws Error si falla la creación
   */
  async createUser(user: UserSave): Promise<UserSave> {
    const response = await fetch(`${this.baseUrl}/users/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user),
    });

    // Manejo de errores con intento de parsear el mensaje del servidor
    if (!response.ok) {
      // Intenta parsear el JSON de error, si falla usa el statusText
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error al crear usuario');
    }

    return response.json();
  }

  /**
   * OBTENER TODOS LOS USUARIOS - Lista completa de usuarios registrados
   * @returns Promesa con array de usuarios
   * @throws Error si falla la petición
   */
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

  /**
   * OBTENER USUARIO POR ID - Busca un usuario específico por su ID
   * @param id - ID único del usuario
   * @returns Promesa con los datos del usuario
   * @throws Error si el usuario no existe
   */
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

  /**
   * OBTENER USUARIO POR EMAIL - Busca un usuario por su correo electrónico
   * @param email - Correo electrónico del usuario
   * @returns Promesa con los datos del usuario
   * @throws Error si el usuario no existe
   */
  async getUserByEmail(email: string): Promise<User> {
    // Codifica el email para uso seguro en URL
    const response = await fetch(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    return response.json();
  }

  /**
   * OBTENER USUARIO POR USERNAME - Busca un usuario por su nombre de usuario
   * @param username - Nombre de usuario único
   * @returns Promesa con los datos del usuario
   * @throws Error si el usuario no existe
   */
  async getUserByUsername(username: string): Promise<User> {
    // Codifica el username para uso seguro en URL
    const response = await fetch(`${this.baseUrl}/users/name/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    return response.json();
  }

  /**
   * ACTUALIZAR USUARIO - Modifica los datos de un usuario existente
   * @param id - ID del usuario a actualizar
   * @param user - Objeto User con los nuevos datos
   * @returns Promesa con los datos actualizados del usuario
   * @throws Error si falla la actualización
   */
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

  /**
   * ELIMINAR USUARIO - Borra permanentemente un usuario del sistema
   * @param id - ID del usuario a eliminar
   * @returns Promesa vacía (void)
   * @throws Error si falla la eliminación
   */
  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/delete/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar usuario');
    }
  }

  // ========== OPERACIONES DE PELÍCULAS ==========

  /**
   * BUSCAR PELÍCULAS - Busca películas por término de búsqueda
   * @param query - Término de búsqueda (título, género, etc.)
   * @returns Promesa con array de películas encontradas
   * @throws Error si falla la búsqueda
   */
  async searchMovies(query: string): Promise<any[]> {
    // Retorna array vacío si no hay query
    if (!query || query.trim().length === 0) return [];

    // Codifica el query para uso seguro en URL
    const q = encodeURIComponent(query.trim());
    const url = `${this.baseUrl}/movies/search?query=${q}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(), // Incluye token si existe
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error buscando películas: ${res.status} ${text}`);
    }

    return res.json();
  }

  /**
   * OBTENER DETALLES DE PELÍCULA - Obtiene información detallada de una película
   * @param id - ID de la película
   * @returns Promesa con objeto detallado de la película
   * @throws Error si falla la petición o la película no existe
   */
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
}

// ========== EXPORTACIÓN ==========

// Exporta una instancia única del servicio (patrón Singleton)
// Esta instancia se puede importar y usar en toda la aplicación
export const apiService = new ApiService();