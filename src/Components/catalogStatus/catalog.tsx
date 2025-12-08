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
  // filtro: sólo año
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const [open, setOpen] = useState(false);
   const [details, setDetails] = useState<TMDBmovieDTO | null>(null);
   const [loadingDetails, setLoadingDetails] = useState(false);
   const [selectedCard, setSelectedCard] = useState<CardMovie | null>(null);

  // búsqueda
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const loadPopular = async () => {
    setLoading(true);
    setError('');
    try {
      const movies = await apiService.getPopularMovies();
      const mapped: CardMovie[] = (movies || []).map((m) => mapMovieToCard(m));
      setList(mapped);
    } catch (e: any) {
      console.error(e);
      setError('No se pudo cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  // Obtener películas populares al inicio
  useEffect(() => {
    loadPopular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async () => {
    const q = query.trim();
    if (!q) {
      setIsSearching(false);
      await loadPopular();
      return;
    }
    setLoading(true);
    setError('');
    setIsSearching(true);
    try {
      const movies = await apiService.searchMovies(q);
      const mapped: CardMovie[] = (movies || []).map((m) => mapMovieToCard(m));
      setList(mapped);
      if (!movies || movies.length === 0) {
        setError('No se encontraron resultados.');
      }
    } catch (e: any) {
      console.error(e);
      setError('No se pudo realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = async () => {
    setQuery('');
    setIsSearching(false);
    await loadPopular();
  };

  // Abrir modal con detalles de la película
  const openModal = async (id: number) => {
    console.debug('openModal called for id=', id);
    // set selected card from list as fallback immediato
    const card = list.find((x) => x.id === id) || null;
    setSelectedCard(card);
    setOpen(true);
    setDetails(null);
    setLoadingDetails(true);
    try {
      const d = await apiService.getMovieDetails(id);
      console.debug('movie details fetched', d);
      setDetails(d);
    } catch (e) {
      console.error('Error fetching movie details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // opciones de filtro: años disponibles
   const yearsOptions = React.useMemo(() => {
     const s = new Set<string>();
     for (const m of list) if (m.year) s.add(m.year);
     return Array.from(s).sort((a, b) => Number(b) - Number(a));
   }, [list]);

   const filteredList = React.useMemo(() => {
     return list.filter((m) => {
       if (selectedYear !== 'all') {
         if (!m.year || m.year !== selectedYear) return false;
       }
       return true;
     });
   }, [list, selectedYear]);

   return (
     <div className="catalog-container">
       <div className="catalog-header">
         <h2 className="catalog-title">
           <span className="catalog-title-icon" aria-hidden>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
               <path d="M3 5a2 2 0 0 1 2-2h11l2 2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm2 0v10h14V7h-2.17l-2-2H5Z"/>
             </svg>
           </span>
           Catálogo de películas
         </h2>
         <div className="catalog-search">
           <div className="search-wrap">
             <span className="search-icon" aria-hidden>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10 2a8 8 0 1 0 5.29 14.06l4.33 4.33 1.41-1.41-4.33-4.33A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z"/>
               </svg>
             </span>
             <input
               type="text"
               placeholder="Buscar películas..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
               className="search-input"
               aria-label="Buscar películas"
             />
             <div className="search-actions">
               <button className="search-btn" onClick={doSearch} title="Buscar" aria-label="Buscar">Buscar</button>
               <button className="clear-btn" onClick={clearSearch} disabled={!query && !isSearching} title="Limpiar" aria-label="Limpiar">Limpiar</button>
             </div>
           </div>
           <div className="filter-row">
             <label style={{ color: '#fff', marginRight: 8 }}>Filtrar por año:</label>
             <select value={selectedYear as any} onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : e.target.value)} aria-label="Filtrar por año">
               <option value="all">Todos los años</option>
               {yearsOptions.map((y) => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
             <button className="clear-btn" onClick={() => { setSelectedYear('all'); }} style={{ marginLeft: 8 }}>Limpiar filtros</button>
           </div>
         </div>
       </div>

       <h3 className="section-title">
         {isSearching && query ? (
           <>Resultados de búsqueda <span className="catalog-sub">“{query}”</span></>
         ) : (
           <>Películas Populares</>
         )}
       </h3>

       {loading ? (
         <div className="loading">Cargando…</div>
       ) : error ? (
         <div className="error-text">{error}</div>
       ) : (
         <div className="poster-grid">
           {filteredList.map((m) => (
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
             ) : details || selectedCard ? (
               <>
                 <div className="modal-image-col">
                   <img
                     className="modal-image"
                     src={buildImageUrl(resolvePosterPath((details || selectedCard) as any) || ((details as any)?.posterPath) || ((details as any)?.backdropPath) || (selectedCard?.poster))}
                     alt={(details && (details.title || (details as any).originalTitle || (details as any).original_title)) || selectedCard?.title || 'Póster'}
                     onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                   />
                 </div>
                 <div className="modal-body">
                   <h3 className="modal-title">{(details && (details.title || (details as any).originalTitle || (details as any).original_title)) || selectedCard?.title || 'Sin título'}</h3>
                   {(() => {
                     const year = ((details && ((details as any).releaseDate || (details as any).release_date)) || selectedCard?.year || '')?.toString()?.slice(0, 4) || '—';
                     const ratingSrc = details ? (typeof (details as any).voteAverage === 'number' ? (details as any).voteAverage : (details as any).vote_average) : selectedCard?.rating;
                     const ratingText = typeof ratingSrc === 'number' ? parseFloat(String(ratingSrc)).toFixed(1) : '—';
                     return <div className="modal-meta">{year} · ⭐ <span className="big-rating">{ratingText}</span></div>;
                   })()}
                   <div className="modal-genres" style={{ marginTop: 6, color: '#cfc7ff' }}>
                     {(() => {
                       const gNames = details && (Array.isArray((details as any).genres)
                         ? (details as any).genres.map((g: any) => g.name)
                         : (details as any).genre_names) || [];
                        if (!gNames || gNames.length === 0) return null;
                        return <div style={{ fontSize: '.95rem' }}>{gNames.join(' · ')}</div>;
                     })()}
                   </div>
                   <div style={{ marginTop: 10 }}>
                     <p className="modal-overview">{(details && ((details as any).overview || (details as any).description || (details as any).tagline)) || 'Sin descripción disponible'}</p>
                   </div>
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
