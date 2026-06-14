// ============================================================
// COMPONENTE: DashboardVAF
// Pertenece a: Módulo Financiero / VAF
// Propósito: Panel global del presupuesto (Plan Operativo Anual).
// Resume los fondos totales, disponibles, y retenidos, brindando 
// acceso a la gestión presupuestaria profunda.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPieChart, FiTrendingDown, FiClock, FiActivity } from "react-icons/fi";
import "./../css/Dashboard.css";

const API = "http://localhost:8080";

export default function DashboardVAF({ usuario }) {
  // --- ESTADOS ---
  const [poaSummary, setPoaSummary] = useState({
    monto_total: 0,
    monto_disponible: 0,
    eventos_pendientes: 0,
    monto_rechazado: 0
  });

  // --- EFECTOS INICIALES ---
  // Carga el resumen financiero del POA global actual y las solicitudes retenidas
  useEffect(() => {
    // Aquí idealmente haríamos fetch a un endpoint de resumen de VAF.
    // Usaremos datos simulados o del endpoint existente por ahora.
    fetch(`${API}/poa`)
      .then(res => res.json())
      .then(data => {
        const poa = data.poas && data.poas.length > 0 ? data.poas[0] : { monto_total: 0, monto_disponible: 0 };
        const movimientos = data.movimientos || [];
        const pendientes = movimientos.filter(m => m.estado === 'Pendiente').length;
        const rechazados = movimientos.filter(m => m.estado === 'Rechazado').reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);
        
        setPoaSummary({
          monto_total: Number(poa.monto_total),
          monto_disponible: Number(poa.monto_disponible),
          eventos_pendientes: pendientes,
          monto_rechazado: rechazados
        });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Panel Financiero (V-A-F)
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", margin: 0 }}>
          Monitoreo global de presupuesto, métricas del Plan Operativo Anual y asignaciones a eventos.
        </p>
      </div>

      {/* 4 CARDS DE ESTADÍSTICAS PREMIUM - ROL V-A-F */}
      <div className="stats-cards-grid">
        <div className="saas-stat-card primary-glow">
          <div className="card-top">
            <span className="card-label">Presupuesto POA Anual</span>
            <div className="card-icon-container bg-primary-light">
              <FiPieChart className="card-icon text-primary" />
            </div>
          </div>
          <div className="card-bottom">
            <h3>RD$ {poaSummary.monto_total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h3>
            <span className="card-trend text-blue">
              Presupuesto consolidado UAPA
            </span>
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
            <h3>RD$ {poaSummary.monto_disponible.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h3>
            <span className="card-trend text-green">
              Balance remanente actual
            </span>
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
            <span className="card-trend text-orange">
              Solicitudes esperando revisión
            </span>
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
            <h3>RD$ {poaSummary.monto_rechazado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h3>
            <span className="card-trend text-danger" style={{ color: '#b91c1c' }}>
              Retornado al balance POA
            </span>
          </div>
        </div>
      </div>

      {/* Accesos Directos Opcionales */}
      <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--color-uapa-navy)", marginBottom: "20px" }}>Acciones Rápidas</h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <div style={{
            padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", flex: "1 1 300px",
            borderLeft: "4px solid #1e40af"
          }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#1e293b" }}>Gestión del POA Global</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Accede al módulo POA para crear años fiscales y aprobar o rechazar fondos para eventos de forma general.</p>
          </div>
          <div style={{
            padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", flex: "1 1 300px",
            borderLeft: "4px solid #059669"
          }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#1e293b" }}>Presupuesto de Eventos</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Ingresa al Flujo Administrativo para revisar los detalles presupuestarios por cada evento particular y subir las certificaciones de fondos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
