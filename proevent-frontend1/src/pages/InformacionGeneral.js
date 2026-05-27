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
    <section>
      <h3>Información General</h3>

      {/* Título del evento */}
      <label>Título del Evento</label>
      <input
        type="text"
        placeholder="Título del Evento"
        value={data.titulo}
        onChange={(e) => setData({ ...data, titulo: e.target.value })}
        required
      />

      {/* Dependencia — cargada desde la BD */}
      <label>Dependencia solicitante</label>
      <select value={data.id_dependencia} onChange={handleDependencia} required>
        <option value="">Seleccione una dependencia...</option>
        {dependencias.map(d => (
          <option key={d.id_dependencia} value={d.id_dependencia}>{d.nombre}</option>
        ))}
      </select>

      {/* Tipo de evento */}
      <label>Tipo de Evento</label>
      <select
        value={data.tipo}
        onChange={(e) => setData({ ...data, tipo: e.target.value })}
        required
      >
        <option value="">Seleccione Tipo de Evento</option>
        {tiposEvento.map(t => (
          <option key={t.id_tipo_evento} value={t.nombre}>{t.nombre}</option>
        ))}
      </select>


      {/* Fechas y horas */}
      <label htmlFor="inicio">Fecha de inicio</label>
      <input
        id="inicio"
        type="date"
        value={data.inicio}
        onChange={(e) => setData({ ...data, inicio: e.target.value })}
        required
      />

      <label htmlFor="horaInicio">Hora de inicio</label>
      <input
        id="horaInicio"
        type="time"
        value={data.horaInicio || ""}
        onChange={(e) => setData({ ...data, horaInicio: e.target.value })}
        required
      />

      <label htmlFor="fin">Fecha de finalización</label>
      <input
        id="fin"
        type="date"
        value={data.fin}
        onChange={(e) => setData({ ...data, fin: e.target.value })}
        required
      />

      <label htmlFor="horaFin">Hora de cierre</label>
      <input
        id="horaFin"
        type="time"
        value={data.horaFin || ""}
        onChange={(e) => setData({ ...data, horaFin: e.target.value })}
        required
      />
    </section>
  );
}
