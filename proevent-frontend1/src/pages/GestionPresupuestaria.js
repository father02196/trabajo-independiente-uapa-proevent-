// ============================================================
// COMPONENTE: GestionPresupuestaria
// Pertenece a: Módulo de Gestión Administrativa y Financiera (V-A-F)
// Propósito: Permite gestionar operativamente y auditar los
// movimientos presupuestarios, filtrando por fecha, estado y solicitante.
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import "./../css/Dashboard.css";
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiEye, FiFilter, FiSearch, FiTrendingUp, FiActivity, FiX } from "react-icons/fi";

// URL base del API Backend
const API = "http://localhost:8080";

export default function GestionPresupuestaria({ usuario }) {
  // --- ESTADOS DE DATOS PRINCIPALES ---
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading]         = useState(false);

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("desc");

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- ESTADOS DE MODAL DE RECHAZO ---
  const [modalRechazo, setModalRechazo]     = useState(false);
  const [movRechazoId, setMovRechazoId]     = useState(null);
  const [motivoRechazo, setMotivoRechazo]   = useState("");

  // --- ESTADOS DE MODAL DE DETALLES ---
  const [selectedMovDetails, setSelectedMovDetails] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen]   = useState(false);

  // --- FUNCIONES MODAL DE DETALLES ---
  const openModalDetalles = (mov) => {
    setSelectedMovDetails(mov);
    setModalDetallesOpen(true);
  };
  const closeModalDetalles = () => {
    setSelectedMovDetails(null);
    setModalDetallesOpen(false);
  };

  // --- FUNCIONES DE FORMATO ---
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };
  
  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const [h, m] = horaStr.split(":");
    return `${h}:${m}`;
  };

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargarMovimientos();
  }, []);

  // --- FUNCIÓN: cargarMovimientos ---
  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/poa`);
      const data = await res.json();
      setMovimientos(data.movimientos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN: handleCambiarEstado ---
  const handleCambiarEstado = async (id, estado, motivo = null) => {
    try {
      const res = await fetch(`${API}/poa/movimiento/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-usuario-id": usuario?.id_usuario || "" },
        body: JSON.stringify({ estado, motivo_rechazo: motivo })
      });
      if (res.ok) {
        cargarMovimientos();
        if (estado === "Rechazado") {
          setModalRechazo(false);
          setMovRechazoId(null);
          setMotivoRechazo("");
        }
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  // --- LIMPIAR FILTROS ---
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("Todos");
    setFechaDesde("");
    setFechaHasta("");
    setOrdenFecha("desc");
    setCurrentPage(1);
  };

  // --- CÁLCULOS Y FILTROS ---
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(m => {
      // Filtro de búsqueda global
      const matchSearch = searchTerm === "" || 
        m.nombre_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#EVT-${m.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.solicitante?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de Estado
      const matchEstado = filtroEstado === "Todos" || m.estado === filtroEstado;

      // Filtro de Fechas
      let matchFechaDesde = true;
      let matchFechaHasta = true;
      if (fechaDesde) {
        matchFechaDesde = new Date(m.fecha_movimiento) >= new Date(fechaDesde);
      }
      if (fechaHasta) {
        matchFechaHasta = new Date(m.fecha_movimiento) <= new Date(fechaHasta);
      }

      return matchSearch && matchEstado && matchFechaDesde && matchFechaHasta;
    });
  }, [movimientos, searchTerm, filtroEstado, fechaDesde, fechaHasta]);

  const sortedMovimientos = useMemo(() => {
    return [...filteredMovimientos].sort((a, b) => {
      const dateA = new Date(a.fecha_movimiento);
      const dateB = new Date(b.fecha_movimiento);
      return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredMovimientos, ordenFecha]);

  const totalPages = Math.ceil(sortedMovimientos.length / itemsPerPage);

  // Estadísticas Rápidas
  const stats = useMemo(() => {
    const total = movimientos.length;
    const aprobados = movimientos.filter(m => m.estado === 'Aprobado');
    const rechazados = movimientos.filter(m => m.estado === 'Rechazado');
    const pendientes = movimientos.filter(m => m.estado !== 'Aprobado' && m.estado !== 'Rechazado');
    
    const montoAprobado = aprobados.reduce((sum, m) => sum + Number(m.monto_descontado_dop || 0), 0);
    const montoRechazado = rechazados.reduce((sum, m) => sum + Number(m.monto_descontado_dop || 0), 0);

    return {
      total,
      aprobadosCount: aprobados.length,
      rechazadosCount: rechazados.length,
      pendientesCount: pendientes.length,
      montoAprobado,
      montoRechazado
    };
  }, [movimientos]);

  // Restablecer la página si los filtros cambian y exceden las páginas
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sortedMovimientos, currentPage, totalPages]);


  if (usuario?.rol !== "Administrador" && usuario?.rol !== "Administrador V-A-F") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder a la gestión presupuestaria.</div>;
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px'}}>Gestión Presupuestaria</h2>
          <p style={{color: 'var(--text-muted)', fontSize: '14px', margin: 0}}>Auditoría, filtros y seguimiento de todos los movimientos de presupuesto.</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={cargarMovimientos} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-in-out', width: 'auto', padding: '8px 16px', height: 'fit-content' }}
        >
          <FiRefreshCw className={loading ? "spin-animation" : ""} size={16} /> 
          {loading ? "Sincronizando..." : "Sincronizar Datos"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-uapa-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiActivity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Movimientos</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>{stats.total}</div>
          </div>
        </div>
        
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiCheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 600, textTransform: 'uppercase' }}>Aprobados ({stats.aprobadosCount})</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>RD$ {stats.montoAprobado.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          </div>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiXCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#7F1D1D', fontWeight: 600, textTransform: 'uppercase' }}>Rechazados ({stats.rechazadosCount})</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>RD$ {stats.montoRechazado.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        {/* Barra de Filtros */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: '#F8FAFC', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiFilter size={16} color="var(--color-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Filtros de Búsqueda</h3>
            <button onClick={limpiarFiltros} style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-uapa-navy)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <FiX size={14} /> Limpiar Filtros
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Buscar</label>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  type="text" 
                  className="input-base" 
                  placeholder="Evento, ID o solicitante..." 
                  value={searchTerm}
                  onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                  style={{ paddingLeft: '30px', margin: 0, height: '36px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Estado</label>
              <select className="input-base" value={filtroEstado} onChange={(e) => {setFiltroEstado(e.target.value); setCurrentPage(1);}} style={{ margin: 0, height: '36px', fontSize: '13px' }}>
                <option value="Todos">Todos los estados</option>
                <option value="Aprobado">Aprobados</option>
                <option value="Rechazado">Rechazados</option>
                <option value="Pendiente">Pendientes</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Desde</label>
              <input type="date" className="input-base" value={fechaDesde} onChange={(e) => {setFechaDesde(e.target.value); setCurrentPage(1);}} style={{ margin: 0, height: '36px', fontSize: '13px' }} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Hasta</label>
              <input type="date" className="input-base" value={fechaHasta} onChange={(e) => {setFechaHasta(e.target.value); setCurrentPage(1);}} style={{ margin: 0, height: '36px', fontSize: '13px' }} />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Orden por Fecha</label>
              <select className="input-base" value={ordenFecha} onChange={(e) => {setOrdenFecha(e.target.value); setCurrentPage(1);}} style={{ margin: 0, height: '36px', fontSize: '13px' }}>
                <option value="desc">Más recientes (Desc)</option>
                <option value="asc">Más antiguos (Asc)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <table className="modern-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>EVENTO</th>
              <th>SOLICITANTE</th>
              <th>SOLICITUD ORIG.</th>
              <th>DESCUENTO (DOP)</th>
              <th>ESTADO</th>
              <th style={{textAlign: 'center'}}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {sortedMovimientos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(mov => (
              <tr key={mov.id_movimiento} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px', fontSize: '13.5px', color: 'var(--text-muted)' }}>{mov.fecha_movimiento.substring(0, 10)}</td>
                <td style={{ padding: '12px' }}><strong style={{ color: 'var(--color-uapa-navy)', fontSize: '13px' }}>#EVT-{mov.id_evento}</strong><br/><span style={{fontSize: "12px", color: "var(--text-muted)"}}>{mov.nombre_evento}</span></td>
                <td style={{ padding: '12px', fontSize: '13.5px', color: 'var(--text-main)' }}>{mov.solicitante || "N/D"}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-light)' }}>{Number(mov.monto_solicitado_original).toLocaleString("en-US", {minimumFractionDigits: 2})} {mov.moneda_original} <br/><span style={{fontSize: "10px", color: "var(--text-muted)"}}>Tasa: {mov.tasa_cambio}</span></td>
                <td style={{ padding: '12px', fontWeight: '700', color: 'var(--color-error)', fontSize: '13.5px' }}>- RD$ {Number(mov.monto_descontado_dop).toLocaleString("en-US", {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                    background: mov.estado === 'Aprobado' ? 'var(--color-success-light)' : mov.estado === 'Rechazado' ? 'var(--color-error-light)' : 'var(--color-warning-light)',
                    color: mov.estado === 'Aprobado' ? '#065F46' : mov.estado === 'Rechazado' ? '#7F1D1D' : '#92400E'
                  }}>
                    {mov.estado}
                  </span>
                  {mov.estado === 'Rechazado' && mov.motivo_rechazo && (
                    <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px', maxWidth: '150px' }}>Motivo: {mov.motivo_rechazo}</div>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div className="saas-action-group">
                    <button 
                      className="action-icon-btn view" 
                      onClick={() => openModalDetalles(mov)}
                      title="Ver Detalles"
                    >
                      <FiEye size={15} />
                    </button>
                    <button 
                      onClick={() => handleCambiarEstado(mov.id_movimiento, 'Aprobado')} 
                      className={`action-icon-btn approve ${mov.estado === 'Aprobado' ? 'is-active' : ''}`}
                      title="Aprobar Presupuesto"
                    >
                      <FiCheckCircle size={15} />
                    </button>
                    <button 
                      onClick={() => {setMovRechazoId(mov.id_movimiento); setModalRechazo(true);}} 
                      className={`action-icon-btn reject ${mov.estado === 'Rechazado' ? 'is-active' : ''}`}
                      title="Rechazar Presupuesto"
                    >
                      <FiXCircle size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedMovimientos.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No se encontraron movimientos con los filtros actuales.</td></tr>
            )}
          </tbody>
        </table>

        {sortedMovimientos.length > itemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '10px 10px 20px 10px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Anterior
            </button>
            <span style={{ padding: '5px 14px', fontWeight: '700', color: 'var(--color-uapa-navy)', fontSize: '14px' }}>Pág. {currentPage} de {totalPages}</span>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {modalRechazo && (
        <div className="modal-overlay" onClick={() => setModalRechazo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header"><h2>Motivo de Rechazo</h2></div>
            <div className="modal-body" style={{ display: "block", textAlign: "left" }}>
              <p style={{ marginBottom: "12px", color: "var(--text-light)", lineHeight: "1.6", fontSize: "14px" }}>Por favor, indica la razón por la cual se rechaza este presupuesto (el monto descontado de la solicitud se devolverá al balance disponible del año fiscal en este momento).</p>
              <textarea 
                value={motivoRechazo} 
                onChange={e => setMotivoRechazo(e.target.value)} 
                rows="4" 
                className="input-base"
                style={{ resize: "none" }}
                placeholder="Escribe la razón del rechazo aquí..."
              ></textarea>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid var(--color-border)" }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setModalRechazo(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => handleCambiarEstado(movRechazoId, 'Rechazado', motivoRechazo)} 
                disabled={!motivoRechazo.trim()}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDetallesOpen && selectedMovDetails && (
        <div className="modal-overlay" onClick={closeModalDetalles}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Detalles del Evento</h2>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'block', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Nombre del Evento</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.nombre_evento}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>ID Solicitud</label>
                  <p style={{ margin: '5px 0 10px 0' }}>#EVT-{selectedMovDetails.id_evento}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Solicitante</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.solicitante || "—"}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Recinto</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.recinto || "—"}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Modalidad</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.modalidad || "—"}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Tipo de Evento</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.tipo_evento || "—"}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Fechas</label>
                  <p style={{ margin: '5px 0 10px 0' }}>
                    {formatFecha(selectedMovDetails.fecha_inicio)} 
                    {selectedMovDetails.fecha_fin && selectedMovDetails.fecha_fin !== selectedMovDetails.fecha_inicio ? ` - ${formatFecha(selectedMovDetails.fecha_fin)}` : ""}
                  </p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Horario</label>
                  <p style={{ margin: '5px 0 10px 0' }}>
                    {selectedMovDetails.hora_inicio ? formatHora(selectedMovDetails.hora_inicio) : "—"} 
                    {selectedMovDetails.hora_fin ? ` a ${formatHora(selectedMovDetails.hora_fin)}` : ""}
                  </p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Asistentes</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{selectedMovDetails.cantidad_asistentes || "—"}</p>
                </div>
                <div className="detail-group">
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', display: 'block' }}>Presupuesto Original</label>
                  <p style={{ margin: '5px 0 10px 0' }}>{Number(selectedMovDetails.monto_solicitado_original).toLocaleString()} {selectedMovDetails.moneda_original}</p>
                </div>
                <div className="detail-group" style={{ gridColumn: 'span 2', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e40af', display: 'block' }}>Descuento Final (DOP)</label>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>RD$ {Number(selectedMovDetails.monto_descontado_dop).toLocaleString("en-US", {minimumFractionDigits: 2})}</p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>Tasa aplicada: ${selectedMovDetails.tasa_cambio}</p>
                </div>
                {selectedMovDetails.estado === 'Rechazado' && selectedMovDetails.motivo_rechazo && (
                  <div className="detail-group" style={{ gridColumn: 'span 2', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#dc2626', display: 'block' }}>Motivo de Rechazo</label>
                    <p style={{ margin: '5px 0 0 0', color: '#b91c1c' }}>{selectedMovDetails.motivo_rechazo}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button className="btn btn-secondary" onClick={closeModalDetalles}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
