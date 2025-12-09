import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginInicial from './Components/login';
import Catalog from './Components/catalogStatus/catalog.tsx';
import RegisterInicial from "./Components/register.tsx";
import TopNavBar from './Components/common/TopNavbar.tsx'; // Ajusta la ruta según tu estructura
import AdminDashboard from './Components/admin/AdminDashboard.tsx';
import { isAdmin } from './services/auth';
import SectionUnavailable from './Components/common/SectionUnavailable.tsx';

const AppContent: React.FC = () => {
    const location = useLocation();
    const showNavBar = location.pathname !== '/login' && location.pathname !== '/';

    return (
        <>
            {showNavBar && <TopNavBar />}
            <Routes>
                <Route
                    path="/login"
                    element={<LoginInicial/>}
                />
                <Route
                    path="/register"
                    element={<RegisterInicial/>}
                />
                <Route
                    path="/home"
                    element={<Catalog />}
                />
                <Route
                    path="/explorar"
                    element={<Catalog />}
                />
                <Route
                    path="/admin"
                    element={isAdmin() ? <AdminDashboard /> : <Navigate to="/home" replace />}
                />
                <Route
                    path="/novedades"
                    element={<SectionUnavailable title="Novedades" description="Aún no hay novedades disponibles." />}
                />
                <Route
                    path="/mi-lista"
                    element={<SectionUnavailable title="Mi Lista" description="Tu lista personalizada estará disponible pronto." />}
                />
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />
            </Routes>
        </>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
