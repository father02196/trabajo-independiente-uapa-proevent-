import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiFilter, FiSearch, FiSliders, FiTrash2 } from "react-icons/fi";
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
  const [coordinadores, setCoordinadores] = useState([]);

  useEffect(() => {
    fetch(`${API}/usuarios-coordinadores`)
      .then(res => res.json())
      .then(data => setCoordinadores(data))
      .catch(err => console.error("Error al cargar coordinadores:", err));
  }, []);

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
    cargarOrganizadoresAsignados(req.id_evento);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setOrganizadoresAsignados([]);
  };

  const [organizadoresAsignados, setOrganizadoresAsignados] = useState([]);

  const cargarOrganizadoresAsignados = async (id_evento) => {
    try {
      const res = await fetch(`${API}/organizadores/${id_evento}`);
      if (res.ok) {
        setOrganizadoresAsignados(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const asignarRol = async (id_evento, id_usuario, rol) => {
    if (!id_usuario) return;
    try {
      const res = await fetch(`${API}/organizadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_evento, id_usuario, rol_organizacion: rol })
      });
      if (res.ok) {
        toast.success(`${rol} asignado correctamente`);
        cargarOrganizadoresAsignados(id_evento);
      } else {
        toast.error(`Error al asignar ${rol}`);
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
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
            <button className="refresh-btn" onClick={cargarEventos} title="Recargar lista">
              <FiRefreshCw className="icon-spin-hover" /> Recargar
            </button>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-item">
            <label><FiFilter /> Estado</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
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
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft /> Anterior
              </button>
              <span className="page-number">
                Pág. {currentPage} de {totalPages || 1}
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
      </div>

      {/* MODAL DETALLES */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ficha Técnica del Evento</h3>
              <span className="modal-event-id">Solicitud #EVT-{selectedRequest.id_evento}</span>
            </div>
            <div className="modal-body modern-modal-body">
              <div className="detail-group full-width">
                <label>Nombre del Evento</label>
                <p className="main-event-title">{selectedRequest.nombre}</p>
              </div>
              <div className="detail-group">
                <label>Solicitante</label>
                <p>{selectedRequest.solicitante || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Dependencia</label>
                <p>{selectedRequest.dependencia || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Recinto</label>
                <p>{selectedRequest.recinto || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Modalidad</label>
                <p>{selectedRequest.modalidad || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Tipo de Evento</label>
                <p>{selectedRequest.tipo_evento || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Fechas</label>
                <p>
                  {formatFecha(selectedRequest.fecha_inicio)} 
                  {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                </p>
              </div>
              <div className="detail-group">
                <label>Horario</label>
                <p>
                  {selectedRequest.hora_inicio ? formatHora(selectedRequest.hora_inicio) : "—"} 
                  {selectedRequest.hora_fin ? ` a ${formatHora(selectedRequest.hora_fin)}` : ""}
                </p>
              </div>
              <div className="detail-group">
                <label>Asistentes Esperados</label>
                <p>{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : "—"}</p>
              </div>
              <div className="detail-group">
                <label>Presupuesto POA Solicitado</label>
                <p className="poa-monto">
                  {selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || 'DOP'}` : "Sin Presupuesto POA"}
                </p>
              </div>
              <div className="detail-group">
                <label>Estado de la Solicitud</label>
                <span className={`status ${getStatusClass(selectedRequest.estado)}`} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                  {selectedRequest.estado || "Pendiente"}
                </span>
              </div>
              {selectedRequest.detalles_corporativos && (
                <div className="detail-group full-width">
                  <label>Servicios de Montaje Corporativo</label>
                  <p className="details-list-text">{selectedRequest.detalles_corporativos}</p>
                </div>
              )}


              {selectedRequest.alimentos && (
                <div className="detail-group full-width">
                  <label>Servicio de Alimentos (Catering)</label>
                  <p className="details-list-text">{selectedRequest.alimentos}</p>
                </div>
              )}
              <div className="detail-group full-width">
                <label>Equipos Audiovisuales Requeridos</label>
                <p className="details-list-text">
                  {selectedRequest.necesita_audiovisual 
                    ? (selectedRequest.equipos_audiovisuales || "Sí (Pendiente/Sin Especificar)") 
                    : "Ninguno"}
                </p>
              </div>
              {selectedRequest.observaciones && (
                <div className="detail-group full-width">
                  <label>Observaciones y Notas de Apoyo</label>
                  <p className="observations-text">{selectedRequest.observaciones}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={closeModal}>Cerrar ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEventos;
