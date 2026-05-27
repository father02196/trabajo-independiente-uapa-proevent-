import React, { useState, useEffect } from 'react';
import { FiSend, FiCheckSquare, FiDollarSign, FiUserPlus, FiFileText, FiCpu } from 'react-icons/fi';
import './../css/ModuloProveedores.css';

function ModuloProveedores({ usuario }) {
    const [activeTab, setActiveTab] = useState('logistica');
    const [servicios, setServicios] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [filtroEstadoRecepcion, setFiltroEstadoRecepcion] = useState('Todos');
    const [filtroEstadoPago, setFiltroEstadoPago] = useState('Todos');
    
    // Estados para Modales
    const [modalConfig, setModalConfig] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (activeTab === 'logistica') fetchServicios();
        if (activeTab === 'directorio') fetchProveedores();
    }, [activeTab]);

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

    // --- DIRECTORIO DE PROVEEDORES ---
    const handleCrearProveedor = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8080/api/admin/proveedor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Proveedor creado y correo de acceso enviado.');
                setModalConfig({ open: false, type: null, data: null });
                fetchProveedores();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    const openModal = (type, data) => {
        setModalConfig({ open: true, type, data });
        if (type === 'nuevo_proveedor') setFormData({ nombre_empresa: '', rnc_cedula: '', id_tipo_servicio: '1', persona_contacto: '', correo: '', telefono: '', contrasena: '' });
    };

    return (
        <div className="proveedores-container">
            <div className="proveedores-header">
                <h1 className="proveedores-title">Módulo de Proveedores y Licitaciones</h1>
                
                <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                    <button className={`btn-tab ${activeTab === 'logistica' ? 'active' : ''}`} onClick={() => setActiveTab('logistica')} style={tabStyle(activeTab === 'logistica')}>Logística Operativa</button>
                    <button className={`btn-tab ${activeTab === 'directorio' ? 'active' : ''}`} onClick={() => setActiveTab('directorio')} style={tabStyle(activeTab === 'directorio')}>Directorio de Suplidores</button>
                    <button className={`btn-tab ${activeTab === 'ia' ? 'active' : ''}`} onClick={() => setActiveTab('ia')} style={tabStyle(activeTab === 'ia')}>Licitaciones (IA)</button>
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
            {activeTab === 'directorio' && (
                <>
                    <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'flex-end'}}>
                        <button className="btn-save" onClick={() => openModal('nuevo_proveedor', null)}><FiUserPlus /> Registrar Nuevo Suplidor</button>
                    </div>
                    <div className="tabla-proveedores-container">
                        <table className="tabla-proveedores">
                            <thead>
                                <tr><th>Empresa</th><th>RNC/Cédula</th><th>Categoría</th><th>Contacto</th><th>Correo</th><th>Estado</th></tr>
                            </thead>
                            <tbody>
                                {proveedores.map(p => (
                                    <tr key={p.id_proveedor}>
                                        <td><strong>{p.nombre_empresa}</strong></td>
                                        <td>{p.rnc_cedula}</td>
                                        <td>{p.categoria}</td>
                                        <td>{p.persona_contacto}<br/><small>{p.telefono}</small></td>
                                        <td>{p.correo}</td>
                                        <td><span className="badge enviado">{p.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: LICITACIONES IA */}
            {activeTab === 'ia' && (
                <div style={{padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center'}}>
                    <FiCpu size={50} color="#3498db" style={{marginBottom: '10px'}}/>
                    <h3>Motor de Inteligencia Artificial (GPT-4o-mini)</h3>
                    <p>Las licitaciones se envían automáticamente al crear un evento. Pronto verá aquí el análisis comparativo automático de las ofertas subidas por los proveedores.</p>
                </div>
            )}

            {/* MODALES */}
            {modalConfig.open && modalConfig.type === 'nuevo_proveedor' && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '600px'}}>
                        <h3 className="modal-title">Registrar Proveedor (Acceso B2B)</h3>
                        <p style={{fontSize: '12px', color: '#666', marginBottom: '15px'}}>Se enviarán las credenciales al correo del proveedor automáticamente.</p>
                        <form onSubmit={handleCrearProveedor}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div className="form-group"><label>Nombre de Empresa</label><input required value={formData.nombre_empresa} onChange={e=>setFormData({...formData, nombre_empresa: e.target.value})}/></div>
                                <div className="form-group"><label>RNC / Cédula</label><input required value={formData.rnc_cedula} onChange={e=>setFormData({...formData, rnc_cedula: e.target.value})}/></div>
                                <div className="form-group">
                                    <label>Categoría (Tipo de Servicio)</label>
                                    <select value={formData.id_tipo_servicio} onChange={e=>setFormData({...formData, id_tipo_servicio: e.target.value})}>
                                        <option value="1">Audiovisual (Corriente)</option>
                                        <option value="2">Catering (Especializado)</option>
                                        <option value="3">Sonido e Iluminación</option>
                                        <option value="4">Transporte</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Persona de Contacto</label><input required value={formData.persona_contacto} onChange={e=>setFormData({...formData, persona_contacto: e.target.value})}/></div>
                                <div className="form-group"><label>Correo Electrónico</label><input required type="email" value={formData.correo} onChange={e=>setFormData({...formData, correo: e.target.value})}/></div>
                                <div className="form-group"><label>Teléfono</label><input required value={formData.telefono} onChange={e=>setFormData({...formData, telefono: e.target.value})}/></div>
                                <div className="form-group"><label>Contraseña B2B</label><input required type="password" value={formData.contrasena} onChange={e=>setFormData({...formData, contrasena: e.target.value})}/></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setModalConfig({open:false})}>Cancelar</button>
                                <button type="submit" className="btn-save">Registrar Suplidor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const tabStyle = (isActive) => ({
    padding: '10px 20px', 
    border: 'none', 
    background: isActive ? '#3498db' : '#ecf0f1', 
    color: isActive ? 'white' : '#7f8c8d', 
    borderRadius: '4px', 
    cursor: 'pointer',
    fontWeight: 'bold'
});

export default ModuloProveedores;
