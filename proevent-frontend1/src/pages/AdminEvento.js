import React, { useState, useEffect } from "react";
import "./../css/AjustesUsuarios.css";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

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
  const { title, idField } = getConfig();
  const { items: sortedDataList, requestSort, sortConfig } = useSortableData(dataList, { key: idField, direction: 'ascending' });

  const totalPages = Math.ceil(sortedDataList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDataList.slice(indexOfFirstItem, indexOfLastItem);

  if (usuario?.rol !== "Administrador de Evento" && usuario?.rol !== "Administrador" && usuario?.rol !== "Especialista de eventos") {
    return <div style={{ padding: "2rem" }}>No tienes permisos para acceder a esta sección.</div>;
  }

  return (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      <h2 style={{fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px'}}>Mantenimiento de Catálogos de Eventos</h2>
      <p style={{marginBottom: "24px", color: "var(--text-muted)", fontSize: '14px'}}>
        Administra las opciones prestablecidas que se muestran en el formulario de solicitud de eventos.
      </p>

      {/* TABS */}
      <div className="modern-tabs">
        <button className={activeTab === "tipos" ? "active" : ""} onClick={() => setActiveTab("tipos")}>Tipos de Evento</button>
        <button className={activeTab === "corporativo" ? "active" : ""} onClick={() => setActiveTab("corporativo")}>Detalles Corporativos</button>
        <button className={activeTab === "alimentos" ? "active" : ""} onClick={() => setActiveTab("alimentos")}>Opciones de Alimentos</button>
      </div>

      <div className="saas-panel-card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}>
            <FiEdit2 size={20} />
          </div>
          <div>
            <h3 style={{fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0}}>
              {isEditing ? `Editar opción de ${title}` : `Nueva opción para ${title}`}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>
              {isEditing ? 'Modifique el nombre de esta opción en el catálogo' : 'Agregue un nuevo registro al catálogo de opciones del sistema'}
            </p>
          </div>
        </div>

        <form onSubmit={handleGuardar} style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', transition: 'border-color 0.2s, box-shadow 0.2s' }} className="focus-within-ring">
            <FiEdit2 style={{ color: '#94a3b8', fontSize: '18px' }} />
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '12px', width: '100%', fontSize: '14.5px', color: '#334155', backgroundColor: 'transparent' }}
              placeholder={`Ej: ${activeTab === 'tipos' ? 'Conferencia Magistral' : activeTab === 'corporativo' ? 'Banner Institucional' : 'Coffee Break'}`}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setNombre(""); }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 600 }}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600, backgroundColor: '#3b82f6', borderColor: '#3b82f6', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}>
              {isEditing ? <><FiEdit2 /> Guardar Cambios</> : <><FiPlus /> Agregar al Catálogo</>}
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <SortableHeader label="ID" sortKey={idField} sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label={`Descripción en el catálogo (${title})`} sortKey="nombre" sortConfig={sortConfig} requestSort={requestSort} />
              <th style={{textAlign: 'right'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr key={item[idField]}>
                <td style={{color: 'var(--text-muted)', fontWeight: 600}}>{item[idField]}</td>
                <td><strong>{item.nombre}</strong></td>
                <td style={{textAlign: 'right'}}>
                  <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <button className="action-icon-btn edit" onClick={() => handleEditar(item)} title="Editar"><FiEdit2 /></button>
                    <button className="action-icon-btn delete" onClick={() => handleEliminar(item[idField])} title="Eliminar"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {dataList.length === 0 && (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>Este catálogo está vacío.</td></tr>
            )}
          </tbody>
        </table>

        {/* CONTROLES DE PAGINACIÓN */}
        {dataList.length > 0 && (
          <div className="pagination-container" style={{ marginTop: '0', borderTop: 'none' }}>
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, dataList.length)} de {dataList.length} opciones
            </div>
            <div className="pagination-controls" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="page-number" style={{ alignSelf: 'center', fontWeight: 'bold' }}>
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
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
