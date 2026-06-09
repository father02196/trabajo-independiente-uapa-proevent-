import React, { useState } from "react";
import { FiLogOut, FiPieChart, FiDollarSign, FiCalendar, FiHeadphones, FiMenu } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";

// Importar los componentes que usará el VAF
import DashboardVAF from "./DashboardVAF";
import FlujoAdministrativo from "./FlujoAdministrativo";
import PoaAdmin from "./PoaAdmin";
import EventCalendar from "./Calendario";
import SoporteHome from "./SoporteHome";
import NotificationBell from "./NotificationBell";

export default function DashboardVAFLayout({ usuario, onLogout }) {
  const [activeTab, setActiveTab] = useState("DashboardVAF");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Renderizador principal del contenido
  const renderContent = () => {
    switch (activeTab) {
      case "DashboardVAF": return <DashboardVAF usuario={usuario} />;
      case "FlujoAdministrativo": return <FlujoAdministrativo usuario={usuario} />;
      case "PoaAdmin": return <PoaAdmin usuario={usuario} />;
      case "Calendario": return <EventCalendar usuario={usuario} />;
      case "Soporte": return <SoporteHome />;
      default: return <DashboardVAF usuario={usuario} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "DashboardVAF":
        return "Dashboard Financiero";
      case "FlujoAdministrativo":
        return "Presupuesto Eventos";
      case "PoaAdmin":
        return "POA Global";
      case "Calendario":
        return "Calendario";
      case "Soporte":
        return "Soporte y Ayuda";
      default:
        return "Dashboard Financiero";
    }
  };

  return (
    <div className={`dashboard-layout${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <aside className={`dashboard-sidebar${isSidebarOpen ? '' : ' sidebar-hidden'}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <img src={uapaLogo} alt="UAPA Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <h2>PROEVENT</h2>
            <p>SISTEMA DE EVENTOS</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "DashboardVAF" ? "active" : ""} onClick={() => setActiveTab("DashboardVAF")}>
              <FiPieChart className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Dashboard Financiero
            </li>
            <li className={activeTab === "PoaAdmin" ? "active" : ""} onClick={() => setActiveTab("PoaAdmin")}>
              <FiPieChart className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              POA Global
            </li>
            <li className={activeTab === "FlujoAdministrativo" ? "active" : ""} onClick={() => setActiveTab("FlujoAdministrativo")}>
              <FiDollarSign className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Presupuesto Eventos
            </li>
            <li className={activeTab === "Calendario" ? "active" : ""} onClick={() => setActiveTab("Calendario")}>
              <FiCalendar className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Calendario
            </li>
            <li className={activeTab === "Soporte" ? "active" : ""} onClick={() => setActiveTab("Soporte")}>
              <FiHeadphones className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Soporte
            </li>
          </ul>
        </nav>

        <div className="sidebar-user-section">
          <div className={`user-logout-menu ${userMenuOpen ? "open" : ""}`}>
            <button className="logout-button" onClick={onLogout}>
              <FiLogOut className="action-icon" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
          <div className="user-profile-toggle" onClick={toggleUserMenu}>
            <div className="user-avatar">
              {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "V"}
            </div>
            <div className="user-info">
              <h4>{usuario?.nombre || "Usuario VAF"}</h4>
              <span>{usuario?.rol || "Administrador V-A-F"}</span>
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
            <NotificationBell usuario={usuario} onGoToPoaAdmin={() => setActiveTab("PoaAdmin")} />
          </div>
        </header>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
