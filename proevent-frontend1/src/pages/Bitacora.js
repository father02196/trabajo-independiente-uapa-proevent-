// ============================================================
// MÓDULO DE BITÁCORA DE MOVIMIENTOS (AUDITORÍA FASE 4)
// Paginación y Filtrado 100% en el Backend
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { FiFilter, FiUser, FiActivity, FiFileText, FiClock, FiRefreshCw, FiDownload, FiEye, FiX } from 'react-icons/fi';
import './../css/Dashboard.css';
import './../css/Bitacora.css';

const API = 'http://localhost:8080';

export default function Bitacora() {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalData, setModalData] = useState(null);


    // Estado de Paginación del Backend
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

    // Filtros
    const [filters, setFilters] = useState({
        accion: '',
        modulo: '',
        tipo_actor: '',
        fecha_inicio: '',
        fecha_fin: '',
        request_id: ''
    });

    const [accionesUnicas] = useState([

        'ACTUALIZACION_AUDIOVISUAL', 'ACTUALIZACION_AUDIOVISUAL_GLOBAL',
        'ACTUALIZACION_CATALOGO', 'ACTUALIZACION_EVENTO', 'ACTUALIZACION_POA', 'ACTUALIZACION_PROVEEDOR',
        'ACTUALIZACION_SERVICIO_EXTERNO', 'ACTUALIZACION_TAREA_CRONOGRAMA',
        'ACTUALIZAR_OC_SERVICIO', 'ALERTA_POA_20', 'APROBAR_PRESUPUESTO', 'ASIGNACION_ORGANIZADOR',
        'AUTO_FINALIZACION_EVENTO', 'CAMBIO_ESTADO_PROVEEDOR',
        'CAMBIO_ESTADO_USUARIO', 'CIERRE_EXPEDIENTE', 'CREACION_AUDIOVISUAL', 'CREACION_CATALOGO',
        'CREACION_EVENTO', 'CREACION_POA', 'CREACION_TAREA_CRONOGRAMA', 'CREACION_USUARIO', 'DASHBOARD_VISUALIZADO',
        'DICTAMEN_LEGAL', 'DICTAMEN_LEGAL_ACTUALIZADO',
        'DOCUMENTO_ARCHIVADO', 'EDICION_EVENTO', 'ELIMINACION_CATALOGO', 'ELIMINACION_EVENTO',
        'ELIMINACION_EVIDENCIA_CONTABLE', 'ELIMINACION_SERVICIO_EXTERNO',
        'ELIMINACION_TAREA_CRONOGRAMA', 'ELIMINACION_USUARIO',
        'ENVIO_ORDEN_PROVEEDOR', 'LOGIN_EXITOSO',
        'LOGIN_FALLIDO', 'LOGIN_GOOGLE', 'OBSERVACION_PRESUPUESTO', 'PAGO_FACTURA_B2B',
        'PAGO_SERVICIO', 'RECEPCION_SERVICIO',
        'REMOCION_ORGANIZADOR', 'RESOLUCION_INCIDENCIA_LOGISTICA',
        'RESOLUCION_LEGAL', 'SOLICITUD_SERVICIO_EXTERNO',
        'SUBIDA_DOCUMENTO_BOVEDA', 'SUBIDA_EVIDENCIA_CONTABLE'

    ]);

    const cargarBitacora = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            });

            const res = await fetch(`${API}/bitacora?${queryParams}`, { credentials: 'include' });
            if (!res.ok) {
                if (res.status === 403 || res.status === 401) throw new Error('Acceso denegado: Se requiere rol de Administrador.');
                throw new Error('Error al cargar la bitácora.');
            }

            const data = await res.json();

            if (data.data) {
                const normalizedData = data.data.map(item => {
                    let parsedDetalles = item.detalles;
                    try { parsedDetalles = JSON.parse(item.detalles); } catch (e) { }
                    return { ...item, detallesObj: parsedDetalles };
                });
                setRegistros(normalizedData);
                setPagination(data.pagination);
            } else {
                setError('Respuesta inválida del servidor');
            }
        } catch (err) {
            setError(err.message || 'No se pudo conectar al servidor.');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        cargarBitacora(pagination.page);
    }, [cargarBitacora, pagination.page]);

    const formatearFecha = (fechaDb) => {
        if (!fechaDb) return '—';
        const date = new Date(fechaDb);
        return date.toLocaleString('es-DO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const aplicarFiltros = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        cargarBitacora(1);
    };

    const limpiarFiltros = () => {
        setFilters({ accion: '', modulo: '', tipo_actor: '', fecha_inicio: '', fecha_fin: '', request_id: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
        setTimeout(() => cargarBitacora(1), 0);
    };

    const descargarCSV = () => {
        const queryParams = new URLSearchParams({
            export_format: 'csv',
            ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
        });
        window.open(`${API}/bitacora?${queryParams}`, '_blank');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title"><FiActivity className="icon-title" /> Auditoría Corporativa</h1>
                    <p className="dashboard-subtitle">Control y trazabilidad de eventos transaccionales</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={descargarCSV} className="btn-secondary" style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }} title="Exportar CSV">
                        <FiDownload style={{ marginRight: '5px' }} /> CSV
                    </button>
                    <button onClick={() => cargarBitacora(pagination.page)} className="btn-primary" style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} title="Recargar bitácora">
                        <FiRefreshCw className={loading ? 'spin-animation' : ''} style={{ marginRight: '5px' }} /> Actualizar
                    </button>
                </div>
            </header>

            <div className="table-container" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>

                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            <FiFilter /> Acción
                        </label>
                        <select name="accion" value={filters.accion} onChange={handleFilterChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            <option value="">Todas las acciones</option>
                            {accionesUnicas.map((acc, idx) => (
                                <option key={idx} value={acc}>{acc}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            <FiUser /> Actor
                        </label>
                        <select name="tipo_actor" value={filters.tipo_actor} onChange={handleFilterChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            <option value="">Todos</option>
                            <option value="INTERNO">Interno</option>
                            <option value="PROVEEDOR">Proveedor</option>
                            <option value="SISTEMA">Sistema</option>
                            <option value="ANONIMO">Anónimo</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            <FiFileText /> Request ID
                        </label>
                        <input type="text" name="request_id" value={filters.request_id} onChange={handleFilterChange} placeholder="UUID..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            <FiClock /> Desde
                        </label>
                        <input type="date" name="fecha_inicio" value={filters.fecha_inicio} onChange={handleFilterChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                            <FiClock /> Hasta
                        </label>
                        <input type="date" name="fecha_fin" value={filters.fecha_fin} onChange={handleFilterChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={limpiarFiltros} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}>Limpiar</button>
                    <button onClick={aplicarFiltros} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff' }}>Buscar</button>
                </div>
            </div>

            <div className="table-container">
                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem' }}>
                        <strong>Error: </strong> {error}
                    </div>
                )}

                <table className="requests-table bitacora-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>FECHA Y HORA</th>
                            <th>ACTOR</th>
                            <th>ACCIÓN / MÓDULO</th>
                            <th>DETALLES (JSON)</th>
                            <th>REQUEST ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    <FiRefreshCw className="spin-animation" style={{ marginRight: '0.5rem' }} /> Cargando registros...
                                </td>
                            </tr>
                        ) : registros.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No se encontraron movimientos.
                                </td>
                            </tr>
                        ) : (
                            registros.map((reg) => (
                                <tr key={reg.id_bitacora}>
                                    <td style={{ color: '#94a3b8' }}>#{reg.id_bitacora}</td>
                                    <td style={{ whiteSpace: 'nowrap', color: '#475569', fontSize: '0.9rem' }}>
                                        {formatearFecha(reg.fecha)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                                {reg.tipo_actor || 'ANONIMO'}
                                            </span>
                                            <small style={{ color: '#64748b' }}>
                                                {reg.nombre_usuario || reg.nombre_proveedor || 'N/A'}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="accion-badge">
                                            {reg.accion}
                                        </div>
                                        {reg.modulo && <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>Módulo: {reg.modulo}</small>}
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        {typeof reg.detallesObj === 'object' && reg.detallesObj !== null ? (
                                            <div>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                                    {Object.keys(reg.detallesObj).length} campos registrados
                                                </span>
                                                <button 
                                                    className="bitacora-btn-ver-detalles" 
                                                    onClick={() => setModalData(reg)}
                                                >
                                                    <FiEye /> Ver Detalles
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {String(reg.detalles || '—')}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <small style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                            {reg.request_id ? reg.request_id.split('-')[0] + '...' : '—'}
                                        </small>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!loading && pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Mostrando página <strong>{pagination.page}</strong> de {pagination.totalPages} (Total: {pagination.total})
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: pagination.page === 1 ? '#f1f5f9' : '#fff', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', color: pagination.page === 1 ? '#94a3b8' : '#334155' }}
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                Anterior
                            </button>
                            <button
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: pagination.page === pagination.totalPages ? '#f1f5f9' : '#fff', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer', color: pagination.page === pagination.totalPages ? '#94a3b8' : '#334155' }}
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DETALLES JSON */}
            {modalData && (
                <div className="bitacora-modal-overlay" onClick={() => setModalData(null)}>
                    <div className="bitacora-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="bitacora-modal-header">
                            <h3><FiFileText /> Detalles del Registro #{modalData.id_bitacora}</h3>
                            <button className="bitacora-modal-close" onClick={() => setModalData(null)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="bitacora-modal-body">
                            <pre className="bitacora-json-pre">
                                {JSON.stringify(modalData.detallesObj, null, 4)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
