// ============================================================
// COMPONENTE: MisTareasApoyo
// Pertenece a: Módulo Logístico / Operativo
// Propósito: Visualiza las tareas delegadas al usuario logístico actual
// desde el Cronograma Global, permitiendo marcarlas como "Completadas".
// ============================================================

import React, { useState, useEffect } from 'react';
import { FiCheck, FiClock, FiCalendar } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';

const API = "http://localhost:8080";

function MisTareasApoyo({ usuario }) {
  // --- ESTADOS ---
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    if (usuario && usuario.id_usuario) {
      cargarTareas();
    }
  }, [usuario]);

  // --- FUNCIÓN: cargarTareas ---
  // Obtiene el checklist de actividades pendientes para el usuario actual
  const cargarTareas = async () => {
    try {
      const res = await fetch(`${API}/mis-tareas/${usuario.id_usuario}`);
      const data = await res.json();
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  // --- FUNCIÓN: handleCompletarTarea ---
  // Actualiza el estado de una tarea asignada a 'Completada'
  const handleCompletarTarea = async (id_actividad) => {
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-usuario-id': usuario?.id_usuario || '' },
        body: JSON.stringify({ estado: 'Completada' })
      });
      if (res.ok) cargarTareas();
    } catch (e) {
      console.error(e);
    }
  };

  const sortedTareas = [...tareas].sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento));

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px', marginBottom: '20px' }}>Mi Checklist de Tareas (Apoyo Logístico)</h3>
      
      <table className="requests-table">
        <thead>
          <tr>
            <th>Evento Asignado</th>
            <th>Actividad</th>
            <th>Fecha Límite</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {sortedTareas.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No tienes tareas asignadas por el momento. ¡Buen trabajo!</td></tr>
          ) : sortedTareas.map(t => (
            <tr key={t.id_actividad}>
              <td><FiCalendar /> {t.nombre_evento}</td>
              <td><strong>{t.nombre_actividad}</strong></td>
              <td><FiClock /> {new Date(t.fecha_cumplimiento).toLocaleDateString('es-DO')}</td>
              <td>
                <span className={`status ${t.estado === 'Completada' ? 'approved' : 'pending'}`}>{t.estado}</span>
              </td>
              <td>
                {t.estado !== 'Completada' ? (
                  <button type="button" onClick={() => handleCompletarTarea(t.id_actividad)} aria-label="Marcar tarea como completada" style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiCheck /> Listo
                  </button>
                ) : (
                  <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>✓ Terminada</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MisTareasApoyo;
