import React, { useState, useEffect } from 'react';
import { FiClipboard, FiRefreshCw, FiEye, FiCheckCircle, FiShield, FiFileText, FiX, FiBriefcase, FiDollarSign, FiArrowLeft, FiArrowRight, FiSave, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API = "http://localhost:8080";

const formatPdfUrl = (path) => {
  if (!path) return '';
  return path.startsWith('./') ? `${API}${path.substring(1)}` : path.startsWith('/') ? `${API}${path}` : `${API}/${path}`;
};

export default function GestionDictamenes({ usuario, setActiveTab }) {
  const [dictamenes, setDictamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ID del evento que se está dictaminando actualmente
  const [eventoActivoId, setEventoActivoId] = useState(() => {
    return localStorage.getItem('evento_dictamen_legal') || null;
  });
  
  // Estados del editor
  const [estadoLegal, setEstadoLegal] = useState('En revisión');
  const [observacionLegal, setObservacionLegal] = useState('');
  
  const cargarDictamenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/dictamenes-pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDictamenes(data);
        
        // Si hay un evento activo, cargar sus datos en el editor
        if (eventoActivoId) {
          const evt = data.find(d => d.id_evento.toString() === eventoActivoId.toString());
          if (evt) {
            setEstadoLegal(evt.estado_legal !== 'Pendiente' ? evt.estado_legal : 'En revisión');
            setObservacionLegal(evt.observacion_legal || '');
          } else {
            // Si el evento ya no está en la lista de pendientes (ej. ya se aprobó)
            // se limpia el editor
            toast.success('El expediente ya no se encuentra pendiente.');
            cerrarEditor();
          }
        }
      } else {
        setDictamenes([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDictamenes();
  }, [eventoActivoId]);

  const guardarBorrador = async () => {
    if (!eventoActivoId) return;
    try {
      const res = await fetch(`${API}/api/flujo_legal/${eventoActivoId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario?.toString() || ''
        },
        body: JSON.stringify({ 
          estado_legal: 'En revisión',
          observacion_legal: observacionLegal,
          id_usuario_revisor: usuario?.id_usuario
        })
      });
      if (res.ok) {
         toast.success('Borrador guardado exitosamente.');
      } else {
         toast.error('Error al guardar el borrador.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión.');
    }
  };

  const emitirDictamen = async () => {
    if (!eventoActivoId) return;
    if (estadoLegal === 'En revisión' || estadoLegal === 'Pendiente') {
      return toast.error('Seleccione una resolución final (Aprobado, Rechazado u Observado).');
    }
    if (estadoLegal === 'Observado' && !observacionLegal.trim()) {
      return toast.error('Debe escribir una observación para devolver el evento.');
    }
    
    try {
      if (estadoLegal === 'Observado') {
        const res = await fetch(`${API}/api/legal/${eventoActivoId}/observar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-usuario-id': usuario?.id_usuario?.toString() || '' },
          body: JSON.stringify({ 
            id_usuario: usuario?.id_usuario, 
            comentario: observacionLegal 
          })
        });
        if (res.ok) {
           toast.success('Evento devuelto exitosamente (Observado).');
           // En caso de observación, volvemos a la lista de dictámenes (ya no está asignado al Flujo)
           cerrarEditor();
        } else {
           toast.error('Error al observar el evento.');
        }
      } else {
        const res = await fetch(`${API}/api/flujo_legal/${eventoActivoId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-usuario-id': usuario?.id_usuario?.toString() || ''
          },
          body: JSON.stringify({ 
            estado_legal: estadoLegal,
            observacion_legal: observacionLegal,
            id_usuario_revisor: usuario?.id_usuario
          })
        });
        if (res.ok) {
           toast.success(`Dictamen emitido como ${estadoLegal}.`);
           // Regresar al Flujo Administrativo para continuar el proceso (ej. Subir contratos)
           localStorage.setItem('evento_preseleccionado_legal', eventoActivoId.toString());
           setActiveTab('FlujoAdministrativo');
           // Limpiamos nuestro localStorage local
           localStorage.removeItem('evento_dictamen_legal');
        } else {
           toast.error('Error al emitir el dictamen.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión.');
    }
  };

  const cerrarEditor = () => {
    localStorage.removeItem('evento_dictamen_legal');
    setEventoActivoId(null);
    setEstadoLegal('En revisión');
    setObservacionLegal('');
    cargarDictamenes();
  };

  const seleccionarEvento = (id) => {
    localStorage.setItem('evento_dictamen_legal', id.toString());
    setEventoActivoId(id);
  };

  const dictamenesAsignados = dictamenes.filter(d => 
    d.estado_legal === 'En revisión' && 
    (usuario?.id_rol === 1 || d.id_usuario_revisor == usuario?.id_usuario)
  );

  const eventoActivo = dictamenes.find(d => d.id_evento.toString() === eventoActivoId?.toString());

  // === RENDER EDITOR ===
  if (eventoActivoId && eventoActivo) {
    return (
      <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
        <button 
          onClick={cerrarEditor}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' }}
        >
          <FiArrowLeft /> Volver a mis expedientes
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiShield color="#4f46e5" /> Elaboración de Dictamen Legal
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Expediente: <strong>#EVT-{eventoActivo.id_evento} - {eventoActivo.nombre_evento}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {eventoActivo.ruta_documento_pdf && (
              <a 
                href={formatPdfUrl(eventoActivo.ruta_documento_pdf)} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', textDecoration: 'none' }}
              >
                <FiFileText /> Ver Cotización Adjudicada
              </a>
            )}
          </div>
        </div>

        <div className="dashboard-double-panel" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBriefcase color="#475569" /> Detalles del Expediente
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em' }}>Solicitante</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{eventoActivo.solicitante}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em' }}>Dependencia</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{eventoActivo.dependencia}</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em' }}>Proveedor Adjudicado</label>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0369a1' }}>{eventoActivo.proveedor_ganador}</div>
                </div>
                {eventoActivo.monto_total_detectado && (
                  <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#065f46', fontWeight: '700', letterSpacing: '0.05em' }}>Monto Total</label>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiDollarSign /> {Number(eventoActivo.monto_total_detectado).toLocaleString('es-DO')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: '2', minWidth: '400px' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle color="#10b981" /> Resolución Final
                </h4>
                <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>Estado del Dictamen:</label>
                <select 
                  value={estadoLegal} 
                  onChange={(e) => setEstadoLegal(e.target.value)}
                  style={{ width: '100%', maxWidth: '300px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: '500' }}
                >
                  <option value="En revisión">En revisión (Borrador)</option>
                  <option value="Observado">Observado (Devolver para subsanación)</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiFileText color="#64748b" /> Redacción del Dictamen / Observaciones
                </label>
                <textarea 
                  rows="8" 
                  value={observacionLegal} 
                  onChange={(e) => setObservacionLegal(e.target.value)}
                  placeholder="Redacte aquí el contenido del dictamen, los fundamentos jurídicos, requerimientos o enmiendas legales..."
                  style={{ 
                    width: '100%', resize: 'vertical', minHeight: '150px', padding: '16px', borderRadius: '10px',
                    border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6', color: '#334155', outline: 'none', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <button 
                  onClick={guardarBorrador}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <FiSave size={16} /> Guardar Borrador
                </button>
                
                <button 
                  onClick={emitirDictamen}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.25)'; }}
                >
                  <FiCheckCircle size={18} /> Emitir Resolución
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER LISTA DE DICTAMENES EN REVISIÓN ===
  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiClipboard color="#4f46e5" /> Mis Expedientes en Revisión
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Continuar trabajando en los dictámenes iniciados</p>
        </div>
        <button onClick={cargarDictamenes} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          <FiRefreshCw className={loading ? 'spin-icon' : ''} /> Actualizar
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ID / Evento</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Dependencia</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Proveedor</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><FiRefreshCw className="spin-icon" style={{ display: 'inline' }} size={24} /> <p>Cargando expedientes...</p></td></tr>
              ) : dictamenesAsignados.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <FiCheckCircle size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#cbd5e1' }} />
                  No tienes expedientes en revisión actualmente.<br />
                  <span style={{ fontSize: '13px', marginTop: '4px', display: 'block' }}>Ve a la Bandeja Jurídica para iniciar la revisión de nuevos expedientes.</span>
                </td></tr>
              ) : (
                dictamenesAsignados.map((d, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>#EVT-{d.id_evento}</div>
                      <div style={{ color: '#475569', fontSize: '12.5px', marginTop: '2px' }}>{d.nombre_evento}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: '500' }}>{d.dependencia}</td>
                    <td style={{ padding: '16px 20px', color: '#0369a1', fontWeight: '600' }}>{d.proveedor_ganador}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>
                        En revisión
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => seleccionarEvento(d.id_evento)} 
                        title="Continuar Revisión" 
                        style={{ background: '#4f46e5', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', fontSize: '13px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} 
                        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                      >
                        Continuar <FiArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
