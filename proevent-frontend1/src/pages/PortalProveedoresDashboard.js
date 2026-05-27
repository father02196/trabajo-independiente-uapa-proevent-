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

      {/* Modal de Carga de Cotización (Formulario de 7 campos) */}
      {modalOpen && solicitudSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width: '500px'}}>
            <h3 className="modal-title">Someter Oferta (Cotización)</h3>
            
            <form onSubmit={handleSubmit}>
              {/* 2 y 3. Evento y Categoría (Solo Lectura) */}
              <div className="form-group">
                <label>Evento Relacionado</label>
                <input type="text" value={solicitudSeleccionada.nombre_evento} disabled style={{backgroundColor: '#eee'}} />
              </div>

              {/* 1. Archivo PDF */}
              <div className="form-group">
                <label>1. Archivo PDF (Max 10MB)</label>
                <div className="file-drop-area" onClick={() => document.getElementById('pdf-upload').click()}>
                  <FiUploadCloud size={30} color="#7f8c8d" />
                  <p>Haz clic para seleccionar el archivo PDF</p>
                  <input id="pdf-upload" type="file" accept=".pdf" style={{display: 'none'}} onChange={handleFileChange} />
                </div>
                {file && <div className="file-info">Archivo seleccionado: {file.name}</div>}
              </div>

              {/* 5. Moneda */}
              <div className="form-group">
                <label>Moneda de Cotización</label>
                <select value={moneda} onChange={e => setMoneda(e.target.value)}>
                  <option value="DOP">Pesos Dominicanos (DOP)</option>
                  <option value="USD">Dólares (USD)</option>
                  <option value="EUR">Euros (EUR)</option>
                </select>
              </div>

              {/* 6. Fecha de Vigencia */}
              <div className="form-group">
                <label>Válida Hasta</label>
                <input type="date" value={fechaVigencia} onChange={e => setFechaVigencia(e.target.value)} required />
              </div>

              {/* 4. Comentarios Opcionales */}
              <div className="form-group">
                <label>Notas del Proveedor (Opcional)</label>
                <textarea rows="3" value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="La instalación incluye soporte técnico..." />
              </div>

              {/* 7. Contacto - Se envía el ID de sesión del proveedor automáticamente */}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Enviar Oferta Oficial</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalProveedoresDashboard;
