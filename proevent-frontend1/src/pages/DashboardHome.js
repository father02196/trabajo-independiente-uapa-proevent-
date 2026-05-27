import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2 } from "react-icons/fi";
import './../css/Dashboard.css';
import MisTareasApoyo from './MisTareasApoyo';

const API = "http://localhost:8080";

function DashboardHome({ usuario, searchTerm = "", onEditEvent }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const [departmentFilter, setDepartmentFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");
  const [eventRequests, setEventRequests] = useState([]);
  const [avRequests, setAvRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAV, setLoadingAV] = useState(true);
  const [error, setError] = useState("");
  const [errorAV, setErrorAV] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- Estados para Fase 1 del Relevo: Asignación de Coordinador ---
  const [isCoordinadorModalOpen, setIsCoordinadorModalOpen] = useState(false);
  const [pendingApprovalEvent, setPendingApprovalEvent] = useState(null);
  const [coordinadoresPosibles, setCoordinadoresPosibles] = useState([]);
  const [selectedCoordinador, setSelectedCoordinador] = useState("");

  // --- Confirmación General de Cambio de Estado ---
  const [confirmEstadoModal, setConfirmEstadoModal] = useState({ open: false, id_evento: null, nuevoEstado: "" });

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  useEffect(() => {
    cargarEventos();
    cargarAudiovisuales();
    cargarCoordinadores();
    setCurrentPage(1); // Reset al cambiar usuario
  }, [usuario]);

  const cargarCoordinadores = async () => {
    try {
      const res = await fetch(`${API}/usuarios-coordinadores`);
      const data = await res.json();
      if(Array.isArray(data)) setCoordinadoresPosibles(data);
    } catch(e) {
      console.error("Error cargando coordinadores", e);
    }
  };

  const cargarAudiovisuales = async () => {
    setLoadingAV(true);
    setErrorAV("");
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/audiovisual?usuario_id=${usuario.id_usuario}`
        : `${API}/audiovisual`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvRequests(data);
      } else {
        setErrorAV("Error al cargar solicitudes audiovisuales.");
      }
    } catch (err) {
      setErrorAV("No se pudo conectar al servidor para audiovisuales.");
    } finally {
      setLoadingAV(false);
    }
  };

  const cargarEventos = async () => {
    setLoading(true);
    setError("");
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/eventos`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEventRequests(data);
      } else {
        setError("Error al cargar eventos.");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleIntentarCambioEstado = (id_evento, nuevoEstado) => {
    if (nuevoEstado === "Aprobado") {
      setPendingApprovalEvent(id_evento);
      setIsCoordinadorModalOpen(true);
    } else {
      setConfirmEstadoModal({ open: true, id_evento, nuevoEstado });
    }
  };

  const handleConfirmarCambioEstadoGenerico = () => {
    handleCambiarEstado(confirmEstadoModal.id_evento, confirmEstadoModal.nuevoEstado);
    setConfirmEstadoModal({ open: false, id_evento: null, nuevoEstado: "" });
  };

  const handleRechazarCambioEstadoGenerico = () => {
    setConfirmEstadoModal({ open: false, id_evento: null, nuevoEstado: "" });
    cargarEventos(); // reset select
  };

  const handleCambiarEstado = async (id_evento, nuevoEstado, id_coordinador = null) => {
    try {
      const bodyPayload = { estado: nuevoEstado };
      if (id_coordinador) bodyPayload.id_coordinador = id_coordinador;

      const res = await fetch(`${API}/eventos/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        cargarEventos();
        setIsCoordinadorModalOpen(false);
        setSelectedCoordinador("");
        setPendingApprovalEvent(null);
      } else {
        alert(data.mensaje || "Error al cambiar el estado.");
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    }
  };

  const handleCambiarEstadoAV = async (id_servicio, nuevoEstado) => {
    try {
      const res = await fetch(`${API}/audiovisual/${id_servicio}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarAudiovisuales();
      } else {
        alert("Error al cambiar el estado.");
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    // Adjust for timezone offset if needed, or just format
    // Realmente, como solo es la fecha se puede parsear directamente pero
    // le sumamos las horas para evitar problemas de timezone
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };
  
  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const [hora, min] = horaStr.split(':');
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${min} ${ampm}`;
  };

  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente": return "pending";
      case "Aprobado": return "approved";
      case "Rechazado": return "rejected";
      case "Finalizado": return "approved";
      default: return "pending";
    }
  };


  const departamentosUnicos = ["Todos", ...new Set(eventRequests.map((e) => e.dependencia).filter(Boolean))];

  const filteredRequests = eventRequests
    .filter((req) => {
      const matchSearch = searchTerm === "" || 
        req.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#EVT-${req.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      const matchDept = departmentFilter === "Todos" || req.dependencia === departmentFilter;
      const matchStatus = statusFilter === "Todos" || req.estado === statusFilter;
      const matchDate = !dateFilter || (req.fecha_inicio && req.fecha_inicio.startsWith(dateFilter));
      return matchDept && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const dA = new Date(a.fecha_inicio).getTime();
      const dB = new Date(b.fecha_inicio).getTime();
      return sortOrder === "asc" ? dA - dB : dB - dA;
    });

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  // Resetear a pág 1 si los filtros cambian
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, statusFilter, dateFilter, sortOrder]);
  const totalSolicitudes = eventRequests.length;
  const pendientes = eventRequests.filter((e) => e.estado === "Pendiente").length;
  const finalizados = eventRequests.filter((e) => e.estado === "Finalizado" || e.estado === "Aprobado").length;

  if (usuario?.rol === 'Personal de Apoyo') {
    return <MisTareasApoyo usuario={usuario} />;
  }

  return (
    <>
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon requests">
            <FiFileText aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-label">MIS SOLICITUDES</span>
            <h3>{totalSolicitudes}</h3>
            <span className="stat-trend positive">Total registrado</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <FiClock aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-label">MIS PENDIENTES</span>
            <h3>{pendientes}</h3>
            <span className="stat-trend warning">Por realizarse</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <FiCheckCircle aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-label">MIS FINALIZADOS</span>
            <h3>{finalizados}</h3>
            <span className="stat-trend positive">Concluidos</span>
          </div>
        </div>
      </div>


      <div className="recent-requests-section">
        <div className="section-header">
          <h3>{usuario?.rol === "Solicitante" ? "Mi Historial de Solicitudes" : "Todas las Solicitudes"}</h3>
          <div className="section-filters">
            {usuario?.rol !== "Solicitante" && (
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departamentosUnicos.map((d) => (
                  <option key={d} value={d}>{d === "Todos" ? "Todos los Departamentos" : d}</option>
                ))}
              </select>
            )}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Finalizado">Finalizado</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <button className="sort-btn" onClick={() => setSortOrder((o) => o === "asc" ? "desc" : "asc")}>
              {sortOrder === "asc" ? "↑↓ Asc" : "↓↑ Desc"}
            </button>
            <button className="sort-btn icon-only-btn" onClick={cargarEventos} title="Recargar"><FiRefreshCw /></button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>Cargando eventos...</p>
          ) : error ? (
            <p style={{ textAlign: "center", padding: "30px", color: "#dc2626" }}>{error}</p>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  {usuario?.rol !== "Solicitante" && <th>SOLICITANTE</th>}
                  {usuario?.rol !== "Solicitante" && <th>DEPENDENCIA</th>}
                  <th>FECHA</th>
                  <th>RECINTO</th>
                  <th>ESTADO</th>
                  <th>ESTADO POA</th>
                  <th>DETALLES</th>
                  {usuario?.rol !== "Administrador V-A-F" && <th>ACCIONES</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((req) => (
                  <tr key={req.id_evento}>
                    <td>
                      <strong>{req.nombre}</strong><br />
                      <span className="text-muted">#EVT-{req.id_evento}</span>
                    </td>
                    {usuario?.rol !== "Solicitante" && <td>{req.solicitante || "—"}</td>}
                    {usuario?.rol !== "Solicitante" && <td>{req.dependencia || "—"}</td>}
                    <td>{formatFecha(req.fecha_inicio)}</td>
                    <td>{req.recinto || "—"}</td>
                    <td>
                      <span className={`status ${getStatusClass(req.estado)}`}>
                        {req.estado || "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${getStatusClass(req.estado_poa)}`}>
                        {req.estado_poa || "Ninguno"}
                      </span>
                    </td>
                    <td>
                      <button className="details-btn" onClick={() => openModal(req)}>
                        <FiEye /> Ver
                      </button>
                    </td>
                    {usuario?.rol !== "Administrador V-A-F" && (
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {usuario?.rol === "Solicitante" ? (
                          <button className="details-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => onEditEvent(req)}>
                            <FiEdit2 /> Editar
                          </button>
                        ) : (
                          <select
                            value={req.estado || "Pendiente"}
                            onChange={(e) => handleIntentarCambioEstado(req.id_evento, e.target.value)}
                            className="table-select"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Aprobado">Aprobado</option>
                            <option value="Rechazado">Rechazado</option>
                            <option value="Finalizado">Finalizado</option>
                          </select>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {filteredRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequests.length)} de {filteredRequests.length} solicitudes
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft /> Anterior
              </button>
              <span className="page-number">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* MODAL DETALLES REDISEÑADO */}
        {isModalOpen && selectedRequest && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px", padding: "0" }}>
              <div className="modal-header" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Detalle de Solicitud: #{selectedRequest.id_evento}</h2>
                <button onClick={closeModal} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "#1e40af" }}>{selectedRequest.nombre}</h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Solicitado por: <strong>{selectedRequest.solicitante || "—"}</strong></p>
                </div>

                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Dependencia:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500" }}>{selectedRequest.dependencia || "—"}</p>
                </div>
                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Recinto:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500" }}>{selectedRequest.recinto || "—"}</p>
                </div>

                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Modalidad y Tipo:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500" }}>{selectedRequest.modalidad || "—"} - {selectedRequest.tipo_evento || "—"}</p>
                </div>
                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Fechas y Horario:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500" }}>
                    {formatFecha(selectedRequest.fecha_inicio)} {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? `al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                    <br/><span style={{ color: "#64748b", fontSize: "13px" }}>{selectedRequest.hora_inicio ? formatHora(selectedRequest.hora_inicio) : "—"} a {selectedRequest.hora_fin ? formatHora(selectedRequest.hora_fin) : "—"}</span>
                  </p>
                </div>

                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Asistentes Esperados:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500" }}>{selectedRequest.cantidad_asistentes || "—"}</p>
                </div>
                <div className="detail-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Presupuesto POA:</label>
                  <p style={{ margin: "5px 0 0 0", fontWeight: "500", color: "#16a34a" }}>{selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || ''}` : "—"}</p>
                </div>

                <div className="detail-group" style={{ gridColumn: "1 / -1", margin: 0, padding: "10px", background: "#f1f5f9", borderRadius: "6px" }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Logística (Alimentos / Detalles):</label>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px" }}>
                    <strong>Catering:</strong> {selectedRequest.alimentos || "Ninguno"}<br/>
                    <strong>Corporativo:</strong> {selectedRequest.detalles_corporativos || "Ninguno"}
                  </p>
                </div>

                <div className="detail-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
                  <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Audiovisual Requerido:</label>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px" }}>
                    {selectedRequest.necesita_audiovisual ? (selectedRequest.equipos_audiovisuales || "Sí (Pendiente/Sin Especificar)") : "No"}
                  </p>
                </div>

                {selectedRequest.observaciones && (
                  <div className="detail-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
                    <label style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Observaciones de Montaje:</label>
                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#475569" }}>{selectedRequest.observaciones}</p>
                  </div>
                )}

                {selectedRequest.motivo_rechazo_poa && (
                  <div className="detail-group" style={{ gridColumn: "1 / -1", margin: 0, padding: "12px", background: "#fee2e2", borderLeft: "4px solid #dc2626", borderRadius: "4px" }}>
                    <label style={{ fontSize: "13px", color: "#dc2626", display: "block", fontWeight: "bold" }}>Razón de Rechazo (Administración POA):</label>
                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#b91c1c" }}>{selectedRequest.motivo_rechazo_poa}</p>
                  </div>
                )}

              </div>
              <div className="modal-footer" style={{ padding: "15px 20px", borderTop: "1px solid #e2e8f0", textAlign: "right", background: "#f8fafc" }}>
                <button className="btn-primary" onClick={closeModal} style={{ padding: "8px 20px", borderRadius: "6px", background: "#1e40af", color: "white", border: "none", cursor: "pointer", fontWeight: "500" }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMACION DE ESTADO GENÉRICO */}
        {confirmEstadoModal.open && (
          <div className="modal-overlay" onClick={handleRechazarCambioEstadoGenerico}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center", padding: "30px" }}>
              <h3 style={{ margin: "0 0 15px 0" }}>Confirmación de Acción</h3>
              <p style={{ color: "#475569", marginBottom: "25px" }}>
                ¿Deseas realizar la acción "<strong>{confirmEstadoModal.nuevoEstado}</strong>" para este evento?
              </p>
              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <button 
                  onClick={handleRechazarCambioEstadoGenerico}
                  style={{ padding: "10px 20px", borderRadius: "6px", background: "white", border: "1px solid #cbd5e1", color: "#475569", cursor: "pointer", fontWeight: "600" }}
                >
                  Rechazar
                </button>
                <button 
                  onClick={handleConfirmarCambioEstadoGenerico}
                  style={{ padding: "10px 20px", borderRadius: "6px", background: "#1e40af", border: "none", color: "white", cursor: "pointer", fontWeight: "600" }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ASIGNAR COORDINADOR (Fase 1) */}
        {isCoordinadorModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCoordinadorModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
              <div className="modal-header">
                <h2>Aprobar y Asignar Coordinador</h2>
              </div>
              <div className="modal-body">
                <p>Para aprobar este evento, por favor asigne al Coordinador Logístico que será responsable de armar el cronograma.</p>
                <div className="form-group" style={{marginTop: '15px'}}>
                  <label>Seleccionar Coordinador:</label>
                  <select 
                    style={{width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc'}}
                    value={selectedCoordinador} 
                    onChange={(e) => setSelectedCoordinador(e.target.value)}
                  >
                    <option value="">-- Seleccione una persona --</option>
                    {coordinadoresPosibles.map(c => (
                      <option key={c.id_usuario} value={c.id_usuario}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px'}}>
                <button className="close-btn" style={{background: '#95a5a6'}} onClick={() => setIsCoordinadorModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" 
                  disabled={!selectedCoordinador}
                  onClick={() => handleCambiarEstado(pendingApprovalEvent, "Aprobado", selectedCoordinador)}
                  style={{background: '#2ecc71', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: selectedCoordinador ? 'pointer' : 'not-allowed', opacity: selectedCoordinador ? 1 : 0.5}}
                >Confirmar y Aprobar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default DashboardHome;
