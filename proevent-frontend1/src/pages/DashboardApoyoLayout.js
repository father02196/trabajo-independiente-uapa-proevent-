import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiStar, FiHeadphones, FiActivity, FiUsers, FiList, FiCalendar, FiMonitor, FiBox, FiChevronDown, FiChevronRight, FiTruck, FiClipboard, FiMenu, FiCheckCircle } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";

import DashboardApoyo from "./dashboards/DashboardApoyo";
import MisTareasApoyo from "./MisTareasApoyo";
import Calendario from "./Calendario";
import SoporteHome from "./SoporteHome";
import VisualizarEvaluaciones from "./VisualizarEvaluaciones";
import NotificationBell from "./NotificationBell";

function DashboardApoyoLayout({ usuario, onLogoutClick }) {
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
        if (currentPath.includes("/apoyo/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/apoyo/tareas")) return "Mi Checklist de Tareas";
        if (currentPath.includes("/apoyo/soporte")) return "Soporte y Ayuda";
        if (currentPath.includes("/apoyo/evaluaciones")) return "Historial de Evaluaciones";
        return "Dashboard de Apoyo Logístico";
    };

    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "CronogramaGlobal": "/apoyo/tareas",
            "Soporte": "/apoyo/soporte",
            "VisualizarEvaluaciones": "/apoyo/evaluaciones"
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
                        <span className="brand-subtitle">Personal Operativo</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/apoyo" || currentPath === "/apoyo/" ? "active" : ""} onClick={() => handleNavigate("/apoyo")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/apoyo/calendario") ? "active" : ""} onClick={() => handleNavigate("/apoyo/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>
                        <li className={currentPath.includes("/apoyo/tareas") ? "active" : ""} onClick={() => handleNavigate("/apoyo/tareas")}>
                            <FiCheckCircle className="action-icon" /> Mi Checklist de Tareas
                        </li>
                        <li className={currentPath.includes("/apoyo/soporte") ? "active" : ""} onClick={() => handleNavigate("/apoyo/soporte")}>
                            <FiHeadphones className="action-icon" /> Soporte
                        </li>
                        <li className={currentPath.includes("/apoyo/evaluaciones") ? "active" : ""} onClick={() => handleNavigate("/apoyo/evaluaciones")}>
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
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "A"}
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
                        <Route path="/" element={<DashboardApoyo usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        <Route path="tareas" element={<MisTareasApoyo usuario={usuario} />} />
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />
                        <Route path="evaluaciones" element={<VisualizarEvaluaciones />} />

                        <Route path="*" element={<Navigate to="/apoyo" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardApoyoLayout;
