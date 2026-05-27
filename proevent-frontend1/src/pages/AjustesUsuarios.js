import React, { useState, useEffect } from 'react';
import './../css/AjustesUsuarios.css';
import './../css/Dashboard.css';

const API = 'http://localhost:8080';

function AjustesUsuarios({ usuario }) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [idRol, setIdRol] = useState('');
    const [roles, setRoles] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        cargarUsuarios();
        cargarRoles();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await fetch(`${API}/usuarios`);
            const data = await res.json();
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('No se pudo conectar al servidor.');
        }
    };

    const cargarRoles = async () => {
        try {
            const res = await fetch(`${API}/roles`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setRoles(data);
                setIdRol(''); // seleccionar el primer rol por defecto
            }
        } catch (err) {
            console.error('Error cargando roles');
        }
    };

    const handleAddOrUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (editingId) {
                const res = await fetch(`${API}/usuarios/${editingId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-usuario-id': usuario?.id_usuario || ''
                    },
                    body: JSON.stringify({ nombre, correo: email, contrasena: password, id_rol: idRol })
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.mensaje || 'Error al actualizar usuario');
                } else {
                    alert(`Usuario ${nombre} actualizado con éxito.`);
                    cargarUsuarios();
                    resetForm();
                }
            } else {
                const res = await fetch(`${API}/usuarios`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-usuario-id': usuario?.id_usuario || ''
                    },
                    body: JSON.stringify({ nombre, correo: email, contrasena: password, id_rol: idRol })
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.mensaje || 'Error al crear usuario');
                } else {
                    alert(`Usuario ${nombre} agregado con éxito.`);
                    cargarUsuarios();
                    resetForm();
                }
            }
        } catch (err) {
            setError('No se pudo conectar al servidor.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNombre('');
        setEmail('');
        setPassword('');
        setIdRol(roles.length > 0 ? roles[0].id_rol : '');
        setEditingId(null);
        setError('');
    };

    const handleEdit = (usuario) => {
        setNombre(usuario.nombre);
        setEmail(usuario.correo);
        setPassword('');
        // Buscar el id_rol que corresponde al nombre del rol
        const rolEncontrado = roles.find(r => r.nombre === usuario.rol);
        setIdRol(rolEncontrado ? rolEncontrado.id_rol : roles[0]?.id_rol);
        setEditingId(usuario.id_usuario);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Deseas eliminar este usuario de forma permanente?')) return;
        try {
            const res = await fetch(`${API}/usuarios/${id}`, { 
                method: 'DELETE',
                headers: { 'x-usuario-id': usuario?.id_usuario || '' }
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.mensaje || 'Error al eliminar usuario');
            } else {
                cargarUsuarios();
            }
        } catch (err) {
            alert('No se pudo conectar al servidor.');
        }
    };

    const filteredUsuarios = usuarios.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Lógica de Paginación
    const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);

    // Resetear a pág 1 si cambia el término de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="ajustes-container">
            <div className="ajustes-header">
                <h2>Gestión de Usuarios</h2>
                <p>Agrega, edita o elimina usuarios del sistema. Solo para administradores.</p>
            </div>

            <div className="ajustes-content">
                <form className="add-user-form full-width-form" onSubmit={handleAddOrUpdateUser}>
                    <h3>{editingId ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>

                    {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Nombre Completo</label>
                            <input
                                type="text"
                                placeholder="Ej. Juan Pérez"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group half-width">
                            <label>Correo Electrónico (UAPA)</label>
                            <input
                                type="email"
                                placeholder="ejemplo@uapa.edu.do"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Contraseña {editingId ? '(Opcional al editar)' : 'Provisional'}</label>
                            <input
                                type="password"
                                placeholder={editingId ? 'Dejar en blanco para mantener' : 'Mínimo 8 caracteres'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={!editingId}
                            />
                        </div>

                        <div className="form-group half-width">
                            <label>Rol del Usuario</label>
                            <select value={idRol} onChange={(e) => setIdRol(e.target.value)}>
                                <option value="">Seleccione un rol...</option>
                                {roles.map(r => (
                                <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        {editingId && (
                            <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
                        )}
                        <button type="submit" className="btn-add-user" disabled={loading}>
                            {loading ? 'Guardando...' : editingId ? 'Actualizar Usuario' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="recent-requests-section" style={{ marginTop: '30px' }}>
                <div className="section-header">
                    <h3>Usuarios Registrados</h3>
                    <div className="section-filters">
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', width: '250px' }}
                        />
                    </div>
                </div>
                <div className="table-container">
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>USUARIO</th>
                                <th>CORREO ELECTRÓNICO</th>
                                <th>ROL</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(usuario => (
                                <tr key={usuario.id_usuario}>
                                    <td><strong>{usuario.nombre}</strong></td>
                                    <td>{usuario.correo}</td>
                                    <td><span className="badge">{usuario.rol}</span></td>
                                    <td>
                                        <button className="action-btn edit" onClick={() => handleEdit(usuario)}>Editar</button>
                                        <button className="action-btn delete" onClick={() => handleDelete(usuario.id_usuario)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* CONTROLES DE PAGINACIÓN */}
                {filteredUsuarios.length > 0 && (
                    <div className="pagination-container" style={{ marginTop: '0', borderTop: 'none' }}>
                        <div className="pagination-info">
                            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
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

export default AjustesUsuarios;
