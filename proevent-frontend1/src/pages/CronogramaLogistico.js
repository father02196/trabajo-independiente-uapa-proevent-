import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiClock, FiUser } from 'react-icons/fi';

const API = "http://localhost:8080";

function CronogramaLogistico({ evento, usuario }) {
  const [tareas, setTareas] = useState([]);
  const [apoyos, setApoyos] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({ nombre_actividad: '', id_usuario_responsable: '', fecha_cumplimiento: '' });

  useEffect(() => {
    if (evento && evento.id_evento) {
      cargarTareas();
      cargarApoyos();
    }
  }, [evento]);

  const cargarTareas = async () => {
    try {
      const res = await fetch(`${API}/cronograma/${evento.id_evento}`);
      const data = await res.json();
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const cargarApoyos = async () => {
    try {
      const res = await fetch(`${API}/usuarios-apoyo`);
      const data = await res.json();
      setApoyos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.nombre_actividad || !nuevaTarea.fecha_cumplimiento || !nuevaTarea.id_usuario_responsable) {
      alert("Por favor complete todos los campos de la tarea.");
      return;
    }
    try {
      const payload = { ...nuevaTarea, id_evento: evento.id_evento };
      const res = await fetch(`${API}/cronograma`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNuevaTarea({ nombre_actividad: '', id_usuario_responsable: '', fecha_cumplimiento: '' });
        cargarTareas();
      } else {
        alert("Error al crear tarea");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompletarTarea = async (id_actividad, estado) => {
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      if (res.ok) cargarTareas();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '20px' }}>Cronograma Logístico (Personal de Apoyo)</h3>
      
      {/* Formulario Crear Tarea */}
      {usuario?.rol !== 'Personal de Apoyo' && (
      <form onSubmit={handleCrearTarea} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '30px', alignItems: 'end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Actividad a realizar</label>
          <input type="text" placeholder="Ej. Acomodar 50 sillas" value={nuevaTarea.nombre_actividad} onChange={e => setNuevaTarea({...nuevaTarea, nombre_actividad: e.target.value})} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Responsable</label>
          <select value={nuevaTarea.id_usuario_responsable} onChange={e => setNuevaTarea({...nuevaTarea, id_usuario_responsable: e.target.value})}>
            <option value="">-- Seleccionar --</option>
            {apoyos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Fecha Cumplimiento</label>
          <input type="date" value={nuevaTarea.fecha_cumplimiento} onChange={e => setNuevaTarea({...nuevaTarea, fecha_cumplimiento: e.target.value})} />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '10px', height: '40px', background: '#3498db', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          <FiPlus /> Añadir
        </button>
      </form>
      )}

      {/* Lista de Tareas */}
      <table className="requests-table">
        <thead>
          <tr>
            <th>Actividad</th>
            <th>Responsable</th>
            <th>Fecha Límite</th>
            <th>Estado</th>
            {usuario?.rol !== 'Solicitante' && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {tareas.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay tareas programadas.</td></tr>
          ) : tareas.map(t => (
            <tr key={t.id_actividad}>
              <td>{t.nombre_actividad}</td>
              <td><FiUser /> {t.responsable || 'Sin asignar'}</td>
              <td><FiClock /> {new Date(t.fecha_cumplimiento).toLocaleDateString('es-DO')}</td>
              <td>
                <span className={`status ${t.estado === 'Completada' ? 'approved' : 'pending'}`}>{t.estado}</span>
              </td>
              {usuario?.rol !== 'Solicitante' && (
              <td>
                {t.estado !== 'Completada' && (
                  <button onClick={() => handleCompletarTarea(t.id_actividad, 'Completada')} style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    <FiCheck /> Marcar Lista
                  </button>
                )}
              </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CronogramaLogistico;
