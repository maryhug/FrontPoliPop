import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './catalog.css';
import { apiService, type TMDBmovieDTO } from '../../services/api';

interface CardMovie {
  id: number;
  title: string;
  poster: string;
  year?: string;
  rating?: number;
}

const buildImageUrl = (path?: string) => {
  if (!path) return '/logo.png';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

const resolvePosterPath = (m: any): string | undefined => {
  const candidates = [
    m?.posterPath,
    m?.poster_path,
    m?.poster,
    m?.posterUrl,
    m?.posterURL,
    m?.image,
    m?.backdropPath,
    m?.backdrop_path,
  ];
  return candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
};

const mapMovieToCard = (m: any): CardMovie => {
  const title = m?.title || m?.originalTitle || m?.original_title || 'Película';
  const poster = buildImageUrl(resolvePosterPath(m));
  const year = (m?.releaseDate || m?.release_date || '')?.slice(0, 4) || undefined;
  const rating: number | undefined = typeof m?.voteAverage === 'number' ? m.voteAverage : (typeof m?.vote_average === 'number' ? m.vote_average : undefined);
  return { id: m?.id, title, poster, year, rating } as CardMovie;
};

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<CardMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<TMDBmovieDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Obtener películas populares
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.getPopularMovies()
      .then((movies) => {
        if (!mounted) return;
        const mapped: CardMovie[] = (movies || []).map((m) => mapMovieToCard(m));
        setList(mapped);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError('No se pudo cargar el catálogo');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Abrir modal con detalles de la película
  const openModal = async (id: number) => {
    setOpen(true);
    setDetails(null);
    setLoadingDetails(true);
    try {
      const d = await apiService.getMovieDetails(id);
      setDetails(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="catalog-container">
      <h2 className="catalog-title">Catálogo de Películas</h2>

      {loading ? (
        <div className="loading">Cargando…</div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : (
        <div className="poster-grid">
          {list.map((m) => (
            <div key={m.id} className="poster-card" onClick={() => openModal(m.id)}>
              <img className="poster-img" src={m.poster} alt={m.title} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
              <div className="poster-title">{m.title}</div>
              <div className="poster-sub">
                {m.rating !== undefined && <span className="poster-rating">⭐ {m.rating.toFixed(1)}</span>}
                {m.year && <span className="poster-year">{m.year}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            {loadingDetails ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando detalles…</div>
            ) : details ? (
              <>
                <div className="modal-image-col">
                  <img className="modal-image" src={buildImageUrl(resolvePosterPath(details as any) || (details as any).posterPath || (details as any).backdropPath)} alt={details.title || (details as any).originalTitle || (details as any).original_title || 'Póster'} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                </div>
                <div className="modal-body">
                  <h3 className="modal-title">{details.title || (details as any).originalTitle || (details as any).original_title}</h3>
                  {(() => {
                    const year = ((details as any).releaseDate || (details as any).release_date || '')?.slice(0, 4) || '—';
                    const ratingSrc = typeof (details as any).voteAverage === 'number' ? (details as any).voteAverage : (details as any).vote_average;
                    const ratingText = typeof ratingSrc === 'number' ? ratingSrc.toFixed(1) : '—';
                    return <div className="modal-meta">{year} · ⭐ {ratingText}</div>;
                  })()}
                  {details.overview && <p className="modal-overview">{details.overview}</p>}
                </div>
              </>
            ) : (
              <div className="error-text" style={{ padding: '1rem' }}>No se pudieron cargar detalles</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;