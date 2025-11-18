import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './TopNavbar.css';

const TopNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Rutas donde ocultar la navbar
    const hideNavbarPaths = ['/register', '/login'];

    // Si la ruta actual coincide o empieza con alguna ruta a ocultar, no renderizar navbar
    if (hideNavbarPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const handleLogout = (): void => {
        // Limpiar datos de sesión
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        console.log('Cerrando sesión...');

        // Redirigir al login
        navigate('/login');
    };

    return (
        <nav className="top-navbar">
            <div className="navbar-container">
                {/* Logo */}
                <div className="navbar-logo">
                    <img src="/logo.png" alt="Logo" className="logo-image" />
                </div>

                {/* Navigation Links */}
                <ul className="navbar-menu">
                    <li className="navbar-item">
                        <Link to="/explorar" className="navbar-link">
                            Explorar
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/novedades" className="navbar-link">
                            Novedades
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/mi-lista" className="navbar-link">
                            Mi Lista
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/admin" className="navbar-link">
                            Admin
                        </Link>
                    </li>
                </ul>

                {/* Logout Icon */}
                <div className="navbar-logout">
                    <button onClick={handleLogout} className="logout-button" title="Cerrar sesión">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
