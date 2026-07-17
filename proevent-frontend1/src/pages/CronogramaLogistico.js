// ============================================================
// COMPONENTE: CronogramaLogistico
// Pertenece a: Módulo de Coordinación / Operativa
// Propósito: Gestión de tareas logísticas para un evento. 
// Permite programar actividades, delegarlas a personal de apoyo 
// y marcar las tareas como completadas.
// ============================================================

import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiClock, FiUser, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSortableData } from '../hooks/useSortableData';

const API = "http://localhost:8080";

function CronogramaLogistico({ evento, usuario }) {
  // --- ESTADOS ---
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
      console.error("Error al cargar tareas:", e);
    }
  };

  const cargarApoyos = async () => {
    try {
      const res = await fetch(`${API}/usuarios-apoyo`);
      const data = await res.json();
      setApoyos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error al cargar apoyos:", e);
    }
  };

  // --- FUNCIÓN: handleCrearTarea ---
  // Registra una nueva tarea en el cronograma delegada a un responsable
  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.nombre_actividad || !nuevaTarea.fecha_cumplimiento || !nuevaTarea.id_usuario_responsable) {
      toast.error("Por favor completa todos los campos de la tarea.");
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
        toast.success("Tarea agregada al cronograma");
        cargarTareas();
      } else {
        toast.error("Error al crear tarea");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al guardar tarea");
    }
  };



  // --- FUNCIÓN: handleCompletarTarea ---
  // Actualiza el estado de una tarea a "Completada"
  const handleCompletarTarea = async (id_actividad, estado) => {
    try {
      const res = await fetch(`${API}/cronograma/${id_actividad}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-usuario-id': usuario?.id_usuario || '' },
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        toast.success(`Tarea marcada como ${estado}`);
        cargarTareas();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al actualizar estado");
    }
  };

  const isAdminOrCoord = ["Administrador", "Administrador de Evento", "Coordinador de Evento", "Solicitante"].includes(usuario?.rol);
  // Nota: Solicitante también puede ver, pero no puede asignar según la vista antigua.

  const sortedTareas = [...tareas].sort((a, b) => new Date(a.fecha_cumplimiento) - new Date(b.fecha_cumplimiento));
  return (
    <div className="cronograma-module modern-section">
      <div className="section-header-row">
        <h4><FiCalendar className="icon" /> Cronograma Logístico Operativo</h4>
      </div>
      
      {/* Formulario Crear Tarea (No visible para Personal de Apoyo) */}
      {usuario?.rol !== 'Personal de Apoyo' && (
      <form onSubmit={handleCrearTarea} className="cronograma-form" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', marginBottom: '25px', alignItems: 'end', background: '#f8fafd', padding: '15px', borderRadius: '8px', border: '1px solid #e1e8ed' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Actividad a realizar</label>
          <input 
            type="text" 
            placeholder="Ej. Acomodar 50 sillas en el auditorio" 
            value={nuevaTarea.nombre_actividad} 
            onChange={e => setNuevaTarea({...nuevaTarea, nombre_actividad: e.target.value})} 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Delegado a</label>
          <select 
            value={nuevaTarea.id_usuario_responsable} 
            onChange={e => setNuevaTarea({...nuevaTarea, id_usuario_responsable: e.target.value})}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="">-- Personal de Apoyo --</option>
            {apoyos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Fecha Cumplimiento</label>
          <input 
            type="date" 
            value={nuevaTarea.fecha_cumplimiento} 
            onChange={e => setNuevaTarea({...nuevaTarea, fecha_cumplimiento: e.target.value})} 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" className="action-btn positive" style={{ padding: '8px 15px', height: '37px', display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Programar nueva tarea">
          <FiPlus /> Programar Tarea
        </button>
      </form>
      )}

      {/* Lista de Tareas (Cards o Tabla Moderna) */}
      <div className="tareas-list">
        {tareas.length === 0 ? (
          <div className="empty-state-message" style={{ textAlign: 'center', padding: '30px', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
            <FiAlertCircle size={24} style={{ marginBottom: '10px', color: '#ccc' }} />
            <p>No hay tareas logísticas programadas para este evento aún.</p>
          </div>
        ) : (
          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Actividad Asignada</th>
                  <th>Responsable</th>
                  <th>Límite</th>
                  <th>Estado</th>
                  {usuario?.rol !== 'Solicitante' && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {sortedTareas.map(t => (
                  <tr key={t.id_actividad}>
                    <td style={{ fontWeight: 500, color: '#333' }}>{t.nombre_actividad}</td>
                    <td>
                      <div className="user-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eef2f5', padding: '4px 8px', borderRadius: '20px', fontSize: '0.85rem' }}>
                        <FiUser /> {t.responsable || 'Sin asignar'}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#666' }}>
                        <FiClock /> {new Date(t.fecha_cumplimiento).toLocaleDateString('es-DO')}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.estado === 'Completada' ? 'approved' : 'pending'}`}>
                        {t.estado}
                      </span>
                    </td>
                    {usuario?.rol !== 'Solicitante' && (
                    <td>
                      {t.estado !== 'Completada' ? (
                        <button 
                          type="button"
                          className="action-btn success" 
                          onClick={() => handleCompletarTarea(t.id_actividad, 'Completada')} 
                          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                          aria-label="Marcar tarea como completada"
                        >
                          <FiCheck /> Marcar
                        </button>
                      ) : (
                        <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600 }}>Finalizado</span>
                      )}
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CronogramaLogistico;
