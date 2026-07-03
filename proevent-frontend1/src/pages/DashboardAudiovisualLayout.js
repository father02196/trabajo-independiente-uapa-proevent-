import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiHeadphones, FiActivity, FiList, FiCalendar, FiMonitor, FiBox, FiChevronDown, FiChevronRight, FiMenu } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";
import audiovisualIcon from "./../img/audiovisual.png";

import DashboardAudiovisual from "./dashboards/DashboardAudiovisual";
import Eventos from "./Eventos";
import Audiovisual from "./Audiovisual";
import AdminAudiovisual from "./AdminAudiovisual";
import InventarioAudiovisual from "./InventarioAudiovisual";
import GestionSolicitudesAV from "./GestionSolicitudesAV";
import Calendario from "./Calendario";
import SoporteHome from "./SoporteHome";
import VisualizarEvaluaciones from "./VisualizarEvaluaciones";
import NotificationBell from "./NotificationBell";

function DashboardAudiovisualLayout({ usuario, onLogoutClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({ audiovisual: true, admin: true });

    const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const handleNavigate = (path) => navigate(path);

    const getPageTitle = () => {
        if (currentPath.includes("/audiovisual/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/audiovisual/solicitud")) return "Solicitud de Audiovisual";
        if (currentPath.includes("/audiovisual/gestion")) return "Gestión de Solicitudes Audiovisuales";
        if (currentPath.includes("/audiovisual/catalogo")) return "Catálogo Audiovisual";
        if (currentPath.includes("/audiovisual/inventario")) return "Inventario Audiovisual";
        if (currentPath.includes("/audiovisual/soporte")) return "Soporte y Ayuda";
        if (currentPath.includes("/audiovisual/evaluaciones")) return "Historial de Evaluaciones";
        return "Dashboard de Audiovisual";
    };

    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "GestionSolicitudes": "/audiovisual/gestion",
            "AdminAudiovisual": "/audiovisual/catalogo",
            "InventarioAV": "/audiovisual/inventario"
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
                        <span className="brand-subtitle">Depto. Audiovisual</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/audiovisual" || currentPath === "/audiovisual/" ? "active" : ""} onClick={() => handleNavigate("/audiovisual")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/audiovisual/calendario") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>

                        {/* Módulo Audiovisual */}
                        <li className="nav-group-header" onClick={() => toggleMenu('audiovisual')}>
                            <span>Módulo Audiovisual</span>
                            {openMenus.audiovisual ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.audiovisual ? 'open' : ''}`}>
                            <li className={currentPath.includes("/audiovisual/solicitud") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/solicitud")}>
                                <img src={audiovisualIcon} alt="Audiovisual" className="nav-icon-img" /> Solicitud de Audiovisual
                            </li>
                            <li className={currentPath.includes("/audiovisual/gestion") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/gestion")}>
                                <FiList className="action-icon" /> Gestión de solicitudes
                            </li>
                            <li className={currentPath.includes("/audiovisual/catalogo") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/catalogo")}>
                                <FiMonitor className="action-icon" /> Catálogo Audiovisual
                            </li>
                            <li className={currentPath.includes("/audiovisual/inventario") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/inventario")}>
                                <FiBox className="action-icon" /> Inventario Audiovisual
                            </li>
                        </ul>

                        {/* Administración */}
                        <li className="nav-group-header" onClick={() => toggleMenu('admin')}>
                            <span>Administración</span>
                            {openMenus.admin ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.admin ? 'open' : ''}`}>
                            <li className={currentPath.includes("/audiovisual/soporte") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/soporte")}>
                                <FiHeadphones className="action-icon" /> Soporte
                            </li>
                            <li className={currentPath.includes("/audiovisual/evaluaciones") ? "active" : ""} onClick={() => handleNavigate("/audiovisual/evaluaciones")}>
                                <FiActivity className="action-icon" /> Visualizar Evaluaciones
                            </li>
                        </ul>
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
                        <Route path="/" element={<DashboardAudiovisual usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        
                        <Route path="solicitud" element={<Audiovisual usuario={usuario} />} />
                        <Route path="gestion" element={<GestionSolicitudesAV usuario={usuario} />} />
                        <Route path="catalogo" element={<AdminAudiovisual usuario={usuario} />} />
                        <Route path="inventario" element={<InventarioAudiovisual usuario={usuario} />} />
                        
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />
                        <Route path="evaluaciones" element={<VisualizarEvaluaciones />} />

                        <Route path="*" element={<Navigate to="/audiovisual" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardAudiovisualLayout;
