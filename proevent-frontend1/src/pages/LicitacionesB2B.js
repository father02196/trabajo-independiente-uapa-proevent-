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
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ borderBottom: '2px solid #e67e22', paddingBottom: '10px', marginBottom: '20px' }}>Solicitar Servicios Externos (Compras)</h3>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Si este evento requiere transporte, catering u otros servicios externos, lanza la licitación para que el Encargado de Compras inicie el proceso en el Portal B2B.</p>
      
      {usuario?.rol !== 'Personal de Apoyo' && (
      <form onSubmit={handleCrearLicitacion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '10px', alignItems: 'end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Servicio Requerido</label>
          <select value={nuevaLicitacion.id_tipo_servicio} onChange={e => setNuevaLicitacion({...nuevaLicitacion, id_tipo_servicio: e.target.value})}>
            <option value="4">Transporte</option>
            <option value="2">Catering Externo</option>
            <option value="3">Sonido y Luces</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Fecha Límite</label>
          <input type="date" value={nuevaLicitacion.fecha_limite} onChange={e => setNuevaLicitacion({...nuevaLicitacion, fecha_limite: e.target.value})} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Requisitos Técnicos</label>
          <input type="text" placeholder="Ej. Autobús de 50 pasajeros con A/C" value={nuevaLicitacion.requisitos} onChange={e => setNuevaLicitacion({...nuevaLicitacion, requisitos: e.target.value})} />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '10px', height: '40px', background: '#e67e22', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          <FiSend /> Lanzar
        </button>
      </form>
      )}
    </div>
  );
}

export default LicitacionesB2B;
