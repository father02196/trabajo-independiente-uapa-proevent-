// ============================================================
// COMPONENTE: DashboardCompras
// Pertenece a: Módulo de Compras / Licitaciones
// Propósito: Panel analítico para el administrador de compras.
// Muestra KPIs logísticos (licitaciones, órdenes de compra, presupuesto)
// y gráficas analíticas de presupuesto y tendencia de eventos.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiShoppingCart, FiFileText, FiCheckCircle, FiDollarSign, FiRefreshCw, FiGrid, FiActivity, FiArrowUpRight, FiClock, FiCalendar, FiTrendingUp } from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend, LabelList
} from 'recharts';
import './../css/Dashboard.css';

const API = "http://localhost:8080";

// Tooltip personalizado para presupuesto (formato DOP)
const TooltipPresupuesto = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(payload[0].value);
    return (
      <div style={{ background: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '13px' }}>
        <p style={{ margin: 0, color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{val}</p>
      </div>
    );
  }
  return null;
};

// Tooltip personalizado para eventos por mes
const TooltipEventos = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '13px' }}>
        <p style={{ margin: 0, color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 700 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function DashboardCompras({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortFecha, setSortFecha] = useState("asc");
  const [sortId, setSortId]       = useState("");
  const [mesRange, setMesRange]   = useState(6);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // --- FUNCIÓN: cargarDatos ---
  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const resEvents = await fetch(`${API}/eventos`).then(r => r.json());
      if (Array.isArray(resEvents)) setEventRequests(resEvents);
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- UTILIDADES DE FORMATO ---
  const formatMonedaDOP = (valor) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor);

  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- KPIs LOGÍSTICOS ---
  const licitacionesAbiertas      = eventRequests.filter(e => e.estado === "Aprobado").length;
  const ocEmitidas                = eventRequests.filter(e => e.estado === "Finalizado").length;
  const totalPresupuestoGeneral   = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Finalizado")
    .reduce((acc, curr) => acc + (parseFloat(curr.monto_poa) || 0), 0);

  // --- PRÓXIMOS EVENTOS PARA TABLA ---
  const eventosEnProceso = eventRequests
    .filter(e => e.estado === "Aprobado")
    .sort((a, b) => {
      if (sortId === "asc")  return Number(a.id_evento) - Number(b.id_evento);
      if (sortId === "desc") return Number(b.id_evento) - Number(a.id_evento);
      return sortFecha === "asc"
        ? new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
        : new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
    })
    .slice(0, 5);

  // --- GRÁFICA 1: PRESUPUESTO POA POR RECINTO (BarChart Horizontal) ---
  const venueBudgets = {};
  eventRequests.forEach(req => {
    if (req.estado === "Aprobado" || req.estado === "Finalizado") {
      const recinto = (req.recinto || "Sin recinto")
        .replace("Sede ", "").replace(" Oriental", "").replace(" Santo Domingo", " SD");
      venueBudgets[recinto] = (venueBudgets[recinto] || 0) + (parseFloat(req.monto_poa) || 0);
    }
  });
  const venueData = Object.entries(venueBudgets)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const barColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

  // --- GRÁFICA 2: TENDENCIA DE EVENTOS POR MES (AreaChart doble línea) ---
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const allTrendData = (() => {
    const hoy = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
      const anio = d.getFullYear();
      const mes  = d.getMonth();
      return {
        name: meses[mes],
        Aprobados: eventRequests.filter(e => {
          if (!e.fecha_inicio || e.estado !== "Aprobado") return false;
          const f = new Date(e.fecha_inicio);
          f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
          return f.getFullYear() === anio && f.getMonth() === mes;
        }).length,
        Finalizados: eventRequests.filter(e => {
          if (!e.fecha_inicio || e.estado !== "Finalizado") return false;
          const f = new Date(e.fecha_inicio);
          f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
          return f.getFullYear() === anio && f.getMonth() === mes;
        }).length,
      };
    });
  })();
  const trendData = allTrendData.slice(-mesRange);

  return (
    <div className="saas-dashboard-container fade-in">

      {/* ── 4 KPI CARDS ── */}
      <div className="stats-cards-grid">
        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Licitaciones Activas</span>
            <div className="card-icon-container bg-warning-light">
              <FiShoppingCart className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{licitacionesAbiertas}</h3>
            <span className="card-trend text-orange">Eventos esperando adjudicación</span>
          </div>
        </div>

        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Cotizaciones B2B</span>
            <div className="card-icon-container bg-primary-light">
              <FiFileText className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{(licitacionesAbiertas * 2) + ocEmitidas}</h3>
            <span className="card-trend text-blue">Ofertas registradas (est.)</span>
          </div>
        </div>

        <div className="saas-stat-card success-glow">
          <div className="card-top">
            <span className="card-label">Órdenes de Compra</span>
            <div className="card-icon-container bg-success-light">
              <FiCheckCircle className="card-icon text-success" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{ocEmitidas}</h3>
            <span className="card-trend text-green">Adjudicaciones finalizadas</span>
          </div>
        </div>

        <div className="saas-stat-card budget-glow">
          <div className="card-top">
            <span className="card-label">Presupuesto UAPA</span>
            <div className="card-icon-container bg-info-light">
              <FiDollarSign className="card-icon text-info" />
            </div>
          </div>
          <div className="card-bottom">
            <h3 style={{ fontSize: '18px' }}>{formatMonedaDOP(totalPresupuestoGeneral)}</h3>
            <span className="card-trend text-purple">Global comprometido POA</span>
          </div>
        </div>
      </div>

      {/* ── GRÁFICAS ANALÍTICAS ── */}
      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '24px' }}>

        {/* GRÁFICA 1: PRESUPUESTO POR RECINTO */}
        <div className="saas-chart-card">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4>Presupuesto POA por Recinto</h4>
              <p>Monto comprometido en eventos aprobados y finalizados</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eff6ff', borderRadius: '8px', padding: '5px 10px' }}>
              <FiDollarSign style={{ color: '#3b82f6', fontSize: '13px' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6' }}>POA</span>
            </div>
          </div>
          <div className="chart-wrapper" style={{ height: '240px', padding: '8px 0' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader"></div>
              </div>
            ) : venueData.length === 0 ? (
              <div className="no-data-placeholder">Sin datos de presupuesto registrados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={venueData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={v => `RD$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip content={<TooltipPresupuesto />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {venueData.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={v => `$${(v / 1000).toFixed(0)}k`}
                      style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICA 2: TENDENCIA DE EVENTOS POR MES */}
        <div className="saas-chart-card">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4>Tendencia de Eventos</h4>
              <p>Aprobados vs Finalizados por mes</p>
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
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAprobados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradFinalizados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<TooltipEventos />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', fontWeight: '600', paddingTop: '8px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="Aprobados"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradAprobados)"
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Finalizados"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradFinalizados)"
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── PANEL DOBLE: REQUERIMIENTOS + ACCESOS ── */}
      <div className="dashboard-double-panel" style={{ marginTop: '24px' }}>

        {/* PANEL IZQUIERDO: EVENTOS PENDIENTES DE LOGÍSTICA */}
        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FiClock className="panel-icon" />
              <div>
                <h4>Requerimientos en Análisis</h4>
                <p>Eventos aprobados próximos que requieren adjudicación</p>
              </div>
            </div>

            {/* Controles de orden estilo pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }} />
                <select
                  id="sort-fecha-compras"
                  value={sortFecha}
                  onChange={e => { setSortFecha(e.target.value); setSortId(""); }}
                  style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: sortId === "" ? '#3b82f6' : '#64748b', cursor: 'pointer', outline: 'none', padding: '3px 2px' }}
                  aria-label="Ordenar por fecha"
                >
                  <option value="asc">Fecha ↑</option>
                  <option value="desc">Fecha ↓</option>
                </select>
              </div>
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0', display: 'inline-block' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>#</span>
                <select
                  id="sort-id-compras"
                  value={sortId}
                  onChange={e => setSortId(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: sortId !== "" ? '#3b82f6' : '#64748b', cursor: 'pointer', outline: 'none', padding: '3px 2px' }}
                  aria-label="Ordenar por ID"
                >
                  <option value="">ID —</option>
                  <option value="asc">ID ↑</option>
                  <option value="desc">ID ↓</option>
                </select>
              </div>
              <span style={{ width: '1px', height: '18px', background: '#e2e8f0', display: 'inline-block' }} />
              <button type="button" className="reload-data-btn" onClick={() => cargarDatos()} title="Actualizar datos" aria-label="Actualizar datos" style={{ marginLeft: '2px' }}>
                <FiRefreshCw />
              </button>
            </div>
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Buscando requerimientos...</p>
              </div>
            ) : eventosEnProceso.length === 0 ? (
              <div className="empty-panel-state">
                <FiActivity className="icon" />
                <p>No hay licitaciones pendientes en este momento.</p>
              </div>
            ) : (
              <div className="modern-upcoming-events-list">
                {eventosEnProceso.map((evt) => (
                  <div key={evt.id_evento} className="modern-event-card" onClick={() => setActiveTab("FlujoAdministrativo")}>
                    <div className="modern-event-header">
                      <div className="modern-event-date">
                        <FiClock className="modern-date-icon" />
                        <span>Entrega: {formatFechaLarga(evt.fecha_inicio)}</span>
                      </div>
                      <span className="modern-status-badge modern-status-aprobado">Pendiente OC</span>
                    </div>
                    <div className="modern-event-body">
                      <h5 className="modern-event-title">
                        <span style={{ color: '#94a3b8', fontSize: '13px', marginRight: '8px', fontWeight: '800' }}>#EVT-{evt.id_evento}</span>
                        {evt.nombre}
                      </h5>
                      <div className="modern-event-meta-info" style={{ marginTop: '8px' }}>
                        <div className="modern-meta-item">
                          <FiGrid className="modern-meta-icon" />
                          <span>{evt.recinto || "UAPA Virtual"}</span>
                        </div>
                        <div className="modern-meta-item">
                          <FiDollarSign className="modern-meta-icon" />
                          <span>POA: {formatMonedaDOP(evt.monto_poa || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="modern-event-footer">
                      <button type="button" className="modern-view-btn" title="Ir al Flujo de Compras" aria-label="Ir al flujo de compras">
                        <span>Ir a Analizar Cotizaciones</span>
                        <FiArrowUpRight className="modern-btn-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: ACCESOS RÁPIDOS + RESUMEN POA */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiGrid className="panel-icon" />
            <div>
              <h4>Accesos Rápidos de Compras</h4>
              <p>Módulos de logística y proveedores</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            <div className="quick-actions-list">
              <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
                <div className="icon-wrapper"><FiShoppingCart /></div>
                <div className="btn-text">
                  <strong>Flujo de Compras</strong>
                  <span>Analizar ofertas B2B</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("Proveedores")}>
                <div className="icon-wrapper"><FiGrid /></div>
                <div className="btn-text">
                  <strong>Directorio Proveedores</strong>
                  <span>Aprobar cuentas B2B</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("GestionCategorias")}>
                <div className="icon-wrapper"><FiFileText /></div>
                <div className="btn-text">
                  <strong>Categorías</strong>
                  <span>Gestión de rubros B2B</span>
                </div>
              </div>
            </div>

            <div className="poa-summary-box" style={{ marginTop: '24px' }}>
              <div className="poa-progress-header">
                <span>Total Universitario Gastado (POA)</span>
                <strong>{formatMonedaDOP(totalPresupuestoGeneral)}</strong>
              </div>
              <div className="poa-progress-bar-container">
                <div className="poa-progress-bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}></div>
              </div>
              <p className="poa-footer-text">Presupuesto consolidado de todos los recintos de UAPA invertido a través del departamento de compras.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCompras;
