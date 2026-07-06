// ============================================================
// DASHBOARD HOME - Panel Principal de Inicio
// Pertenece a: Módulo de Inicio (ProEvent)
// Propósito: Muestra las estadísticas generales del sistema,
// un gráfico Donut (estados de solicitudes), un gráfico de
// barras SVG (presupuesto por recinto), el timeline de
// próximos eventos y los accesos rápidos del usuario.
// Adaptado por rol: Solicitante solo ve sus propios eventos.
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Iconos de Feather Icons para tarjetas, gráficos y acciones
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiArrowUpRight, FiDollarSign, FiPlus, FiGrid, FiActivity, FiStar, FiMonitor, FiEye, FiEdit2 } from "react-icons/fi";

// Estilos del panel principal compartidos
import './../css/Dashboard.css';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: DashboardHome
// Recibe:
//   - usuario: objeto del usuario logueado (con rol e id)
//   - searchTerm: texto de búsqueda global (opcional)
//   - onEditEvent: callback para navegar al formulario de edición
//   - setActiveTab: función para cambiar la pestaña activa del Dashboard
// ============================================================
function DashboardHome({ usuario, searchTerm = "", onEditEvent, setActiveTab }) {

  // --- ESTADOS DE DATOS ---
  const [eventRequests, setEventRequests] = useState([]);   // Lista de eventos cargados del servidor
  const [avRequests, setAvRequests] = useState([]);         // Lista de solicitudes audiovisuales
  const [loading, setLoading] = useState(true);            // Indicador de carga inicial
  const [error, setError] = useState("");                   // Mensaje de error de conexión

  // --- ESTADOS DEL MODAL ---
  const [selectedRequest, setSelectedRequest] = useState(null); // Evento activo en el modal de detalle
  const [isModalOpen, setIsModalOpen] = useState(false);        // Controla visibilidad del modal
  const [activeTooltip, setActiveTooltip] = useState(null);     // Tooltip flotante sobre barras SVG
  const [sortOrder, setSortOrder] = useState("asc");            // Orden del timeline: "asc" o "desc"

  // --- FUNCIÓN: openModal / closeModal ---
  // Abre el modal de detalle con el evento seleccionado (clic en tarjeta del timeline).
  // closeModal limpia el estado para liberar la referencia del evento.
  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // --- EFECTO: Carga inicial de datos ---
  // Se ejecuta al montar el componente para cargar eventos y AV.
  useEffect(() => {
    cargarDatos();
  }, []);

  // --- EFECTO: Re-carga cuando cambia el usuario ---
  // Si el usuario logueado cambia (ej. sesión expirada y nuevo login),
  // se recarga la data para reflejar el nuevo contexto de rol.
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // --- FUNCIÓN: cargarDatos ---
  // Carga eventos y solicitudes AV del servidor.
  // Adapta las URLs según el rol:
  //   - Solicitante: filtra por su propio usuario (solo ve sus solicitudes)
  //   - Otros roles: obtiene todos los eventos del sistema
  // El parámetro `silent=true` evita mostrar el spinner de carga (para refrescos silenciosos).
  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      // URL adaptada por rol para eventos y AV
      const eventUrl = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/eventos`;
      const avUrl = usuario?.rol === "Solicitante" 
        ? `${API}/audiovisual?usuario_id=${usuario.id_usuario}`
        : `${API}/audiovisual`;

      // Peticiones en paralelo para maximizar velocidad
      const [resEvents, resAV] = await Promise.all([
        fetch(eventUrl).then(r => r.json()),
        fetch(avUrl).then(r => r.json())
      ]);

      if (Array.isArray(resEvents)) {
        setEventRequests(resEvents);
      }
      if (Array.isArray(resAV)) {
        setAvRequests(resAV);
      }
      
      if (!silent && resEvents && resAV) {
        // toast.success("Datos sincronizados"); // Opcional, puede ser molesto cada vez que entra.
      }
    } catch (err) {
      setError("No se pudo establecer conexión con el servidor ProEvent.");
      // Importación dinámica de toast para no agregar dependencia innecesaria si no hay error
      import("react-hot-toast").then((module) => {
        module.toast.error("Error al conectar con el servidor.");
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- FUNCIÓN UTILITARIA: formatMonedaDOP ---
  // Formatea un número como moneda dominicana (RD$) usando la localización es-DO.
  // Ejemplo: 35000 → "RD$35,000.00"
  const formatMonedaDOP = (valor) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP"
    }).format(valor);
  };

  // --- FUNCIÓN UTILITARIA: formatFecha ---
  // Formatea una fecha ISO a formato corto (ej: "15 jun").
  // La corrección de timezone evita el desfase de un día causado por UTC.
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset()); // Corrige offset UTC
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
  };

  // --- FUNCIÓN UTILITARIA: formatFechaLarga ---
  // Formatea una fecha ISO a formato largo para el modal (ej: "15 de junio de 2026").
  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- FUNCIÓN UTILITARIA: getStatusClass ---
  // Devuelve la clase CSS correspondiente al estado del evento,
  // usada para colorear badges en la tabla y el modal.
  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente": return "pending";   // Amarillo
      case "Aprobado":  return "approved";  // Verde
      case "Rechazado": return "rejected";  // Rojo
      case "Finalizado": return "approved"; // Verde (igual que aprobado)
      default: return "pending";
    }
  };

  // --- CÁLCULOS ESTADÍSTICOS ---
  // Contadores derivados del array de eventos para las 4 tarjetas de stats.
  const totalSolicitudes = eventRequests.length;
  const pendientes  = eventRequests.filter((e) => e.estado === "Pendiente").length;
  const aprobados   = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const finalizados = eventRequests.filter((e) => e.estado === "Finalizado").length;

  // Suma del presupuesto POA solo de eventos Aprobados y Finalizados
  const totalPresupuestoUtilizado = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Finalizado")
    .reduce((acc, curr) => acc + (parseFloat(curr.monto_poa) || 0), 0);

  // --- DATOS PARA GRÁFICO DONUT (SVG) ---
  // Cada segmento representa un estado. Se excluyen estados con valor 0
  // para que el donut no muestre segmentos vacíos.
  const statusData = [
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Aprobados",  value: aprobados,  color: "#3b82f6" },
    { name: "Finalizados",value: finalizados, color: "#10b981" },
    { name: "Rechazados", value: eventRequests.filter(e => e.estado === "Rechazado").length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // --- DATOS PARA GRÁFICO DE BARRAS (SVG) ---
  // Agrupa el presupuesto aprobado por recinto para el gráfico de barras.
  // Se acumulan los montos del mismo recinto en un solo bucket.
  const venueBudgets = {};
  eventRequests.forEach(req => {
    if (req.estado === "Aprobado" || req.estado === "Finalizado") {
      const recinto = req.recinto || "Otros";
      const monto = parseFloat(req.monto_poa) || 0;
      venueBudgets[recinto] = (venueBudgets[recinto] || 0) + monto;
    }
  });

  // Abrevia los nombres largos de recintos para los labels del eje X del gráfico
  const venueData = Object.entries(venueBudgets).map(([name, value]) => ({
    name: name.replace(" Sede ", "").replace(" Oriental", "").replace(" Santo Domingo", "SD"),
    value
  })).sort((a, b) => b.value - a.value); // Ordena de mayor a menor para destacar el más activo

  // Altura máxima del eje Y del gráfico de barras (mínimo 10,000 DOP como base)
  const maxBudget = Math.max(...venueData.map(v => v.value), 10000);

  // --- TIMELINE: PRÓXIMOS 5 EVENTOS ---
  // Filtra solo Aprobados y Pendientes, los ordena por fecha según el selector
  // (ascendente = más próximos primero, descendente = más lejanos primero).
  const proximosEventos = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Pendiente")
    .sort((a, b) => {
      const dateA = new Date(a.fecha_inicio);
      const dateB = new Date(b.fecha_inicio);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    })
    .slice(0, 5); // Máximo 5 eventos en el timeline

  return (
    <div className="saas-dashboard-container fade-in">
      
      {/* 4 CARDS DE ESTADÍSTICAS PREMIUM */}
      <div className="stats-cards-grid">
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Solicitudes Totales</span>
            <div className="card-icon-container bg-primary-light">
              <FiFileText className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{totalSolicitudes}</h3>
            <span className="card-trend text-green">
              <FiArrowUpRight /> Activas en el sistema
            </span>
          </div>
        </div>

        <div className="saas-stat-card warning-glow">
          <div className="card-top">
            <span className="card-label">Eventos Pendientes</span>
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
            <span className="card-trend text-green">Listos en agenda</span>
          </div>
        </div>

        <div className="saas-stat-card budget-glow">
          <div className="card-top">
            <span className="card-label">Presupuesto POA Aprobado</span>
            <div className="card-icon-container bg-info-light">
              <FiDollarSign className="card-icon text-info" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{formatMonedaDOP(totalPresupuestoUtilizado)}</h3>
            <span className="card-trend text-purple">Deducido del POA</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN ANALÍTICA - GRÁFICOS NATIVOS INTERACTIVOS */}
      <div className="charts-grid-saas">
        
        {/* CHART 1: ESTADO DE SOLICITUDES (SVG DONUT CHART) */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Distribución de Estados</h4>
              <p>Porcentajes de aprobación actuales</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando distribución...</p>
              </div>
            ) : statusData.length === 0 ? (
              <div className="no-data-placeholder">Sin solicitudes registradas</div>
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
                        const strokeOffset = 251.2 - (accumulatedPercentage * 251.2) + 62.8; // Iniciando arriba
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
                
                <div className="donut-legend" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', width: '100%' }}>
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

        {/* CHART 2: PRESUPUESTO POR RECINTO (SVG BAR CHART) */}
        <div className="saas-chart-card saas-budget-card">
          <div className="chart-header">
            <div>
              <h4>Presupuesto POA Aprobado por Recinto</h4>
              <p>Inversión financiera en eventos por campus de la UAPA (en DOP)</p>
            </div>
            <button type="button" className="reload-data-btn" onClick={cargarDatos} title="Sincronizar datos"><FiRefreshCw /></button>
          </div>
          
          <div className="budget-chart-layout">
            {/* Visualización descriptiva del presupuesto */}
            <div className="budget-summary-panel">
              <div className="budget-total-indicator">
                <span>Total Invertido</span>
                <h3>{formatMonedaDOP(totalPresupuestoUtilizado)}</h3>
              </div>
              <div className="budget-venues-list">
                {venueData.slice(0, 4).map((v, idx) => (
                  <div key={idx} className="budget-venue-item">
                    <div className="venue-indicator" style={{ backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][idx % 4] }}></div>
                    <div className="venue-info">
                      <span className="venue-name">{v.name}</span>
                      <span className="venue-amount">{formatMonedaDOP(v.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* El gráfico SVG */}
            <div className="chart-wrapper budget-svg-wrapper" style={{ height: '240px', position: 'relative' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando presupuesto...</p>
              </div>
            ) : venueData.length === 0 ? (
              <div className="no-data-placeholder">Sin presupuestos aprobados</div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                    <line 
                      key={idx} 
                      x1="40" 
                      y1={170 - ratio * 140} 
                      x2="480" 
                      y2={170 - ratio * 140} 
                      stroke="#f1f5f9" 
                      strokeWidth="1" 
                    />
                  ))}

                  {/* Eje X Labels - solo mostrar nombre corto */}
                  {venueData.map((v, idx) => {
                    const totalBars = venueData.length;
                    const spacing = totalBars <= 1 ? 0 : 420 / (totalBars - 1);
                    const x = 50 + idx * spacing + 15;
                    const shortName = v.name.length > 10 ? v.name.substring(0, 9) + '…' : v.name;
                    return (
                      <text key={idx} x={x} y="190" fill="#94a3b8" fontSize="9" textAnchor="middle">
                        {shortName}
                      </text>
                    );
                  })}

                  {/* Eje Y Labels */}
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = 173 - ratio * 140;
                    const val = ratio * maxBudget;
                    return (
                      <text key={idx} x="30" y={y} fill="#94a3b8" fontSize="9" textAnchor="end">
                        {val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`}
                      </text>
                    );
                  })}

                  {/* Dibujar Barras SVG */}
                  {venueData.map((v, idx) => {
                    const barWidth = Math.min(40, Math.floor(380 / Math.max(venueData.length, 1)) - 10);
                    const totalBars = venueData.length;
                    const spacing = totalBars <= 1 ? 0 : 420 / (totalBars - 1);
                    const x = 50 + idx * spacing - barWidth / 2 + 15;
                    const barHeight = (v.value / maxBudget) * 140;
                    const y = 170 - barHeight;
                    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
                    const barColor = colors[idx % colors.length];

                    return (
                      <g key={idx}
                     onMouseEnter={() => setActiveTooltip({ type: 'budget', id: idx, x: x + barWidth/2, y, label: `${v.name}: ${formatMonedaDOP(v.value)}` })}
                         onMouseLeave={() => setActiveTooltip(null)}
                         style={{ cursor: 'pointer' }}
                      >
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={Math.max(barHeight, 2)} 
                          fill={barColor} 
                          rx="5" 
                          ry="5"
                          style={{ transition: 'all 0.3s' }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip flotante interactivo para Barras */}
                {activeTooltip && activeTooltip.type === 'budget' && (
                  <div style={{
                    position: 'absolute',
                    left: `${(activeTooltip.x / 500) * 100}%`,
                    top: `${(activeTooltip.y / 200) * 100 - 15}%`,
                    transform: 'translate(-50%, -100%)',
                    background: '#0f172a',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    zIndex: 10
                  }}>
                    {activeTooltip.label}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE DE EVENTOS Y PANEL DE ACCIONES RÁPIDAS */}
      <div className="dashboard-double-panel">
        
        {/* PANEL IZQUIERDO: TIMELINE PRÓXIMOS EVENTOS */}
        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FiCalendar className="panel-icon" />
              <div>
                <h4>Próximos Eventos en Agenda</h4>
                <p>Eventos aprobados y pendientes programados próximamente</p>
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
              <button type="button" className="reload-data-btn" onClick={() => cargarDatos()} title="Actualizar datos"><FiRefreshCw /></button>
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
                <p>No hay eventos activos programados.</p>
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
                              <span>{evt.hora_inicio.substring(0, 5)}</span>
                            </>
                          )}
                        </div>
                        <span className={`modern-status-badge modern-status-${evt.estado?.toLowerCase() || 'pendiente'}`}>
                          {evt.estado || 'Pendiente'}
                        </span>
                      </div>
                      
                      <div className="modern-event-body">
                        <h5 className="modern-event-title">
                          <span style={{ fontSize: '13px', color: '#64748b', marginRight: '6px', fontWeight: 'bold' }}>#EVT-{evt.id_evento}</span>
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
                        <button type="button" className="modern-view-btn" title="Ver detalles del evento">
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

        {/* PANEL DERECHO: ACCESOS RÁPIDOS Y AVANCE POA */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiGrid className="panel-icon" />
            <div>
              <h4>Accesos Rápidos y Control POA</h4>
              <p>Atajos de productividad y resumen fiscal</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            
            {/* Atajos rápidos (SaaS Premium Buttons) */}
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
                  <span>Reserva de equipos audiovisuales</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                <div className="icon-wrapper"><FiCalendar /></div>
                <div className="btn-text">
                  <strong>Ver Agenda</strong>
                  <span>Calendario de actividades</span>
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

            {/* Avance presupuesto POA */}
            <div className="poa-summary-box">
              <div className="poa-progress-header">
                <span>Avance de Presupuesto Consumido</span>
                <strong>{formatMonedaDOP(totalPresupuestoUtilizado)}</strong>
              </div>
              <div className="poa-progress-bar-container">
                <div className="poa-progress-bar-fill" style={{ width: '42%' }}></div>
              </div>
              <p className="poa-footer-text">El presupuesto actual refleja los eventos categorizados como Aprobados y Finalizados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLES DEL EVENTO */}
      {isModalOpen && selectedRequest && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica del Evento</h3>
                <span className="modal-subtitle">Resumen general y estado de logística</span>
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
                    <FiStar size={14} /> Presupuesto y Estado
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
            
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {usuario?.rol === "Solicitante" && selectedRequest.estado !== "Aprobado" && selectedRequest.estado !== "Finalizado" && onEditEvent && (
                  <button type="button" className="btn btn-primary" onClick={() => { closeModal(); onEditEvent(selectedRequest); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiEdit2 /> Editar Evento
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DashboardHome;
