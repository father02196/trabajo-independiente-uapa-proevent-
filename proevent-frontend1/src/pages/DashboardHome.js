import React from "react";
import DashboardAdmin from "./dashboards/DashboardAdmin";
import DashboardSolicitante from "./dashboards/DashboardSolicitante";
import DashboardEspecialista from "./dashboards/DashboardEspecialista";

function DashboardHome({ usuario, onEditEvent, setActiveTab }) {
  // Determinar qué dashboard mostrar según el rol del usuario
  
  const rol = usuario?.rol || "Solicitante";

  if (rol === "Administrador" || rol === "Administrador V-A-F") {
    return (
      <DashboardAdmin 
        usuario={usuario} 
        onEditEvent={onEditEvent} 
        setActiveTab={setActiveTab} 
      />
    );
  }

  if (rol === "Administrador de Evento" || rol === "Administrador de Audiovisual") {
    return (
      <DashboardEspecialista 
        usuario={usuario} 
        onEditEvent={onEditEvent} 
        setActiveTab={setActiveTab} 
      />
    );
  }

  // Por defecto (o si es "Solicitante")
  return (
    <DashboardSolicitante 
      usuario={usuario} 
      onEditEvent={onEditEvent} 
      setActiveTab={setActiveTab} 
    />
  );
}

export default DashboardHome;
