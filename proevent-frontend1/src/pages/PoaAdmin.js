import React, { useState, useEffect } from "react";
import "./../css/Dashboard.css";
import { FiCheckCircle, FiXCircle, FiDollarSign, FiCalendar, FiRefreshCw, FiEye } from "react-icons/fi";

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

  const totalRechazado = movimientos
    .filter(m => m.estado === 'Rechazado')
    .reduce((sum, m) => sum + Number(m.monto_descontado_dop), 0);

  if (usuario?.rol !== "Administrador" && usuario?.rol !== "Administrador V-A-F") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder al módulo POA.</div>;
  }

  return (
    <div className="tab-content fade-in">
      <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Plan Operativo Anual (POA)</h2>
          <p>Administración de fondos y aprobaciones de presupuesto para eventos.</p>
        </div>
        <button 
          type="button" 
          onClick={cargarPoaData} 
          disabled={loading}
          style={{ 
            padding: '10px 18px', 
            borderRadius: '6px', 
            background: '#1e40af', 
            color: 'white', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            opacity: loading ? 0.7 : 1
          }}
        >
          <FiRefreshCw /> {loading ? "Actualizando..." : "Actualizar Información"}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div className="av-card" style={{ flex: 1 }}>
          <h3>Aperturar Año Fiscal POA</h3>
          <form onSubmit={handleCrearPoa} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Fecha de Inicio</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Fecha de Término</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Monto Aprobado (DOP)</label>
              <input type="number" step="0.01" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} required placeholder="Ej. 1500000.00" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>Guardar Presupuesto POA</button>
          </form>
        </div>

        <div className="av-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          {poaActual ? (
            <div style={{ textAlign: 'center' }}>
              <FiDollarSign size={40} color="#16a34a" />
              <h3 style={{ margin: "5px 0", color: "#334155" }}>Resumen del POA Activo</h3>
              <p style={{ color: "#64748b", fontSize: "12px" }}>Del {poaActual.fecha_inicio.substring(0, 10)} al {poaActual.fecha_fin.substring(0, 10)}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>MONTO TOTAL</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#334155" }}>RD$ {Number(poaActual.monto_total).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
                </div>
                <div style={{ padding: '10px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'left' }}>
                  <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>DISPONIBLE</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#16a34a" }}>RD$ {Number(poaActual.monto_disponible).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
                </div>
                <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', gridColumn: 'span 2', textAlign: 'left' }}>
                  <div style={{ fontSize: "11px", color: "#e11d48", fontWeight: "bold" }}>SOLICITUDES RECHAZADAS (TOTAL)</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e11d48" }}>RD$ {totalRechazado.toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>
              <FiCalendar size={40} style={{ opacity: 0.5, marginBottom: "10px" }} />
              <p>No hay un año fiscal registrado aún.</p>
            </div>
          )}
        </div>
      </div>

      <div className="av-card" style={{ marginTop: '20px' }}>
        <h3>Historial de Movimientos y Solicitudes del Poa</h3>
        <table className="requests-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f1f5f9' }}>
              <th style={{ padding: '12px' }}>FECHA</th>
              <th style={{ padding: '12px' }}>EVENTO</th>
              <th style={{ padding: '12px' }}>SOLICITANTE</th>
              <th style={{ padding: '12px' }}>SOLICITUD ORIG.</th>
              <th style={{ padding: '12px' }}>DESCUENTO (DOP)</th>
              <th style={{ padding: '12px' }}>ESTADO</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>DETALLES</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovimientos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(mov => (
              <tr key={mov.id_movimiento} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>{mov.fecha_movimiento.substring(0, 10)}</td>
                <td style={{ padding: '12px' }}><strong>#EVT-{mov.id_evento}</strong><br/><span style={{fontSize: "12px", color: "#64748b"}}>{mov.nombre_evento}</span></td>
                <td style={{ padding: '12px' }}>{mov.solicitante || "N/D"}</td>
                <td style={{ padding: '12px' }}>{Number(mov.monto_solicitado_original).toLocaleString("en-US", {minimumFractionDigits: 2})} {mov.moneda_original} <br/><span style={{fontSize: "10px", color: "#94a3b8"}}>Tasa: {mov.tasa_cambio}</span></td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#ef4444' }}>- RD$ {Number(mov.monto_descontado_dop).toLocaleString("en-US", {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold',
                    background: mov.estado === 'Aprobado' ? '#dcfce7' : mov.estado === 'Rechazado' ? '#fee2e2' : '#fef3c7',
                    color: mov.estado === 'Aprobado' ? '#16a34a' : mov.estado === 'Rechazado' ? '#dc2626' : '#d97706'
                  }}>
                    {mov.estado}
                  </span>
                  {mov.estado === 'Rechazado' && mov.motivo_rechazo && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', maxWidth: '150px' }}>Motivo: {mov.motivo_rechazo}</div>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button className="details-btn" onClick={() => openModalDetalles(mov)} style={{ padding: '6px 12px', fontSize: '12px', background: '#334155', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FiEye /> Ver
                  </button>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleCambiarEstado(mov.id_movimiento, 'Aprobado')} 
                      style={{ 
                        background: mov.estado === 'Aprobado' ? '#16a34a' : '#94a3b8', 
                        color: 'white', border: 'none', padding: '8px', borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', gap: '5px',
                        opacity: 1
                      }} 
                      title="Aprobar el presupuesto"
                    >
                      <FiCheckCircle size={16} />
                    </button>
                    <button 
                      onClick={() => {setMovRechazoId(mov.id_movimiento); setModalRechazo(true);}} 
                      style={{ 
                        background: mov.estado === 'Rechazado' ? '#dc2626' : '#94a3b8', 
                        color: 'white', border: 'none', padding: '8px', borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', gap: '5px',
                        opacity: 1
                      }} 
                      title="Rechazar el presupuesto"
                    >
                      <FiXCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No hay movimientos en el POA registrado.</td></tr>
            )}
          </tbody>
        </table>

        {movimientos.length > itemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '10px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: 'white' }}
            >
              Anterior
            </button>
            <span style={{ padding: '5px 10px', fontWeight: 'bold' }}>Pág. {currentPage} de {Math.ceil(movimientos.length / itemsPerPage)}</span>
            <button 
              disabled={currentPage * itemsPerPage >= movimientos.length} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: currentPage * itemsPerPage >= movimientos.length ? 'not-allowed' : 'pointer', background: 'white' }}
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
              <p style={{ marginBottom: "12px", color: "#475569", lineHeight: "1.5", fontSize: "14px" }}>Por favor, indica la razón por la cual se rechaza este presupuesto (el monto descontado de la solicitud se devolverá al balance disponible del año fiscal en este momento).</p>
              <textarea 
                value={motivoRechazo} 
                onChange={e => setMotivoRechazo(e.target.value)} 
                rows="4" 
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none", outline: "none", fontSize: "14px", fontFamily: "inherit" }}
                placeholder="Escribe la razón del rechazo aquí..."
              ></textarea>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #e2e8f0" }}>
              <button 
                type="button" 
                onClick={() => setModalRechazo(false)}
                style={{ padding: "10px 18px", borderRadius: "8px", background: "white", color: "#475569", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => handleCambiarEstado(movRechazoId, 'Rechazado', motivoRechazo)} 
                disabled={!motivoRechazo.trim()}
                style={{ padding: "10px 18px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: !motivoRechazo.trim() ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s", opacity: !motivoRechazo.trim() ? 0.5 : 1 }}
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
              <button className="close-btn" onClick={closeModalDetalles} style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
