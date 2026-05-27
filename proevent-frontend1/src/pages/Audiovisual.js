import React, { useState, useEffect } from "react";
import "./../css/Audiovisual.css";
import { FiAlertTriangle, FiCheckCircle, FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw, FiEye } from "react-icons/fi";

const API = "http://localhost:8080";

const IconMap = {
  FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw
};

export default function Audiovisual({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  
  // Catálogo dinámico
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  // Estado para los equipos seleccionados
  const [equiposSeleccionados, setEquiposSeleccionados] = useState({});
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  
  // Estado UI
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorDate, setErrorDate] = useState(null); // Para la validación de 5 días

  const [solicitudesAV, setSolicitudesAV] = useState([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  // 1. Cargar la lista de eventos del usuario y catálogo de equipos
  useEffect(() => {
    fetch(`${API}/eventos`)
      .then((res) => res.json())
      .then((data) => {
        setEventos(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error cargando eventos:", err));

    fetch(`${API}/equipos-audiovisuales`)
      .then(res => res.json())
      .then(data => setEquiposDisponibles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando equipos", err));
      
    // Cargar todas las solicitudes si es administrador
    if (usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") {
      cargarSolicitudesAV();
    }
  }, [usuario]);
  
  const cargarSolicitudesAV = () => {
    fetch(`${API}/audiovisual`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const agrupadas = Object.values(data.reduce((acc, req) => {
            if (!acc[req.id_evento]) {
              acc[req.id_evento] = {
                id_evento: req.id_evento,
                nombre_evento: req.nombre_evento,
                fecha_evento: req.fecha_evento,
                nombre_usuario: req.nombre_usuario || "—",
                estado_av: req.estado_av,
                equipos: [],
                total_equipos: 0
              };
            }
            acc[req.id_evento].equipos.push({
              id_servicio: req.id_servicio,
              equipo: req.equipo,
              cantidad: req.cantidad,
              ubicacion: req.ubicacion,
              observaciones: req.observaciones,
              estado_av: req.estado_av
            });
            acc[req.id_evento].total_equipos += 1;
            
            // Prioridad al estado pendiente
            if (req.estado_av === 'Pendiente') acc[req.id_evento].estado_av = 'Pendiente';
            
            return acc;
          }, {}));
          setSolicitudesAV(agrupadas);
        } else {
          setSolicitudesAV([]);
        }
      })
      .catch((err) => console.error("Error cargando solicitudes audiovisuales:", err));
  };

  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    try {
      const res = await fetch(`${API}/audiovisual/evento/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarSolicitudesAV();
      } else {
        alert("Error al cambiar el estado.");
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    }
  };

  // 2. Manejar selección del evento y validar los 5 días inmediatamente
  const handleSelectEvent = (e) => {
    const evId = e.target.value;
    if (!evId) {
      setEventoSeleccionado(null);
      setErrorDate(null);
      return;
    }

    const ev = eventos.find((ev) => ev.id_evento === Number(evId));
    setEventoSeleccionado(ev);
    setMensaje(""); // Limpiar mensaje de exito anterior

    if (ev) {
      // Validar Antelación de 5 días
      const fechaEv = new Date(ev.fecha_inicio);
      const hoy = new Date();
      fechaEv.setHours(0,0,0,0);
      hoy.setHours(0,0,0,0);
      
      const difTiempo = fechaEv.getTime() - hoy.getTime();
      const difDias = Math.ceil(difTiempo / (1000 * 3600 * 24));
      
      if (difDias < 5) {
        setErrorDate(`Políticas institucionales: Toda solicitud audiovisual debe realizarse con un mínimo de 5 días de antelación. Este evento está programado para dentro de ${difDias} día(s).`);
      } else {
        setErrorDate(null);
      }
    }
  };

  // 3. Manejar el Toogle de Equipos
  const handleToggleEquipo = (idEquipo) => {
    setEquiposSeleccionados((prev) => {
      const isSelected = !!prev[idEquipo];
      if (isSelected) {
        const copy = { ...prev };
        delete copy[idEquipo];
        return copy;
      } else {
        return {
          ...prev,
          [idEquipo]: { cantidad: 1, ubicacion: "" } // defaults
        };
      }
    });
  };

  // 4. Cambiar detalles del equipo
  const handleChangeEquipo = (idEquipo, field, val) => {
    setEquiposSeleccionados((prev) => ({
      ...prev,
      [idEquipo]: {
        ...prev[idEquipo],
        [field]: val
      }
    }));
  };

  // 5. Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errorDate) return; 
    
    const seleccionados = Object.keys(equiposSeleccionados);
    if (!eventoSeleccionado || seleccionados.length === 0) {
      setMensaje({ tipo: "error", texto: "Debes seleccionar un evento y al menos un servicio audiovisual." });
      return;
    }

    setLoading(true);
    setMensaje("");

    // Formatear payload para la nueva ruta del backend
    const serviciosPayload = seleccionados.map((key) => {
      const eqData = equiposSeleccionados[key];
      const eqMeta = equiposDisponibles.find(e => e.id_equipo === Number(key));
      return {
        equipo: eqMeta ? eqMeta.nombre : "Desconocido",
        cantidad: eqData.cantidad,
        ubicacion: eqData.ubicacion,
        observaciones: observacionesGenerales
      };
    });

    try {
      const res = await fetch(`${API}/audiovisual`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({
          id_evento: eventoSeleccionado.id_evento,
          servicios: serviciosPayload
        })
      });

      const body = await res.json();

      if (!res.ok) {
        setMensaje({ tipo: "error", texto: body.mensaje || "Error al enviar solicitud." });
      } else {
        setMensaje({ tipo: "success", texto: "Solicitud de servicios audiovisuales procesada con éxito." });
        // Reset form
        setEventoSeleccionado(null);
        setEquiposSeleccionados({});
        setObservacionesGenerales("");
        setErrorDate(null);
        document.getElementById("evento-select").value = "";
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: "No se pudo conectar al servidor." });
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(solicitudesAV.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = solicitudesAV.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="audiovisual-section">
      <div className="av-header">
        <h1 className="av-title">Solicitud de Servicio Audiovisual</h1>
        <p className="av-subtitle">
          Registra los requerimientos técnicos y equipos necesarios para tu evento. 
          Recuerda que estas solicitudes están sujetas a la validación estricta de 5 días de anticipación.
        </p>
      </div>

      {mensaje && (
        <div className={`av-message ${mensaje.tipo}`}>
          {mensaje.tipo === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          {mensaje.texto}
        </div>
      )}

      <form className="av-card" onSubmit={handleSubmit}>
        
        {/* EVENTO ASOCIADO */}
        <div className="form-group">
          <label className="form-label" htmlFor="evento-select">Seleccione el Evento Asociado</label>
          <select 
            id="evento-select" 
            className="form-select" 
            onChange={handleSelectEvent}
            defaultValue=""
          >
            <option value="" disabled>-- Selecciona un evento programado --</option>
            {eventos.map(ev => (
              <option key={ev.id_evento} value={ev.id_evento}>
                #{ev.id_evento} - {ev.nombre} ({ev.fecha_inicio.substring(0,10)})
              </option>
            ))}
          </select>

          {eventoSeleccionado && !errorDate && (
            <div className="event-details-box">
              <div className="detail-item">
                <span className="detail-label">Modalidad</span>
                <span className="detail-value">{eventoSeleccionado.modalidad}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha del evento</span>
                <span className="detail-value">{eventoSeleccionado.fecha_inicio.substring(0, 10)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Recinto asignado</span>
                <span className="detail-value">{eventoSeleccionado.recinto || 'Por definir'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Asistentes est.</span>
                <span className="detail-value">{eventoSeleccionado.cantidad_asistentes} PAX</span>
              </div>
            </div>
          )}

          {errorDate && (
            <div className="date-alert">
              <FiAlertTriangle className="date-alert-icon" />
              <div>
                <div className="date-alert-title">Tiempo de solicitud insuficiente</div>
                <div className="date-alert-desc">{errorDate}</div>
              </div>
            </div>
          )}
        </div>

        {/* REQUERIMIENTOS AUDIOVISUALES */}
        <div className="form-group" style={{ 
          opacity: (eventoSeleccionado && !errorDate) ? 1 : 0.5, 
          pointerEvents: (eventoSeleccionado && !errorDate) ? 'auto' : 'none' 
        }}>
          <label className="form-label">Servicios y Equipos Requeridos</label>
          <div className="equipment-grid">
            {equiposDisponibles.map((eq) => {
              const isActive = !!equiposSeleccionados[eq.id_equipo];
              const IconComp = IconMap[eq.icono] || IconMap["FiMonitor"];
              return (
                <div key={eq.id_equipo} className={`eq-card ${isActive ? 'selected' : ''}`}>
                  <div className="eq-header" onClick={() => handleToggleEquipo(eq.id_equipo)}>
                    <input 
                      type="checkbox" 
                      className="eq-checkbox" 
                      checked={isActive} 
                      readOnly
                    />
                    <div style={{ color: isActive ? 'var(--orange)' : 'var(--muted)', display: 'flex' }}>
                       <IconComp />
                    </div>
                    <span className="eq-name">{eq.nombre}</span>
                  </div>

                  {isActive && (
                    <div className="eq-details">
                      <div className="eq-field-row">
                        <span className="eq-field-label">Cantidad</span>
                        <input 
                          type="number" 
                          min="1" max="50" 
                          className="eq-number-input"
                          value={equiposSeleccionados[eq.id_equipo].cantidad}
                          onChange={(e) => handleChangeEquipo(eq.id_equipo, 'cantidad', e.target.value)}
                        />
                      </div>
                      <div className="eq-field-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="eq-field-label">Área / Ubicación del montaje</span>
                        <input 
                          type="text" 
                          placeholder="Ej. Salón Principal, Tarima..." 
                          className="eq-text-input"
                          value={equiposSeleccionados[eq.id_equipo].ubicacion}
                          onChange={(e) => handleChangeEquipo(eq.id_equipo, 'ubicacion', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* OBSERVACIONES */}
        <div className="form-group" style={{ 
          opacity: (eventoSeleccionado && !errorDate) ? 1 : 0.5, 
          pointerEvents: (eventoSeleccionado && !errorDate) ? 'auto' : 'none' 
        }}>
          <label className="form-label" htmlFor="obs-generales">Observaciones o Instrucciones Especiales</label>
          <textarea 
            id="obs-generales" 
            className="form-textarea"
            placeholder="Especifique requerimientos como posición de cámaras, necesidades de iluminación particulares, etc."
            value={observacionesGenerales}
            onChange={(e) => setObservacionesGenerales(e.target.value)}
          ></textarea>
        </div>

        <div className="av-actions">
          <button 
            type="submit" 
            className="av-submit-btn" 
            disabled={loading || !eventoSeleccionado || errorDate || Object.keys(equiposSeleccionados).length === 0}
          >
            {loading ? "Procesando..." : "Registrar Solicitud Técnica"}
          </button>
        </div>
      </form>

      {(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") && (
        <div className="av-card" style={{ marginTop: '2rem' }}>
          <h2 className="av-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gestión de Solicitudes</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="requests-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>ID EVENTO</th>
                  <th style={{ padding: '12px' }}>EVENTO</th>
                  <th style={{ padding: '12px' }}>SOLICITANTE</th>
                  <th style={{ padding: '12px' }}>CANT. EQ.</th>
                  <th style={{ padding: '12px' }}>ESTADO</th>
                  {(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") && <th style={{ padding: '12px' }}>DETALLES</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((av) => (
                  <tr key={av.id_evento} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>#EVT-{av.id_evento}</td>
                    <td style={{ padding: '12px' }}>{av.nombre_evento}</td>
                    <td style={{ padding: '12px' }}>{av.nombre_usuario}</td>
                    <td style={{ padding: '12px' }}>{av.total_equipos} equipo(s)</td>
                    <td style={{ padding: '12px' }}>
                      {(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") ? (
                        <select
                          value={av.estado_av || "Pendiente"}
                          onChange={(e) => handleCambiarEstado(av.id_evento, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Rechazado">Rechazado</option>
                          <option value="Completado">Completado</option>
                        </select>
                      ) : (
                        <span className={`status ${
                          av.estado_av === "Pendiente" ? "pending" : 
                          av.estado_av === "Aprobado" || av.estado_av === "Completado" ? "approved" : 
                          av.estado_av === "Rechazado" ? "rejected" : "pending"
                        }`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}>
                          {av.estado_av || "Pendiente"}
                        </span>
                      )}
                    </td>
                    {(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") && (
                      <td style={{ padding: '12px' }}>
                        <button className="details-btn" onClick={() => openModal(av)}>
                          <FiEye /> Ver
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {solicitudesAV.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "12px", color: "#64748b" }}>
                      No hay solicitudes registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {solicitudesAV.length > 0 && (
            <div className="pagination-container" style={{ marginTop: '10px' }}>
              <div className="pagination-info">
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, solicitudesAV.length)} de {solicitudesAV.length} solicitudes
              </div>
              <div className="pagination-controls">
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <span className="page-number">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALLES AUDIOVISUAL */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Detalles de Solicitud Audiovisual</h2>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Evento Relacionado:</label>
                <p>#EVT-{selectedRequest.id_evento} - {selectedRequest.nombre_evento}</p>
              </div>
              <div className="detail-group">
                <label>Solicitante:</label>
                <p>{selectedRequest.nombre_usuario || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Fecha del Evento:</label>
                <p>{formatFecha(selectedRequest.fecha_evento)}</p>
              </div>
              <div className="detail-group">
                <label>Estado General:</label>
                <p>{selectedRequest.estado_av}</p>
              </div>
              
              <div style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
                <h4 style={{ marginBottom: "10px", color: "var(--text-color)" }}>Equipos Solicitados</h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", background: "#f8fafc" }}>
                        <th style={{ padding: "10px" }}>Equipo</th>
                        <th style={{ padding: "10px" }}>Cant.</th>
                        <th style={{ padding: "10px" }}>Ubicación</th>
                        <th style={{ padding: "10px" }}>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.equipos && selectedRequest.equipos.map(eq => (
                        <tr key={eq.id_servicio} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px" }}>{eq.equipo}</td>
                          <td style={{ padding: "10px" }}>{eq.cantidad}</td>
                          <td style={{ padding: "10px" }}>{eq.ubicacion || "N/D"}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{eq.observaciones || "Ninguna"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
