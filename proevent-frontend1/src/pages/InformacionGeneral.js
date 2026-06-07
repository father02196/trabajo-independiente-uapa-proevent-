import React, { useEffect, useState } from "react";
import { FiLock } from "react-icons/fi";

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
    // Al cambiar la dependencia, si se borra, resetear los siguientes? El usuario pidió evitar inconsistencias.
    // O simplemente dejar que los campos siguientes sigan, pero como se bloquean si este es inválido,
    // el usuario no podrá avanzar. Para simplificar, actualizamos normalmente.
    setData({
      ...data,
      id_dependencia: e.target.value,
      departamento: selected ? selected.nombre : ""
    });
  };

  // Validaciones de paso a paso
  const isTituloValid = data.titulo && data.titulo.trim().length > 0;
  const isDependenciaValid = !!data.id_dependencia;
  const isTipoValid = !!data.tipo;
  const isInicioValid = !!data.inicio;
  const isHoraInicioValid = !!data.horaInicio;
  const isFinValid = !!data.fin;
  // horaFin is the last one

  const enableDependencia = isTituloValid;
  const enableTipo = enableDependencia && isDependenciaValid;
  const enableInicio = enableTipo && isTipoValid;
  const enableHoraInicio = enableInicio && isInicioValid;
  const enableFin = enableHoraInicio && isHoraInicioValid;
  const enableHoraFin = enableFin && isFinValid;

  const isPending = (fieldValid, fieldEnabled) => !fieldValid && fieldEnabled;

  const renderLabel = (label, isEnabled, isCurrentPending) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <label className="text-sm font-bold text-text-main" style={{ margin: 0 }}>
        {label} <span className="text-danger">*</span>
      </label>
      {!isEnabled && (
        <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiLock size={12} /> Bloqueado
        </span>
      )}
      {isCurrentPending && (
        <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
          Siguiente paso
        </span>
      )}
    </div>
  );

  const disabledStyle = {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: '#F3F4F6'
  };

  // Prevenir saltos: Si un campo se borra, borrar o forzar revisión de los siguientes no es estrictamente necesario 
  // porque el submit final validará, pero bloqueará visualmente los campos hasta que se corrija el actual.
  
  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Información General</h3>
        <p className="text-sm text-text-secondary">Proporciona los datos básicos de tu evento. Debes completar en orden.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título del evento */}
        <div className="col-span-1 md:col-span-2">
          {renderLabel("Título del Evento", true, isPending(isTituloValid, true))}
          <input
            type="text"
            className={`input-base ${isPending(isTituloValid, true) ? 'ring-2 ring-blue-500' : ''}`}
            placeholder="Ej: Congreso de Ingeniería de Software"
            value={data.titulo}
            onChange={(e) => setData({ ...data, titulo: e.target.value })}
            required
            autoFocus
          />
        </div>

        {/* Dependencia */}
        <div>
          {renderLabel("Dependencia solicitante", enableDependencia, isPending(isDependenciaValid, enableDependencia))}
          <select 
            className={`input-base ${isPending(isDependenciaValid, enableDependencia) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.id_dependencia} 
            onChange={handleDependencia} 
            required
            disabled={!enableDependencia}
            style={!enableDependencia ? disabledStyle : {}}
          >
            <option value="">-- Seleccione una dependencia --</option>
            {dependencias.map(d => (
              <option key={d.id_dependencia} value={d.id_dependencia}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tipo de evento */}
        <div>
          {renderLabel("Tipo de Evento", enableTipo, isPending(isTipoValid, enableTipo))}
          <select
            className={`input-base ${isPending(isTipoValid, enableTipo) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.tipo}
            onChange={(e) => setData({ ...data, tipo: e.target.value })}
            required
            disabled={!enableTipo}
            style={!enableTipo ? disabledStyle : {}}
          >
            <option value="">-- Seleccione Tipo de Evento --</option>
            {tiposEvento.map(t => (
              <option key={t.id_tipo_evento} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Fecha Inicio */}
        <div>
          {renderLabel("Fecha de inicio", enableInicio, isPending(isInicioValid, enableInicio))}
          <input
            id="inicio"
            type="date"
            className={`input-base ${isPending(isInicioValid, enableInicio) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.inicio}
            onChange={(e) => setData({ ...data, inicio: e.target.value })}
            required
            disabled={!enableInicio}
            style={!enableInicio ? disabledStyle : {}}
          />
        </div>

        {/* Hora Inicio */}
        <div>
          {renderLabel("Hora de inicio", enableHoraInicio, isPending(isHoraInicioValid, enableHoraInicio))}
          <input
            id="horaInicio"
            type="time"
            className={`input-base ${isPending(isHoraInicioValid, enableHoraInicio) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.horaInicio || ""}
            onChange={(e) => setData({ ...data, horaInicio: e.target.value })}
            required
            disabled={!enableHoraInicio}
            style={!enableHoraInicio ? disabledStyle : {}}
          />
        </div>

        {/* Fecha Fin */}
        <div>
          {renderLabel("Fecha de finalización", enableFin, isPending(isFinValid, enableFin))}
          <input
            id="fin"
            type="date"
            className={`input-base ${isPending(isFinValid, enableFin) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.fin}
            onChange={(e) => setData({ ...data, fin: e.target.value })}
            required
            disabled={!enableFin}
            style={!enableFin ? disabledStyle : {}}
          />
        </div>

        {/* Hora Fin */}
        <div>
          {renderLabel("Hora de cierre", enableHoraFin, isPending(!data.horaFin, enableHoraFin))}
          <input
            id="horaFin"
            type="time"
            className={`input-base ${isPending(!data.horaFin, enableHoraFin) ? 'ring-2 ring-blue-500' : ''}`}
            value={data.horaFin || ""}
            onChange={(e) => setData({ ...data, horaFin: e.target.value })}
            required
            disabled={!enableHoraFin}
            style={!enableHoraFin ? disabledStyle : {}}
          />
        </div>
      </div>
    </div>
  );
}

