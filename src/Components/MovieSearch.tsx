// Importaciones necesarias de React
import { useEffect, useState } from "react";
// Icono de película de lucide-react
import { Film } from "lucide-react";
// Servicio API para comunicación con el backend
import { apiService } from "../services/api";

// ========== TIPOS E INTERFACES ==========

// Tipo que define la estructura de una película
type Movie = {
    id: number | string;           // ID único de la película (puede ser número o string)
    title?: string;                // Título de la película (opcional)
    original_title?: string;       // Título original (opcional)
    release_date?: string;         // Fecha de estreno (opcional)
    [key: string]: unknown;        // Permite propiedades adicionales dinámicas
};

// ========== COMPONENTE PRINCIPAL ==========

/**
 * Componente MovieSearch - Campo de búsqueda de películas con autocompletado
 *
 * Características:
 * - Búsqueda en tiempo real con debounce (350ms)
 * - Lista de resultados con scroll
 * - Muestra película seleccionada con opción de cambiar
 * - Estados de carga y error
 * - Diseño consistente con el tema de la aplicación
 *
 * @param onSelect - Callback que se ejecuta cuando se selecciona una película
 * @param placeholder - Texto del placeholder (opcional, por defecto: "Buscar película favorita...")
 * @param inputClassName - Clase CSS personalizada para el input (opcional)
 */
export default function MovieSearch({
                                        onSelect,
                                        placeholder = "Buscar película favorita...",
                                        inputClassName,
                                    }: {
    onSelect: (movie: Movie) => void;
    placeholder?: string;
    inputClassName?: string;
}): JSX.Element {

    // ========== ESTADOS DEL COMPONENTE ==========

    // Estado que almacena el texto de búsqueda del usuario
    const [query, setQuery] = useState("");

    // Estado que almacena los resultados de la búsqueda
    const [results, setResults] = useState<Movie[]>([]);

    // Estado que indica si está cargando los resultados
    const [loading, setLoading] = useState(false);

    // Estado que almacena mensajes de error
    const [error, setError] = useState<string | null>(null);

    // Estado que almacena la película seleccionada por el usuario
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    // ========== EFECTO PARA BÚSQUEDA CON DEBOUNCE ==========

    /**
     * useEffect que maneja la búsqueda de películas con debounce
     *
     * Funcionalidad:
     * - Espera 350ms después de que el usuario deja de escribir
     * - Valida que el query no esté vacío
     * - Llama al API service para buscar películas
     * - Actualiza los estados según el resultado
     */
    useEffect(() => {
        // Crea un timeout para implementar debounce (espera antes de buscar)
        const t = setTimeout(() => {
            const q = query.trim(); // Elimina espacios en blanco al inicio y final

            // Si el query está vacío, limpia resultados y estado de carga
            if (q.length === 0) {
                setResults([]);
                setLoading(false);
                return;
            }

            // Inicia el estado de carga y limpia errores previos
            setLoading(true);
            setError(null);

            // Llama al servicio API para buscar películas
            apiService
                .searchMovies(q)
                .then((r) => {
                    // Verifica que la respuesta sea un array válido
                    if (Array.isArray(r)) {
                        setResults(r as Movie[]);
                    } else {
                        setResults([]); // Si no es array, limpia resultados
                    }
                })
                .catch((err: unknown) => {
                    // Manejo de errores con conversión segura a string
                    const msg = err instanceof Error ? err.message : String(err);
                    setError(msg || "Error al buscar películas");
                })
                .finally(() => setLoading(false)); // Siempre desactiva el loading al terminar
        }, 350); // Debounce de 350 milisegundos

        // Cleanup function: cancela el timeout si el componente se desmonta
        // o si el query cambia antes de que se ejecute el timeout
        return () => clearTimeout(t);
    }, [query]); // Se ejecuta cada vez que cambia el query

    // ========== CLASES CSS ==========

    /**
     * Clase CSS por defecto que coincide con el estilo de RegisterInicial
     * Proporciona un diseño consistente en toda la aplicación
     */
    const defaultInputClass =
        "w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed";

    // ========== RENDERIZADO DEL COMPONENTE ==========

    return (
        <div className="relative">
            {/* ===== INPUT DE BÚSQUEDA ===== */}
            <div className="relative group">
                {/* Icono de película a la izquierda del input */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Film className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                </div>

                {/* Campo de entrada de texto */}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)} // Actualiza el query al escribir
                    placeholder={placeholder}
                    className={inputClassName ?? defaultInputClass} // Usa clase personalizada o por defecto
                />
            </div>

            {/* ===== INDICADOR DE CARGA ===== */}
            {/* Se muestra mientras se están buscando películas */}
            {loading && (
                <div className="text-xs text-neutral-400 mt-2 pl-1">
                    Buscando películas...
                </div>
            )}

            {/* ===== MENSAJE DE ERROR ===== */}
            {/* Se muestra si ocurre algún error en la búsqueda */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-2 text-red-400 text-xs mt-2">
                    {error}
                </div>
            )}

            {/* ===== PELÍCULA SELECCIONADA ===== */}
            {/* Se muestra cuando el usuario ha seleccionado una película */}
            {selectedMovie && (
                <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-3 mt-2">
                    <div className="flex items-center justify-between">
                        {/* Información de la película seleccionada */}
                        <div>
                            {/* Título de la película */}
                            <div className="text-sm text-white font-medium">
                                {selectedMovie.title ?? selectedMovie.original_title ?? "Sin título"}
                            </div>
                            {/* Año de estreno si está disponible */}
                            {selectedMovie.release_date && (
                                <div className="text-xs text-neutral-400">
                                    {new Date(selectedMovie.release_date as string).getFullYear()}
                                </div>
                            )}
                        </div>

                        {/* Botón para cambiar la selección */}
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMovie(null); // Limpia la película seleccionada
                                setQuery("");           // Limpia el query
                            }}
                            className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
            )}

            {/* ===== LISTA DE RESULTADOS ===== */}
            {/* Se muestra cuando hay resultados y no hay película seleccionada */}
            {results.length > 0 && !selectedMovie && (
                <div className="absolute z-50 w-full mt-2">
                    {/* Contenedor con scroll para la lista de películas */}
                    <ul className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-auto">
                        {results.map((m) => {
                            // Extrae el título de la película (usa title o original_title)
                            const title = String(m.title ?? m.original_title ?? "Sin título");

                            // Extrae el año de la fecha de estreno
                            const year =
                                typeof m.release_date === "string" && m.release_date.length >= 4
                                    ? m.release_date.split("-")[0] // Obtiene el año de la fecha
                                    : undefined;

                            // Genera una key única para el elemento de lista
                            const key = typeof m.id === "number" ? m.id : String(m.id ?? title);

                            return (
                                <li
                                    key={key}
                                    className="p-3 hover:bg-neutral-800/70 cursor-pointer transition-colors duration-200 border-b border-neutral-800/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                                    onClick={() => {
                                        // Al hacer clic en una película:
                                        onSelect(m);              // Ejecuta el callback del padre
                                        setSelectedMovie(m);      // Guarda la película seleccionada
                                        setQuery("");             // Limpia el query
                                        setResults([]);           // Limpia los resultados
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icono decorativo de la película */}
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                                <Film className="h-4 w-4 text-purple-400" />
                                            </div>
                                        </div>

                                        {/* Información de la película */}
                                        <div className="flex-1 min-w-0">
                                            {/* Título con truncado si es muy largo */}
                                            <div className="text-sm text-white font-medium truncate">
                                                {title}
                                            </div>
                                            {/* Año de estreno si está disponible */}
                                            {year && (
                                                <div className="text-xs text-neutral-400">
                                                    {year}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}