// ============================================================
// COMPONENTE: FirmaDigital
// Pertenece a: Módulo Legal / Firma Digital
// Propósito: Permite visualizar y gestionar documentos (Contratos, OC)
// pendientes de firma. Muestra un listado con filtros y acciones.
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  FiPenTool, FiSearch, FiRefreshCw, FiEye, FiDownload, FiCheckCircle,
  FiXCircle, FiClock, FiX, FiFileText, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API = "http://localhost:8080";

const formatPdfUrl = (path) => {
  if (!path) return '';
  return path.startsWith('./') ? `${API}${path.substring(1)}` : path.startsWith('/') ? `${API}${path}` : `${API}/${path}`;
};

function FirmaDigital({ usuario }) {
  // --- ESTADOS ---
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalHistorial, setModalHistorial] = useState({ open: false, documento: null });
  const [modalPdf, setModalPdf] = useState({ open: false, url: '', titulo: '' });
  const itemsPerPage = 8;

  // --- CARGA DE DATOS ---
  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/firmas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocumentos(data);
      } else {
        console.error('Respuesta no válida:', data);
        setDocumentos([]);
        if (data.error) toast.error('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la bandeja de firmas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroEstado]);

  // --- ACCIONES ---
  const actualizarEstadoFirma = async (id_documento, nuevo_estado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/firmas/${id_documento}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado_firma: nuevo_estado })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Documento ${nuevo_estado.toLowerCase()} correctamente.`);
        cargarDocumentos();
      } else {
        toast.error(data.error || `Error al actualizar documento.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión.');
    }
  };

  const handleVisualizarDocumento = (ruta_archivo, nombre_archivo) => {
    if (ruta_archivo) {
      setModalPdf({ open: true, url: formatPdfUrl(ruta_archivo), titulo: nombre_archivo });
    } else {
      toast.error('No hay documento PDF disponible.');
    }
  };

  const handleDescargarDocumento = async (ruta_archivo, nombre_archivo) => {
    if (ruta_archivo) {
      try {
        const url = formatPdfUrl(ruta_archivo);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al descargar');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombre_archivo || 'documento.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        toast.error('Error al descargar el documento.');
      }
    } else {
      toast.error('No hay documento disponible para descargar.');
    }
  };

  const handleVerHistorial = (doc) => {
    setModalHistorial({ open: true, documento: doc });
  };

  // --- FILTRADO Y ORDENAMIENTO ---
  let dataFiltrada = documentos.filter(d => {
    const matchBusqueda = d.nombre_evento?.toLowerCase().includes(search.toLowerCase()) ||
                          d.responsable?.toLowerCase().includes(search.toLowerCase()) ||
                          d.nombre_archivo?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'Todos' || d.estado_firma === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const paginatedData = dataFiltrada.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- MÉTRICAS ---
  const pendientes = documentos.filter(d => d.estado_firma === 'Pendiente').length;
  const firmados = documentos.filter(d => d.estado_firma === 'Firmado').length;
  const rechazados = documentos.filter(d => d.estado_firma === 'Rechazado').length;

  // --- BADGES ---
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Firmado': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>Firmado</span>;
      case 'Rechazado': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>Rechazado</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e2e8f0', color: '#475569' }}>Pendiente</span>;
    }
  };

  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiPenTool color="#4f46e5" /> Firma Digital
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Gestión de documentos legales pendientes de firma</p>
        </div>
        <button onClick={cargarDocumentos} className="btn-modern-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
          <FiRefreshCw className={loading ? 'spin-icon' : ''} /> Recargar
        </button>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock size={20} color="#475569" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Pendientes de Firma</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{pendientes}</h3>
        </div>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCheckCircle size={20} color="#059669" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Firmados</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#059669' }}>{firmados}</h3>
        </div>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiXCircle size={20} color="#dc2626" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Rechazados</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#dc2626' }}>{rechazados}</h3>
        </div>
      </div>

      {/* TABLA CON FILTROS */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* BARRA DE FILTROS */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              id="search-firma-digital"
              type="text"
              placeholder="Buscar por evento, responsable o nombre de documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select id="filtro-estado-firma" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Firmado">Firmado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead style={{ background: '#ffffff', color: '#64748b', fontSize: '12px', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Evento</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Documento</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Responsable</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Fecha de Creación</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Estado de Firma</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><FiRefreshCw className="spin-icon" style={{ display: 'inline' }} size={24} /> <p>Cargando documentos...</p></td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FiPenTool size={32} style={{ display: 'block', margin: '0 auto 8px' }} />
                  No se encontraron documentos con los filtros aplicados.
                </td></tr>
              ) : (
                paginatedData.map((d, index) => (
                  <tr key={`${d.id_documento}-${index}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>#{d.id_documento}</td>
                    <td style={{ padding: '16px 20px', color: '#475569', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.nombre_evento}>
                      {d.nombre_evento}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#0f172a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiFileText color="#3b82f6" /> {d.tipo_documento}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.nombre_archivo}>
                        {d.nombre_archivo}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: '500' }}>{d.responsable}</td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>
                      {d.fecha_creacion ? new Date(d.fecha_creacion).toLocaleDateString('es-DO') : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getEstadoBadge(d.estado_firma)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Visualizar Documento */}
                        <button onClick={() => handleVisualizarDocumento(d.ruta_archivo, d.nombre_archivo)} title="Visualizar Documento" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#bae6fd'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiEye size={15} />
                        </button>
                        {/* Descargar PDF */}
                        <button onClick={() => handleDescargarDocumento(d.ruta_archivo, d.nombre_archivo)} title="Descargar PDF" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#10b981', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.borderColor = '#a7f3d0'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiDownload size={15} />
                        </button>
                        {/* Ver historial */}
                        <button onClick={() => handleVerHistorial(d)} title="Ver Historial" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#6366f1', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiClock size={15} />
                        </button>

                        {/* Si está pendiente, puede firmar o rechazar */}
                        {d.estado_firma === 'Pendiente' && (
                          <>
                            {/* Firmar Documento */}
                            <button onClick={() => actualizarEstadoFirma(d.id_documento, 'Firmado')} title="Firmar Documento" style={{ background: '#4f46e5', border: '1px solid #4338ca', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
                              <FiPenTool size={15} />
                            </button>
                            {/* Rechazar Documento */}
                            <button onClick={() => actualizarEstadoFirma(d.id_documento, 'Rechazado')} title="Rechazar Documento" style={{ background: '#fff1f2', border: '1px solid #ffe4e6', color: '#e11d48', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#ffe4e6'; e.currentTarget.style.borderColor = '#fecdd3'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = '#ffe4e6'; }}>
                              <FiX size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
          <span>Mostrando <strong style={{ color: '#0f172a' }}>{paginatedData.length}</strong> de <strong style={{ color: '#0f172a' }}>{dataFiltrada.length}</strong> documentos</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Pág. {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL HISTORIAL */}
      {modalHistorial.open && modalHistorial.documento && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', width: '92%', maxWidth: '580px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header del modal */}
            <div style={{ background: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiClock size={20} color="#475569" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Historial de Firma</h4>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>{modalHistorial.documento.nombre_archivo}</p>
                </div>
              </div>
              <button onClick={() => setModalHistorial({ open: false, documento: null })} style={{ background: 'transparent', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><FiX size={18} /></button>
            </div>

            {/* Contenido del modal */}
            <div style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '15px' }}>Línea de Tiempo del Documento</h5>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', borderLeft: '2px solid #e2e8f0', marginLeft: '12px', paddingLeft: '24px' }}>
                  
                  {/* Creación */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#cbd5e1', border: '3px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}></div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{modalHistorial.documento.fecha_creacion ? new Date(modalHistorial.documento.fecha_creacion).toLocaleString('es-DO') : 'N/A'}</div>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginTop: '2px' }}>Documento Creado</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Subido por <strong>{modalHistorial.documento.responsable}</strong></div>
                  </div>

                  {/* Estado Firma */}
                  {modalHistorial.documento.estado_firma !== 'Pendiente' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', background: modalHistorial.documento.estado_firma === 'Firmado' ? '#10b981' : '#ef4444', border: '3px solid #fff', boxShadow: `0 0 0 1px ${modalHistorial.documento.estado_firma === 'Firmado' ? '#34d399' : '#f87171'}` }}></div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actualización de Estado</div>
                      <div style={{ fontWeight: '700', color: modalHistorial.documento.estado_firma === 'Firmado' ? '#059669' : '#b91c1c', fontSize: '15px', marginTop: '2px' }}>Documento {modalHistorial.documento.estado_firma}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Procesado por <strong>Administrador Legal</strong></div>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalHistorial({ open: false, documento: null })} className="btn-modern-primary" style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                Cerrar Historial
              </button>
            </div>
            
          </div>
        </div>
      , document.body)}

      {/* MODAL VISOR PDF */}
      {modalPdf.open && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="scale-up" style={{ background: '#fff', width: '95%', maxWidth: '1000px', height: '90vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header del modal PDF */}
            <div style={{ background: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFileText size={20} color="#475569" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>Visor de Documento</h4>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>{modalPdf.titulo}</p>
                </div>
              </div>
              <button onClick={() => setModalPdf({ open: false, url: '', titulo: '' })} style={{ background: 'transparent', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><FiX size={20} /></button>
            </div>

            {/* Contenido (Iframe) */}
            <div style={{ flex: 1, background: '#e2e8f0' }}>
              <iframe 
                src={modalPdf.url} 
                title="Visor PDF"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            
          </div>
        </div>
      , document.body)}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default FirmaDigital;
