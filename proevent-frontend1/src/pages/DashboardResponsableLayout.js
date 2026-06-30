import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiHeadphones, FiActivity, FiCalendar, FiChevronDown, FiMenu } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";
import eventosIcon from "./../img/eventos.png";
import audiovisualIcon from "./../img/audiovisual.png";

import DashboardResponsable from "./dashboards/DashboardResponsable";
import Eventos from "./Eventos";
import Calendario from "./Calendario";
import SoporteHome from "./SoporteHome";
import VisualizarEvaluaciones from "./VisualizarEvaluaciones";
import NotificationBell from "./NotificationBell";

function DashboardResponsableLayout({ usuario, onLogoutClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const handleNavigate = (path) => navigate(path);

    const getPageTitle = () => {
        if (currentPath.includes("/responsable/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/responsable/eventos")) return "Solicitud de Eventos";
        if (currentPath.includes("/responsable/audiovisual")) return "Solicitud de Audiovisual";
        if (currentPath.includes("/responsable/soporte")) return "Soporte y Ayuda";
        if (currentPath.includes("/responsable/evaluaciones")) return "Historial de Evaluaciones";
        return "Dashboard de Responsable";
    };

    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "Eventos": "/responsable/eventos",
            "Audiovisual": "/responsable/audiovisual",
            "Soporte": "/responsable/soporte",
            "VisualizarEvaluaciones": "/responsable/evaluaciones"
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
                        <span className="brand-subtitle">Responsable de Área</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/responsable" || currentPath === "/responsable/" ? "active" : ""} onClick={() => handleNavigate("/responsable")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/responsable/calendario") ? "active" : ""} onClick={() => handleNavigate("/responsable/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>

                        <li className={currentPath.includes("/responsable/eventos") ? "active" : ""} onClick={() => handleNavigate("/responsable/eventos")}>
                            <img src={eventosIcon} alt="Eventos" className="nav-icon-img" /> Solicitud de Eventos
                        </li>
                        
                        <li className={currentPath.includes("/responsable/audiovisual") ? "active" : ""} onClick={() => handleNavigate("/responsable/audiovisual")}>
                            <img src={audiovisualIcon} alt="Audiovisual" className="nav-icon-img" /> Solicitud de Audiovisual
                        </li>

                        <li className={currentPath.includes("/responsable/soporte") ? "active" : ""} onClick={() => handleNavigate("/responsable/soporte")}>
                            <FiHeadphones className="action-icon" /> Soporte
                        </li>
                        <li className={currentPath.includes("/responsable/evaluaciones") ? "active" : ""} onClick={() => handleNavigate("/responsable/evaluaciones")}>
                            <FiActivity className="action-icon" /> Visualizar Evaluaciones
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-user-section">
                    <div className={`user-logout-menu ${userMenuOpen ? "open" : ""}`}>
                        <button className="logout-button" onClick={onLogoutClick}>
                            <FiLogOut className="action-icon" aria-hidden="true" />
                            Cerrar sesión
                        </button>
                    </div>
                    <div className="user-profile-toggle" onClick={toggleUserMenu}>
                        <div className="user-avatar">
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "R"}
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
                        <NotificationBell usuario={usuario} />
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-content">
                        <Routes>
                        <Route path="/" element={<DashboardResponsable usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        <Route path="eventos" element={<Eventos usuario={usuario} />} />
                        <Route path="audiovisual" element={<Eventos usuario={usuario} />} />
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />
                        <Route path="evaluaciones" element={<VisualizarEvaluaciones />} />

                        <Route path="*" element={<Navigate to="/responsable" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardResponsableLayout;
