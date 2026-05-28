import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiArrowUpRight, FiDollarSign, FiPlus, FiGrid, FiActivity, FiStar, FiMonitor, FiEye } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function DashboardHome({ usuario, searchTerm = "", onEditEvent, setActiveTab }) {
  const [eventRequests, setEventRequests] = useState([]);
  const [avRequests, setAvRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null); // Para tooltips interactivos de SVG

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const eventUrl = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/eventos`;
      const avUrl = usuario?.rol === "Solicitante" 
        ? `${API}/audiovisual?usuario_id=${usuario.id_usuario}`
        : `${API}/audiovisual`;

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
      setError("No se pudo establecer conexi├│n con el servidor ProEvent.");
      import("react-hot-toast").then((module) => {
        module.toast.error("Error al conectar con el servidor.");
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Helper de formato monetario
  const formatMonedaDOP = (valor) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP"
    }).format(valor);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "ΓÇö";
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

  // C├ílculos estad├¡sticos
  const totalSolicitudes = eventRequests.length;
  const pendientes = eventRequests.filter((e) => e.estado === "Pendiente").length;
  const aprobados = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const finalizados = eventRequests.filter((e) => e.estado === "Finalizado").length;

  const totalPresupuestoUtilizado = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Finalizado")
    .reduce((acc, curr) => acc + (parseFloat(curr.monto_poa) || 0), 0);

  // Estado general (Donut)

  const statusData = [
    { name: "Pendientes", value: pendientes, color: "#f59e0b" },
    { name: "Aprobados", value: aprobados, color: "#3b82f6" },
    { name: "Finalizados", value: finalizados, color: "#10b981" },
    { name: "Rechazados", value: eventRequests.filter(e => e.estado === "Rechazado").length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  const venueBudgets = {};
  eventRequests.forEach(req => {
    if (req.estado === "Aprobado" || req.estado === "Finalizado") {
      const recinto = req.recinto || "Otros";
      const monto = parseFloat(req.monto_poa) || 0;
      venueBudgets[recinto] = (venueBudgets[recinto] || 0) + monto;
    }
  });

  const venueData = Object.entries(venueBudgets).map(([name, value]) => ({
    name: name.replace(" Sede ", "").replace(" Oriental", "").replace(" Santo Domingo", "SD"),
    value
  })).sort((a, b) => b.value - a.value);

  const maxBudget = Math.max(...venueData.map(v => v.value), 10000);

  // Obtener los pr├│ximos 5 eventos activos
  const proximosEventos = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Pendiente")
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 5);

  return (
    <div className="saas-dashboard-container fade-in">
      
      {/* 4 CARDS DE ESTAD├ìSTICAS PREMIUM */}
      <div className="stats-cards-grid">
        <div className="saas-stat-card primary-glow" onClick={() => setActiveTab && setActiveTab("GestionEventos")}>
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

        <div className="saas-stat-card warning-glow" onClick={() => setActiveTab && setActiveTab("GestionEventos")}>
          <div className="card-top">
            <span className="card-label">Eventos Pendientes</span>
            <div className="card-icon-container bg-warning-light">
              <FiClock className="card-icon text-warning" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>{pendientes}</h3>
            <span className="card-trend text-orange">Revisi├│n requerida</span>
          </div>
        </div>

        <div className="saas-stat-card success-glow" onClick={() => setActiveTab && setActiveTab("GestionEventos")}>
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

        <div className="saas-stat-card budget-glow" onClick={() => setActiveTab && setActiveTab("PoaAdmin")}>
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

      {/* SECCI├ôN ANAL├ìTICA - GR├üFICOS NATIVOS INTERACTIVOS */}
      <div className="charts-grid-saas">
        
        {/* CHART 1: ESTADO DE SOLICITUDES (SVG DONUT CHART) */}
        <div className="saas-chart-card saas-donut-card">
          <div className="chart-header">
            <div>
              <h4>Distribuci├│n de Estados</h4>
              <p>Porcentajes de aprobaci├│n actuales</p>
            </div>
          </div>
          <div className="chart-wrapper donut-center" style={{ height: '240px' }}>
            {loading ? (
              <div className="loading-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="loader" style={{ marginBottom: '10px' }}></div>
                <p>Cargando distribuci├│n...</p>
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
              <p>Inversi├│n financiera en eventos por campus de la UAPA (en DOP)</p>
            </div>
            <button className="reload-data-btn" onClick={cargarDatos} title="Sincronizar datos"><FiRefreshCw /></button>
          </div>
          
          <div className="budget-chart-layout">
            {/* Visualizaci├│n descriptiva del presupuesto */}
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

            {/* El gr├ífico SVG */}
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
                    const shortName = v.name.length > 10 ? v.name.substring(0, 9) + 'ΓÇª' : v.name;
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

      {/* TIMELINE DE EVENTOS Y PANEL DE ACCIONES R├üPIDAS */}
      <div className="dashboard-double-panel">
        
        {/* PANEL IZQUIERDO: TIMELINE PR├ôXIMOS EVENTOS */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiCalendar className="panel-icon" />
            <div>
              <h4>Pr├│ximos Eventos en Agenda</h4>
              <p>Eventos aprobados y pendientes programados pr├│ximamente</p>
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
              <div className="upcoming-events-list">
                {proximosEventos.map((evt) => {
                  const dateParts = formatFecha(evt.fecha_inicio).split(' ');
                  const day = dateParts[0] || 'ΓÇö';
                  const month = dateParts[1] || 'ΓÇö';
                  
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
                        <button className="view-quick-btn" title="Ver Ficha T├⌐cnica">
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

        {/* PANEL DERECHO: ACCESOS R├üPIDOS Y AVANCE POA */}
        <div className="saas-panel-card">
          <div className="panel-header">
            <FiGrid className="panel-icon" />
            <div>
              <h4>Accesos R├ípidos y Control POA</h4>
              <p>Atajos de productividad y resumen fiscal</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            
            {/* Atajos r├ípidos (SaaS Premium Buttons) */}
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
                  <span>Ayuda t├⌐cnica</span>
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
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ficha T├⌐cnica del Evento</h3>
              <span className="modal-event-id">Solicitud #EVT-{selectedRequest.id_evento}</span>
            </div>
            <div className="modal-body modern-modal-body">
              <div className="detail-group full-width">
                <label>Nombre del Evento</label>
                <p className="main-event-title">{selectedRequest.nombre}</p>
              </div>
              <div className="detail-group">
                <label>Solicitante</label>
                <p>{selectedRequest.solicitante || "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Dependencia</label>
                <p>{selectedRequest.dependencia || "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Recinto</label>
                <p>{selectedRequest.recinto || "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Modalidad</label>
                <p>{selectedRequest.modalidad || "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Tipo de Evento</label>
                <p>{selectedRequest.tipo_evento || "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Fechas</label>
                <p>
                  {formatFecha(selectedRequest.fecha_inicio)} 
                  {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                </p>
              </div>
              <div className="detail-group">
                <label>Asistentes Esperados</label>
                <p>{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : "ΓÇö"}</p>
              </div>
              <div className="detail-group">
                <label>Presupuesto POA Solicitado</label>
                <p className="poa-monto">
                  {selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || 'DOP'}` : "Sin Presupuesto POA"}
                </p>
              </div>
              <div className="detail-group">
                <label>Estado de la Solicitud</label>
                <span className={`status ${getStatusClass(selectedRequest.estado)}`} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                  {selectedRequest.estado || "Pendiente"}
                </span>
              </div>
              {selectedRequest.detalles_corporativos && (
                <div className="detail-group full-width">
                  <label>Servicios de Montaje Corporativo</label>
                  <p className="details-list-text">{selectedRequest.detalles_corporativos}</p>
                </div>
              )}
              {selectedRequest.alimentos && (
                <div className="detail-group full-width">
                  <label>Servicio de Alimentos (Catering)</label>
                  <p className="details-list-text">{selectedRequest.alimentos}</p>
                </div>
              )}
              <div className="detail-group full-width">
                <label>Equipos Audiovisuales Requeridos</label>
                <p className="details-list-text">
                  {selectedRequest.necesita_audiovisual 
                    ? (selectedRequest.equipos_audiovisuales || "S├¡ (Pendiente/Sin Especificar)") 
                    : "Ninguno"}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={closeModal}>Cerrar ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
