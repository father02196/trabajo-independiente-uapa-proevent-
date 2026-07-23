// ============================================================
// COMPONENTE: DashboardLegal
// Pertenece a: Módulo Dashboards Principales
// Propósito: Pantalla de inicio exclusiva para el Administrador Legal.
// Muestra indicadores clave (contratos pendientes, dictámenes),
// gráficas de flujo legal y volumen de revisiones, alertas de 
// eventos observados y accesos directos al flujo administrativo.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiFileText, FiClock, FiActivity, FiArrowUpRight, FiShield, FiAlertTriangle, FiCalendar, FiBriefcase, FiFilter, FiCheck, FiRefreshCw, FiPieChart, FiBarChart2 } from "react-icons/fi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './../css/Dashboard.css';

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

function DashboardLegal({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortFecha, setSortFecha] = useState("");
  const [sortId, setSortId] = useState("desc");      
  const [mesRange, setMesRange] = useState(6);

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const resEvents = await fetch(`${API}/eventos`).then(r => r.json());
      if (Array.isArray(resEvents)) {
        setEventRequests(resEvents);
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- FUNCIÓN: formatFechaLarga ---
  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- KPIs y Estadísticas ---
  const eventosAprobados = eventRequests.filter((e) => e.estado === "Aprobado" || e.estado === "Finalizado").length;
  // Contratos pendientes asumen que eventos "Aprobados" necesitan contrato
  const contratosPendientes = eventRequests.filter((e) => e.estado === "Aprobado").length;
  // Dictámenes asumimos que están "Finalizados"
  const dictamenesEmitidos = eventRequests.filter((e) => e.estado === "Finalizado").length;
  const eventosObservados = eventRequests.filter((e) => e.estado === "Rechazado").length; 

  // --- FUNCIÓN DE ORDENAMIENTO DE TABLA ---
  const eventosEnProceso = eventRequests
    .filter(e => e.estado === "Aprobado")
    .sort((a, b) => {
      if (sortId !== "") {
        return sortId === "asc" ? a.id_evento - b.id_evento : b.id_evento - a.id_evento;
      } else {
        const dateA = new Date(a.fecha_inicio);
        const dateB = new Date(b.fecha_inicio);
        return sortFecha === "asc" ? dateA - dateB : dateB - dateA;
      }
    })
    .slice(0, 5);

  // --- DATOS PARA GRÁFICAS ---
  // Gráfica 1: Distribución de Carga Jurídica (Pie)
  const pieData = [
    { name: 'Contratos Pendientes', value: contratosPendientes, color: '#f59e0b' },
    { name: 'Dictámenes Emitidos', value: dictamenesEmitidos, color: '#3b82f6' },
    { name: 'Observados / Rechazados', value: eventosObservados, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Gráfica 2: Flujo de Revisiones Legales (Area)
  const allTrendData = (() => {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const hoy = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
      const anio = d.getFullYear();
      const mes  = d.getMonth();
      return {
        name: meses[mes],
        'Pendientes': eventRequests.filter(e => {
          if (!e.fecha_inicio || e.estado !== "Aprobado") return false;
          const f = new Date(e.fecha_inicio);
          f.setMinutes(f.getMinutes() + f.getTimezoneOffset());
          return f.getFullYear() === anio && f.getMonth() === mes;
        }).length,
        'Dictaminados': eventRequests.filter(e => {
          if (!e.fecha_inicio || e.estado === "Aprobado" || e.estado === "Rechazado") return false; 
          // Evaluamos cualquier otro como dictaminado en el pasado
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
      
      {/* ── CARDS DE ESTADÍSTICAS PREMIUM - ROL LEGAL ── */}
      <div className="stats-cards-grid">
        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Contratos Pendientes</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{contratosPendientes}</h3>
            <span className="card-trend text-orange">
              Esperando revisión jurídica
            </span>
          </div>
        </div>

        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Dictámenes Emitidos</span>
            <div className="card-icon-container bg-primary-light">
              <FiShield className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{dictamenesEmitidos}</h3>
            <span className="card-trend text-blue">Eventos avalados</span>
          </div>
        </div>

        <div className="saas-stat-card danger-glow">
          <div className="card-top">
            <span className="card-label">Eventos Observados</span>
            <div className="card-icon-container bg-danger-light">
              <FiAlertTriangle className="card-icon text-danger" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{eventosObservados}</h3>
            <span className="card-trend text-red">Devueltos o rechazados</span>
          </div>
        </div>

        <div className="saas-stat-card success-glow">
          <div className="card-top">
            <span className="card-label">Firmas Completadas</span>
            <div className="card-icon-container bg-success-light">
              <FiCheckCircle className="card-icon text-success" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{dictamenesEmitidos}</h3>
            <span className="card-trend text-green">Bóveda digital actualizada</span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DE GRÁFICAS ANALÍTICAS JURÍDICAS ── */}
      <div className="charts-grid-saas" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '24px' }}>
        
        {/* Gráfica 1: Distribución de Carga Jurídica (Donut) */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart style={{ color: '#3b82f6' }} />
                <h4>Estado de Expedientes Legales</h4>
              </div>
              <p>Distribución actual de la carga de trabajo</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px', padding: '10px 0' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader"></div>
              </div>
            ) : pieData.length === 0 ? (
              <div className="no-data-placeholder">No hay datos legales registrados</div>
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

        {/* Gráfica 2: Flujo de Revisiones Legales (Area) */}
        <div className="saas-chart-card">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBarChart2 style={{ color: '#6366f1' }} />
                <h4>Flujo de Revisiones y Dictámenes</h4>
              </div>
              <p>Volumen de contratos evaluados por mes</p>
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
            ) : trendData.length === 0 ? (
              <div className="no-data-placeholder">Sin datos registrados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDictaminados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPendientesLeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                  <Area type="monotone" dataKey="Dictaminados" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorDictaminados)" activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Pendientes" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorPendientesLeg)" activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMELINE Y ACCESOS ── */}
      <div className="dashboard-double-panel" style={{ marginTop: '24px' }}>
        
        {/* PANEL IZQUIERDO: EVENTOS PENDIENTES DE DICTAMEN */}
        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FiFileText className="panel-icon" />
              <div>
                <h4>Revisión Legal Requerida</h4>
                <p>Eventos próximos que necesitan validación de contratos</p>
              </div>
            </div>
            {/* ── CONTROLES DE ORDEN ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px' }}>
              
              {/* Selector: Orden por Fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCalendar style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }} />
                <select
                  id="sort-fecha-legal"
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
                  id="sort-id-legal"
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
                <p>Cargando expedientes legales...</p>
              </div>
            ) : eventosEnProceso.length === 0 ? (
              <div className="empty-panel-state">
                <FiActivity className="icon" />
                <p>No hay eventos pendientes de revisión legal en este momento.</p>
              </div>
            ) : (
              <div className="modern-upcoming-events-list">
                {eventosEnProceso.map((evt) => (
                  <div key={evt.id_evento} className="modern-event-card" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
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
                      <span className="modern-status-badge modern-status-pendiente">
                        Sin Dictamen
                      </span>
                    </div>
                    
                    <div className="modern-event-body">
                      <h5 className="modern-event-title">
                        <span style={{ color: '#94a3b8', fontSize: '13px', marginRight: '8px', fontWeight: '800' }}>#EVT-{evt.id_evento}</span>
                        {evt.nombre}
                      </h5>
                      <div className="modern-event-meta-info" style={{ marginTop: '10px' }}>
                        <div className="modern-meta-item">
                          <FiShield className="modern-meta-icon" />
                          <span>Requiere aval jurídico</span>
                        </div>
                        <div className="modern-meta-item">
                          <FiBriefcase className="modern-meta-icon" />
                          <span>Contrato B2B Pendiente</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modern-event-footer">
                      <button type="button" className="modern-view-btn" title="Ir al Expediente" aria-label="Ir al expediente legal">
                        <span>Revisar Expediente y Dictaminar</span>
                        <FiArrowUpRight className="modern-btn-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: ACCESOS RÁPIDOS */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiShield className="panel-icon" />
            <div>
              <h4>Accesos Rápidos Jurídicos</h4>
              <p>Módulos de evaluación, revisión y carga de contratos</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            
            <div className="quick-actions-list" style={{ marginBottom: '24px' }}>
              <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
                <div className="icon-wrapper"><FiCheck /></div>
                <div className="btn-text">
                  <strong>Evaluación Legal</strong>
                  <span>Ir al Flujo Administrativo</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                <div className="icon-wrapper"><FiCalendar /></div>
                <div className="btn-text">
                  <strong>Calendario Institucional</strong>
                  <span>Revisar Fechas Aprobadas</span>
                </div>
              </div>
            </div>

            <div className="poa-summary-box warning-poa-box" style={{ marginTop: 'auto', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px' }}>
              <div className="poa-progress-header" style={{ marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '700', fontSize: '13.5px' }}>
                  <FiAlertTriangle size={16} /> Protocolo Legal y Cumplimiento
                </span>
              </div>
              <p className="poa-footer-text" style={{ color: '#92400e', fontSize: '12.5px', lineHeight: '1.5', margin: 0 }}>
                Recuerde que ningún suplidor B2B externo puede operar en los recintos de la UAPA sin que previamente la oficina jurídica haya cargado el <strong>"Contrato Firmado"</strong> a la bóveda digital y emitido el dictamen legal <strong>"Aprobado"</strong>. Las auditorías son en tiempo real.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLegal;
