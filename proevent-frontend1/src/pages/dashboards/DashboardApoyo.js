// ============================================================
// DASHBOARD PERSONAL DE APOYO
// Pertenece a: Módulo de Inicio (ProEvent - Rol Operativo)
// Propósito: Dashboard exclusivo para el Personal de Apoyo.
// Muestra: mis tareas asignadas del cronograma, eventos en los
// que participa, progreso de tareas y accesos rápidos operativos.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  FiCheckCircle, FiClock, FiCalendar, FiActivity,
  FiList, FiCheck, FiAlertCircle, FiStar,
  FiMapPin, FiUser, FiRefreshCw, FiEye, FiChevronRight
} from "react-icons/fi";

import './../../css/Dashboard.css';

const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: DashboardApoyo
// Recibe:
//   - usuario: objeto del usuario Personal de Apoyo logueado
//   - setActiveTab: navega entre pestañas del layout principal
// ============================================================
function DashboardApoyo({ usuario, setActiveTab }) {

  // --- ESTADOS ---
  const [misTareas, setMisTareas]         = useState([]);  // Tareas asignadas al usuario
  const [eventosParticipa, setEventosParticipa] = useState([]); // Eventos donde está asignado
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [activeEventsSortFecha, setActiveEventsSortFecha] = useState("asc");  // Orden por fecha: asc | desc
  const [activeEventsSortId, setActiveEventsSortId]       = useState("");     // Orden por ID: asc | desc | "" (sin orden por ID)
  const [completandoId, setCompletandoId] = useState(null); // ID de tarea en proceso de completar
  const [modalEvento, setModalEvento]     = useState(null); // Evento activo en modal

  // --- FUNCIÓN: cargarDatos ---
  const cargarDatos = useCallback(async (silent = false) => {
    if (!usuario?.id_usuario) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      // 1. Cargar tareas asignadas al usuario
      const resTareas = await fetch(`${API}/mis-tareas/${usuario.id_usuario}`);
      const dataTareas = await resTareas.json();
      const tareasArr = Array.isArray(dataTareas) ? dataTareas : [];
      setMisTareas(tareasArr);

      // 2. Cargar eventos donde el usuario está como organizador (para ver su contexto)
      const resEventos = await fetch(`${API}/eventos`);
      const dataEventos = await resEventos.json();
      if (Array.isArray(dataEventos)) {
        // Filtrar solo eventos aprobados o pendientes para no mostrar basura histórica
        const eventosActivos = dataEventos.filter(e =>
          e.estado === "Aprobado" || e.estado === "Pendiente"
        );
        setEventosParticipa(eventosActivos.slice(0, 6));
      }
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- FUNCIÓN: completarTarea ---
  const completarTarea = async (id_actividad) => {
    setCompletandoId(id_actividad);
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Completada' })
      });
      if (res.ok) {
        cargarDatos(true); // silent refresh
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletandoId(null);
    }
  };

  // --- FUNCIONES UTILITARIAS ---
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
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

  // --- CÁLCULOS ESTADÍSTICOS ---
  const totalTareas      = misTareas.length;
  const tareasCompletadas = misTareas.filter(t => t.estado === "Completada").length;
  const tareasPendientes  = misTareas.filter(t => t.estado !== "Completada").length;
  const tareasVencidas    = misTareas.filter(t => {
    if (t.estado === "Completada") return false;
    return getDiasRestantes(t.fecha_cumplimiento) < 0;
  }).length;

  // Porcentaje de completitud
  const pctCompletado = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  // Tareas pendientes ordenadas por fecha (más urgentes primero)
  const tareasPendientesSorted = misTareas
    .filter(t => t.estado !== "Completada")
    .sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento));

  const sortedEventosParticipa = [...eventosParticipa].sort((a, b) => {
    if (activeEventsSortId === "asc")  return Number(a.id_evento) - Number(b.id_evento);
    if (activeEventsSortId === "desc") return Number(b.id_evento) - Number(a.id_evento);
    return activeEventsSortFecha === "asc"
      ? new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      : new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
  });

  if (loading) {
    return (
      <div className="saas-dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ marginBottom: '16px' }}></div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Cargando tu panel de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-dashboard-container fade-in">

      {/* ── BIENVENIDA PERSONALIZADA ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
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
            Panel Operativo · Personal de Apoyo
          </p>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
            ¡Hola, {usuario?.nombre?.split(' ')[0] || 'Compañero'}! 👋
          </h2>
          <p style={{ marginTop: '6px', opacity: 0.85, fontSize: '14px' }}>
            {tareasPendientes > 0
              ? `Tienes ${tareasPendientes} tarea${tareasPendientes !== 1 ? 's' : ''} pendiente${tareasPendientes !== 1 ? 's' : ''} asignada${tareasPendientes !== 1 ? 's' : ''}.`
              : '¡Estás al día! No tienes tareas pendientes.'}
            {tareasVencidas > 0 && (
              <span style={{ color: '#fca5a5', marginLeft: '8px' }}>
                ⚠️ {tareasVencidas} vencida{tareasVencidas !== 1 ? 's' : ''}
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

      {/* ── TARJETAS DE ESTADÍSTICAS ── */}
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>

        {/* Total de tareas */}
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Mis Tareas</span>
            <div className="card-icon-container bg-primary-light">
              <FiList className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{totalTareas}</h3>
            <span className="card-trend" style={{ color: '#64748b' }}>Asignadas en total</span>
          </div>
        </div>

        {/* Tareas completadas */}
        <div className="saas-stat-card success-glow">
          <div className="card-top">
            <span className="card-label">Completadas</span>
            <div className="card-icon-container bg-success-light">
              <FiCheckCircle className="card-icon text-success" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{tareasCompletadas}</h3>
            <span className="card-trend text-green">Finalizadas correctamente</span>
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Pendientes</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{tareasPendientes}</h3>
            <span className="card-trend text-orange">Por realizar</span>
          </div>
        </div>

        {/* Tareas vencidas */}
        <div className="saas-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-top">
            <span className="card-label">Vencidas</span>
            <div className="card-icon-container" style={{ background: '#fef2f2' }}>
              <FiAlertCircle className="card-icon" style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div className="card-bottom">
            <h3 style={{ color: tareasVencidas > 0 ? '#ef4444' : '#10b981' }}>{tareasVencidas}</h3>
            <span className="card-trend" style={{ color: tareasVencidas > 0 ? '#ef4444' : '#10b981' }}>
              {tareasVencidas > 0 ? 'Requieren atención' : 'Sin tareas vencidas'}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE PROGRESO GENERAL ── */}
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
              <FiActivity style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Mi Progreso General</span>
            </div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: pctCompletado === 100 ? '#10b981' : '#2563eb' }}>
              {pctCompletado}%
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pctCompletado}%`,
              background: pctCompletado === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #2563eb, #60a5fa)',
              borderRadius: '99px',
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {tareasCompletadas} de {totalTareas} tareas completadas
          </p>
        </div>
      )}

      {/* ── PANEL DOBLE: TAREAS PENDIENTES + ACCESOS RÁPIDOS ── */}
      <div className="dashboard-double-panel" style={{ marginBottom: '24px' }}>

        {/* Panel izquierdo: Tareas pendientes urgentes */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiClock className="panel-icon" style={{ color: '#f59e0b' }} />
            <div>
              <h4>Mis Tareas Pendientes</h4>
              <p>{tareasPendientesSorted.length > 0 ? `${tareasPendientesSorted.length} tarea(s) por completar` : 'Sin tareas pendientes'}</p>
            </div>
          </div>
          <div className="panel-body">
            {tareasPendientesSorted.length === 0 ? (
              <div className="empty-panel-state">
                <FiCheckCircle className="icon" style={{ color: '#10b981' }} />
                <p style={{ color: '#10b981', fontWeight: '600' }}>¡Excelente! Estás al día con todas tus tareas.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tareasPendientesSorted.map(t => {
                  const dias = getDiasRestantes(t.fecha_cumplimiento);
                  const urgClass = getUrgencyClass(dias);
                  const urgLabel = getUrgencyLabel(dias);
                  const isCompleting = completandoId === t.id_actividad;

                  return (
                    <div key={t.id_actividad} style={{
                      background: urgClass === 'overdue' ? '#fef2f2' : urgClass === 'urgent' ? '#fffbeb' : urgClass === 'warning' ? '#fff7ed' : '#f8fafc',
                      border: `1px solid ${urgClass === 'overdue' ? '#fca5a5' : urgClass === 'urgent' ? '#fcd34d' : urgClass === 'warning' ? '#fed7aa' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.nombre_actividad}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <FiCalendar size={10} /> {t.nombre_evento}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: urgClass === 'overdue' ? '#fca5a5' : urgClass === 'urgent' ? '#fcd34d' : urgClass === 'warning' ? '#fed7aa' : '#e0f2fe',
                            color: urgClass === 'overdue' ? '#991b1b' : urgClass === 'urgent' ? '#92400e' : urgClass === 'warning' ? '#c2410c' : '#1e40af'
                          }}>
                            {urgLabel}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Límite: {formatFecha(t.fecha_cumplimiento)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => completarTarea(t.id_actividad)}
                        disabled={isCompleting}
                        style={{
                          background: isCompleting ? '#94a3b8' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          cursor: isCompleting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'background 0.2s'
                        }}
                        aria-label="Marcar tarea como completada"
                      >
                        <FiCheck size={13} />
                        {isCompleting ? 'Guardando...' : 'Marcar lista'}
                      </button>
                    </div>
                  );
                })}
                {tareasPendientesSorted.length >= 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab && setActiveTab("CronogramaGlobal")}
                    style={{ background: 'transparent', border: '1px dashed #cbd5e1', color: '#64748b', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    aria-label="Ver todas mis tareas"
                  >
                    Ver todas mis tareas <FiChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Eventos activos y accesos rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Sub-panel: Accesos Rápidos */}
          <div className="saas-panel-card" style={{ flex: '0 0 auto' }}>
            <div className="panel-header">
              <FiActivity className="panel-icon" style={{ color: '#8b5cf6' }} />
              <div>
                <h4>Accesos Rápidos</h4>
                <p>Atajos operativos del Personal de Apoyo</p>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              <div className="quick-actions-list">
                <div
                  className="quick-action-btn premium-btn-blue"
                  onClick={() => setActiveTab && setActiveTab("CronogramaGlobal")}
                >
                  <div className="icon-wrapper"><FiCheckCircle /></div>
                  <div className="btn-text">
                    <strong>Mis Tareas</strong>
                    <span>Ver checklist operativo</span>
                  </div>
                </div>
                <div
                  className="quick-action-btn premium-btn-orange"
                  onClick={() => setActiveTab && setActiveTab("Calendario")}
                >
                  <div className="icon-wrapper"><FiCalendar /></div>
                  <div className="btn-text">
                    <strong>Ver Calendario</strong>
                    <span>Agenda de eventos UAPA</span>
                  </div>
                </div>
                <div
                  className="quick-action-btn"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', cursor: 'pointer', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
                  onClick={() => setActiveTab && setActiveTab("Soporte")}
                >
                  <div className="icon-wrapper" style={{ color: 'white' }}><FiUser /></div>
                  <div className="btn-text">
                    <strong style={{ color: 'white' }}>Centro de Ayuda</strong>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Soporte y guías</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-panel: Tareas completadas recientes */}
          {tareasCompletadas > 0 && (
            <div className="saas-panel-card" style={{ flex: '1 1 auto' }}>
              <div className="panel-header">
                <FiCheckCircle className="panel-icon" style={{ color: '#10b981' }} />
                <div>
                  <h4>Últimas Completadas</h4>
                  <p>Trabajo realizado recientemente</p>
                </div>
              </div>
              <div className="panel-body" style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {misTareas
                    .filter(t => t.estado === "Completada")
                    .slice(0, 3)
                    .map(t => (
                      <div key={t.id_actividad} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <FiCheckCircle style={{ color: '#10b981', flexShrink: 0 }} size={16} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.nombre_actividad}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#4ade80' }}>{t.nombre_evento}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TABLA: TODOS MIS EVENTOS ACTIVOS ── */}
      <div className="saas-panel-card">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiCalendar className="panel-icon" style={{ color: '#2563eb' }} />
            <div>
              <h4>Eventos Activos del Sistema</h4>
              <p>Eventos aprobados y en proceso donde puedes participar</p>
            </div>
          </div>

          {/* ── CONTROLES DE ORDEN ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px' }}>

            {/* Selector: Orden por Fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiCalendar style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }} />
              <select
                id="sort-fecha-agenda"
                value={activeEventsSortFecha}
                onChange={e => { setActiveEventsSortFecha(e.target.value); setActiveEventsSortId(""); }}
                style={{
                  border: 'none', background: 'transparent', fontSize: '12px',
                  fontWeight: '600', color: activeEventsSortId === "" ? '#3b82f6' : '#64748b',
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
                value={activeEventsSortId}
                onChange={e => setActiveEventsSortId(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', fontSize: '12px',
                  fontWeight: '600', color: activeEventsSortId !== "" ? '#3b82f6' : '#64748b',
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
        <div className="panel-body" style={{ padding: '0' }}>
          {sortedEventosParticipa.length === 0 ? (
            <div className="empty-panel-state" style={{ padding: '40px' }}>
              <FiCalendar className="icon" />
              <p>No hay eventos activos en este momento.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evento</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recinto</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modalidad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEventosParticipa.map((evt, idx) => (
                    <tr
                      key={evt.id_evento}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background 0.15s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                      onClick={() => setModalEvento(evt)}
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

      {/* ── MODAL DETALLE EVENTO ── */}
      {modalEvento && (
        <div className="modal-overlay" onClick={() => setModalEvento(null)}>
          <div className="modal-content modal-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Detalle del Evento</h3>
                <span className="modal-subtitle">Información de referencia del evento</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>
                #EVT-{modalEvento.id_evento}
              </span>
            </div>
            <div className="modal-body">
              <div className="modal-grid-3">
                <div className="info-card">
                  <div className="info-card-title"><FiCalendar size={14} /> Información General</div>
                  <div className="info-row">
                    <span className="info-label">Nombre</span>
                    <span className="info-value" style={{ color: '#2563eb', fontWeight: '700' }}>{modalEvento.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tipo</span>
                    <span className="info-value">{modalEvento.tipo_evento || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha Inicio</span>
                    <span className="info-value">{formatFecha(modalEvento.fecha_inicio)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha Fin</span>
                    <span className="info-value">{formatFecha(modalEvento.fecha_fin)}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title"><FiMapPin size={14} /> Logística</div>
                  <div className="info-row">
                    <span className="info-label">Recinto</span>
                    <span className="info-value">{modalEvento.recinto || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Modalidad</span>
                    <span className="info-value">{modalEvento.modalidad || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Asistentes</span>
                    <span className="info-value">{modalEvento.cantidad_asistentes ? `${modalEvento.cantidad_asistentes} personas` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Horario</span>
                    <span className="info-value">
                      {modalEvento.hora_inicio?.substring(0,5) || '—'} – {modalEvento.hora_fin?.substring(0,5) || '—'}
                    </span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title"><FiStar size={14} /> Estado</div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado actual</span>
                    <span className={`badge ${modalEvento.estado === 'Aprobado' ? 'badge-green' : modalEvento.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`}
                      style={{ width: 'fit-content', padding: '6px 14px', marginTop: '6px' }}>
                      {modalEvento.estado}
                    </span>
                  </div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Audiovisual</span>
                    <span className="info-value">
                      {modalEvento.necesita_audiovisual ? '✅ Requiere AV' : '❌ Sin AV'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalEvento(null)} aria-label="Cerrar modal">Cerrar</button>
              <button type="button" className="btn btn-primary" onClick={() => { setModalEvento(null); setActiveTab && setActiveTab("Calendario"); }} aria-label="Ver evento en el calendario">
                <FiCalendar style={{ marginRight: '6px' }} /> Ver en Calendario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardApoyo;
