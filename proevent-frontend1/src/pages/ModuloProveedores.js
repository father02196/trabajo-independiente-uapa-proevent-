// ============================================================
// MÓDULO B2B (ADMINISTRACIÓN DE PROVEEDORES)
// Pertenece a: Módulo Operativo / Licitaciones y Compras
// Propósito: Permite gestionar suplidores (CRUD), enviarles
// órdenes de cotización, visualizar el estatus de las cotizaciones
// y subir la factura saldada para licitaciones adjudicadas por IA.
// ============================================================

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiSend, FiCheckSquare, FiDollarSign, FiUserPlus, FiFileText, FiCpu, FiEdit, FiPower, FiFilter, FiSearch, FiPackage, FiRefreshCw, FiUpload, FiCheckCircle, FiAlertTriangle, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import './../css/ModuloProveedores.css';

// ============================================================
// COMPONENTE: ModuloProveedores
// Recibe:
//   - usuario: Objeto del administrador o gestor de compras logueado
// ============================================================
function ModuloProveedores({ usuario }) {
    const API = "http://localhost:8080";
    
    // --- ESTADO Y PERSISTENCIA DE PESTAÑA ---
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("proveedores_activeTab") || 'logistica';
    });

    useEffect(() => {
        localStorage.setItem("proveedores_activeTab", activeTab);
    }, [activeTab]);

    // --- ESTADOS DE DATOS GLOBALES ---
    const [servicios, setServicios] = useState([]);               // Requerimientos (órdenes)
    const [proveedores, setProveedores] = useState([]);           // Directorio de suplidores
    const [categoriasActivas, setCategoriasActivas] = useState([]); // Categorías disponibles para asignar suplidor
    const [licitacionesAdjudicadas, setLicitacionesAdjudicadas] = useState([]); // Resultados de la IA
    const [fileFactura, setFileFactura] = useState(null);         // PDF de la factura a subir
    
    // --- ESTADOS DE FILTROS ---
    const [filtroEstadoRecepcion, setFiltroEstadoRecepcion] = useState('Todos'); // Logística
    const [searchTermDirectorio, setSearchTermDirectorio] = useState("");        // Directorio
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");             // Directorio
    
    // --- ESTADOS PARA MODALES CRUD (Directorio) ---
    const [modalConfig, setModalConfig] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({});
    const [showPassword, setShowPassword] = useState(false); // Para mostrar pass en form de creación

    // --- ESTADOS PARA VALIDACIÓN AVANZADA DE CORREO ---
    const [errorEmailModal, setErrorEmailModal] = useState(false);
    const [mensajeErrorCorreo, setMensajeErrorCorreo] = useState("");
    const [validandoCorreo, setValidandoCorreo] = useState(false);

    // --- ESTADOS PARA MODAL DE ENVÍO DE ÓRDENES (Logística) ---
    const [modalEnvio, setModalEnvio] = useState({ open: false, servicio: null });
    const [proveedoresFiltradosTipo, setProveedoresFiltradosTipo] = useState([]); // Filtrados por la cat. de la orden
    const [envioForm, setEnvioForm] = useState({ id_proveedor: '', descripcion_requerimientos: '', fecha_limite: '' });
    const [enviando, setEnviando] = useState(false);

    // --- EFECTOS: Carga dinámica según la pestaña ---
    useEffect(() => {
        if (activeTab === 'logistica') fetchServicios();
        if (activeTab === 'directorio') fetchProveedores();
        if (activeTab === 'ia') cargarLicitacionesAdjudicadas();
        fetchCategoriasActivas(); // Siempre cargar categorías para los modales
    }, [activeTab]);

    // --- FUNCIÓN: fetchCategoriasActivas ---
    // Obtiene categorías de proveedor para los combos (ej. Floristería, Catering)
    const fetchCategoriasActivas = async () => {
        try {
            const res = await fetch(`${API}/api/admin/categorias-servicio`);
            const data = await res.json();
            // Solo queremos mostrar en el combo las categorías activas
            if(Array.isArray(data)) setCategoriasActivas(data.filter(c => c.estado !== 'Inactivo'));
        } catch (e) {
            console.error("Error cargando categorias", e);
        }
    };

    const cargarLicitacionesAdjudicadas = async () => {
        try {
            const res = await fetch(`${API}/admin/licitaciones-adjudicadas`);
            const data = await res.json();
            setLicitacionesAdjudicadas(Array.isArray(data) ? data : []);
        } catch(e) {
            console.error(e);
        }
    };

    // --- FUNCIÓN: fetchServicios ---
    // Obtiene las órdenes de servicio que necesitan ser enviadas a suplidores
    const fetchServicios = async () => {
        try {
            const response = await fetch('http://localhost:8080/servicios-externos-all');
            const data = await response.json();
            setServicios(data);
        } catch (error) { console.error('Error fetching servicios:', error); }
    };

    const fetchProveedores = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/admin/proveedores');
            const data = await response.json();
            setProveedores(data);
        } catch (error) { console.error('Error fetching proveedores:', error); }
    };

    // --- LOGÍSTICA: Abrir modal de envío (busca proveedores del mismo tipo de servicio) ---
    const openModalEnvio = async (servicio) => {
        try {
            // Cargar proveedores activos del mismo tipo de servicio que el servicio externo
            const res = await fetch(`${API}/api/admin/proveedores`);
            const todos = await res.json();
            const filtrados = Array.isArray(todos)
                ? todos.filter(p => p.estado === 'Activo' && p.id_tipo_servicio === servicio.id_tipo_servicio)
                : [];
            setProveedoresFiltradosTipo(filtrados);
        } catch(e) {
            console.error('Error al cargar proveedores:', e);
            setProveedoresFiltradosTipo([]);
        }
        // Calcular fecha límite sugerida (7 días desde hoy)
        const fechaSugerida = new Date();
        fechaSugerida.setDate(fechaSugerida.getDate() + 7);
        const fechaStr = fechaSugerida.toISOString().split('T')[0];
        setEnvioForm({ id_proveedor: '', descripcion_requerimientos: servicio.descripcion || '', fecha_limite: fechaStr });
        setModalEnvio({ open: true, servicio });
    };

    // --- LOGÍSTICA: Confirmar envío → actualiza servicio_externo Y crea solicitud_cotizacion ---
    const handleConfirmarEnvio = async (e) => {
        e.preventDefault();
        const { servicio } = modalEnvio;
        if (!envioForm.id_proveedor) return alert('Selecciona un proveedor para envíarsela.');
        if (!envioForm.fecha_limite) return alert('Indica la fecha límite para cotizar.');
        setEnviando(true);
        try {
            const res = await fetch(`${API}/servicios-externos/${servicio.id_servicio_ext}/proveedor`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-usuario-id': usuario?.id_usuario || '' },
                body: JSON.stringify({
                    fecha_envio: new Date().toISOString(),
                    id_proveedor_destino: envioForm.id_proveedor,
                    descripcion_requerimientos: envioForm.descripcion_requerimientos,
                    fecha_limite: envioForm.fecha_limite
                })
            });
            if (res.ok) {
                alert('✅ Orden enviada con éxito. El proveedor ya puede verla en su portal.');
                setModalEnvio({ open: false, servicio: null });
                fetchServicios();
            } else {
                const err = await res.json();
                alert('Error: ' + (err.error || err.mensaje || 'No se pudo enviar'));
            }
        } catch(error) {
            alert('Error de conexión con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    // --- Módulo: Directorio de Suplidores | Función: Guardar Proveedor (Crear/Editar) ---
    // Esta función maneja tanto la creación de un nuevo suplidor como la edición de uno existente
    
    // Función de validación avanzada de correo
    const validarCorreoAvanzado = async (email) => {
        // 1. Regex Estricto (Formato básico)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return { valid: false, message: "El formato del correo es inválido." };

        const domain = email.split('@')[1].toLowerCase();

        // 2. Lista Negra Local (Dominios desechables conocidos)
        const blacklist = ['yopmail.com', 'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com', 'dispostable.com'];
        if (blacklist.includes(domain)) return { valid: false, message: "No se permiten proveedores de correo temporal o desechable." };

        // 3. Verificación Real de DNS (Registros MX) usando la API de Google DNS (Sin CORS, 100% gratuita y confiable)
        try {
            const controllerMX = new AbortController();
            const timeoutMX = setTimeout(() => controllerMX.abort(), 3500); // 3.5 segundos de timeout
            
            // Consultamos los registros MX del dominio
            const resMX = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, { signal: controllerMX.signal });
            clearTimeout(timeoutMX);
            
            if (resMX.ok) {
                const dataMX = await resMX.json();
                // Status !== 0 significa que el dominio no existe (NXDOMAIN) u otro error de DNS
                if (dataMX.Status !== 0) {
                    return { valid: false, message: `El dominio "@${domain}" no existe o no está registrado en internet.` };
                }
                // Si el dominio existe pero no tiene respuestas (Answer) o no son tipo 15 (MX)
                if (!dataMX.Answer || dataMX.Answer.length === 0) {
                    return { valid: false, message: `El dominio "@${domain}" no está configurado para recibir correos (No tiene registros MX).` };
                }
            }
        } catch (error) {
            console.warn("Fallo al verificar DNS MX (Fail-Open):", error);
        }

        // 4. API Externa (debounce.io) para chequear si el dominio es desechable en sus listas globales
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout
            const res = await fetch(`https://disposable.debounce.io/?email=${email}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            
            if (data.disposable === "true") {
                return { valid: false, message: "El dominio ingresado fue identificado como temporal o inválido por los servidores globales." };
            }
        } catch (error) {
            console.warn("API de debounce falló (Fail-Open activado):", error);
        }

        return { valid: true };
    };

    const handleGuardarProveedor = async (e) => {
        e.preventDefault(); // Evita que la página se recargue al enviar el formulario
        
        // --- NUEVA CAPA DE VALIDACIÓN AVANZADA ---
        if (formData.correo) {
            setValidandoCorreo(true);
            const validacion = await validarCorreoAvanzado(formData.correo);
            setValidandoCorreo(false);
            
            if (!validacion.valid) {
                setMensajeErrorCorreo(validacion.message || "El correo electrónico ingresado no pudo ser validado o parece no existir. Verifique la dirección e intente nuevamente.");
                setErrorEmailModal(true);
                return; // Bloquea la continuación del guardado
            }
        }
        // -----------------------------------------

        // Verifica si estamos en modo edición o creación revisando el tipo de modal
        const isEdit = modalConfig.type === 'editar_proveedor';
        // Asigna la URL del backend dinámicamente; si es edición, añade el ID del proveedor al final
        const url = isEdit 
            ? `http://localhost:8080/api/admin/proveedor/${modalConfig.data.id_proveedor}` 
            : 'http://localhost:8080/api/admin/proveedor';
        // Si es edición, el método HTTP será PUT (Actualizar), si es nuevo será POST (Crear)
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert(isEdit ? 'Proveedor actualizado con éxito.' : 'Proveedor creado y correo de acceso enviado.');
                setModalConfig({ open: false, type: null, data: null });
                fetchProveedores();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    // --- Módulo: Directorio de Suplidores | Función: Alternar Estado (Activo/Inactivo) ---
    // Esta función permite desactivar temporalmente un suplidor sin borrarlo permanentemente de la BD
    const handleToggleEstado = async (proveedor) => {
        // Determina el estado inverso al actual (Si es Activo pasa a Inactivo y viceversa)
        const nuevoEstado = proveedor.estado === 'Activo' ? 'Inactivo' : 'Activo';
        // Muestra una ventana de alerta al usuario pidiendo confirmación antes de proceder
        if(!window.confirm(`¿Seguro que deseas marcar a ${proveedor.nombre_empresa} como ${nuevoEstado}?`)) return;

        try {
            // Envía la petición PUT al backend para actualizar exclusivamente el campo estado
            const res = await fetch(`http://localhost:8080/api/admin/proveedor/${proveedor.id_proveedor}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }) // Convierte el estado a formato JSON
            });
            if (res.ok) {
                fetchProveedores();
            } else {
                alert('Error al cambiar el estado.');
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    // --- Módulo: Interfaz de Usuario | Función: Abrir Modales (Crear/Editar) ---
    // Controla la apertura del modal y la pre-carga de los datos en los inputs del formulario
    const openModal = (type, data = null) => {
        // Abre el modal y guarda el tipo de operación y los datos que recibe
        setModalConfig({ open: true, type, data });
        // Si el usuario va a crear o editar, preparamos los estados de los campos
        if (type === 'nuevo_proveedor' || type === 'editar_proveedor') {
            if (data) {
                // Si recibe data (Edición), inyecta los datos del suplidor existente en el formulario
                setFormData({
                    nombre_empresa: data.nombre_empresa,
                    rnc_cedula: data.rnc_cedula,
                    id_tipo_servicio: data.id_tipo_servicio,
                    persona_contacto: data.persona_contacto,
                    correo: data.correo,
                    telefono: data.telefono,
                    contrasena: '' // La contraseña queda vacía por seguridad para no sobreescribirla accidentalmente
                });
            } else {
                // Si es un proveedor nuevo, inicializa todos los campos vacíos
                setFormData({
                    nombre_empresa: '',
                    rnc_cedula: '',
                    id_tipo_servicio: 1,
                    persona_contacto: '',
                    correo: '',
                    telefono: '',
                    contrasena: ''
                });
            }
        }
    };

    // Función para manejar el botón "Corregir correo" del modal de error
    const handleCorregirCorreo = () => {
        setErrorEmailModal(false);
        // Pequeño delay para permitir que el modal se cierre y el DOM del form reciba el foco
        setTimeout(() => {
            const inputCorreo = document.getElementById("input-correo-proveedor");
            if (inputCorreo) {
                inputCorreo.focus();
                inputCorreo.select();
            }
        }, 100);
    };

    // --- FUNCIONES DE FILTRO Y ORDENAMIENTO DE TABLAS ---
    // Logística:
    const serviciosList = servicios.filter(s => filtroEstadoRecepcion === 'Todos' || (filtroEstadoRecepcion === 'Recibido' ? s.fecha_envio_proveedor : !s.fecha_envio_proveedor));
    const sortedServicios = [...serviciosList].sort((a, b) => (a.nombre_evento || '').localeCompare(b.nombre_evento || ''));

    // Directorio:
    const categoriasUnicas = [...new Set(proveedores.map(p => p.categoria))];
    const proveedoresFiltrados = proveedores.filter(p => {
        const text = searchTermDirectorio.toLowerCase();
        const matchesSearch = 
            p.nombre_empresa.toLowerCase().includes(text) || 
            p.rnc_cedula.toLowerCase().includes(text) || 
            p.correo.toLowerCase().includes(text);
        
        const matchesCategory = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
        return matchesSearch && matchesCategory;
    });
    const sortedProveedores = [...proveedoresFiltrados].sort((a, b) => (a.nombre_empresa || '').localeCompare(b.nombre_empresa || ''));

    const sortedLicitaciones = [...licitacionesAdjudicadas].sort((a, b) => (a.nombre_evento || '').localeCompare(b.nombre_evento || ''));

    return (
        <div className="proveedores-container">
            {/* Header */}
            <div className="proveedores-header">
                <h1 className="proveedores-title">Módulo de Proveedores y Licitaciones</h1>
                <p className="proveedores-subtitle">Gestiona suplidores, logística operativa y licitaciones adjudicadas por IA</p>
            </div>

            {/* Premium Pill Tabs */}
            <div className="modern-tabs">
                <button className={activeTab === 'logistica' ? 'active' : ''} onClick={() => setActiveTab('logistica')}>
                    <FiPackage style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Logística Operativa
                </button>
                <button className={activeTab === 'directorio' ? 'active' : ''} onClick={() => setActiveTab('directorio')}>
                    <FiFileText style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Directorio de Suplidores
                </button>
                <button className={activeTab === 'ia' ? 'active' : ''} onClick={() => setActiveTab('ia')}>
                    <FiCpu style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Licitaciones (IA)
                </button>
            </div>

            {/* TAB: LOGÍSTICA */}
            {activeTab === 'logistica' && (
                <>
                    <div className="filtros-proveedores">
                        <div className="filtro-grupo">
                            <label><FiFilter style={{ display: 'inline', marginRight: '4px' }} />Estado de Recepción</label>
                            <select value={filtroEstadoRecepcion} onChange={e => setFiltroEstadoRecepcion(e.target.value)}>
                                <option value="Todos">Todos los estados</option>
                                <option value="Pendiente">⏳ Pendiente</option>
                                <option value="Recibido">✅ Recibido</option>
                                <option value="Con Incidencias">⚠️ Con Incidencias</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 'auto' }}>
                            <button className="btn btn-secondary btn-sm" onClick={fetchServicios} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiRefreshCw size={13} /> Actualizar
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Servicio / Detalle</th>
                                    <th>Estado Envío</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedServicios.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                                            <FiPackage style={{ fontSize: '32px', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                                            <div style={{ fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>No hay órdenes en logística</div>
                                            <div style={{ fontSize: '13px' }}>Los servicios externos aparecerán aquí cuando sean asignados a eventos</div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedServicios.map(s => (
                                            <tr key={s.id_servicio_ext}>
                                                <td>
                                                    <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>{s.nombre_evento}</div>
                                                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>ID: {s.id_servicio_ext}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                                        <span style={{ 
                                                            background: '#EFF6FF', 
                                                            color: '#1D4ED8', 
                                                            padding: '4px 10px', 
                                                            borderRadius: '8px', 
                                                            fontSize: '12.5px', 
                                                            fontWeight: '600' 
                                                        }}>
                                                            {s.tipo_servicio}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            color: s.clasificacion === 'Especializado' ? '#9d174d' : '#047857',
                                                            background: s.clasificacion === 'Especializado' ? '#fce7f3' : '#d1fae5',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {s.clasificacion}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${s.fecha_envio_proveedor ? 'enviado' : 'pendiente'}`}>
                                                        {s.fecha_envio_proveedor ? 'Enviado' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {!s.fecha_envio_proveedor && (
                                                        <button 
                                                            className="btn btn-primary btn-sm" 
                                                            onClick={() => openModalEnvio(s)}
                                                        >
                                                            <FiSend size={13} /> Enviar Orden
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: DIRECTORIO */}
            {activeTab === 'directorio' && (
                <>
                    <div className="filtros-proveedores" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                            <div className="filtro-grupo" style={{ flex: 2 }}>
                                <label><FiSearch style={{ display: 'inline', marginRight: '4px' }} />Buscar suplidor</label>
                                <input 
                                    type="text" 
                                    className="input-base"
                                    placeholder="Nombre, RNC o correo..." 
                                    value={searchTermDirectorio}
                                    onChange={(e) => setSearchTermDirectorio(e.target.value)}
                                />
                            </div>
                            <div className="filtro-grupo" style={{ flex: 1, minWidth: '180px' }}>
                                <label><FiFilter style={{ display: 'inline', marginRight: '4px' }} />Categoría</label>
                                <select 
                                    className="input-base"
                                    value={filtroCategoria} 
                                    onChange={(e) => setFiltroCategoria(e.target.value)}
                                >
                                    <option value="Todas">Todas las categorías</option>
                                    {categoriasUnicas.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => openModal('nuevo_proveedor', null)}
                            style={{ whiteSpace: 'nowrap', marginLeft: '12px', flexShrink: 0 }}
                        >
                            <FiUserPlus size={15} /> Registrar Suplidor
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Empresa / RNC</th>
                                    <th>Categoría</th>
                                    <th>Persona de Contacto</th>
                                    <th>Correo</th>
                                    <th>Estado</th>
                                    {['Administrador', 'Compras', 'Administrador de Compras'].includes(usuario?.rol) && (
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProveedores.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                                            <FiFileText style={{ fontSize: '32px', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                                            <div style={{ fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>No se encontraron proveedores</div>
                                            <div style={{ fontSize: '13px' }}>Intenta ajustar los filtros de búsqueda</div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedProveedores.map(p => (
                                        <tr key={p.id_proveedor} style={{ opacity: p.estado === 'Inactivo' ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>{p.nombre_empresa}</div>
                                                <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{p.rnc_cedula}</div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    background: '#F5F3FF', 
                                                    color: '#6D28D9', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '12px', 
                                                    fontWeight: '600' 
                                                }}>
                                                    {p.categoria}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{p.persona_contacto}</div>
                                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{p.telefono}</div>
                                            </td>
                                            <td style={{ color: '#475569' }}>{p.correo}</td>
                                            <td>
                                                <span className={`badge ${p.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                                                    {p.estado}
                                                </span>
                                            </td>
                                            {['Administrador', 'Compras', 'Administrador de Compras'].includes(usuario?.rol) && (
                                                <td>
                                                    <div className="acciones-celda">
                                                        <button 
                                                            onClick={() => openModal('editar_proveedor', p)}
                                                            className="btn-icon-action"
                                                            title="Editar Suplidor"
                                                        >
                                                            <FiEdit />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleEstado(p)}
                                                            className={`btn-icon-action ${p.estado === 'Activo' ? 'danger' : ''}`}
                                                            title={p.estado === 'Activo' ? "Desactivar Suplidor" : "Activar Suplidor"}
                                                        >
                                                            <FiPower />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: LICITACIONES IA Y FACTURAS B2B */}
            {activeTab === 'ia' && (
                <div className="licitaciones-ia-card">
                    {/* Header premium */}
                    <div className="licitaciones-ia-header">
                        <div className="ia-icon-wrapper">
                            <FiCpu size={28} color="#fff" />
                        </div>
                        <h3>Licitaciones Adjudicadas — Evaluación IA</h3>
                        <p>
                            Las licitaciones evaluadas y adjudicadas por inteligencia artificial aparecen aquí. 
                            Como Encargado de Compras, puede subir la factura saldada para finalizar el evento logísticamente.
                        </p>
                    </div>

                    {/* Tabla */}
                    <div className="table-container" style={{ borderRadius: '0', border: 'none', boxShadow: 'none' }}>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Evento / Requisitos</th>
                                    <th>Proveedor Ganador</th>
                                    <th>Monto Total</th>
                                    <th>Estado Pago</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLicitaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '60px 24px' }}>
                                            <FiCpu style={{ fontSize: '40px', color: '#CBD5E1', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                                            <div style={{ fontWeight: '700', color: '#475569', fontSize: '15px', marginBottom: '6px' }}>No hay licitaciones adjudicadas</div>
                                            <div style={{ fontSize: '13px', color: '#94A3B8' }}>Las licitaciones procesadas por IA aparecerán aquí</div>
                                        </td>
                                    </tr>
                                ) : sortedLicitaciones.map(lic => (
                                    <tr key={lic.id_analisis}>
                                        <td>
                                            <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{lic.nombre_evento}</div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {lic.requisitos}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '28px', height: '28px',
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                                    color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '11px', fontWeight: '700', flexShrink: 0
                                                }}>
                                                    {lic.proveedor_nombre ? lic.proveedor_nombre.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{lic.proveedor_nombre}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '15px' }}>
                                                {lic.monto_total_detectado 
                                                    ? `$${Number(lic.monto_total_detectado).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
                                                    : '—'
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${lic.estado_pago === 'Pagado' ? 'enviado' : 'pendiente'}`}>
                                                {lic.estado_pago || 'Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            {lic.estado_pago !== 'Pagado' ? (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <label style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '8px 12px',
                                                        background: '#F8FAFC',
                                                        border: '1.5px solid #E2E8F0',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '12.5px',
                                                        fontWeight: '600',
                                                        color: '#475569',
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <FiUpload size={13} />
                                                        {fileFactura ? fileFactura.name.substring(0, 16) + '...' : 'Seleccionar PDF'}
                                                        <input 
                                                            type="file" 
                                                            accept="application/pdf" 
                                                            onChange={e => setFileFactura(e.target.files[0])} 
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        disabled={!fileFactura}
                                                        onClick={async () => {
                                                            if (!fileFactura) return;
                                                            const fd = new FormData();
                                                            fd.append('archivo_factura', fileFactura);
                                                            try {
                                                                const res = await fetch(`${API}/admin/factura-proveedor/${lic.id_cotizacion}`, {
                                                                    method: 'POST',
                                                                    headers: { 'x-usuario-id': usuario?.id_usuario || '' },
                                                                    body: fd
                                                                });
                                                                if (res.ok) {
                                                                    alert("Factura subida correctamente.");
                                                                    setFileFactura(null);
                                                                    cargarLicitacionesAdjudicadas();
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert(err.error || "Error al subir");
                                                                }
                                                            } catch(e) {
                                                                alert("Error de red");
                                                            }
                                                        }}
                                                    >
                                                        <FiCheckSquare size={13} /> Subir
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '13.5px' }}>
                                                    <FiCheckCircle size={16} /> Pagado
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL ENVIAR ORDEN AL PROVEEDOR */}
            {modalEnvio.open && createPortal(
                <div className="modal-overlay" onClick={() => setModalEnvio({ open: false, servicio: null })}>
                    <div className="modal-content modal-premium" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title"><FiSend style={{ marginRight: 8 }} />Enviar Orden al Proveedor</h3>
                                <p className="modal-subtitle">Servicio: <strong>{modalEnvio.servicio?.tipo_servicio}</strong> &nbsp;|&nbsp; Evento: <strong>{modalEnvio.servicio?.nombre_evento}</strong></p>
                            </div>
                        </div>
                        <form onSubmit={handleConfirmarEnvio} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="form-group">
                                <label className="form-label">Proveedor Destinatario <span style={{ color: 'red' }}>*</span></label>
                                {proveedoresFiltradosTipo.length === 0 ? (
                                    <div style={{ padding: '10px 14px', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '0.875rem' }}>
                                        ⚠️ No hay proveedores activos registrados para este tipo de servicio. Registra uno en la pestaña “Directorio” primero.
                                    </div>
                                ) : (
                                    <select
                                        className="input-base"
                                        value={envioForm.id_proveedor}
                                        onChange={e => setEnvioForm(prev => ({ ...prev, id_proveedor: e.target.value }))}
                                        required
                                    >
                                        <option value="">-- Selecciona un proveedor --</option>
                                        {proveedoresFiltradosTipo.map(p => (
                                            <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa} ({p.persona_contacto})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción de Requerimientos</label>
                                <textarea
                                    className="input-base"
                                    rows={3}
                                    placeholder="Detalla los requerimientos específicos del servicio..."
                                    value={envioForm.descripcion_requerimientos}
                                    onChange={e => setEnvioForm(prev => ({ ...prev, descripcion_requerimientos: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha Límite para Cotizar <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="date"
                                    className="input-base"
                                    value={envioForm.fecha_limite}
                                    onChange={e => setEnvioForm(prev => ({ ...prev, fecha_limite: e.target.value }))}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModalEnvio({ open: false, servicio: null })}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={enviando || proveedoresFiltradosTipo.length === 0}>
                                    {enviando ? 'Enviando...' : <><FiSend size={14} style={{ marginRight: 6 }} />Confirmar Envío</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* MODALES CRUD PROVEEDOR */}
            {modalConfig.open && (modalConfig.type === 'nuevo_proveedor' || modalConfig.type === 'editar_proveedor') && createPortal(
                <div className="modal-overlay" onClick={() => setModalConfig({ open: false })}>
                    <div className="modal-content modal-premium" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    {modalConfig.type === 'editar_proveedor' ? 'Editar Proveedor' : 'Registrar Proveedor'}
                                </h3>
                                <span className="modal-subtitle">
                                    {modalConfig.type === 'editar_proveedor' ? 'Actualizar datos de suplidor' : 'Dar de alta con acceso B2B'}
                                </span>
                            </div>
                            <span className="badge badge-purple" style={{ fontSize: '14px', padding: '6px 12px' }}>Directorio B2B</span>
                        </div>

                        <div className="modal-body" style={{ padding: '24px 32px' }}>
                            {modalConfig.type === 'nuevo_proveedor' && (
                                <div className="info-card" style={{ marginBottom: '24px', background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1', fontWeight: '600' }}>
                                        <FiInfo size={16} /> Información Importante
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#0C4A6E' }}>
                                        Se enviarán las credenciales de acceso al correo del proveedor automáticamente para que ingrese al portal B2B.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleGuardarProveedor} id="proveedor-form">
                                <div className="modal-grid-2">
                                    <div className="form-group">
                                        <label>Nombre de Empresa</label>
                                        <input 
                                            className="input-base" 
                                            required 
                                            placeholder="Ej: Servicios Gráficos S.A."
                                            value={formData.nombre_empresa || ''} 
                                            onChange={e => setFormData({ ...formData, nombre_empresa: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RNC / Cédula</label>
                                        <input 
                                            className="input-base" 
                                            required 
                                            placeholder="000-00000-0"
                                            value={formData.rnc_cedula || ''} 
                                            onChange={e => setFormData({ ...formData, rnc_cedula: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Categoría (Tipo de Servicio)</label>
                                        <select 
                                            className="input-base" 
                                            required 
                                            value={formData.id_tipo_servicio || ''} 
                                            onChange={e => setFormData({ ...formData, id_tipo_servicio: e.target.value })}
                                        >
                                            <option value="">— Selecciona una categoría —</option>
                                            {categoriasActivas.map(cat => (
                                                <option key={cat.id_tipo_servicio} value={cat.id_tipo_servicio}>
                                                    {cat.nombre} ({cat.clasificacion})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Persona de Contacto</label>
                                        <input 
                                            className="input-base" 
                                            required 
                                            placeholder="Nombre del representante"
                                            value={formData.persona_contacto || ''} 
                                            onChange={e => setFormData({ ...formData, persona_contacto: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input 
                                            className="input-base" 
                                            required 
                                            placeholder="(809) 000-0000"
                                            value={formData.telefono || ''} 
                                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Correo Electrónico</label>
                                        <input 
                                            id="input-correo-proveedor"
                                            className="input-base" 
                                            required 
                                            type="email" 
                                            placeholder="correo@empresa.com"
                                            value={formData.correo || ''} 
                                            onChange={e => setFormData({ ...formData, correo: e.target.value })}
                                        />
                                    </div>
                                    {modalConfig.type === 'nuevo_proveedor' && (
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Contraseña de Acceso B2B</label>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    className="input-base" 
                                                    required 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder="Mínimo 8 caracteres"
                                                    value={formData.contrasena || ''} 
                                                    onChange={e => setFormData({ ...formData, contrasena: e.target.value })}
                                                    style={{ paddingRight: '40px' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#64748B',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '4px'
                                                    }}
                                                >
                                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setModalConfig({ open: false })}>
                                Cancelar
                            </button>
                            <button type="submit" form="proveedor-form" className="btn btn-primary" disabled={validandoCorreo}>
                                {validandoCorreo ? 'Validando...' : (modalConfig.type === 'editar_proveedor' ? 'Guardar Cambios' : 'Registrar Suplidor')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL GLOBAL SUPERPUESTO: ERROR DE CORREO NO VÁLIDO */}
            {errorEmailModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999, // Z-index superior a todo
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        textAlign: 'center',
                        transform: 'scale(1)',
                        animation: 'scaleIn 0.2s ease-out'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2',
                            color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FiAlertTriangle size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                            Correo electrónico no válido
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', marginBottom: '32px' }}>
                            {mensajeErrorCorreo || "El correo electrónico ingresado no pudo ser validado o parece no existir. Verifique la dirección e intente nuevamente."}
                        </p>
                        <button 
                            className="btn btn-primary" 
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                fontSize: '1rem', 
                                fontWeight: '700', 
                                justifyContent: 'center',
                                borderRadius: '12px',
                                boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.2)'
                            }}
                            onClick={handleCorregirCorreo}
                        >
                            Corregir correo
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default ModuloProveedores;
