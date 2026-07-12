// ============================================================
// DASHBOARD ESPECIALISTA - Panel para Especialistas de Área
// Pertenece a: Módulo de Inicio (ProEvent - Roles técnicos)
// Propósito: Dashboard para roles técnicos: Especialistas,
// Responsables de Área Audiovisual, etc. Muestra eventos
// globales del sistema, con filtro especial para Administradores
// de Audiovisual (solo eventos que necesitan equipo AV).
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

// Iconos de Feather Icons para paneles y accesos rápidos
import { FiCheckCircle, FiClock, FiFileText, FiCalendar, FiArrowUpRight, FiGrid, FiActivity, FiEye, FiList, FiStar, FiMonitor, FiRefreshCw } from "react-icons/fi";

// Estilos compartidos del dashboard
import './../../css/Dashboard.css';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: DashboardAdminEventos
// Recibe:
//   - usuario: objeto del usuario especialista logueado
//   - onEditEvent: callback para editar un evento
//   - setActiveTab: navega entre pestañas del layout
// ============================================================
function DashboardAdminEventos({ usuario, onEditEvent, setActiveTab }) {

  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]); // Todos los eventos del sistema
  const [loading, setLoading]             = useState(true); // Spinner de carga
  const [error, setError]                 = useState("");   // Mensaje de error
  const [sortFecha, setSortFecha]         = useState("asc");  // Orden por fecha: asc | desc
  const [sortId, setSortId]               = useState("");     // Orden por ID: asc | desc | "" (sin orden por ID)

  // --- ESTADOS DEL MODAL ---
  const [selectedRequest, setSelectedRequest] = useState(null); // Evento activo en el modal
  const [isModalOpen, setIsModalOpen]         = useState(false); // Visibilidad del modal

  // --- DETECCIÓN DE ROL AV ---
  // Los Administradores de Audiovisual tienen una vista filtrada:
  // solo ven los eventos que requieren equipos audiovisuales.
  const isAudioVisualAdmin = usuario?.rol === "Administrador de Audiovisual" || usuario?.rol === "Responsable de área audiovisual";

  // --- FUNCIONES: openModal / closeModal ---
  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // --- EFECTO: Carga al montar o al cambiar el usuario ---
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // --- FUNCIÓN: cargarDatos ---
  // Carga todos los eventos del sistema.
  // Los especialistas tienen visibilidad global (no filtran por usuario).
  // El filtro por necesita_audiovisual se aplica en frontend para el rol AV.
  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      // Especialistas ven todas las solicitudes del sistema
      const eventUrl = `${API}/eventos`;
      const resEvents = await fetch(eventUrl).then(r => r.json());
      if (Array.isArray(resEvents)) setEventRequests(resEvents);
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- FUNCIONES UTILITARIAS ---
  // formatFecha: fecha ISO a formato corto con corrección de timezone
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
  };

  // formatFechaLarga: fecha ISO a formato largo para las tarjetas de eventos
  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // getStatusClass: clase CSS según el estado del evento
  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente":  return "pending";  // Amarillo
      case "Aprobado":   return "approved"; // Verde
      case "Rechazado":  return "rejected"; // Rojo
      case "Finalizado": return "approved"; // Verde
      default: return "pending";
    }
  };

  // --- FILTRO DE SOLICITUDES RELEVANTES ---
  // Si el usuario es Administrador de Audiovisual, solo ve eventos
  // que marcaron necesita_audiovisual=1 en su solicitud.
  // Otros especialistas ven todo el listado global.
  const solicitudesRelevantes = isAudioVisualAdmin 
    ? eventRequests.filter(e => e.necesita_audiovisual === 1)
    : eventRequests;

  // --- CÁLCULOS ESTADÍSTICOS (sobre solicitudes relevantes) ---
  const totalSolicitudes = solicitudesRelevantes.length;
  const pendientes  = solicitudesRelevantes.filter((e) => e.estado === "Pendiente").length;
  const aprobados   = solicitudesRelevantes.filter((e) => e.estado === "Aprobado").length;
  const finalizados = solicitudesRelevantes.filter((e) => e.estado === "Finalizado").length;

  // --- DATOS DEL GRÁFICO DONUT ---
  const statusData = [
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Aprobados",  value: aprobados,  color: "#3b82f6" },
    { name: "Finalizados",value: finalizados, color: "#10b981" },
    { name: "Rechazados", value: solicitudesRelevantes.filter(e => e.estado === "Rechazado").length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // --- TIMELINE: PRÓXIMOS 5 EVENTOS ACTIVOS ---
  const proximosEventos = solicitudesRelevantes
    .filter(e => e.estado === "Aprobado" || e.estado === "Pendiente")
    .sort((a, b) => {
      if (sortId === "asc")  return Number(a.id_evento) - Number(b.id_evento);
      if (sortId === "desc") return Number(b.id_evento) - Number(a.id_evento);
      return sortFecha === "asc"
        ? new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
        : new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
    })
    .slice(0, 5);

  return (
    <div className="saas-dashboard-container fade-in">
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Total Solicitudes Globales</span>
            <div className="card-icon-container bg-primary-light">
              <FiFileText className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{totalSolicitudes}</h3>
            <span className="card-trend text-green">
              <FiArrowUpRight /> En el sistema
            </span>
          </div>
        </div>

        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Pendientes por Revisar</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{pendientes}</h3>
            <span className="card-trend text-orange">Revisión requerida</span>
          </div>
        </div>

        <div className="saas-stat-card success-glow">
          <div className="card-top">
            <span className="card-label">Eventos Confirmados</span>
            <div className="card-icon-container bg-success-light">
              <FiCheckCircle className="card-icon text-success" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{aprobados + finalizados}</h3>
            <span className="card-trend text-green">Aprobados / Finalizados</span>
          </div>
        </div>
      </div>

      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr' }}>
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Estado General de Solicitudes</h4>
              <p>Volumen de solicitudes asignadas a tu departamento</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando información...</p>
              </div>
            ) : statusData.length === 0 ? (
              <div className="no-data-placeholder">No hay solicitudes registradas</div>
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
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FiCalendar className="panel-icon" />
              <div>
                <h4>Eventos Próximos (Global)</h4>
                <p>Agenda general de los próximos días</p>
              </div>
            </div>

            {/* ── CONTROLES DE ORDEN ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px' }}>

              {/* Selector: Orden por Fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }} />
                <select
                  id="sort-fecha-agenda"
                  value={sortFecha}
                  onChange={e => { setSortFecha(e.target.value); setSortId(""); }}
                  style={{
                    border: 'none', background: 'transparent', fontSize: '12px',
                    fontWeight: '600', color: sortId === "" ? '#3b82f6' : '#64748b',
                    cursor: 'pointer', outline: 'none', padding: '3px 2px'
                  }}
                  aria-label="Ordenar por fecha"
                >
                  <option value="asc">Fecha ↑</option>
                  <option value="desc">Fecha ↓</option>
                </select>
              </div>

              {/* Divisor */}
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0', display: 'inline-block' }} />

              {/* Selector: Orden por ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>#</span>
                <select
                  id="sort-id-agenda"
                  value={sortId}
                  onChange={e => setSortId(e.target.value)}
                  style={{
                    border: 'none', background: 'transparent', fontSize: '12px',
                    fontWeight: '600', color: sortId !== "" ? '#3b82f6' : '#64748b',
                    cursor: 'pointer', outline: 'none', padding: '3px 2px'
                  }}
                  aria-label="Ordenar por ID"
                >
                  <option value="">ID —</option>
                  <option value="asc">ID ↑</option>
                  <option value="desc">ID ↓</option>
                </select>
              </div>

              {/* Divisor */}
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0', display: 'inline-block' }} />

              {/* Botón actualizar */}
              <button
                type="button"
                className="reload-data-btn"
                onClick={() => cargarDatos()}
                title="Actualizar datos"
                aria-label="Actualizar datos del panel"
                style={{ marginLeft: '2px' }}
              >
                <FiRefreshCw />
              </button>
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
                <p>No hay eventos activos programados.</p>
              </div>
            ) : (
              <div className="modern-upcoming-events-list">
                {proximosEventos.map((evt) => (
                  <div key={evt.id_evento} className="modern-event-card" onClick={() => openModal(evt)}>
                    <div className="modern-event-header">
                      <div className="modern-event-date">
                        <FiCalendar className="modern-date-icon" />
                        <span>{formatFechaLarga(evt.fecha_inicio)}</span>
                        {evt.hora_inicio && (
                          <>
                            <span className="modern-date-separator">•</span>
                            <FiClock className="modern-date-icon" />
                            <span>{evt.hora_inicio?.substring(0, 5)}</span>
                          </>
                        )}
                      </div>
                      <span className={`modern-status-badge modern-status-${evt.estado?.toLowerCase() || 'pendiente'}`}>
                        {evt.estado || 'Pendiente'}
                      </span>
                    </div>

                    <div className="modern-event-body">
                      <h5 className="modern-event-title">
                        <span style={{ color: '#94a3b8', fontSize: '13px', marginRight: '8px', fontWeight: '800' }}>#EVT-{evt.id_evento}</span>
                        {evt.nombre}
                      </h5>
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
                      <button type="button" className="modern-view-btn" title="Ver detalles del evento" aria-label="Ver detalles del evento">
                        <span>Ver Ficha Técnica</span>
                        <FiArrowUpRight className="modern-btn-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="saas-panel-card">
          <div className="panel-header">
            <FiGrid className="panel-icon" />
            <div>
              <h4>Accesos Rápidos Especialista</h4>
              <p>Atajos operativos</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            <div className="quick-actions-list">
              <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("GestionEventos")}>
                <div className="icon-wrapper"><FiList /></div>
                <div className="btn-text">
                  <strong>Gestionar Solicitudes</strong>
                  <span>Revisar y aprobar peticiones</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("AdminEvento")}>
                <div className="icon-wrapper"><FiGrid /></div>
                <div className="btn-text">
                  <strong>Catálogos de Eventos</strong>
                  <span>Tipos, recintos y más</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                <div className="icon-wrapper"><FiCalendar /></div>
                <div className="btn-text">
                  <strong>Ver Agenda</strong>
                  <span>Calendario de actividades</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-green" onClick={() => setActiveTab && setActiveTab("VisualizarEvaluaciones")}>
                <div className="icon-wrapper"><FiStar /></div>
                <div className="btn-text">
                  <strong>Historial de Evaluaciones</strong>
                  <span>Resultados de calificaciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedRequest && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={closeModal}>
          <div className="modal-content modal-premium" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiFileText className="text-primary" /> Ficha Técnica del Evento
                </h3>
                <span className="modal-subtitle" style={{ color: '#64748b', fontSize: '15px' }}>Revisión general de la solicitud y logística</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '15px', padding: '8px 16px', fontWeight: '700', letterSpacing: '0.5px' }}>#EVT-{selectedRequest.id_evento}</span>
            </div>

            <div className="modal-body" style={{ padding: '32px', flex: 1 }}>
              <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                {/* Columna 1: Info General */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFileText size={16} /> Información General
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Nombre del Evento</span>
                    <span className="info-value" style={{ display: 'block', color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>{selectedRequest.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Fechas</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>
                      {formatFecha(selectedRequest.fecha_inicio)}
                      {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                    </span>
                  </div>
                </div>

                {/* Columna 2: Logística y Asistencia */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiGrid size={16} /> Logística y Asistencia
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Recinto</span>
                    <span className="info-value" style={{ display: 'block', color: '#0f172a', fontSize: '15px', fontWeight: '500' }}>{selectedRequest.recinto || "—"}</span>
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Modalidad</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{selectedRequest.modalidad || "—"}</span>
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tipo de Evento</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{selectedRequest.tipo_evento || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Asistentes Esperados</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : "—"}</span>
                  </div>
                </div>

                {/* Columna 3: Estado */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiStar size={16} /> Estado
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Estado de la Solicitud</span>
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px' }}>
                      {selectedRequest.estado || "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '10px 24px', fontWeight: '600', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={closeModal} aria-label="Cerrar modal">
                Cerrar Ficha Técnica
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DashboardAdminEventos;
