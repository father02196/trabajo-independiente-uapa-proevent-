import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiFilter, FiSearch, FiSliders, FiTrash2, FiGrid, FiDollarSign, FiBriefcase, FiSend, FiActivity, FiPlay, FiLock, FiAlertCircle, FiXCircle, FiInfo } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSortableData } from "../hooks/useSortableData";
import FichaTecnicaPDF from "./FichaTecnicaPDF";
import SortableHeader from "../components/SortableHeader";
import './../css/Dashboard.css';
const API = "http://localhost:8080";

function GestionEventos({ usuario, searchTerm = "", onEditEvent }) {
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
  const [isAsignarServicioModalOpen, setIsAsignarServicioModalOpen] = useState(false); // Modal para Asignar Servicio
  const [coordinadores, setCoordinadores] = useState([]);

  // === LÓGICA DE APROBACIONES ===
  const [aprobacionesMap, setAprobacionesMap] = useState({}); // { [id_evento]: { puede_iniciar, aprobaciones, ... } }
  const [modalAprobaciones, setModalAprobaciones] = useState(null); // Evento seleccionado para ver aprobaciones
  const [loadingAprobaciones, setLoadingAprobaciones] = useState({});

  useEffect(() => {
    fetch(`${API}/usuarios-coordinadores`)
      .then(res => res.json())
      .then(data => setCoordinadores(data))
      .catch(err => console.error("Error al cargar coordinadores:", err));
  }, []);

  const handleVerDetalles = async (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
    
    // Preparar datos para el PDF en background
    try {
      const resAdmin = await fetch(`${API}/api/admin_evento/${req.id_evento}`);
      const dataAdmin = await resAdmin.json();
      
      const resServ = await fetch(`${API}/servicios-externos-all`);
      const dataServ = await resServ.json();
      const servicios = Array.isArray(dataServ) ? dataServ.filter(s => s.id_evento === req.id_evento) : [];

      const resOrg = await fetch(`${API}/eventos/${req.id_evento}/personal`);
      const dataOrg = await resOrg.json();

      setPdfData({
        presupuesto: dataAdmin.presupuesto,
        legal: dataAdmin.legal,
        servicios,
        organizadores: Array.isArray(dataOrg) ? dataOrg : []
      });
    } catch (e) {
      console.error("Error pre-cargando datos del PDF", e);
    }
    cargarOrganizadoresAsignados(req.id_evento);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setOrganizadoresAsignados([]);
    setShowFichaPDF(false);
  };

  const [tiposServicioExterno, setTiposServicioExterno] = useState([]);
  const [servicioForm, setServicioForm] = useState({ id_tipo_servicio: "", detalles: "", cantidad: 1 });
  
  // Datos extra para la Ficha PDF
  const [showFichaPDF, setShowFichaPDF] = useState(false);
  const [pdfData, setPdfData] = useState({ presupuesto: null, legal: null, servicios: [], organizadores: [] });
  const [enviandoServicio, setEnviandoServicio] = useState(false);

  const openAsignarServicioModal = async () => {
    setIsAsignarServicioModalOpen(true);
    try {
      const res = await fetch(`${API}/tipos-servicio-externo`);
      if (res.ok) {
        setTiposServicioExterno(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeAsignarServicioModal = () => {
    setIsAsignarServicioModalOpen(false);
    setServicioForm({ id_tipo_servicio: "", detalles: "", cantidad: 1 });
  };

  const handleSubmitServicio = async (e) => {
    e.preventDefault();
    if (!servicioForm.id_tipo_servicio) {
      toast.error("Seleccione un tipo de servicio");
      return;
    }
    setEnviandoServicio(true);
    try {
      const res = await fetch(`${API}/servicios-externos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_evento: selectedRequest.id_evento,
          id_tipo_servicio: servicioForm.id_tipo_servicio,
          detalles: servicioForm.detalles,
          cantidad: servicioForm.cantidad
        })
      });
      if (res.ok) {
        toast.success("Servicio asignado correctamente a Logística Operativa");
        closeAsignarServicioModal();
        handleVerDetalles(selectedRequest); // <-- Actualiza los datos del modal PDF
      } else {
        toast.error("Error al asignar servicio");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setEnviandoServicio(false);
    }
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

  const cargarAprobacionesEvento = async (id_evento) => {
    setLoadingAprobaciones(prev => ({ ...prev, [id_evento]: true }));
    try {
      const res = await fetch(`${API}/api/aprobaciones-evento/${id_evento}`);
      if (res.ok) {
        const data = await res.json();
        setAprobacionesMap(prev => ({ ...prev, [id_evento]: data }));
      }
    } catch (e) {
      console.error('Error cargando aprobaciones:', e);
    } finally {
      setLoadingAprobaciones(prev => ({ ...prev, [id_evento]: false }));
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
        // Cargar aprobaciones para todos los eventos que estén en estado Aprobado (candidatos a Iniciar)
        const aprobados = data.filter(e => e.estado === 'Aprobado');
        aprobados.forEach(e => cargarAprobacionesEvento(e.id_evento));
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
    // Validación especial para Iniciar Evento
    if (nuevoEstado === 'En Progreso') {
      const aprobInfo = aprobacionesMap[id_evento];
      if (!aprobInfo) {
        // Intentar cargar y bloquear por ahora
        toast.error('Verificando aprobaciones... Por favor intenta de nuevo.');
        cargarAprobacionesEvento(id_evento);
        return;
      }
      if (!aprobInfo.puede_iniciar) {
        setModalAprobaciones({ id_evento, ...aprobInfo });
        return;
      }
    }
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
    });

  const { items: sortedRequests, requestSort, sortConfig } = useSortableData(filteredRequests, { key: 'fecha_inicio', direction: 'descending' });

  // Paginación
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, statusFilter, dateFilter]);

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
              <label><FiBriefcase style={{ display: 'inline', marginRight: '6px' }} /> Departamento / Dependencia</label>
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
              className={`sort-toggle-btn ${sortConfig?.direction === "ascending" ? "asc" : "desc"}`} 
              onClick={() => requestSort('fecha_inicio')}
            >
              {sortConfig?.direction === "ascending" ? "Más antiguos primero" : "Más recientes primero"}
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
                  <SortableHeader label="EVENTO ID & NOMBRE" sortKey="nombre" sortConfig={sortConfig} requestSort={requestSort} />
                  {usuario?.rol !== "Solicitante" && <SortableHeader label="SOLICITANTE" sortKey="solicitante" sortConfig={sortConfig} requestSort={requestSort} />}
                  {usuario?.rol !== "Solicitante" && <SortableHeader label="DEPENDENCIA" sortKey="dependencia" sortConfig={sortConfig} requestSort={requestSort} />}
                  <SortableHeader label="FECHA DE INICIO" sortKey="fecha_inicio" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="RECINTO / LUGAR" sortKey="recinto" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="ESTADO EVENTO" sortKey="estado" sortConfig={sortConfig} requestSort={requestSort} />
                  <SortableHeader label="CONTABILIDAD POA" sortKey="aprobacion_poa" sortConfig={sortConfig} requestSort={requestSort} />
                  <th>MÁS DETALLES</th>
                  {usuario?.rol !== "Administrador V-A-F" && <th style={{ textAlign: 'center' }}>ACCIONES DE GESTIÓN</th>}
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
                      <button className="details-btn" onClick={() => handleVerDetalles(req)}>
                        <FiEye /> Ver detalles
                      </button>
                    </td>
                    {usuario?.rol !== "Administrador V-A-F" && (
                      <td>
                        <div className="actions-cell">
                          {usuario?.rol === "Solicitante" ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="action-icon-btn edit" 
                                onClick={() => onEditEvent(req)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes editar solicitudes pendientes" : "Editar solicitud"}
                              >
                                <FiEdit2 />
                              </button>
                              <button 
                                className="action-icon-btn delete" 
                                onClick={() => handleEliminarEvento(req.id_evento)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes eliminar solicitudes pendientes" : "Eliminar solicitud"}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(!req.estado || req.estado === "Pendiente") && (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleCambiarEstado(req.id_evento, "Aprobado")} style={{ padding: '6px 12px', width: '100%' }}>
                                    <FiCheckCircle /> Aprobar
                                  </button>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', width: '100%', color: '#ef4444', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }} onClick={() => handleCambiarEstado(req.id_evento, "Rechazado")}>
                                    <FiXCircle /> Rechazar
                                  </button>
                                </>
                              )}
                              {req.estado === "Aprobado" && (() => {
                                const aprobInfo = aprobacionesMap[req.id_evento];
                                const isLoading = loadingAprobaciones[req.id_evento];
                                const puedeIniciar = aprobInfo?.puede_iniciar;
                                const hayRechazos = aprobInfo?.hay_rechazos;
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <button 
                                      className={`btn btn-sm ${ puedeIniciar ? '' : 'btn-secondary'}`}
                                      style={{
                                        padding: '6px 12px', width: '100%',
                                        backgroundColor: puedeIniciar ? '#0ea5e9' : hayRechazos ? '#fef2f2' : '#f1f5f9',
                                        color: puedeIniciar ? '#fff' : hayRechazos ? '#ef4444' : '#64748b',
                                        border: puedeIniciar ? 'none' : `1px solid ${hayRechazos ? '#fca5a5' : '#e2e8f0'}`,
                                        cursor: puedeIniciar ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        fontWeight: '600', borderRadius: '8px', fontSize: '12.5px',
                                        transition: 'all 0.2s'
                                      }}
                                      onClick={() => {
                                        if (puedeIniciar) {
                                          handleCambiarEstado(req.id_evento, 'En Progreso');
                                        } else {
                                          if (aprobInfo) setModalAprobaciones({ id_evento: req.id_evento, ...aprobInfo });
                                          else { cargarAprobacionesEvento(req.id_evento); toast('Cargando estado de aprobaciones...'); }
                                        }
                                      }}
                                      title={puedeIniciar ? 'Iniciar evento' : hayRechazos ? 'Evento rechazado por un área' : 'Aprobaciones pendientes'}
                                    >
                                      {isLoading ? <FiClock size={13} /> : puedeIniciar ? <FiPlay size={13} /> : <FiLock size={13} />}
                                      {isLoading ? 'Verificando...' : puedeIniciar ? 'Iniciar Evento' : hayRechazos ? 'Rechazado' : 'Pendiente'}
                                    </button>
                                    {/* Mini badge de estado de aprobaciones */}
                                    {aprobInfo && !puedeIniciar && (
                                      <button
                                        onClick={() => setModalAprobaciones({ id_evento: req.id_evento, ...aprobInfo })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center', padding: '2px', textDecoration: 'underline' }}
                                      >
                                        <FiInfo size={11} /> Ver aprobaciones
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                              {req.estado === "En Progreso" && (
                                <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#10b981', border: 'none', padding: '6px 12px', width: '100%' }} onClick={() => handleCambiarEstado(req.id_evento, "Finalizado")}>
                                  Finalizar
                                </button>
                              )}
                              {["Finalizado", "Rechazado", "Cancelado"].includes(req.estado) && (
                                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600', textAlign: 'center', display: 'block' }}>Sin acciones</span>
                              )}
                            </div>
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
      {isModalOpen && selectedRequest && createPortal(
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

              {/* Tracking Administrativo a Ancho Completo */}
              <div className="modal-grid-1" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiActivity size={14} /> Tracking Administrativo (Lectura)
                  </div>
                  <div className="modal-grid-3">
                    <div className="info-row">
                      <span className="info-label">Presupuesto POA</span>
                      <span className={`badge ${pdfData.presupuesto?.estado_poa === 'Aprobado' ? 'badge-green' : pdfData.presupuesto?.estado_poa === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                        {pdfData.presupuesto?.estado_poa || "Pendiente"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Revisión Legal</span>
                      <span className={`badge ${pdfData.legal?.estado_contrato === 'Vigente' ? 'badge-green' : pdfData.legal?.estado_contrato === 'Vencido' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                        {pdfData.legal?.estado_contrato || "Pendiente"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Compras y Logística (B2B)</span>
                      <span className="info-value" style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', fontWeight: 'bold' }}>
                        {pdfData.servicios?.length > 0 
                          ? `${pdfData.servicios.length} servicio(s) gestionado(s)` 
                          : "Ninguno en proceso"}
                      </span>
                    </div>
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
                      <FiFileText size={14} /> Observaciones y Sugerencias
                    </div>
                    {selectedRequest.observaciones.includes('[SUGERENCIAS EXTERNAS]:') ? (
                      <>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                          "{selectedRequest.observaciones.split('\n\n[SUGERENCIAS EXTERNAS]:')[0]}"
                        </p>
                        <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                          <h4 style={{ color: '#D97706', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiBriefcase /> Sugerencia de Servicios Externos (Por Solicitante)</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                            {selectedRequest.observaciones.split('\n\n[SUGERENCIAS EXTERNAS]:')[1]}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                        "{selectedRequest.observaciones}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {usuario?.rol !== "Solicitante" && (
                  <button className="btn btn-secondary" onClick={openAsignarServicioModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiSend /> Asignar Servicio Externo
                  </button>
                )}
                {usuario?.rol === "Solicitante" && selectedRequest.estado !== "Aprobado" && selectedRequest.estado !== "Finalizado" && onEditEvent && (
                  <button className="btn btn-secondary" onClick={() => { closeModal(); onEditEvent(selectedRequest); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiEdit2 /> Editar Evento
                  </button>
                )}
                {usuario?.rol !== "Solicitante" && (
                  <button className="btn btn-secondary" onClick={() => setShowFichaPDF(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFileText /> Generar PDF
                  </button>
                )}
              </div>
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RENDER FICHA PDF OCULTO/MODAL */}
      {showFichaPDF && selectedRequest && (
        <FichaTecnicaPDF 
          evento={selectedRequest} 
          presupuesto={pdfData.presupuesto}
          legal={pdfData.legal}
          servicios={pdfData.servicios}
          organizadores={pdfData.organizadores}
          onClose={() => setShowFichaPDF(false)}
        />
      )}

      {/* MODAL ASIGNAR SERVICIO EXTERNO */}
      {isAsignarServicioModalOpen && selectedRequest && createPortal(
        <div className="modal-overlay" onClick={closeAsignarServicioModal} style={{ zIndex: 1060 }}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Asignar Servicio Externo</h3>
                <span className="modal-subtitle">Enviar requerimiento a Logística Operativa</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={closeAsignarServicioModal}>X</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitServicio} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Tipo de Servicio</label>
                  <select 
                    className="input-base" 
                    value={servicioForm.id_tipo_servicio}
                    onChange={(e) => setServicioForm({...servicioForm, id_tipo_servicio: e.target.value})}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {tiposServicioExterno.map(t => (
                      <option key={t.id_tipo_servicio} value={t.id_tipo_servicio}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Detalles / Especificaciones</label>
                  <textarea 
                    className="input-base" 
                    placeholder="Ej: Necesitamos una tarima de 4x4m..."
                    value={servicioForm.detalles}
                    onChange={(e) => setServicioForm({...servicioForm, detalles: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Cantidad</label>
                  <input 
                    type="number" 
                    className="input-base" 
                    min="1" 
                    value={servicioForm.cantidad}
                    onChange={(e) => setServicioForm({...servicioForm, cantidad: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAsignarServicioModal}>Cancelar</button>
                  <button type="submit" className="btn btn-success" disabled={enviandoServicio}>
                    {enviandoServicio ? "Asignando..." : "Asignar Servicio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL ESTADO DE APROBACIONES */}
      {modalAprobaciones && createPortal(
        <div className="modal-overlay" onClick={() => setModalAprobaciones(null)} style={{ zIndex: 1060 }}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-circle" style={{ backgroundColor: modalAprobaciones.hay_rechazos ? '#fee2e2' : modalAprobaciones.puede_iniciar ? '#dcfce7' : '#e0e7ff', color: modalAprobaciones.hay_rechazos ? '#ef4444' : modalAprobaciones.puede_iniciar ? '#10b981' : '#6366f1' }}>
                  {modalAprobaciones.hay_rechazos ? <FiXCircle size={20} /> : modalAprobaciones.puede_iniciar ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">Estado de Aprobaciones</h3>
                  <span className="modal-subtitle">
                    {modalAprobaciones.hay_rechazos 
                      ? 'El evento ha sido rechazado por una o más áreas.'
                      : modalAprobaciones.puede_iniciar 
                        ? 'Todas las áreas han aprobado. Listo para iniciar.'
                        : 'Aún hay áreas pendientes de revisión.'}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalAprobaciones(null)}>X</button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modalAprobaciones.aprobaciones.map((aprob, index) => (
                  <div key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '12px 16px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    opacity: aprob.requerido ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>{aprob.area}</span>
                      {!aprob.requerido && <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>No requerido</span>}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {aprob.estado === 'Aprobado' && <><FiCheckCircle color="#10b981" /><span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Aprobado</span></>}
                      {aprob.estado === 'Rechazado' && <><FiXCircle color="#ef4444" /><span style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Rechazado</span></>}
                      {aprob.estado === 'Pendiente' && <><FiClock color="#f59e0b" /><span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '13px' }}>Pendiente</span></>}
                      {aprob.estado === 'No aplica' && <><span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>No aplica</span></>}
                    </div>
                  </div>
                ))}
              </div>

              {!modalAprobaciones.puede_iniciar && !modalAprobaciones.hay_rechazos && modalAprobaciones.pendientes.length > 0 && (
                <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <FiAlertCircle color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '13px', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                      <strong>Acción bloqueada:</strong> No puedes iniciar este evento hasta que las áreas pendientes emitan su dictamen final.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              {modalAprobaciones.puede_iniciar ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    handleCambiarEstado(modalAprobaciones.id_evento, 'En Progreso');
                    setModalAprobaciones(null);
                  }}
                  style={{ backgroundColor: '#0ea5e9', border: 'none' }}
                >
                  <FiPlay /> Iniciar Evento Ahora
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => setModalAprobaciones(null)}>Entendido</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default GestionEventos;
