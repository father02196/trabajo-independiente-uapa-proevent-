import React, { useEffect, useState } from "react";
import presencialIcon from "../pages/img/presencial.png";
import virtualIcon from "../pages/img/virtual.png";
import hibridoIcon from "../pages/img/hibrido.png";

const API = "http://localhost:8080";

export default function ModalidadLugar({ data, setData }) {
  const [recintos, setRecintos] = useState([]);

  useEffect(() => {
    fetch(`${API}/recintos`)
      .then(res => res.json())
      .then(lista => setRecintos(Array.isArray(lista) ? lista : []))
      .catch(() => console.error("Error cargando recintos"));
  }, []);

  const opciones = [
    { value: "Presencial", label: "Presencial", icon: presencialIcon },
    { value: "Virtual",    label: "Virtual",    icon: virtualIcon    },
    { value: "Híbrido",   label: "Híbrido",   icon: hibridoIcon    },
  ];

  const handleRecinto = (e) => {
    const selected = recintos.find(r => String(r.id_recinto) === e.target.value);
    setData({
      ...data,
      id_recinto: e.target.value,
      campus: selected ? selected.nombre : ""
    });
  };

  return (
    <section>
      <h3>Modalidad y Lugar</h3>

      {/* Selector de modalidad con íconos */}
      <div className="modalidad-container">
        {opciones.map((op) => (
          <label
            key={op.value}
            className={`modalidad-card ${data.modalidad === op.value ? "active" : ""}`}
          >
            <input
              type="radio"
              value={op.value}
              checked={data.modalidad === op.value}
              onChange={(e) => setData({ ...data, modalidad: e.target.value })}
            />
            <img src={op.icon} alt={op.label} className="modalidad-icon" />
            <span>{op.label}</span>
          </label>
        ))}
      </div>

      {/* Recinto — cargado desde la BD */}
      <label htmlFor="recinto">Recinto</label>
      <select id="recinto" value={data.id_recinto} onChange={handleRecinto} required>
        <option value="">Seleccione un recinto...</option>
        {recintos.map(r => (
          <option key={r.id_recinto} value={r.id_recinto}>{r.nombre}</option>
        ))}
      </select>

      {/* Cantidad de asistentes */}
      <label htmlFor="asistentes">Cantidad estimada de asistentes</label>
      <input
        id="asistentes"
        type="number"
        min="1"
        placeholder="Ingrese número de personas"
        value={data.asistentes}
        onChange={(e) => setData({ ...data, asistentes: e.target.value })}
        required
      />
    </section>
  );
}
