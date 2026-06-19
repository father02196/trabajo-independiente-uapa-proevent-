// ============================================================
// COMPONENTE: DashboardLegalLayout
// Pertenece a: Módulo Legal / Layout
// Propósito: Contenedor principal (Layout) para el usuario de Legal.
// Gestiona el menú lateral, estado de la sesión y renderiza
// dinámicamente las vistas legales (Contratos, Dictámenes).
// ============================================================

import React, { useState } from "react";
import { FiLogOut, FiHeadphones, FiCalendar, FiShield, FiMenu } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";
import dashboardIcon from "./../img/dashboard.png";

import DashboardLegal from "./DashboardLegal";
import Calendario from "./Calendario";
import FlujoAdministrativo from "./FlujoAdministrativo";
import SoporteHome from "./SoporteHome";
import NotificationBell from "./NotificationBell";

function DashboardLegalLayout({ usuario, onLogoutClick }) {
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem("dashboard_legal_activeTab") || "Dashboard";
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // --- EFECTOS: Sincronización con Session Storage ---
    React.useEffect(() => {
        sessionStorage.setItem("dashboard_legal_activeTab", activeTab);
    }, [activeTab]);

    // --- FUNCIONES DE INTERFAZ ---
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    // --- FUNCIÓN: renderContent ---
    // Retorna la vista correspondiente a la sección legal actual
    const renderContent = () => {
        switch (activeTab) {
            case "Dashboard":
                return <DashboardLegal usuario={usuario} setActiveTab={setActiveTab} />;
            case "FlujoAdministrativo":
                return <FlujoAdministrativo usuario={usuario} />;
            case "Calendario":
                return <Calendario usuario={usuario} />;
            case "Soporte":
                return <SoporteHome usuario={usuario} />;
            default:
                return <DashboardLegal usuario={usuario} setActiveTab={setActiveTab} />;
        }
    };

    const getPageTitle = () => {
        switch (activeTab) {
            case "Dashboard":
                return "Dashboard Legal";
            case "FlujoAdministrativo":
                return "Dictámenes y Contratos";
            case "Calendario":
                return "Calendario Jurídico";
            case "Soporte":
                return "Soporte y Ayuda";
            default:
                return "Dashboard Legal";
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
                            Dashboard Legal
                        </li>
                        <li className={activeTab === "FlujoAdministrativo" ? "active" : ""} onClick={() => setActiveTab("FlujoAdministrativo")}>
                            <FiShield className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                            Dictámenes y Contratos
                        </li>
                        <li className={activeTab === "Calendario" ? "active" : ""} onClick={() => setActiveTab("Calendario")}>
                            <FiCalendar className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
                            Calendario Jurídico
                        </li>
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
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "LE"}
                        </div>
                        <div className="user-info">
                            <h4>{usuario?.nombre || "Usuario Legal"}</h4>
                            <span>{usuario?.rol || "Legal"}</span>
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
                    <div className="dashboard-content">{renderContent()}</div>
                </div>
            </main>
        </div>
    );
}

export default DashboardLegalLayout;
