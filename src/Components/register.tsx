// src/pages/RegisterInicial.tsx

// Importaciones necesarias de React para manejo de estado y tipos
import React, { useState, type ChangeEvent, type FormEvent } from "react";
// Hook de react-router para navegación programática
import { useNavigate } from "react-router-dom";
// Iconos de lucide-react para los campos del formulario
import { Mail, Lock, User, Calendar, Users, Globe, Eye, EyeOff, Phone } from "lucide-react";
// Servicio API para comunicación con el backend
import { apiService } from "../services/api";
// Estilos CSS del componente de login
import "../Styles/login.css";
// Logo de la aplicación
import logo from "../assets/logo.png";
// Componente de búsqueda de películas
import MovieSearch from "../Components/MovieSearch";

// Componente principal de registro de usuarios
const RegisterInicial: React.FC = () => {
    // Estado que almacena todos los datos del formulario
    const [formData, setFormData] = useState({
        fullname: "",           // Nombre completo del usuario
        username: "",           // Nombre de usuario único
        email: "",             // Correo electrónico
        password: "",          // Contraseña
        confirmPassword: "",   // Confirmación de contraseña
        birthdate: "",         // Fecha de nacimiento
        gender: "",            // Género del usuario
        country: "",           // País de residencia
        favoriteMovieId: "",   // ID de película favorita
        phone: "",             // Teléfono (opcional)
        role: "USER",          // Rol por defecto (usuario normal)
    });

    // Estado para controlar el estado de carga durante el registro
    const [loading, setLoading] = useState(false);

    // Estado para almacenar mensajes de error
    const [error, setError] = useState("");

    // Estados para controlar la visibilidad de las contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Hook para navegación entre rutas
    const navigate = useNavigate();
    const [genders, setGenders] = useState<string[]>([]);
    const [countries, setCountries] = useState<any[]>([]);

    // Función que maneja los cambios en los campos del formulario
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Actualiza el estado del formulario con el nuevo valor
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Limpia el mensaje de error si existe
        if (error) setError("");
    };

    // Función que maneja el envío del formulario
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        setLoading(true);   // Activa el estado de carga
        setError("");       // Limpia errores previos

        // Validación: verifica que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        // Validación: verifica longitud mínima de la contraseña
        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            // Encuentra el ID del país seleccionado
            const selectedCountry = countries.find(c => c.name === formData.country);

            // Prepara los datos del usuario para enviar al backend
            const userData = {
                username: formData.username,
                passwordHash: formData.password, // CORREGIDO: El backend espera 'password'
                email: formData.email,
                fullName: formData.fullname,
                birthdate: formData.birthdate,
                gender: formData.gender,
                countryId: selectedCountry ? selectedCountry.id : undefined, // CORREGIDO: Enviar 'countryId'
                phone: formData.phone || undefined,  // Solo envía si tiene valor
                favoriteMovieId: formData.favoriteMovieId ? parseInt(formData.favoriteMovieId, 10) : undefined,
                role: "USER",
            };

            // Llama al servicio API para crear el usuario
            const data = await apiService.createUser(userData);
            console.log("✅ Registro exitoso:", data);

            // Navega al login con un mensaje de éxito
            navigate("/login", {
                state: {
                    message: "¡Cuenta creada exitosamente! Inicia sesión para continuar.",
                },
            });
        } catch (error) {
            // Manejo de errores
            console.error("Error al registrarse:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Error al crear la cuenta. Por favor, intenta de nuevo.");
            }
        } finally {
            // Desactiva el estado de carga sin importar el resultado
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const countriesData = await apiService.getCountries();
                setCountries(countriesData);

                const gendersData = await apiService.getGenders();
                setGenders(gendersData);
            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        };

        fetchData();
    }, []);

    React.useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await apiService.getCountries();
                setCountries(data);
            } catch (err) {
                console.error("Error cargando países:", err);
            }
        };

        fetchCountries();
    }, []);

    return (
        // Contenedor principal con gradiente de fondo negro a gris oscuro
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Capa de efectos visuales de fondo */}
            <div className="absolute inset-0">
                {/* Gradiente decorativo púrpura */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-950/10 via-transparent to-purple-900/10"></div>
                {/* Círculos decorativos con efecto blur */}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-700/5 rounded-full blur-3xl"></div>
            </div>

            {/* Contenedor del formulario */}
            <div className="w-full max-w-2xl relative z-10 py-8">
                {/* Encabezado con logo y eslogan */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="PeliPop Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <p className="text-neutral-400 text-sm">Disfruta películas sin límites</p>
                </div>

                {/* Tarjeta del formulario con efecto glassmorphism */}
                <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-neutral-800/50 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.8)]">
                    <div className="space-y-4">
                        {/* Título y descripción del formulario */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl text-white font-semibold mb-1">Crear Cuenta Nueva</h2>
                            <p className="text-neutral-400 text-sm">Únete y disfruta miles de películas</p>
                        </div>

                        {/* Mensaje de error (se muestra condicionalmente) */}
                        {error && (
                            <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-3 text-purple-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Grid de campos del formulario (2 columnas en pantallas medianas) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Campo: Nombre completo */}
                            <div className="relative group">
                                {/* Icono del campo */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Nombre completo"
                                />
                            </div>

                            {/* Campo: Nombre de usuario */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Nombre de usuario"
                                />
                            </div>

                            {/* Campo: Correo electrónico */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Correo electrónico"
                                />
                            </div>

                            {/* Campo: Teléfono (opcional) */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Teléfono (opcional)"
                                />
                            </div>

                            {/* Campo: Contraseña con botón para mostrar/ocultar */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-10 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Contraseña"
                                />
                                {/* Botón para alternar visibilidad de contraseña */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-neutral-500 hover:text-purple-500 transition-colors duration-200" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-neutral-500 hover:text-purple-500 transition-colors duration-200" />
                                    )}
                                </button>
                            </div>

                            {/* Campo: Confirmar contraseña con botón para mostrar/ocultar */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-10 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Confirmar contraseña"
                                />
                                {/* Botón para alternar visibilidad de confirmación de contraseña */}
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-neutral-500 hover:text-purple-500 transition-colors duration-200" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-neutral-500 hover:text-purple-500 transition-colors duration-200" />
                                    )}
                                </button>
                            </div>

                            {/* Campo: Fecha de nacimiento */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    type="date"
                                    name="birthdate"
                                    value={formData.birthdate}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                                />
                            </div>

                            {/* Campo: Género (selector desplegable) */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <Users className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">
                                        Seleccionar género...
                                    </option>

                                    {genders.map((gender, index) => (
                                        <option key={index} value={gender} className="bg-neutral-900">
                                            {gender.replace(/_/g, " ")} {/* Para mostrar más bonito */}
                                        </option>
                                    ))}
                                </select>

                                {/* Icono de flecha hacia abajo personalizado */}
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Campo: País (selector desplegable, ancho completo) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Globe className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                            </div>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-neutral-900">
                                    Seleccionar país...
                                </option>

                                {countries.map((country) => (
                                    <option
                                        key={country.id}
                                        value={country.name}
                                        className="bg-neutral-900"
                                    >
                                        {country.name}
                                    </option>
                                ))}
                            </select>

                            {/* Icono de flecha hacia abajo personalizado */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Campo: Búsqueda de película favorita (componente personalizado) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            </div>

                            <div className="w-full">
                                {/* Componente de búsqueda de películas */}
                                <MovieSearch
                                    onSelect={(movie) => {
                                        // Guarda el ID de la película seleccionada
                                        setFormData((prev) => ({ ...prev, favoriteMovieId: String(movie.id) }));
                                    }}
                                />
                                {/* Muestra el ID de la película seleccionada */}
                                {formData.favoriteMovieId && (
                                    <div className="text-sm text-neutral-400 mt-2">
                                        Película seleccionada: ID {formData.favoriteMovieId}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botón de envío del formulario con efectos visuales */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_4px_20px_rgba(87,35,100,0.4)] hover:shadow-[0_6px_25px_rgba(87,35,100,0.5)] relative overflow-hidden group text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {/* Efecto de brillo animado al hacer hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out"></div>
                            {/* Texto del botón que cambia según el estado de carga */}
                            <span className="relative">{loading ? "Creando cuenta..." : "Crear Cuenta"}</span>
                        </button>

                        {/* Enlace para usuarios que ya tienen cuenta */}
                        <div className="text-center mt-6">
                            <p className="text-neutral-400 text-sm">
                                ¿Ya tienes cuenta?{" "}
                                <a
                                    href="#"
                                    onClick={() => navigate("/login")}
                                    className="text-white hover:text-purple-500 transition-colors font-semibold"
                                >
                                    Iniciar Sesión
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pie de página con copyright */}
                <div className="text-center mt-6">
                    <p className="text-neutral-500 text-xs">© 2025 PeliPop. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterInicial;