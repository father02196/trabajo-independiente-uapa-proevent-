// ============================================================
// AJUSTES USUARIOS - Gestión de Usuarios del Sistema
// Pertenece a: Módulo de Administración (ProEvent)
// Propósito: Permite al Administrador crear, editar y
// desactivar/activar usuarios del sistema. Incluye tabla
// paginada con búsqueda, filtro por estado y ordenamiento.
// Solo accesible para el rol "Administrador".
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect } from 'react';

// Hook personalizado para ordenar columnas de la tabla (removido)
// Componente de encabezado de tabla con soporte de ordenamiento (removido)

// Estilos específicos del módulo y estilos compartidos del dashboard
import './../css/AjustesUsuarios.css';
import './../css/Dashboard.css';

// Iconos de acción para los botones de la tabla
import { FiEdit2, FiCheck, FiSlash, FiSearch } from 'react-icons/fi';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = 'http://localhost:8080';

// ============================================================
// COMPONENTE: AjustesUsuarios
// Recibe: usuario (objeto del administrador logueado, usado
// para el token de autorización en las peticiones al backend).
// ============================================================
function AjustesUsuarios({ usuario }) {

    // --- ESTADOS DEL FORMULARIO ---
    const [nombre, setNombre]     = useState('');  // Campo nombre del nuevo usuario
    const [email, setEmail]       = useState('');  // Campo correo electrónico
    const [password, setPassword] = useState('');  // Campo contraseña (provisional o actualización)
    const [idRol, setIdRol]       = useState('');  // ID del rol seleccionado en el selector
    const [roles, setRoles]       = useState([]);  // Lista de roles disponibles (cargada del backend)
    const [editingId, setEditingId] = useState(null); // ID del usuario en edición (null = modo crear)

    // --- ESTADOS DE LA TABLA ---
    const [searchTerm, setSearchTerm]     = useState('');      // Término de búsqueda en tiempo real
    const [usuarios, setUsuarios]         = useState([]);      // Lista completa de usuarios del sistema
    const [loading, setLoading]           = useState(false);   // Indicador de carga al guardar
    const [validandoCorreo, setValidandoCorreo] = useState(false); // Indicador de validación de correo
    const [error, setError]               = useState('');      // Mensaje de error del formulario
    const [filterStatus, setFilterStatus] = useState('todos'); // Filtro de estado: todos/activo/inactivo
    
    // --- PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1); // Página actual de la tabla
    const itemsPerPage = 10;                           // Cantidad de usuarios por página

    // --- EFECTO: Carga inicial ---
    // Al montar el componente carga la lista de usuarios y los roles
    // disponibles para el selector del formulario.
    useEffect(() => {
        cargarUsuarios();
        cargarRoles();
    }, []);

    // --- FUNCIÓN: cargarUsuarios ---
    // Obtiene la lista completa de usuarios del sistema desde el backend.
    // Actualiza el estado `usuarios` que alimenta la tabla paginada.
    const cargarUsuarios = async () => {
        try {
            const res = await fetch(`${API}/usuarios`);
            const data = await res.json();
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('No se pudo conectar al servidor.');
        }
    };

    // --- FUNCIÓN: cargarRoles ---
    // Obtiene los roles disponibles del sistema para poblar el selector
    // del formulario. Se carga una sola vez al montar el componente.
    const cargarRoles = async () => {
        try {
            const res = await fetch(`${API}/roles`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setRoles(data);
                setIdRol(''); // Deja el selector en "Seleccione un rol..."
            }
        } catch (err) {
            console.error('Error cargando roles');
        }
    };

    // --- FUNCIÓN: handleAddOrUpdateUser ---
    // Maneja el envío del formulario: diferencia entre crear (POST) y editar (PUT)
    // según si hay un `editingId` activo.
    // Envía el token de autorización en cada petición para validación en el backend.
    const handleAddOrUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        
        // --- VALIDACIÓN AVANZADA DE CORREO ---
        if (email) {
            setValidandoCorreo(true);
            const validacion = await validarCorreoAvanzado(email);
            setValidandoCorreo(false);
            
            if (!validacion.valid) {
                setError(validacion.message || "El correo electrónico ingresado no pudo ser validado o parece no existir. Verifique la dirección e intente nuevamente.");
                return; // Bloquea el guardado si el correo es inválido
            }
        }
        // -------------------------------------

        setLoading(true);

        try {
            if (editingId) {
                // --- MODO EDITAR: PUT /usuarios/:id ---
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
                    cargarUsuarios(); // Recarga la tabla con el usuario actualizado
                    resetForm();      // Limpia el formulario
                }
            } else {
                // --- MODO CREAR: POST /usuarios ---
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
                    cargarUsuarios(); // Recarga la tabla con el nuevo usuario
                    resetForm();
                }
            }
        } catch (err) {
            setError('No se pudo conectar al servidor.');
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIÓN: validarCorreoAvanzado ---
    const validarCorreoAvanzado = async (email) => {
        // 1. Regex Estricto
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return { valid: false, message: "El formato del correo es inválido." };

        const domain = email.split('@')[1].toLowerCase();

        // 2. Lista Negra
        const blacklist = ['yopmail.com', 'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com', 'dispostable.com'];
        if (blacklist.includes(domain)) return { valid: false, message: "No se permiten proveedores de correo temporal o desechable." };

        // 3. Verificación de DNS MX
        try {
            const controllerMX = new AbortController();
            const timeoutMX = setTimeout(() => controllerMX.abort(), 3500);
            const resMX = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, { signal: controllerMX.signal });
            clearTimeout(timeoutMX);
            if (resMX.ok) {
                const dataMX = await resMX.json();
                if (dataMX.Status !== 0 || !dataMX.Answer) {
                    return { valid: false, message: "El dominio del correo no existe o no puede recibir mensajes (DNS Inválido)." };
                }
            }
        } catch (error) {
            console.warn("Fallo al verificar DNS MX:", error);
        }

        // 4. API Externa para correos desechables
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`https://disposable.debounce.io/?email=${email}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.disposable === "true") {
                return { valid: false, message: "El dominio ingresado fue identificado como temporal o inválido por los servidores globales." };
            }
        } catch (error) {
            console.warn("API de debounce falló:", error);
        }

        return { valid: true };
    };

    // --- FUNCIÓN: resetForm ---
    // Limpia todos los campos del formulario y cancela el modo edición.
    // Se llama tras guardar con éxito o al hacer clic en "Cancelar".
    const resetForm = () => {
        setNombre('');
        setEmail('');
        setPassword('');
        setIdRol(roles.length > 0 ? roles[0].id_rol : ''); // Vuelve al primer rol
        setEditingId(null); // Sale del modo edición
        setError('');
    };

    // --- FUNCIÓN: handleEdit ---
    // Precarga los datos del usuario en el formulario para editarlos.
    // Asigna `editingId` para que handleAddOrUpdateUser use PUT en lugar de POST.
    // Hace scroll al formulario para que el usuario lo vea.
    const handleEdit = (usuario) => {
        setNombre(usuario.nombre);
        setEmail(usuario.correo);
        setPassword('');  // Se deja en blanco al editar (no se re-muestra la contraseña)
        // Busca el id_rol que corresponde al nombre del rol del usuario seleccionado
        const rolEncontrado = roles.find(r => r.nombre === usuario.rol);
        setIdRol(rolEncontrado ? rolEncontrado.id_rol : roles[0]?.id_rol);
        setEditingId(usuario.id_usuario);
        setError('');
        
        // Scroll hacia el formulario (utiliza scrollIntoView por si está en un contenedor con overflow)
        setTimeout(() => {
            document.querySelector('.ajustes-page-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    // --- FUNCIÓN: filteredUsuarios ---
    // Aplica el filtro de búsqueda (nombre, correo o rol) y el filtro de estado
    // (todos, activo, inactivo) para determinar qué usuarios se muestran en la tabla.
    const filteredUsuarios = usuarios.filter(usuario => {
        const nombreMatch = (usuario.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
        const correoMatch = (usuario.correo || "").toLowerCase().includes(searchTerm.toLowerCase());
        const rolMatch    = (usuario.rol    || "").toLowerCase().includes(searchTerm.toLowerCase());
        const searchMatch = nombreMatch || correoMatch || rolMatch;

        const estadoActual = usuario.estado || 'activo'; // Por defecto activo si no tiene estado
        if (filterStatus === 'todos') return searchMatch;
        return searchMatch && estadoActual === filterStatus;
    });

    // --- FUNCIÓN: handleToggleEstado ---
    // Activa o desactiva un usuario en el sistema (no elimina, solo cambia el estado).
    // - Inactivo: el usuario no puede iniciar sesión pero sus datos se conservan.
    // - Activo: el usuario recupera el acceso normal al sistema.
    // Solicita confirmación al administrador antes de ejecutar el cambio.
    const handleToggleEstado = async (usuarioToToggle) => {
        const estadoActual = usuarioToToggle.estado || 'activo';
        const nuevoEstado  = estadoActual === 'inactivo' ? 'activo' : 'inactivo';
        const mensajeConfirmacion = nuevoEstado === 'inactivo' 
            ? `¿Estás seguro de que deseas desactivar al usuario ${usuarioToToggle.nombre}? No podrá iniciar sesión en el sistema.`
            : `¿Estás seguro de que deseas activar al usuario ${usuarioToToggle.nombre}? Recuperará el acceso al sistema.`;

        if (!window.confirm(mensajeConfirmacion)) return; // Aborta si el admin cancela

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
                cargarUsuarios(); // Recarga la tabla con el nuevo estado
            }
        } catch (err) {
            alert('No se pudo conectar al servidor.');
        }
    };

    // --- LÓGICA DE PAGINACIÓN Y ORDENAMIENTO ---
    // (Ordenamiento por columna removido por petición. Se usa la lista filtrada)
    const sortedUsuarios = filteredUsuarios;

    const totalPages        = Math.ceil(sortedUsuarios.length / itemsPerPage); // Total de páginas
    const indexOfLastItem   = currentPage * itemsPerPage;                      // Índice del último elemento
    const indexOfFirstItem  = indexOfLastItem - itemsPerPage;                  // Índice del primer elemento
    const currentItems      = sortedUsuarios.slice(indexOfFirstItem, indexOfLastItem); // Slice de la página

    // Resetear a pág 1 si cambia el término de búsqueda (evita página vacía)
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

                        <div className="ajustes-form-actions-row">
                            <button type="button" className="btn-ajustes-secondary" onClick={resetForm}>Cancelar</button>
                            <button type="submit" className="btn-ajustes-primary" disabled={loading || validandoCorreo}>
                                {validandoCorreo ? 'Validando correo...' : loading ? 'Guardando...' : (editingId ? 'Actualizar Usuario' : 'Crear Usuario')}
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
                            <FiSearch size={15} className="ajustes-search-icon" />
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
                                            <button className="action-icon-btn edit" onClick={() => handleEdit(usuario)} title="Editar"><FiEdit2 /></button>
                                            <button 
                                                className={`action-icon-btn ${usuario.estado === 'inactivo' ? 'approve' : 'reject'}`} 
                                                onClick={() => handleToggleEstado(usuario)} 
                                                title={usuario.estado === 'inactivo' ? 'Activar Usuario' : 'Desactivar Usuario'}
                                                style={{ fontSize: '15px' }}
                                            >
                                                {usuario.estado === 'inactivo' ? <FiCheck /> : <FiSlash />}
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
