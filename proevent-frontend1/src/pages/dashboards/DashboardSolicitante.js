// ============================================================
// DASHBOARD SOLICITANTE - Panel de Inicio para Solicitantes
// Pertenece a: Módulo de Inicio (ProEvent - Rol Solicitante)
// Propósito: Vista personalizada del dashboard para usuarios
// con rol Solicitante. Solo muestra SUS propias solicitudes
// filtradas por usuario_id. Incluye 3 tarjetas de stats,
// gráfico donut, timeline personal y accesos rápidos.
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

// Iconos de Feather Icons para tarjetas y botones
import { FiCheckCircle, FiClock, FiFileText, FiCalendar, FiArrowUpRight, FiPlus, FiGrid, FiActivity, FiStar, FiMonitor, FiEye } from "react-icons/fi";

// Estilos compartidos del dashboard
import './../../css/Dashboard.css';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: DashboardSolicitante
// Recibe:
//   - usuario: objeto del usuario solicitante logueado
//   - onEditEvent: callback para editar un evento propio
//   - setActiveTab: navega entre pestañas del layout
// ============================================================
function DashboardSolicitante({ usuario, onEditEvent, setActiveTab }) {

  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]); // Eventos del solicitante
  const [loading, setLoading]             = useState(true); // Spinner de carga
  const [error, setError]                 = useState("");   // Mensaje de error

  // --- ESTADOS DEL MODAL ---
  const [selectedRequest, setSelectedRequest] = useState(null); // Evento seleccionado
  const [isModalOpen, setIsModalOpen]         = useState(false); // Visibilidad del modal

  // --- FUNCIONES: openModal / closeModal ---
  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // --- EFECTO: Carga cuando el usuario está disponible ---
  // Solo dispara cargarDatos si el id_usuario ya existe
  // (espera a que el contexto de autenticación esté listo).
  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarDatos();
    }
  }, [usuario]);

  // --- FUNCIÓN: cargarDatos ---
  // Carga SOLO los eventos del solicitante logueado.
  // Usa el parámetro usuario_id en la URL para filtrar en el backend.
  // Los solicitantes NO pueden ver eventos de otros usuarios.
  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      // Filtra por usuario_id: el solicitante solo ve sus propias solicitudes
      const eventUrl = `${API}/eventos?usuario_id=${usuario.id_usuario}`;
      const resEvents = await fetch(eventUrl).then(r => r.json());
      if (Array.isArray(resEvents)) setEventRequests(resEvents);
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- FUNCIÓN UTILITARIA: formatFecha ---
  // Convierte fecha ISO a formato corto (ej: "15 jun").
  // Corrección de timezone para evitar desfase de 1 día por UTC.
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
  };

  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- FUNCIÓN UTILITARIA: getStatusClass ---
  // Devuelve la clase CSS del estado del evento para los badges de color.
  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente":  return "pending";  // Amarillo
      case "Aprobado":   return "approved"; // Verde
      case "Rechazado":  return "rejected"; // Rojo
      case "Finalizado": return "approved"; // Verde
      default: return "pending";
    }
  };

  // --- CÁLCULOS ESTADÍSTICOS (solo sobre los eventos del solicitante) ---
  const totalSolicitudes = eventRequests.length;
  const pendientes  = eventRequests.filter((e) => e.estado === "Pendiente").length;
  const aprobados   = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const finalizados = eventRequests.filter((e) => e.estado === "Finalizado").length;

  // --- DATOS DEL GRÁFICO DONUT ---
  // Solo los estados con al menos 1 evento se incluyen en el donut.
  const statusData = [
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Aprobados",  value: aprobados,  color: "#3b82f6" },
    { name: "Finalizados",value: finalizados, color: "#10b981" },
    { name: "Rechazados", value: eventRequests.filter(e => e.estado === "Rechazado").length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // --- TIMELINE: PRÓXIMOS 5 EVENTOS PERSONALES ---
  // Solo eventos del solicitante, ordenados por fecha ascendente.
  const proximosEventos = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Pendiente")
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 5);

  return (
    <div className="saas-dashboard-container fade-in">
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Mis Solicitudes</span>
            <div className="card-icon-container bg-primary-light">
              <FiFileText className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{totalSolicitudes}</h3>
            <span className="card-trend text-green">
              <FiArrowUpRight /> Activas
            </span>
          </div>
        </div>

        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">En Proceso de Revisión</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{pendientes}</h3>
            <span className="card-trend text-orange">Esperando aprobación</span>
          </div>
        </div>

        <div className="saas-stat-card success-glow">
          <div className="card-top">
            <span className="card-label">Aprobadas / Finalizadas</span>
            <div className="card-icon-container bg-success-light">
              <FiCheckCircle className="card-icon text-success" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{aprobados + finalizados}</h3>
            <span className="card-trend text-green">Confirmadas</span>
          </div>
        </div>
      </div>

      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr' }}>
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Estado de Mis Solicitudes</h4>
              <p>Resumen de aprobación</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando información...</p>
              </div>
            ) : statusData.length === 0 ? (
              <div className="no-data-placeholder">Aún no has creado ninguna solicitud</div>
            ) : (
              <div className="donut-chart-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    {(() => {
                      let accumulatedPercentage = 0;
                      return statusData.map((item, idx) => {
                        const percentage = item.value / totalSolicitudes;
                        const strokeDash = `${percentage * 251.2} 251.2`;
                        const strokeOffset = 251.2 - (accumulatedPercentage * 251.2) + 62.8;
                        accumulatedPercentage += percentage;
                        
                        return (
                          <circle 
                            key={idx}
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="transparent" 
                            stroke={item.color} 
                            strokeWidth="12" 
                            strokeDasharray={strokeDash}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1 }}>{totalSolicitudes}</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
                  </div>
                </div>
                
                <div className="donut-legend" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 12px', width: '100%', justifyContent: 'center' }}>
                  {statusData.map((item, index) => (
                    <div key={index} className="donut-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="dot" style={{ backgroundColor: item.color, width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span className="name" style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-double-panel">
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiCalendar className="panel-icon" />
            <div>
              <h4>Próximos Eventos en Agenda</h4>
              <p>Agenda personal</p>
            </div>
          </div>
          <div className="panel-body">
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Buscando eventos en agenda...</p>
              </div>
            ) : proximosEventos.length === 0 ? (
              <div className="empty-panel-state">
                <FiActivity className="icon" />
                <p>No tienes eventos activos programados.</p>
              </div>
            ) : (
              <div className="modern-upcoming-events-list">
                {proximosEventos.map((evt) => {
                  return (
                    <div key={evt.id_evento} className="modern-event-card" onClick={() => openModal(evt)}>
                      <div className="modern-event-header">
                        <div className="modern-event-date">
                          <FiCalendar className="modern-date-icon" />
                          <span>{formatFechaLarga(evt.fecha_inicio)}</span>
                          {evt.hora_inicio && (
                            <>
                              <span className="modern-date-separator">•</span>
                              <FiClock className="modern-date-icon" />
                              <span>{evt.hora_inicio}</span>
                            </>
                          )}
                        </div>
                        <span className={`modern-status-badge modern-status-${evt.estado?.toLowerCase() || 'pendiente'}`}>
                          {evt.estado || 'Pendiente'}
                        </span>
                      </div>
                      
                      <div className="modern-event-body">
                        <h5 className="modern-event-title">{evt.nombre}</h5>
                        <div className="modern-event-meta-info">
                          <div className="modern-meta-item">
                            <FiGrid className="modern-meta-icon" />
                            <span>{evt.recinto || "UAPA Virtual"}</span>
                          </div>
                          <div className="modern-meta-item">
                            <FiMonitor className="modern-meta-icon" />
                            <span>{evt.modalidad || "Presencial"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="modern-event-footer">
                        <button className="modern-view-btn" title="Ver detalles del evento">
                          <span>Ver Ficha Técnica</span>
                          <FiArrowUpRight className="modern-btn-icon" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="saas-panel-card">
          <div className="panel-header">
            <FiGrid className="panel-icon" />
            <div>
              <h4>Acciones Rápidas</h4>
              <p>Gestiones de usuario</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            <div className="quick-actions-list">
              <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("Eventos")}>
                <div className="icon-wrapper"><FiPlus /></div>
                <div className="btn-text">
                  <strong>Crear Evento</strong>
                  <span>Nueva solicitud de evento</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("Audiovisual")}>
                <div className="icon-wrapper"><FiMonitor /></div>
                <div className="btn-text">
                  <strong>Solicitud AV</strong>
                  <span>Reserva de equipos</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-green" onClick={() => setActiveTab && setActiveTab("Soporte")}>
                <div className="icon-wrapper"><FiStar /></div>
                <div className="btn-text">
                  <strong>Soporte</strong>
                  <span>Ayuda técnica</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedRequest && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica de Mi Solicitud</h3>
                <span className="modal-subtitle">Resumen de tu solicitud y logística</span>
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
                    <span className="info-label">Fechas</span>
                    <span className="info-value">
                      {formatFecha(selectedRequest.fecha_inicio)}
                      {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
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

                {/* Columna 3: Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiStar size={14} /> Estado
                  </div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado de la Solicitud</span>
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado || "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DashboardSolicitante;
