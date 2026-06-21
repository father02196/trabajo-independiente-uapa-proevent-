// ============================================================
// COMPONENTE: DashboardComprasLayout
// Pertenece a: Módulo de Compras / Layout
// Propósito: Contenedor principal (Layout) para el usuario de Compras.
// Muestra el sidebar con el menú de navegación y renderiza el 
// contenido activo correspondiente a este rol.
// ============================================================

import React, { useState } from "react";
import { FiLogOut, FiHeadphones, FiList, FiCalendar, FiChevronDown, FiChevronRight, FiTruck, FiClipboard, FiMenu } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";

import DashboardCompras from "./DashboardCompras";
import Calendario from "./Calendario";
import ModuloProveedores from "./ModuloProveedores";
import GestionCategorias from "./GestionCategorias";
import FlujoAdministrativo from "./FlujoAdministrativo";
import SoporteHome from "./SoporteHome";
import NotificationBell from "./NotificationBell";

function DashboardComprasLayout({ usuario, onLogoutClick }) {
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem("dashboard_activeTab") || "Dashboard";
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const [openMenus, setOpenMenus] = useState(() => {
        const savedMenus = sessionStorage.getItem("dashboard_openMenus");
        return savedMenus ? JSON.parse(savedMenus) : {
            proveedores: false
        };
    });

    // --- EFECTOS: Sincronización con Session Storage ---
    React.useEffect(() => {
        sessionStorage.setItem("dashboard_activeTab", activeTab);
    }, [activeTab]);

    React.useEffect(() => {
        sessionStorage.setItem("dashboard_openMenus", JSON.stringify(openMenus));
    }, [openMenus]);

    // --- FUNCIONES DE NAVEGACIÓN Y MENÚ ---
    const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    // --- FUNCIÓN: renderContent ---
    // Renderiza el componente correcto según el tab activo
    const renderContent = () => {
        switch (activeTab) {
            case "Dashboard":
                return <DashboardCompras usuario={usuario} setActiveTab={setActiveTab} />;
            case "FlujoAdministrativo":
                return <FlujoAdministrativo usuario={usuario} />;
            case "Calendario":
                return <Calendario usuario={usuario} />;
            case "Proveedores":
                return <ModuloProveedores usuario={usuario} />;
            case "GestionCategorias":
                return <GestionCategorias usuario={usuario} />;
            case "Soporte":
                return <SoporteHome usuario={usuario} />;
            default:
                return <DashboardCompras usuario={usuario} setActiveTab={setActiveTab} />;
        }
    };

    const getPageTitle = () => {
        switch (activeTab) {
            case "Dashboard":
                return "Dashboard de Compras";
            case "FlujoAdministrativo":
                return "Flujo Administrativo (Legal, Compras, Presupuesto)";
            case "Calendario":
                return "Calendario Logístico";
            case "Proveedores":
                return "Directorio de Proveedores";
            case "GestionCategorias":
                return "Gestión de Categorías";
            case "Soporte":
                return "Soporte y Ayuda";
            default:
                return "Dashboard de Compras";
        }
    };

    return (
        <div className={`dashboard-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
            <aside className={`dashboard-sidebar${isSidebarOpen ? '' : ' sidebar-hidden'}`}>
                <div className="sidebar-brand-custom">
                    <img src={emblemProevent} alt="Emblema UAPA" className="brand-emblem-img" />
                    <div className="brand-text-block">
                        <span className="brand-title">
                            <span className="brand-uapa">UAPA</span>
                            <span className="brand-dash">-</span>
                            <span className="brand-proevent">ProEvent</span>
                        </span>
                        <span className="brand-subtitle">Sistema de Gestión de Eventos</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={activeTab === "Dashboard" ? "active" : ""} onClick={() => setActiveTab("Dashboard")}>
                            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
                            Dashboard Compras
                        </li>
                        <li className={activeTab === "FlujoAdministrativo" ? "active" : ""} onClick={() => setActiveTab("FlujoAdministrativo")}>
                            <FiClipboard className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                            Análisis B2B y Compras
                        </li>
                        <li className={activeTab === "Calendario" ? "active" : ""} onClick={() => setActiveTab("Calendario")}>
                            <FiCalendar className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                            Calendario Logístico
                        </li>
                        <li className="nav-group-header" onClick={() => toggleMenu('proveedores')}>
                            <span>Directorio Proveedores</span>
                            {openMenus.proveedores ? <FiChevronDown className="action-icon" /> : <FiChevronRight className="action-icon" />}
                        </li>
                        <ul className={`nav-submenu ${openMenus.proveedores ? 'open' : ''}`}>
                            <li className={activeTab === "Proveedores" ? "active" : ""} onClick={() => setActiveTab("Proveedores")}>
                                <FiTruck className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                                Cuentas B2B
                            </li>
                            <li className={activeTab === "GestionCategorias" ? "active" : ""} onClick={() => setActiveTab("GestionCategorias")}>
                                <FiList className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                                Categorías de Licitación
                            </li>
                        </ul>
                        <li className={activeTab === "Soporte" ? "active" : ""} onClick={() => setActiveTab("Soporte")}>
                            <FiHeadphones className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                            Soporte
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
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "CO"}
                        </div>
                        <div className="user-info">
                            <h4>{usuario?.nombre || "Usuario Compras"}</h4>
                            <span>{usuario?.rol || "Compras"}</span>
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
                        <NotificationBell
                            usuario={usuario}
                            onGoToGestionEventos={() => setActiveTab("FlujoAdministrativo")}
                        />
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-content">{renderContent()}</div>
                </div>
            </main>
        </div>
    );
}

export default DashboardComprasLayout;
