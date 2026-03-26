import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MiLista.css';
import { apiService, type MyListMovieDTO } from '../../services/api';

const buildImageUrl = (path?: string): string => {
    if (!path) return '/logo.png';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
};

const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

const IconRefresh = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const IconFilm = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
);

const MiLista: React.FC = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState<MyListMovieDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removingMovieId, setRemovingMovieId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const list = await apiService.getMyList();
            setMovies(list);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'No se pudo cargar tu lista.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }
        loadList();
    }, [loadList, navigate]);

    const handleRemoveMovie = async (movieId: number): Promise<void> => {
        setConfirmId(null);
        setRemovingMovieId(movieId);
        setError('');
        try {
            await apiService.removeFromMyList(movieId);
            setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'No se pudo eliminar la película de tu lista.');
        } finally {
            setRemovingMovieId(null);
        }
    };

    return (
        <div className="my-list-container">
            <div className="my-list-header">
                <h2 className="my-list-title">MI LISTA</h2>
                <button
                    className="my-list-refresh-btn"
                    onClick={loadList}
                    disabled={loading}
                    title="Recargar lista"
                    aria-label="Recargar lista"
                >
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>
            <IconRefresh />
          </span>
                    <span className="refresh-label">Recargar</span>
                </button>
            </div>

            {loading ? (
                <div className="my-list-loading">
                    <div className="loading-dots">
                        <span /><span /><span />
                    </div>
                    Cargando tu lista…
                </div>
            ) : error ? (
                <div className="my-list-error">{error}</div>
            ) : movies.length === 0 ? (
                <div className="my-list-empty">
                    <div className="empty-icon"><IconFilm /></div>
                    <p>Aún no tienes películas en tu lista.</p>
                    <button className="my-list-home-btn" onClick={() => navigate('/home')}>
                        Ir al catálogo
                    </button>
                </div>
            ) : (
                <>
                    <p className="my-list-count">{movies.length} película{movies.length !== 1 ? 's' : ''}</p>
                    <div className="my-list-grid">
                        {movies.map((movie) => {
                            const title = movie.title || movie.originalTitle || 'Película';
                            const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : '----';
                            const rating = typeof movie.voteAverage === 'number' ? movie.voteAverage.toFixed(1) : '--';
                            const isRemoving = removingMovieId === movie.id;
                            const isConfirming = confirmId === movie.id;

                            return (
                                <article key={movie.id} className={`my-list-card ${isRemoving ? 'removing' : ''}`}>
                                    <div className="my-list-poster-wrap">
                                        <img
                                            src={buildImageUrl(movie.posterPath)}
                                            alt={title}
                                            className="my-list-poster"
                                            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                        />
                                        <div className="my-list-poster-overlay">
                                            {!isConfirming ? (
                                                <button
                                                    className="my-list-delete-btn"
                                                    onClick={() => setConfirmId(movie.id)}
                                                    disabled={isRemoving}
                                                    title="Eliminar de Mi Lista"
                                                    aria-label={`Eliminar ${title} de Mi Lista`}
                                                >
                                                    <IconTrash />
                                                </button>
                                            ) : (
                                                <div className="my-list-confirm">
                                                    <span className="confirm-text">¿Eliminar?</span>
                                                    <div className="confirm-actions">
                                                        <button
                                                            className="confirm-yes"
                                                            onClick={() => handleRemoveMovie(movie.id)}
                                                            disabled={isRemoving}
                                                        >
                                                            Sí
                                                        </button>
                                                        <button
                                                            className="confirm-no"
                                                            onClick={() => setConfirmId(null)}
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="my-list-card-body">
                                        <h3 title={title}>{title}</h3>
                                        <p className="my-list-meta">
                                            <span className="meta-year">{year}</span>
                                            <span className="meta-dot">·</span>
                                            <span className="meta-rating">⭐ {rating}</span>
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default MiLista;