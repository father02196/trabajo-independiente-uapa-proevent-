import React, { useState, useEffect } from 'react';
import { FiStar, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiBarChart2, FiClipboard, FiMapPin } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

const API = 'http://localhost:8080';

const RECINTOS = ['Cibao Oriental', 'Nagua', 'Santo Domingo Oriental', 'Santiago'];
const VALORACIONES = ['Muy eficiente', 'Excelente', 'Eficiente', 'Deficiente'];

function Evaluacion({ usuario, eventoEvalId, onEvalConsumed }) {
  const [respuesta, setRespuesta] = useState('');
  const [recinto, setRecinto] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [valoracion, setValoracion] = useState('');
  const [satisfaccion, setSatisfaccion] = useState(0);
  const [comentario, setComentario] = useState('');

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [enviado, setEnviado] = useState(false);

  const [evaluaciones, setEvaluaciones] = useState([]);
  const isAdmin = Boolean(usuario?.rol && (usuario.rol.includes('Administrador') || usuario.rol.includes('admin') || (typeof usuario.rol === 'string' && usuario.rol.toLowerCase().includes('admin'))));

  useEffect(() => {
    if (eventoEvalId) {
      setEventoId(String(eventoEvalId));
      if (onEvalConsumed) onEvalConsumed();
    }
  }, [eventoEvalId, onEvalConsumed]);

  useEffect(() => {
    fetch(`${API}/eventos`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEventos(data.filter(e => e.estado === 'Finalizado'));
        } else {
          setEventos([]);
        }
      })
      .catch(() => setEventos([]));

    if (isAdmin) cargarEvaluaciones();
  }, [isAdmin]);

  const cargarEvaluaciones = () => {
    fetch(`${API}/evaluaciones`)
      .then(r => r.json())
      .then(data => {
        const normalized = Array.isArray(data)
          ? data.map(ev => ({
              ...ev,
              fecha_evento: ev.fecha_evento || ev.fecha || '',
            }))
          : [];
        setEvaluaciones(normalized);
      })
      .catch(() => setEvaluaciones([]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!respuesta || !recinto || !eventoId || !valoracion || !satisfaccion) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos obligatorios.' });
      return;
    }
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch(`${API}/evaluaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario?.token || ""}`, 'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify({
          id_evento: Number(eventoId),
          respuesta_solicitud: respuesta,
          recinto,
          valoracion_respuesta: valoracion,
          satisfaccion,
          comentario
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: body.mensaje || 'Error al enviar la evaluación.' });
      } else {
        setEnviado(true);
        if (isAdmin) cargarEvaluaciones();
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar al servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRespuesta('');
    setRecinto('');
    setEventoId('');
    setValoracion('');
    setSatisfaccion(0);
    setComentario('');
    setMensaje(null);
    setEnviado(false);
  };

  const bestRecinto = React.useMemo(() => {
    if (!evaluaciones.length) return '-';
    const counts = {};
    evaluaciones.forEach(ev => {
      const r = ev.recinto;
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    const entry = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0]);
    return entry[0] || '-';
  }, [evaluaciones]);

  const stats = React.useMemo(() => {
    if (!evaluaciones.length) return null;
    const total = evaluaciones.length;
    const promSat = Math.round(evaluaciones.reduce((sum, ev) => sum + (ev.satisfaccion || 0), 0) / total);
    return { total, promSat, bestRecinto };
  }, [evaluaciones, bestRecinto]);

  const { items: sortedEvaluaciones, requestSort: requestSortEval, sortConfig: sortConfigEval } = useSortableData(evaluaciones, { key: 'id_evaluacion', direction: 'descending' });

  if (enviado) {
    return (
      <div className="animate-fade" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', borderTop: '4px solid #10B981' }}>
          <FiCheckCircle size={64} style={{ color: '#10B981', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>¡Evaluación enviada!</h2>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>Gracias por tu valoración. Tu opinión nos ayuda a mejorar los servicios del Departamento de Protocolo y Eventos.</p>
          <button className="btn btn-primary" onClick={resetForm} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
            <FiRefreshCw /> Enviar otra evaluación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Evaluación de Servicios</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>Ayúdanos a mejorar. Valora la atención y el servicio recibido.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mensaje && (
            <div style={{ padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: mensaje.tipo === 'error' ? '#FEF2F2' : '#F0FDF4', color: mensaje.tipo === 'error' ? '#EF4444' : '#10B981', border: `1px solid ${mensaje.tipo === 'error' ? '#FECACA' : '#BBF7D0'}` }}>
              {mensaje.tipo === 'error' ? <FiAlertTriangle size={20} /> : <FiCheckCircle size={20} />}
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{mensaje.texto}</span>
            </div>
          )}

          <div className="card" style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Evento evaluado <span style={{ color: '#EF4444' }}>*</span></label>
            <select className="input-base" value={eventoId} onChange={e => setEventoId(e.target.value)}>
              <option value="">-- Selecciona el evento que fue atendido --</option>
              {eventos.map(ev => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  #{ev.id_evento} — {ev.nombre} ({String(ev.fecha_inicio).substring(0, 10)})
                </option>
              ))}
            </select>
            {eventos.length === 0 && <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Solo se muestran eventos con estado <strong>Finalizado</strong>.</p>}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px' }}>
              ¿Has solicitado alguna actividad al Departamento de Protocolo y Eventos? <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Si', 'No'].map(op => (
                <label key={op} style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: respuesta === op ? '#3B82F6' : '#E2E8F0', backgroundColor: respuesta === op ? '#EFF6FF' : '#FFFFFF', color: respuesta === op ? '#1D4ED8' : '#475569', fontWeight: respuesta === op ? '700' : '500'
                }} onClick={() => setRespuesta(op)}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${respuesta === op ? '#3B82F6' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {respuesta === op && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />}
                  </div>
                  {op}
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px' }}>Recinto <span style={{ color: '#EF4444' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {RECINTOS.map(r => (
                <label key={r} style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: recinto === r ? '#3B82F6' : '#E2E8F0', backgroundColor: recinto === r ? '#EFF6FF' : '#FFFFFF', color: recinto === r ? '#1D4ED8' : '#475569', fontWeight: recinto === r ? '700' : '500'
                }} onClick={() => setRecinto(r)}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${recinto === r ? '#3B82F6' : '#CBD5E1'}`, backgroundColor: recinto === r ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {recinto === r && <FiCheckCircle color="white" size={12} />}
                  </div>
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px' }}>
              ¿Cómo valora la respuesta inicial a la solicitud? <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {VALORACIONES.map(v => (
                <label key={v} style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: valoracion === v ? '#3B82F6' : '#E2E8F0', backgroundColor: valoracion === v ? '#EFF6FF' : '#FFFFFF', color: valoracion === v ? '#1D4ED8' : '#475569', fontWeight: valoracion === v ? '700' : '500'
                }} onClick={() => setValoracion(v)}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${valoracion === v ? '#3B82F6' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {valoracion === v && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />}
                  </div>
                  {v}
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '20px' }}>
              Nivel de satisfacción en relación a la coordinación <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Poco satisfecho</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setSatisfaccion(n)} style={{
                    width: '48px', height: '48px', borderRadius: '50%', fontSize: '18px', fontWeight: '800', transition: 'all 0.2s', cursor: 'pointer',
                    backgroundColor: satisfaccion === n ? '#3B82F6' : satisfaccion > 0 && n <= satisfaccion ? '#EFF6FF' : '#F8FAFC',
                    color: satisfaccion === n ? 'white' : satisfaccion > 0 && n <= satisfaccion ? '#3B82F6' : '#64748B',
                    border: `2px solid ${satisfaccion === n ? '#3B82F6' : satisfaccion > 0 && n <= satisfaccion ? '#BFDBFE' : '#E2E8F0'}`,
                    transform: satisfaccion === n ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: satisfaccion === n ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none'
                  }}>
                    {n}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Muy satisfecho</span>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Comentarios adicionales <span style={{ color: '#64748B', fontWeight: '400', fontSize: '12px' }}>(opcional)</span></label>
            <textarea
              className="input-base"
              placeholder="Cuéntanos más sobre tu experiencia..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={4}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 32px', fontSize: '15px' }}>
              {loading ? 'Enviando...' : 'Enviar Evaluación'}
            </button>
          </div>
        </form>

        {isAdmin && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiBarChart2 size={24} color="#3B82F6" />
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Historial de Evaluaciones</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={cargarEvaluaciones}>
                <FiRefreshCw /> Actualizar Datos
              </button>
            </div>

            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiStar size={24} /></div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Promedio</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.promSat} / 5</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiClipboard size={24} /></div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Eval.</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.total}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiMapPin size={24} /></div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Mejor Recinto</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{bestRecinto}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <SortableHeader label="ID" sortKey="id_evaluacion" sortConfig={sortConfigEval} requestSort={requestSortEval} />
                      <SortableHeader label="Evento" sortKey="nombre_evento" sortConfig={sortConfigEval} requestSort={requestSortEval} />
                      <SortableHeader label="Recinto" sortKey="recinto" sortConfig={sortConfigEval} requestSort={requestSortEval} />
                      <SortableHeader label="Valoración Resp." sortKey="valoracion_respuesta" sortConfig={sortConfigEval} requestSort={requestSortEval} />
                      <SortableHeader label="Satisfacción" sortKey="satisfaccion" sortConfig={sortConfigEval} requestSort={requestSortEval} style={{ textAlign: 'center' }} />
                      <SortableHeader label="Fecha" sortKey="fecha_evento" sortConfig={sortConfigEval} requestSort={requestSortEval} />
                    </tr>
                  </thead>
                  <tbody>
                    {evaluaciones.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No hay evaluaciones registradas.</td></tr>
                    ) : (
                      sortedEvaluaciones.map(ev => (
                        <tr key={ev.id_evaluacion}>
                          <td style={{ fontWeight: '600', color: '#64748B' }}>#{ev.id_evaluacion}</td>
                          <td style={{ fontWeight: '600', color: '#0F172A' }}>{ev.nombre_evento || `Evento #${ev.id_evento}`}</td>
                          <td>{ev.recinto}</td>
                          <td>
                            <span className={`status-pill ${ev.valoracion_respuesta === 'Deficiente' ? 'status-rejected' : ev.valoracion_respuesta === 'Muy eficiente' || ev.valoracion_respuesta === 'Excelente' ? 'status-approved' : 'status-pending'}`} style={{ padding: '4px 10px', fontSize: '12px' }}>
                              {ev.valoracion_respuesta}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              {[1,2,3,4,5].map(n => (
                                <FiStar key={n} color={n <= ev.satisfaccion ? '#F59E0B' : '#E2E8F0'} fill={n <= ev.satisfaccion ? '#F59E0B' : 'transparent'} />
                              ))}
                            </div>
                          </td>
                          <td style={{ color: '#64748B', fontSize: '13px' }}>{ev.fecha_evento ? String(ev.fecha_evento).substring(0, 10) : ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Evaluacion;
