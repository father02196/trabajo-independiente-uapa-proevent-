import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiTrash2, FiDownload, FiDollarSign, FiShield, FiBriefcase } from 'react-icons/fi';
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
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── PANEL DE COTIZACIONES B2B ── */}
      {Object.keys(cotizacionesAgrupadas).length > 0 && (
        <div className="saas-panel-card">
          <div className="panel-header">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FiBriefcase className="panel-icon" style={{ fontSize: '24px', color: '#8b5cf6' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Cotizaciones Recibidas B2B</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Revisión y análisis de ofertas de proveedores</p>
              </div>
            </div>
          </div>
          
          <div className="panel-body">
            {Object.entries(cotizacionesAgrupadas).map(([id_solicitud, cotList]) => (
              <div key={id_solicitud} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <strong style={{ color: '#1e293b', fontSize: '14.5px' }}>Solicitud de Cotización #{id_solicitud}</strong>
                  {cotList.length >= 2 && (
                    <button onClick={() => evaluarCotizacionesIA(id_solicitud)} className="btn btn-primary btn-sm" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      ✨ Análisis Comparativo con IA
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cotList.map(c => {
                    const alerta = calcularAlertaVencimiento(c.fecha_vigencia);
                    const isRecomendada = analisisIA?.proveedor_recomendado_id === c.id_proveedor;
                    return (
                      <div key={c.id_cotizacion} className={isRecomendada ? '' : 'modern-event-card'} style={isRecomendada ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px', borderLeft: `4px solid #22c55e`, border: '1px solid #bbf7d0', boxShadow: '0 4px 12px rgba(34,197,94,0.1)' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', flexDirection: 'row' }}>
                        <div>
                          <strong style={{ color: isRecomendada ? '#166534' : '#0f172a', fontSize: '14px' }}>
                            {c.proveedor_nombre} {isRecomendada && '⭐ (Recomendación IA)'}
                          </strong>
                          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span><strong>Monto:</strong> {c.moneda} {c.monto_total_detectado || 'N/A'}</span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span><strong>Válida hasta:</strong> {new Date(c.fecha_vigencia).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: '600', color: alerta.color, background: alerta.bg, padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {alerta.texto !== 'Vigente' && <FiAlertCircle />} {alerta.texto}
                          </span>
                          <a href={`${API}/${c.ruta_documento_pdf}`} target="_blank" rel="noreferrer" className="details-btn">
                            <FiDownload /> Ver Oferta
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {analisisIA && cotList.some(c => c.id_proveedor === analisisIA.proveedor_recomendado_id) && (
                  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '12px' }}>
                    <h5 style={{ color: '#86198f', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>✨ Veredicto de la IA</h5>
                    <p style={{ fontSize: '13.5px', color: '#4a044e', marginBottom: '16px', lineHeight: '1.6' }}>{analisisIA.justificacion}</p>
                    <table className="modern-table" style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead style={{ background: '#fae8ff' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Proveedor</th>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Costo (DOP)</th>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Ventajas Detectadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analisisIA.matriz_comparativa?.map((mat, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #fae8ff' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#86198f' }}>{mat.proveedor}</td>
                            <td style={{ padding: '12px 16px', color: '#4a044e' }}>RD$ {mat.costo_normalizado_dop}</td>
                            <td style={{ padding: '12px 16px', color: '#4a044e' }}>{mat.ventajas?.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PANEL DE ÓRDENES DE COMPRA ── */}
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiDollarSign className="panel-icon" style={{ fontSize: '24px', color: '#10b981' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Órdenes de Compra</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Gestión de OC por cada servicio externo aprobado</p>
            </div>
          </div>
        </div>
        
        <div className="panel-body">
          {servicios.length === 0 ? (
            <div className="empty-panel-state">
              <FiBriefcase className="empty-icon" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }} />
              <p>No hay servicios externos solicitados para este evento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {servicios.map(s => (
                <div key={s.id_servicio_ext} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: '#f8fafc', transition: 'all 0.2s' }} className="hover:shadow-md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>{s.tipo_servicio} <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'normal' }}>(ID: {s.id_servicio_ext})</span></strong>
                    <span style={{ fontSize: '12px', fontWeight: '600', background: s.estado === 'Aprobado' ? '#d1fae5' : '#e0f2fe', color: s.estado === 'Aprobado' ? '#047857' : '#0369a1', padding: '4px 10px', borderRadius: '99px' }}>
                      {s.estado}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>Número de Orden de Compra (OC):</label>
                      <input 
                        type="text" 
                        className="form-control-premium" 
                        defaultValue={s.numero_orden_compra || ''}
                        onBlur={(e) => guardarCambiosServicio(s.id_servicio_ext, e.target.value, s.requiere_contrato)}
                        placeholder="Ej: OC-2026-001"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiUpload /> Cotización
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Cotizacion')} />
                      </label>
                      <label className="btn btn-primary" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                        <FiUpload /> OC Firmada
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Orden de Compra')} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const renderPresupuesto = () => (
    <div className="fade-in">
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiDollarSign className="panel-icon" style={{ fontSize: '24px', color: '#f59e0b' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Flujo de Presupuesto (VAF)</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Asignación y certificación de fondos del evento</p>
            </div>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '30px' }}>
          <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: '600', fontSize: '14px', color: '#92400e', display: 'block', marginBottom: '12px' }}>
                Estado de Asignación Presupuestaria:
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                  className="table-select-premium" 
                  value={presupuesto.estado} 
                  onChange={(e) => setPresupuesto({ ...presupuesto, estado: e.target.value })}
                  style={{ width: '100%', maxWidth: '300px', padding: '12px', fontSize: '14px' }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Asignado">Asignado (Fondos Reservados)</option>
                  <option value="Aprobado">Aprobado (Definitivo)</option>
                  <option value="Rechazado">Rechazado (Sin Fondos)</option>
                </select>
                <button className="btn btn-primary" onClick={guardarPresupuesto} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>
                  <FiCheckCircle /> Guardar Estado
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #fde68a', paddingTop: '20px' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', margin: 0, background: '#fff', borderColor: '#fcd34d', color: '#b45309' }}>
                <FiUpload /> Cargar Certificación de Fondos
                <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Certificacion de Fondos')} />
              </label>
              <p style={{ fontSize: '13px', color: '#b45309', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiFileText /> Suba el PDF de la certificación firmada por Contabilidad o la VAF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLegal = () => (
    <div className="fade-in">
      <div className="panel-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <FiShield className="panel-icon" style={{ fontSize: '24px', color: '#3b82f6' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Aprobaciones y Contratos Legales</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Dictaminar eventos y gestionar bóveda de contratos B2B</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-double-panel">
        <div className="saas-panel-card" style={{ padding: '24px', flex: 2 }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <h5 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle style={{ color: '#10b981' }}/> Emisión de Dictamen Legal
            </h5>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>Resolución del Caso:</label>
            <select 
              className="table-select-premium" 
              value={legal.estado_legal} 
              onChange={(e) => setLegal({ ...legal, estado_legal: e.target.value })}
              style={{ width: '100%', maxWidth: '300px', marginBottom: '16px' }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado (Devuelto)</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>Observaciones / Notas Jurídicas:</label>
            <textarea 
              className="form-control-premium" 
              rows="4" 
              value={legal.observacion_legal || ''} 
              onChange={(e) => setLegal({ ...legal, observacion_legal: e.target.value })}
              placeholder="Ingrese cualquier observación, enmienda requerida o nota jurídica para el solicitante..."
              style={{ width: '100%', marginBottom: '20px', resize: 'vertical' }}
            />
            <button className="btn btn-primary" onClick={guardarLegal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiShield /> Guardar Dictamen Legal
            </button>
          </div>
        </div>

        <div className="saas-panel-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h5 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFileText style={{ color: '#8b5cf6' }}/> Control de Contratos B2B
          </h5>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>Marque los servicios de proveedores externos que requieren firma de contrato antes de operar.</p>
          
          <div style={{ flex: 1 }}>
            {servicios.length === 0 ? (
              <div className="empty-panel-state" style={{ padding: '20px 0' }}>
                <p>Sin servicios externos registrados.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {servicios.map(s => (
                  <div key={s.id_servicio_ext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{s.tipo_servicio}</span>
                    <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FiUpload /> Subir Contrato Firmado a Bóveda
              <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Contrato')} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentos = () => (
    <div className="fade-in">
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiFileText className="panel-icon" style={{ fontSize: '24px', color: '#3b82f6' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Bóveda Digital</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Expediente completo de documentos del evento</p>
            </div>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '0' }}>
          {documentos.length === 0 ? (
            <div className="empty-panel-state" style={{ padding: '60px 20px' }}>
              <FiFileText className="empty-icon" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
              <h5 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '16px' }}>Sin documentos en la bóveda</h5>
              <p>No hay documentos subidos para este evento aún.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>TIPO DE DOCUMENTO</th>
                    <th>NOMBRE DEL ARCHIVO</th>
                    <th>SUBIDO POR</th>
                    <th>FECHA</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map(doc => (
                    <tr key={doc.id_documento} className="table-hover-row">
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                          {doc.tipo_documento}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '500' }}>
                          <FiFileText style={{ color: '#64748b', fontSize: '16px' }}/> {doc.nombre_archivo}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13.5px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                            {doc.usuario_nombre ? doc.usuario_nombre.charAt(0).toUpperCase() : 'S'}
                          </div>
                          {doc.usuario_nombre || 'Sistema'}
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13.5px' }}>
                        {new Date(doc.fecha_subida).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="saas-action-group" style={{ display: 'inline-flex' }}>
                          <a href={`${API}${doc.ruta_archivo}`} target="_blank" rel="noreferrer" className="action-icon-btn view" title="Descargar documento">
                            <FiDownload />
                          </a>
                          <button className="action-icon-btn delete" onClick={() => archivarDocumento(doc.id_documento)} title="Eliminar / Archivar">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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

        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>Seleccionar Evento Operativo</label>
          <select onChange={handleSelectEvent} className="table-select-premium" style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px' }}>
            <option value="">-- Elige un evento para administrar --</option>
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {`#EVT-${ev.id_evento} — ${ev.nombre} (${ev.estado})`}
              </option>
            ))}
          </select>
        </div>

        {eventoSeleccionado && (
          <div>
            {/* Tabs de Navegación Premium */}
            <div className="flujo-tabs-nav">
              {(isComprasRole || isGeneralRole) && (
                <button 
                  className={`flujo-tab-btn${tab === 'compras' ? ' active' : ''}`}
                  onClick={() => setTab('compras')} 
                >
                  Compras y Cotizaciones
                </button>
              )}
              {(isVAFRole || isGeneralRole) && (
                <button 
                  className={`flujo-tab-btn${tab === 'presupuesto' ? ' active' : ''}`}
                  onClick={() => setTab('presupuesto')} 
                >
                  Presupuesto (VAF)
                </button>
              )}
              {(isLegalRole || isGeneralRole) && (
                <button 
                  className={`flujo-tab-btn${tab === 'legal' ? ' active' : ''}`}
                  onClick={() => setTab('legal')} 
                >
                  Legal y Contratos
                </button>
              )}
              <button 
                className={`flujo-tab-btn${tab === 'documentos' ? ' active' : ''}`}
                onClick={() => setTab('documentos')}
                style={{ marginLeft: 'auto' }}
              >
                Bóveda Digital ({documentos.length})
              </button>
            </div>

            <div style={{ padding: '24px 22px' }}>
              {loading ? (
                <div className="table-state-loading" style={{ padding: '60px 0' }}>
                  <div className="loader"></div>
                  <p>Cargando expediente del evento...</p>
                </div>
              ) : (
                <>
                  {tab === 'compras' && renderCompras()}
                  {tab === 'presupuesto' && renderPresupuesto()}
                  {tab === 'legal' && renderLegal()}
                  {tab === 'documentos' && renderDocumentos()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
