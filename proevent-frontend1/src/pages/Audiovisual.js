import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiCheckCircle, FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw, FiEye, FiFileText, FiList } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

const API = "http://localhost:8080";

const IconMap = {
  FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast, FiRefreshCw
};

export default function Audiovisual({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState({});
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorDate, setErrorDate] = useState(null);
  const [solicitudesAV, setSolicitudesAV] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (req) => { setSelectedRequest(req); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedRequest(null); };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    fetch(`${API}/eventos`)
      .then((res) => res.json())
      .then((data) => {
        const eventosPermitidos = Array.isArray(data) 
          ? data.filter(e => e.estado === "Aprobado" || e.estado === "En Progreso") 
          : [];
        setEventos(eventosPermitidos);
      })
      .catch((err) => console.error("Error cargando eventos:", err));

    fetch(`${API}/equipos-audiovisuales`)
      .then(res => res.json())
      .then(data => setEquiposDisponibles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando equipos", err));
      
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
        headers: { "Content-Type": "application/json", "x-usuario-id": usuario?.id_usuario || "" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) cargarSolicitudesAV();
      else alert("Error al cambiar el estado.");
    } catch {
      alert("No se pudo conectar al servidor.");
    }
  };

  const handleSelectEvent = (e) => {
    const evId = e.target.value;
    if (!evId) {
      setEventoSeleccionado(null);
      setErrorDate(null);
      return;
    }

    const ev = eventos.find((ev) => ev.id_evento === Number(evId));
    setEventoSeleccionado(ev);
    setMensaje(""); 

    if (ev) {
      const fechaEv = new Date(ev.fecha_inicio);
      const hoy = new Date();
      fechaEv.setHours(0,0,0,0);
      hoy.setHours(0,0,0,0);
      const difDias = Math.ceil((fechaEv.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
      
      if (difDias < 5) {
        setErrorDate(`Políticas institucionales: Toda solicitud audiovisual debe realizarse con un mínimo de 5 días de antelación. Este evento está programado para dentro de ${difDias} día(s).`);
      } else {
        setErrorDate(null);
      }
    }
  };

  const handleToggleEquipo = (idEquipo) => {
    setEquiposSeleccionados((prev) => {
      const isSelected = !!prev[idEquipo];
      if (isSelected) {
        const copy = { ...prev };
        delete copy[idEquipo];
        return copy;
      } else {
        return { ...prev, [idEquipo]: { cantidad: 1, ubicacion: "" } };
      }
    });
  };

  const handleChangeEquipo = (idEquipo, field, val) => {
    setEquiposSeleccionados((prev) => ({
      ...prev,
      [idEquipo]: { ...prev[idEquipo], [field]: val }
    }));
  };

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
        headers: { "Content-Type": "application/json", "x-usuario-id": usuario?.id_usuario || "" },
        body: JSON.stringify({ id_evento: eventoSeleccionado.id_evento, servicios: serviciosPayload })
      });
      const body = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: "error", texto: body.mensaje || "Error al enviar solicitud." });
      } else {
        setMensaje({ tipo: "success", texto: "Solicitud de servicios audiovisuales procesada con éxito." });
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

  const { items: sortedSolicitudes, requestSort, sortConfig } = useSortableData(solicitudesAV, { key: 'id_evento', direction: 'ascending' });
  const { items: sortedEquipos, requestSort: requestSortEquipos, sortConfig: sortConfigEquipos } = useSortableData(selectedRequest?.equipos || [], { key: 'equipo', direction: 'ascending' });

  const totalPages = Math.ceil(sortedSolicitudes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSolicitudes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-block', width: '4px', height: '22px', background: 'linear-gradient(180deg, #3B82F6, #6366F1)', borderRadius: '99px' }}></span>
          Solicitud de Servicio Audiovisual
        </h1>
        <p style={{ color: '#64748B', fontSize: '13.5px' }}>
          Registra requerimientos técnicos y equipos para tu evento. Validación estricta de 5 días de anticipación.
        </p>
      </div>

      {mensaje && (
        <div className={`form-alert ${mensaje.tipo === "error" ? "form-alert-error" : "form-alert-success"}`} style={{ marginBottom: '24px' }}>
          {mensaje.tipo === "error" ? <FiAlertTriangle size={18} /> : <FiCheckCircle size={18} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="card" style={{ padding: '32px', maxWidth: '860px', margin: '0 auto 32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="form-group">
            <label>Seleccione el Evento Asociado</label>
            <select 
              id="evento-select" 
              className="input-base" 
              onChange={handleSelectEvent}
              defaultValue=""
            >
              <option value="" disabled>-- Selecciona un evento programado --</option>
              {eventos.map(ev => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  #EVT-{ev.id_evento} - {ev.nombre} ({ev.fecha_inicio.substring(0,10)})
                </option>
              ))}
            </select>

            {eventoSeleccionado && !errorDate && (
              <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Modalidad</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '600' }}>{eventoSeleccionado.modalidad}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Fecha</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '600' }}>{eventoSeleccionado.fecha_inicio.substring(0, 10)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Recinto asignado</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '600' }}>{eventoSeleccionado.recinto || 'Por definir'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Asistentes est.</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '600' }}>{eventoSeleccionado.cantidad_asistentes} PAX</span>
                </div>
              </div>
            )}

            {errorDate && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                <FiAlertTriangle style={{ color: '#DC2626', fontSize: '20px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ color: '#991B1B', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>Tiempo insuficiente</h4>
                  <p style={{ color: '#B91C1C', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{errorDate}</p>
                </div>
              </div>
            )}
          </div>

          <div style={{ opacity: (eventoSeleccionado && !errorDate) ? 1 : 0.5, pointerEvents: (eventoSeleccionado && !errorDate) ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>Servicios y Equipos Requeridos</h3>
              <p style={{ color: '#64748B', fontSize: '13px' }}>Seleccione los equipos e indique cantidad y ubicación.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {equiposDisponibles.map((eq) => {
                const isActive = !!equiposSeleccionados[eq.id_equipo];
                const IconComp = IconMap[eq.icono] || IconMap["FiMonitor"];
                return (
                  <div key={eq.id_equipo} className="hover-lift" style={{ background: isActive ? '#EFF6FF' : '#fff', border: `1.5px solid ${isActive ? '#3B82F6' : '#E2E8F0'}`, borderRadius: '16px', padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }} onClick={() => handleToggleEquipo(eq.id_equipo)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isActive ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#F1F5F9', color: isActive ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <IconComp />
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#1D4ED8' : '#334155', margin: 0 }}>{eq.nombre}</h4>
                    </div>
                    {isActive && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #BFDBFE' }} onClick={e => e.stopPropagation()}>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '11.5px', color: '#2563EB' }}>Cantidad</label>
                          <input type="number" min="1" max="50" className="input-base" value={equiposSeleccionados[eq.id_equipo].cantidad} onChange={(e) => handleChangeEquipo(eq.id_equipo, 'cantidad', e.target.value)} style={{ padding: '8px 12px', borderColor: '#BFDBFE' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', color: '#2563EB' }}>Ubicación</label>
                          <input type="text" className="input-base" placeholder="Ej. Tarima" value={equiposSeleccionados[eq.id_equipo].ubicacion} onChange={(e) => handleChangeEquipo(eq.id_equipo, 'ubicacion', e.target.value)} style={{ padding: '8px 12px', borderColor: '#BFDBFE' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ opacity: (eventoSeleccionado && !errorDate) ? 1 : 0.5, pointerEvents: (eventoSeleccionado && !errorDate) ? 'auto' : 'none' }}>
            <label>Observaciones o Instrucciones Especiales</label>
            <textarea 
              className="input-base"
              placeholder="Especifique requerimientos como posición de cámaras, necesidades de iluminación..."
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              style={{ minHeight: '90px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !eventoSeleccionado || errorDate || Object.keys(equiposSeleccionados).length === 0}>
              {loading ? (
                <><span className="spinner"></span> Procesando...</>
              ) : (
                "Registrar Solicitud Técnica"
              )}
            </button>
          </div>
        </form>
      </div>

      {(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual") && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Gestión de Solicitudes Pendientes</h2>
          </div>
          
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <SortableHeader label="ID" sortKey="id_evento" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Evento" sortKey="nombre_evento" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Solicitante" sortKey="nombre_usuario" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Cant. Equipos" sortKey="total_equipos" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="Estado" sortKey="estado_av" sortConfig={sortConfig} requestSort={requestSort} />
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((av) => (
                  <tr key={av.id_evento}>
                    <td style={{ fontWeight: '600', color: '#64748B' }}>#EVT-{av.id_evento}</td>
                    <td style={{ fontWeight: '600', color: '#0F172A' }}>{av.nombre_evento}</td>
                    <td>{av.nombre_usuario}</td>
                    <td>
                      <span className="badge badge-slate">{av.total_equipos} equipo(s)</span>
                    </td>
                    <td>
                      <select
                        className="input-base"
                        value={av.estado_av || "Pendiente"}
                        onChange={(e) => handleCambiarEstado(av.id_evento, e.target.value)}
                        style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', minWidth: '130px' }}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En revisión">En revisión</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                        <option value="Completado">Completado</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openModal(av)}>
                        <FiEye size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
                {solicitudesAV.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                      <FiMonitor size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <div style={{ fontWeight: '600' }}>No hay solicitudes audiovisuales registradas</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Premium */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica Audiovisual</h3>
                <span className="modal-subtitle">Revisión de reserva de equipos y logística AV</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#AV-{selectedRequest.id_solicitud || selectedRequest.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-2">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiFileText size={14} /> Información del Evento
                  </div>
                  <div className="info-row">
                    <span className="info-label">Evento Relacionado</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>#EVT-{selectedRequest.id_evento} - {selectedRequest.nombre_evento}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Solicitante</span>
                    <span className="info-value">{selectedRequest.nombre_usuario || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha del Evento</span>
                    <span className="info-value">{formatFecha(selectedRequest.fecha_evento)}</span>
                  </div>
                </div>

                {/* Columna 2: Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiMonitor size={14} /> Estado de Solicitud AV
                  </div>
                  <div className="info-row">
                    <span className="info-label">Estado General</span>
                    <span className={`badge ${selectedRequest.estado_av === 'Aprobado' ? 'badge-green' : selectedRequest.estado_av === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado_av}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipos Solicitados */}
              <div className="modal-grid-1" style={{ marginTop: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Desglose de Equipos Solicitados
                  </div>
                  <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <SortableHeader label="Equipo Requerido" sortKey="equipo" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                          <SortableHeader label="Cantidad" sortKey="cantidad" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} style={{ textAlign: 'center' }} />
                          <SortableHeader label="Ubicación" sortKey="ubicacion" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                          <SortableHeader label="Observaciones Especiales" sortKey="observaciones" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEquipos.map(eq => (
                          <tr key={eq.id_servicio}>
                            <td style={{ fontWeight: '600', color: '#0F172A' }}>{eq.equipo}</td>
                            <td style={{ textAlign: 'center', fontWeight: '700', color: '#3B82F6' }}>{eq.cantidad}</td>
                            <td>{eq.ubicacion || "N/D"}</td>
                            <td style={{ color: '#64748B', fontSize: '13px' }}>{eq.observaciones || "Ninguna"}</td>
                          </tr>
                        ))}
                        {(!selectedRequest.equipos || selectedRequest.equipos.length === 0) && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>
                              No hay detalle de equipos registrado para esta solicitud.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
