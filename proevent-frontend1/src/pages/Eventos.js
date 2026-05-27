import React, { useState } from 'react';
import '../css/Eventos.css';
import NuevaSolicitudEvento from './NuevaSolicitudEvento';

function Eventos({ usuario, editingEvent, setEditingEvent }) {
  const [activeSection, setActiveSection] = useState("Información General");

  const secciones = [
    "Información General",
    "Modalidad y Lugar",
    "Servicios alimenticios y Detalles coorporativos",
    "Presupuesto y POA"
  ];

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
        <NuevaSolicitudEvento
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          usuario={usuario}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
        />
      </main>
    </div>
  );
}

export default Eventos;
