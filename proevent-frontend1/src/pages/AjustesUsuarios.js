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
    const [filterStatus, setFilterStatus] = useState('todos');
    
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
                        'Authorization': `Bearer ${usuario?.token || ""}`, 'x-usuario-id': usuario?.id_usuario || ''
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
                        'Authorization': `Bearer ${usuario?.token || ""}`, 'x-usuario-id': usuario?.id_usuario || ''
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
        
        // Scroll hacia el formulario (utiliza scrollIntoView por si está en un contenedor con overflow)
        setTimeout(() => {
            document.querySelector('.ajustes-page-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const filteredUsuarios = usuarios.filter(usuario => {
        const nombreMatch = (usuario.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
        const correoMatch = (usuario.correo || "").toLowerCase().includes(searchTerm.toLowerCase());
        const rolMatch = (usuario.rol || "").toLowerCase().includes(searchTerm.toLowerCase());
        const searchMatch = nombreMatch || correoMatch || rolMatch;

        const estadoActual = usuario.estado || 'activo';
        if (filterStatus === 'todos') return searchMatch;
        return searchMatch && estadoActual === filterStatus;
    });

    const handleToggleEstado = async (usuarioToToggle) => {
        const estadoActual = usuarioToToggle.estado || 'activo';
        const nuevoEstado = estadoActual === 'inactivo' ? 'activo' : 'inactivo';
        const accionText = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
        const mensajeConfirmacion = nuevoEstado === 'inactivo' 
            ? `¿Estás seguro de que deseas desactivar al usuario ${usuarioToToggle.nombre}? No podrá iniciar sesión en el sistema.`
            : `¿Estás seguro de que deseas activar al usuario ${usuarioToToggle.nombre}? Recuperará el acceso al sistema.`;

        if (!window.confirm(mensajeConfirmacion)) return;

        try {
            const res = await fetch(`${API}/usuarios/${usuarioToToggle.id_usuario}/estado`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${usuario?.token || ""}`, 
                    'x-usuario-id': usuario?.id_usuario || '' 
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.mensaje || 'Error al cambiar el estado');
            } else {
                cargarUsuarios();
            }
        } catch (err) {
            alert('No se pudo conectar al servidor.');
        }
    };

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
        <div className="ajustes-page fade-in">
            <div className="ajustes-page-header">
                <h1>Gestión de Usuarios</h1>
                <p>Agrega, edita o elimina usuarios del sistema. Solo para administradores.</p>
            </div>

            <div className="ajustes-form-card" style={{ marginBottom: '24px' }}>
                <div className="ajustes-form-section">
                    <h3 className="ajustes-section-title">{editingId ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
                    <p className="ajustes-section-desc">Ingresa la información del usuario a registrar en la plataforma.</p>
                    
                    {error && <p style={{ color: '#EF4444', fontSize: '13.5px', marginBottom: '14px', fontWeight: '600' }}>{error}</p>}

                    <form onSubmit={handleAddOrUpdateUser}>
                        <div className="ajustes-form-row">
                            <div className="ajustes-form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Juan Pérez"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="ajustes-form-group">
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

                        <div className="ajustes-form-row" style={{ marginTop: '16px' }}>
                            <div className="ajustes-form-group">
                                <label>Contraseña {editingId ? '(Opcional al editar)' : 'Provisional'}</label>
                                <input
                                    type="password"
                                    placeholder={editingId ? 'Dejar en blanco para mantener' : 'Mínimo 8 caracteres'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={!editingId}
                                />
                            </div>

                            <div className="ajustes-form-group">
                                <label>Rol del Usuario</label>
                                <select value={idRol} onChange={(e) => setIdRol(e.target.value)} required>
                                    <option value="">Seleccione un rol...</option>
                                    {roles.map(r => (
                                    <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ajustes-form-footer" style={{ marginTop: '24px', padding: '0', background: 'transparent', borderTop: 'none', justifyContent: 'flex-start' }}>
                            {editingId && (
                                <button type="button" className="btn-ajustes-secondary" onClick={resetForm}>Cancelar</button>
                            )}
                            <button type="submit" className="btn-ajustes-primary" disabled={loading}>
                                {loading ? 'Guardando...' : editingId ? 'Actualizar Usuario' : 'Guardar Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="ajustes-table-card">
                <div className="ajustes-table-toolbar">
                    <h2>Usuarios Registrados</h2>
                    <div className="ajustes-toolbar-right" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="ajustes-filter-group" style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
                            <button className={`filter-tab ${filterStatus === 'todos' ? 'active' : ''}`} onClick={() => setFilterStatus('todos')}>Todos</button>
                            <button className={`filter-tab ${filterStatus === 'activo' ? 'active' : ''}`} onClick={() => setFilterStatus('activo')}>Activos</button>
                            <button className={`filter-tab ${filterStatus === 'inactivo' ? 'active' : ''}`} onClick={() => setFilterStatus('inactivo')}>Inactivos</button>
                        </div>
                        <div className="ajustes-search">
                            <span className="ajustes-search-icon" style={{ fontSize: '13px' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="table-container">
                    <table className="ajustes-table">
                        <thead>
                            <tr>
                                <th>USUARIO</th>
                                <th>CORREO ELECTRÓNICO</th>
                                <th>ROL</th>
                                <th>ESTADO</th>
                                <th style={{textAlign: 'center'}}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(usuario => {
                                const roleName = (usuario.rol || '').toLowerCase();
                                const roleClass = roleName.includes('admin') ? 'admin' : roleName.includes('soporte') ? 'support' : 'staff';
                                return (
                                <tr key={usuario.id_usuario} className="table-hover-row">
                                    <td>
                                        <div className="ajustes-user-cell">
                                            <div className="ajustes-avatar">{usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}</div>
                                            <div className="ajustes-user-name">{usuario.nombre}</div>
                                        </div>
                                    </td>
                                    <td><div className="ajustes-user-email">{usuario.correo}</div></td>
                                    <td><span className={`role-badge ${roleClass}`}>{usuario.rol}</span></td>
                                    <td>
                                        <span className={`status-badge ${usuario.estado === 'inactivo' ? 'inactive' : 'active'}`}>
                                            {usuario.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="ajustes-actions" style={{ justifyContent: 'center' }}>
                                            <button className="ajustes-action-btn edit" onClick={() => handleEdit(usuario)} title="Editar">✎</button>
                                            <button 
                                                className={`ajustes-action-btn toggle-state ${usuario.estado === 'inactivo' ? 'to-activate' : 'to-deactivate'}`} 
                                                onClick={() => handleToggleEstado(usuario)} 
                                                title={usuario.estado === 'inactivo' ? 'Activar Usuario' : 'Desactivar Usuario'}
                                                style={{ fontSize: '15px' }}
                                            >
                                                {usuario.estado === 'inactivo' ? '✓' : '⊘'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                            {filteredUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                        No hay usuarios registrados que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredUsuarios.length > 0 && (
                    <div className="pagination-container">
                        <div className="pagination-info">
                            Mostrando <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredUsuarios.length)}</strong> de <strong>{filteredUsuarios.length}</strong> usuarios
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
