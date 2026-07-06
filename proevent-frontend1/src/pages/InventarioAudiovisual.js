// ============================================================
// COMPONENTE: InventarioAudiovisual
// Pertenece a: Módulo Audiovisual
// Propósito: Mostrar en tiempo real el catálogo de dispositivos,
// la cantidad disponible frente a la cantidad reservada/en uso 
// por solicitudes activas, y listar los eventos que lo usan.
// ============================================================

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiBox, FiSearch, FiInfo, FiCheckCircle, FiAlertCircle, FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';

const API = "http://localhost:8080";

function InventarioAudiovisual({ usuario }) {
  // --- ESTADOS DEL COMPONENTE ---
  const [equipos, setEquipos] = useState([]);           // Catálogo base de equipos
  const [solicitudes, setSolicitudes] = useState([]);   // Historial de solicitudes AV
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");     // Búsqueda por texto
  
  // Modal de detalles
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargarDatos();
  }, []);

  // --- FUNCIÓN: cargarDatos ---
  // Descarga simultáneamente el catálogo de equipos y todas las solicitudes audiovisuales
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resEquipos, resSolicitudes] = await Promise.all([
        fetch(`${API}/equipos-audiovisuales`),
        fetch(`${API}/audiovisual`)
      ]);
      const dataEquipos = await resEquipos.json();
      const dataSolicitudes = await resSolicitudes.json();
      
      setEquipos(Array.isArray(dataEquipos) ? dataEquipos : []);
      const solicitudesFormateadas = Array.isArray(dataSolicitudes) ? dataSolicitudes.map(row => ({
        id_servicio: row.id_servicio,
        id_evento: row.id_evento,
        estado_av: row.estado_av,
        cantidad: row.cantidad || 1,
        ubicacion: row.ubicacion || '',
        observaciones: row.observaciones || '',
        nombre_evento: row.nombre_evento,
        fecha_evento: row.fecha_inicio,
        recinto: row.recinto,
        nombre_usuario: row.nombre_usuario || "—",
        equipo: row.equipo 
      })) : [];
      setSolicitudes(solicitudesFormateadas);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE INVENTARIO (Cálculo en Tiempo Real) ---
  // Mapea los equipos y resta la cantidad usada en solicitudes 'Pendientes', 'En revisión' o 'Aprobadas'
  const inventario = equipos.map(eq => {
    const solicitudesActivas = solicitudes.filter(req => 
      req.equipo === eq.nombre && 
      ['Pendiente', 'En revisión', 'Aprobado'].includes(req.estado_av)
    );
    const enUso = solicitudesActivas.reduce((sum, req) => sum + req.cantidad, 0);
    const total = eq.cantidad_total || 0;
    const disponible = total - enUso;

    return {
      ...eq,
      total,
      enUso,
      disponible,
      solicitudesActivas
    };
  });

  const filteredInventario = inventario.filter(eq =>
    eq.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInventario = filteredInventario;
  const sortedSolicitudes = [...(selectedEquipo?.solicitudesActivas || [])].sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "N/D";
    const date = new Date(fechaStr);
    return date.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  // --- MANEJO DEL MODAL ---
  const openModal = (equipo) => {
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Inventario en Tiempo Real</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>Supervisa la disponibilidad de los equipos y las solicitudes que los retienen.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input-base"
              placeholder="Buscar dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '260px' }}
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={cargarDatos}>Actualizar</button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <div className="loader" style={{ margin: '0 auto 16px', borderColor: '#E2E8F0', borderTopColor: '#3B82F6' }}></div>
            <p>Cargando inventario...</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th style={{ textAlign: 'center' }}>Total Inventario</th>
                  <th style={{ textAlign: 'center' }}>En Uso / Reservado</th>
                  <th style={{ textAlign: 'center' }}>Disponible</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Detalles de Uso</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventario.map((eq) => (
                  <tr key={eq.id_equipo}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          {eq.icono === 'FiMonitor' && <FiMonitor size={18} />}
                          {eq.icono === 'FiSpeaker' && <FiSpeaker size={18} />}
                          {eq.icono === 'FiMic' && <FiMic size={18} />}
                          {eq.icono === 'FiVideo' && <FiVideo size={18} />}
                          {eq.icono === 'FiRadio' && <FiRadio size={18} />}
                          {eq.icono === 'FiSun' && <FiSun size={18} />}
                          {eq.icono === 'FiCast' && <FiCast size={18} />}
                          {!["FiMonitor", "FiSpeaker", "FiMic", "FiVideo", "FiRadio", "FiSun", "FiCast"].includes(eq.icono) && <FiMonitor size={18} />}
                        </div>
                        <strong style={{ color: '#0F172A', fontWeight: '600' }}>{eq.nombre}</strong>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#334155' }}>{eq.total}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: eq.enUso > 0 ? '#EF4444' : '#64748B' }}>
                      {eq.enUso}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${eq.disponible > 0 ? 'status-approved' : 'status-rejected'}`} style={{ padding: '4px 10px', fontSize: '13px' }}>
                        {eq.disponible}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {eq.disponible > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10B981', fontSize: '13px', fontWeight: '600' }}>
                          <FiCheckCircle /> Disponible
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#EF4444', fontSize: '13px', fontWeight: '600' }}>
                          <FiAlertCircle /> Agotado
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm" 
                        onClick={() => openModal(eq)}
                        disabled={eq.enUso === 0}
                        style={{ opacity: eq.enUso === 0 ? 0.5 : 1 }}
                      >
                        <FiInfo /> Ver Solicitudes
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInventario.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                      No se encontraron dispositivos en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedEquipo && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Detalles de Inventario AV</h3>
                <span className="modal-subtitle">Revisión de uso y disponibilidad: {selectedEquipo.nombre}</span>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '14px', padding: '6px 12px' }}>{selectedEquipo.categoria || 'Audiovisual'}</span>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{selectedEquipo.total}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Total Inventario</div>
                </div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444', marginBottom: '4px' }}>{selectedEquipo.enUso}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#DC2626', textTransform: 'uppercase' }}>En Uso / Reservado</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>{selectedEquipo.disponible}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', textTransform: 'uppercase' }}>Disponibles</div>
                </div>
              </div>

              <div className="modal-grid-1" style={{ marginTop: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Eventos que solicitan este dispositivo
                  </div>
                  <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid #E2E8F0', maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="modern-table">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th>ID Evento</th>
                          <th>Evento</th>
                          <th>Solicitante</th>
                          <th>Fecha</th>
                          <th>Ubicación</th>
                          <th style={{ textAlign: 'center' }}>Cant.</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSolicitudes.map(req => (
                          <tr key={req.id_servicio}>
                            <td style={{ fontWeight: '600', color: '#64748B' }}>#EVT-{req.id_evento}</td>
                            <td style={{ fontWeight: '600', color: '#0F172A' }}>{req.nombre_evento}</td>
                            <td>{req.nombre_usuario}</td>
                            <td>{formatFecha(req.fecha_evento)}</td>
                            <td>{req.ubicacion || "N/A"}</td>
                            <td style={{ textAlign: 'center', fontWeight: '700', color: '#EF4444' }}>{req.cantidad}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${req.estado_av === 'Aprobado' ? 'badge-green' : 'badge-yellow'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>
                                {req.estado_av}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {selectedEquipo.solicitudesActivas.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>No hay solicitudes activas para este dispositivo.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cerrar Detalles</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default InventarioAudiovisual;
