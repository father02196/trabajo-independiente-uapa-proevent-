// ============================================================
// DASHBOARD RESPONSABLE - Panel Gerencial / Supervisión
// Pertenece a: Módulo de Inicio (ProEvent - Rol Responsable)
// Propósito: Vista de supervisión para el Responsable de área.
// Muestra: KPIs de eventos y equipo, progreso global del
// cronograma, próximos eventos, radar de tareas críticas y
// tabla detallada de todos los eventos activos del sistema.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  FiCheckCircle, FiClock, FiCalendar, FiActivity,
  FiList, FiAlertCircle, FiStar, FiMapPin, FiRefreshCw,
  FiArrowUpRight, FiGrid, FiMonitor, FiUsers, FiTrendingUp,
  FiZap
} from "react-icons/fi";

import './../../css/Dashboard.css';

const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: DashboardResponsable
// Recibe:
//   - usuario: objeto del usuario Responsable logueado
//   - setActiveTab: navega entre pestañas del layout
// ============================================================
function DashboardResponsable({ usuario, setActiveTab }) {

  // --- ESTADOS ---
  const [eventos, setEventos]         = useState([]);  // Todos los eventos del sistema
  const [tareasEquipo, setTareasEquipo] = useState([]); // Tareas globales del cronograma
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [sortOrder, setSortOrder]     = useState("asc"); // Orden del timeline de eventos
  const [activeEventsSortOrder, setActiveEventsSortOrder] = useState("desc"); // Orden tabla eventos activos

  // --- ESTADOS DEL MODAL DE EVENTO ---
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);

  // --- ABRIR / CERRAR MODAL ---
  const openModal = (evt) => { setSelectedRequest(evt); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedRequest(null); };

  // --- FUNCIÓN: cargarDatos ---
  const cargarDatos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      // 1. Todos los eventos del sistema
      const resEventos = await fetch(`${API}/eventos`);
      const dataEventos = await resEventos.json();
      if (Array.isArray(dataEventos)) setEventos(dataEventos);

      // 2. Tareas globales del cronograma (visibilidad de supervisión)
      try {
        const resTareas = await fetch(`${API}/cronograma`);
        const dataTareas = await resTareas.json();
        if (Array.isArray(dataTareas)) setTareasEquipo(dataTareas);
      } catch (_) {
        // Si el endpoint global no existe, dejamos tareasEquipo vacío
        setTareasEquipo([]);
      }
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- FUNCIONES UTILITARIAS ---
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  const getDiasRestantes = (fechaStr) => {
    if (!fechaStr) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    fecha.setHours(0, 0, 0, 0);
    return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyClass = (dias) => {
    if (dias === null) return "";
    if (dias < 0)  return "overdue";
    if (dias === 0) return "urgent";
    if (dias <= 2) return "warning";
    return "normal";
  };

  const getUrgencyLabel = (dias) => {
    if (dias === null) return "";
    if (dias < 0)  return `Vencida hace ${Math.abs(dias)}d`;
    if (dias === 0) return "¡Hoy!";
    if (dias === 1) return "Mañana";
    return `${dias} días`;
  };

  // --- CÁLCULOS: EVENTOS ---
  const eventosAprobados  = eventos.filter(e => e.estado === "Aprobado").length;
  const eventosActivosBase = eventos.filter(e => e.estado === "Aprobado" || e.estado === "Pendiente");

  const proximosEventos = [...eventosActivosBase]
    .sort((a, b) => {
      const dateA = new Date(a.fecha_inicio);
      const dateB = new Date(b.fecha_inicio);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    })
    .slice(0, 5);

  const eventosActivos = [...eventosActivosBase]
    .sort((a, b) => {
      const dateA = new Date(a.fecha_inicio || 0);
      const dateB = new Date(b.fecha_inicio || 0);
      return activeEventsSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // --- CÁLCULOS: TAREAS DEL EQUIPO ---
  const totalTareas       = tareasEquipo.length;
  const tareasCompletadas = tareasEquipo.filter(t => t.estado === "Completada").length;
  const tareasPendientes  = tareasEquipo.filter(t => t.estado !== "Completada").length;
  const tareasVencidas    = tareasEquipo.filter(t => {
    if (t.estado === "Completada") return false;
    return getDiasRestantes(t.fecha_cumplimiento) < 0;
  }).length;

  const pctProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  // Tareas críticas (vencidas o urgentes), ordenadas por fecha
  const tareasCriticas = tareasEquipo
    .filter(t => {
      if (t.estado === "Completada") return false;
      const dias = getDiasRestantes(t.fecha_cumplimiento);
      return dias !== null && dias <= 2;
    })
    .sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento))
    .slice(0, 5);

  // Texto del banner de bienvenida
  const mensajeBanner = (() => {
    const parts = [];
    if (eventosAprobados > 0) parts.push(`${eventosAprobados} evento${eventosAprobados !== 1 ? 's' : ''} aprobado${eventosAprobados !== 1 ? 's' : ''} activo${eventosAprobados !== 1 ? 's' : ''}`);
    if (tareasVencidas > 0) parts.push(`${tareasVencidas} tarea${tareasVencidas !== 1 ? 's' : ''} vencida${tareasVencidas !== 1 ? 's' : ''} en el equipo`);
    return parts.length > 0 ? `Supervisando: ${parts.join(' · ')}.` : 'Todo en orden. Sin alertas críticas en este momento.';
  })();

  if (loading) {
    return (
      <div className="saas-dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ marginBottom: '16px' }}></div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Cargando panel de supervisión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-dashboard-container fade-in">

      {/* ── BANNER DE BIENVENIDA ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Panel de Supervisión · Responsable de Área
          </p>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
            ¡Bienvenido, {usuario?.nombre?.split(' ')[0] || 'Responsable'}! 🎯
          </h2>
          <p style={{ marginTop: '6px', opacity: 0.85, fontSize: '14px' }}>
            {mensajeBanner}
            {tareasVencidas > 0 && (
              <span style={{ color: '#fca5a5', marginLeft: '8px' }}>
                ⚠️ Requieren atención inmediata
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => cargarDatos()}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
          aria-label="Actualizar datos del panel"
        >
          <FiRefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* ── 4 TARJETAS KPI HÍBRIDAS ── */}
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>

        {/* Eventos Aprobados */}
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Eventos Aprobados</span>
            <div className="card-icon-container bg-primary-light">
              <FiCalendar className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{eventosAprobados}</h3>
            <span className="card-trend text-green">
              <FiArrowUpRight /> Activos en sistema
            </span>
          </div>
        </div>

        {/* Total tareas equipo */}
        <div className="saas-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="card-top">
            <span className="card-label">Tareas del Equipo</span>
            <div className="card-icon-container" style={{ background: '#f5f3ff' }}>
              <FiUsers className="card-icon" style={{ color: '#8b5cf6' }} />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{totalTareas}</h3>
            <span className="card-trend" style={{ color: '#64748b' }}>Asignadas en cronograma</span>
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Pendientes del Equipo</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{tareasPendientes}</h3>
            <span className="card-trend text-orange">En ejecución</span>
          </div>
        </div>

        {/* Tareas vencidas */}
        <div className="saas-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-top">
            <span className="card-label">Tareas Vencidas</span>
            <div className="card-icon-container" style={{ background: '#fef2f2' }}>
              <FiAlertCircle className="card-icon" style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div className="card-bottom">
            <h3 style={{ color: tareasVencidas > 0 ? '#ef4444' : '#10b981' }}>{tareasVencidas}</h3>
            <span className="card-trend" style={{ color: tareasVencidas > 0 ? '#ef4444' : '#10b981' }}>
              {tareasVencidas > 0 ? 'Requieren acción' : 'Sin vencidas ✓'}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE PROGRESO GLOBAL DEL CRONOGRAMA ── */}
      {totalTareas > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTrendingUp style={{ color: '#0f766e' }} />
              <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Progreso Global del Cronograma</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>· Todas las tareas del equipo</span>
            </div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: pctProgreso === 100 ? '#10b981' : '#0f766e' }}>
              {pctProgreso}%
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pctProgreso}%`,
              background: pctProgreso === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #0f766e, #14b8a6)',
              borderRadius: '99px',
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {tareasCompletadas} de {totalTareas} tareas completadas por el equipo
          </p>
        </div>
      )}

      {/* ── PANEL DOBLE: EVENTOS PRÓXIMOS + PANEL DERECHO ── */}
      <div className="dashboard-double-panel" style={{ marginBottom: '24px' }}>

        {/* Panel izquierdo: Próximos Eventos (estética modern-event-card) */}
        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FiCalendar className="panel-icon" />
              <div>
                <h4>Eventos Próximos (Global)</h4>
                <p>Agenda general de los próximos días</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="saas-select"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#475569', backgroundColor: '#fff', cursor: 'pointer', outline: 'none' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Más próximos (Asc)</option>
                <option value="desc">Más lejanos (Desc)</option>
              </select>
              <button type="button" className="reload-data-btn" onClick={() => cargarDatos()} title="Actualizar datos" aria-label="Actualizar agenda de eventos"><FiRefreshCw /></button>
            </div>
          </div>
          <div className="panel-body">
            {proximosEventos.length === 0 ? (
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
                      <button type="button" className="modern-view-btn" title="Ver ficha técnica" aria-label="Ver ficha técnica del evento">
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

        {/* Panel derecho: Accesos rápidos + Radar de tareas críticas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Sub-panel: Accesos Rápidos */}
          <div className="saas-panel-card" style={{ flex: '0 0 auto' }}>
            <div className="panel-header">
              <FiZap className="panel-icon" style={{ color: '#0f766e' }} />
              <div>
                <h4>Accesos Rápidos</h4>
                <p>Atajos de gestión del Responsable</p>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              <div className="quick-actions-list">
                <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("Eventos")}>
                  <div className="icon-wrapper"><FiList /></div>
                  <div className="btn-text">
                    <strong>Crear Evento</strong>
                    <span>Nueva solicitud de evento</span>
                  </div>
                </div>
                <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("Audiovisual")}>
                  <div className="icon-wrapper"><FiMonitor /></div>
                  <div className="btn-text">
                    <strong>Solicitud AV</strong>
                    <span>Reserva de audiovisual</span>
                  </div>
                </div>
                <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                  <div className="icon-wrapper"><FiCalendar /></div>
                  <div className="btn-text">
                    <strong>Ver Agenda</strong>
                    <span>Calendario de actividades</span>
                  </div>
                </div>
                <div
                  className="quick-action-btn"
                  style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)', cursor: 'pointer', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(15,118,110,0.25)' }}
                  onClick={() => setActiveTab && setActiveTab("VisualizarEvaluaciones")}
                >
                  <div className="icon-wrapper" style={{ color: 'white' }}><FiStar /></div>
                  <div className="btn-text">
                    <strong style={{ color: 'white' }}>Historial Evaluaciones</strong>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Resultados de eventos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-panel: Radar de Tareas Críticas */}
          <div className="saas-panel-card" style={{ flex: '1 1 auto' }}>
            <div className="panel-header">
              <FiAlertCircle className="panel-icon" style={{ color: '#ef4444' }} />
              <div>
                <h4>Radar de Tareas Críticas</h4>
                <p>{tareasCriticas.length > 0 ? `${tareasCriticas.length} tarea(s) urgentes o vencidas` : 'Sin alertas críticas'}</p>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              {tareasCriticas.length === 0 ? (
                <div className="empty-panel-state">
                  <FiCheckCircle className="icon" style={{ color: '#10b981' }} />
                  <p style={{ color: '#10b981', fontWeight: '600' }}>¡El equipo está al día! Sin tareas críticas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tareasCriticas.map(t => {
                    const dias = getDiasRestantes(t.fecha_cumplimiento);
                    const urgClass = getUrgencyClass(dias);
                    const urgLabel = getUrgencyLabel(dias);
                    return (
                      <div key={t.id_actividad} style={{
                        background: urgClass === 'overdue' ? '#fef2f2' : urgClass === 'urgent' ? '#fffbeb' : '#fff7ed',
                        border: `1px solid ${urgClass === 'overdue' ? '#fca5a5' : urgClass === 'urgent' ? '#fcd34d' : '#fed7aa'}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.nombre_actividad}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{t.nombre_evento}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                              background: urgClass === 'overdue' ? '#fca5a5' : urgClass === 'urgent' ? '#fcd34d' : '#fed7aa',
                              color: urgClass === 'overdue' ? '#991b1b' : urgClass === 'urgent' ? '#92400e' : '#c2410c'
                            }}>
                              {urgLabel}
                            </span>
                          </div>
                        </div>
                        <FiAlertCircle style={{ color: urgClass === 'overdue' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} size={16} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLA DETALLADA: TODOS LOS EVENTOS ACTIVOS ── */}
      <div className="saas-panel-card">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <FiActivity className="panel-icon" style={{ color: '#2563eb' }} />
            <div>
              <h4>Todos los Eventos Activos del Sistema</h4>
              <p>Vista detallada para supervisión · {eventosActivos.length} evento{eventosActivos.length !== 1 ? 's' : ''} activo{eventosActivos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px' }}>
              <FiCalendar style={{ color: '#64748b', marginRight: '8px' }} />
              <select
                className="saas-select"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                value={activeEventsSortOrder}
                onChange={(e) => setActiveEventsSortOrder(e.target.value)}
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Menos recientes primero</option>
              </select>
            </div>
          </div>
        </div>
        <div className="panel-body" style={{ padding: '0' }}>
          {eventosActivos.length === 0 ? (
            <div className="empty-panel-state" style={{ padding: '40px' }}>
              <FiCalendar className="icon" />
              <p>No hay eventos activos en este momento.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Evento', 'Fecha Inicio', 'Recinto', 'Modalidad', 'Asistentes', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventosActivos.map((evt, idx) => (
                    <tr
                      key={evt.id_evento}
                      style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                      onClick={() => openModal(evt)}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>
                            #{evt.id_evento} · {evt.nombre}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{evt.tipo_evento || 'General'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiCalendar size={12} style={{ color: '#94a3b8' }} />
                          {formatFecha(evt.fecha_inicio)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiMapPin size={12} style={{ color: '#94a3b8' }} />
                          {evt.recinto || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '600' }}>
                          {evt.modalidad || 'Presencial'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiUsers size={12} style={{ color: '#94a3b8' }} />
                          {evt.cantidad_asistentes ? `${evt.cantidad_asistentes} pers.` : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`status-pill ${evt.estado === 'Aprobado' ? 'approved' : 'pending'}`}>
                          {evt.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL FICHA TÉCNICA (portal a body) ── */}
      {isModalOpen && selectedRequest && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica del Evento</h3>
                <span className="modal-subtitle">Revisión general de la solicitud y logística</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#EVT-{selectedRequest.id_evento}</span>
            </div>

            <div className="modal-body">
              <div className="modal-grid-3">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCalendar size={14} /> Información General
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nombre del Evento</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>{selectedRequest.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tipo</span>
                    <span className="info-value">{selectedRequest.tipo_evento || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha Inicio</span>
                    <span className="info-value">{formatFecha(selectedRequest.fecha_inicio)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha Fin</span>
                    <span className="info-value">{formatFecha(selectedRequest.fecha_fin)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Horario</span>
                    <span className="info-value">{selectedRequest.hora_inicio?.substring(0,5) || '—'} – {selectedRequest.hora_fin?.substring(0,5) || '—'}</span>
                  </div>
                </div>

                {/* Columna 2: Logística */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiMapPin size={14} /> Logística y Asistencia
                  </div>
                  <div className="info-row">
                    <span className="info-label">Recinto</span>
                    <span className="info-value">{selectedRequest.recinto || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Modalidad</span>
                    <span className="info-value">{selectedRequest.modalidad || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Asistentes</span>
                    <span className="info-value">{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Audiovisual</span>
                    <span className="info-value">{selectedRequest.necesita_audiovisual ? '✅ Requiere AV' : '❌ Sin AV'}</span>
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
                      {selectedRequest.estado || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal} aria-label="Cerrar ficha técnica">Cerrar Ficha Técnica</button>
              <button type="button" className="btn btn-primary" onClick={() => { closeModal(); setActiveTab && setActiveTab("Calendario"); }} aria-label="Ver evento en el calendario">
                <FiCalendar style={{ marginRight: '6px' }} /> Ver en Calendario
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DashboardResponsable;
