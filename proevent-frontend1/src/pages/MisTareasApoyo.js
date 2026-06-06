import React, { useState, useEffect } from 'react';
import { FiCheck, FiClock, FiCalendar } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

const API = "http://localhost:8080";

function MisTareasApoyo({ usuario }) {
  const [tareas, setTareas] = useState([]);

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
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Completada' })
      });
      if (res.ok) cargarTareas();
    } catch (e) {
      console.error(e);
    }
  };

  const { items: sortedTareas, requestSort, sortConfig } = useSortableData(tareas, { key: 'fecha_cumplimiento', direction: 'ascending' });

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px', marginBottom: '20px' }}>Mi Checklist de Tareas (Apoyo Logístico)</h3>
      
      <table className="requests-table">
        <thead>
          <tr>
            <SortableHeader label="Evento Asignado" sortKey="nombre_evento" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Actividad" sortKey="nombre_actividad" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Fecha Límite" sortKey="fecha_cumplimiento" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Estado" sortKey="estado" sortConfig={sortConfig} requestSort={requestSort} />
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
                  <button onClick={() => handleCompletarTarea(t.id_actividad)} style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
