import React, { useState, useEffect } from 'react';
import { FiSend, FiCheckSquare, FiDollarSign, FiUserPlus, FiFileText, FiCpu, FiEdit, FiPower } from 'react-icons/fi';
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

    return (
        <div className="proveedores-container">
            <div className="proveedores-header">
                <h1 className="proveedores-title">Módulo de Proveedores y Licitaciones</h1>
                
                <div className="proveedores-tabs">
                    <button className={`proveedores-tab ${activeTab === 'logistica' ? 'active' : ''}`} onClick={() => setActiveTab('logistica')}>Logística Operativa</button>
                    <button className={`proveedores-tab ${activeTab === 'directorio' ? 'active' : ''}`} onClick={() => setActiveTab('directorio')}>Directorio de Suplidores</button>
                    <button className={`proveedores-tab ${activeTab === 'ia' ? 'active' : ''}`} onClick={() => setActiveTab('ia')}>Licitaciones (IA)</button>
                </div>
            </div>

            {/* TAB: LOGÍSTICA */}
            {activeTab === 'logistica' && (
                <>
                    <div className="filtros-proveedores">
                        <div className="filtro-grupo">
                            <label>Estado Recepción:</label>
                            <select value={filtroEstadoRecepcion} onChange={e => setFiltroEstadoRecepcion(e.target.value)}>
                                <option value="Todos">Todos</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Recibido">Recibido</option>
                                <option value="Con Incidencias">Con Incidencias</option>
                            </select>
                        </div>
                    </div>
                    <div className="tabla-proveedores-container">
                        <table className="tabla-proveedores">
                            <thead>
                                <tr><th>Evento</th><th>Servicio / Cantidad</th><th>Envío Orden</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {servicios.map(s => (
                                    <tr key={s.id_servicio_ext}>
                                        <td><strong>{s.nombre_evento}</strong></td>
                                        <td>{s.tipo_servicio}</td>
                                        <td>{s.fecha_envio_proveedor ? 'Enviado' : 'Pendiente'}</td>
                                        <td className="acciones-celda">
                                            {!s.fecha_envio_proveedor && (
                                                <button className="btn-accion btn-envio" onClick={() => handleEnvio(s.id_servicio_ext)}><FiSend /> Enviar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: DIRECTORIO */}
            {activeTab === 'directorio' && (() => {
                // --- Módulo: Búsqueda y Filtrado | Función: Filtrado Dinámico de Proveedores ---
                // Extraemos dinámicamente las categorías únicas presentes en nuestra lista de proveedores
                const categoriasUnicas = [...new Set(proveedores.map(p => p.categoria))];

                // Filtramos la lista basándonos en el texto de búsqueda y la categoría seleccionada
                const proveedoresFiltrados = proveedores.filter(p => {
                    const text = searchTermDirectorio.toLowerCase();
                    const matchesSearch = 
                        p.nombre_empresa.toLowerCase().includes(text) || 
                        p.rnc_cedula.toLowerCase().includes(text) || 
                        p.correo.toLowerCase().includes(text);
                    
                    const matchesCategory = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
                    
                    return matchesSearch && matchesCategory;
                });

                return (
                <>
                    <div className="filtros-proveedores" style={{justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        <div style={{display: 'flex', gap: '15px', flex: 1}}>
                            <div className="filtro-grupo" style={{flex: 2}}>
                                <label style={{fontSize: '12px', color: '#64748b'}}>Buscar suplidor (Nombre, RNC, Correo):</label>
                                <input 
                                    type="text" 
                                    placeholder="Escribe para buscar..." 
                                    value={searchTermDirectorio}
                                    onChange={(e) => setSearchTermDirectorio(e.target.value)}
                                    style={{width: '100%'}}
                                />
                            </div>
                            <div className="filtro-grupo" style={{flex: 1}}>
                                <label style={{fontSize: '12px', color: '#64748b'}}>Filtrar por Categoría:</label>
                                <select 
                                    value={filtroCategoria} 
                                    onChange={(e) => setFiltroCategoria(e.target.value)}
                                    style={{width: '100%'}}
                                >
                                    <option value="Todas">Todas las categorías</option>
                                    {categoriasUnicas.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="btn-save" onClick={() => openModal('nuevo_proveedor', null)} style={{whiteSpace: 'nowrap'}}>
                            <FiUserPlus style={{marginRight: '8px'}} /> Registrar Nuevo Suplidor
                        </button>
                    </div>
                    <div className="tabla-proveedores-container">
                        <table className="tabla-proveedores">
                            <thead>
                                <tr><th>Empresa</th><th>RNC/Cédula</th><th>Categoría</th><th>Contacto</th><th>Correo</th><th>Estado</th><th style={{textAlign: 'center'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {proveedoresFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                                            No se encontraron proveedores que coincidan con tu búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    proveedoresFiltrados.map(p => (
                                        <tr key={p.id_proveedor} style={{ opacity: p.estado === 'Inactivo' ? 0.6 : 1 }}>
                                            <td><strong>{p.nombre_empresa}</strong></td>
                                        <td>{p.rnc_cedula}</td>
                                        <td>{p.categoria}</td>
                                        <td>{p.persona_contacto}<br/><small>{p.telefono}</small></td>
                                        <td>{p.correo}</td>
                                        <td><span className={`badge ${p.estado === 'Activo' ? 'enviado' : 'rechazado'}`}>{p.estado}</span></td>
                                        <td style={{textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                            <button 
                                                onClick={() => openModal('editar_proveedor', p)}
                                                style={{background: 'transparent', color: '#1e40af', border: 'none', cursor: 'pointer', fontSize: '18px'}}
                                                title="Editar Suplidor"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleEstado(p)}
                                                style={{background: 'transparent', color: p.estado === 'Activo' ? '#dc2626' : '#16a34a', border: 'none', cursor: 'pointer', fontSize: '18px'}}
                                                title={p.estado === 'Activo' ? "Desactivar Suplidor" : "Activar Suplidor"}
                                            >
                                                <FiPower />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </>
            )})()}

            {/* TAB: LICITACIONES IA Y FACTURAS B2B */}
            {activeTab === 'ia' && (
                <div style={{padding: '20px', background: 'white', borderRadius: '8px'}}>
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <FiCpu size={50} color="#3498db" style={{marginBottom: '10px'}}/>
                        <h3>Licitaciones Adjudicadas (Evaluación IA)</h3>
                        <p>Aquí se muestran las licitaciones que la Inteligencia Artificial ya evaluó y adjudicó. Como Encargado de Compras, puedes subir la factura saldada para poder finalizar el evento logísticamente.</p>
                    </div>

                    <div className="tabla-proveedores-container">
                        <table className="tabla-proveedores">
                            <thead>
                                <tr>
                                    <th>Evento (Req.)</th>
                                    <th>Proveedor Ganador</th>
                                    <th>Monto Total</th>
                                    <th>Estado Pago</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                        <tbody>
                            {licitacionesAdjudicadas.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No hay licitaciones adjudicadas aún.</td></tr>
                            ) : licitacionesAdjudicadas.map(lic => (
                                <tr key={lic.id_analisis}>
                                    <td>
                                        <strong>{lic.nombre_evento}</strong><br/>
                                        <small className="text-muted">{lic.requisitos}</small>
                                    </td>
                                    <td>{lic.proveedor_nombre}</td>
                                    <td>{lic.monto_total_detectado ? `$${Number(lic.monto_total_detectado).toLocaleString()}` : '—'}</td>
                                    <td>
                                        <span className={`status ${lic.estado_pago === 'Pagado' ? 'approved' : 'pending'}`}>
                                            {lic.estado_pago || 'Pendiente'}
                                        </span>
                                    </td>
                                    <td>
                                        {lic.estado_pago !== 'Pagado' ? (
                                            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                                <input type="file" accept="application/pdf" onChange={e => setFileFactura(e.target.files[0])} style={{width: '150px'}} />
                                                <button 
                                                    className="btn-primary" 
                                                    style={{padding: '5px 10px', fontSize: '12px'}}
                                                    onClick={async () => {
                                                        if (!fileFactura) return alert("Seleccione un PDF de factura");
                                                        const formData = new FormData();
                                                        formData.append('archivo_factura', fileFactura);
                                                        try {
                                                            const res = await fetch(`${API}/admin/factura-proveedor/${lic.id_cotizacion}`, {
                                                                method: 'POST',
                                                                headers: { 'x-usuario-id': usuario?.id_usuario || '' },
                                                                body: formData
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
                                                    Subir Factura
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{color: '#2ecc71'}}><strong>✓ Pagado</strong></span>
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
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '600px'}}>
                        <h3 className="modal-title">{modalConfig.type === 'editar_proveedor' ? 'Editar Proveedor' : 'Registrar Proveedor (Acceso B2B)'}</h3>
                        {modalConfig.type === 'nuevo_proveedor' && (
                            <p style={{fontSize: '12px', color: '#666', marginBottom: '15px'}}>Se enviarán las credenciales al correo del proveedor automáticamente.</p>
                        )}
                        <form onSubmit={handleGuardarProveedor}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div className="form-group"><label>Nombre de Empresa</label><input required value={formData.nombre_empresa} onChange={e=>setFormData({...formData, nombre_empresa: e.target.value})}/></div>
                                <div className="form-group"><label>RNC / Cédula</label><input required value={formData.rnc_cedula} onChange={e=>setFormData({...formData, rnc_cedula: e.target.value})}/></div>
                                <div className="form-group">
                                    <label>Categoría (Tipo de Servicio)</label>
                                    <select required value={formData.id_tipo_servicio} onChange={e=>setFormData({...formData, id_tipo_servicio: e.target.value})}>
                                        <option value="">-- Selecciona una categoría --</option>
                                        {categoriasActivas.map(cat => (
                                            <option key={cat.id_tipo_servicio} value={cat.id_tipo_servicio}>{cat.nombre} ({cat.clasificacion})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group"><label>Persona de Contacto</label><input required value={formData.persona_contacto} onChange={e=>setFormData({...formData, persona_contacto: e.target.value})}/></div>
                                <div className="form-group"><label>Correo Electrónico</label><input required type="email" value={formData.correo} onChange={e=>setFormData({...formData, correo: e.target.value})}/></div>
                                <div className="form-group"><label>Teléfono</label><input required value={formData.telefono} onChange={e=>setFormData({...formData, telefono: e.target.value})}/></div>
                                
                                {modalConfig.type === 'nuevo_proveedor' && (
                                    <div className="form-group"><label>Contraseña B2B</label><input required type="password" value={formData.contrasena} onChange={e=>setFormData({...formData, contrasena: e.target.value})}/></div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalConfig({open:false})}>Cancelar</button>
                                <button type="submit" className="btn-save">{modalConfig.type === 'editar_proveedor' ? 'Guardar Cambios' : 'Registrar Suplidor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModuloProveedores;
