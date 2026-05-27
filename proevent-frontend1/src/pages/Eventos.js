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

  const secciones = [
    "Información General",
    "Modalidad y Lugar",
    "Servicios alimenticios y Detalles coorporativos",
    "Presupuesto y POA"
  ];

  if (editingEvent) {
    secciones.push("Cronograma Logístico", "Licitaciones B2B");
  }

  return (
    <div className="eventos-container">
      <h2>Gestión de Eventos</h2>

      {/* Barra de pestañas */}
      <div className="tabs">
        {secciones.map(s => (
          <button
            key={s}
            className={activeSection === s ? "active" : ""}
            onClick={() => setActiveSection(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Formulario dinámico */}
      <main className="form-container">
        {activeSection === "Cronograma Logístico" ? (
          <CronogramaLogistico evento={editingEvent} usuario={usuario} />
        ) : activeSection === "Licitaciones B2B" ? (
          <LicitacionesB2B evento={editingEvent} usuario={usuario} />
        ) : (
          <NuevaSolicitudEvento
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            usuario={usuario}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
          />
        )}
      </main>
    </div>
  );
}

export default Eventos;
