import React, { useState, useEffect } from 'react';
import { FiEdit, FiPower, FiPlusCircle, FiLayers } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';
import './../css/Dashboard.css';

function GestionCategorias({ usuario }) {
    const API = "http://localhost:8080";
    const [categorias, setCategorias] = useState([]);
    const [modalConfig, setModalConfig] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({ nombre: '', clasificacion: 'Corriente' });

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const res = await fetch(`${API}/api/admin/categorias-servicio`);
            const data = await res.json();
            if(Array.isArray(data)) setCategorias(data);
        } catch (e) {
            console.error("Error cargando categorías", e);
        }
    };

    const handleGuardarCategoria = async (e) => {
        e.preventDefault();
        const isEdit = modalConfig.type === 'editar';
        const url = isEdit ? `${API}/api/admin/categorias-servicio/${modalConfig.data.id_tipo_servicio}` : `${API}/api/admin/categorias-servicio`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setModalConfig({ open: false, type: null, data: null });
                fetchCategorias();
            } else {
                alert('Error al guardar la categoría.');
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    const handleToggleEstado = async (cat) => {
        const nuevoEstado = cat.estado === 'Activo' ? 'Inactivo' : 'Activo';
        if(!window.confirm(`¿Marcar la categoría "${cat.nombre}" como ${nuevoEstado}? (No borrará a los suplidores que la tengan asignada)`)) return;

        try {
            const res = await fetch(`${API}/api/admin/categorias-servicio/${cat.id_tipo_servicio}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (res.ok) {
                fetchCategorias();
            }
        } catch (error) {
            alert('Error al cambiar el estado.');
        }
    };

    const openModal = (type, data = null) => {
        setModalConfig({ open: true, type, data });
        if (data) {
            setFormData({ nombre: data.nombre, clasificacion: data.clasificacion });
        } else {
            setFormData({ nombre: '', clasificacion: 'Corriente' });
        }
    };

    const { items: sortedCategorias, requestSort, sortConfig } = useSortableData(categorias, { key: 'id_tipo_servicio', direction: 'ascending' });

    return (
        <div className="space-y-6 animate-fade" style={{ padding: '24px' }}>
            <div className="dashboard-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                            <FiLayers style={{ color: 'var(--accent-primary)' }} /> Gestión de Categorías
                        </h1>
                        <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
                            Administra los tipos de servicios que los suplidores pueden ofrecer en la plataforma.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal('nueva', null)}>
                        <FiPlusCircle /> Nueva Categoría
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <SortableHeader label="ID" sortKey="id_tipo_servicio" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Nombre de la Categoría" sortKey="nombre" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Clasificación" sortKey="clasificacion" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Estado" sortKey="estado" sortConfig={sortConfig} requestSort={requestSort} />
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCategorias.map(cat => (
                            <tr key={cat.id_tipo_servicio} style={{ opacity: cat.estado === 'Inactivo' ? 0.7 : 1 }}>
                                <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{cat.id_tipo_servicio}</td>
                                <td><strong style={{ color: 'var(--text-main)' }}>{cat.nombre}</strong></td>
                                <td>
                                    <span className={`badge ${cat.clasificacion === 'Especializado' ? 'badge-blue' : 'badge-slate'}`}>
                                        {cat.clasificacion}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-pill ${cat.estado === 'Activo' ? 'status-approved' : 'status-rejected'}`}>
                                        {cat.estado}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => openModal('editar', cat)}
                                            className="btn btn-icon btn-ghost"
                                            style={{ color: 'var(--accent-primary)' }}
                                            title="Editar Categoría"
                                        >
                                            <FiEdit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleToggleEstado(cat)}
                                            className="btn btn-icon btn-ghost"
                                            style={{ color: cat.estado === 'Activo' ? 'var(--danger)' : 'var(--success)' }}
                                            title={cat.estado === 'Activo' ? "Desactivar Categoría" : "Activar Categoría"}
                                        >
                                            <FiPower size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categorias.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                    No hay categorías registradas en el sistema.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal CRUD Categoría */}
            {modalConfig.open && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiLayers style={{ color: 'var(--accent-primary)' }} /> 
                                    {modalConfig.type === 'editar' ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h3>
                                <p className="modal-subtitle">Completar la información de la categoría.</p>
                            </div>
                        </div>
                        <div className="modal-body">
                            <form id="categoria-form" onSubmit={handleGuardarCategoria} className="space-y-4">
                                <div className="form-group">
                                    <label>Nombre del Servicio / Categoría</label>
                                    <input 
                                        type="text"
                                        className="input-base" 
                                        required 
                                        value={formData.nombre} 
                                        onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                        placeholder="Ej. Iluminación Profesional"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Clasificación</label>
                                    <select 
                                        className="input-base" 
                                        value={formData.clasificacion} 
                                        onChange={e => setFormData({...formData, clasificacion: e.target.value})}
                                    >
                                        <option value="Corriente">Corriente</option>
                                        <option value="Especializado">Especializado</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setModalConfig({open:false})}>Cancelar</button>
                            <button type="submit" form="categoria-form" className="btn btn-primary">Guardar Categoría</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GestionCategorias;
