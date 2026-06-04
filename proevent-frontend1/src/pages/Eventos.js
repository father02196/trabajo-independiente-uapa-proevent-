import React, { useState } from 'react';
import '../css/Eventos.css';
import NuevaSolicitudEvento from './NuevaSolicitudEvento';
import CronogramaLogistico from './CronogramaLogistico';
import LicitacionesB2B from './LicitacionesB2B';

function Eventos({ usuario, editingEvent, setEditingEvent }) {
  // --- Persistencia del activeSection en la creación de eventos ---
  const [activeSection, setActiveSection] = useState(() => {
      return localStorage.getItem("eventos_activeSection") || "Información General";
  });

  React.useEffect(() => {
      localStorage.setItem("eventos_activeSection", activeSection);
  }, [activeSection]);

  // Secciones extra para modo edición (cronograma y licitaciones)
  const showExtraTabs = Boolean(editingEvent);

  const extraSecciones = ["Cronograma Logístico", "Licitaciones B2B"];
  const activeExtraTab = extraSecciones.includes(activeSection) ? activeSection : null;

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
            <button onClick={() => setActiveSection("Licitaciones B2B")}>Licitaciones B2B</button>
          </div>
        )}
        <CronogramaLogistico evento={editingEvent} usuario={usuario} />
      </div>
    );
  }

  if (activeExtraTab === "Licitaciones B2B") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {showExtraTabs && (
          <div className="modern-tabs" style={{ marginBottom: '0' }}>
            <button onClick={() => setActiveSection("Información General")}>
              ← Solicitud de Evento
            </button>
            <button onClick={() => setActiveSection("Cronograma Logístico")}>Cronograma Logístico</button>
            <button className="active">Licitaciones B2B</button>
          </div>
        )}
        <LicitacionesB2B evento={editingEvent} usuario={usuario} />
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
          <button onClick={() => setActiveSection("Licitaciones B2B")}>Licitaciones B2B</button>
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
