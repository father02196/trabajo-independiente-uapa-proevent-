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
    <div className="av-mini-form" style={{ marginTop: '10px' }}>
      <p style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px' }}>Seleccione los equipos necesarios para su evento:</p>
      
      <div className="equipment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
        {equiposDisponibles.map((eq) => {
          const selectedEq = avData.equipos.find(e => e.id_equipo === eq.id_equipo);
          const isActive = !!selectedEq;
          const IconComp = IconMap[eq.icono] || IconMap["FiMonitor"];
          
          return (
            <div 
              key={eq.id_equipo} 
              className={`eq-card ${isActive ? 'selected' : ''}`}
              style={{
                padding: '15px',
                border: `2px solid ${isActive ? 'var(--orange)' : '#f1f5f9'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                background: isActive ? '#fff7ed' : '#ffffff',
                boxShadow: isActive ? '0 4px 12px rgba(254,131,1,0.1)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                onClick={() => handleToggleEquipo(eq.id_equipo, eq.nombre)}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  backgroundColor: isActive ? 'var(--orange)' : '#f8fafc',
                  color: isActive ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconComp />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: isActive ? 'var(--navy)' : '#334155' }}>{eq.nombre}</span>
              </div>
              
              {isActive && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #fed7aa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Cantidad:</span>
                    <input 
                      type="number" min="1" 
                      value={selectedEq.cantidad}
                      onChange={(e) => handleChangeEquipo(eq.id_equipo, 'cantidad', parseInt(e.target.value) || 1)}
                      style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ubicación específica..."
                    value={selectedEq.ubicacion}
                    onChange={(e) => handleChangeEquipo(eq.id_equipo, 'ubicacion', e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '25px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--navy)' }}>Observaciones Generales de Audiovisual</label>
        <textarea 
          placeholder="Ej: Necesitamos los micrófonos probados 30 minutos antes. El proyector debe estar en la mesa central."
          value={avData.observaciones}
          onChange={(e) => handleObservacionesChange(e.target.value)}
          style={{ width: '100%', minHeight: '90px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
