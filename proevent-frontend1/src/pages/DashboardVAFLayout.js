import React, { useState } from "react";
import { FiLogOut, FiPieChart, FiDollarSign, FiCalendar, FiHeadphones, FiChevronDown, FiChevronRight, FiMenu } from "react-icons/fi";
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

  // Funciones de navegación
  const handleNav = (tab) => setActiveTab(tab);

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

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Sidebar Ocultable */}
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`} style={{ 
        boxShadow: "2px 0 10px rgba(0,0,0,0.05)", 
        transition: "width 0.3s ease",
        zIndex: 1000,
        backgroundColor: "var(--color-uapa-navy)", // Mantiene la identidad de la marca
        color: "white"
      }}>
        <div className="sidebar-header" style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isSidebarOpen ? (
            <img src={uapaLogo} alt="UAPA Logo" style={{ maxWidth: '80%', filter: 'brightness(0) invert(1)' }} />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '20px' }}>U</div>
          )}
        </div>

        <ul className="sidebar-menu" style={{ padding: "15px 10px", marginTop: "10px" }}>
          {/* SECCIÓN V-A-F */}
          <li className="menu-category" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '15px 0 5px 15px', fontWeight: 'bold', letterSpacing: '1px' }}>
            {isSidebarOpen && "Finanzas y POA"}
          </li>
          
          <li className={activeTab === "DashboardVAF" ? "active" : ""} onClick={() => handleNav("DashboardVAF")}>
            <FiPieChart size={18} /> {isSidebarOpen && <span>Dashboard Financiero</span>}
          </li>
          
          <li className={activeTab === "PoaAdmin" ? "active" : ""} onClick={() => handleNav("PoaAdmin")}>
            <FiPieChart size={18} /> {isSidebarOpen && <span>POA Global</span>}
          </li>

          <li className={activeTab === "FlujoAdministrativo" ? "active" : ""} onClick={() => handleNav("FlujoAdministrativo")}>
            <FiDollarSign size={18} /> {isSidebarOpen && <span>Presupuesto Eventos</span>}
          </li>

          <li className="menu-category" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '20px 0 5px 15px', fontWeight: 'bold', letterSpacing: '1px' }}>
            {isSidebarOpen && "Herramientas"}
          </li>

          <li className={activeTab === "Calendario" ? "active" : ""} onClick={() => handleNav("Calendario")}>
            <FiCalendar size={18} /> {isSidebarOpen && <span>Calendario</span>}
          </li>
          <li className={activeTab === "Soporte" ? "active" : ""} onClick={() => handleNav("Soporte")}>
            <FiHeadphones size={18} /> {isSidebarOpen && <span>Soporte Técnico</span>}
          </li>
        </ul>

        {/* Footer del Sidebar con info de usuario */}
        <div className="sidebar-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "15px" }}>
          {isSidebarOpen && (
            <div className="user-info-minimal" style={{ marginBottom: "15px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold" }}>{usuario?.nombre || "VAF"}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{usuario?.rol}</div>
            </div>
          )}
          <button onClick={onLogout} className="logout-btn" style={{ width: '100%', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,0,0,0.2)' }}>
            <FiLogOut size={16} /> {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen ? "expanded" : "collapsed"}`} style={{ flex: 1, display: "flex", flexDirection: "column", transition: "margin-left 0.3s ease" }}>
        
        {/* Top Navbar */}
        <header className="dashboard-header" style={{ background: "white", padding: "15px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 900 }}>
          <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-sidebar-btn" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "5px", display: "flex" }}>
              <FiMenu size={24} />
            </button>
            <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
              <span style={{ color: "var(--color-uapa-navy)" }}>ProEvent UAPA</span>
              <FiChevronRight size={14} />
              <span>{activeTab === "DashboardVAF" ? "Dashboard" : activeTab === "PoaAdmin" ? "POA Global" : activeTab === "FlujoAdministrativo" ? "Presupuesto Eventos" : activeTab}</span>
            </div>
          </div>
          
          <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <NotificationBell 
                usuario={usuario} 
                onGoToPoaAdmin={() => setActiveTab("PoaAdmin")}
            />
            <div className="user-profile-header" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div className="avatar" style={{ width: "35px", height: "35px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-uapa-navy), #3b82f6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "V"}
              </div>
              <div className="user-details" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{usuario?.nombre}</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>{usuario?.rol}</span>
              </div>
              <FiChevronDown size={14} color="#64748b" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area" style={{ padding: "30px", flex: 1, overflowY: "auto", background: "#f8fafc" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
