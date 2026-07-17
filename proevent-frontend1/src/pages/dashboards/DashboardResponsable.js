// ============================================================
// DASHBOARD RESPONSABLE - Panel Gerencial / Supervisión
// Pertenece a: Módulo de Inicio (ProEvent - Rol Responsable)
// Propósito: Vista de supervisión para el Responsable de área.
// Muestra: KPIs de eventos y equipo, progreso global del
// cronograma, próximos eventos, radar de tareas críticas,
// gráficas analíticas y tabla de eventos activos.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  FiCheckCircle, FiClock, FiCalendar, FiActivity,
  FiList, FiAlertCircle, FiStar, FiMapPin, FiRefreshCw,
  FiArrowUpRight, FiGrid, FiMonitor, FiUsers, FiTrendingUp,
  FiZap, FiPieChart, FiBarChart2
} from "react-icons/fi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import './../../css/Dashboard.css';

const API = "http://localhost:8080";

// --- TOOLTIPS PERSONALIZADOS PARA RECHARTS ---
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: payload[0].payload.color, fontSize: '13px' }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#64748b', fontSize: '13px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: 0, fontWeight: 600, color: p.color, fontSize: '13px' }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================
// COMPONENTE: DashboardResponsable
// ============================================================
function DashboardResponsable({ usuario, setActiveTab }) {

  // --- ESTADOS ---
  const [eventos, setEventos]         = useState([]);  
  const [tareasEquipo, setTareasEquipo] = useState([]); 
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [sortFecha, setSortFecha]     = useState("asc");  
  const [sortId, setSortId]           = useState("");     
  const [activeEventsSortOrder, setActiveEventsSortOrder] = useState("desc"); 
  const [activeEventsSortId, setActiveEventsSortId]       = useState("");
  const [mesRange, setMesRange]       = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      const resEventos = await fetch(`${API}/eventos`);
      const dataEventos = await resEventos.json();
      if (Array.isArray(dataEventos)) setEventos(dataEventos);

      try {
        const resTareas = await fetch(`${API}/cronograma`);
        const dataTareas = await resTareas.json();
        if (Array.isArray(dataTareas)) setTareasEquipo(dataTareas);
      } catch (_) {
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
      if (sortId === "asc")  return Number(a.id_evento) - Number(b.id_evento);
      if (sortId === "desc") return Number(b.id_evento) - Number(a.id_evento);
      return sortFecha === "asc"
        ? new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
        : new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
    })
    .slice(0, 5);

  const eventosActivos = [...eventosActivosBase]
    .sort((a, b) => {
      if (activeEventsSortId === "asc") return Number(a.id_evento) - Number(b.id_evento);
      if (activeEventsSortId === "desc") return Number(b.id_evento) - Number(a.id_evento);

      const dateA = new Date(a.fecha_inicio || 0);
      const dateB = new Date(b.fecha_inicio || 0);
      return activeEventsSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Paginación de eventos activos
  const totalPages = Math.ceil(eventosActivos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEventosActivos = eventosActivos.slice(indexOfFirstItem, indexOfLastItem);

  // --- CÁLCULOS: TAREAS DEL EQUIPO ---
  const totalTareas       = tareasEquipo.length;
  const tareasCompletadas = tareasEquipo.filter(t => t.estado === "Completada").length;
  const tareasPendientesTotal = tareasEquipo.filter(t => t.estado !== "Completada").length;
  const tareasVencidas    = tareasEquipo.filter(t => {
    if (t.estado === "Completada") return false;
    return getDiasRestantes(t.fecha_cumplimiento) < 0;
  }).length;
  const tareasEnProceso = tareasPendientesTotal - tareasVencidas;

  const pctProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  const tareasCriticas = tareasEquipo
    .filter(t => {
      if (t.estado === "Completada") return false;
      const dias = getDiasRestantes(t.fecha_cumplimiento);
      return dias !== null && dias <= 2;
    })
    .sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento))
    .slice(0, 5);

  const mensajeBanner = (() => {
    const parts = [];
    if (eventosAprobados > 0) parts.push(`${eventosAprobados} evento${eventosAprobados !== 1 ? 's' : ''} aprobado${eventosAprobados !== 1 ? 's' : ''} activo${eventosAprobados !== 1 ? 's' : ''}`);
    if (tareasVencidas > 0) parts.push(`${tareasVencidas} tarea${tareasVencidas !== 1 ? 's' : ''} vencida${tareasVencidas !== 1 ? 's' : ''} en el equipo`);
    return parts.length > 0 ? `Supervisando: ${parts.join(' · ')}.` : 'Todo en orden. Sin alertas críticas en este momento.';
  })();

  // --- DATOS PARA GRÁFICAS ---
  // Gráfica 1: Distribución de Tareas (Pie)
  const pieData = [
    { name: 'Completadas', value: tareasCompletadas, color: '#10b981' },
    { name: 'En Proceso', value: tareasEnProceso, color: '#3b82f6' },
    { name: 'Vencidas', value: tareasVencidas, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Gráfica 2: Tendencia de Eventos Activos por Mes (Area)
  const allTrendData = (() => {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const hoy = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
      const anio = d.getFullYear();
      const mes  = d.getMonth();
      return {
        name: meses[mes],
        Aprobados: eventos.filter(e => {
          if (!e.fecha_inicio || e.estado !== "Aprobado") return false;
          const f = new Date(e.fecha_inicio);
          f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
          return f.getFullYear() === anio && f.getMonth() === mes;
        }).length,
        Pendientes: eventos.filter(e => {
          if (!e.fecha_inicio || e.estado !== "Pendiente") return false;
          const f = new Date(e.fecha_inicio);
          f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
          return f.getFullYear() === anio && f.getMonth() === mes;
        }).length,
      };
    });
  })();
  const trendData = allTrendData.slice(-mesRange);

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
        >
          <FiRefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* ── 4 TARJETAS KPI ── */}
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Eventos Aprobados</span>
            <div className="card-icon-container bg-primary-light">
              <FiCalendar className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{eventosAprobados}</h3>
            <span className="card-trend text-green"><FiArrowUpRight /> Activos en sistema</span>
          </div>
        </div>

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

        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Pendientes del Equipo</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{tareasPendientesTotal}</h3>
            <span className="card-trend text-orange">En ejecución</span>
          </div>
        </div>

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

      {/* ── BARRA DE PROGRESO GLOBAL ── */}
      {totalTareas > 0 && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTrendingUp style={{ color: '#0f766e' }} />
              <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Progreso Global del Cronograma</span>
            </div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: pctProgreso === 100 ? '#10b981' : '#0f766e' }}>{pctProgreso}%</span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctProgreso}%`, background: pctProgreso === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #0f766e, #14b8a6)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>{tareasCompletadas} de {totalTareas} tareas completadas por el equipo</p>
        </div>
      )}

      {/* ── SECCIÓN DE GRÁFICAS ANALÍTICAS (NUEVO) ── */}
      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
        
        {/* Gráfica 1: Estado de Tareas (Donut) */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart style={{ color: '#6366f1' }} />
                <h4>Estado de Tareas del Equipo</h4>
              </div>
              <p>Distribución actual del cronograma</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px', padding: '10px 0' }}>
            {pieData.length === 0 ? (
              <div className="no-data-placeholder">No hay tareas asignadas</div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '10px' }}>
                  {pieData.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></span>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#475569', lineHeight: 1.2 }}>{item.name}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfica 2: Tendencia de Eventos (Area) */}
        <div className="saas-chart-card">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBarChart2 style={{ color: '#3b82f6' }} />
                <h4>Volumen de Eventos Activos</h4>
              </div>
              <p>Aprobados vs Pendientes por mes</p>
            </div>
            <select
              className="saas-select"
              value={mesRange}
              onChange={e => setMesRange(Number(e.target.value))}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#475569', cursor: 'pointer', background: '#f8fafc' }}
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={9}>Últimos 9 meses</option>
              <option value={12}>Últimos 12 meses</option>
            </select>
          </div>
          <div className="chart-wrapper" style={{ height: '240px', padding: '8px 0' }}>
            {trendData.length === 0 ? (
              <div className="no-data-placeholder">Sin datos registrados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAprobados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPendientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                  <Area type="monotone" dataKey="Aprobados" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorAprobados)" activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Pendientes" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorPendientes)" activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── PANEL DOBLE: EVENTOS PRÓXIMOS + PANEL DERECHO ── */}
      <div className="dashboard-double-panel" style={{ marginBottom: '24px' }}>

        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FiCalendar className="panel-icon" />
              <div>
                <h4>Eventos Próximos (Global)</h4>
                <p>Agenda general de los próximos días</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar style={{ fontSize: '12px', color: '#64748b' }} />
                <select id="sort-fecha-agenda" value={sortFecha} onChange={e => { setSortFecha(e.target.value); setSortId(""); }} style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: sortId === "" ? '#3b82f6' : '#64748b', outline: 'none' }}>
                  <option value="asc">Fecha ↑</option>
                  <option value="desc">Fecha ↓</option>
                </select>
              </div>
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>#</span>
                <select id="sort-id-agenda" value={sortId} onChange={e => setSortId(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: sortId !== "" ? '#3b82f6' : '#64748b', outline: 'none' }}>
                  <option value="">ID —</option>
                  <option value="asc">ID ↑</option>
                  <option value="desc">ID ↓</option>
                </select>
              </div>
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
              <button type="button" className="reload-data-btn" onClick={() => cargarDatos()} style={{ marginLeft: '2px' }}><FiRefreshCw /></button>
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
                      <button type="button" className="modern-view-btn">
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <span>Nueva solicitud</span>
                  </div>
                </div>
                <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("Audiovisual")}>
                  <div className="icon-wrapper"><FiMonitor /></div>
                  <div className="btn-text">
                    <strong>Solicitud AV</strong>
                    <span>Reserva equipo</span>
                  </div>
                </div>
                <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                  <div className="icon-wrapper"><FiCalendar /></div>
                  <div className="btn-text">
                    <strong>Ver Agenda</strong>
                    <span>Calendario</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="saas-panel-card" style={{ flex: '1 1 auto' }}>
            <div className="panel-header">
              <FiAlertCircle className="panel-icon" style={{ color: '#ef4444' }} />
              <div>
                <h4>Radar de Tareas Críticas</h4>
                <p>{tareasCriticas.length > 0 ? `${tareasCriticas.length} urgentes` : 'Sin alertas'}</p>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              {tareasCriticas.length === 0 ? (
                <div className="empty-panel-state">
                  <FiCheckCircle className="icon" style={{ color: '#10b981' }} />
                  <p style={{ color: '#10b981', fontWeight: '600' }}>¡Equipo al día!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tareasCriticas.map(t => {
                    const dias = getDiasRestantes(t.fecha_cumplimiento);
                    const urgClass = getUrgencyClass(dias);
                    return (
                      <div key={t.id_actividad} style={{
                        background: urgClass === 'overdue' ? '#fef2f2' : urgClass === 'urgent' ? '#fffbeb' : '#fff7ed',
                        border: `1px solid ${urgClass === 'overdue' ? '#fca5a5' : urgClass === 'urgent' ? '#fcd34d' : '#fed7aa'}`,
                        borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{t.nombre_actividad}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{t.nombre_evento}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                              background: urgClass === 'overdue' ? '#fca5a5' : '#fcd34d',
                              color: urgClass === 'overdue' ? '#991b1b' : '#92400e'
                            }}>{getUrgencyLabel(dias)}</span>
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
              <p>Vista detallada para supervisión · {eventosActivos.length} eventos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Filtro Fecha */}
            <div style={{ display: 'flex', alignItems: 'center', background: activeEventsSortId === "" ? '#eff6ff' : '#ffffff', border: `1px solid ${activeEventsSortId === "" ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '8px', padding: '6px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
              <FiCalendar style={{ color: activeEventsSortId === "" ? '#3b82f6' : '#94a3b8', marginRight: '8px' }} />
              <select className="saas-select" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: activeEventsSortId === "" ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontWeight: '600' }} value={activeEventsSortOrder} onChange={(e) => { setActiveEventsSortOrder(e.target.value); setActiveEventsSortId(""); setCurrentPage(1); }}>
                <option value="desc">Más recientes primero</option>
                <option value="asc">Menos recientes primero</option>
              </select>
            </div>

            {/* Botón Filtro ID */}
            <button 
              type="button"
              onClick={() => {
                const nextSort = activeEventsSortId === "" ? "desc" : activeEventsSortId === "desc" ? "asc" : "";
                setActiveEventsSortId(nextSort);
                setCurrentPage(1);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: activeEventsSortId !== "" ? '#eff6ff' : '#ffffff',
                border: `1px solid ${activeEventsSortId !== "" ? '#bfdbfe' : '#e2e8f0'}`,
                borderRadius: '8px', padding: '7px 14px',
                color: activeEventsSortId !== "" ? '#1d4ed8' : '#64748b',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(activeEventsSortId === "") e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if(activeEventsSortId === "") e.currentTarget.style.background = '#ffffff' }}
            >
              <span style={{ fontWeight: '800', fontSize: '14px', color: activeEventsSortId !== "" ? '#3b82f6' : '#94a3b8' }}>#</span>
              {activeEventsSortId === "" ? "Ordenar por ID" : activeEventsSortId === "desc" ? "ID: Mayor a Menor ↓" : "ID: Menor a Mayor ↑"}
            </button>
          </div>
        </div>
        <div className="panel-body" style={{ padding: '0' }}>
          {eventosActivos.length === 0 ? (
            <div className="empty-panel-state" style={{ padding: '40px' }}>
              <FiCalendar className="icon" />
              <p>No hay eventos activos en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                    {currentEventosActivos.map((evt, idx) => (
                      <tr key={evt.id_evento} onClick={() => openModal(evt)} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>#{evt.id_evento} · {evt.nombre}</p>
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
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '600' }}>{evt.modalidad || 'Presencial'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiUsers size={12} style={{ color: '#94a3b8' }} />
                          {evt.cantidad_asistentes ? `${evt.cantidad_asistentes} pers.` : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`status-pill ${evt.estado === 'Aprobado' ? 'approved' : 'pending'}`}>{evt.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#94a3b8' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Página <strong style={{ color: '#0f172a' }}>{currentPage}</strong> de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : 'white', color: currentPage === totalPages ? '#94a3b8' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  Siguiente
                </button>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL FICHA TÉCNICA ── */}
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
                <div className="info-card">
                  <div className="info-card-title"><FiCalendar size={14} /> Información General</div>
                  <div className="info-row"><span className="info-label">Nombre del Evento</span><span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>{selectedRequest.nombre}</span></div>
                  <div className="info-row"><span className="info-label">Tipo</span><span className="info-value">{selectedRequest.tipo_evento || '—'}</span></div>
                  <div className="info-row"><span className="info-label">Fecha Inicio</span><span className="info-value">{formatFecha(selectedRequest.fecha_inicio)}</span></div>
                  <div className="info-row"><span className="info-label">Horario</span><span className="info-value">{selectedRequest.hora_inicio?.substring(0,5) || '—'} – {selectedRequest.hora_fin?.substring(0,5) || '—'}</span></div>
                </div>
                <div className="info-card">
                  <div className="info-card-title"><FiMapPin size={14} /> Logística y Asistencia</div>
                  <div className="info-row"><span className="info-label">Recinto</span><span className="info-value">{selectedRequest.recinto || '—'}</span></div>
                  <div className="info-row"><span className="info-label">Modalidad</span><span className="info-value">{selectedRequest.modalidad || '—'}</span></div>
                  <div className="info-row"><span className="info-label">Asistentes</span><span className="info-value">{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : '—'}</span></div>
                </div>
                <div className="info-card">
                  <div className="info-card-title"><FiStar size={14} /> Estado</div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado de la Solicitud</span>
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>{selectedRequest.estado || 'Pendiente'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
              <button type="button" className="btn btn-primary" onClick={() => { closeModal(); setActiveTab && setActiveTab("Calendario"); }}>
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
