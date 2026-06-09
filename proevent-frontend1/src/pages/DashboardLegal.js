import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiFileText, FiClock, FiActivity, FiArrowUpRight, FiShield, FiAlertTriangle } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function DashboardLegal({ usuario, setActiveTab }) {
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      // Cargamos el listado completo de eventos para calcular los KPIs legales.
      // (Suponiendo que el backend devuelva la info admin, o podemos usar el endpoint genérico /eventos si este rol tiene acceso)
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

  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // KPIs Legales
  // Para simplificar, nos basamos en los eventos que ya están aprobados operativamente (Aprobado, Finalizado)
  // que son los que requerirían un dictamen legal.
  const eventosAprobados = eventRequests.filter((e) => e.estado === "Aprobado" || e.estado === "Finalizado").length;
  
  // Simularemos algunos KPIs si no tenemos acceso al objeto "legal" en este endpoint básico
  // O podemos deducirlo. En una app real, el endpoint devolvería los status legales.
  const contratosPendientes = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const dictamenesEmitidos = eventRequests.filter((e) => e.estado === "Finalizado").length;
  const eventosObservados = 0; // Idealmente filtramos por e.legal?.estado_legal === 'Observado'

  // Proximos eventos que requieren atención legal
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
                  <div key={evt.id_evento} className="modern-event-card" onClick={() => setActiveTab("FlujoAdministrativo")}>
                    <div className="modern-event-header">
                      <div className="modern-event-date">
                        <FiClock className="modern-date-icon" />
                        <span>Evento: {formatFechaLarga(evt.fecha_inicio)}</span>
                      </div>
                      <span className="modern-status-badge modern-status-pendiente">
                        Sin Dictamen
                      </span>
                    </div>
                    
                    <div className="modern-event-body">
                      <h5 className="modern-event-title">{evt.nombre}</h5>
                      <div className="modern-event-meta-info" style={{ marginTop: '8px' }}>
                        <div className="modern-meta-item">
                          <FiShield className="modern-meta-icon" />
                          <span>Requiere aval jurídico</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modern-event-footer">
                      <button className="modern-view-btn" title="Ir al Expediente">
                        <span>Revisar Expediente</span>
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
              <p>Módulos de evaluación y contratos</p>
            </div>
          </div>
          <div className="panel-body flex-column-body">
            
            <div className="quick-actions-list">
              <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("FlujoAdministrativo")}>
                <div className="icon-wrapper"><FiShield /></div>
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
            </div>

            <div className="poa-summary-box" style={{ marginTop: '24px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <FiAlertTriangle style={{ color: '#f59e0b', fontSize: '20px' }} />
                <h5 style={{ margin: 0, color: '#334155' }}>Protocolo Legal Activo</h5>
              </div>
              <p className="poa-footer-text" style={{ color: '#475569' }}>
                Recuerde que ningún suplidor B2B externo puede operar en los recintos de la UAPA sin que previamente usted haya cargado el "Contrato Firmado" a la bóveda digital y emitido el dictamen "Aprobado".
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLegal;
