import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiStar, FiHeadphones, FiActivity, FiUsers, FiList, FiCalendar, FiMonitor, FiBox, FiChevronDown, FiChevronRight, FiTruck, FiClipboard, FiMenu, FiCheckCircle } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";
import eventosIcon from "./../img/eventos.png";

import DashboardSolicitante from "./dashboards/DashboardSolicitante";
import Eventos from "./Eventos";
import SoporteHome from "./SoporteHome";
import Evaluacion from "./Evaluacion";
import Calendario from "./Calendario";
import HistorialSolicitudes from "./HistorialSolicitudes";
import NotificationBell from "./NotificationBell";

function DashboardSolicitanteLayout({ usuario, onLogoutClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const handleNavigate = (path) => {
        navigate(path);
    };

    const getPageTitle = () => {
        if (currentPath.includes("/solicitante/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/solicitante/eventos/solicitud")) return "Solicitud de Eventos";
        if (currentPath.includes("/solicitante/eventos/historial")) return "Mi Historial de Solicitudes";
        if (currentPath.includes("/solicitante/evaluacion")) return "Evaluación de Servicios";
        if (currentPath.includes("/solicitante/soporte")) return "Soporte y Ayuda";
        return "Dashboard del Solicitante";
    };

    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "Eventos": "/solicitante/eventos/solicitud",
            "HistorialSolicitudes": "/solicitante/eventos/historial",
            "Evaluacion": "/solicitante/evaluacion",
            "Soporte": "/solicitante/soporte"
        };
        if(routesMap[tab]) navigate(routesMap[tab]);
    };

    return (
        <div className={`dashboard-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
            <aside className={`dashboard-sidebar${isSidebarOpen ? '' : ' sidebar-hidden'}`}>
                <div className="sidebar-brand-custom">
                    <img src={emblemProevent} alt="Emblema UAPA" className="brand-emblem-img" />
                    <div className="brand-text-block">
                        <span className="brand-title">
                            <span className="brand-uapa">UAPA</span><span className="brand-dash">-</span><span className="brand-proevent">ProEvent</span>
                        </span>
                        <span className="brand-subtitle">Portal del Solicitante</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/solicitante" || currentPath === "/solicitante/" ? "active" : ""} onClick={() => handleNavigate("/solicitante")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/solicitante/calendario") ? "active" : ""} onClick={() => handleNavigate("/solicitante/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>

                        <li className={currentPath.includes("/solicitante/eventos/solicitud") ? "active" : ""} onClick={() => handleNavigate("/solicitante/eventos/solicitud")}>
                            <img src={eventosIcon} alt="Eventos" className="nav-icon-img" /> Solicitud de Eventos
                        </li>
                        <li className={currentPath.includes("/solicitante/eventos/historial") ? "active" : ""} onClick={() => handleNavigate("/solicitante/eventos/historial")}>
                            <FiList className="action-icon" /> Mi Historial de Solicitudes
                        </li>

                        <li className={currentPath.includes("/solicitante/evaluacion") ? "active" : ""} onClick={() => handleNavigate("/solicitante/evaluacion")}>
                            <FiStar className="action-icon" /> Evaluación
                        </li>
                        <li className={currentPath.includes("/solicitante/soporte") ? "active" : ""} onClick={() => handleNavigate("/solicitante/soporte")}>
                            <FiHeadphones className="action-icon" /> Soporte
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-user-section">
                    <div className={`user-logout-menu ${userMenuOpen ? "open" : ""}`}>
                        <button type="button" className="logout-button" onClick={onLogoutClick}>
                            <FiLogOut className="action-icon" aria-hidden="true" />
                            Cerrar sesión
                        </button>
                    </div>
                    <div className="user-profile-toggle" onClick={toggleUserMenu}>
                        <div className="user-avatar">
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div className="user-info">
                            <h4>{usuario?.nombre || "Usuario"}</h4>
                            <span>{usuario?.rol || "Rol no definido"}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            type="button"
                            className="hamburger-btn"
                            onClick={toggleSidebar}
                            title={isSidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
                            aria-label="Toggle sidebar"
                        >
                            <FiMenu size={22} />
                        </button>
                        <h1>{getPageTitle()}</h1>
                    </div>
                    <div className="header-actions">
                        <NotificationBell 
                            usuario={usuario} 
                            onGoToEvaluacion={() => handleNavigate('/solicitante/evaluacion')} 
                        />
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-content">
                        <Routes>
                        <Route path="/" element={<DashboardSolicitante usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        <Route path="eventos/solicitud" element={<Eventos usuario={usuario} />} />
                        <Route path="eventos/historial" element={<HistorialSolicitudes usuario={usuario} />} />
                        <Route path="evaluacion" element={<Evaluacion usuario={usuario} />} />
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />

                        <Route path="*" element={<Navigate to="/solicitante" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardSolicitanteLayout;
