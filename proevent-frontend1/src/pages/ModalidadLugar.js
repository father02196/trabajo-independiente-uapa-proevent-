import React, { useEffect, useState } from "react";
import { FiMapPin, FiVideo, FiMonitor } from "react-icons/fi";

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
    { value: "Presencial", label: "Presencial", icon: <FiMapPin size={28} />, desc: "En un lugar físico" },
    { value: "Virtual",    label: "Virtual",    icon: <FiMonitor size={28} />, desc: "En línea / streaming" },
    { value: "Híbrido",    label: "Híbrido",    icon: <FiVideo size={28} />, desc: "Presencial y virtual" },
  ];

  const handleRecinto = (e) => {
    const selected = recintos.find(r => String(r.id_recinto) === e.target.value);
    setData({ ...data, id_recinto: e.target.value, campus: selected ? selected.nombre : "" });
  };

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Modalidad y Lugar</h3>
        <p className="text-sm text-text-secondary">Define cómo y dónde se llevará a cabo el evento.</p>
      </div>

      {/* Selector de modalidad */}
      <div>
        <label className="block text-sm font-bold text-text-main mb-3">
          Modalidad del evento <span className="text-danger">*</span>
        </label>
        <div className="modalidad-container">
          {opciones.map((op) => {
            const isActive = data.modalidad === op.value;
            return (
              <label
                key={op.value}
                className={`modalidad-card${isActive ? " active" : ""}`}
              >
                <input
                  type="radio"
                  name="modalidad"
                  value={op.value}
                  checked={isActive}
                  onChange={(e) => setData({ ...data, modalidad: e.target.value })}
                />
                <div style={{ fontSize: "28px", color: isActive ? "#3B82F6" : "#94A3B8", marginBottom: "8px" }}>
                  {op.icon}
                </div>
                <h4>{op.label}</h4>
                <p>{op.desc}</p>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recinto */}
        <div>
          <label htmlFor="recinto" className="block text-sm font-bold text-text-main mb-2">
            Recinto <span className="text-danger">*</span>
          </label>
          <select
            id="recinto"
            className="input-base"
            value={data.id_recinto}
            onChange={handleRecinto}
            required
          >
            <option value="">-- Seleccione un recinto --</option>
            {recintos.map(r => (
              <option key={r.id_recinto} value={r.id_recinto}>{r.nombre}</option>
            ))}
          </select>
        </div>

        {/* Cantidad de asistentes */}
        <div>
          <label htmlFor="asistentes" className="block text-sm font-bold text-text-main mb-2">
            Cantidad estimada de asistentes <span className="text-danger">*</span>
          </label>
          <input
            id="asistentes"
            type="number"
            min="1"
            className="input-base"
            placeholder="Ingrese número de personas"
            value={data.asistentes}
            onChange={(e) => setData({ ...data, asistentes: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
}
