// ============================================================
// COMPONENTE: CronogramaGlobal
// Pertenece a: Módulo de Coordinación y Logística
// Propósito: Contenedor principal para administrar las actividades
// de apoyo de los eventos. Contiene el selector de evento y renderiza
// el componente `CronogramaLogistico`.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiCalendar, FiMapPin, FiCheckCircle } from "react-icons/fi";
import CronogramaLogistico from "./CronogramaLogistico";
import { toast } from "react-hot-toast";

const API = "http://localhost:8080";

function CronogramaGlobal({ usuario, eventoPreseleccionado = null }) {
  // --- ESTADOS ---
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    if (eventoPreseleccionado) {
      setEventoSeleccionado(eventoPreseleccionado);
    } else {
      cargarEventos();
    }
  }, [usuario, eventoPreseleccionado]);

  // --- FUNCIÓN: cargarEventos ---
  // Carga la lista de eventos según permisos del usuario para ser seleccionados
  const cargarEventos = async () => {
    setLoading(true);
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/eventos`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEventos(data);
      } else {
        toast.error("Error al cargar lista de eventos.");
      }
    } catch (err) {
      toast.error("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (e) => {
    const id = e.target.value;
    if (!id) {
      setEventoSeleccionado(null);
      return;
    }
    const evt = eventos.find((ev) => ev.id_evento.toString() === id);
    setEventoSeleccionado(evt);
  };

  return (
    <div className={eventoPreseleccionado ? '' : 'admin-page-container fade-in'}>
      <div className={eventoPreseleccionado ? '' : 'admin-controls-card'}>
        {!eventoPreseleccionado && (
          <>
            <div className="controls-header">
              <div className="title-section">
                <FiCalendar className="header-icon" />
                <div>
                  <h3>Cronograma Logístico Global</h3>
                  <p className="subtitle">Selecciona un evento para administrar sus actividades de apoyo</p>
                </div>
              </div>
            </div>

            <div className="filters-grid" style={{ marginTop: '20px' }}>
              <div className="filter-item full-width">
                <label>Seleccionar Evento</label>
                <select onChange={handleSelectEvent} className="table-select-premium" style={{ width: '100%', padding: '10px' }}>
                  <option value="">-- Elige un evento de la lista --</option>
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      {`#EVT-${ev.id_evento} - ${ev.nombre} (${new Date(ev.fecha_inicio).toLocaleDateString()}) - ${ev.estado}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {eventoSeleccionado && (
          <div style={{ marginTop: eventoPreseleccionado ? '0' : '30px' }}>
            {!eventoPreseleccionado && (
            <div style={{ marginBottom: '15px', background: '#eef2f5', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Evento Activo: {eventoSeleccionado.nombre}</h4>
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: '#555' }}>
                <span><FiCalendar /> {new Date(eventoSeleccionado.fecha_inicio).toLocaleDateString()}</span>
                <span><FiMapPin /> {eventoSeleccionado.recinto || 'Recinto'}</span>
                <span><FiCheckCircle /> {eventoSeleccionado.estado}</span>
              </div>
            </div>
            )}
            
            {/* Componente que ya modernizamos anteriormente */}
            <CronogramaLogistico evento={eventoSeleccionado} usuario={usuario} />
          </div>
        )}
      </div>
    </div>
  );
}

export default CronogramaGlobal;
