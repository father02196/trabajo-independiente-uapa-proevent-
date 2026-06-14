// ============================================================
// COMPONENTE: AdminAudiovisual
// Pertenece a: Módulo de Configuración / Audiovisual
// Propósito: CRUD (Crear, Leer, Actualizar, Eliminar) del catálogo
// maestro de equipos audiovisuales (nombre, ícono, y cantidad total).
// ============================================================

import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

const API = "http://localhost:8080";

const ICON_OPTIONS = [
  "FiMonitor", "FiSpeaker", "FiMic", "FiVideo", "FiRadio", "FiSun", "FiCast"
];

export default function AdminAudiovisual({ usuario }) {
  // --- ESTADOS ---
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("FiMonitor");
  const [cantidad_total, setCantidadTotal] = useState(0);

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargarEquipos();
  }, []);

  // --- FUNCIÓN: cargarEquipos ---
  const cargarEquipos = () => {
    setLoading(true);
    fetch(`${API}/equipos-audiovisuales`)
      .then(res => res.json())
      .then(data => {
        setEquipos(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error cargando equipos", err))
      .finally(() => setLoading(false));
  };

  // --- FUNCIÓN: handleGuardar ---
  // Lógica dinámica para crear (POST) o editar (PUT) un equipo
  const handleGuardar = async (e) => {
    e.preventDefault();
    const url = isEditing ? `${API}/equipos-audiovisuales/${currentId}` : `${API}/equipos-audiovisuales`;
    const method = isEditing ? "PUT" : "POST";

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, icono, cantidad_total })
      });
      if (res.ok) {
        setNombre("");
        setIcono("FiMonitor");
        setCantidadTotal(0);
        setIsEditing(false);
        setCurrentId(null);
        cargarEquipos();
      } else {
        const err = await res.json();
        alert(err.mensaje || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES: Editar y Eliminar ---
  const handleEditar = (eq) => {
    setIsEditing(true);
    setCurrentId(eq.id_equipo);
    setNombre(eq.nombre);
    setIcono(eq.icono || "FiMonitor");
    setCantidadTotal(eq.cantidad_total || 0);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este equipo del catálogo?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/equipos-audiovisuales/${id}`, { method: "DELETE" });
      if (res.ok) {
        cargarEquipos();
      } else {
        alert("Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const { items: sortedEquipos, requestSort, sortConfig } = useSortableData(equipos, { key: 'id_equipo', direction: 'ascending' });

  const totalPages = Math.ceil(sortedEquipos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedEquipos.slice(indexOfFirstItem, indexOfLastItem);

  if (usuario?.rol !== "Administrador de Audiovisual" && usuario?.rol !== "Administrador") {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>No tienes permisos para acceder a esta sección.</div>;
  }
  
  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Catálogo de Equipos Audiovisuales</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>Administra los equipos y servicios audiovisuales disponibles para el recinto.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{isEditing ? "Editar Equipo" : "Agregar Nuevo Equipo"}</h3>
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>Ingresa los detalles del equipo para el catálogo institucional.</p>
        
        <form onSubmit={handleGuardar} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 250px' }}>
            <label>Nombre del Equipo</label>
            <input 
              type="text" 
              className="input-base"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Proyector 4K Laser"
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Ícono Sugerido</label>
            <select className="input-base" value={icono} onChange={e => setIcono(e.target.value)}>
              <option value="FiMonitor">Monitor / Pantalla</option>
              <option value="FiSpeaker">Sonido</option>
              <option value="FiMic">Microfonía</option>
              <option value="FiVideo">Video / Cámara</option>
              <option value="FiRadio">Transmisión / Radio</option>
              <option value="FiSun">Iluminación</option>
              <option value="FiCast">Proyección Local</option>
            </select>
          </div>
          <div className="form-group" style={{ width: '120px' }}>
            <label>Cant. Total</label>
            <input 
              type="number" 
              className="input-base"
              required min="0"
              value={cantidad_total}
              onChange={(e) => setCantidadTotal(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEditing ? "Guardar" : <><FiPlus /> Agregar</>}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setNombre(""); setCantidadTotal(0); }} className="btn btn-secondary" style={{ height: '42px' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Equipos Configurados</h3>
        </div>
        <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <SortableHeader label="ID" sortKey="id_equipo" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Nombre del Equipo" sortKey="nombre" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Ícono Asignado" sortKey="icono" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Cant. Total" sortKey="cantidad_total" sortConfig={sortConfig} requestSort={requestSort} style={{ textAlign: 'center' }} />
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(eq => (
                <tr key={eq.id_equipo}>
                  <td style={{ fontWeight: '600', color: '#64748B' }}>#{eq.id_equipo}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {eq.icono === 'FiMonitor' && <FiMonitor size={18} />}
                        {eq.icono === 'FiSpeaker' && <FiSpeaker size={18} />}
                        {eq.icono === 'FiMic' && <FiMic size={18} />}
                        {eq.icono === 'FiVideo' && <FiVideo size={18} />}
                        {eq.icono === 'FiRadio' && <FiRadio size={18} />}
                        {eq.icono === 'FiSun' && <FiSun size={18} />}
                        {eq.icono === 'FiCast' && <FiCast size={18} />}
                        {!["FiMonitor", "FiSpeaker", "FiMic", "FiVideo", "FiRadio", "FiSun", "FiCast"].includes(eq.icono) && <FiMonitor size={18} />}
                      </div>
                      <span style={{ fontWeight: '600', color: '#0F172A' }}>{eq.nombre}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-slate" style={{ fontFamily: 'monospace' }}>{eq.icono}</span></td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#334155' }}>{eq.cantidad_total || 0}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditar(eq)} title="Editar"><FiEdit2 /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEliminar(eq.id_equipo)} title="Eliminar" style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No hay equipos configurados en el catálogo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {equipos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, equipos.length)} de {equipos.length} equipos
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Anterior
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
              Página {currentPage} de {totalPages || 1}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
