import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Calendar, Users, Globe, Eye, EyeOff, Phone } from "lucide-react";
import { apiService } from "../services/api";
import "../Styles/login.css";
import logo from "../assets/logo.png";
import MovieSearch from "../Components/MovieSearch";

// ── Types ──────────────────────────────────────────────────────────────────
interface FormData {
    fullname: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    birthdate: string;
    gender: string;
    country: string;
    favoriteMovieId: string;
    phone: string;
    role: string;
}

interface FormErrors {
    fullname?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    birthdate?: string;
    gender?: string;
    country?: string;
    phone?: string;
}

// ── Validation ─────────────────────────────────────────────────────────────
const validateField = (name: keyof FormErrors, value: string, extra?: { password?: string }): string => {
    switch (name) {
        case "fullname":
            if (!value.trim()) return "El nombre completo es obligatorio.";
            if (value.trim().length < 2) return "Mínimo 2 caracteres.";
            if (value.trim().length > 80) return "Máximo 80 caracteres.";
            return "";

        case "username":
            if (!value.trim()) return "El nombre de usuario es obligatorio.";
            if (value.trim().length < 3) return "Mínimo 3 caracteres.";
            if (value.trim().length > 30) return "Máximo 30 caracteres.";
            if (!/^[a-zA-Z0-9_.-]+$/.test(value.trim())) return "Solo letras, números, puntos y guiones.";
            return "";

        case "email":
            if (!value.trim()) return "El correo es obligatorio.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Ingresa un correo válido.";
            return "";

        case "password":
            if (!value) return "La contraseña es obligatoria.";
            if (value.length < 6) return "Mínimo 6 caracteres.";
            if (value.length > 72) return "Máximo 72 caracteres.";
            if (!/[A-Za-z]/.test(value)) return "Debe contener al menos una letra.";
            if (!/[0-9]/.test(value)) return "Debe contener al menos un número.";
            return "";

        case "confirmPassword":
            if (!value) return "Confirma tu contraseña.";
            if (value !== extra?.password) return "Las contraseñas no coinciden.";
            return "";

        case "birthdate": {
            if (!value) return "La fecha de nacimiento es obligatoria.";
            const birth = new Date(value);
            const now = new Date();
            const age = now.getFullYear() - birth.getFullYear() - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
            if (birth > now) return "La fecha no puede ser futura.";
            if (age < 5) return "Debes tener al menos 5 años.";
            if (age > 120) return "Fecha de nacimiento inválida.";
            return "";
        }

        case "gender":
            if (!value) return "Selecciona un género.";
            return "";

        case "country":
            if (!value) return "Selecciona un país.";
            return "";

        case "phone":
            if (value && !/^[+\d\s\-().]{7,20}$/.test(value.trim())) return "Formato de teléfono inválido.";
            return "";

        default:
            return "";
    }
};

// ── Password strength ──────────────────────────────────────────────────────
const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: "Muy débil", color: "#ef4444" };
    if (score === 2) return { level: 2, label: "Débil", color: "#f97316" };
    if (score === 3) return { level: 3, label: "Aceptable", color: "#eab308" };
    if (score === 4) return { level: 4, label: "Fuerte", color: "#22c55e" };
    return { level: 5, label: "Muy fuerte", color: "#7c3aed" };
};

// ── Component ──────────────────────────────────────────────────────────────
const RegisterInicial: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        fullname: "", username: "", email: "", password: "", confirmPassword: "",
        birthdate: "", gender: "", country: "", favoriteMovieId: "", phone: "", role: "USER",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [genders, setGenders] = useState<string[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [countriesData, gendersData] = await Promise.all([
                    apiService.getCountries(),
                    apiService.getGenders(),
                ]);
                setCountries(countriesData);
                setGenders(gendersData);
            } catch (err) { console.error("Error cargando datos:", err); }
        };
        fetchData();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (submitError) setSubmitError("");
        if (touched[name as keyof FormErrors]) {
            const errMsg = validateField(
                name as keyof FormErrors,
                value,
                name === "confirmPassword" ? { password: formData.password } :
                    name === "password" ? { password: value } : undefined
            );
            setErrors(prev => ({ ...prev, [name]: errMsg || undefined }));
            // Also re-validate confirmPassword when password changes
            if (name === "password" && touched.confirmPassword) {
                const cpErr = validateField("confirmPassword", formData.confirmPassword, { password: value });
                setErrors(prev => ({ ...prev, confirmPassword: cpErr || undefined }));
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const errMsg = validateField(
            name as keyof FormErrors,
            value,
            name === "confirmPassword" ? { password: formData.password } : undefined
        );
        setErrors(prev => ({ ...prev, [name]: errMsg || undefined }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // Touch all fields
        const allFields: Array<keyof FormErrors> = ["fullname", "username", "email", "password", "confirmPassword", "birthdate", "gender", "country", "phone"];
        const allTouched: Partial<Record<keyof FormErrors, boolean>> = {};
        const allErrors: FormErrors = {};
        allFields.forEach(field => {
            allTouched[field] = true;
            const val = formData[field as keyof FormData] as string;
            const errMsg = validateField(field, val, field === "confirmPassword" ? { password: formData.password } : undefined);
            if (errMsg) allErrors[field] = errMsg;
        });
        setTouched(allTouched);
        setErrors(allErrors);
        if (Object.keys(allErrors).length > 0) {
            setSubmitError("Corrige los errores del formulario antes de continuar.");
            return;
        }

        setLoading(true);
        setSubmitError("");
        try {
            const selectedCountry = countries.find(c => c.name === formData.country);
            const userData = {
                username: formData.username,
                passwordHash: formData.password,
                email: formData.email,
                fullName: formData.fullname,
                birthdate: formData.birthdate,
                gender: formData.gender,
                countryId: selectedCountry ? selectedCountry.id : undefined,
                phone: formData.phone || undefined,
                favoriteMovieId: formData.favoriteMovieId ? parseInt(formData.favoriteMovieId, 10) : undefined,
                role: "USER",
            };
            const data = await apiService.createUser(userData);
            console.log("✅ Registro exitoso:", data);
            navigate("/login", { state: { message: "¡Cuenta creada exitosamente! Inicia sesión para continuar." } });
        } catch (error) {
            console.error("Error al registrarse:", error);
            setSubmitError(error instanceof Error ? error.message : "Error al crear la cuenta. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const pwStrength = getPasswordStrength(formData.password);

    // Helper: field wrapper classes
    const fieldClass = (name: keyof FormErrors) =>
        `reg-field${errors[name] && touched[name] ? " reg-field--error" : touched[name] && !errors[name] ? " reg-field--ok" : ""}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-950/10 via-transparent to-purple-900/10" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-700/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-2xl relative z-10 py-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="PeliPop Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <p className="text-neutral-400 text-sm">Disfruta películas sin límites</p>
                </div>

                {/* Card */}
                <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-neutral-800/50 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.8)]">
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl text-white font-semibold mb-1">Crear Cuenta Nueva</h2>
                            <p className="text-neutral-400 text-sm">Únete y disfruta miles de películas</p>
                        </div>

                        {/* Submit error */}
                        {submitError && (
                            <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-3 text-purple-400 text-sm text-center">
                                {submitError}
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Nombre completo */}
                            <div className={fieldClass("fullname")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><User className="h-4 w-4" /></div>
                                    <input
                                        type="text" name="fullname" value={formData.fullname}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading} placeholder="Nombre completo"
                                        className="reg-input"
                                    />
                                    {touched.fullname && !errors.fullname && <span className="reg-check">✓</span>}
                                </div>
                                {errors.fullname && touched.fullname && <span className="reg-error-msg">{errors.fullname}</span>}
                            </div>

                            {/* Username */}
                            <div className={fieldClass("username")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><User className="h-4 w-4" /></div>
                                    <input
                                        type="text" name="username" value={formData.username}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading} placeholder="Nombre de usuario"
                                        className="reg-input"
                                    />
                                    {touched.username && !errors.username && <span className="reg-check">✓</span>}
                                </div>
                                {errors.username && touched.username && <span className="reg-error-msg">{errors.username}</span>}
                            </div>

                            {/* Email */}
                            <div className={fieldClass("email")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Mail className="h-4 w-4" /></div>
                                    <input
                                        type="email" name="email" value={formData.email}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading} placeholder="Correo electrónico"
                                        className="reg-input"
                                    />
                                    {touched.email && !errors.email && <span className="reg-check">✓</span>}
                                </div>
                                {errors.email && touched.email && <span className="reg-error-msg">{errors.email}</span>}
                            </div>

                            {/* Phone */}
                            <div className={fieldClass("phone")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Phone className="h-4 w-4" /></div>
                                    <input
                                        type="tel" name="phone" value={formData.phone}
                                        onChange={handleChange} onBlur={handleBlur}
                                        disabled={loading} placeholder="Teléfono (opcional)"
                                        className="reg-input"
                                    />
                                    {touched.phone && !errors.phone && formData.phone && <span className="reg-check">✓</span>}
                                </div>
                                {errors.phone && touched.phone && <span className="reg-error-msg">{errors.phone}</span>}
                            </div>

                            {/* Password */}
                            <div className={fieldClass("password")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Lock className="h-4 w-4" /></div>
                                    <input
                                        type={showPassword ? "text" : "password"} name="password" value={formData.password}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading} placeholder="Contraseña"
                                        className="reg-input reg-input--pw"
                                    />
                                    <button type="button" className="reg-eye" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {formData.password && (
                                    <div className="reg-strength">
                                        <div className="reg-strength-bars">
                                            {[1,2,3,4,5].map(i => (
                                                <div
                                                    key={i}
                                                    className="reg-strength-bar"
                                                    style={{ background: i <= pwStrength.level ? pwStrength.color : "rgba(255,255,255,0.1)" }}
                                                />
                                            ))}
                                        </div>
                                        <span className="reg-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                                    </div>
                                )}
                                {errors.password && touched.password && <span className="reg-error-msg">{errors.password}</span>}
                            </div>

                            {/* Confirm password */}
                            <div className={fieldClass("confirmPassword")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Lock className="h-4 w-4" /></div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading} placeholder="Confirmar contraseña"
                                        className="reg-input reg-input--pw"
                                    />
                                    <button type="button" className="reg-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && touched.confirmPassword && <span className="reg-error-msg">{errors.confirmPassword}</span>}
                                {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                                    <span className="reg-error-msg" style={{ color: "#22c55e" }}>✓ Las contraseñas coinciden</span>
                                )}
                            </div>

                            {/* Birthdate */}
                            <div className={fieldClass("birthdate")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Calendar className="h-4 w-4" /></div>
                                    <input
                                        type="date" name="birthdate" value={formData.birthdate}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading}
                                        className="reg-input [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                                    />
                                    {touched.birthdate && !errors.birthdate && <span className="reg-check">✓</span>}
                                </div>
                                {errors.birthdate && touched.birthdate && <span className="reg-error-msg">{errors.birthdate}</span>}
                            </div>

                            {/* Gender */}
                            <div className={fieldClass("gender")}>
                                <div className="reg-input-wrap">
                                    <div className="reg-icon"><Users className="h-4 w-4" /></div>
                                    <select
                                        name="gender" value={formData.gender}
                                        onChange={handleChange} onBlur={handleBlur}
                                        required disabled={loading}
                                        className="reg-input reg-select"
                                    >
                                        <option value="">Seleccionar género...</option>
                                        {genders.map((g, i) => <option key={i} value={g}>{g.replace(/_/g, " ")}</option>)}
                                    </select>
                                    <div className="reg-select-arrow">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.gender && touched.gender && <span className="reg-error-msg">{errors.gender}</span>}
                            </div>
                        </div>

                        {/* Country - full width */}
                        <div className={fieldClass("country")}>
                            <div className="reg-input-wrap">
                                <div className="reg-icon"><Globe className="h-4 w-4" /></div>
                                <select
                                    name="country" value={formData.country}
                                    onChange={handleChange} onBlur={handleBlur}
                                    required disabled={loading}
                                    className="reg-input reg-select"
                                >
                                    <option value="">Seleccionar país...</option>
                                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <div className="reg-select-arrow">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {errors.country && touched.country && <span className="reg-error-msg">{errors.country}</span>}
                        </div>

                        {/* Favorite movie */}
                        <div className="relative group">
                            <MovieSearch
                                onSelect={(movie) => setFormData(prev => ({ ...prev, favoriteMovieId: String(movie.id) }))}
                            />
                            {formData.favoriteMovieId && (
                                <div className="text-sm text-neutral-400 mt-2">Película seleccionada: ID {formData.favoriteMovieId}</div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_4px_20px_rgba(87,35,100,0.4)] hover:shadow-[0_6px_25px_rgba(87,35,100,0.5)] relative overflow-hidden group text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                            <span className="relative">{loading ? "Creando cuenta..." : "Crear Cuenta"}</span>
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-neutral-400 text-sm">
                                ¿Ya tienes cuenta?{" "}
                                <a href="#" onClick={() => navigate("/login")} className="text-white hover:text-purple-500 transition-colors font-semibold">
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