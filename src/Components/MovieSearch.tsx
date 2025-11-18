import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import { apiService } from "../services/api";

type Movie = {
    id: number | string;
    title?: string;
    original_title?: string;
    release_date?: string;
    [key: string]: unknown;
};

export default function MovieSearch({
                                        onSelect,
                                        placeholder = "Buscar película favorita...",
                                        inputClassName,
                                    }: {
    onSelect: (movie: Movie) => void;
    placeholder?: string;
    inputClassName?: string;
}): JSX.Element {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            const q = query.trim();
            if (q.length === 0) {
                setResults([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            apiService
                .searchMovies(q)
                .then((r) => {
                    if (Array.isArray(r)) {
                        setResults(r as Movie[]);
                    } else {
                        setResults([]);
                    }
                })
                .catch((err: unknown) => {
                    const msg = err instanceof Error ? err.message : String(err);
                    setError(msg || "Error al buscar películas");
                })
                .finally(() => setLoading(false));
        }, 350);
        return () => clearTimeout(t);
    }, [query]);

    // Clase por defecto que sigue el estilo de RegisterInicial
    const defaultInputClass =
        "w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:border-purple-600/50 focus:bg-neutral-900/70 focus:shadow-[0_0_15px_rgba(87,35,100,0.2)] transition-all duration-200 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="relative">
            {/* Input con icono */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Film className="h-4 w-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors duration-200" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className={inputClassName ?? defaultInputClass}
                />
            </div>

            {/* Estado de carga */}
            {loading && (
                <div className="text-xs text-neutral-400 mt-2 pl-1">
                    Buscando películas...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-2 text-red-400 text-xs mt-2">
                    {error}
                </div>
            )}

            {/* Película seleccionada */}
            {selectedMovie && (
                <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-3 mt-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-white font-medium">
                                {selectedMovie.title ?? selectedMovie.original_title ?? "Sin título"}
                            </div>
                            {selectedMovie.release_date && (
                                <div className="text-xs text-neutral-400">
                                    {new Date(selectedMovie.release_date as string).getFullYear()}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMovie(null);
                                setQuery("");
                            }}
                            className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de resultados */}
            {results.length > 0 && !selectedMovie && (
                <div className="absolute z-50 w-full mt-2">
                    <ul className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-auto">
                        {results.map((m) => {
                            const title = String(m.title ?? m.original_title ?? "Sin título");
                            const year =
                                typeof m.release_date === "string" && m.release_date.length >= 4
                                    ? m.release_date.split("-")[0]
                                    : undefined;
                            const key = typeof m.id === "number" ? m.id : String(m.id ?? title);

                            return (
                                <li
                                    key={key}
                                    className="p-3 hover:bg-neutral-800/70 cursor-pointer transition-colors duration-200 border-b border-neutral-800/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                                    onClick={() => {
                                        onSelect(m);
                                        setSelectedMovie(m);
                                        setQuery("");
                                        setResults([]);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                                <Film className="h-4 w-4 text-purple-400" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">
                                                {title}
                                            </div>
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