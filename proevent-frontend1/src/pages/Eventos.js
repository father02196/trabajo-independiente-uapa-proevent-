// ============================================================
// COMPONENTE: Eventos
// Pertenece a: Módulo de Solicitudes / Eventos
// Propósito: Componente integrador que renderiza el formulario
// de "NuevaSolicitudEvento" y, si se está en modo edición,
// muestra pestañas extra para gestionar el Cronograma Logístico.
// ============================================================

import React, { useState } from 'react';
import '../css/Eventos.css';
import NuevaSolicitudEvento from './NuevaSolicitudEvento';
import CronogramaLogistico from './CronogramaLogistico';

function Eventos({ usuario, editingEvent, setEditingEvent }) {
  // --- ESTADOS: Persistencia del tab activo ---
  const [activeSection, setActiveSection] = useState(() => {
      return localStorage.getItem("eventos_activeSection") || "Información General";
  });

  React.useEffect(() => {
      localStorage.setItem("eventos_activeSection", activeSection);
  }, [activeSection]);

  // --- VARIABLES DERIVADAS ---
  // Secciones extra para modo edición (cronograma y licitaciones)
  const showExtraTabs = Boolean(editingEvent) && usuario?.rol !== "Solicitante";

  const extraSecciones = ["Cronograma Logístico"];
  
  // Efecto para destrabar si quedó pegado en el localstorage un tab al que no tiene acceso
  React.useEffect(() => {
      if (!showExtraTabs && extraSecciones.includes(activeSection)) {
          setActiveSection("Información General");
      }
  }, [showExtraTabs, activeSection]);

  const activeExtraTab = (showExtraTabs && extraSecciones.includes(activeSection)) ? activeSection : null;

  // Si se seleccionó una sección extra, renderizar esos componentes
  if (activeExtraTab === "Cronograma Logístico") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {showExtraTabs && (
          <div className="modern-tabs" style={{ marginBottom: '0' }}>
            <button onClick={() => setActiveSection("Información General")}>
              ← Solicitud de Evento
            </button>
            <button className="active">Cronograma Logístico</button>
          </div>
        )}
        <CronogramaLogistico evento={editingEvent} usuario={usuario} />
      </div>
    );
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Extra tabs solo en modo edición */}
      {showExtraTabs && (
        <div className="modern-tabs" style={{ marginBottom: '0' }}>
          <button className="active">Solicitud de Evento</button>
          <button onClick={() => setActiveSection("Cronograma Logístico")}>Cronograma Logístico</button>
        </div>
      )}

      {/* El formulario multipaso — ya tiene su propio header y wizard */}
      <NuevaSolicitudEvento
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        usuario={usuario}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
      />
    </div>
  );
}

export default Eventos;
