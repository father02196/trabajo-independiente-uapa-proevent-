import React, { useState, useEffect } from 'react';
import './../css/Evaluacion.css';
import {
  FiStar, FiCheckCircle, FiAlertTriangle, FiRefreshCw,
  FiBarChart2, FiClipboard, FiList
} from 'react-icons/fi';

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
  const isAdmin = usuario?.rol === 'Administrador';

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
        setEvaluaciones(Array.isArray(data) ? data : []);
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
          'x-usuario-id': usuario?.id_usuario || ''
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
  const stats = React.useMemo(() => {
    if (!evaluaciones.length) return null;
    const promSat = (evaluaciones.reduce((a, e) => a + e.satisfaccion, 0) / evaluaciones.length).toFixed(1);
    const dist = VALORACIONES.reduce((acc, v) => {
      acc[v] = evaluaciones.filter(e => e.valoracion_respuesta === v).length;
      return acc;
    }, {});
    return { promSat, dist, total: evaluaciones.length };
  }, [evaluaciones]);

  /* ── Pantalla de éxito ── */
  if (enviado) {
    return (
      <div className="eval-container">
        <div className="eval-success-screen">
          <div className="eval-success-icon"><FiCheckCircle /></div>
          <h2>¡Evaluación enviada!</h2>
          <p>Gracias por tu valoración. Tu opinión nos ayuda a mejorar los servicios del Departamento de Protocolo y Eventos.</p>
          <button className="eval-btn-primary" onClick={resetForm}>
            <FiRefreshCw /> Enviar otra evaluación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="eval-container">
      {/* ── HEADER ── */}
      <div className="eval-header">
        <div className="eval-header-icon"><FiStar /></div>
        <div>
          <h1 className="eval-title">Evaluación al Departamento de Protocolo y Eventos</h1>
          <p className="eval-subtitle">
            Gracias por confiar en la organización de su evento. Esperamos conocer su valoración
            de resultados esperados para poder seguir mejorando los servicios y logística.
          </p>
        </div>
      </div>

      <div className="eval-body">
        {/* ── FORMULARIO ── */}
        <form className="eval-form" onSubmit={handleSubmit}>

          {mensaje && (
            <div className={`eval-alert ${mensaje.tipo}`}>
              {mensaje.tipo === 'error' ? <FiAlertTriangle /> : <FiCheckCircle />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {/* Evento */}
          <div className="eval-card">
            <label className="eval-card-title">Evento evaluado <span className="req">*</span></label>
            <select
              className="eval-select"
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
              <p className="eval-hint">Solo se muestran eventos con estado <strong>Finalizado</strong>.</p>
            )}
          </div>

          {/* ¿Ha solicitado alguna actividad? */}
          <div className="eval-card">
            <label className="eval-card-title">
              ¿Has solicitado alguna actividad al Departamento de Protocolo y Eventos? <span className="req">*</span>
            </label>
            <div className="eval-checkbox-group">
              {['Si', 'No'].map(op => (
                <label
                  key={op}
                  className={`eval-checkbox-label ${respuesta === op ? 'selected' : ''}`}
                  onClick={() => setRespuesta(op)}
                >
                  <span className={`eval-checkbox-box ${respuesta === op ? 'checked' : ''}`} />
                  {op}
                </label>
              ))}
            </div>
          </div>

          {/* Recinto */}
          <div className="eval-card">
            <label className="eval-card-title">Recinto <span className="req">*</span></label>
            <div className="eval-checkbox-group">
              {RECINTOS.map(r => (
                <label
                  key={r}
                  className={`eval-checkbox-label ${recinto === r ? 'selected' : ''}`}
                  onClick={() => setRecinto(r)}
                >
                  <span className={`eval-checkbox-box ${recinto === r ? 'checked' : ''}`} />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Valoración de respuesta inicial */}
          <div className="eval-card">
            <label className="eval-card-title">
              ¿Cómo valora la respuesta inicial a la solicitud? <span className="req">*</span>
            </label>
            <div className="eval-radio-group">
              {VALORACIONES.map(v => (
                <label
                  key={v}
                  className={`eval-radio-label ${valoracion === v ? 'selected' : ''}`}
                  onClick={() => setValoracion(v)}
                >
                  <span className={`eval-radio-dot ${valoracion === v ? 'checked' : ''}`} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Satisfacción general */}
          <div className="eval-card">
            <label className="eval-card-title">
              ¿Cuál es tu nivel de satisfacción en relación a la coordinación general de la actividad? <span className="req">*</span>
            </label>
            <div className="eval-scale">
              <span className="eval-scale-label">Poco satisfecho</span>
              <div className="eval-scale-dots">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`eval-scale-dot ${satisfaccion === n ? 'active' : ''} ${satisfaccion > 0 && n <= satisfaccion ? 'filled' : ''}`}
                    onClick={() => setSatisfaccion(n)}
                    title={`${n}`}
                  >
                    <span className="eval-scale-num">{n}</span>
                  </button>
                ))}
              </div>
              <span className="eval-scale-label">Muy satisfecho</span>
            </div>
          </div>

          {/* Comentarios */}
          <div className="eval-card">
            <label className="eval-card-title">Comentarios adicionales <span className="eval-optional">(opcional)</span></label>
            <textarea
              className="eval-textarea"
              placeholder="Cuéntanos más sobre tu experiencia con el departamento..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={4}
            />
          </div>

          <div className="eval-actions">
            <button type="submit" className="eval-btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Evaluación'}
            </button>
          </div>
        </form>

        {/* ── PANEL ADMINISTRADOR ── */}
        {isAdmin && (
          <aside className="eval-admin-panel">
            <div className="eval-admin-header">
              <h2>Panel de Resultados</h2>
              <div className="eval-admin-tabs">
                <button
                  className={`eval-tab ${vistaAdmin === 'tabla' ? 'active' : ''}`}
                  onClick={() => setVistaAdmin('tabla')}
                ><FiList /> Evaluaciones</button>
                <button
                  className={`eval-tab ${vistaAdmin === 'stats' ? 'active' : ''}`}
                  onClick={() => setVistaAdmin('stats')}
                ><FiBarChart2 /> Estadísticas</button>
              </div>
              <button className="eval-btn-refresh" onClick={cargarEvaluaciones} title="Actualizar">
                <FiRefreshCw />
              </button>
            </div>

            {vistaAdmin === 'tabla' && (
              <div className="eval-table-wrap">
                <table className="eval-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Evento</th>
                      <th>Recinto</th>
                      <th>Valoración</th>
                      <th>Satisf.</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluaciones.length === 0 ? (
                      <tr><td colSpan="6" className="eval-table-empty">No hay evaluaciones registradas aún</td></tr>
                    ) : (
                      evaluaciones.map(ev => (
                        <tr key={ev.id_evaluacion}>
                          <td>#{ev.id_evaluacion}</td>
                          <td>{ev.nombre_evento || `Evento #${ev.id_evento}`}</td>
                          <td>{ev.recinto}</td>
                          <td>
                            <span className={`eval-badge ${ev.valoracion_respuesta === 'Deficiente' ? 'bad' : ev.valoracion_respuesta === 'Muy eficiente' || ev.valoracion_respuesta === 'Excelente' ? 'good' : 'mid'}`}>
                              {ev.valoracion_respuesta}
                            </span>
                          </td>
                          <td>
                            <div className="eval-sat-display">
                              {[1,2,3,4,5].map(n => (
                                <span key={n} className={`eval-sat-star ${n <= ev.satisfaccion ? 'lit' : ''}`}>★</span>
                              ))}
                            </div>
                          </td>
                          <td>{String(ev.fecha).substring(0, 10)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {vistaAdmin === 'stats' && stats && (
              <div className="eval-stats">
                <div className="eval-stat-card highlight">
                  <span className="eval-stat-num">{stats.promSat}</span>
                  <span className="eval-stat-label">Promedio de satisfacción</span>
                  <div className="eval-stat-stars">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={`eval-sat-star ${n <= Math.round(stats.promSat) ? 'lit' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="eval-stat-card">
                  <span className="eval-stat-num">{stats.total}</span>
                  <span className="eval-stat-label">Total de evaluaciones</span>
                </div>
                <div className="eval-stats-dist">
                  <h4>Distribución de valoraciones</h4>
                  {VALORACIONES.map(v => {
                    const count = stats.dist[v] || 0;
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={v} className="eval-dist-row">
                        <span className="eval-dist-label">{v}</span>
                        <div className="eval-dist-bar-wrap">
                          <div className="eval-dist-bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="eval-dist-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {vistaAdmin === 'stats' && !stats && (
              <div className="eval-table-empty" style={{ textAlign: 'center', padding: '2rem' }}>
                No hay datos suficientes para mostrar estadísticas.
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default Evaluacion;
