// ============================================================
// MÓDULO DE BITÁCORA DE MOVIMIENTOS (AUDITORÍA)
// Pertenece a: Módulo de Seguridad y Auditoría del Sistema
// Propósito: Mostrar el historial detallado de todas las acciones
// y operaciones realizadas por los usuarios (cambios de estado, login,
// eliminaciones). Permite filtrar por ID, usuario, acción y fecha.
// ============================================================

import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiUser, FiActivity, FiFileText, FiClock } from 'react-icons/fi';
import { useSortableData } from '../hooks/useSortableData';
import './../css/Dashboard.css'; // Reutilizamos estilos base
import './../css/Bitacora.css';

const API = 'http://localhost:8080';

// ============================================================
// COMPONENTE: Bitacora
// ============================================================
export default function Bitacora() {
    // --- ESTADOS DEL COMPONENTE ---
    const [registros, setRegistros] = useState([]);       // Historial completo
    const [loading, setLoading] = useState(true);         // Indicador de carga
    const [error, setError] = useState('');               // Mensaje de error
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Estados para los filtros de búsqueda
    const [searchQuery, setSearchQuery] = useState('');   // Texto libre
    const [filtroAccion, setFiltroAccion] = useState('Todas'); // Dropdown de acción
    const [rangoFecha, setRangoFecha] = useState('todos');     // Dropdown de tiempo
    const [accionesUnicas, setAccionesUnicas] = useState([]);  // Listado dinámico de acciones

    // --- EFECTO: Carga inicial ---
    useEffect(() => {
        cargarBitacora();
    }, []);

    // --- FUNCIÓN: cargarBitacora ---
    // Extrae los datos desde el backend y puebla las categorías únicas de acción
    const cargarBitacora = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/bitacora`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRegistros(data);
                // Extraer acciones únicas para el Select
                const acciones = [...new Set(data.map(item => item.accion))];
                setAccionesUnicas(acciones);
            } else {
                setError('Error en el formato de respuesta');
            }
        } catch (err) {
            setError('No se pudo conectar al servidor de bitácora.');
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIÓN: formatearFecha ---
    // Convierte el timestamp de BD a formato local "DD/MMM/YYYY HH:MM"
    const formatearFecha = (fechaDb) => {
        if (!fechaDb) return '—';
        const date = new Date(fechaDb);
        return date.toLocaleString('es-DO', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // --- LÓGICA DE FILTRADO ---
    // Filtra la data original según texto, tipo de acción y ventana de tiempo
    const registrosFiltrados = registros.filter(reg => {
        const queryNormalizada = searchQuery.toLowerCase();
        
        // Match Búsqueda (ID de registro, ID Usuario, o Nombre de Usuario)
        const matchSearch = 
            reg.id_bitacora.toString().includes(queryNormalizada) ||
            (reg.id_usuario && reg.id_usuario.toString().includes(queryNormalizada)) ||
            (reg.nombre_usuario && reg.nombre_usuario.toLowerCase().includes(queryNormalizada)) ||
            (reg.detalles && reg.detalles.toLowerCase().includes(queryNormalizada));

        // Match Acción (Select)
        const matchAccion = filtroAccion === 'Todas' || reg.accion === filtroAccion;

        let matchFecha = true;
        if (rangoFecha !== 'todos' && reg.fecha) {
            const fechaReg = new Date(reg.fecha);
            const hoy = new Date();
            
            if (rangoFecha === 'hoy') {
                matchFecha = fechaReg.toDateString() === hoy.toDateString();
            } else if (rangoFecha === 'semana') {
                const hace7dias = new Date();
                hace7dias.setDate(hoy.getDate() - 7);
                matchFecha = fechaReg >= hace7dias;
            } else if (rangoFecha === 'mes') {
                const hace30dias = new Date();
                hace30dias.setDate(hoy.getDate() - 30);
                matchFecha = fechaReg >= hace30dias;
            } else if (rangoFecha === 'este_año') {
                matchFecha = fechaReg.getFullYear() === hoy.getFullYear();
            } else if (rangoFecha === 'año_pasado') {
                matchFecha = fechaReg.getFullYear() === hoy.getFullYear() - 1;
            }
        }

        return matchSearch && matchAccion && matchFecha;
    });

    // --- LÓGICA DE PAGINACIÓN Y ORDENAMIENTO ---
    const sortedRegistros = [...registrosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalPages = Math.ceil(sortedRegistros.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedRegistros.slice(indexOfFirstItem, indexOfLastItem);

    // Resetear a pág 1 si los filtros cambian
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filtroAccion, rangoFecha]);

    return (
        <div className="bitacora-container">
            <div className="section-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '8px' }}>Bitácora de Movimientos</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Consulta el historial de auditoría y acciones realizadas en la plataforma.</p>
                </div>
            </div>

            <div className="bitacora-filters-bar">
                <div className="filter-group">
                    <FiSearch className="filter-icon" />
                    <input 
                        type="text" 
                        placeholder="Buscar por ID, Usuario o detalles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bitacora-search-input"
                    />
                </div>
                <div className="filter-group">
                    <FiFilter className="filter-icon" />
                    <select 
                        value={filtroAccion} 
                        onChange={(e) => setFiltroAccion(e.target.value)}
                        className="bitacora-select"
                    >
                        <option value="Todas">Todas las Acciones</option>
                        {accionesUnicas.map(acc => (
                            <option key={acc} value={acc}>{acc.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <FiClock className="filter-icon" />
                    <select 
                        value={rangoFecha} 
                        onChange={(e) => setRangoFecha(e.target.value)}
                        className="bitacora-select"
                    >
                        <option value="todos">Cualquier fecha</option>
                        <option value="hoy">Hoy</option>
                        <option value="semana">Últimos 7 días</option>
                        <option value="mes">Últimos 30 días</option>
                        <option value="este_año">Este Año</option>
                        <option value="año_pasado">Año Pasado</option>
                    </select>
                </div>
            </div>

            <div className="table-container bitacora-table-wrapper">
                {loading ? (
                    <div className="loading-state">Cargando registros de auditoría...</div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : (
                    <table className="requests-table bitacora-table">
                        <thead>
                            <tr>
                                <th>FECHA Y HORA</th>
                                <th>ACCIÓN Y DETALLE</th>
                                <th>USUARIO AUTOR</th>
                                <th>ROL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(reg => (
                                <tr key={reg.id_bitacora}>
                                    <td style={{ whiteSpace: 'nowrap', color: '#475569', fontSize: '0.9rem' }}>
                                        {formatearFecha(reg.fecha)}
                                    </td>
                                    <td>
                                        <div className="accion-badge">
                                            <FiActivity style={{ marginRight: '6px' }}/>
                                            {reg.accion} &nbsp; <span style={{ color: '#94a3b8', fontSize: '11px' }}>#{reg.id_bitacora}</span>
                                        </div>
                                        <div className="accion-detalles">
                                            {reg.detalles}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="usuario-info-cell">
                                            <FiUser className="user-icon-small" />
                                            <span>{reg.nombre_usuario || 'Sistema / Eliminado'}</span>
                                        </div>
                                        {reg.id_usuario && <span className="text-muted" style={{ fontSize: '11px' }}>ID: {reg.id_usuario}</span>}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '500' }}>
                                            {reg.rol_usuario || 'Desconocido'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {registrosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        No se encontraron movimientos que coincidan con tus filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {registrosFiltrados.length > 0 && (
                <div className="pagination-container">
                    <div className="pagination-info">
                        Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, registrosFiltrados.length)} de {registrosFiltrados.length} movimientos
                    </div>
                    <div className="pagination-controls">
                        <button 
                            type="button"
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
                            type="button"
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
    );
}
