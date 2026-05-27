import React, { useState, useEffect } from "react";
import "./../css/AjustesUsuarios.css"; // Usa los estilos base de admin
import { FiEdit2, FiTrash2, FiPlus, FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast } from "react-icons/fi";

const API = "http://localhost:8080";

const ICON_OPTIONS = [
  "FiMonitor", "FiSpeaker", "FiMic", "FiVideo", "FiRadio", "FiSun", "FiCast"
];

export default function AdminAudiovisual({ usuario }) {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form estado
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("FiMonitor");
  const [cantidad_total, setCantidadTotal] = useState(0);

  useEffect(() => {
    cargarEquipos();
  }, []);

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

  // Lógica de Paginación
  const totalPages = Math.ceil(equipos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = equipos.slice(indexOfFirstItem, indexOfLastItem);

  if (usuario?.rol !== "Administrador de Audiovisual" && usuario?.rol !== "Administrador") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder a esta sección.</div>;
  }

  return (
    <div className="ajustes-container" style={{maxWidth: '800px'}}>
      <h2>Catálogo de Equipos Audiovisuales</h2>
      <p style={{marginBottom: "20px", color: "var(--text-light)"}}>
        Administra los equipos y servicios audiovisuales que los usuarios pueden solicitar.
      </p>

      <div className="form-card" style={{ marginBottom: "30px", padding: "20px", background: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3>{isEditing ? "Editar Equipo" : "Agregar Nuevo Equipo"}</h3>
        <form onSubmit={handleGuardar} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginTop: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Nombre del Equipo</label>
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" }}
              placeholder="Ej. Proyector 4K"
              onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Ícono sugerido</label>
            <select 
              value={icono} 
              onChange={e => setIcono(e.target.value)}
              style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", background: "white", cursor: "pointer", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            >
              <option value="FiMonitor">Monitor / Pantalla</option>
              <option value="FiSpeaker">Sonido</option>
              <option value="FiMic">Microfonía</option>
              <option value="FiVideo">Video / Cámara</option>
              <option value="FiRadio">Transmisión / Radio</option>
              <option value="FiSun">Iluminación</option>
              <option value="FiCast">Proyección Local</option>
            </select>
          </div>
          <div style={{ flex: '0 0 80px' }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Cant.</label>
            <input 
              type="number" 
              required
              min="0"
              value={cantidad_total}
              onChange={(e) => setCantidadTotal(e.target.value)}
              style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <button type="submit" className="add-btn" disabled={loading} style={{ padding: "12px 24px", borderRadius: "8px", fontWeight: "600", transition: "transform 0.1s, background-color 0.2s", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
            {isEditing ? "Guardar Cambios" : <><FiPlus /> Agregar</>}
          </button>
          {isEditing && (
            <button type="button" onClick={() => { setIsEditing(false); setNombre(""); setCantidadTotal(0); }} style={{ padding: "11px 20px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Equipo</th>
              <th>Ícono Asignado</th>
              <th>Cant. Total</th>
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(eq => (
              <tr key={eq.id_equipo}>
                <td>{eq.id_equipo}</td>
                <td><strong>{eq.nombre}</strong></td>
                <td>{eq.icono}</td>
                <td>{eq.cantidad_total || 0}</td>
                <td style={{textAlign: 'right'}}>
                  <button className="action-btn edit" onClick={() => handleEditar(eq)}><FiEdit2 /></button>
                  <button className="action-btn delete" onClick={() => handleEliminar(eq.id_equipo)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {equipos.length === 0 && (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No hay equipos configurados en el catálogo.</td></tr>
            )}
          </tbody>
        </table>

        {/* CONTROLES DE PAGINACIÓN */}
        {equipos.length > 0 && (
          <div className="pagination-container" style={{ marginTop: '0', borderTop: 'none' }}>
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, equipos.length)} de {equipos.length} equipos
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="page-number">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
