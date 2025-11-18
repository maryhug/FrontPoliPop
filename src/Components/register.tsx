// src/pages/RegisterInicial.tsx
import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Calendar, Users, Globe, Eye, EyeOff, Phone } from "lucide-react";
import { apiService } from "../services/api";
import "../Styles/login.css";
import logo from "../assets/logo.png";
import MovieSearch from "../Components/MovieSearch";

const RegisterInicial: React.FC = () => {
    const [formData, setFormData] = useState({
        fullname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        birthdate: "",
        gender: "",
        country: "",
        favoriteMovieId: "",
        phone: "",
        role: "USER",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError("");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            const userData = {
                username: formData.username,
                passwordHash: formData.password,
                email: formData.email,
                fullName: formData.fullname,
                birthdate: formData.birthdate,
                gender: formData.gender,
                country: formData.country,
                phone: formData.phone || undefined,
                favoriteMovieId: formData.favoriteMovieId ? parseInt(formData.favoriteMovieId, 10) : undefined,
                role: "USER",
            };

            const data = await apiService.createUser(userData);
            console.log("✅ Registro exitoso:", data);

            navigate("/login", {
                state: {
                    message: "¡Cuenta creada exitosamente! Inicia sesión para continuar.",
                },
            });
        } catch (error) {
            console.error("Error al registrarse:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Error al crear la cuenta. Por favor, intenta de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-950/10 via-transparent to-purple-900/10"></div>
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-700/5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10 py-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="PeliPop Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <p className="text-neutral-400 text-sm">Disfruta películas sin límites</p>
                </div>

                <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-neutral-800/50 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.8)]">
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl text-white font-semibold mb-1">Crear Cuenta Nueva</h2>
                            <p className="text-neutral-400 text-sm">Únete y disfruta miles de películas</p>
                        </div>

                        {error && (
                            <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-3 text-purple-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative group">
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
                                    <option value="" className="bg-neutral-900">Seleccionar género...</option>
                                    <option value="M" className="bg-neutral-900">Masculino</option>
                                    <option value="F" className="bg-neutral-900">Femenino</option>
                                    <option value="O" className="bg-neutral-900">Otro</option>
                                    <option value="N" className="bg-neutral-900">Prefiero no decir</option>
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

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
                                <option value="" className="bg-neutral-900">Seleccionar país...</option>
                                <option value="AR" className="bg-neutral-900">Argentina</option>
                                <option value="BO" className="bg-neutral-900">Bolivia</option>
                                <option value="CL" className="bg-neutral-900">Chile</option>
                                <option value="CO" className="bg-neutral-900">Colombia</option>
                                <option value="CR" className="bg-neutral-900">Costa Rica</option>
                                <option value="CU" className="bg-neutral-900">Cuba</option>
                                <option value="EC" className="bg-neutral-900">Ecuador</option>
                                <option value="SV" className="bg-neutral-900">El Salvador</option>
                                <option value="ES" className="bg-neutral-900">España</option>
                                <option value="GT" className="bg-neutral-900">Guatemala</option>
                                <option value="HN" className="bg-neutral-900">Honduras</option>
                                <option value="MX" className="bg-neutral-900">México</option>
                                <option value="NI" className="bg-neutral-900">Nicaragua</option>
                                <option value="PA" className="bg-neutral-900">Panamá</option>
                                <option value="PY" className="bg-neutral-900">Paraguay</option>
                                <option value="PE" className="bg-neutral-900">Perú</option>
                                <option value="PR" className="bg-neutral-900">Puerto Rico</option>
                                <option value="DO" className="bg-neutral-900">República Dominicana</option>
                                <option value="UY" className="bg-neutral-900">Uruguay</option>
                                <option value="VE" className="bg-neutral-900">Venezuela</option>
                                <option value="US" className="bg-neutral-900">Estados Unidos</option>
                                <option value="OTHER" className="bg-neutral-900">Otro</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            </div>

                            <div className="w-full">
                                <MovieSearch
                                    onSelect={(movie) => {
                                        setFormData((prev) => ({ ...prev, favoriteMovieId: String(movie.id) }));
                                    }}
                                />
                                {formData.favoriteMovieId && (
                                    <div className="text-sm text-neutral-400 mt-2">
                                        Película seleccionada: ID {formData.favoriteMovieId}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_4px_20px_rgba(87,35,100,0.4)] hover:shadow-[0_6px_25px_rgba(87,35,100,0.5)] relative overflow-hidden group text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out"></div>
                            <span className="relative">{loading ? "Creando cuenta..." : "Crear Cuenta"}</span>
                        </button>

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

                <div className="text-center mt-6">
                    <p className="text-neutral-500 text-xs">© 2025 PeliPop. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterInicial;