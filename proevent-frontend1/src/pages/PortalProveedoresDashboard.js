// ============================================================
// PORTAL DE PROVEEDORES B2B - Dashboard Externo
// Pertenece a: Módulo B2B (Módulo de Licitaciones y Compras)
// Propósito: Interfaz donde proveedores externos ven licitaciones
// abiertas de UAPA, revisan detalles técnicos y suben cotizaciones
// en formato PDF respondiendo a los requerimientos.
// ============================================================

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './../css/PortalProveedores.css';
import { FiLogOut, FiUploadCloud, FiRefreshCw, FiEye, FiFileText, FiGrid, FiBriefcase, FiSend, FiClock, FiAward } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// ============================================================
// COMPONENTE: PortalProveedoresDashboard
// Recibe:
//   - proveedor: Objeto de sesión del proveedor autenticado
//   - onLogout: Función para cerrar sesión
// ============================================================
function PortalProveedoresDashboard({ proveedor, onLogout }) {
  // --- ESTADOS DE DATOS ---
  const [solicitudes, setSolicitudes] = useState([]); // Lista de licitaciones (eventos en cotización)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [historialCurrentPage, setHistorialCurrentPage] = useState(1);
  const historialItemsPerPage = 15;
  const [metricas, setMetricas] = useState({ enviadas: 0, pendientes: 0, ganadas: 0 }); // Métricas B2B
  const [loading, setLoading]         = useState(false); // Spinner
  const [viewMode, setViewMode]       = useState('abiertas'); // 'abiertas' | 'historial'
  const [cotizacionesHistorial, setCotizacionesHistorial] = useState([]);

  // --- ESTADOS DEL MODAL DE COTIZACIÓN ---
  const [modalOpen, setModalOpen]                         = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // --- ESTADOS DEL MODAL DE DETALLES TÉCNICOS ---
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [solicitudDetalles, setSolicitudDetalles] = useState(null);

  // --- ESTADOS DEL FORMULARIO DE OFERTA ---
  const [file, setFile]                   = useState(null);  // Archivo PDF de la cotización
  const [moneda, setMoneda]               = useState('DOP'); // Moneda ofertada
  const [fechaVigencia, setFechaVigencia] = useState('');    // Límite de validez de la oferta
  const [comentarios, setComentarios]     = useState('');    // Notas extras del proveedor
  const [securityAlert, setSecurityAlert] = useState(null);  // Alerta de seguridad SQL

  // --- ESTADOS EDICIÓN COTIZACIÓN ---
  const [editModalOpen, setEditModalOpen]           = useState(false);
  const [cotizacionEditando, setCotizacionEditando] = useState(null);
  const [nuevoArchivo, setNuevoArchivo]             = useState(null);

  // --- FUNCIÓN: fetchMetricas ---
  const fetchMetricas = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/proveedor/${proveedor.id}/metricas`);
      const data = await res.json();
      setMetricas(data);
    } catch (err) {
      console.error("Error al obtener métricas", err);
    }
  };

  // --- FUNCIÓN: fetchSolicitudes ---
  // Obtiene las licitaciones activas asignadas a la categoría de este proveedor
  const fetchSolicitudes = async (showAlert = false) => {
    setLoading(true);
    try {
      // API filtra por id_tipo de categoría del proveedor
      const res = await fetch(`http://localhost:8080/api/proveedor/${proveedor.id_tipo}/solicitudes`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSolicitudes(data);
        setCurrentPage(1); // Reiniciar a la primera página al cargar nuevos datos
      } else {
        setSolicitudes([]);
        console.error(data?.mensaje || data?.message || data?.error || "Error al cargar solicitudes");
      }
      fetchMetricas();
      if (showAlert) alert("Lista actualizada");
    } catch (err) {
      console.error(err);
      if (showAlert) alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN: fetchHistorialCotizaciones ---
  const fetchHistorialCotizaciones = async (showAlert = false) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/proveedor/${proveedor.id}/cotizaciones`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCotizacionesHistorial(data);
        setHistorialCurrentPage(1); // Reiniciar paginador del historial
      } else {
        setCotizacionesHistorial([]);
      }
      if (showAlert) alert("Historial actualizado");
    } catch (err) {
      console.error(err);
      if (showAlert) alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE PAGINACIÓN (LICITACIONES ABIERTAS) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSolicitudes = solicitudes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage);

  // --- LÓGICA DE PAGINACIÓN (HISTORIAL DE COTIZACIONES) ---
  const indexOfLastHistorialItem = historialCurrentPage * historialItemsPerPage;
  const indexOfFirstHistorialItem = indexOfLastHistorialItem - historialItemsPerPage;
  const currentCotizacionesHistorial = cotizacionesHistorial.slice(indexOfFirstHistorialItem, indexOfLastHistorialItem);
  const totalHistorialPages = Math.ceil(cotizacionesHistorial.length / historialItemsPerPage);

  // --- EFECTO INICIAL ---
  useEffect(() => {
    fetchSolicitudes(false);
    fetchMetricas();
  }, []);

  // --- FUNCIONES APERTURA DE MODALES ---
  // Abre el modal para enviar una oferta a una licitación
  const openCotizar = (sol) => {
    setSolicitudSeleccionada(sol);
    setModalOpen(true);
  };

  // Abre la ficha técnica completa del requerimiento de UAPA
  const openDetalles = (sol) => {
    setSolicitudDetalles(sol);
    setDetailsModalOpen(true);
  };

  // --- FUNCIÓN: handleFileChange ---
  // Valida que el archivo de cotización sea un PDF menor a 10MB
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('El archivo excede el tamaño máximo de 10MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  // --- FUNCIÓN: handleSubmit ---
  // Envía la oferta (cotización) usando FormData (multipart/form-data)
  // El backend extrae el monto usando NLP/Expresiones Regulares del PDF
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Debes adjuntar el PDF de la cotización.');
    if (!fechaVigencia) return alert('Debes indicar la fecha de vigencia.');

    // Construcción del paquete de datos para subida de archivos
    const formData = new FormData();
    formData.append('archivo_pdf', file);
    formData.append('id_solicitud', solicitudSeleccionada.id_solicitud);
    formData.append('id_proveedor', proveedor.id);
    formData.append('moneda', moneda);
    formData.append('fecha_vigencia', fechaVigencia);
    formData.append('comentarios', comentarios);
    // Nota: Categoría y Evento van implícitos en la solicitud. El Contacto en el perfil.

    try {
      const res = await fetch('http://localhost:8080/api/proveedor/subir-cotizacion', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        // La IA del backend lee el PDF y devuelve el monto_extraido
        alert(`Cotización subida con éxito. Monto detectado por sistema: ${data.monto_extraido || 'No detectado'}`);
        setModalOpen(false);
        setFile(null);
        setComentarios('');
        fetchMetricas(); // Actualizar las tarjetas automáticamente
      } else {
        if (res.status === 403 && data.error === 'SECURITY_ALERT') {
          setSecurityAlert({ palabra: data.palabra_maliciosa });
        } else {
          alert('Error: ' + data.error);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    }
  };

  // --- FUNCIÓN: handleReemplazarCotizacion ---
  const handleReemplazarCotizacion = async (e) => {
    e.preventDefault();
    if (!nuevoArchivo) {
      alert("Debes seleccionar un nuevo archivo PDF.");
      return;
    }
    const formData = new FormData();
    formData.append('archivo_pdf', nuevoArchivo);

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/proveedor/cotizacion/${cotizacionEditando.id_cotizacion}/reemplazar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Cotización actualizada con éxito');
        setEditModalOpen(false);
        setCotizacionEditando(null);
        setNuevoArchivo(null);
        fetchHistorialCotizaciones();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-container">
      <header className="portal-header" style={{ background: '#ffffff', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>Portal B2B UAPA-Proevent</h2>
          <span style={{ fontSize: '15px', color: '#64748B', borderLeft: '2px solid #E2E8F0', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="b2b-avatar">{proveedor.nombre ? proveedor.nombre.charAt(0).toUpperCase() : 'P'}</div>
            Bienvenido, <strong style={{ color: '#0F172A' }}>{proveedor.nombre}</strong>
          </span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiLogOut /> Salir
        </button>
      </header>
      
      <main className="portal-content">
        
        {/* --- TARJETAS DE MÉTRICAS B2B --- */}
        <div className="b2b-metrics-grid">
          <div className="b2b-metric-card">
            <div className="b2b-metric-icon blue"><FiBriefcase /></div>
            <div className="b2b-metric-info">
              <span className="b2b-metric-value">{solicitudes.length}</span>
              <span className="b2b-metric-label">Licitaciones Abiertas</span>
            </div>
          </div>
          <div className="b2b-metric-card">
            <div className="b2b-metric-icon orange"><FiSend /></div>
            <div className="b2b-metric-info">
              <span className="b2b-metric-value">{metricas.enviadas}</span>
              <span className="b2b-metric-label">Cotizaciones Enviadas</span>
            </div>
          </div>
          <div className="b2b-metric-card">
            <div className="b2b-metric-icon purple"><FiClock /></div>
            <div className="b2b-metric-info">
              <span className="b2b-metric-value">{metricas.pendientes}</span>
              <span className="b2b-metric-label">Pendientes de Respuesta</span>
            </div>
          </div>
          <div className="b2b-metric-card">
            <div className="b2b-metric-icon green"><FiAward /></div>
            <div className="b2b-metric-info">
              <span className="b2b-metric-value">{metricas.ganadas}</span>
              <span className="b2b-metric-label">Licitaciones Ganadas</span>
            </div>
          </div>
        </div>

        <div className="header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
              {viewMode === 'abiertas' ? 'Licitaciones Abiertas para tu Categoría' : 'Historial de Cotizaciones'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              {viewMode === 'abiertas' 
                ? 'A continuación se muestran las solicitudes de servicios de la UAPA que coinciden con tu perfil.'
                : 'Registro histórico de todas tus ofertas enviadas y su estado actual.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                if (viewMode === 'abiertas') {
                  setViewMode('historial');
                  fetchHistorialCotizaciones(false);
                } else {
                  setViewMode('abiertas');
                  fetchSolicitudes(false);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiFileText /> {viewMode === 'abiertas' ? 'Ver Historial de Cotizaciones' : 'Ver Licitaciones Abiertas'}
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => viewMode === 'abiertas' ? fetchSolicitudes(true) : fetchHistorialCotizaciones(true)} 
              title="Recargar lista" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiRefreshCw /> Recargar
            </button>
          </div>
        </div>
        
        {viewMode === 'abiertas' ? (
          <div className="table-container">
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
              <p style={{ fontWeight: '600' }}>No hay licitaciones abiertas en este momento.</p>
            </div>
          ) : (
            <table className="b2b-modern-table">
              <thead>
                <tr>
                  <th>EVENTO</th>
                  <th>REQUERIMIENTO</th>
                  <th>FECHA DE CIERRE</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {currentSolicitudes.map(sol => (
                  <tr key={sol.id_solicitud}>
                    <td>
                      <div className="b2b-event-title">{sol.nombre_evento}</div>
                      <div className="b2b-event-id">#EVT-{sol.id_evento}</div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '14px', maxWidth: '300px', lineHeight: '1.4' }}>
                      {sol.descripcion_requerimientos}
                    </td>
                    <td>
                      <span className="b2b-badge-date">
                        {new Date(sol.fecha_limite).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button type="button" className="b2b-btn-outline" onClick={() => openDetalles(sol)} title="Ver detalles del evento">
                          <FiEye size={14} /> Detalles
                        </button>
                        <button type="button" className="b2b-btn-primary" onClick={() => openCotizar(sol)} title="Enviar oferta">
                          <FiUploadCloud size={14} /> Cotizar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* --- CONTROLES DE PAGINACIÓN DENTRO DE LA TABLA --- */}
              {totalPages > 1 && (
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '12px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>
                          Página {currentPage} de {totalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0' }}
                          >
                            Anterior
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0' }}
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
        ) : (
          <div className="table-container">
            {cotizacionesHistorial.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                <p style={{ fontWeight: '600' }}>No tienes cotizaciones en el historial.</p>
              </div>
            ) : (
              <table className="b2b-modern-table">
                <thead>
                  <tr>
                    <th>COTIZACIÓN</th>
                    <th>FECHA Y ESTADO</th>
                    <th>EVENTO RELACIONADO</th>
                    <th>MONTO OFERTADO</th>
                    <th style={{ textAlign: 'center' }}>DOCUMENTO Y ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCotizacionesHistorial.map(cot => {
                    const diffMinutos = (new Date().getTime() - new Date(cot.fecha_subida).getTime()) / (1000 * 60);
                    const canEdit = diffMinutos <= 60;
                    return (
                      <tr key={cot.id_cotizacion}>
                        <td>
                          <div className="b2b-event-id">#COT-{cot.id_cotizacion}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
                            {new Date(cot.fecha_subida).toLocaleString()}
                          </div>
                          <span className={`badge badge-${cot.estado === 'Seleccionada' ? 'green' : cot.estado === 'Rechazada' ? 'red' : cot.estado === 'Evaluada' ? 'blue' : 'yellow'}`}>
                            {cot.estado}
                          </span>
                        </td>
                        <td>
                          <div className="b2b-event-title">{cot.nombre_evento}</div>
                          <div className="b2b-event-id">#EVT-{cot.id_evento}</div>
                          <div style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>{cot.requerimiento}</div>
                        </td>
                        <td>
                          <strong style={{ color: '#0F172A' }}>{cot.moneda} ${cot.monto_total_detectado ? Number(cot.monto_total_detectado).toLocaleString() : 'N/A'}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <a href={`http://localhost:8080/${cot.ruta_documento_pdf?.replace('./', '')}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <FiEye /> Ver PDF
                            </a>
                            {canEdit ? (
                              <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', backgroundColor: '#3B82F6', borderColor: '#3B82F6', color: 'white' }} onClick={() => { setCotizacionEditando(cot); setEditModalOpen(true); }}>
                                <FiUploadCloud /> Cambiar PDF
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Tiempo agotado</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <div className="b2b-pagination">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setHistorialCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={historialCurrentPage === 1}
                        >
                          Anterior
                        </button>
                        <span className="b2b-pagination-info">
                          Página <strong>{historialCurrentPage}</strong> de {totalHistorialPages || 1}
                        </span>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setHistorialCurrentPage(prev => Math.min(prev + 1, totalHistorialPages))}
                          disabled={historialCurrentPage === totalHistorialPages || totalHistorialPages === 0}
                        >
                          Siguiente
                        </button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modal de Detalles del Evento (Ficha Técnica B2B) */}
      {detailsModalOpen && solicitudDetalles && createPortal(
        <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica del Evento</h3>
                <span className="modal-subtitle">Información completa de la solicitud de servicio</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#EVT-{solicitudDetalles.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Info General */}
                <div className="info-card">
                  <div className="info-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', color: '#1E293B' }}>
                    <FiFileText size={16} color="#3B82F6" /> Información del Evento
                  </div>
                  <div className="info-row" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>Nombre del Evento</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px', fontWeight: '600' }}>{solicitudDetalles.nombre_evento}</span>
                  </div>
                  <div className="info-row" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>Requerimiento B2B</span>
                    <span className="info-value" style={{ fontWeight: '600', color: '#0F172A' }}>{solicitudDetalles.requerimiento}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>Descripción Detallada</span>
                    <span className="info-value" style={{ whiteSpace: 'pre-line', color: '#475569', fontSize: '14px' }}>{solicitudDetalles.descripcion_requerimientos || 'No hay descripción detallada disponible.'}</span>
                  </div>
                </div>

                {/* Logística */}
                <div className="info-card">
                  <div className="info-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', color: '#1E293B' }}>
                    <FiGrid size={16} color="#10B981" /> Fechas y Logística
                  </div>
                  <div className="info-row" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>Fecha de Necesidad</span>
                    <span className="info-value" style={{ color: '#0F172A', fontWeight: '500' }}>{new Date(solicitudDetalles.fecha_necesidad).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>Fecha Límite para Ofertas</span>
                    <span className="info-value" style={{ color: '#10B981', fontWeight: 'bold', fontSize: '15px' }}>{new Date(solicitudDetalles.fecha_limite).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDetailsModalOpen(false)}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Carga de Cotización (Formulario de 7 campos) - Estilo Premium */}
      {modalOpen && solicitudSeleccionada && createPortal(
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Someter Oferta Oficial</h3>
                <span className="modal-subtitle">Recepción de cotizaciones B2B para UAPA</span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', padding: '4px' }}>X</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="info-card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
                  <div className="info-row" style={{ margin: 0 }}>
                    <span className="info-label" style={{ marginBottom: 0 }}>Evento Relacionado</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '14px', marginTop: '4px' }}>
                      {solicitudSeleccionada.nombre_evento}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 1. Archivo PDF */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1">1. Archivo PDF (Max 10MB)</label>
                    <div 
                      className="file-drop-area" 
                      onClick={() => document.getElementById('pdf-upload').click()}
                      style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px 20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease' }}
                    >
                      <FiUploadCloud size={24} color="#94A3B8" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ color: '#475569', margin: 0, fontSize: '13px', fontWeight: '500' }}>Haz clic para seleccionar el archivo PDF</p>
                      <input id="pdf-upload" type="file" accept=".pdf" style={{display: 'none'}} onChange={handleFileChange} />
                    </div>
                    {file && <div className="file-info" style={{ marginTop: '4px', fontSize: '12px', color: '#10B981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ Archivo seleccionado: {file.name}
                    </div>}
                  </div>

                  {/* Fila agrupada: Moneda y Fecha */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* 5. Moneda */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-1">Moneda de Cotización</label>
                      <select className="input-base" style={{ padding: '8px 12px' }} value={moneda} onChange={e => setMoneda(e.target.value)}>
                        <option value="DOP">Pesos Dominicanos (DOP)</option>
                        <option value="USD">Dólares (USD)</option>
                        <option value="EUR">Euros (EUR)</option>
                      </select>
                    </div>

                    {/* 6. Fecha de Vigencia */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-1">Válida Hasta</label>
                      <input type="date" className="input-base" style={{ padding: '8px 12px' }} value={fechaVigencia} onChange={e => setFechaVigencia(e.target.value)} required />
                    </div>
                  </div>

                  {/* 4. Comentarios Opcionales */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-1">Notas del Proveedor (Opcional)</label>
                    <textarea className="input-base" rows="2" style={{ padding: '8px 12px' }} maxLength="1000" value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="Ej: La instalación incluye soporte técnico presencial..." />
                    <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'right', marginTop: '2px' }}>
                      {comentarios.length}/1000
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUploadCloud size={16} /> Enviar Oferta Oficial
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Disuasorio de Seguridad (SQL Injection) */}
      {securityAlert && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', borderTop: '5px solid #EF4444' }}>
            <h3 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Alerta de Seguridad
            </h3>
            <p style={{ marginTop: '12px', color: '#333' }}>
              Se ha detectado una sentencia o comando de base de datos no permitido en su comentario.
            </p>
            <p style={{ marginTop: '8px', color: '#333' }}>
              El cuadro de comentario <strong>será bloqueado</strong> si intenta nuevamente una acción maliciosa utilizando la palabra: <strong style={{ color: '#EF4444', fontSize: '16px' }}>{securityAlert.palabra}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setSecurityAlert(null)}>Entendido</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para Reemplazar Cotización (Límite 1 hr) */}
      {editModalOpen && cotizacionEditando && createPortal(
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Reemplazar Cotización</h3>
                <span className="modal-subtitle">Actualiza el archivo PDF antes de que expire el límite de 1 hora.</span>
              </div>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleReemplazarCotizacion}>
                <div className="b2b-form-group">
                  <label>Selecciona el nuevo PDF (Max 10MB)</label>
                  <div className="b2b-file-upload">
                    <input type="file" accept=".pdf" onChange={(e) => setNuevoArchivo(e.target.files[0])} required id="nuevo-pdf" />
                    <label htmlFor="nuevo-pdf" className="b2b-file-label">
                      <FiUploadCloud size={24} style={{ marginBottom: '8px', color: '#3B82F6' }} />
                      {nuevoArchivo ? nuevoArchivo.name : 'Haz clic para seleccionar el nuevo archivo PDF'}
                    </label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Subiendo...' : 'Actualizar Cotización'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default PortalProveedoresDashboard;
