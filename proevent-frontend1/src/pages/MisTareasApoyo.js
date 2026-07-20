// ============================================================
// COMPONENTE: MisTareasApoyo
// Pertenece a: Módulo Logístico / Operativo
// Propósito: Visualiza las tareas delegadas al usuario logístico actual
// desde el Cronograma Global, permitiendo marcarlas como "Completadas".
// ============================================================

import React, { useState, useEffect } from 'react';
import { FiCheck, FiClock, FiCalendar, FiLock, FiCheckCircle } from 'react-icons/fi';
import { createPortal } from 'react-dom';

const API = "http://localhost:8080";

function MisTareasApoyo({ usuario }) {
  const [tareas, setTareas] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [confirmarTarea, setConfirmarTarea] = useState(null);

  useEffect(() => {
    if (usuario && usuario.id_usuario) {
      cargarTareas();
    }
  }, [usuario]);

  const cargarTareas = async () => {
    try {
      const res = await fetch(`${API}/mis-tareas/${usuario.id_usuario}`);
      const data = await res.json();
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompletarTarea = async (id_actividad) => {
    setLoadingIds(prev => [...prev, id_actividad]);
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-usuario-id': usuario?.id_usuario || '' },
        body: JSON.stringify({ estado: 'Completada' })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'No se pudo completar la tarea'}`);
      } else {
        await cargarTareas();
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al intentar completar la tarea.');
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== id_actividad));
    }
  };

  const sortedTareas = [...tareas].sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento));

  const isTaskAvailable = (fechaStr) => {
    const taskDate = new Date(fechaStr);
    taskDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return today >= taskDate;
  };

  return (
    <div className="animate-fade" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .checklist-row {
          background: #F8FAFC;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .checklist-row:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -6px rgba(0, 0, 0, 0.12);
          background: #ffffff;
        }
      `}</style>
      <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1E293B', fontWeight: '600' }}>Mi Checklist de Tareas (Apoyo Logístico)</h3>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
          <thead>
            <tr style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0 16px 8px 16px', fontWeight: '600' }}>Evento / Actividad</th>
              <th style={{ padding: '0 16px 8px 16px', fontWeight: '600' }}>Fecha Límite</th>
              <th style={{ padding: '0 16px 8px 16px', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '0 16px 8px 16px', fontWeight: '600', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {sortedTareas.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  <FiCheck size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#CBD5E1' }} />
                  <p style={{ margin: 0, fontSize: '1rem' }}>No tienes tareas asignadas por el momento. ¡Buen trabajo!</p>
                </td>
              </tr>
            ) : sortedTareas.map(t => {
              const available = isTaskAvailable(t.fecha_cumplimiento);
              const isCompleted = t.estado === 'Completada';
              const isLoading = loadingIds.includes(t.id_actividad);

              return (
                <tr key={t.id_actividad} className="checklist-row">
                  <td style={{ padding: '16px', borderRadius: '8px 0 0 8px' }}>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                      <FiCalendar /> {t.nombre_evento}
                    </div>
                    <div style={{ color: '#1E293B', fontSize: '1rem', fontWeight: '600' }}>
                      {t.nombre_actividad}
                    </div>
                  </td>
                  
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', padding: '6px 12px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#475569', fontWeight: '500' }}>
                      <FiClock style={{ color: available ? (isCompleted ? '#10B981' : '#F59E0B') : '#64748B' }} /> 
                      {new Date(t.fecha_cumplimiento).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      background: isCompleted ? '#D1FAE5' : '#FEF3C7',
                      color: isCompleted ? '#065F46' : '#92400E',
                      border: `1px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`
                    }}>
                      {t.estado}
                    </span>
                  </td>
                  
                  <td style={{ padding: '16px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>
                    {isCompleted ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: '600', fontSize: '0.875rem', padding: '8px 16px' }}>
                        <FiCheck size={18} /> Terminada
                      </div>
                    ) : !available ? (
                      <div 
                        title="Esta tarea podrá marcarse como completada a partir del día programado para su ejecución."
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E2E8F0', color: '#64748B', fontWeight: '600', fontSize: '0.875rem', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed' }}
                      >
                        <FiLock size={16} /> Listo
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setConfirmarTarea(t.id_actividad)} 
                        disabled={isLoading}
                        style={{ 
                          background: isLoading ? '#94A3B8' : '#10B981', 
                          color: 'white', 
                          border: 'none', 
                          padding: '8px 16px', 
                          borderRadius: '6px', 
                          cursor: isLoading ? 'wait' : 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          transition: 'background 0.2s',
                          boxShadow: isLoading ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseOver={(e) => { if(!isLoading) e.currentTarget.style.background = '#059669' }}
                        onMouseOut={(e) => { if(!isLoading) e.currentTarget.style.background = '#10B981' }}
                      >
                        {isLoading ? (
                          <span style={{
                            display: 'inline-block',
                            width: '14px', height: '14px',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite'
                          }} />
                        ) : <FiCheck size={16} />} 
                        {isLoading ? 'Cargando...' : 'Listo'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MODAL CONFIRMACIÓN TAREA ── */}
      {confirmarTarea && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setConfirmarTarea(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div 
            className="modal-premium"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', width: '100%', maxWidth: '420px', 
              borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'fadeInUp 0.3s ease-out forwards'
            }}
          >
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Confirmar Tarea</h3>
                <span className="modal-subtitle" style={{ fontSize: '13px', color: '#64748b' }}>Cambio de estado operativo</span>
              </div>
              <div style={{ background: '#dcfce7', color: '#10b981', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCheckCircle size={22} />
              </div>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '17px', color: '#1e293b', margin: '0 0 12px 0', fontWeight: '600' }}>
                ¿Desea marcar esta tarea como realizada?
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                Al confirmar, el sistema registrará tu progreso y la tarea pasará al listado de completadas.
              </p>
            </div>
            
            <div className="modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setConfirmarTarea(null)} 
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#0f172a'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#475569'; }}
              >
                No, cancelar
              </button>
              <button 
                type="button" 
                onClick={() => { handleCompletarTarea(confirmarTarea); setConfirmarTarea(null); }}
                style={{ padding: '10px 18px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.background = '#059669'}
                onMouseLeave={e => e.target.style.background = '#10b981'}
              >
                <FiCheck size={16} /> Sí, marcar lista
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default MisTareasApoyo;
