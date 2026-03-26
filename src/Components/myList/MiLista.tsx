import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MiLista.css';
import { apiService, type MyListMovieDTO } from '../../services/api';

const buildImageUrl = (path?: string): string => {
  if (!path) return '/logo.png';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

const MiLista: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MyListMovieDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingMovieId, setRemovingMovieId] = useState<number | null>(null);

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
    setRemovingMovieId(movieId);
    setError('');

    try {
      await apiService.removeFromMyList(movieId);
      setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la pelicula de tu lista.');
    } finally {
      setRemovingMovieId(null);
    }
  };

  return (
    <div className="my-list-container">
      <div className="my-list-header">
        <h2>Mi Lista</h2>
        <button className="my-list-refresh-btn" onClick={loadList} disabled={loading}>
          {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {loading ? (
        <div className="my-list-loading">Cargando tu lista...</div>
      ) : error ? (
        <div className="my-list-error">{error}</div>
      ) : movies.length === 0 ? (
        <div className="my-list-empty">
          <p>Aun no tienes peliculas en tu lista.</p>
          <button className="my-list-home-btn" onClick={() => navigate('/home')}>
            Ir al catalogo
          </button>
        </div>
      ) : (
        <div className="my-list-grid">
          {movies.map((movie) => {
            const title = movie.title || movie.originalTitle || 'Pelicula';
            const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : '----';
            const rating = typeof movie.voteAverage === 'number' ? movie.voteAverage.toFixed(1) : '--';

            return (
              <article key={movie.id} className="my-list-card">
                <img
                  src={buildImageUrl(movie.posterPath)}
                  alt={title}
                  className="my-list-poster"
                  onError={(event) => {
                    event.currentTarget.src = '/logo.png';
                  }}
                />

                <div className="my-list-card-body">
                  <h3>{title}</h3>
                  <p>{year} · ⭐ {rating}</p>
                  <button
                    className="my-list-remove-btn"
                    onClick={() => handleRemoveMovie(movie.id)}
                    disabled={removingMovieId === movie.id}
                  >
                    {removingMovieId === movie.id ? 'Eliminando...' : 'Eliminar de Mi Lista'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MiLista;

