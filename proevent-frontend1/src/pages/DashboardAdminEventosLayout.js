import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiStar, FiHeadphones, FiActivity, FiList, FiCalendar, FiChevronDown, FiChevronRight, FiMenu, FiClipboard } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";
import eventosIcon from "./../img/eventos.png";

import DashboardAdminEventos from "./dashboards/DashboardAdminEventos";
import Eventos from "./Eventos";
import AdminEvento from "./AdminEvento";
import GestionEventos from "./GestionEventos";
import Calendario from "./Calendario";
import Evaluacion from "./Evaluacion";
import SoporteHome from "./SoporteHome";
import VisualizarEvaluaciones from "./VisualizarEvaluaciones";
import NotificationBell from "./NotificationBell";

function DashboardAdminEventosLayout({ usuario, onLogoutClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({ eventos: true, admin: true });

    const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const handleNavigate = (path) => navigate(path);

    const getPageTitle = () => {
        if (currentPath.includes("/admin-eventos/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/admin-eventos/eventos/solicitud")) return "Solicitud de Eventos";
        if (currentPath.includes("/admin-eventos/eventos/catalogos")) return "Catálogos de Eventos";
        if (currentPath.includes("/admin-eventos/eventos/gestion")) return "Gestión de Solicitudes";
        if (currentPath.includes("/admin-eventos/evaluacion")) return "Evaluación de Servicios";
        if (currentPath.includes("/admin-eventos/soporte")) return "Soporte y Ayuda";
        if (currentPath.includes("/admin-eventos/evaluaciones")) return "Historial de Evaluaciones";
        return "Dashboard de Administrador de Eventos";
    };

    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "Eventos": "/admin-eventos/eventos/solicitud",
            "GestionEventos": "/admin-eventos/eventos/gestion"
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
                        <span className="brand-subtitle">Coordinación Eventos</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/admin-eventos" || currentPath === "/admin-eventos/" ? "active" : ""} onClick={() => handleNavigate("/admin-eventos")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/admin-eventos/calendario") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>

                        {/* Módulo Eventos */}
                        <li className="nav-group-header" onClick={() => toggleMenu('eventos')}>
                            <span>Módulo Eventos</span>
                            {openMenus.eventos ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.eventos ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin-eventos/eventos/solicitud") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/eventos/solicitud")}>
                                <img src={eventosIcon} alt="Eventos" className="nav-icon-img" /> Solicitud de Eventos
                            </li>
                            <li className={currentPath.includes("/admin-eventos/eventos/catalogos") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/eventos/catalogos")}>
                                <FiList className="action-icon" /> Catálogos de Eventos
                            </li>
                            <li className={currentPath.includes("/admin-eventos/eventos/gestion") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/eventos/gestion")}>
                                <FiClipboard className="action-icon" /> Gestión de Solicitudes
                            </li>
                        </ul>

                        {/* Administración */}
                        <li className="nav-group-header" onClick={() => toggleMenu('admin')}>
                            <span>Administración</span>
                            {openMenus.admin ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.admin ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin-eventos/evaluacion") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/evaluacion")}>
                                <FiStar className="action-icon" /> Evaluación
                            </li>
                            <li className={currentPath.includes("/admin-eventos/soporte") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/soporte")}>
                                <FiHeadphones className="action-icon" /> Soporte
                            </li>
                            <li className={currentPath.includes("/admin-eventos/evaluaciones") ? "active" : ""} onClick={() => handleNavigate("/admin-eventos/evaluaciones")}>
                                <FiActivity className="action-icon" /> Visualizar Evaluaciones
                            </li>
                        </ul>
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
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "E"}
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
                            onGoToGestionEventos={() => handleNavigate('/admin-eventos/eventos/gestion')}
                        />
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-content">
                        <Routes>
                        <Route path="/" element={<DashboardAdminEventos usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        
                        <Route path="eventos/solicitud" element={<Eventos usuario={usuario} />} />
                        <Route path="eventos/catalogos" element={<AdminEvento usuario={usuario} />} />
                        <Route path="eventos/gestion" element={<GestionEventos usuario={usuario} />} />
                        
                        <Route path="evaluacion" element={<Evaluacion usuario={usuario} />} />
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />
                        <Route path="evaluaciones" element={<VisualizarEvaluaciones />} />

                        <Route path="*" element={<Navigate to="/admin-eventos" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardAdminEventosLayout;
