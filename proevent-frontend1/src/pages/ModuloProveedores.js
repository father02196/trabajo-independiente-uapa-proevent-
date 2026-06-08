import React, { useState, useEffect } from 'react';
import { FiSend, FiCheckSquare, FiDollarSign, FiUserPlus, FiFileText, FiCpu, FiEdit, FiPower, FiFilter, FiSearch, FiPackage, FiRefreshCw, FiUpload, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';
import './../css/ModuloProveedores.css';



function ModuloProveedores({ usuario }) {
    const API = "http://localhost:8080";
    // --- Persistencia de la pestaña activa ---
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("proveedores_activeTab") || 'logistica';
    });

    useEffect(() => {
        localStorage.setItem("proveedores_activeTab", activeTab);
    }, [activeTab]);
    const [servicios, setServicios] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [categoriasActivas, setCategoriasActivas] = useState([]);
    const [licitacionesAdjudicadas, setLicitacionesAdjudicadas] = useState([]);
    const [fileFactura, setFileFactura] = useState(null);
    const [filtroEstadoRecepcion, setFiltroEstadoRecepcion] = useState('Todos');
    
    // --- Módulo: Interfaz de Usuario | Función: Filtros del Directorio ---
    const [searchTermDirectorio, setSearchTermDirectorio] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");
    
    // Estados para Modales
    const [modalConfig, setModalConfig] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (activeTab === 'logistica') fetchServicios();
        if (activeTab === 'directorio') fetchProveedores();
        if (activeTab === 'ia') cargarLicitacionesAdjudicadas();
        fetchCategoriasActivas(); // Siempre cargar categorías para los modales
    }, [activeTab]);

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

    // --- LOGÍSTICA ---
    const handleEnvio = async (idServicio) => {
        if (!window.confirm("¿Confirmar que la orden fue enviada al proveedor?")) return;
        try {
            const res = await fetch(`http://localhost:8080/servicios-externos/${idServicio}/proveedor`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha_envio: new Date().toISOString() })
            });
            if (res.ok) fetchServicios();
        } catch (error) { console.error('Error:', error); }
    };

    // --- Módulo: Directorio de Suplidores | Función: Guardar Proveedor (Crear/Editar) ---
    // Esta función maneja tanto la creación de un nuevo suplidor como la edición de uno existente
    const handleGuardarProveedor = async (e) => {
        e.preventDefault(); // Evita que la página se recargue al enviar el formulario
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

    const serviciosList = servicios.filter(s => filtroEstadoRecepcion === 'Todos' || (filtroEstadoRecepcion === 'Recibido' ? s.fecha_envio_proveedor : !s.fecha_envio_proveedor));
    const { items: sortedServicios, requestSort: requestSortServicios, sortConfig: sortConfigServicios } = useSortableData(serviciosList, { key: 'nombre_evento', direction: 'ascending' });

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
    const { items: sortedProveedores, requestSort: requestSortProveedores, sortConfig: sortConfigProveedores } = useSortableData(proveedoresFiltrados, { key: 'nombre_empresa', direction: 'ascending' });

    const { items: sortedLicitaciones, requestSort: requestSortLicitaciones, sortConfig: sortConfigLicitaciones } = useSortableData(licitacionesAdjudicadas, { key: 'nombre_evento', direction: 'ascending' });

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
                                    <SortableHeader label="Evento" sortKey="nombre_evento" sortConfig={sortConfigServicios} requestSort={requestSortServicios} />
                                    <SortableHeader label="Servicio / Detalle" sortKey="tipo_servicio" sortConfig={sortConfigServicios} requestSort={requestSortServicios} />
                                    <SortableHeader label="Estado Envío" sortKey="fecha_envio_proveedor" sortConfig={sortConfigServicios} requestSort={requestSortServicios} />
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
                                                            onClick={() => handleEnvio(s.id_servicio_ext)}
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
                                    <SortableHeader label="Empresa / RNC" sortKey="nombre_empresa" sortConfig={sortConfigProveedores} requestSort={requestSortProveedores} />
                                    <SortableHeader label="Categoría" sortKey="categoria" sortConfig={sortConfigProveedores} requestSort={requestSortProveedores} />
                                    <SortableHeader label="Persona de Contacto" sortKey="persona_contacto" sortConfig={sortConfigProveedores} requestSort={requestSortProveedores} />
                                    <SortableHeader label="Correo" sortKey="correo" sortConfig={sortConfigProveedores} requestSort={requestSortProveedores} />
                                    <SortableHeader label="Estado" sortKey="estado" sortConfig={sortConfigProveedores} requestSort={requestSortProveedores} />
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
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
                                    <SortableHeader label="Evento / Requisitos" sortKey="nombre_evento" sortConfig={sortConfigLicitaciones} requestSort={requestSortLicitaciones} />
                                    <SortableHeader label="Proveedor Ganador" sortKey="proveedor_nombre" sortConfig={sortConfigLicitaciones} requestSort={requestSortLicitaciones} />
                                    <SortableHeader label="Monto Total" sortKey="monto_total_detectado" sortConfig={sortConfigLicitaciones} requestSort={requestSortLicitaciones} />
                                    <SortableHeader label="Estado Pago" sortKey="estado_pago" sortConfig={sortConfigLicitaciones} requestSort={requestSortLicitaciones} />
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

            {/* MODALES CRUD PROVEEDOR */}
            {modalConfig.open && (modalConfig.type === 'nuevo_proveedor' || modalConfig.type === 'editar_proveedor') && (
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
                                            <input 
                                                className="input-base" 
                                                required 
                                                type="password" 
                                                placeholder="Mínimo 8 caracteres"
                                                value={formData.contrasena || ''} 
                                                onChange={e => setFormData({ ...formData, contrasena: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setModalConfig({ open: false })}>
                                Cancelar
                            </button>
                            <button type="submit" form="proveedor-form" className="btn btn-primary">
                                {modalConfig.type === 'editar_proveedor' ? 'Guardar Cambios' : 'Registrar Suplidor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModuloProveedores;
