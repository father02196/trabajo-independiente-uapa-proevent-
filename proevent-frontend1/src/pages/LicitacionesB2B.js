import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiSend } from 'react-icons/fi';

const API = "http://localhost:8080";

function LicitacionesB2B({ evento, usuario }) {
  const [licitaciones, setLicitaciones] = useState([]);
  const [nuevaLicitacion, setNuevaLicitacion] = useState({ id_tipo_servicio: '4', fecha_limite: '', requisitos: '' });

  useEffect(() => {
    if (evento && evento.id_evento) {
      cargarLicitaciones();
    }
  }, [evento]);

  // Asumiremos un endpoint futuro GET /solicitudes-cotizacion/:id_evento
  // Por ahora simulamos si el array es vacio o no
  const cargarLicitaciones = async () => {
    // Aquí podrías agregar un fetch para mostrar las solicitudes enviadas
  };

  const handleCrearLicitacion = async (e) => {
    e.preventDefault();
    if (!nuevaLicitacion.fecha_limite || !nuevaLicitacion.requisitos) {
      alert("Por favor complete los campos.");
      return;
    }
    try {
      const payload = { ...nuevaLicitacion, id_evento: evento.id_evento };
      const res = await fetch(`${API}/admin/solicitud-cotizacion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Licitación lanzada. Se notificó al Encargado de Compras.");
        setNuevaLicitacion({ id_tipo_servicio: '4', fecha_limite: '', requisitos: '' });
      } else {
        alert(data.error || "Error al crear licitación");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '12px', marginBottom: '20px' }}>Solicitar Servicios Externos (Compras)</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>Si este evento requiere transporte, catering u otros servicios externos, lanza la licitación para que el Encargado de Compras inicie el proceso en el Portal B2B.</p>
      
      {usuario?.rol !== 'Personal de Apoyo' && (
      <form onSubmit={handleCrearLicitacion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
        <div className="form-group">
          <label>Servicio Requerido</label>
          <select className="input-base" value={nuevaLicitacion.id_tipo_servicio} onChange={e => setNuevaLicitacion({...nuevaLicitacion, id_tipo_servicio: e.target.value})}>
            <option value="4">Transporte</option>
            <option value="2">Catering Externo</option>
            <option value="3">Sonido y Luces</option>
          </select>
        </div>
        <div className="form-group">
          <label>Fecha Límite</label>
          <input type="date" className="input-base" value={nuevaLicitacion.fecha_limite} onChange={e => setNuevaLicitacion({...nuevaLicitacion, fecha_limite: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Requisitos Técnicos</label>
          <input type="text" className="input-base" placeholder="Ej. Autobús de 50 pasajeros con A/C" value={nuevaLicitacion.requisitos} onChange={e => setNuevaLicitacion({...nuevaLicitacion, requisitos: e.target.value})} />
        </div>
        <button type="submit" className="btn btn-primary">
          <FiSend /> Lanzar
        </button>
      </form>
      )}
    </div>
  );
}

export default LicitacionesB2B;
