import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2 } from "react-icons/fi";
import './../css/Dashboard.css';

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
    setCurrentPage(1); // Reset al cambiar usuario
  }, [usuario]);


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

  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    try {
      const res = await fetch(`${API}/eventos/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarEventos();
      } else {
        alert("Error al cambiar el estado.");
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
                            onChange={(e) => handleCambiarEstado(req.id_evento, e.target.value)}
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

        {/* MODAL DETALLES */}
        {isModalOpen && selectedRequest && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalles de la Solicitud</h2>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <label>Nombre del Evento:</label>
                  <p>{selectedRequest.nombre}</p>
                </div>
                <div className="detail-group">
                  <label>Solicitante:</label>
                  <p>{selectedRequest.solicitante || "—"}</p>
                </div>
                <div className="detail-group">
                  <label>Dependencia:</label>
                  <p>{selectedRequest.dependencia || "—"}</p>
                </div>

                <div className="detail-group">
                  <label>Recinto:</label>
                  <p>{selectedRequest.recinto || "—"}</p>
                </div>
                {selectedRequest.modalidad && (
                  <div className="detail-group">
                    <label>Modalidad:</label>
                    <p>{selectedRequest.modalidad}</p>
                  </div>
                )}
                {selectedRequest.tipo_evento && (
                  <div className="detail-group">
                    <label>Tipo de Evento:</label>
                    <p>{selectedRequest.tipo_evento}</p>
                  </div>
                )}
                <div className="detail-group">
                  <label>Fechas:</label>
                  <p>
                    {formatFecha(selectedRequest.fecha_inicio)} 
                    {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` - ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                  </p>
                </div>
                {(selectedRequest.hora_inicio || selectedRequest.hora_fin) && (
                  <div className="detail-group">
                    <label>Horario:</label>
                    <p>
                      {selectedRequest.hora_inicio ? formatHora(selectedRequest.hora_inicio) : "—"} 
                      {selectedRequest.hora_fin ? ` a ${formatHora(selectedRequest.hora_fin)}` : ""}
                    </p>
                  </div>
                )}
                {selectedRequest.cantidad_asistentes && (
                  <div className="detail-group">
                    <label>Asistentes Esperados:</label>
                    <p>{selectedRequest.cantidad_asistentes}</p>
                  </div>
                )}
                {(selectedRequest.monto_poa || selectedRequest.moneda) && (
                  <div className="detail-group">
                    <label>Presupuesto POA:</label>
                    <p>{selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || ''}` : "—"}</p>
                  </div>
                )}
                {selectedRequest.detalles_corporativos && (
                  <div className="detail-group">
                    <label>Detalles Corporativos:</label>
                    <p>{selectedRequest.detalles_corporativos}</p>
                  </div>
                )}
                {selectedRequest.alimentos && (
                  <div className="detail-group">
                    <label>Servicio de Catering:</label>
                    <p>{selectedRequest.alimentos}</p>
                  </div>
                )}
                <div className="detail-group">
                  <label>Audiovisual Requerido:</label>
                  <p>
                    {selectedRequest.necesita_audiovisual 
                      ? (selectedRequest.equipos_audiovisuales || "Sí (Pendiente/Sin Especificar)") 
                      : "No"}
                  </p>
                </div>
                {selectedRequest.observaciones && (
                  <div className="detail-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Observaciones de Montaje:</label>
                    <p>{selectedRequest.observaciones}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="close-btn" onClick={closeModal}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default DashboardHome;
