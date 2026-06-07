import React, { useState, useEffect } from 'react';
import './../css/PortalProveedores.css';
import { FiLogOut, FiUploadCloud } from 'react-icons/fi';

function PortalProveedoresDashboard({ proveedor, onLogout }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  
  // 7 campos de Mejora 2
  const [file, setFile] = useState(null);
  const [moneda, setMoneda] = useState('DOP');
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/proveedor/${proveedor.id_tipo}/solicitudes`);
      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCotizar = (sol) => {
    setSolicitudSeleccionada(sol);
    setModalOpen(true);
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
      <header className="portal-header">
        <h2>Portal B2B UAPA - {proveedor.nombre}</h2>
        <button className="btn-logout" onClick={onLogout}><FiLogOut /> Salir</button>
      </header>
      
      <main className="portal-content">
        <h3>Licitaciones Abiertas para tu Categoría</h3>
        <p>A continuación se muestran las solicitudes de servicios de la UAPA que coinciden con tu perfil.</p>
        
        <div className="solicitudes-grid">
          {solicitudes.length === 0 ? (
            <p>No hay solicitudes abiertas en este momento.</p>
          ) : (
            solicitudes.map(sol => (
              <div key={sol.id_solicitud} className="solicitud-card">
                <span className="badge-info">Evento: {sol.nombre_evento}</span>
                <h3>Requerimiento</h3>
                <p style={{fontSize: '14px', color: '#555'}}>{sol.descripcion_requerimientos}</p>
                <p><strong>Cierra el:</strong> {new Date(sol.fecha_limite).toLocaleDateString()}</p>
                <button className="btn-primary" onClick={() => openCotizar(sol)} style={{marginTop: '10px'}}>
                  <FiUploadCloud /> Subir Cotización
                </button>
              </div>
            ))
          )}
        </div>
      </main>

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
