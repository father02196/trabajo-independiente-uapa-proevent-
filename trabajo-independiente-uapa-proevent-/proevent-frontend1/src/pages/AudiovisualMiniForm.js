// ============================================================
// COMPONENTE: AudiovisualMiniForm
// Pertenece a: Módulo de Solicitudes / Eventos
// Propósito: Subformulario para la selección dinámica de equipos
// audiovisuales al crear o editar una solicitud de evento.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw, FiCheckCircle } from "react-icons/fi";

const API = "http://localhost:8080";

const IconMap = {
  FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw
};

export default function AudiovisualMiniForm({ avData, setAvData }) {
  // --- ESTADOS ---
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    fetch(`${API}/equipos-audiovisuales`)
      .then(res => res.json())
      .then(data => setEquiposDisponibles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando equipos", err));
  }, []);

  // --- FUNCIÓN: handleToggleEquipo ---
  // Agrega o elimina un equipo del listado seleccionado
  const handleToggleEquipo = (idEquipo, nombre) => {
    const isAlreadySelected = avData.equipos.some(e => e.id_equipo === idEquipo);
    if (isAlreadySelected) {
      setAvData({ ...avData, equipos: avData.equipos.filter(e => e.id_equipo !== idEquipo) });
    } else {
      setAvData({
        ...avData,
        equipos: [...avData.equipos, { id_equipo: idEquipo, equipo: nombre, cantidad: 1, ubicacion: "", observaciones: avData.observaciones }]
      });
    }
  };

  // --- FUNCIÓN: handleChangeEquipo ---
  // Actualiza la cantidad o ubicación de un equipo específico
  const handleChangeEquipo = (idEquipo, field, val) => {
    setAvData({ ...avData, equipos: avData.equipos.map(e => e.id_equipo === idEquipo ? { ...e, [field]: val } : e) });
  };

  // --- FUNCIÓN: handleObservacionesChange ---
  // Sincroniza las observaciones generales
  const handleObservacionesChange = (val) => {
    setAvData({ ...avData, observaciones: val, equipos: avData.equipos.map(e => ({ ...e, observaciones: val })) });
  };

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Equipos Audiovisuales</h3>
        <p className="text-sm text-text-secondary">Selecciona los equipos necesarios haciendo clic en cada tarjeta.</p>
      </div>

      {/* Grid de equipos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {equiposDisponibles.map((eq) => {
          const selectedEq = avData.equipos.find(e => e.id_equipo === eq.id_equipo);
          const isActive = !!selectedEq;
          const IconComp = IconMap[eq.icono] || FiMonitor;

          return (
            <div
              key={eq.id_equipo}
              className="av-question-card"
              onClick={() => handleToggleEquipo(eq.id_equipo, eq.nombre)}
              style={{
                background: isActive ? '#EFF6FF' : '#F8FAFC',
                border: `1.5px solid ${isActive ? '#3B82F6' : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '18px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.10)' : '0 1px 2px rgba(0,0,0,0.04)',
                position: 'relative',
              }}
            >
              {/* Checkmark badge */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#3B82F6', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px'
                }}>
                  <FiCheckCircle size={12} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: isActive ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E2E8F0',
                  color: isActive ? '#fff' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', transition: 'all 0.2s', flexShrink: 0
                }}>
                  <IconComp />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: isActive ? '#1D4ED8' : '#334155', margin: 0, lineHeight: 1.3 }}>
                    {eq.nombre}
                  </h4>
                  <span style={{ fontSize: '11px', color: isActive ? '#3B82F6' : '#94A3B8', fontWeight: 600 }}>
                    {isActive ? 'Seleccionado' : 'Clic para agregar'}
                  </span>
                </div>
              </div>

              {isActive && (
                <div
                  style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #BFDBFE' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <label className="block text-sm font-bold text-text-main mb-2" style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 600 }}>
                      Cantidad necesaria
                    </label>
                    <input
                      type="number" min="1" max="50"
                      className="input-base"
                      value={selectedEq.cantidad}
                      onChange={(e) => handleChangeEquipo(eq.id_equipo, 'cantidad', parseInt(e.target.value) || 1)}
                      style={{ padding: '8px 12px', borderColor: '#BFDBFE' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2" style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 600 }}>
                      Ubicación en el evento
                    </label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Ej: Salón principal, Tarima..."
                      value={selectedEq.ubicacion}
                      onChange={(e) => handleChangeEquipo(eq.id_equipo, 'ubicacion', e.target.value)}
                      style={{ padding: '8px 12px', borderColor: '#BFDBFE' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Observaciones generales */}
      <div>
        <label className="block text-sm font-bold text-text-main mb-2">
          Observaciones Generales de Audiovisual
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginLeft: '6px' }}>(Opcional)</span>
        </label>
        <textarea
          className="input-base"
          placeholder="Especifique requisitos particulares de conexión, pruebas de sonido previas, configuración especial, etc."
          value={avData.observaciones}
          onChange={(e) => handleObservacionesChange(e.target.value)}
          style={{ minHeight: '100px', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
