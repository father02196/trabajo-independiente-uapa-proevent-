import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiFilter, FiSearch, FiSliders, FiTrash2, FiGrid, FiDollarSign } from "react-icons/fi";
import { toast } from "react-hot-toast";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function GestionEventos({ usuario, searchTerm = "", onEditEvent }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const [departmentFilter, setDepartmentFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  useEffect(() => {
    cargarEventos();
    setCurrentPage(1);
  }, [usuario]);

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
        toast.error("Error al cargar eventos.");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor de eventos.");
      toast.error("No se pudo conectar al servidor de eventos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    try {
      const res = await fetch(`${API}/eventos/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${usuario?.token || ""}`,
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        toast.success(`Estado actualizado a ${nuevoEstado}`);
        cargarEventos();
      } else {
        toast.error("Error al cambiar el estado del evento.");
      }
    } catch {
      toast.error("No se pudo conectar al servidor para actualizar el estado.");
    }
  };

  const handleEliminarEvento = async (id_evento) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/eventos/${id_evento}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${usuario?.token || ""}`,
          "x-usuario-id": usuario?.id_usuario || ""
        }
      });
      if (res.ok) {
        toast.success("Evento eliminado exitosamente.");
        cargarEventos();
      } else {
        const errorData = await res.json();
        toast.error(errorData.mensaje || "Error al eliminar el evento.");
      }
    } catch (err) {
      toast.error("No se pudo conectar al servidor para eliminar el evento.");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
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
        `#EVT-${req.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.solicitante?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  // Paginación
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, statusFilter, dateFilter, sortOrder]);

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiSliders className="header-icon" />
            <div>
              <h3>Panel de Control de Solicitudes</h3>
              <p className="subtitle">Filtra, aprueba y administra todas las solicitudes de eventos institucionales</p>
            </div>
          </div>
          <div className="header-actions-group">
            <button className="btn btn-secondary btn-sm" onClick={cargarEventos} title="Recargar lista">
              <FiRefreshCw /> Recargar
            </button>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-item">
            <label><FiFilter /> Estado</label>
            <select className="input-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">🟡 Pendientes</option>
              <option value="Aprobado">🟢 Aprobados</option>
              <option value="Rechazado">🔴 Rechazados</option>
              <option value="Finalizado">🔵 Finalizados</option>
            </select>
          </div>

          {usuario?.rol !== "Solicitante" && (
            <div className="filter-item">
              <label>🏢 Departamento / Dependencia</label>
              <select className="input-base" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departamentosUnicos.map((d) => (
                  <option key={d} value={d}>{d === "Todos" ? "Todos los Departamentos" : d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-item">
            <label><FiCalendar /> Fecha del Evento</label>
            <input
              type="date"
              className="input-base"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>⇅ Ordenar por Fecha</label>
            <button 
              className={`sort-toggle-btn ${sortOrder === "asc" ? "asc" : "desc"}`} 
              onClick={() => setSortOrder((o) => o === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Más antiguos primero" : "Más recientes primero"}
            </button>
          </div>
        </div>
      </div>

      <div className="recent-requests-section admin-table-card">
        <div className="table-container">
          {loading ? (
            <div className="table-state-loading">
              <div className="loader"></div>
              <p>Cargando lista de solicitudes de eventos...</p>
            </div>
          ) : error ? (
            <div className="table-state-error">
              <p>{error}</p>
              <button className="retry-btn" onClick={cargarEventos}>Reintentar conexión</button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="table-state-empty">
              <FiFileText className="empty-icon" />
              <h4>No se encontraron solicitudes</h4>
              <p>Prueba ajustando los filtros de búsqueda o fecha.</p>
            </div>
          ) : (
            <table className="requests-table modern-table">
              <thead>
                <tr>
                  <th>EVENTO ID & NOMBRE</th>
                  {usuario?.rol !== "Solicitante" && <th>SOLICITANTE</th>}
                  {usuario?.rol !== "Solicitante" && <th>DEPENDENCIA</th>}
                  <th>FECHA DE INICIO</th>
                  <th>RECINTO / LUGAR</th>
                  <th>ESTADO EVENTO</th>
                  <th>CONTABILIDAD POA</th>
                  <th>MÁS DETALLES</th>
                  {usuario?.rol !== "Administrador V-A-F" && <th>ACCIONES DE GESTIÓN</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((req) => (
                  <tr key={req.id_evento} className="table-hover-row">
                    <td>
                      <div className="event-name-cell">
                        <strong>{req.nombre}</strong>
                        <span className="event-id-tag">#EVT-{req.id_evento}</span>
                      </div>
                    </td>
                    {usuario?.rol !== "Solicitante" && (
                      <td>
                        <div className="solicitante-cell">
                          <span className="avatar-char">{req.solicitante ? req.solicitante.charAt(0).toUpperCase() : "U"}</span>
                          <span>{req.solicitante || "—"}</span>
                        </div>
                      </td>
                    )}
                    {usuario?.rol !== "Solicitante" && <td>{req.dependencia || "—"}</td>}
                    <td>
                      <div className="date-cell">
                        <FiCalendar className="date-icon" />
                        <span>{formatFecha(req.fecha_inicio)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="venue-cell">
                        <span>{req.recinto || "—"}</span>
                      </div>
                    </td>
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
                        <FiEye /> Ver detalles
                      </button>
                    </td>
                    {usuario?.rol !== "Administrador V-A-F" && (
                      <td>
                        <div className="actions-cell">
                          {usuario?.rol === "Solicitante" ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="edit-action-btn" 
                                onClick={() => onEditEvent(req)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes editar solicitudes pendientes" : "Editar solicitud"}
                              >
                                <FiEdit2 /> Editar
                              </button>
                              <button 
                                className="edit-action-btn" 
                                style={{ color: req.estado !== "Pendiente" ? '#94a3b8' : '#ef4444', borderColor: req.estado !== "Pendiente" ? '#e2e8f0' : '#fca5a5', backgroundColor: req.estado !== "Pendiente" ? '#f8fafc' : '#fef2f2' }}
                                onClick={() => handleEliminarEvento(req.id_evento)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes eliminar solicitudes pendientes" : "Eliminar solicitud"}
                              >
                                <FiTrash2 /> Eliminar
                              </button>
                            </div>
                          ) : (
                            <select
                              value={req.estado || "Pendiente"}
                              onChange={(e) => handleCambiarEstado(req.id_evento, e.target.value)}
                              className="table-select-premium"
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
        {!loading && filteredRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredRequests.length)}</strong> de <strong>{filteredRequests.length}</strong> solicitudes
            </div>
            <div className="pagination-controls" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft /> Anterior
              </button>
              <span style={{fontWeight: 700, color: 'var(--text-main)', fontSize: '13px'}}>
                Pág. {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica del Evento</h3>
                <span className="modal-subtitle">Revisión exhaustiva y logística completa</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#EVT-{selectedRequest.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-3">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiFileText size={14} /> Información General
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nombre del Evento</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>{selectedRequest.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Solicitante</span>
                    <span className="info-value">{selectedRequest.solicitante || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Dependencia</span>
                    <span className="info-value">{selectedRequest.dependencia || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fechas</span>
                    <span className="info-value">
                      {formatFecha(selectedRequest.fecha_inicio)} 
                      {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Horario</span>
                    <span className="info-value">
                      {selectedRequest.hora_inicio ? formatHora(selectedRequest.hora_inicio) : "—"} 
                      {selectedRequest.hora_fin ? ` a ${formatHora(selectedRequest.hora_fin)}` : ""}
                    </span>
                  </div>
                </div>

                {/* Columna 2: Logística y Asistencia */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiGrid size={14} /> Logística y Asistencia
                  </div>
                  <div className="info-row">
                    <span className="info-label">Recinto</span>
                    <span className="info-value">{selectedRequest.recinto || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Modalidad</span>
                    <span className="info-value">{selectedRequest.modalidad || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tipo de Evento</span>
                    <span className="info-value">{selectedRequest.tipo_evento || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Asistentes Esperados</span>
                    <span className="info-value">{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : "—"}</span>
                  </div>
                </div>

                {/* Columna 3: Finanzas y Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiDollarSign size={14} /> Presupuesto y Estado
                  </div>
                  <div className="info-row">
                    <span className="info-label">Presupuesto POA Solicitado</span>
                    <span className="info-value" style={{ color: '#10B981' }}>
                      {selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || 'DOP'}` : "Sin Presupuesto POA"}
                    </span>
                  </div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado de la Solicitud</span>
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado || "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requerimientos Adicionales a Ancho Completo */}
              <div className="modal-grid-1" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Requerimientos Adicionales
                  </div>
                  <div className="modal-grid-3">
                    {selectedRequest.detalles_corporativos && (
                      <div className="info-row">
                        <span className="info-label">Montaje Corporativo</span>
                        <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>{selectedRequest.detalles_corporativos}</span>
                      </div>
                    )}
                    {selectedRequest.alimentos && (
                      <div className="info-row">
                        <span className="info-label">Alimentos (Catering)</span>
                        <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>{selectedRequest.alimentos}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Equipos Audiovisuales</span>
                      <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>
                        {selectedRequest.necesita_audiovisual 
                          ? (selectedRequest.equipos_audiovisuales || "Sí (Pendiente/Sin Especificar)") 
                          : "Ninguno"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedRequest.observaciones && (
                  <div className="info-card">
                    <div className="info-card-title">
                      <FiFileText size={14} /> Observaciones y Notas de Apoyo
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                      "{selectedRequest.observaciones}"
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEventos;
