// ============================================================
// MÓDULO POA ADMIN - Administración del Plan Operativo Anual
// Pertenece a: Módulo de Gestión Administrativa y Financiera (V-A-F)
// Propósito: Permite al rol Administrador V-A-F definir el
// presupuesto anual para eventos, ver el balance disponible,
// revisar movimientos (descuentos por eventos aprobados) y 
// aprobar/rechazar cargos al presupuesto de cada solicitud.
// ============================================================

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./../css/Dashboard.css";
import { FiDollarSign, FiCalendar } from "react-icons/fi";

// URL base del API Backend
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: PoaAdmin
// Recibe:
//   - usuario: Objeto del usuario logueado (debe ser admin/VAF)
// ============================================================
export default function PoaAdmin({ usuario }) {
  // --- ESTADOS DE DATOS PRINCIPALES ---
  const [poas, setPoas]               = useState([]); // Arreglo con el POA actual (generalmente uno por año)
  const [movimientos, setMovimientos] = useState([]); // Historial de cargos y descuentos al POA
  const [loading, setLoading]         = useState(false); // Indicador de carga
  
  // --- ESTADOS DE FORMULARIO (Apertura de POA) ---
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const [montoTotal, setMontoTotal]   = useState("");
  const [poaSeleccionado, setPoaSeleccionado] = useState(null);


  // --- EFECTO INICIAL ---
  // Carga los datos del POA y los movimientos al montar el componente
  useEffect(() => {
    cargarPoaData();
  }, []);

  // --- FUNCIÓN: cargarPoaData ---
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

  // --- FUNCIÓN: handleCrearPoa ---
  // Envía los datos del formulario para aperturar un nuevo POA (Año Fiscal)
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
        alert("Presupuesto POA anual guardado con éxito.");
        // Limpia el formulario y recarga datos
        setFechaInicio(""); setFechaFin(""); setMontoTotal("");
        cargarPoaData();
      } else {
        alert("Error al crear POA");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };


  // --- CÁLCULOS Y FILTROS ---
  
  // Extrae el POA actual activo (el primero del array si existe)
  const poaActual = poas.length > 0 ? poas[0] : null;


  // Suma total de dinero salvado/devuelto por rechazos
  const totalRechazado = movimientos
    .filter(m => m.estado === 'Rechazado')
    .reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);

  // --- CONTROL DE ACCESO ---
  // Bloquea render si el usuario no tiene permisos
  if (usuario?.rol !== "Administrador" && usuario?.rol !== "Administrador V-A-F") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder al módulo POA.</div>;
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px'}}>Plan Operativo Anual (POA)</h2>
          <p style={{color: 'var(--text-muted)', fontSize: '14px'}}>Administración de fondos y aprobaciones de presupuesto para eventos.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="poa-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px'}}>Aperturar Año Fiscal POA</h3>
          <form onSubmit={handleCrearPoa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input type="date" className="input-base" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Fecha de Término</label>
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
              <p>No hay un año fiscal registrado aún.</p>
            </div>
          )}
        </div>
      </div>

      <div className="poa-card" style={{ marginTop: '24px', padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px'}}>Historial de Años Fiscales del POA</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-soft)' }}>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Año Fiscal</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Fecha de Inicio</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Fecha de Término</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Presupuesto Aprobado</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Presupuesto Disponible</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Descripción</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {poas.map((poa, index) => {
                const isActive = index === 0;
                const year = poa.fecha_inicio ? poa.fecha_inicio.substring(0, 4) : 'N/A';
                return (
                  <tr key={poa.id_poa} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 600 }}>{year}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{poa.fecha_inicio ? poa.fecha_inicio.substring(0, 10) : ''}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{poa.fecha_fin ? poa.fecha_fin.substring(0, 10) : ''}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 600 }}>RD$ {Number(poa.monto_total).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 600 }}>RD$ {Number(poa.monto_disponible).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td style={{ padding: '12px' }}>
                      {isActive ? (
                        <span style={{ padding: '4px 8px', background: 'var(--success-bg, #D1FAE5)', color: 'var(--success, #059669)', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Activo</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'var(--bg-subtle, #F3F4F6)', color: 'var(--text-muted, #6B7280)', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Cerrado</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {poa.descripcion || `Presupuesto correspondiente al año fiscal ${year}`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => setPoaSeleccionado(poa)} className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-soft)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                );
              })}
              {poas.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay registros de años fiscales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {poaSeleccionado && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => setPoaSeleccionado(null)}>
          <style>
            {`
              @keyframes modalPopPremium {
                0% { opacity: 0; transform: scale(0.95) translateY(20px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
              .premium-modal-vaf {
                animation: modalPopPremium 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .premium-card-hover {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .premium-card-hover:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
              }
              .btn-premium-close {
                transition: all 0.2s ease;
              }
              .btn-premium-close:hover {
                background: var(--bg-subtle, #f3f4f6);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              }
            `}
          </style>

          <div className="premium-modal-vaf modal-content modal-premium" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Encabezado */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px 40px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)', borderBottom: '1px solid var(--border-soft)'}}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <div style={{width: '64px', height: '64px', borderRadius: '18px', background: 'var(--primary-bg, #eff6ff)', color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.2)'}}>
                  <FiDollarSign size={32} />
                </div>
                <div>
                  <h2 style={{fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em'}}>
                    Detalles del Año Fiscal {poaSeleccionado.fecha_inicio ? poaSeleccionado.fecha_inicio.substring(0, 4) : ''}
                  </h2>
                  <p style={{color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px', fontWeight: 500}}>Visión detallada de fondos y asignaciones presupuestarias</p>
                </div>
              </div>
              <button onClick={() => setPoaSeleccionado(null)} className="btn-premium-close" style={{background: 'transparent', border: '1px solid var(--border-soft)', padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px'}}>
                Cerrar
              </button>
            </div>
            
            {/* Contenido */}
            <div style={{padding: '40px', overflowY: 'auto', background: '#fcfcfd'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px'}}>
                
                {/* Tarjeta Presupuesto Total */}
                <div className="premium-card-hover" style={{background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-soft)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                  <div style={{fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)'}}></div>
                    Presupuesto Aprobado
                  </div>
                  <div style={{fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em'}}>
                    <span style={{fontSize: '20px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: 600}}>RD$</span>
                    {Number(poaSeleccionado.monto_total).toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                </div>

                {/* Tarjeta Presupuesto Disponible */}
                <div className="premium-card-hover" style={{background: 'linear-gradient(135deg, var(--success-bg, #ecfdf5) 0%, #ffffff 100%)', padding: '28px', borderRadius: '20px', border: '2px solid var(--success, #10b981)', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)'}}>
                  <div style={{fontSize: '13px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success, #10b981)', boxShadow: '0 0 8px var(--success, #10b981)'}}></div>
                    Presupuesto Disponible
                  </div>
                  <div style={{fontSize: '36px', fontWeight: 800, color: 'var(--success, #059669)', letterSpacing: '-0.03em'}}>
                    <span style={{fontSize: '20px', color: '#059669', opacity: 0.8, marginRight: '4px', fontWeight: 600}}>RD$</span>
                    {Number(poaSeleccionado.monto_disponible).toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                </div>

                {/* Tarjeta de Fechas */}
                <div className="premium-card-hover" style={{background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-soft)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                  <div style={{fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px'}}>Fechas del Periodo</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '14px 20px', borderRadius: '12px'}}>
                      <div style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600}}>Inicio</div>
                      <div style={{fontSize: '15px', fontWeight: 700, color: 'var(--text-main)'}}>{poaSeleccionado.fecha_inicio ? poaSeleccionado.fecha_inicio.substring(0, 10) : ''}</div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '14px 20px', borderRadius: '12px'}}>
                      <div style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600}}>Término</div>
                      <div style={{fontSize: '15px', fontWeight: 700, color: 'var(--text-main)'}}>{poaSeleccionado.fecha_fin ? poaSeleccionado.fecha_fin.substring(0, 10) : ''}</div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Info Extra */}
                <div className="premium-card-hover" style={{background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-soft)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                  <div style={{fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px'}}>Información de Registro</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-soft)'}}>
                      <div style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500}}>ID Registro</div>
                      <div style={{fontSize: '16px', fontWeight: 700, color: 'var(--text-main)'}}>#{poaSeleccionado.id_poa}</div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0'}}>
                      <div style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500}}>Creado por</div>
                      <div style={{fontSize: '16px', fontWeight: 700, color: 'var(--text-main)'}}>{poaSeleccionado.creado_por || 'Sistema'}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
