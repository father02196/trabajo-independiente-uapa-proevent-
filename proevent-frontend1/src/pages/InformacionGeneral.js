// ============================================================
// COMPONENTE: InformacionGeneral
// Pertenece a: Módulo de Solicitudes / Eventos
// Propósito: Paso 1 del Wizard de creación de evento. Recoge la
// información básica (título, dependencia, tipo, fechas y horas).
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { FiLock, FiClock, FiChevronDown } from "react-icons/fi";

const API = "http://localhost:8080";

// --- COMPONENTE SELECTOR DE TIEMPO ESTRICTO 24H ---
// Sustituye al <input type="time"> nativo para obligar formato 24h en cualquier SO.
const TimePicker24h = ({ id, value, onChange, disabled, isPending }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentH = value ? value.split(':')[0] : "08";
  const currentM = value ? value.split(':')[1] : "00";

  const handleSelect = (type, val) => {
    let newH = currentH;
    let newM = currentM;
    if (type === 'h') newH = val;
    if (type === 'm') newM = val;
    onChange(`${newH}:${newM}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // Intervalos de 5 min: 00, 05, 10... 55
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); 

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input-base ${isPending ? 'ring-2 ring-blue-500' : ''}`}
        style={{ 
          opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', 
          backgroundColor: disabled ? '#F3F4F6' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock color="#9CA3AF" />
          <span style={{ color: value ? '#111827' : '#9CA3AF' }}>
            {value ? value : "HH:mm"}
          </span>
        </div>
        <FiChevronDown color="#9CA3AF" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', width: '220px'
        }}>
          {/* Columna Horas */}
          <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', borderRight: '1px solid #E5E7EB' }}>
            <div style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6B7280', textAlign: 'center', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, background: '#fff' }}>Hora</div>
            {hours.map(h => (
              <div 
                key={h} 
                onClick={() => handleSelect('h', h)}
                style={{ padding: '8px', textAlign: 'center', cursor: 'pointer', background: currentH === h ? '#EFF6FF' : 'transparent', color: currentH === h ? '#2563EB' : '#374151' }}
                onMouseEnter={e => { if(currentH !== h) e.target.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { if(currentH !== h) e.target.style.background = 'transparent'; }}
              >
                {h}
              </div>
            ))}
          </div>
          {/* Columna Minutos */}
          <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
            <div style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6B7280', textAlign: 'center', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, background: '#fff' }}>Minuto</div>
            {minutes.map(m => (
              <div 
                key={m} 
                onClick={() => { handleSelect('m', m); setIsOpen(false); }}
                style={{ padding: '8px', textAlign: 'center', cursor: 'pointer', background: currentM === m ? '#EFF6FF' : 'transparent', color: currentM === m ? '#2563EB' : '#374151' }}
                onMouseEnter={e => { if(currentM !== m) e.target.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { if(currentM !== m) e.target.style.background = 'transparent'; }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function InformacionGeneral({ data, setData }) {
  // --- ESTADOS ---
  const [dependencias, setDependencias] = useState([]);
  const [tiposEvento, setTiposEvento] = useState([]);

  // --- EFECTOS INICIALES ---
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

  // --- FUNCIÓN: handleDependencia ---
  // Sincroniza el id y el nombre del departamento seleccionado
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

  // --- CÁLCULOS: Validaciones de paso a paso ---
  // Determina si los campos secuenciales están desbloqueados o validados
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

  // --- UTILIDAD: renderLabel ---
  // Muestra el nombre del campo junto con indicadores de bloqueo o acción requerida
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
          <TimePicker24h
            id="horaInicio"
            value={data.horaInicio || ""}
            onChange={(val) => setData({ ...data, horaInicio: val })}
            disabled={!enableHoraInicio}
            isPending={isPending(isHoraInicioValid, enableHoraInicio)}
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
          <TimePicker24h
            id="horaFin"
            value={data.horaFin || ""}
            onChange={(val) => setData({ ...data, horaFin: val })}
            disabled={!enableHoraFin}
            isPending={isPending(!data.horaFin, enableHoraFin)}
          />
        </div>
      </div>
    </div>
  );
}

