// ============================================================
// M├ôDULO POA ADMIN - Administraci├│n del Plan Operativo Anual
// Pertenece a: M├│dulo de Gesti├│n Administrativa y Financiera (V-A-F)
// Prop├│sito: Permite al rol Administrador V-A-F definir el
// presupuesto anual para eventos, ver el balance disponible,
// revisar movimientos (descuentos por eventos aprobados) y 
// aprobar/rechazar cargos al presupuesto de cada solicitud.
// ============================================================

import React, { useState, useEffect } from "react";
import "./../css/Dashboard.css";
import { FiDollarSign, FiCalendar } from "react-icons/fi";

// URL base del API Backend
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: PoaAdmin
// Recibe:
//   - usuario: Objeto del usuario logueado (debe ser admin/VAF)
//   - searchTerm: T├⌐rmino de b├║squeda global para filtrar movimientos
// ============================================================
export default function PoaAdmin({ usuario }) {
  // --- ESTADOS DE DATOS PRINCIPALES ---
  const [poas, setPoas]               = useState([]); // Arreglo con el POA actual (generalmente uno por a├▒o)
  const [movimientos, setMovimientos] = useState([]); // Historial de cargos y descuentos al POA
  const [loading, setLoading]         = useState(false); // Indicador de carga
  
  // --- ESTADOS DE FORMULARIO (Apertura de POA) ---
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const [montoTotal, setMontoTotal]   = useState("");


  // --- EFECTO INICIAL ---
  // Carga los datos del POA y los movimientos al montar el componente
  useEffect(() => {
    cargarPoaData();
  }, []);

  // --- FUNCI├ôN: cargarPoaData ---
  // Consulta la API para obtener el resumen del POA y el listado de movimientos
  const cargarPoaData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/poa`);
      const data = await res.json();
      setPoas(data.poas || []);
      setMovimientos(data.movimientos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCI├ôN: handleCrearPoa ---
  // Env├¡a los datos del formulario para aperturar un nuevo POA (A├▒o Fiscal)
  const handleCrearPoa = async (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin || !montoTotal) return;
    try {
      const res = await fetch(`${API}/poa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-usuario-id": usuario?.id_usuario || "" },
        body: JSON.stringify({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, monto_total: montoTotal })
      });
      if (res.ok) {
        alert("Presupuesto POA anual guardado con ├⌐xito.");
        // Limpia el formulario y recarga datos
        setFechaInicio(""); setFechaFin(""); setMontoTotal("");
        cargarPoaData();
      } else {
        alert("Error al crear POA");
      }
    } catch (e) {
      alert("Error de conexi├│n");
    }
  };


  // --- C├üLCULOS Y FILTROS ---
  
  // Extrae el POA actual activo (el primero del array si existe)
  const poaActual = poas.length > 0 ? poas[0] : null;


  // Suma total de dinero salvado/devuelto por rechazos
  const totalRechazado = movimientos
    .filter(m => m.estado === 'Rechazado')
    .reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);

  // --- CONTROL DE ACCESO ---
  // Bloquea render si el usuario no tiene permisos
  if (usuario?.rol !== "Administrador" && usuario?.rol !== "Administrador V-A-F") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder al m├│dulo POA.</div>;
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px'}}>Plan Operativo Anual (POA)</h2>
          <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>Administraci├│n de fondos y aprobaciones de presupuesto para eventos.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="poa-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px'}}>Aperturar A├▒o Fiscal POA</h3>
          <form onSubmit={handleCrearPoa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input type="date" className="input-base" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Fecha de T├⌐rmino</label>
              <input type="date" className="input-base" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Monto Aprobado (DOP)</label>
              <input type="number" className="input-base" step="0.01" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} required placeholder="Ej. 1500000.00" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>Guardar Presupuesto POA</button>
          </form>
        </div>

        <div className="poa-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          {poaActual ? (
            <div style={{ textAlign: 'center' }}>
              <FiDollarSign size={40} color="var(--success)" />
              <h3 style={{ margin: '8px 0 4px 0', color: 'var(--text-main)', fontWeight: 700 }}>Resumen del POA Activo</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Del {poaActual.fecha_inicio.substring(0, 10)} al {poaActual.fecha_fin.substring(0, 10)}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MONTO TOTAL</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>RD$ {Number(poaActual.monto_total).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                </div>
                <div style={{ padding: '14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DISPONIBLE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>RD$ {Number(poaActual.monto_disponible).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                </div>
                <div style={{ padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)', gridColumn: 'span 2', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: '#7F1D1D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SOLICITUDES RECHAZADAS (TOTAL)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>RD$ {totalRechazado.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <FiCalendar size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p>No hay un a├▒o fiscal registrado a├║n.</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
