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
import { FiCheckCircle, FiClock, FiFileText, FiCalendar, FiArrowUpRight, FiPlus, FiGrid, FiActivity, FiStar, FiMonitor, FiEye, FiRefreshCw, FiList } from "react-icons/fi";

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
  const [sortFecha, setSortFecha]             = useState("asc");  // Orden por fecha: asc | desc
  const [sortId, setSortId]                   = useState("");     // Orden por ID: asc | desc | "" (sin orden por ID)

  // --- ESTADOS DEL TRACKING ---
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData]           = useState(null);
  const [trackingLoading, setTrackingLoading]     = useState(false);

  // --- FUNCIONES: openModal / closeModal ---
  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // --- FUNCIONES: abrirTracking / cerrarTracking ---
  const abrirTracking = async (req) => {
    setTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const res = await fetch(`${API}/api/aprobaciones-evento/${req.id_evento}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      } else {
        setTrackingData({ error: "No se encontró tracking de validaciones" });
      }
    } catch (error) {
      console.error("Error al cargar tracking", error);
      setTrackingData({ error: "Error de conexión con el servidor" });
    } finally {
      setTrackingLoading(false);
    }
  };

  const cerrarTracking = () => {
    setTrackingModalOpen(false);
    setTrackingData(null);
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

  // --- DATOS DE LA GRÁFICA DE BARRAS: Solicitudes por Tipo de Evento ---
  const tipoColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316"];
  const tiposMap = {};
  eventRequests.forEach(e => {
    const tipo = e.tipo_evento || "Sin clasificar";
    tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
  });
  const tiposData = Object.entries(tiposMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value, color: tipoColors[i % tipoColors.length] }));

  // --- TIMELINE: PRÓXIMOS 5 EVENTOS PERSONALES ---
  // Filtro por estado activo + id_usuario del solicitante.
  // Si se selecciona orden por ID, tiene prioridad sobre el de fecha.
  const proximosEventos = eventRequests
    .filter(e =>
      (e.estado === "Aprobado" || e.estado === "En Progreso" || e.estado === "Pendiente") &&
      String(e.id_usuario) === String(usuario?.id_usuario)
    )
    .sort((a, b) => {
      if (sortId === "asc")  return Number(a.id_evento) - Number(b.id_evento);
      if (sortId === "desc") return Number(b.id_evento) - Number(a.id_evento);
      // Sin orden por ID: ordenar por fecha
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

      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* ── GRÁFICA 1: DONUT DE ESTADO ── */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Estado de Mis Solicitudes</h4>
              <p>Distribución por estado de aprobación</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '270px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando información...</p>
              </div>
            ) : statusData.length === 0 ? (
              <div className="no-data-placeholder">Aún no has creado ninguna solicitud</div>
            ) : (
              <div className="donut-chart-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
                {/* Donut SVG — 18% más grande: 142px, aro de 16 */}
                <div style={{ position: 'relative', width: '142px', height: '142px', flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="16" />
                    {(() => {
                      const circum = 2 * Math.PI * 38; // ≈ 238.76
                      let accumulated = 0;
                      return statusData.map((item, idx) => {
                        const pct = item.value / totalSolicitudes;
                        const dash = `${pct * circum} ${circum}`;
                        const offset = circum - accumulated * circum + circum / 4;
                        accumulated += pct;
                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="38"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="16"
                            strokeDasharray={dash}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                            style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1 }}>{totalSolicitudes}</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total</span>
                  </div>
                </div>

                {/* Leyenda moderna estilo pill */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                  {statusData.map((item, index) => {
                    const pct = Math.round((item.value / totalSolicitudes) * 100);
                    return (
                      <div key={index} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 10px', borderRadius: '20px',
                        backgroundColor: `${item.color}15`,
                        border: `1px solid ${item.color}40`
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>{item.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: item.color }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GRÁFICA 2: DONUT DE TIPOS DE EVENTO ── */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Solicitudes por Tipo de Evento</h4>
              <p>Distribución de categorías</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '270px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando información...</p>
              </div>
            ) : tiposData.length === 0 ? (
              <div className="no-data-placeholder">Aún no has creado ninguna solicitud</div>
            ) : (
              <div className="donut-chart-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
                {/* Donut SVG — mismo tamaño y grosor que el primero */}
                <div style={{ position: 'relative', width: '142px', height: '142px', flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="16" />
                    {(() => {
                      const circum = 2 * Math.PI * 38;
                      const totalTipos = tiposData.reduce((s, t) => s + t.value, 0);
                      let accumulated = 0;
                      return tiposData.map((item, idx) => {
                        const pct = item.value / totalTipos;
                        const dash = `${pct * circum} ${circum}`;
                        const offset = circum - accumulated * circum + circum / 4;
                        accumulated += pct;
                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="38"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="16"
                            strokeDasharray={dash}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                            style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1 }}>{tiposData.reduce((s, t) => s + t.value, 0)}</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Eventos</span>
                  </div>
                </div>

                {/* Leyenda moderna estilo pill */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                  {tiposData.map((item, index) => {
                    const totalTipos = tiposData.reduce((s, t) => s + t.value, 0);
                    const pct = Math.round((item.value / totalTipos) * 100);
                    return (
                      <div key={index} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 10px', borderRadius: '20px',
                        backgroundColor: `${item.color}15`,
                        border: `1px solid ${item.color}40`,
                        maxWidth: '160px'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: item.color, flexShrink: 0 }}>{pct}%</span>
                      </div>
                    );
                  })}
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
                <h4>Próximos Eventos en Agenda</h4>
                <p>Eventos aprobados y pendientes programados próximamente</p>
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
                aria-label="Actualizar estado de solicitudes"
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
                      
                      <div className="modern-event-footer" style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="modern-view-btn" title="Ver detalles del evento" aria-label="Ver ficha de mi solicitud" onClick={(e) => { e.stopPropagation(); openModal(evt); }}>
                          <span>Ficha Técnica</span>
                          <FiArrowUpRight className="modern-btn-icon" />
                        </button>
                        <button type="button" className="modern-view-btn" style={{ background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe' }} title="Ver seguimiento de aprobación" onClick={(e) => { e.stopPropagation(); abrirTracking(evt); }}>
                          <span>Seguimiento</span>
                          <FiActivity className="modern-btn-icon" />
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
              <div className="quick-action-btn premium-btn-green" onClick={() => setActiveTab && setActiveTab("HistorialSolicitudes")}>
                <div className="icon-wrapper"><FiList /></div>
                <div className="btn-text">
                  <strong>Mi Historial</strong>
                  <span>Ver mis solicitudes</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Evaluacion")}>
                <div className="icon-wrapper"><FiStar /></div>
                <div className="btn-text">
                  <strong>Evaluar Servicio</strong>
                  <span>Calificar eventos</span>
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
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' || selectedRequest.estado === 'Finalizado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : selectedRequest.estado === 'En Progreso' ? 'badge-blue' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
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
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-primary" onClick={() => abrirTracking(selectedRequest)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiActivity /> Ver Seguimiento
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal} aria-label="Cerrar modal">Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL DE TRACKING DE APROBACIONES --- */}
      {trackingModalOpen && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={cerrarTracking} style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '700px', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', padding: '24px 32px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiActivity size={24} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Seguimiento de Aprobaciones</h3>
                  <span className="modal-subtitle" style={{ fontSize: '14px', color: '#64748b' }}>Estado de revisión por área operativa</span>
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '32px', backgroundColor: '#fcfcfd' }}>
              {trackingLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <div className="loader" style={{ marginBottom: '16px' }}></div>
                  <p style={{ color: '#64748b', fontWeight: 500 }}>Analizando flujo de validación...</p>
                </div>
              ) : trackingData?.error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <FiCheckCircle size={32} />
                  </div>
                  <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>{trackingData.error}</h4>
                </div>
              ) : (
                <>
                  {/* Banner de Estado General */}
                  <div style={{ padding: '20px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', border: `2px solid ${trackingData?.puede_iniciar ? '#10b981' : trackingData?.hay_rechazos ? '#ef4444' : '#f59e0b'}`, backgroundColor: trackingData?.puede_iniciar ? '#ecfdf5' : trackingData?.hay_rechazos ? '#fef2f2' : '#fffbeb' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: trackingData?.puede_iniciar ? '#10b981' : trackingData?.hay_rechazos ? '#ef4444' : '#f59e0b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      {trackingData?.puede_iniciar ? <FiCheckCircle size={24} /> : trackingData?.hay_rechazos ? <FiCheckCircle size={24} /> : <FiClock size={24} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: trackingData?.puede_iniciar ? '#065f46' : trackingData?.hay_rechazos ? '#991b1b' : '#b45309' }}>
                        {trackingData?.puede_iniciar ? "¡Aprobado Completamente!" : trackingData?.hay_rechazos ? "Evento Rechazado" : "En Revisión Continua"}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: trackingData?.puede_iniciar ? '#047857' : trackingData?.hay_rechazos ? '#b91c1c' : '#d97706' }}>
                        {trackingData?.puede_iniciar ? "Todas las áreas han validado tu evento. Listo para iniciar." : trackingData?.hay_rechazos ? "Una o más áreas han declinado la solicitud." : "Tu evento aún se encuentra recorriendo el flujo de aprobación."}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Aprobaciones por Área */}
                  <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '16px' }}>Estado por Departamento</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {trackingData?.aprobaciones?.map((area, index) => {
                      let bg = '#f8fafc', border = '#e2e8f0', iconColor = '#94a3b8', badgeBg = '#f1f5f9', badgeText = '#475569', Icon = FiClock;
                      
                      if (!area.requerido) {
                        bg = '#f8fafc'; border = '#f1f5f9'; iconColor = '#cbd5e1'; badgeBg = '#f1f5f9'; badgeText = '#94a3b8'; Icon = FiCheckCircle;
                      } else if (area.estado === 'Aprobado' || area.estado === 'Completado') {
                        bg = '#fff'; border = '#10b981'; iconColor = '#10b981'; badgeBg = '#ecfdf5'; badgeText = '#059669'; Icon = FiCheckCircle;
                      } else if (area.estado === 'Rechazado') {
                        bg = '#fff'; border = '#ef4444'; iconColor = '#ef4444'; badgeBg = '#fef2f2'; badgeText = '#dc2626'; Icon = FiCheckCircle;
                      } else {
                        bg = '#fff'; border = '#f59e0b'; iconColor = '#f59e0b'; badgeBg = '#fffbeb'; badgeText = '#d97706'; Icon = FiClock;
                      }

                      return (
                        <div key={index} style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: `4px solid ${border}`, borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', backgroundColor: bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Icon size={20} color={iconColor} />
                            <span style={{ fontSize: '15px', fontWeight: 600, color: area.requerido ? '#0f172a' : '#94a3b8' }}>{area.area}</span>
                          </div>
                          <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, backgroundColor: badgeBg, color: badgeText }}>
                            {!area.requerido ? 'No requerido' : area.estado}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '20px 32px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={cerrarTracking}>Cerrar Tracking</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default DashboardSolicitante;
