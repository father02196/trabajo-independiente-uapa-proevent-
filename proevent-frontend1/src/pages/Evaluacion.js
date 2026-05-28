import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { FiStar, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiBarChart2, FiClipboard, FiList, FiMapPin } from 'react-icons/fi';

const API = 'http://localhost:8080';

const RECINTOS = ['Cibao Oriental', 'Nagua', 'Santo Domingo Oriental', 'Santiago'];
const VALORACIONES = ['Muy eficiente', 'Excelente', 'Eficiente', 'Deficiente'];

function Evaluacion({ usuario, eventoEvalId, onEvalConsumed }) {
  /* ΓöÇΓöÇ Estado del formulario ΓöÇΓöÇ */
  const [respuesta, setRespuesta] = useState('');
  const [recinto, setRecinto] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [valoracion, setValoracion] = useState('');
  const [satisfaccion, setSatisfaccion] = useState(0);
  const [comentario, setComentario] = useState('');

  /* ΓöÇΓöÇ Estado de UI ΓöÇΓöÇ */
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [enviado, setEnviado] = useState(false);

  /* ΓöÇΓöÇ Panel Admin ΓöÇΓöÇ */
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [vistaAdmin, setVistaAdmin] = useState('tabla');
  const isAdmin = Boolean(usuario?.rol && (usuario.rol.includes('Administrador') || usuario.rol.includes('admin') || (typeof usuario.rol === 'string' && usuario.rol.toLowerCase().includes('admin'))));

  /* ΓöÇΓöÇ Pre-carga desde notificaci├│n ΓöÇΓöÇ */
  useEffect(() => {
    if (eventoEvalId) {
      setEventoId(String(eventoEvalId));
      if (onEvalConsumed) onEvalConsumed();
    }
  }, [eventoEvalId]);

  /* ΓöÇΓöÇ Carga inicial ΓöÇΓöÇ */
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

  /* ΓöÇΓöÇ Env├¡o del formulario ΓöÇΓöÇ */
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
        setMensaje({ tipo: 'error', texto: body.mensaje || 'Error al enviar la evaluaci├│n.' });
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

  /* ΓöÇΓöÇ Estad├¡sticas para el panel admin ΓöÇΓöÇ */
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

  /* ΓöÇΓöÇ Pantalla de ├⌐xito ΓöÇΓöÇ */
  if (enviado) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-10">
        <div className="card p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-lg border-t-4 border-t-success">
          <FiCheckCircle className="text-6xl text-success" />
          <h2 className="text-2xl font-bold text-text-main">┬íEvaluaci├│n enviada!</h2>
          <p className="text-text-secondary max-w-md">Gracias por tu valoraci├│n. Tu opini├│n nos ayuda a mejorar los servicios del Departamento de Protocolo y Eventos.</p>
          <button className="btn btn-primary mt-4" onClick={resetForm}>
            <FiRefreshCw /> Enviar otra evaluaci├│n
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ΓöÇΓöÇ HEADER ΓöÇΓöÇ */}
      <div className="bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl p-6 flex items-center gap-4 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e3a8a 100%)' }}>
        <FiStar className="text-4xl" />
        <div>
          <h1 className="text-2xl font-extrabold">Evaluaci├│n de Servicios</h1>
          <p className="text-sm opacity-90 mt-1">
            Ay├║danos a mejorar. Valora la atenci├│n y el servicio recibido por el Departamento de Protocolo y Eventos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* ΓöÇΓöÇ FORMULARIO ΓöÇΓöÇ */}
        <form className="w-full space-y-6" onSubmit={handleSubmit}>

          {mensaje && (
            <div className={`flex items-center p-4 rounded-md shadow-sm ${mensaje.tipo === 'error' ? 'bg-danger-bg text-danger border border-danger-border' : 'bg-success-bg text-success border border-success-border'}`}>
              {mensaje.tipo === 'error' ? <FiAlertTriangle className="mr-2 flex-shrink-0" /> : <FiCheckCircle className="mr-2 flex-shrink-0" />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {/* Evento */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-2">Evento evaluado <span className="text-danger">*</span></label>
            <select
              className="input-base"
              value={eventoId}
              onChange={e => setEventoId(e.target.value)}
            >
              <option value="">-- Selecciona el evento que fue atendido --</option>
              {eventos.map(ev => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  #{ev.id_evento} ΓÇö {ev.nombre} ({String(ev.fecha_inicio).substring(0, 10)})
                </option>
              ))}
            </select>
            {eventos.length === 0 && (
              <p className="text-xs text-text-muted mt-2">Solo se muestran eventos con estado <strong>Finalizado</strong>.</p>
            )}
          </div>

          {/* ┬┐Ha solicitado alguna actividad? */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-3">
              ┬┐Has solicitado alguna actividad al Departamento de Protocolo y Eventos? <span className="text-danger">*</span>
            </label>
            <div className="flex gap-4">
              {['Si', 'No'].map(op => (
                <label
                  key={op}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${respuesta === op ? 'bg-accent-light border-accent-primary text-accent-primary font-semibold' : 'border-border-soft hover:bg-bg-subtle text-text-secondary'}`}
                  onClick={() => setRespuesta(op)}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${respuesta === op ? 'border-accent-primary' : 'border-text-faint'}`}>
                    {respuesta === op && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
                  </div>
                  {op}
                </label>
              ))}
            </div>
          </div>

          {/* Recinto */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-3">Recinto <span className="text-danger">*</span></label>
            <div className="flex flex-wrap gap-3">
              {RECINTOS.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${recinto === r ? 'bg-accent-light border-accent-primary text-accent-primary font-semibold' : 'border-border-soft hover:bg-bg-subtle text-text-secondary'}`}
                  onClick={() => setRecinto(r)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${recinto === r ? 'border-accent-primary bg-accent-primary' : 'border-text-faint'}`}>
                    {recinto === r && <FiCheckCircle className="text-white text-xs" />}
                  </div>
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Valoraci├│n de respuesta inicial */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-3">
              ┬┐C├│mo valora la respuesta inicial a la solicitud? <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {VALORACIONES.map(v => (
                <label
                  key={v}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${valoracion === v ? 'bg-accent-light border-accent-primary text-accent-primary font-semibold' : 'border-border-soft hover:bg-bg-subtle text-text-secondary'}`}
                  onClick={() => setValoracion(v)}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${valoracion === v ? 'border-accent-primary' : 'border-text-faint'}`}>
                    {valoracion === v && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
                  </div>
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Satisfacci├│n general */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-4 text-center">
              ┬┐Cu├íl es tu nivel de satisfacci├│n en relaci├│n a la coordinaci├│n general de la actividad? <span className="text-danger">*</span>
            </label>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
                <span className="text-sm font-semibold text-text-muted hidden sm:inline">Poco satisfecho</span>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all ${satisfaccion === n ? 'bg-accent-primary text-white scale-110 shadow-md' : satisfaccion > 0 && n <= satisfaccion ? 'bg-accent-light text-accent-primary border border-accent-primary' : 'bg-bg-subtle text-text-muted border border-border-soft hover:bg-border-soft'}`}
                      onClick={() => setSatisfaccion(n)}
                      title={`${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-sm font-semibold text-text-muted hidden sm:inline">Muy satisfecho</span>
              </div>
              <div className="flex justify-between w-full max-w-[300px] mt-2 sm:hidden px-2">
                 <span className="text-xs font-semibold text-text-muted">Poco</span>
                 <span className="text-xs font-semibold text-text-muted">Muy</span>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="card p-6">
            <label className="block text-sm font-bold text-text-main mb-2">Comentarios adicionales <span className="text-text-muted font-normal text-xs">(opcional)</span></label>
            <textarea
              className="input-base"
              placeholder="Cu├⌐ntanos m├ís sobre tu experiencia con el departamento..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn btn-primary px-8 py-3 text-base shadow-lg" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Evaluaci├│n'}
            </button>
          </div>
        </form>

        {/* ΓöÇΓöÇ PANEL ADMINISTRADOR ΓöÇΓöÇ */}
          {isAdmin && (
            <aside className="w-full space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border-soft">
                <div className="flex items-center gap-4">
                  <FiBarChart2 className="text-3xl text-primary" />
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Historial de Evaluaciones</h2>
                    <p className="text-sm text-text-muted">Resumen y resultados de las evaluaciones realizadas.</p>
                  </div>
                </div>
                <button className="btn btn-primary flex items-center gap-2" onClick={cargarEvaluaciones}>
                  <FiRefreshCw /> Actualizar Datos
                </button>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Satisfacci├│n Promedio" value={stats?.promSat ?? '-'} icon={FiStar} />
                <StatCard title="Total de Evaluaciones" value={stats?.total ?? '-'} icon={FiClipboard} />
                <StatCard title="Mejor Recinto" value={bestRecinto ?? '-'} icon={FiMapPin} />
                <StatCard title="Nivel de Servicio" value={stats?.promSat ? `${stats.promSat}%` : '-'} icon={FiCheckCircle} />
              </div>

              {/* Content: Table or empty state */}
              {evaluaciones.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow border border-border-soft">
                  <FiAlertTriangle className="text-4xl text-primary mx-auto mb-4" />
                  <p className="text-text-muted">No hay evaluaciones registradas.</p>
                  <button className="mt-4 btn btn-primary flex items-center gap-2 mx-auto" onClick={cargarEvaluaciones}>
                    <FiRefreshCw /> Recargar
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow border border-border-soft">
                  <table className="min-w-full text-left border-collapse">
                    <thead className="bg-bg-subtle">
                      <tr className="border-b border-border-soft">
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase">ID</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase">Evento</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase">Recinto</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase">Valoraci├│n Resp.</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase text-center">Satisfacci├│n</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {evaluaciones.length === 0 ? (
                        <tr><td colSpan="6" className="py-12 text-center text-sm text-text-muted">No hay evaluaciones registradas a├║n</td></tr>
                      ) : (
                        evaluaciones.map(ev => (
                          <tr key={ev.id_evaluacion} className="hover:bg-bg-subtle transition-colors group">
                            <td className="py-4 px-4 text-sm font-medium text-text-main">#{ev.id_evaluacion}</td>
                            <td className="py-4 px-4 text-sm font-medium">{ev.nombre_evento || `Evento #${ev.id_evento}`}</td>
                            <td className="py-4 px-4 text-sm text-text-secondary">{ev.recinto}</td>
                            <td className="py-4 px-4 text-sm">
                              <span className={`status-pill ${ev.valoracion_respuesta === 'Deficiente' ? 'status-rejected' : ev.valoracion_respuesta === 'Muy eficiente' || ev.valoracion_respuesta === 'Excelente' ? 'status-approved' : 'status-pending'}`}>
                                {ev.valoracion_respuesta}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-center">
                              <div className="flex justify-center gap-1 text-lg">
                                {[1,2,3,4,5].map(n => (
                                  <FiStar key={n} className={n <= ev.satisfaccion ? 'text-warning fill-current' : 'text-border-medium'} />
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-text-secondary">{ev.fecha_evento ? String(ev.fecha_evento).substring(0, 10) : (ev.fecha ? String(ev.fecha).substring(0, 10) : '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {vistaAdmin === 'stats' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-bg-main to-bg-subtle border border-border-soft rounded-xl p-6 text-center shadow-inner flex flex-col justify-center items-center">
                    <span className="block text-5xl font-black text-accent-primary mb-2">{stats.promSat}</span>
                    <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Promedio de satisfacci├│n</span>
                    <div className="flex justify-center gap-1 mt-4 text-2xl">
                      {[1,2,3,4,5].map(n => (
                        <FiStar key={n} className={n <= Math.round(stats.promSat) ? 'text-warning fill-current' : 'text-border-medium'} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between p-5 bg-bg-subtle rounded-xl border border-border-soft">
                      <span className="text-base font-semibold text-text-secondary">Total de evaluaciones recibidas</span>
                      <span className="text-2xl font-bold text-text-main bg-white px-4 py-1.5 rounded-lg shadow-sm border border-border-soft">{stats.total}</span>
                    </div>
                    
                    <div className="p-5 border border-border-soft rounded-xl">
                      <h4 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider text-text-muted">Distribuci├│n de valoraciones</h4>
                      <div className="space-y-4">
                        {VALORACIONES.map(v => {
                          const count = stats.dist[v] || 0;
                          const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                          return (
                            <div key={v} className="flex items-center text-sm">
                              <span className="w-32 truncate text-text-secondary font-medium">{v}</span>
                              <div className="flex-1 mx-4 h-3 bg-bg-subtle rounded-full overflow-hidden border border-border-soft">
                                <div className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-12 text-right font-bold text-text-main">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vistaAdmin === 'stats' && !stats && (
                <div className="text-center py-10 text-text-muted text-sm border-2 border-dashed border-border-soft rounded-xl">
                  No hay datos suficientes para mostrar estad├¡sticas.
                </div>
              )}
            
          </aside>
        )}
      </div>
    </div>
  );
}

export default Evaluacion;
