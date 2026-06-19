// ============================================================
// COMPONENTE: DashboardCompras
// Pertenece a: Módulo de Compras / Licitaciones
// Propósito: Panel analítico para el administrador de compras.
// Muestra KPIs logísticos (licitaciones, órdenes de compra, presupuesto)
// y los eventos próximos que requieren adjudicación.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiShoppingCart, FiFileText, FiCheckCircle, FiDollarSign, FiRefreshCw, FiGrid, FiActivity, FiArrowUpRight, FiClock } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function DashboardCompras({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // --- FUNCIÓN: cargarDatos ---
  // Obtiene todos los eventos desde la API para extraer las analíticas
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

  // --- UTILIDADES DE FORMATO ---
  const formatMonedaDOP = (valor) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP"
    }).format(valor);
  };

  const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  // --- CÁLCULOS Y KPIs LOGÍSTICOS ---
  const eventosAprobados = eventRequests.filter((e) => e.estado === "Aprobado" || e.estado === "Finalizado").length;
  // Simulación de cotizaciones basadas en el sistema actual
  const licitacionesAbiertas = eventRequests.filter((e) => e.estado === "Aprobado").length;
  const ocEmitidas = eventRequests.filter((e) => e.estado === "Finalizado").length;

  const totalPresupuestoGeneral = eventRequests
    .filter(e => e.estado === "Aprobado" || e.estado === "Finalizado")
    .reduce((acc, curr) => acc + (parseFloat(curr.monto_poa) || 0), 0);

  // Proximos eventos logísticos
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
      
      {/* 4 CARDS DE ESTADÍSTICAS PREMIUM - ROL COMPRAS */}
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
            <span className="card-trend text-orange">
              Eventos esperando adjudicación
            </span>
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
            <h3>{formatMonedaDOP(totalPresupuestoGeneral)}</h3>
            <span className="card-trend text-purple">Global comprometido POA</span>
          </div>
        </div>
      </div>

      {/* TIMELINE DE ADQUISICIONES Y ACCESOS */}
      <div className="dashboard-double-panel" style={{ marginTop: '24px' }}>
        
        {/* PANEL IZQUIERDO: EVENTOS PENDIENTES DE LOGÍSTICA */}
        <div className="saas-panel-card">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <FiClock className="panel-icon" />
              <div>
                <h4>Requerimientos en Análisis</h4>
                <p>Eventos aprobados próximos que requieren adjudicación</p>
              </div>
            </div>
            <button className="reload-data-btn" onClick={() => cargarDatos()} title="Actualizar datos"><FiRefreshCw /></button>
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
                      <span className="modern-status-badge modern-status-aprobado">
                        Pendiente OC
                      </span>
                    </div>
                    
                    <div className="modern-event-body">
                      <h5 className="modern-event-title">
                        <span style={{ fontSize: '13px', color: '#64748b', marginRight: '6px', fontWeight: 'bold' }}>#EVT-{evt.id_evento}</span>
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
                      <button className="modern-view-btn" title="Ir al Flujo de Compras">
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

        {/* PANEL DERECHO: ACCESOS DE COMPRAS */}
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
