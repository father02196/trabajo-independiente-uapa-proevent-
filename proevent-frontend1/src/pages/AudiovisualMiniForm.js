import React, { useState, useEffect } from "react";
import { FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw } from "react-icons/fi";

const API = "http://localhost:8080";

const IconMap = {
  FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw
};

export default function AudiovisualMiniForm({ avData, setAvData }) {
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  useEffect(() => {
    fetch(`${API}/equipos-audiovisuales`)
      .then(res => res.json())
      .then(data => setEquiposDisponibles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando equipos", err));
  }, []);

  const handleToggleEquipo = (idEquipo, nombre) => {
    const isAlreadySelected = avData.equipos.some(e => e.id_equipo === idEquipo);
    
    if (isAlreadySelected) {
      setAvData({
        ...avData,
        equipos: avData.equipos.filter(e => e.id_equipo !== idEquipo)
      });
    } else {
      setAvData({
        ...avData,
        equipos: [
          ...avData.equipos,
          { id_equipo: idEquipo, equipo: nombre, cantidad: 1, ubicacion: "", observaciones: avData.observaciones }
        ]
      });
    }
  };

  const handleChangeEquipo = (idEquipo, field, val) => {
    setAvData({
      ...avData,
      equipos: avData.equipos.map(e => 
        e.id_equipo === idEquipo ? { ...e, [field]: val } : e
      )
    });
  };

  const handleObservacionesChange = (val) => {
    setAvData({
      ...avData,
      observaciones: val,
      equipos: avData.equipos.map(e => ({ ...e, observaciones: val }))
    });
  };

  return (
    <div className="av-mini-form animate-fade">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>Equipos Disponibles</h3>
        <p style={{ color: '#64748B', fontSize: '13px' }}>Seleccione los equipos necesarios para este evento haciendo clic en ellos.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {equiposDisponibles.map((eq) => {
          const selectedEq = avData.equipos.find(e => e.id_equipo === eq.id_equipo);
          const isActive = !!selectedEq;
          const IconComp = IconMap[eq.icono] || IconMap["FiMonitor"];
          
          return (
            <div 
              key={eq.id_equipo} 
              className={`hover-lift`}
              style={{
                background: isActive ? '#EFF6FF' : '#fff',
                border: `1.5px solid ${isActive ? '#3B82F6' : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '20px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => handleToggleEquipo(eq.id_equipo, eq.nombre)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: isActive ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#F1F5F9',
                  color: isActive ? '#fff' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', transition: 'all 0.2s', flexShrink: 0
                }}>
                  <IconComp />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#1D4ED8' : '#334155', margin: 0, lineHeight: 1.2 }}>{eq.nombre}</h4>
                  {!isActive && <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>Clic para agregar</span>}
                </div>
              </div>
              
              {isActive && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #BFDBFE' }} onClick={(e) => e.stopPropagation()}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11.5px', color: '#2563EB' }}>Cantidad Necesaria</label>
                    <input 
                      type="number" min="1" max="50"
                      className="input-base"
                      value={selectedEq.cantidad}
                      onChange={(e) => handleChangeEquipo(eq.id_equipo, 'cantidad', parseInt(e.target.value) || 1)}
                      style={{ padding: '8px 12px', background: '#fff', borderColor: '#BFDBFE' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', color: '#2563EB' }}>Ubicación en el evento</label>
                    <input 
                      type="text" 
                      className="input-base"
                      placeholder="Ej: Salón principal, Tarima..."
                      value={selectedEq.ubicacion}
                      onChange={(e) => handleChangeEquipo(eq.id_equipo, 'ubicacion', e.target.value)}
                      style={{ padding: '8px 12px', background: '#fff', borderColor: '#BFDBFE' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px' }} className="form-group">
        <label style={{ fontSize: '14px' }}>Observaciones Generales de Audiovisual (Opcional)</label>
        <p className="help-text">Especifique si hay requisitos particulares de conexión, pruebas de sonido previas, etc.</p>
        <textarea 
          className="input-base"
          placeholder="Escriba cualquier instrucción especial para el equipo de producción audiovisual..."
          value={avData.observaciones}
          onChange={(e) => handleObservacionesChange(e.target.value)}
          style={{ minHeight: '100px' }}
        />
      </div>
    </div>
  );
}
