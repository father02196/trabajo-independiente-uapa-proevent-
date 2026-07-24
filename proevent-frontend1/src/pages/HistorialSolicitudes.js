// ============================================================
// COMPONENTE: HistorialSolicitudes
// Pertenece a: Módulo Solicitante
// Propósito: Mostrar una tabla completa con el historial de
// todas las solicitudes creadas por el rol Solicitante.
// ============================================================

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter, FiCalendar, FiList, FiFileText, FiGrid, FiArrowLeft, FiMonitor, FiClock, FiStar, FiActivity, FiRefreshCw } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';
import { toast } from "react-hot-toast";

const API = "http://localhost:8080";

export default function HistorialSolicitudes({ usuario, onEditEvent, setActiveTab }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos los estados");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [selectedViewEvent, setSelectedViewEvent] = useState(null);
  
  // Subsanar
  const [modalSubsanar, setModalSubsanar] = useState(false);
  const [eventoSubsanar, setEventoSubsanar] = useState(null);
  const [historialObs, setHistorialObs] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarHistorial();
  }, [usuario]);

  const cargarHistorial = async () => {
    if (!usuario?.id_usuario) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/eventos?usuario_id=${usuario.id_usuario}`);
      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error al cargar el historial de solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente": return "badge-yellow";
      case "Aprobado": return "badge-blue";
      case "Rechazado": return "badge-red";
      case "Finalizado": return "badge-green";
      case "Observado": return "badge-orange"; // Add style if needed, default is fine
      default: return "badge-gray";
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString("es-DO");
  };

  // Filtrado
  const filteredData = solicitudes.filter(sol => {
    const matchesSearch = searchTerm === "" || 
                          sol.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          `#EVT-${sol.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = estadoFiltro === "Todos los estados" || estadoFiltro === "" || sol.estado === estadoFiltro;
    const matchFecha = !filtroFecha || (sol.fecha_inicio && sol.fecha_inicio.startsWith(filtroFecha));

    return matchesSearch && matchesStatus && matchFecha;
  });

  // Ordenamiento
  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentItems = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEdit = (evt) => {
    if (onEditEvent) {
      onEditEvent(evt);
    }
  };

  const handleView = (evt) => {
    setSelectedViewEvent(evt);
  };

  const openSubsanar = async (evt) => {
    setEventoSubsanar(evt);
    setHistorialObs([]);
    try {
      const res = await fetch(`${API}/api/eventos/${evt.id_evento}/historial-observaciones`);
      const data = await res.json();
      setHistorialObs(data);
    } catch (e) {
      console.error(e);
    }
    setModalSubsanar(true);
  };

  const confirmSubsanar = async () => {
    try {
      const res = await fetch(`${API}/api/eventos/${eventoSubsanar.id_evento}/subsanar`, { 
        method: 'PUT',
        headers: { 'x-usuario-id': usuario?.id_usuario || '' }
      });
      if (res.ok) {
        toast.success("Evento subsanado y reenviado a revisión.");
        setModalSubsanar(false);
        setEventoSubsanar(null);
        cargarHistorial();
      } else {
        toast.error("Error al subsanar evento.");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const handleEliminarEvento = async (id_evento) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/eventos/${id_evento}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${usuario?.token || ""}`,
          "x-usuario-id": usuario?.id_usuario || ""
        }
      });
      if (res.ok) {
        toast.success("Evento eliminado exitosamente.");
        cargarHistorial();
      } else {
        const errorData = await res.json();
        toast.error(errorData.mensaje || "Error al eliminar el evento.");
      }
    } catch (err) {
      toast.error("Error de conexión al eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const indexOfFirstItemForDisplay = currentItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const indexOfLastItemForDisplay = Math.min(currentPage * itemsPerPage, filteredData.length);

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiList className="header-icon" />
            <div>
              <h3>Mi Historial de Solicitudes</h3>
              <p className="subtitle">Consulta todas las solicitudes de eventos que has creado.</p>
            </div>
          </div>
        </div>

        <div className="filters-grid" style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-end', gap: '16px' }}>
          <div className="filter-item search-bar-container" style={{ flex: '2 1 0' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '16px', pointerEvents: 'none' }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o ID..." 
                className="input-base search-input" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="filter-item" style={{ flex: '1 1 0' }}>
            <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>
              <FiFilter style={{marginRight:'4px',verticalAlign:'middle'}}/>Estado
            </label>
            <select className="input-base" value={estadoFiltro} onChange={e => { setEstadoFiltro(e.target.value); setCurrentPage(1); }} style={{ width: '100%' }}>
              <option value="Todos los estados">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Observado">Observado</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

          <div className="filter-item" style={{ flex: '1 1 0' }}>
            <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>
              <FiCalendar style={{marginRight:'4px',verticalAlign:'middle'}}/>Fecha del Evento
            </label>
            <input className="input-base" type="date" value={filtroFecha} onChange={e => { setFiltroFecha(e.target.value); setCurrentPage(1); }} style={{ width: '100%' }} />
          </div>

          <div className="filter-item" style={{ flex: '1 1 0', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
            <label style={{marginBottom:'6px', fontSize:'12px', color:'#64748b', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.04em'}}>
              &#8645; Ordenar por Fecha
            </label>
            <button
              type="button"
              onClick={() => requestSort('fecha_inicio')}
              title={sortConfig?.direction === 'ascending' ? 'Click: más recientes primero' : 'Click: más antiguos primero'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: sortConfig?.direction === 'ascending' ? '#bfdbfe' : '#e2e8f0',
                background: sortConfig?.direction === 'ascending' ? '#eff6ff' : '#ffffff',
                color: sortConfig?.direction === 'ascending' ? '#1d4ed8' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                height: '42px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              {sortConfig?.direction === 'ascending'
                ? <><span style={{fontSize:'16px'}}>&#8593;</span> Más antiguos</>
                : <><span style={{fontSize:'16px'}}>&#8595;</span> Más recientes</>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="recent-requests-section admin-table-card">
        <div className="table-container">
          {loading ? (
            <div className="table-state-loading">
              <div className="loader"></div>
              <p>Cargando historial de solicitudes...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="table-state-empty">
              <FiFileText className="empty-icon" />
              <h4>No se encontraron solicitudes</h4>
              <p>Prueba ajustando los filtros de búsqueda.</p>
            </div>
          ) : (
            <table className="requests-table modern-table">
              <thead>
                <tr>
                  <th>EVENTO ID & NOMBRE</th>
                  <th>FECHA DE INICIO</th>
                  <th>RECINTO / LUGAR</th>
                  <th>ESTADO</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((sol) => (
                  <tr key={sol.id_evento} className="table-hover-row">
                    <td>
                      <div className="event-name-cell">
                        <strong>{sol.nombre}</strong>
                        <span className="event-id-tag">#EVT-{sol.id_evento}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FiCalendar className="date-icon" />
                        <span>{formatFecha(sol.fecha_inicio)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="venue-cell">
                        <span>{sol.recinto || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${getStatusClass(sol.estado)}`}>
                        {sol.estado || "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '8px' }}>
                        <button type="button" className="action-icon-btn view" onClick={() => handleView(sol)} title="Ver Detalles de Solicitud" style={{ color: '#0ea5e9', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }}>
                          <FiEye />
                        </button>
                        {(!sol.estado || sol.estado === 'Pendiente' || sol.estado === 'Observado') ? (
                          <>
                            <button type="button" className="action-icon-btn edit" onClick={() => handleEdit(sol)} title="Editar Solicitud">
                              <FiEdit2 />
                            </button>
                            <button type="button" className="action-icon-btn delete" onClick={() => handleEliminarEvento(sol.id_evento)} title="Eliminar Solicitud" style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                              <FiTrash2 />
                            </button>
                          </>
                        ) : (
                          <div style={{ width: '32px', height: '32px' }}></div>
                        )}
                        {sol.estado === 'Observado' && (
                          <button type="button" className="action-icon-btn" onClick={() => openSubsanar(sol)} title="Ver Observaciones y Subsanar" style={{ color: '#d97706', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                            <FiRefreshCw />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Paginación estilo admin */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{indexOfFirstItemForDisplay}</strong> - <strong>{indexOfLastItemForDisplay}</strong> de <strong>{filteredData.length}</strong> solicitudes
            </div>
            <div className="pagination-controls" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Anterior
              </button>
              <span style={{fontWeight: 700, color: 'var(--text-main)', fontSize: '13px'}}>
                Pág. {currentPage} de {totalPages || 1}
              </span>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE FICHA TÉCNICA (PANTALLA COMPLETA) */}
      {selectedViewEvent && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedViewEvent(null)}>
          <div className="modal-content modal-premium" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header del Modal */}
            <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiFileText className="text-primary" /> Ficha Técnica del Evento
                </h3>
                <span className="modal-subtitle" style={{ color: '#64748b', fontSize: '15px' }}>Vista detallada de tu solicitud</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '15px', padding: '8px 16px', fontWeight: '700', letterSpacing: '0.5px' }}>#EVT-{selectedViewEvent.id_evento}</span>
            </div>
            
            {/* Body del Modal */}
            <div className="modal-body" style={{ padding: '32px', flex: 1 }}>
              <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                
                {/* Info General */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiActivity size={16} /> Info Principal
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Nombre del Evento</span>
                    <span className="info-value" style={{ display: 'block', color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>{selectedViewEvent.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Dependencia</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{selectedViewEvent.dependencia || "—"}</span>
                  </div>
                </div>

                {/* Logística */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiGrid size={16} /> Logística
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Recinto / Lugar</span>
                    <span className="info-value" style={{ display: 'block', color: '#0f172a', fontSize: '15px', fontWeight: '500' }}>{selectedViewEvent.recinto || "—"}</span>
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Modalidad</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiMonitor size={14} /> {selectedViewEvent.modalidad || "—"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Asistentes Esperados</span>
                    <span className="info-value" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>
                      {selectedViewEvent.cantidad_asistentes ? `${selectedViewEvent.cantidad_asistentes} personas` : "—"}
                    </span>
                  </div>
                </div>

                {/* Fechas y Estado */}
                <div className="info-card" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="info-card-title" style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiClock size={16} /> Fechas y Estado
                  </div>
                  <div className="info-row" style={{ marginBottom: '12px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Fecha Programada</span>
                    <span className="info-value" style={{ display: 'block', color: '#0f172a', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiCalendar size={14} className="text-primary" /> 
                      {selectedViewEvent.fecha_inicio ? new Date(new Date(selectedViewEvent.fecha_inicio).getTime() + new Date().getTimezoneOffset() * 60000).toLocaleDateString("es-DO", { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                    </span>
                  </div>
                  <div className="info-row" style={{ marginTop: '16px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Estado Actual de la Solicitud</span>
                    <span className={`badge ${getStatusClass(selectedViewEvent.estado)}`} style={{ display: 'inline-block', padding: '8px 16px', fontSize: '14px' }}>
                      {selectedViewEvent.estado || "Pendiente"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Footer del Modal */}
            <div className="modal-footer" style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '15px', fontWeight: '600' }}
                onClick={() => setSelectedViewEvent(null)}
              >
                <FiArrowLeft /> Regresar a mi historial
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL SUBSANAR EVENTO (FASE 2) */}
      {modalSubsanar && eventoSubsanar && createPortal(
        <div className="modal-overlay" onClick={() => setModalSubsanar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{color: '#d97706'}}>Observaciones del Evento #EVT-{eventoSubsanar.id_evento}</h2>
            </div>
            <div className="modal-body" style={{ display: 'block', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{color: 'var(--text-light)', marginBottom: '15px', fontSize: '14px'}}>
                Tu evento tiene las siguientes observaciones. Por favor, realiza las correcciones necesarias y luego presiona "Confirmar Subsanación" para que el evento vuelva a revisión.
              </p>
              
              {historialObs.length === 0 ? (
                <p>Cargando observaciones...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {historialObs.map(obs => (
                    <div key={obs.id_observacion} style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#92400e', marginBottom: '8px', fontWeight: 'bold' }}>
                        <span>Dpto: {obs.departamento}</span>
                        <span>{new Date(obs.fecha).toLocaleDateString()}</span>
                      </div>
                      <p style={{ color: '#78350f', fontSize: '14px', margin: 0 }}>{obs.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalSubsanar(false)}>Cerrar</button>
              <button type="button" className="btn btn-primary" onClick={confirmSubsanar} style={{background: '#d97706', borderColor: '#d97706'}}>
                Confirmar Subsanación
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
