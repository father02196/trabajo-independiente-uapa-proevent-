import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiTrash2, FiDownload, FiDollarSign, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API = "http://localhost:8080";

export default function FlujoAdministrativo({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  
  const [servicios, setServicios] = useState([]);
  const [presupuesto, setPresupuesto] = useState({ estado: 'Pendiente' });
  const [legal, setLegal] = useState({ estado_legal: 'Pendiente', observacion_legal: '' });
  const [cotizaciones, setCotizaciones] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [analisisIA, setAnalisisIA] = useState(null);
  
  const isComprasRole = usuario?.rol === "Administrador de Compras" || usuario?.rol === "Compras";
  const isLegalRole = usuario?.rol === "Administrador de Legal" || usuario?.rol === "Administrador Legal" || usuario?.rol === "Legal";
  const isVAFRole = usuario?.rol === "Administrador V-A-F" || usuario?.rol === "VAF" || usuario?.rol === "Contabilidad";
  const isGeneralRole = !isComprasRole && !isLegalRole && !isVAFRole;

  const [tab, setTab] = useState(() => {
    if (isComprasRole) return 'compras';
    if (isLegalRole) return 'legal';
    if (isVAFRole) return 'presupuesto';
    return 'compras';
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/eventos`)
      .then(res => res.json())
      .then(data => {
        const eventosPermitidos = Array.isArray(data) 
          ? data.filter(e => e.estado === "Aprobado" || e.estado === "En Progreso") 
          : [];
        setEventos(eventosPermitidos);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSelectEvent = async (e) => {
    const id = e.target.value;
    if (!id) {
      setEventoSeleccionado(null);
      return;
    }
    const evt = eventos.find(ev => ev.id_evento.toString() === id);
    setEventoSeleccionado(evt);
    cargarDatos(id);
  };

  const cargarDatos = async (id_evento) => {
    setLoading(true);
    try {
      // Admin Evento
      const resAdmin = await fetch(`${API}/api/admin_evento/${id_evento}`);
      const dataAdmin = await resAdmin.json();
      setPresupuesto(dataAdmin.presupuesto);
      setLegal(dataAdmin.legal);
      setCotizaciones(dataAdmin.cotizaciones || []);

      // Servicios
      const resServ = await fetch(`${API}/servicios-externos-all`);
      const dataServ = await resServ.json();
      if (Array.isArray(dataServ)) {
        setServicios(dataServ.filter(s => s.id_evento.toString() === id_evento.toString()));
      }

      // Documentos
      cargarDocumentos(id_evento);

    } catch (err) {
      toast.error('Error al cargar datos del flujo administrativo');
    } finally {
      setLoading(false);
    }
  };

  const cargarDocumentos = async (id_evento) => {
    try {
      const resDoc = await fetch(`${API}/api/documentos/${id_evento}`);
      const dataDoc = await resDoc.json();
      setDocumentos(dataDoc);
    } catch (err) {
      console.error("Error cargando documentos", err);
    }
  };

  const handleUpload = async (e, tipo_documento) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 15MB');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('id_evento', eventoSeleccionado.id_evento);
    formData.append('tipo_documento', tipo_documento);
    formData.append('id_usuario_subio', usuario?.id_usuario);

    const loadToast = toast.loading(`Subiendo ${tipo_documento}...`);
    try {
      const res = await fetch(`${API}/api/documentos/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.mensaje, { id: loadToast });
        cargarDocumentos(eventoSeleccionado.id_evento);
      } else {
        toast.error(data.error || 'Error al subir documento', { id: loadToast });
      }
    } catch (err) {
      toast.error('Error de conexión al subir archivo', { id: loadToast });
    }
    e.target.value = null;
  };

  const archivarDocumento = async (id_documento) => {
    if (!window.confirm('¿Seguro que deseas archivar este documento? Ya no será visible aquí.')) return;
    try {
      const res = await fetch(`${API}/api/documentos/${id_documento}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Documento archivado');
        cargarDocumentos(eventoSeleccionado.id_evento);
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const guardarCambiosServicio = async (id_servicio_ext, num_oc, req_contrato) => {
    try {
      const res = await fetch(`${API}/api/servicio_externo/${id_servicio_ext}/admin`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify({ numero_orden_compra: num_oc, requiere_contrato: req_contrato ? 1 : 0 })
      });
      if (res.ok) {
        toast.success('Servicio actualizado');
      } else {
        toast.error('Error al actualizar servicio');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const guardarPresupuesto = async () => {
    try {
      const res = await fetch(`${API}/api/presupuesto/${eventoSeleccionado.id_evento}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify({ estado: presupuesto.estado })
      });
      if (res.ok) toast.success('Estado de presupuesto guardado');
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const guardarLegal = async () => {
    try {
      const res = await fetch(`${API}/api/flujo_legal/${eventoSeleccionado.id_evento}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify({ 
          estado_legal: legal.estado_legal, 
          observacion_legal: legal.observacion_legal,
          id_usuario_revisor: usuario?.id_usuario
        })
      });
      if (res.ok) toast.success('Flujo legal actualizado');
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const calcularAlertaVencimiento = (fecha_vigencia) => {
    const hoy = new Date();
    const vigencia = new Date(fecha_vigencia);
    const diffTime = vigencia - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { texto: 'Vencida', color: '#ef4444', bg: '#fef2f2' };
    if (diffDays <= 5) return { texto: `Vence en ${diffDays} días`, color: '#f97316', bg: '#fff7ed' };
    return { texto: 'Vigente', color: '#10b981', bg: '#ecfdf5' };
  };

  const agruparCotizacionesPorSolicitud = () => {
    return cotizaciones.reduce((acc, c) => {
      if (!acc[c.id_solicitud]) acc[c.id_solicitud] = [];
      acc[c.id_solicitud].push(c);
      return acc;
    }, {});
  };

  const evaluarCotizacionesIA = async (id_solicitud) => {
    const loadToast = toast.loading('Analizando cotizaciones con Inteligencia Artificial...');
    try {
      const res = await fetch(`${API}/api/admin/evaluar-cotizaciones/${id_solicitud}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Análisis completado', { id: loadToast });
        setAnalisisIA(data.veredicto);
      } else {
        toast.error(data.error || 'Error en el análisis', { id: loadToast });
      }
    } catch (err) {
      toast.error('Error de conexión con la IA', { id: loadToast });
    }
  };

  const renderCompras = () => {
    const cotizacionesAgrupadas = agruparCotizacionesPorSolicitud();
    return (
    <div className="fade-in">
      {Object.keys(cotizacionesAgrupadas).length > 0 && (
        <div style={{ marginBottom: '25px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#0f172a', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Cotizaciones Recibidas B2B</span>
          </h4>
          
          {Object.entries(cotizacionesAgrupadas).map(([id_solicitud, cotList]) => (
            <div key={id_solicitud} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: '#334155' }}>Solicitud de Cotización #{id_solicitud}</strong>
                {cotList.length >= 2 && (
                  <button onClick={() => evaluarCotizacionesIA(id_solicitud)} className="btn btn-primary btn-sm" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    ✨ Análisis Comparativo con IA
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cotList.map(c => {
                  const alerta = calcularAlertaVencimiento(c.fecha_vigencia);
                  const isRecomendada = analisisIA?.proveedor_recomendado_id === c.id_proveedor;
                  return (
                    <div key={c.id_cotizacion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isRecomendada ? '#f0fdf4' : '#fff', borderRadius: '6px', borderLeft: `4px solid ${isRecomendada ? '#22c55e' : alerta.color}`, border: isRecomendada ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                      <div>
                        <strong style={{ color: isRecomendada ? '#166534' : 'inherit' }}>
                          {c.proveedor_nombre} {isRecomendada && '⭐ (Recomendación IA)'}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Monto Detectado: {c.moneda} {c.monto_total_detectado || 'N/A'} | Válida hasta: {new Date(c.fecha_vigencia).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: alerta.color, background: alerta.bg, padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {alerta.texto !== 'Vigente' && <FiAlertCircle />} {alerta.texto}
                        </span>
                        <a href={`${API}/${c.ruta_documento_pdf}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><FiDownload /> Ver Oferta</a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {analisisIA && cotList.some(c => c.id_proveedor === analisisIA.proveedor_recomendado_id) && (
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '8px' }}>
                  <h5 style={{ color: '#86198f', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>✨ Veredicto de la IA</h5>
                  <p style={{ fontSize: '13px', color: '#4a044e', marginBottom: '12px' }}>{analisisIA.justificacion}</p>
                  <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0abfc' }}>
                        <th style={{ padding: '6px 0' }}>Proveedor</th>
                        <th>Costo (DOP)</th>
                        <th>Ventajas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analisisIA.matriz_comparativa?.map((mat, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fae8ff' }}>
                          <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#701a75' }}>{mat.proveedor}</td>
                          <td>RD$ {mat.costo_normalizado_dop}</td>
                          <td>{mat.ventajas?.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h4 style={{ marginBottom: '15px' }}>Gestión de Órdenes de Compra por Servicio</h4>
      {servicios.length === 0 ? <p>No hay servicios externos solicitados para este evento.</p> : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {servicios.map(s => (
            <div key={s.id_servicio_ext} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>{s.tipo_servicio} (ID: {s.id_servicio_ext})</strong>
                <span style={{ fontSize: '12px', background: s.estado === 'Aprobado' ? '#d1fae5' : '#e0f2fe', color: s.estado === 'Aprobado' ? '#047857' : '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                  {s.estado}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b' }}>Número de Orden de Compra (OC):</label>
                  <input 
                    type="text" 
                    className="form-control-premium" 
                    defaultValue={s.numero_orden_compra || ''}
                    onBlur={(e) => guardarCambiosServicio(s.id_servicio_ext, e.target.value, s.requiere_contrato)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                  <label className="btn btn-secondary btn-sm" style={{ margin: 0, cursor: 'pointer' }}>
                    <FiUpload /> Subir Cotización Manual
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Cotizacion')} />
                  </label>
                  <label className="btn btn-primary btn-sm" style={{ margin: 0, cursor: 'pointer' }}>
                    <FiUpload /> Subir OC Firmada
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Orden de Compra')} />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  };

  const renderPresupuesto = () => (
    <div className="fade-in">
      <h4 style={{ marginBottom: '15px' }}>Flujo de Presupuesto / VAF</h4>
      <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '8px', border: '1px solid #ccfbf1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Estado de Asignación Presupuestaria:</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <select 
              className="table-select-premium" 
              value={presupuesto.estado} 
              onChange={(e) => setPresupuesto({ ...presupuesto, estado: e.target.value })}
              style={{ width: '250px' }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Asignado">Asignado (Fondos Reservados)</option>
              <option value="Aprobado">Aprobado (Definitivo)</option>
              <option value="Rechazado">Rechazado (Sin Fondos)</option>
            </select>
            <button className="btn btn-primary" onClick={guardarPresupuesto}>Guardar Estado</button>
          </div>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <FiUpload /> Cargar Certificación de Fondos
            <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Certificacion de Fondos')} />
          </label>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>Suba el PDF de la certificación firmada por Contabilidad/VAF.</p>
        </div>
      </div>
    </div>
  );

  const renderLegal = () => (
    <div className="fade-in">
      <h4 style={{ marginBottom: '15px' }}>Aprobaciones y Contratos Legales</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
          <label style={{ fontWeight: 'bold' }}>Estado de Revisión Legal:</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', marginBottom: '15px' }}>
            <select 
              className="table-select-premium" 
              value={legal.estado_legal} 
              onChange={(e) => setLegal({ ...legal, estado_legal: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado (Devuelto)</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          <label style={{ fontWeight: 'bold' }}>Observaciones Legales:</label>
          <textarea 
            className="form-control-premium" 
            rows="4" 
            value={legal.observacion_legal || ''} 
            onChange={(e) => setLegal({ ...legal, observacion_legal: e.target.value })}
            placeholder="Ingrese cualquier observación, enmienda requerida o nota jurídica..."
            style={{ width: '100%', marginTop: '8px', marginBottom: '15px' }}
          />
          <button className="btn btn-primary" onClick={guardarLegal}>Guardar Dictamen Legal</button>
        </div>

        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>Servicios que Requieren Contrato</label>
          {servicios.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>Sin servicios.</p> : servicios.map(s => (
            <div key={s.id_servicio_ext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span>{s.tipo_servicio}</span>
              <input 
                type="checkbox" 
                checked={s.requiere_contrato} 
                onChange={(e) => {
                  const updated = [...servicios];
                  const idx = updated.findIndex(u => u.id_servicio_ext === s.id_servicio_ext);
                  updated[idx].requiere_contrato = e.target.checked;
                  setServicios(updated);
                  guardarCambiosServicio(s.id_servicio_ext, s.numero_orden_compra, e.target.checked);
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <label className="btn btn-secondary btn-sm" style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
              <FiUpload /> Subir Contrato Firmado
              <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Contrato')} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentos = () => (
    <div className="fade-in">
      <h4 style={{ marginBottom: '15px' }}>Bóveda Digital (Expediente del Evento)</h4>
      {documentos.length === 0 ? <p>No hay documentos subidos para este evento.</p> : (
        <table className="tabla-premium">
          <thead>
            <tr>
              <th>Tipo de Documento</th>
              <th>Nombre del Archivo</th>
              <th>Subido por</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map(doc => (
              <tr key={doc.id_documento}>
                <td><span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>{doc.tipo_documento}</span></td>
                <td><FiFileText style={{ marginRight: '5px', color: '#64748b' }}/> {doc.nombre_archivo}</td>
                <td>{doc.usuario_nombre || 'Sistema'}</td>
                <td>{new Date(doc.fecha_subida).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`${API}${doc.ruta_archivo}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                      <FiDownload />
                    </a>
                    <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={() => archivarDocumento(doc.id_documento)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiShield className="header-icon" />
            <div>
              <h3>Flujo Administrativo y Legal</h3>
              <p className="subtitle">Gestión de Compras, Presupuesto (VAF) y Contratos</p>
            </div>
          </div>
        </div>

        <div className="filters-grid" style={{ marginTop: '20px' }}>
          <div className="filter-item full-width">
            <label>Seleccionar Evento Operativo</label>
            <select onChange={handleSelectEvent} className="table-select-premium" style={{ width: '100%', padding: '10px' }}>
              <option value="">-- Elige un evento para administrar --</option>
              {eventos.map((ev) => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  {`#EVT-${ev.id_evento} - ${ev.nombre} (${ev.estado})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eventoSeleccionado && (
          <div style={{ marginTop: '30px' }}>
            {/* Tabs de Navegación */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
              {(isComprasRole || isGeneralRole) && (
                <button 
                  onClick={() => setTab('compras')} 
                  style={{ background: 'none', border: 'none', padding: '10px 15px', fontWeight: 'bold', color: tab === 'compras' ? '#2563eb' : '#64748b', borderBottom: tab === 'compras' ? '2px solid #2563eb' : 'none', cursor: 'pointer', marginBottom: '-12px' }}
                >
                  Compras y Cotizaciones
                </button>
              )}
              {(isVAFRole || isGeneralRole) && (
                <button 
                  onClick={() => setTab('presupuesto')} 
                  style={{ background: 'none', border: 'none', padding: '10px 15px', fontWeight: 'bold', color: tab === 'presupuesto' ? '#2563eb' : '#64748b', borderBottom: tab === 'presupuesto' ? '2px solid #2563eb' : 'none', cursor: 'pointer', marginBottom: '-12px' }}
                >
                  Presupuesto (VAF)
                </button>
              )}
              {(isLegalRole || isGeneralRole) && (
                <button 
                  onClick={() => setTab('legal')} 
                  style={{ background: 'none', border: 'none', padding: '10px 15px', fontWeight: 'bold', color: tab === 'legal' ? '#2563eb' : '#64748b', borderBottom: tab === 'legal' ? '2px solid #2563eb' : 'none', cursor: 'pointer', marginBottom: '-12px' }}
                >
                  Legal y Contratos
                </button>
              )}
              <button 
                onClick={() => setTab('documentos')} 
                style={{ background: 'none', border: 'none', padding: '10px 15px', fontWeight: 'bold', color: tab === 'documentos' ? '#2563eb' : '#64748b', borderBottom: tab === 'documentos' ? '2px solid #2563eb' : 'none', cursor: 'pointer', marginBottom: '-12px', marginLeft: 'auto' }}
              >
                Archivos ({documentos.length})
              </button>
            </div>

            {loading ? <div className="loader"></div> : (
              <>
                {tab === 'compras' && renderCompras()}
                {tab === 'presupuesto' && renderPresupuesto()}
                {tab === 'legal' && renderLegal()}
                {tab === 'documentos' && renderDocumentos()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
