import React, { useState, useEffect } from "react";
import "./../css/AjustesUsuarios.css";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const API = "http://localhost:8080";

export default function AdminEvento({ usuario }) {
  const [activeTab, setActiveTab] = useState("tipos"); // tipos | corporativo | alimentos
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [nombre, setNombre] = useState("");

  const getConfig = () => {
    switch(activeTab) {
      case "tipos": return { endpoint: "tipos-evento", idField: "id_tipo_evento", title: "Tipos de Evento" };
      case "corporativo": return { endpoint: "tipos-detalle-corporativo", idField: "id_detalle_corp", title: "Detalles Corporativos" };
      case "alimentos": return { endpoint: "alimentos", idField: "id_alimento", title: "Servicios de Alimentos" };
      default: return {};
    }
  };

  useEffect(() => {
    cargarDatos();
    setIsEditing(false);
    setNombre("");
    setCurrentPage(1); // Reset al cambiar de tab
  }, [activeTab]);

  const cargarDatos = () => {
    const { endpoint } = getConfig();
    setLoading(true);
    fetch(`${API}/${endpoint}`)
      .then(res => res.json())
      .then(data => setDataList(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error", err))
      .finally(() => setLoading(false));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const { endpoint } = getConfig();
    const url = isEditing ? `${API}/${endpoint}/${currentId}` : `${API}/${endpoint}`;
    const method = isEditing ? "PUT" : "POST";

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
      });
      if (res.ok) {
        setNombre("");
        setIsEditing(false);
        setCurrentId(null);
        cargarDatos();
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

  const handleEditar = (item) => {
    const { idField } = getConfig();
    setIsEditing(true);
    setCurrentId(item[idField]);
    setNombre(item.nombre);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta opción?")) return;
    const { endpoint } = getConfig();
    setLoading(true);
    try {
      const res = await fetch(`${API}/${endpoint}/${id}`, { method: "DELETE" });
      if (res.ok) {
        cargarDatos();
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
  const totalPages = Math.ceil(dataList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataList.slice(indexOfFirstItem, indexOfLastItem);

  if (usuario?.rol !== "Administrador de Evento") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder a esta sección.</div>;
  }

  const { title, idField } = getConfig();

  return (
    <div className="ajustes-container" style={{maxWidth: '800px'}}>
      <h2>Mantenimiento de Catálogos de Eventos</h2>
      <p style={{marginBottom: "20px", color: "var(--text-light)"}}>
        Administra las opciones prestablecidas que se muestran en el formulario de solicitud de eventos.
      </p>

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
        <button 
          onClick={() => setActiveTab("tipos")}
          style={{ background: activeTab === "tipos" ? "var(--navy)" : "#f1f5f9", color: activeTab === "tipos" ? "white" : "#334155", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" }}
        >
          Tipos de Evento
        </button>
        <button 
          onClick={() => setActiveTab("corporativo")}
          style={{ background: activeTab === "corporativo" ? "var(--navy)" : "#f1f5f9", color: activeTab === "corporativo" ? "white" : "#334155", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" }}
        >
          Detalles Corporativos
        </button>
        <button 
          onClick={() => setActiveTab("alimentos")}
          style={{ background: activeTab === "alimentos" ? "var(--navy)" : "#f1f5f9", color: activeTab === "alimentos" ? "white" : "#334155", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" }}
        >
          Opciones de Alimentos
        </button>
      </div>

      <div className="form-card" style={{ marginBottom: "30px", padding: "20px", background: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h3>{isEditing ? `Editar opción de ${title}` : `Nueva opción para ${title}`}</h3>
        <form onSubmit={handleGuardar} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginTop: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Nombre de la Opción</label>
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" }}
              placeholder="Escriba aquí..."
              onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <button type="submit" className="btn-add-user" disabled={loading} style={{ padding: "12px 24px", borderRadius: "8px", fontWeight: "600", transition: "transform 0.1s, background-color 0.2s", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
            {isEditing ? "Guardar" : <><FiPlus /> Agregar</>}
          </button>
          {isEditing && (
            <button type="button" onClick={() => { setIsEditing(false); setNombre(""); }} className="btn-cancel" style={{ padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "background-color 0.2s" }}>
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
              <th>Descripción en el catálogo ({title})</th>
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr key={item[idField]}>
                <td>{item[idField]}</td>
                <td><strong>{item.nombre}</strong></td>
                <td style={{textAlign: 'right'}}>
                  <button className="action-btn edit" onClick={() => handleEditar(item)}><FiEdit2 /></button>
                  <button className="action-btn delete" onClick={() => handleEliminar(item[idField])}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {dataList.length === 0 && (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>Este catálogo está vacío.</td></tr>
            )}
          </tbody>
        </table>

        {/* CONTROLES DE PAGINACIÓN */}
        {dataList.length > 0 && (
          <div className="pagination-container" style={{ marginTop: '0', borderTop: 'none' }}>
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, dataList.length)} de {dataList.length} opciones
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
