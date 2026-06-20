// ============================================================
// COMPONENTE: DashboardLegal
// Pertenece a: Módulo Dashboards Principales
// Propósito: Pantalla de inicio exclusiva para el Administrador Legal.
// Muestra indicadores clave (contratos pendientes, dictámenes),
// alertas de eventos observados y accesos directos al flujo administrativo.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiFileText, FiClock, FiActivity, FiArrowUpRight, FiShield, FiAlertTriangle, FiCalendar, FiBriefcase, FiFilter, FiCheck, FiRefreshCw } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function DashboardLegal({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]); // Lista de eventos aprobados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");      // Orden de los próximos eventos

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
  // Formatea la fecha para mostrar el día completo y mes en texto
  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- KPIs y Estadísticas (Simuladas/Calculadas) ---
  const eventosAprobados = eventRequests.filter((e) => e.estado === "Aprobado" || e.estado === "Finalizado").length;
  
  // Contratos pendientes asumen que eventos "Aprobados" necesitan contrato
  const contratosPendientes = eventRequests.filter((e) => e.estado === "Aprobado").length;
  // Dictámenes asumimos que están "Finalizados"
  const dictamenesEmitidos = eventRequests.filter((e) => e.estado === "Finalizado").length;
  const eventosObservados = 0; // Podría leerse de e.legal?.estado_legal

  // --- FUNCIÓN DE ORDENAMIENTO ---
  // Obtiene los eventos en progreso/aprobados ordenados por proximidad de fecha
  const eventosEnProceso = eventRequests
    .filter(e => e.estado === "Aprobado")
    .sort((a, b) => {
      const dateA = new Date(a.fecha_inicio);
      const dateB = new Date(b.fecha_inicio);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="saas-dashboard-container fade-in">
      
      {/* CARDS DE ESTADÍSTICAS PREMIUM - ROL LEGAL */}
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
            <span className="card-trend text-red">Devueltos por legal</span>
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

      {/* TIMELINE Y ACCESOS */}
      <div className="dashboard-double-panel">
        
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="saas-select"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#475569', backgroundColor: '#fff', cursor: 'pointer', outline: 'none' }}
              >
                <option value="asc">Más próximos (Asc)</option>
                <option value="desc">Más lejanos (Desc)</option>
              </select>
              <button className="reload-data-btn" onClick={() => cargarDatos()} title="Actualizar datos"><FiRefreshCw /></button>
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
                            <span>{evt.hora_inicio}</span>
                          </>
                        )}
                      </div>
                      <span className="modern-status-badge modern-status-pendiente">
                        Sin Dictamen
                      </span>
                    </div>
                    
                    <div className="modern-event-body">
                      <h5 className="modern-event-title">{evt.nombre}</h5>
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
                      <button className="modern-view-btn" title="Ir al Expediente">
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
              <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
                <div className="icon-wrapper"><FiFileText /></div>
                <div className="btn-text">
                  <strong>Bóveda Digital</strong>
                  <span>Subir Contratos Firmados</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                <div className="icon-wrapper"><FiCalendar /></div>
                <div className="btn-text">
                  <strong>Calendario Institucional</strong>
                  <span>Revisar Fechas Aprobadas</span>
                </div>
              </div>
              <div className="quick-action-btn premium-btn-green" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
                <div className="icon-wrapper"><FiFilter /></div>
                <div className="btn-text">
                  <strong>Filtro de Expedientes</strong>
                  <span>Auditar Casos Observados</span>
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
