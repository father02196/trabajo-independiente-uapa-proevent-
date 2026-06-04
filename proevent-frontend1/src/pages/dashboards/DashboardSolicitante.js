import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiCalendar, FiArrowUpRight, FiPlus, FiGrid, FiActivity, FiStar, FiMonitor, FiEye } from "react-icons/fi";
import './../../css/Dashboard.css';

const API = "http://localhost:8080";

function DashboardSolicitante({ usuario, onEditEvent, setActiveTab }) {
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (usuario?.id_usuario) {
      cargarDatos();
    }
  }, [usuario]);

  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const eventUrl = `${API}/eventos?usuario_id=${usuario.id_usuario}`;

      const resEvents = await fetch(eventUrl).then(r => r.json());

      if (Array.isArray(resEvents)) {
        setEventRequests(resEvents);
      }
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
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

  const totalSolicitudes = eventRequests.length;
  const pendientes = eventRequests.filter((e) => e.estado === "Pendiente").length;
  const aprobados = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const finalizados = eventRequests.filter((e) => e.estado === "Finalizado").length;

  const statusData = [
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Aprobados", value: aprobados, color: "#3b82f6" },
    { name: "Finalizados", value: finalizados, color: "#10b981" },
    { name: "Rechazados", value: eventRequests.filter(e => e.estado === "Rechazado").length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  const proximosEventos = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Pendiente")
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 5);

  return (
    <div className="saas-dashboard-container fade-in">
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="saas-stat-card primary-glow" onClick={() => setActiveTab && setActiveTab("Eventos")}>
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

        <div className="saas-stat-card warning-glow" onClick={() => setActiveTab && setActiveTab("Eventos")}>
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

        <div className="saas-stat-card success-glow" onClick={() => setActiveTab && setActiveTab("Eventos")}>
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
              <h4>Mis Próximos Eventos</h4>
              <p>Agenda personal</p>
            </div>
          </div>
          <div className="panel-body">
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Buscando eventos...</p>
              </div>
            ) : proximosEventos.length === 0 ? (
              <div className="empty-panel-state">
                <FiActivity className="icon" />
                <p>No tienes eventos activos programados.</p>
              </div>
            ) : (
              <div className="upcoming-events-list">
                {proximosEventos.map((evt) => {
                  const dateParts = formatFecha(evt.fecha_inicio).split(' ');
                  const day = dateParts[0] || '—';
                  const month = dateParts[1] || '—';
                  
                  return (
                    <div key={evt.id_evento} className="upcoming-event-item" onClick={() => openModal(evt)}>
                      <div className="event-date-badge">
                        <span className="day">{day}</span>
                        <span className="month">{month}</span>
                      </div>
                      <div className="event-item-details">
                        <h5>{evt.nombre}</h5>
                        <span className="venue">{evt.recinto || "UAPA Virtual"}</span>
                      </div>
                      <div className="event-item-meta">
                        <span className={`status-pill ${getStatusClass(evt.estado)}`}>
                          {evt.estado}
                        </span>
                        <button className="view-quick-btn" title="Ver Detalles">
                          <FiEye />
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

      {isModalOpen && selectedRequest && (
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

                {/* Columna 3: Finanzas y Estado */}
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
        </div>
      )}
    </div>
  );
}

export default DashboardSolicitante;
