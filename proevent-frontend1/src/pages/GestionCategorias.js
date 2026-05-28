import React, { useState, useEffect } from 'react';
import { FiEdit, FiPower, FiPlusCircle, FiLayers } from 'react-icons/fi';
import './../css/ModuloProveedores.css';

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

    return (
        <div className="proveedores-container" style={{animation: 'fadeIn 0.5s'}}>
            <div className="proveedores-header" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #1e40af' }}>
                <h1 className="proveedores-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e40af', margin: 0 }}>
                    <FiLayers /> Gestión de Categorías B2B
                </h1>
                <p style={{color: '#64748b', fontSize: '14px', marginTop: '8px', marginBottom: 0}}>
                    Administra los tipos de servicios que los suplidores pueden ofrecer al registrarse en la plataforma.
                </p>
            </div>

            <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'flex-end'}}>
                <button className="btn-save" onClick={() => openModal('nueva', null)}>
                    <FiPlusCircle style={{marginRight: '8px'}}/> Nueva Categoría
                </button>
            </div>

            <div className="tabla-proveedores-container">
                <table className="tabla-proveedores">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de la Categoría</th>
                            <th>Clasificación</th>
                            <th>Estado</th>
                            <th style={{textAlign: 'center'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.map(cat => (
                            <tr key={cat.id_tipo_servicio} style={{ opacity: cat.estado === 'Inactivo' ? 0.6 : 1 }}>
                                <td>{cat.id_tipo_servicio}</td>
                                <td><strong>{cat.nombre}</strong></td>
                                <td>
                                    <span className={`badge ${cat.clasificacion === 'Especializado' ? 'pendiente' : 'procesado'}`}>
                                        {cat.clasificacion}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${cat.estado === 'Activo' ? 'enviado' : 'con-incidencias'}`}>
                                        {cat.estado}
                                    </span>
                                </td>
                                <td style={{textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                    <button 
                                        onClick={() => openModal('editar', cat)}
                                        style={{background: 'transparent', color: '#1e40af', border: 'none', cursor: 'pointer', fontSize: '18px'}}
                                        title="Editar Categoría"
                                    >
                                        <FiEdit />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleEstado(cat)}
                                        style={{background: 'transparent', color: cat.estado === 'Activo' ? '#dc2626' : '#16a34a', border: 'none', cursor: 'pointer', fontSize: '18px'}}
                                        title={cat.estado === 'Activo' ? "Desactivar Categoría" : "Activar Categoría"}
                                    >
                                        <FiPower />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal CRUD Categoría */}
            {modalConfig.open && (
                <div className="modal-overlay" style={{backdropFilter: 'blur(4px)'}}>
                    <div className="modal-content" style={{width: '420px', borderRadius: '12px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}>
                        <h3 className="modal-title" style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
                            <FiLayers /> {modalConfig.type === 'editar' ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h3>
                        <form onSubmit={handleGuardarCategoria} style={{marginTop: '20px'}}>
                            <div className="form-group">
                                <label>Nombre del Servicio / Categoría</label>
                                <input required value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Iluminación Profesional"/>
                            </div>
                            <div className="form-group">
                                <label>Clasificación</label>
                                <select value={formData.clasificacion} onChange={e=>setFormData({...formData, clasificacion: e.target.value})}>
                                    <option value="Corriente">Corriente</option>
                                    <option value="Especializado">Especializado</option>
                                </select>
                            </div>
                            
                            <div className="modal-actions" style={{marginTop: '20px'}}>
                                <button type="button" className="btn-cancel" onClick={() => setModalConfig({open:false})}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Categoría</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GestionCategorias;
