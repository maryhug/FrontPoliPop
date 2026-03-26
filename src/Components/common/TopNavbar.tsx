import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './TopNavbar.css';
import { isAdmin } from '../../services/auth';

const TopNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Rutas donde ocultar la navbar
    const hideNavbarPaths = ['/register', '/login'];

    if (hideNavbarPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const handleLogout = (): void => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
                        <Link to="/explorar" className="navbar-link">Explorar</Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/novedades" className="navbar-link">Novedades</Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/mi-lista" className="navbar-link">Mi Lista</Link>
                    </li>
                    {isAdmin() && (
                        <li className="navbar-item">
                            <Link to="/admin" className="navbar-link admin-link" title="Panel de Administración">
                                <span>Admin</span>
                            </Link>
                        </li>
                    )}
                </ul>

                {/* Actions */}
                <div className="navbar-actions">
                    <button
                        onClick={() => navigate('/perfil')}
                        className="profile-button"
                        title="Mi perfil"
                        aria-label="Mi perfil"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                    </button>
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