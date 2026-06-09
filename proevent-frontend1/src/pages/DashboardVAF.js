import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPieChart, FiTrendingDown, FiClock, FiActivity } from "react-icons/fi";
import "./../css/Dashboard.css";

const API = "http://localhost:8080";

export default function DashboardVAF({ usuario }) {
  const [poaSummary, setPoaSummary] = useState({
    monto_total: 0,
    monto_disponible: 0,
    eventos_pendientes: 0,
    monto_rechazado: 0
  });

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
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>
          Panel Financiero (V-A-F)
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "15px", marginTop: "5px" }}>
          Monitoreo global de presupuesto, métricas del Plan Operativo Anual y asignaciones a eventos.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* KPI: Presupuesto Anual Total */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "10px", borderRadius: "12px" }}>
                <FiPieChart size={24} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>
                Presupuesto POA Anual
              </h3>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "800" }}>
              RD$ {poaSummary.monto_total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ position: "absolute", right: "-10%", bottom: "-20%", opacity: 0.1 }}>
            <FiDollarSign size={150} />
          </div>
        </div>

        {/* KPI: Fondo Disponible */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "12px" }}>
              <FiActivity size={24} />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Fondo Disponible
            </h3>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#166534" }}>
            RD$ {poaSummary.monto_disponible.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", fontWeight: "500" }}>
            Balance remanente actual
          </div>
        </div>

        {/* KPI: Pendientes de Evaluación */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ background: "#fef3c7", color: "#b45309", padding: "10px", borderRadius: "12px" }}>
              <FiClock size={24} />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pendientes de Evaluación
            </h3>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#b45309" }}>
            {poaSummary.eventos_pendientes}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", fontWeight: "500" }}>
            Solicitudes de eventos esperando revisión
          </div>
        </div>

        {/* KPI: Rechazados */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "12px" }}>
              <FiTrendingDown size={24} />
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Monto Rechazado
            </h3>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#b91c1c" }}>
            RD$ {poaSummary.monto_rechazado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", fontWeight: "500" }}>
            Retornado al balance POA
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
