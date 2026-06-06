import React, { useState, useEffect } from "react";
import "./../css/Dashboard.css";
import { FiCheckCircle, FiXCircle, FiDollarSign, FiCalendar, FiRefreshCw, FiEye } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

const API = "http://localhost:8080";

export default function PoaAdmin({ usuario, searchTerm = "" }) {
  const [poas, setPoas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [montoTotal, setMontoTotal] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalRechazo, setModalRechazo] = useState(false);
  const [movRechazoId, setMovRechazoId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const [selectedMovDetails, setSelectedMovDetails] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);

  const openModalDetalles = (mov) => {
    setSelectedMovDetails(mov);
    setModalDetallesOpen(true);
  };
  const closeModalDetalles = () => {
    setSelectedMovDetails(null);
    setModalDetallesOpen(false);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };
  
  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const [hora, min] = horaStr.split(':');
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${min} ${ampm}`;
  };

  useEffect(() => {
    cargarPoaData();
  }, []);

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
        setFechaInicio(""); setFechaFin(""); setMontoTotal("");
        cargarPoaData();
      } else {
        alert("Error al crear POA");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const handleCambiarEstado = async (id, estado, motivo = null) => {
    try {
      const res = await fetch(`${API}/poa/movimiento/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-usuario-id": usuario?.id_usuario || "" },
        body: JSON.stringify({ estado, motivo_rechazo: motivo })
      });
      if (res.ok) {
        cargarPoaData();
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

  const poaActual = poas.length > 0 ? poas[0] : null;

  const filteredMovimientos = movimientos.filter(m => {
    return searchTerm === "" || 
      m.nombre_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#EVT-${m.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.solicitante?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const { items: sortedMovimientos, requestSort, sortConfig } = useSortableData(filteredMovimientos, { key: 'fecha_movimiento', direction: 'descending' });

  const totalPages = Math.ceil(sortedMovimientos.length / itemsPerPage);

  const totalRechazado = movimientos
    .filter(m => m.estado === 'Rechazado')
    .reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);

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
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={cargarPoaData} 
          disabled={loading}
        >
          <FiRefreshCw /> {loading ? "Actualizando..." : "Actualizar"}
        </button>
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

      <div className="table-container" style={{ marginTop: '24px' }}>
        <div style={{padding: '16px 16px 0 16px'}}>
          <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--text-main)'}}>Historial de Movimientos y Solicitudes del POA</h3>
        </div>
        <table className="modern-table" style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <SortableHeader label="FECHA" sortKey="fecha_movimiento" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="EVENTO" sortKey="nombre_evento" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="SOLICITANTE" sortKey="solicitante" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="SOLICITUD ORIG." sortKey="monto_solicitado_original" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="DESCUENTO (DOP)" sortKey="monto_descontado_dop" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="ESTADO" sortKey="estado" sortConfig={sortConfig} requestSort={requestSort} />
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
                      className="saas-action-btn saas-btn-view" 
                      onClick={() => openModalDetalles(mov)}
                      title="Ver Detalles"
                    >
                      <FiEye size={15} />
                    </button>
                    <button 
                      onClick={() => handleCambiarEstado(mov.id_movimiento, 'Aprobado')} 
                      className={`saas-action-btn saas-btn-approve ${mov.estado === 'Aprobado' ? 'is-active' : ''}`}
                      title="Aprobar Presupuesto"
                    >
                      <FiCheckCircle size={15} />
                    </button>
                    <button 
                      onClick={() => {setMovRechazoId(mov.id_movimiento); setModalRechazo(true);}} 
                      className={`saas-action-btn saas-btn-reject ${mov.estado === 'Rechazado' ? 'is-active' : ''}`}
                      title="Rechazar Presupuesto"
                    >
                      <FiXCircle size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No hay movimientos en el POA registrado.</td></tr>
            )}
          </tbody>
        </table>

        {movimientos.length > itemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Anterior
            </button>
            <span style={{ padding: '5px 14px', fontWeight: '700', color: 'var(--color-uapa-navy)', fontSize: '14px' }}>Pág. {currentPage} de {Math.ceil(movimientos.length / itemsPerPage)}</span>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage * itemsPerPage >= movimientos.length} 
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
              <h2>Detalles del Evento en POA</h2>
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
