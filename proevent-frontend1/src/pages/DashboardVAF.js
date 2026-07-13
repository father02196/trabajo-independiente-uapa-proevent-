// ============================================================
// COMPONENTE: DashboardVAF
// Pertenece a: Módulo Financiero / VAF
// Propósito: Panel global del presupuesto (Plan Operativo Anual).
// Resume los fondos totales, disponibles, y retenidos.
// Rediseñado con un estilo SaaS minimalista, moderno y profesional.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPieChart, FiTrendingDown, FiClock, FiActivity, FiArrowRight, FiCalendar, FiStar, FiChevronRight, FiAlertCircle, FiTrendingUp } from "react-icons/fi";
import "./../css/Dashboard.css";

const API = "http://localhost:8080";

export default function DashboardVAF({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [poaSummary, setPoaSummary] = useState({
    monto_total: 0,
    monto_disponible: 0,
    eventos_pendientes: 0,
    monto_rechazado: 0
  });
  const [movimientos, setMovimientos] = useState([]);
  const [pendientesList, setPendientesList] = useState([]);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    fetch(`${API}/poa`)
      .then(res => res.json())
      .then(data => {
        const poa = data.poas && data.poas.length > 0 ? data.poas[0] : { monto_total: 0, monto_disponible: 0 };
        const movs = data.movimientos || [];
        
        // Calcular estadísticas
        const pendientes = movs.filter(m => m.estado === 'Pendiente').length;
        const rechazados = movs.filter(m => m.estado === 'Rechazado').reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);
        
        setPoaSummary({
          monto_total: Number(poa.monto_total),
          monto_disponible: Number(poa.monto_disponible),
          eventos_pendientes: pendientes,
          monto_rechazado: rechazados
        });

        // Filtrar y ordenar movimientos para Fila 2 y Fila 3
        const listPendientes = movs
          .filter(m => m.estado === 'Pendiente')
          .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
          .slice(0, 5); // Tomar solo los úúúltimos 5
          
        setPendientesList(listPendientes);
        setMovimientos(movs.slice(0, 5)); // ├Üúúltimos 5 movimientos generales
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatMoneda = (monto) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP"
    }).format(monto);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "ΓÇö";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (estado) => {
    const baseStyle = { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', display: 'inline-block' };
    if (estado === 'Pendiente') return <span style={{ ...baseStyle, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>En Evaluación</span>;
    if (estado === 'Aprobado') return <span style={{ ...baseStyle, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Aprobado</span>;
    if (estado === 'Rechazado') return <span style={{ ...baseStyle, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>Rechazado</span>;
    return <span style={{ ...baseStyle, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>{estado}</span>;
  };

  return (
    <div className="animate-fade" style={{ fontFamily: '"Inter", sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#0f172a' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0, letterSpacing: '-0.02em' }}>
            Panel Financiero VAF
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px", margin: "6px 0 0 0" }}>
            Resumen en tiempo real del Plan Operativo Anual (POA) de la UAPA.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {/* FILA 1: KPIs con estilos unificados y glow */}
          <div className="stats-cards-grid" style={{ marginBottom: '32px' }}>
            <div className="saas-stat-card primary-glow">
              <div className="card-top">
                <span className="card-label">Presupuesto POA Anual</span>
                <div className="card-icon-container bg-primary-light">
                  <FiPieChart className="card-icon text-primary" />
                </div>
              </div>
              <div className="card-bottom">
                <h3>{formatMoneda(poaSummary.monto_total)}</h3>
                <span className="card-trend text-blue">Fondo consolidado UAPA</span>
              </div>
            </div>

            <div className="saas-stat-card success-glow">
              <div className="card-top">
                <span className="card-label">Fondo Disponible</span>
                <div className="card-icon-container bg-success-light">
                  <FiDollarSign className="card-icon text-success" />
                </div>
              </div>
              <div className="card-bottom">
                <h3>{formatMoneda(poaSummary.monto_disponible)}</h3>
                <span className="card-trend text-green">Balance remanente actual</span>
              </div>
            </div>

            <div className="saas-stat-card warning-glow">
              <div className="card-top">
                <span className="card-label">Pendientes de Evaluación</span>
                <div className="card-icon-container bg-warning-light">
                  <FiClock className="card-icon text-warning" />
                </div>
              </div>
              <div className="card-bottom">
                <h3>{poaSummary.eventos_pendientes}</h3>
                <span className="card-trend text-orange">Solicitudes esperando revisión</span>
              </div>
            </div>

            <div className="saas-stat-card danger-glow">
              <div className="card-top">
                <span className="card-label">Monto Rechazado</span>
                <div className="card-icon-container" style={{ background: '#fee2e2' }}>
                  <FiTrendingDown className="card-icon text-danger" style={{ color: '#b91c1c' }} />
                </div>
              </div>
              <div className="card-bottom">
                <h3>{formatMoneda(poaSummary.monto_rechazado)}</h3>
                <span className="card-trend text-danger" style={{ color: '#b91c1c' }}>Retornado al balance POA</span>
              </div>
            </div>
          </div>

          {/* FILA 2: Operativa Activa (70% - 30%) */}
          <div className="dashboard-double-panel" style={{ marginBottom: '32px' }}>
            
            {/* Panel Izquierdo: Solicitudes Pendientes */}
            <div className="saas-panel-card">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <FiClock className="panel-icon" />
                  <div>
                    <h4>Pendientes de Evaluación</h4>
                    <p>Últimos movimientos del POA que esperan revisión</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }} onClick={() => setActiveTab && setActiveTab("GestionPresupuestaria")}>
                    Ver todas <FiArrowRight />
                  </span>
                </div>
              </div>
              
              <div className="panel-body" style={{ padding: '0' }}>
                {pendientesList.length === 0 ? (
                  <div className="empty-panel-state">
                    <FiActivity className="icon" />
                    <p>No hay solicitudes pendientes.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' }}>Evento</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' }}>Fecha</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' }}>Monto Solicitado</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendientesList.map((mov, i) => (
                          <tr key={i} style={{ borderBottom: i === pendientesList.length - 1 ? 'none' : '1px solid #f8fafc', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                              Evento #{mov.id_evento}
                              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400', marginTop: '4px' }}>{mov.concepto || 'Deducción POA'}</div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{formatFecha(mov.fecha_movimiento)}</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formatMoneda(mov.monto_descontado_dop)}</td>
                            <td style={{ padding: '16px 24px' }}>{getStatusBadge(mov.estado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Panel Derecho: Acciones Rápidas */}
            <div className="saas-panel-card">
              <div className="panel-header">
                <FiActivity className="panel-icon" />
                <div>
                  <h4>Acciones Rápidas</h4>
                  <p>Accesos directos del VAF</p>
                </div>
              </div>
              <div className="panel-body flex-column-body">
                <div className="quick-actions-list">
                  <div className="quick-action-btn premium-btn-blue" onClick={() => setActiveTab && setActiveTab("PoaAdmin")}>
                    <div className="icon-wrapper"><FiDollarSign /></div>
                    <div className="btn-text">
                      <strong>Gestionar POA</strong>
                      <span>Aprobar o rechazar fondos</span>
                    </div>
                  </div>

                  <div className="quick-action-btn premium-btn-purple" onClick={() => setActiveTab && setActiveTab("GestionPresupuestaria")}>
                    <div className="icon-wrapper"><FiTrendingUp /></div>
                    <div className="btn-text">
                      <strong>Gestión Presupuestaria</strong>
                      <span>Historial y control de movimientos financieros</span>
                    </div>
                  </div>

                  <div className="quick-action-btn premium-btn-orange" onClick={() => setActiveTab && setActiveTab("Calendario")}>
                    <div className="icon-wrapper"><FiCalendar /></div>
                    <div className="btn-text">
                      <strong>Calendario Global</strong>
                      <span>Agenda de eventos financiados</span>
                    </div>
                  </div>

                  <div className="quick-action-btn premium-btn-green" onClick={() => setActiveTab && setActiveTab("Soporte")}>
                    <div className="icon-wrapper"><FiAlertCircle /></div>
                    <div className="btn-text">
                      <strong>Centro de Soporte</strong>
                      <span>Ayuda técnica o financiera</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILA 3: Movimientos Recientes */}
          <div className="saas-panel-card">
            <div className="panel-header">
              <FiActivity className="panel-icon" />
              <div>
                <h4>Movimientos Financieros Recientes</h4>
                <p>Historial global de operaciones en el POA</p>
              </div>
            </div>
            <div className="panel-body">
              {movimientos.length === 0 ? (
                <div className="empty-panel-state">
                  <FiActivity className="icon" />
                  <p>No hay movimientos registrados.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {movimientos.map((mov, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: idx !== movimientos.length - 1 ? '16px' : '0', borderBottom: idx !== movimientos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: mov.estado === 'Aprobado' ? '#f0fdf4' : mov.estado === 'Rechazado' ? '#fef2f2' : '#f8fafc',
                          color: mov.estado === 'Aprobado' ? '#16a34a' : mov.estado === 'Rechazado' ? '#dc2626' : '#64748b'
                        }}>
                          {mov.estado === 'Aprobado' ? <FiDollarSign size={16} /> : mov.estado === 'Rechazado' ? <FiTrendingDown size={16} /> : <FiClock size={16} />}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Reserva para Evento #{mov.id_evento}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{formatFecha(mov.fecha_movimiento)} ┬╖ {mov.concepto || 'Sin concepto'}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formatMoneda(mov.monto_descontado_dop)}</p>
                        {getStatusBadge(mov.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
