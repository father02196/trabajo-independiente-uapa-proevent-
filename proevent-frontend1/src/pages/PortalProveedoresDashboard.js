import React, { useState, useEffect } from 'react';
import './../css/PortalProveedores.css';
import { FiLogOut, FiUploadCloud, FiRefreshCw, FiEye, FiFileText, FiGrid } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
function PortalProveedoresDashboard({ proveedor, onLogout }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [solicitudDetalles, setSolicitudDetalles] = useState(null);

  // 7 campos de Mejora 2
  const [file, setFile] = useState(null);
  const [moneda, setMoneda] = useState('DOP');
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [comentarios, setComentarios] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSolicitudes(false);
  }, []);

  const fetchSolicitudes = async (showAlert = false) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/proveedor/${proveedor.id_tipo}/solicitudes`);
      const data = await res.json();
      setSolicitudes(data);
      if (showAlert) alert("Lista actualizada");
    } catch (err) {
      console.error(err);
      if (showAlert) alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const openCotizar = (sol) => {
    setSolicitudSeleccionada(sol);
    setModalOpen(true);
  };

  const openDetalles = (sol) => {
    setSolicitudDetalles(sol);
    setDetailsModalOpen(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Debes adjuntar el PDF de la cotización.');
    if (!fechaVigencia) return alert('Debes indicar la fecha de vigencia.');

    const formData = new FormData();
    formData.append('archivo_pdf', file);
    formData.append('id_solicitud', solicitudSeleccionada.id_solicitud);
    formData.append('id_proveedor', proveedor.id);
    formData.append('moneda', moneda);
    formData.append('fecha_vigencia', fechaVigencia);
    formData.append('comentarios', comentarios);
    // Categoría y Evento van implícitos en la solicitud. El Contacto va en el perfil del proveedor.

    try {
      const res = await fetch('http://localhost:8080/api/proveedor/subir-cotizacion', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Cotización subida con éxito. Monto detectado por sistema: ${data.monto_extraido || 'No detectado'}`);
        setModalOpen(false);
        setFile(null);
        setComentarios('');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    }
  };

  return (
    <div className="portal-container">
      <header className="portal-header" style={{ background: '#ffffff', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>Portal B2B UAPA-Proevent</h2>
          <span style={{ fontSize: '15px', color: '#64748B', borderLeft: '2px solid #E2E8F0', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Bienvenido al portal de proveedores, <strong style={{ color: '#0F172A' }}>{proveedor.nombre}</strong>
          </span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiLogOut /> Salir
        </button>
      </header>
      
      <main className="portal-content">
        <div className="header-card">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Licitaciones Abiertas para tu Categoría</h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>A continuación se muestran las solicitudes de servicios de la UAPA que coinciden con tu perfil.</p>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => fetchSolicitudes(true)} 
            title="Recargar lista" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiRefreshCw /> Recargar
          </button>
        </div>
        
        <div className="table-container">
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
              <p style={{ fontWeight: '600' }}>No hay licitaciones abiertas en este momento.</p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>EVENTO</th>
                  <th>REQUERIMIENTO</th>
                  <th>FECHA DE CIERRE</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(sol => (
                  <tr key={sol.id_solicitud} className="table-hover-row">
                    <td style={{ fontWeight: '600', color: '#0F172A' }}>
                      <div className="event-name-cell">
                        {sol.nombre_evento}
                        <div style={{ marginTop: '6px' }}>
                          <span className="badge badge-blue" style={{ fontSize: '11px', padding: '4px 8px' }}>#EVT-{sol.id_evento}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '14px', maxWidth: '300px' }}>
                      {sol.descripcion_requerimientos}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {new Date(sol.fecha_limite).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button className="details-btn" onClick={() => openDetalles(sol)} title="Ver detalles del evento">
                          <FiEye /> Detalles
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => openCotizar(sol)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FiUploadCloud size={14} /> Subir Cotización
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal de Detalles del Evento (Ficha Técnica B2B) */}
      {detailsModalOpen && solicitudDetalles && (
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
              <button className="btn btn-secondary" onClick={() => setDetailsModalOpen(false)}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga de Cotización (Formulario de 7 campos) - Estilo Premium */}
      {modalOpen && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Someter Oferta Oficial</h3>
                <span className="modal-subtitle">Recepción de cotizaciones B2B para UAPA</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '18px', padding: '4px' }}>X</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="info-card" style={{ marginBottom: '24px' }}>
                  <div className="info-row">
                    <span className="info-label">Evento Relacionado</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '15px' }}>
                      {solicitudSeleccionada.nombre_evento}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 1. Archivo PDF */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">1. Archivo PDF (Max 10MB)</label>
                    <div 
                      className="file-drop-area" 
                      onClick={() => document.getElementById('pdf-upload').click()}
                      style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease' }}
                    >
                      <FiUploadCloud size={32} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
                      <p style={{ color: '#475569', margin: 0, fontSize: '14px', fontWeight: '500' }}>Haz clic para seleccionar el archivo PDF de la cotización</p>
                      <input id="pdf-upload" type="file" accept=".pdf" style={{display: 'none'}} onChange={handleFileChange} />
                    </div>
                    {file && <div className="file-info" style={{ marginTop: '8px', fontSize: '13px', color: '#10B981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ Archivo seleccionado: {file.name}
                    </div>}
                  </div>

                  {/* 5. Moneda */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">Moneda de Cotización</label>
                    <select className="input-base" value={moneda} onChange={e => setMoneda(e.target.value)}>
                      <option value="DOP">Pesos Dominicanos (DOP)</option>
                      <option value="USD">Dólares (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                    </select>
                  </div>

                  {/* 6. Fecha de Vigencia */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">Válida Hasta</label>
                    <input type="date" className="input-base" value={fechaVigencia} onChange={e => setFechaVigencia(e.target.value)} required />
                  </div>

                  {/* 4. Comentarios Opcionales */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">Notas del Proveedor (Opcional)</label>
                    <textarea className="input-base" rows="3" value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="Ej: La instalación incluye soporte técnico presencial..." />
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
        </div>
      )}
    </div>
  );
}

export default PortalProveedoresDashboard;
