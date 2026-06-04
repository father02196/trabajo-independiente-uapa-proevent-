import React, { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function InformacionGeneral({ data, setData }) {
  const [dependencias, setDependencias] = useState([]);
  const [tiposEvento, setTiposEvento] = useState([]);

  useEffect(() => {
    fetch(`${API}/dependencias`)
      .then(res => res.json())
      .then(lista => setDependencias(Array.isArray(lista) ? lista : []))
      .catch(() => console.error("Error cargando dependencias"));

    fetch(`${API}/tipos-evento`)
      .then(res => res.json())
      .then(lista => setTiposEvento(Array.isArray(lista) ? lista : []))
      .catch(() => console.error("Error cargando tipos de evento"));
  }, []);

  const handleDependencia = (e) => {
    const selected = dependencias.find(d => String(d.id_dependencia) === e.target.value);
    setData({
      ...data,
      id_dependencia: e.target.value,
      departamento: selected ? selected.nombre : ""
    });
  };

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Información General</h3>
        <p className="text-sm text-text-secondary">Proporciona los datos básicos de tu evento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título del evento */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-bold text-text-main mb-2">Título del Evento <span className="text-danger">*</span></label>
          <input
            type="text"
            className="input-base"
            placeholder="Ej: Congreso de Ingeniería de Software"
            value={data.titulo}
            onChange={(e) => setData({ ...data, titulo: e.target.value })}
            required
          />
        </div>

        {/* Dependencia */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-2">Dependencia solicitante <span className="text-danger">*</span></label>
          <select 
            className="input-base"
            value={data.id_dependencia} 
            onChange={handleDependencia} 
            required
          >
            <option value="">-- Seleccione una dependencia --</option>
            {dependencias.map(d => (
              <option key={d.id_dependencia} value={d.id_dependencia}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tipo de evento */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-2">Tipo de Evento <span className="text-danger">*</span></label>
          <select
            className="input-base"
            value={data.tipo}
            onChange={(e) => setData({ ...data, tipo: e.target.value })}
            required
          >
            <option value="">-- Seleccione Tipo de Evento --</option>
            {tiposEvento.map(t => (
              <option key={t.id_tipo_evento} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Fecha Inicio */}
        <div>
          <label htmlFor="inicio" className="block text-sm font-bold text-text-main mb-2">Fecha de inicio <span className="text-danger">*</span></label>
          <input
            id="inicio"
            type="date"
            className="input-base"
            value={data.inicio}
            onChange={(e) => setData({ ...data, inicio: e.target.value })}
            required
          />
        </div>

        {/* Hora Inicio */}
        <div>
          <label htmlFor="horaInicio" className="block text-sm font-bold text-text-main mb-2">Hora de inicio <span className="text-danger">*</span></label>
          <input
            id="horaInicio"
            type="time"
            className="input-base"
            value={data.horaInicio || ""}
            onChange={(e) => setData({ ...data, horaInicio: e.target.value })}
            required
          />
        </div>

        {/* Fecha Fin */}
        <div>
          <label htmlFor="fin" className="block text-sm font-bold text-text-main mb-2">Fecha de finalización <span className="text-danger">*</span></label>
          <input
            id="fin"
            type="date"
            className="input-base"
            value={data.fin}
            onChange={(e) => setData({ ...data, fin: e.target.value })}
            required
          />
        </div>

        {/* Hora Fin */}
        <div>
          <label htmlFor="horaFin" className="block text-sm font-bold text-text-main mb-2">Hora de cierre <span className="text-danger">*</span></label>
          <input
            id="horaFin"
            type="time"
            className="input-base"
            value={data.horaFin || ""}
            onChange={(e) => setData({ ...data, horaFin: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
}
