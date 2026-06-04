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
    { value: "Presencial", label: "Presencial", icon: <FiMapPin className="text-3xl mb-2" /> },
    { value: "Virtual",    label: "Virtual",    icon: <FiMonitor className="text-3xl mb-2" /> },
    { value: "Híbrido",    label: "Híbrido",    icon: <FiVideo className="text-3xl mb-2" /> },
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
    <div className="space-y-8 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Modalidad y Lugar</h3>
        <p className="text-sm text-text-secondary">Define cómo y dónde se llevará a cabo el evento.</p>
      </div>

      {/* Selector de modalidad */}
      <div>
        <label className="block text-sm font-bold text-text-main mb-3">Modalidad del evento <span className="text-danger">*</span></label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opciones.map((op) => {
            const isActive = data.modalidad === op.value;
            return (
              <label
                key={op.value}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover-lift ${
                  isActive 
                    ? 'border-accent-primary bg-accent-light text-accent-primary shadow-sm' 
                    : 'border-border-soft bg-bg-card hover:border-border-medium text-text-muted'
                }`}
              >
                <input
                  type="radio"
                  name="modalidad"
                  value={op.value}
                  checked={isActive}
                  onChange={(e) => setData({ ...data, modalidad: e.target.value })}
                  className="hidden"
                />
                {op.icon}
                <span className="font-bold">{op.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recinto */}
        <div>
          <label htmlFor="recinto" className="block text-sm font-bold text-text-main mb-2">Recinto <span className="text-danger">*</span></label>
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
          <label htmlFor="asistentes" className="block text-sm font-bold text-text-main mb-2">Cantidad estimada de asistentes <span className="text-danger">*</span></label>
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
