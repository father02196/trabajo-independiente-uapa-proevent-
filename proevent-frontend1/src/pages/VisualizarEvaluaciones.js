// ============================================================
// MÓDULO VISUALIZAR EVALUACIONES
// Pertenece a: Módulo Operativo (Análisis de Feedback)
// Propósito: Permite a los administradores visualizar las encuestas
// de satisfacción realizadas por los usuarios, mostrando métricas
// globales (promedio, total) y graficando resultados mediante Recharts
// (Barras, Pastel, Radar) de forma dinámica por evaluación.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { FiBarChart2, FiPieChart, FiActivity, FiStar, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';

const API = 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

// Opciones de gráficas disponibles
const CHART_TYPES = [
  { id: 'bar', label: 'Barras', icon: <FiBarChart2 /> },
  { id: 'pie', label: 'Pastel', icon: <FiPieChart /> },
  { id: 'radar', label: 'Radar', icon: <FiActivity /> },
];

// ============================================================
// COMPONENTE: VisualizarEvaluaciones
// ============================================================
export default function VisualizarEvaluaciones({ searchTerm = '' }) {
  // --- ESTADOS ---
  const [evaluaciones, setEvaluaciones] = useState([]);   // Lista cruda de evaluaciones
  const [loading, setLoading] = useState(true);           // Spinner
  const [pagina, setPagina] = useState(1);                // Paginación
  const [chartSelections, setChartSelections] = useState({}); // Mapeo: id_evaluacion -> tipo de gráfica activa

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargar();
  }, []);

  // --- FUNCIÓN: cargar ---
  // Obtiene los datos del backend
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

  // --- USEMEMO: filtered (Buscador) ---
  // Aplica la búsqueda por texto
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return evaluaciones;
    const q = searchTerm.toLowerCase();
    return evaluaciones.filter(e =>
      (e.nombre_evento || '').toLowerCase().includes(q) ||
      String(e.id_evento).includes(q) ||
      (e.valoracion_respuesta || '').toLowerCase().includes(q)
    );
  }, [evaluaciones, searchTerm]);

  const sortedFiltered = [...filtered].sort((a, b) => b.id_evaluacion - a.id_evaluacion);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
  const paginados = sortedFiltered.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

  // --- FUNCIÓN: toggleChart ---
  // Alterna qué gráfica se muestra en una fila específica
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

  // Formatea data para gráficos
  const buildChartData = (ev) => [
    { name: 'Satisfacción', value: ev.satisfaccion || 0, max: 5 },
    { name: 'Valoración', value: ev.valoracion_respuesta === 'Muy eficiente' ? 4 : ev.valoracion_respuesta === 'Excelente' ? 3 : ev.valoracion_respuesta === 'Eficiente' ? 2 : 1, max: 4 },
  ];

  const buildPieData = (ev) => [
    { name: 'Satisfacción', value: ev.satisfaccion || 0 },
    { name: 'Resto', value: 5 - (ev.satisfaccion || 0) },
  ];

  // --- FUNCIÓN: renderChart ---
  // Dibuja el gráfico correspondiente (Bar, Pie, Radar) según la selección de la fila
  const renderChart = (ev) => {
    const tipo = chartSelections[ev.id_evaluacion];
    if (!tipo) return null;

    if (tipo === 'bar') {
      const data = [
        { name: 'Satisfacción', valor: ev.satisfaccion || 0 },
        { name: 'Valoración', valor: ev.valoracion_respuesta === 'Muy eficiente' ? 4 : ev.valoracion_respuesta === 'Excelente' ? 3 : ev.valoracion_respuesta === 'Eficiente' ? 2 : 1 },
      ];
      return (
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A' }} />
              <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (tipo === 'pie') {
      const data = buildPieData(ev);
      return (
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" startAngle={90} endAngle={450} paddingAngle={5} cornerRadius={4} animationDuration={1200}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#E2E8F0'} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (tipo === 'radar') {
      const data = buildChartData(ev);
      return (
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <Radar name="Valor" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.5} animationDuration={1400} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const estrellas = (n) => Array.from({ length: 5 }, (_, i) => (
    <FiStar key={i} style={{ color: i < n ? '#F59E0B' : '#E2E8F0', fontSize: '15px' }} fill={i < n ? '#F59E0B' : 'transparent'} />
  ));

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Análisis de Evaluaciones</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>Monitorea el nivel de satisfacción y respuesta de los eventos realizados.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={cargar} disabled={loading} aria-label="Actualizar datos de evaluaciones">
          <FiRefreshCw /> Actualizar Datos
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiStar size={24} /></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Satisfacción Promedio</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.avg} <span style={{ fontSize: '14px', color: '#94A3B8' }}>/ 5.0</span></div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiActivity size={24} /></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total de Evaluaciones</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.total}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><FiBarChart2 size={24} /></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Mejor Recinto</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{stats.bestRecinto}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <div className="loader" style={{ margin: '0 auto 16px', borderColor: '#E2E8F0', borderTopColor: '#3B82F6' }}></div>
            <p>Cargando evaluaciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <FiStar size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>No se encontraron evaluaciones</h3>
            <p>Ajusta el buscador o intenta actualizar los datos.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Evento &amp; Fecha</th>
                  <th>Recinto</th>
                  <th>Valoración</th>
                  <th style={{ textAlign: 'center' }}>Satisfacción</th>
                  <th style={{ textAlign: 'center' }}>Visualización</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((ev) => (
                  <React.Fragment key={ev.id_evaluacion}>
                    <tr style={{ borderBottom: chartSelections[ev.id_evaluacion] ? 'none' : '1px solid #F1F5F9' }}>
                      <td style={{ fontWeight: '600', color: '#64748B' }}>#{ev.id_evaluacion}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{ev.nombre_evento || 'Sin nombre'}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>#{ev.id_evento} • {ev.fecha ? new Date(ev.fecha).toLocaleDateString() : '—'}</div>
                      </td>
                      <td><span className="badge badge-slate">{ev.recinto}</span></td>
                      <td>
                        <span className={`status-pill ${ev.valoracion_respuesta === 'Deficiente' ? 'status-rejected' : ev.valoracion_respuesta === 'Muy eficiente' || ev.valoracion_respuesta === 'Excelente' ? 'status-approved' : 'status-pending'}`} style={{ padding: '4px 10px', fontSize: '12px' }}>
                          {ev.valoracion_respuesta}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>{estrellas(ev.satisfaccion)}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {CHART_TYPES.map(ct => (
                            <button
                              type="button"
                              key={ct.id}
                              style={{
                                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: chartSelections[ev.id_evaluacion] === ct.id ? '#EFF6FF' : '#FFFFFF',
                                borderColor: chartSelections[ev.id_evaluacion] === ct.id ? '#BFDBFE' : '#E2E8F0',
                                color: chartSelections[ev.id_evaluacion] === ct.id ? '#3B82F6' : '#64748B'
                              }}
                              onClick={() => toggleChart(ev.id_evaluacion, ct.id)}
                              title={`Ver gráfico de ${ct.label}`}
                              aria-label={`Ver gráfico de ${ct.label}`}
                            >
                              {ct.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {chartSelections[ev.id_evaluacion] && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 24px 24px 24px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Comentario del solicitante:</h4>
                            <blockquote style={{ fontStyle: 'italic', color: '#475569', fontSize: '14px', paddingLeft: '16px', borderLeft: '4px solid #CBD5E1', margin: 0, marginBottom: '20px' }}>
                              {ev.comentario ? `"${ev.comentario}"` : "El solicitante no dejó comentarios adicionales."}
                            </blockquote>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Gráfico Analítico:</h4>
                            {renderChart(ev)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Resultados: {filtered.length} evaluación(es)
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} aria-label="Página anterior">
              <FiChevronLeft /> Anterior
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
              Página {pagina} de {totalPages}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={pagina === totalPages} aria-label="Página siguiente">
              Siguiente <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
