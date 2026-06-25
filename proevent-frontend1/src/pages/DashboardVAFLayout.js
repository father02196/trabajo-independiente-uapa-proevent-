// ============================================================
// COMPONENTE: DashboardVAFLayout
// Pertenece a: M├│dulo Financiero (VAF) / Layout
// Prop├│sito: Contenedor principal (Layout) para el administrador
// de Presupuesto (VAF). Maneja la navegaci├│n lateral y el 
// renderizado de las vistas financieras.
// ============================================================

import React, { useState } from "react";
import { FiLogOut, FiPieChart, FiDollarSign, FiCalendar, FiHeadphones, FiMenu, FiTrendingUp } from "react-icons/fi";
import "./../css/Dashboard.css";
import uapaLogo from "./../img/Logo-blanco-UAPA.png";
import emblemProevent from "./../img/Emblema-Proevent.jpeg";

// Importar los componentes que usar├í el VAF
import DashboardVAF from "./DashboardVAF";
import PoaAdmin from "./PoaAdmin";
import GestionPresupuestaria from "./GestionPresupuestaria";
import EventCalendar from "./Calendario";
import SoporteHome from "./SoporteHome";
import NotificationBell from "./NotificationBell";

export default function DashboardVAFLayout({ usuario, onLogout }) {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState("DashboardVAF");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // --- FUNCIONES DE INTERFAZ ---
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // --- FUNCI├ôN: renderContent ---
  const renderContent = () => {
    switch (activeTab) {
      case "DashboardVAF": return <DashboardVAF usuario={usuario} setActiveTab={setActiveTab} />;
      case "PoaAdmin": return <PoaAdmin usuario={usuario} setActiveTab={setActiveTab} />;
      case "GestionPresupuestaria": return <GestionPresupuestaria usuario={usuario} setActiveTab={setActiveTab} />;
      case "Calendario": return <EventCalendar usuario={usuario} setActiveTab={setActiveTab} />;
      case "Soporte": return <SoporteHome setActiveTab={setActiveTab} />;
      default: return <DashboardVAF usuario={usuario} setActiveTab={setActiveTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "DashboardVAF":
        return "Dashboard Financiero";
      case "PoaAdmin":
        return "Plan Operativo Anual";
      case "GestionPresupuestaria":
        return "Gesti├│n Presupuestaria";
      case "Calendario":
        return "Calendario de Eventos";
      case "Soporte":
        return "Soporte y Ayuda";
      default:
        return "Dashboard Financiero";
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
            <span className="brand-subtitle">Sistema de Gesti├│n de Eventos</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "DashboardVAF" ? "active" : ""} onClick={() => setActiveTab("DashboardVAF")}>
              <FiPieChart className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Dashboard
            </li>
            <li className={activeTab === "Calendario" ? "active" : ""} onClick={() => setActiveTab("Calendario")}>
              <FiCalendar className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Calendario
            </li>

            <li className={activeTab === "PoaAdmin" ? "active" : ""} onClick={() => setActiveTab("PoaAdmin")}>
              <FiDollarSign className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Presupuesto (POA)
            </li>
            <li className={activeTab === "GestionPresupuestaria" ? "active" : ""} onClick={() => setActiveTab("GestionPresupuestaria")}>
              <FiTrendingUp className="action-icon" style={{ fontSize: '18px', opacity: 0.9, flexShrink: 0 }} aria-hidden="true" />
              Gesti├│n Presupuestaria
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
              Cerrar sesi├│n
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
              title={isSidebarOpen ? 'Colapsar men├║' : 'Expandir men├║'}
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
