import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiStar, FiHeadphones, FiActivity, FiUsers, FiList, FiCalendar, FiMonitor, FiBox, FiChevronDown, FiChevronRight, FiTruck, FiClipboard, FiMenu, FiCheckCircle } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";
import eventosIcon from "./../img/eventos.png";
import audiovisualIcon from "./../img/audiovisual.png";

import DashboardAdmin from "./dashboards/DashboardAdmin";
import Eventos from "./Eventos";
import Audiovisual from "./Audiovisual";
import AjustesUsuarios from "./AjustesUsuarios";
import Bitacora from "./Bitacora";
import SoporteHome from "./SoporteHome";
import Evaluacion from "./Evaluacion";
import AdminAudiovisual from "./AdminAudiovisual";
import InventarioAudiovisual from "./InventarioAudiovisual";
import AdminEvento from "./AdminEvento";
import Calendario from "./Calendario";
import GestionSolicitudesAV from "./GestionSolicitudesAV";
import PoaAdmin from "./PoaAdmin";
import GestionPresupuestaria from "./GestionPresupuestaria";
import VisualizarEvaluaciones from "./VisualizarEvaluaciones";
import NotificationBell from "./NotificationBell";
import ModuloProveedores from "./ModuloProveedores";
import GestionCategorias from "./GestionCategorias";
import FlujoAdministrativo from "./FlujoAdministrativo";
import GestionEventos from "./GestionEventos";

function DashboardAdminLayout({ usuario, onLogoutClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({
        eventos: true,
        audiovisual: true,
        admin: true,
        proveedores: true
    });

    const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const handleNavigate = (path) => {
        navigate(path);
    };

    const getPageTitle = () => {
        if (currentPath.includes("/admin/calendario")) return "Calendario de Eventos";
        if (currentPath.includes("/admin/flujo-administrativo")) return "Flujo Administrativo";
        if (currentPath.includes("/admin/eventos/solicitud")) return "Solicitud de Eventos";
        if (currentPath.includes("/admin/eventos/catalogos")) return "Catálogos de Eventos";
        if (currentPath.includes("/admin/eventos/gestion")) return "Gestión de Solicitudes";
        if (currentPath.includes("/admin/audiovisual/gestion")) return "Gestión de Solicitudes Audiovisuales";
        if (currentPath.includes("/admin/audiovisual/catalogo")) return "Catálogo Audiovisual";
        if (currentPath.includes("/admin/audiovisual/inventario")) return "Inventario Audiovisual";
        if (currentPath.includes("/admin/proveedores/gestion")) return "Gestión Operativa";
        if (currentPath.includes("/admin/proveedores/categorias")) return "Gestión de Categorías";
        if (currentPath.includes("/admin/evaluacion")) return "Evaluación";
        if (currentPath.includes("/admin/soporte")) return "Soporte";
        if (currentPath.includes("/admin/evaluaciones")) return "Historial de Evaluaciones";
        if (currentPath.includes("/admin/ajustes")) return "Ajustes de Sistema";
        if (currentPath.includes("/admin/poa")) return "Plan Operativo Anual";
        if (currentPath.includes("/admin/presupuesto")) return "Gestión Presupuestaria";
        if (currentPath.includes("/admin/bitacora")) return "Actividad de Usuario";
        return "Dashboard de Eventos";
    };

    // Adaptador para el DashboardAdmin que usa setActiveTab internamente
    const mockSetActiveTab = (tab) => {
        const routesMap = {
            "GestionEventos": "/admin/eventos/gestion",
            "Ajustes": "/admin/ajustes",
            "PoaAdmin": "/admin/poa",
            "Bitacora": "/admin/bitacora",
            "Eventos": "/admin/eventos/solicitud",
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
                        <span className="brand-subtitle">Administración Principal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={currentPath === "/admin" || currentPath === "/admin/" ? "active" : ""} onClick={() => handleNavigate("/admin")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" /> Dashboard
                        </li>
                        <li className={currentPath.includes("/admin/calendario") ? "active" : ""} onClick={() => handleNavigate("/admin/calendario")}>
                            <FiCalendar className="action-icon" /> Calendario
                        </li>
                        <li className={currentPath.includes("/admin/flujo-administrativo") ? "active" : ""} onClick={() => handleNavigate("/admin/flujo-administrativo")}>
                            <FiClipboard className="action-icon" /> Flujo Administrativo
                        </li>

                        {/* Módulo Eventos */}
                        <li className="nav-group-header" onClick={() => toggleMenu('eventos')}>
                            <span>Módulo Eventos</span>
                            {openMenus.eventos ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.eventos ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin/eventos/solicitud") ? "active" : ""} onClick={() => handleNavigate("/admin/eventos/solicitud")}>
                                <img src={eventosIcon} alt="Eventos" className="nav-icon-img" /> Solicitud de Eventos
                            </li>
                            <li className={currentPath.includes("/admin/eventos/catalogos") ? "active" : ""} onClick={() => handleNavigate("/admin/eventos/catalogos")}>
                                <FiList className="action-icon" /> Catálogos de Eventos
                            </li>
                            <li className={currentPath.includes("/admin/eventos/gestion") ? "active" : ""} onClick={() => handleNavigate("/admin/eventos/gestion")}>
                                <FiClipboard className="action-icon" /> Gestión de Solicitudes
                            </li>
                        </ul>

                        {/* Módulo Audiovisual */}
                        <li className="nav-group-header" onClick={() => toggleMenu('audiovisual')}>
                            <span>Módulo Audiovisual</span>
                            {openMenus.audiovisual ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.audiovisual ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin/audiovisual/solicitud") ? "active" : ""} onClick={() => handleNavigate("/admin/audiovisual/solicitud")}>
                                <img src={audiovisualIcon} alt="Audiovisual" className="nav-icon-img" /> Solicitud de Audiovisual
                            </li>
                            <li className={currentPath.includes("/admin/audiovisual/gestion") ? "active" : ""} onClick={() => handleNavigate("/admin/audiovisual/gestion")}>
                                <FiList className="action-icon" /> Gestión de solicitudes
                            </li>
                            <li className={currentPath.includes("/admin/audiovisual/catalogo") ? "active" : ""} onClick={() => handleNavigate("/admin/audiovisual/catalogo")}>
                                <FiMonitor className="action-icon" /> Catálogo Audiovisual
                            </li>
                            <li className={currentPath.includes("/admin/audiovisual/inventario") ? "active" : ""} onClick={() => handleNavigate("/admin/audiovisual/inventario")}>
                                <FiBox className="action-icon" /> Inventario Audiovisual
                            </li>
                        </ul>

                        {/* Módulo Proveedores */}
                        <li className="nav-group-header" onClick={() => toggleMenu('proveedores')}>
                            <span>Módulo Proveedores</span>
                            {openMenus.proveedores ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.proveedores ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin/proveedores/gestion") ? "active" : ""} onClick={() => handleNavigate("/admin/proveedores/gestion")}>
                                <FiTruck className="action-icon" /> Gestión Operativa
                            </li>
                            <li className={currentPath.includes("/admin/proveedores/categorias") ? "active" : ""} onClick={() => handleNavigate("/admin/proveedores/categorias")}>
                                <FiList className="action-icon" /> Gestión de Categorías
                            </li>
                        </ul>

                        {/* Administración general */}
                        <li className="nav-group-header" onClick={() => toggleMenu('admin')}>
                            <span>Administración</span>
                            {openMenus.admin ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.admin ? 'open' : ''}`}>
                            <li className={currentPath.includes("/admin/evaluacion") ? "active" : ""} onClick={() => handleNavigate("/admin/evaluacion")}>
                                <FiStar className="action-icon" /> Evaluación
                            </li>
                            <li className={currentPath.includes("/admin/soporte") ? "active" : ""} onClick={() => handleNavigate("/admin/soporte")}>
                                <FiHeadphones className="action-icon" /> Soporte
                            </li>
                            <li className={currentPath.includes("/admin/evaluaciones") ? "active" : ""} onClick={() => handleNavigate("/admin/evaluaciones")}>
                                <FiActivity className="action-icon" /> Visualizar Evaluaciones
                            </li>
                            <li className={currentPath.includes("/admin/ajustes") ? "active" : ""} onClick={() => handleNavigate("/admin/ajustes")}>
                                <FiSettings className="action-icon" /> Ajustes
                            </li>
                            <li className={currentPath.includes("/admin/poa") ? "active" : ""} onClick={() => handleNavigate("/admin/poa")}>
                                <FiClipboard className="action-icon" /> POA Administrativo
                            </li>
                            <li className={currentPath.includes("/admin/presupuesto") ? "active" : ""} onClick={() => handleNavigate("/admin/presupuesto")}>
                                <FiActivity className="action-icon" /> Gestión Presupuestaria
                            </li>
                            <li className={currentPath.includes("/admin/bitacora") ? "active" : ""} onClick={() => handleNavigate("/admin/bitacora")}>
                                <FiActivity className="action-icon" /> Bitácora
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
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "U"}
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
                        <NotificationBell usuario={usuario} />
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-content">
                        <Routes>
                        <Route path="/" element={<DashboardAdmin usuario={usuario} setActiveTab={mockSetActiveTab} />} />
                        <Route path="calendario" element={<Calendario usuario={usuario} />} />
                        <Route path="flujo-administrativo" element={<FlujoAdministrativo usuario={usuario} />} />
                        
                        <Route path="eventos/solicitud" element={<Eventos usuario={usuario} />} />
                        <Route path="eventos/catalogos" element={<AdminEvento usuario={usuario} />} />
                        <Route path="eventos/gestion" element={<GestionEventos usuario={usuario} />} />
                        
                        <Route path="audiovisual/solicitud" element={<Audiovisual usuario={usuario} />} />
                        <Route path="audiovisual/gestion" element={<GestionSolicitudesAV usuario={usuario} />} />
                        <Route path="audiovisual/catalogo" element={<AdminAudiovisual usuario={usuario} />} />
                        <Route path="audiovisual/inventario" element={<InventarioAudiovisual usuario={usuario} />} />
                        
                        <Route path="proveedores/gestion" element={<ModuloProveedores usuario={usuario} />} />
                        <Route path="proveedores/categorias" element={<GestionCategorias usuario={usuario} />} />
                        
                        <Route path="evaluacion" element={<Evaluacion usuario={usuario} />} />
                        <Route path="soporte" element={<SoporteHome usuario={usuario} />} />
                        <Route path="evaluaciones" element={<VisualizarEvaluaciones />} />
                        <Route path="ajustes" element={<AjustesUsuarios usuario={usuario} />} />
                        <Route path="poa" element={<PoaAdmin usuario={usuario} />} />
                        <Route path="presupuesto" element={<GestionPresupuestaria usuario={usuario} />} />
                        <Route path="bitacora" element={<Bitacora />} />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardAdminLayout;
