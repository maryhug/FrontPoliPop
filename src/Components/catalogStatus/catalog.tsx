import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './catalog.css';

interface Movie {
    id: number;
    title: string;
    genre: string;
    year: string;
    image: string;
    rating: number;
}

const Catalog: React.FC = () => {
    const navigate = useNavigate();

    // Verificar autenticación al montar el componente
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const movies: Movie[] = [
        {
            id: 1,
            title: "Avatar",
            genre: "Ciencia Ficción",
            year: "2009",
            image: "/images/avatar.jpg",
            rating: 7.9
        },
        {
            id: 2,
            title: "Avengers: Endgame",
            genre: "Acción",
            year: "2019",
            image: "/images/endgame.jpg",
            rating: 8.4
        },
        {
            id: 3,
            title: "Titanic",
            genre: "Drama",
            year: "1997",
            image: "/images/titanic.jpg",
            rating: 7.8
        },
        {
            id: 4,
            title: "Star Wars",
            genre: "Ciencia Ficción",
            year: "1977",
            image: "/images/starwars.jpg",
            rating: 8.6
        },
        {
            id: 5,
            title: "Jurassic Park",
            genre: "Aventura",
            year: "1993",
            image: "/images/jurassic.jpg",
            rating: 8.1
        },
        {
            id: 6,
            title: "El Rey León",
            genre: "Animación",
            year: "1994",
            image: "/images/lionking.jpg",
            rating: 8.5
        },
        {
            id: 7,
            title: "Matrix",
            genre: "Ciencia Ficción",
            year: "1999",
            image: "/images/matrix.jpg",
            rating: 8.7
        },
        {
            id: 8,
            title: "Forrest Gump",
            genre: "Drama",
            year: "1994",
            image: "/images/forestgump.jpg",
            rating: 8.8
        }
    ];

    const handleMovieClick = (movie: Movie): void => {
        console.log('Película seleccionada:', movie.title);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
        e.currentTarget.src = '/images/placeholder.jpg';
    };

    const handleLogout = (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

    return (
        <div className="catalog-container">
            <h2 className="catalog-title">Catálogo de Películas</h2>
            <div className="movies-horizontal">
                {movies.map((movie: Movie) => (
                    <div
                        key={movie.id}
                        className="movie-card"
                        onClick={() => handleMovieClick(movie)}
                    >
                        <div className="movie-image-container">
                            <img
                                src={movie.image}
                                alt={movie.title}
                                className="movie-image"
                                onError={handleImageError}
                            />
                            <div className="movie-overlay">
                                <button className="play-button">▶</button>
                            </div>
                        </div>
                        <div className="movie-info">
                            <h3 className="movie-title">{movie.title}</h3>
                            <div className="movie-details">
                                <span className="movie-year">{movie.year}</span>
                                <span className="movie-genre">{movie.genre}</span>
                                <span className="movie-rating">⭐ {movie.rating}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Catalog;