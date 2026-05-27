import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { FiBarChart2, FiPieChart, FiActivity, FiStar, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import './../css/VisualizarEvaluaciones.css';

const API = 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;
const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981'];

const CHART_TYPES = [
  { id: 'bar', label: 'Barras', icon: <FiBarChart2 /> },
  { id: 'pie', label: 'Pastel', icon: <FiPieChart /> },
  { id: 'radar', label: 'Radar', icon: <FiActivity /> },
];

export default function VisualizarEvaluaciones({ searchTerm = '' }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [chartSelections, setChartSelections] = useState({});

  useEffect(() => {
    cargar();
  }, []);

  const cargar = () => {
    setLoading(true);
    fetch(`${API}/evaluaciones`)
      .then(r => r.json())
      .then(data => {
        setEvaluaciones(Array.isArray(data) ? data : []);
        setPagina(1);
      })
      .catch(() => setEvaluaciones([]))
      .finally(() => setLoading(false));
  };

  const stats = useMemo(() => {
    if (!evaluaciones.length) return { avg: 0, total: 0, bestRecinto: '—' };
    const avg = (evaluaciones.reduce((acc, e) => acc + (e.satisfaccion || 0), 0) / evaluaciones.length).toFixed(1);
    const recintoMap = evaluaciones.reduce((acc, e) => {
      if (!e.recinto) return acc;
      if (!acc[e.recinto]) acc[e.recinto] = { sum: 0, count: 0 };
      acc[e.recinto].sum += (e.satisfaccion || 0);
      acc[e.recinto].count += 1;
      return acc;
    }, {});
    let bestRecinto = '—';
    let maxAvg = -1;
    for (const r in recintoMap) {
      const a = recintoMap[r].sum / recintoMap[r].count;
      if (a > maxAvg) {
        maxAvg = a;
        bestRecinto = r;
      }
    }
    return { avg, total: evaluaciones.length, bestRecinto };
  }, [evaluaciones]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return evaluaciones;
    const q = searchTerm.toLowerCase();
    return evaluaciones.filter(e =>
      (e.nombre_evento || '').toLowerCase().includes(q) ||
      String(e.id_evento).includes(q) ||
      (e.valoracion_respuesta || '').toLowerCase().includes(q)
    );
  }, [evaluaciones, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginados = filtered.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

  const toggleChart = (id, tipo) => {
    setChartSelections(prev => {
      if (prev[id] === tipo) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: tipo };
    });
  };

  const buildChartData = (ev) => [
    { name: 'Satisfacción', value: ev.satisfaccion || 0, max: 5 },
    { name: 'Valoración', value: ev.valoracion_respuesta === 'Muy eficiente' ? 4 : ev.valoracion_respuesta === 'Excelente' ? 3 : ev.valoracion_respuesta === 'Eficiente' ? 2 : 1, max: 4 },
  ];

  const buildPieData = (ev) => [
    { name: 'Satisfacción', value: ev.satisfaccion || 0 },
    { name: 'Resto', value: 5 - (ev.satisfaccion || 0) },
  ];

  const renderChart = (ev) => {
    const tipo = chartSelections[ev.id_evaluacion];
    if (!tipo) return null;

    if (tipo === 'bar') {
      const data = [
        { name: 'Satisfacción', valor: ev.satisfaccion || 0 },
        { name: 'Valoración', valor: ev.valoracion_respuesta === 'Muy eficiente' ? 4 : ev.valoracion_respuesta === 'Excelente' ? 3 : ev.valoracion_respuesta === 'Eficiente' ? 2 : 1 },
      ];
      return (
        <div className="veval-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} 
              />
              <Bar dataKey="valor" fill="#041046" radius={[4, 4, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (tipo === 'pie') {
      const data = buildPieData(ev);
      return (
        <div className="veval-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" startAngle={90} endAngle={450} paddingAngle={5} cornerRadius={4} animationDuration={1200}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : 'rgba(255,255,255,0.05)'} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (tipo === 'radar') {
      const data = buildChartData(ev);
      return (
        <div className="veval-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Radar name="Valor" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.5} animationDuration={1400} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const estrellas = (n) => Array.from({ length: 5 }, (_, i) => (
    <FiStar key={i} style={{ color: i < n ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: '15px' }} />
  ));

  return (
    <div className="veval-container">
      <div className="veval-header">
        <div className="veval-title-group">
          <h2 className="veval-title">Historial de Evaluaciones</h2>
          <p className="veval-subtitle">Monitoreo de satisfacción y resultados del servicio</p>
        </div>
        <button className="veval-refresh-btn" onClick={cargar} title="Actualizar">
          <FiRefreshCw className={loading ? 'spinning' : ''} /> Actualizar Datos
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="veval-stats-grid">
        <div className="veval-stat-card">
          <div className="veval-stat-icon sat"><FiStar /></div>
          <div className="veval-stat-info">
            <span className="veval-stat-label">Satisfacción Promedio</span>
            <div className="veval-stat-value">
              {stats.avg} <span>/ 5.0</span>
            </div>
          </div>
        </div>
        <div className="veval-stat-card">
          <div className="veval-stat-icon total"><FiActivity /></div>
          <div className="veval-stat-info">
            <span className="veval-stat-label">Total de Evaluaciones</span>
            <div className="veval-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="veval-stat-card">
          <div className="veval-stat-icon best"><FiBarChart2 /></div>
          <div className="veval-stat-info">
            <span className="veval-stat-label">Mejor Recinto</span>
            <div className="veval-stat-value">{stats.bestRecinto}</div>
          </div>
        </div>
      </div>

      <div className="veval-main-card">
        {loading ? (
          <div className="veval-loading-shimmer">
            <div className="shimmer-row"></div>
            <div className="shimmer-row"></div>
            <div className="shimmer-row"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="veval-empty">
            <div className="veval-empty-icon"><FiStar /></div>
            <h3>No se encontraron evaluaciones</h3>
            <p>Ajusta el buscador o intenta actualizar los datos.</p>
          </div>
        ) : (
          <>
            <div className="veval-table-scroll">
              <table className="veval-table premium">
                <thead>
                  <tr>
                    <th>Solicitud</th>
                    <th>Evento & Fecha</th>
                    <th>Recinto</th>
                    <th>Valoración</th>
                    <th>Satisfacción</th>
                    <th className="th-center">Acciones Visuales</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((ev, index) => (
                    <React.Fragment key={ev.id_evaluacion}>
                      <tr className={chartSelections[ev.id_evaluacion] ? 'row-expanded' : ''} style={{ '--row-index': index }}>
                        <td>
                          <div className="veval-id-badge">#{ev.id_evaluacion}</div>
                        </td>
                        <td>
                          <div className="veval-event-cell">
                            <strong>{ev.nombre_evento || 'Sin nombre'}</strong>
                            <span>#{ev.id_evento} • {ev.fecha ? new Date(ev.fecha).toLocaleDateString() : '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="veval-recinto-tag">{ev.recinto}</span>
                        </td>
                        <td>
                          <span className={`veval-status-pill val-${(ev.valoracion_respuesta || '').replace(/\s/g, '_').toLowerCase()}`}>
                            {ev.valoracion_respuesta}
                          </span>
                        </td>
                        <td>
                          <div className="veval-rating-cell">
                            <div className="veval-stars-mini">{estrellas(ev.satisfaccion)}</div>
                            <span className="veval-comment-hint" title={ev.comentario}>Ver comentario</span>
                          </div>
                        </td>
                        <td className="td-center">
                          <div className="veval-visual-actions">
                            {CHART_TYPES.map(ct => (
                              <button
                                key={ct.id}
                                className={`veval-icon-btn ${chartSelections[ev.id_evaluacion] === ct.id ? 'active' : ''}`}
                                onClick={() => toggleChart(ev.id_evaluacion, ct.id)}
                                title={`Ver gráfico de ${ct.label}`}
                              >
                                {ct.icon}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                      {chartSelections[ev.id_evaluacion] && (
                        <tr className="veval-expansion-row">
                          <td colSpan={6}>
                            <div className="veval-expansion-content">
                              <div className="veval-expansion-info">
                                <h4>Resumen Detallado</h4>
                                <p><strong>Comentario del solicitante:</strong></p>
                                <blockquote className="veval-quote">
                                  {ev.comentario ? `"${ev.comentario}"` : "El solicitante no dejó comentarios adicionales."}
                                </blockquote>
                              </div>
                              <div className="veval-expansion-chart">
                                {renderChart(ev)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="veval-footer">
              <div className="veval-info-total">Resultados: {filtered.length} evaluacion(es)</div>
              <div className="veval-pagination premium">
                <button className="page-nav" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                  <FiChevronLeft />
                </button>
                <div className="page-indicator">
                  <span>Página</span> <strong>{pagina}</strong> de {totalPages}
                </div>
                <button className="page-nav" onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={pagina === totalPages}>
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
