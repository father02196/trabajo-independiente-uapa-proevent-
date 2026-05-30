import React, { useState, useEffect } from 'react';
import './../css/Evaluacion.css';
import { FiStar, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiBarChart2, FiClipboard, FiList, FiMapPin } from 'react-icons/fi';

const API = 'http://localhost:8080';

const RECINTOS = ['Cibao Oriental', 'Nagua', 'Santo Domingo Oriental', 'Santiago'];
const VALORACIONES = ['Muy eficiente', 'Excelente', 'Eficiente', 'Deficiente'];

function Evaluacion({ usuario, eventoEvalId, onEvalConsumed }) {
  /* ── Estado del formulario ── */
  const [respuesta, setRespuesta] = useState('');
  const [recinto, setRecinto] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [valoracion, setValoracion] = useState('');
  const [satisfaccion, setSatisfaccion] = useState(0);
  const [comentario, setComentario] = useState('');

  /* ── Estado de UI ── */
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [enviado, setEnviado] = useState(false);

  /* ── Panel Admin ── */
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [vistaAdmin, setVistaAdmin] = useState('tabla');
  // Lógica de roles de RM-fronters
  const isAdmin = Boolean(usuario?.rol && (usuario.rol.includes('Administrador') || usuario.rol.includes('admin') || (typeof usuario.rol === 'string' && usuario.rol.toLowerCase().includes('admin'))));

  /* ── Pre-carga desde notificación ── */
  useEffect(() => {
    if (eventoEvalId) {
      setEventoId(String(eventoEvalId));
      if (onEvalConsumed) onEvalConsumed();
    }
  }, [eventoEvalId]);

  /* ── Carga inicial ── */
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

  /* ── Envío del formulario ── */
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

  /* ── Estadísticas para el panel admin ── */
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
    const dist = {};
    VALORACIONES.forEach(v => {
      dist[v] = evaluaciones.filter(ev => ev.valoracion_respuesta === v).length;
    });
    return { total, promSat, dist, bestRecinto };
  }, [evaluaciones, bestRecinto]);

  /* ── Pantalla de éxito ── */
  if (enviado) {
    return (
      <div className="evaluacion-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="eval-form-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <FiCheckCircle style={{ fontSize: '60px', color: '#10B981', margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', marginBottom: '10px' }}>¡Evaluación enviada!</h2>
          <p style={{ color: '#64748B', marginBottom: '25px', lineHeight: '1.6' }}>Gracias por tu valoración. Tu opinión nos ayuda a mejorar los servicios del Departamento de Protocolo y Eventos.</p>
          <button className="btn-eval-primary" onClick={resetForm} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FiRefreshCw /> Enviar otra evaluación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="evaluacion-page">
      
      {/* ── HEADER ── */}
      <div className="eval-page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiStar style={{ color: '#3B82F6' }} />
          Evaluación de Servicios
        </h1>
        <p>Ayúdanos a mejorar. Valora la atención y el servicio recibido por el Departamento de Protocolo y Eventos.</p>
      </div>

      {mensaje && (
        <div className={`eval-result-banner ${mensaje.tipo === 'error' ? 'poor' : 'excellent'}`}>
          <div className="eval-result-info">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {mensaje.tipo === 'error' ? <FiAlertTriangle /> : <FiCheckCircle />}
              {mensaje.texto}
            </h3>
          </div>
        </div>
      )}

      {/* ── FORMULARIO ── */}
      <div className="eval-form-card" style={{ marginBottom: '40px' }}>
        <div className="eval-form-header">
          <h2>Formulario de Retroalimentación</h2>
          <p>Completa los siguientes campos obligatorios para enviarnos tu opinión.</p>
        </div>

        <form className="eval-form-body" onSubmit={handleSubmit}>
          
          {/* Evento */}
          <div className="eval-criterion">
            <label className="eval-criterion-label">
              Evento evaluado <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
            </label>
            <select
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '14px', outline: 'none' }}
              value={eventoId}
              onChange={e => setEventoId(e.target.value)}
            >
              <option value="">-- Selecciona el evento que fue atendido --</option>
              {eventos.map(ev => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  #{ev.id_evento} — {ev.nombre} ({String(ev.fecha_inicio).substring(0, 10)})
                </option>
              ))}
            </select>
            {eventos.length === 0 && (
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>Solo se muestran eventos con estado Finalizado.</p>
            )}
          </div>

          {/* ¿Ha solicitado alguna actividad? */}
          <div className="eval-criterion">
            <label className="eval-criterion-label">
              ¿Has solicitado alguna actividad al Departamento de Protocolo y Eventos? <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Si', 'No'].map(op => (
                <label
                  key={op}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                    borderRadius: '10px', border: respuesta === op ? '1.5px solid #3B82F6' : '1.5px solid #E2E8F0',
                    background: respuesta === op ? '#EFF6FF' : '#fff', color: respuesta === op ? '#1D4ED8' : '#475569',
                    cursor: 'pointer', fontWeight: respuesta === op ? '600' : '500', transition: 'all 0.2s'
                  }}
                  onClick={() => setRespuesta(op)}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: respuesta === op ? '5px solid #3B82F6' : '2px solid #CBD5E1', background: '#fff'
                  }} />
                  {op}
                </label>
              ))}
            </div>
          </div>

          {/* Recinto */}
          <div className="eval-criterion">
            <label className="eval-criterion-label">
              Recinto <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {RECINTOS.map(r => (
                <label
                  key={r}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                    borderRadius: '10px', border: recinto === r ? '1.5px solid #3B82F6' : '1.5px solid #E2E8F0',
                    background: recinto === r ? '#EFF6FF' : '#fff', color: recinto === r ? '#1D4ED8' : '#475569',
                    cursor: 'pointer', fontWeight: recinto === r ? '600' : '500', transition: 'all 0.2s'
                  }}
                  onClick={() => setRecinto(r)}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    background: recinto === r ? '#3B82F6' : '#fff', border: recinto === r ? 'none' : '2px solid #CBD5E1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {recinto === r && <FiCheckCircle style={{ color: '#fff', fontSize: '12px' }} />}
                  </div>
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Valoración de respuesta inicial */}
          <div className="eval-criterion">
            <label className="eval-criterion-label">
              ¿Cómo valora la respuesta inicial a la solicitud? <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {VALORACIONES.map(v => (
                <label
                  key={v}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                    borderRadius: '10px', border: valoracion === v ? '1.5px solid #3B82F6' : '1.5px solid #E2E8F0',
                    background: valoracion === v ? '#EFF6FF' : '#fff', color: valoracion === v ? '#1D4ED8' : '#475569',
                    cursor: 'pointer', fontWeight: valoracion === v ? '600' : '500', transition: 'all 0.2s', flex: '1 1 200px'
                  }}
                  onClick={() => setValoracion(v)}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: valoracion === v ? '5px solid #3B82F6' : '2px solid #CBD5E1', background: '#fff'
                  }} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Satisfacción general (Star Rating) */}
          <div className="eval-criterion" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <label className="eval-criterion-label" style={{ justifyContent: 'center', marginBottom: '20px', fontSize: '15px' }}>
              ¿Cuál es tu nivel de satisfacción en relación a la coordinación general? <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#94A3B8' }}>Poco satisfecho</span>
              <div className="star-rating">
                {[5, 4, 3, 2, 1].map(n => (
                  <React.Fragment key={n}>
                    <input 
                      type="radio" 
                      id={`star${n}`} 
                      name="rating" 
                      value={n} 
                      checked={satisfaccion === n} 
                      onChange={() => setSatisfaccion(n)} 
                    />
                    <label htmlFor={`star${n}`} style={{ color: satisfaccion >= n ? '#F59E0B' : '#E2E8F0' }}>★</label>
                  </React.Fragment>
                ))}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#94A3B8' }}>Muy satisfecho</span>
            </div>
          </div>

          {/* Comentarios */}
          <div className="eval-comment-group">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Comentarios adicionales <span style={{ fontWeight: 'normal', color: '#94A3B8' }}>(opcional)</span>
            </label>
            <textarea
              className="eval-textarea"
              placeholder="Cuéntanos más sobre tu experiencia con el departamento..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
          </div>

        </form>

        <div className="eval-form-footer">
          <button type="submit" className="btn-eval-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Enviando...' : 'Enviar Evaluación'}
          </button>
        </div>
      </div>

      {/* ── PANEL ADMINISTRADOR ── */}
      {isAdmin && (
        <div style={{ marginTop: '40px' }}>
          <div className="eval-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiBarChart2 style={{ color: '#3B82F6' }} />
                Resultados Globales de Evaluación
              </h2>
              <p style={{ marginTop: '4px', color: '#64748B', fontSize: '14px' }}>Resumen estadístico de satisfacción</p>
            </div>
            <button className="btn-eval-secondary" onClick={cargarEvaluaciones} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiRefreshCw /> Actualizar
            </button>
          </div>

          {evaluaciones.length === 0 ? (
            <div className="eval-form-card" style={{ padding: '40px', textAlign: 'center' }}>
              <FiClipboard style={{ fontSize: '48px', color: '#CBD5E1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Aún no hay evaluaciones</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Los resultados aparecerán aquí cuando los usuarios comiencen a evaluar eventos.</p>
            </div>
          ) : (
            <div className="eval-cards-grid">
              <div className="eval-card">
                <div className="eval-card-top">
                  <div className="eval-card-title">Satisfacción Promedio</div>
                  <div className="eval-score-badge excellent"><FiStar style={{ fontSize: '20px' }} /></div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', lineHeight: '1', marginBottom: '8px' }}>
                  {stats?.promSat} <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '600' }}>/ 5</span>
                </div>
                <div className="eval-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={`eval-star ${n <= (stats?.promSat || 0) ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
              </div>

              <div className="eval-card">
                <div className="eval-card-top">
                  <div className="eval-card-title">Total Evaluaciones</div>
                  <div className="eval-score-badge good"><FiClipboard style={{ fontSize: '20px' }} /></div>
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', lineHeight: '1', marginBottom: '16px' }}>
                  {stats?.total}
                </div>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Respuestas procesadas</p>
              </div>

              <div className="eval-card">
                <div className="eval-card-top">
                  <div className="eval-card-title">Mejor Recinto</div>
                  <div className="eval-score-badge average"><FiMapPin style={{ fontSize: '20px' }} /></div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: '1.2', marginBottom: '16px' }}>
                  {stats?.bestRecinto}
                </div>
                <div className="eval-card-meta">
                  <span className="eval-meta-chip">Mayor satisfacción</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default Evaluacion;
