// ============================================================
// MÓDULO GESTIÓN SOLICITUDES AV (Versión Aislada)
// Pertenece a: Módulo Operativo / Audiovisual
// Propósito: Interfaz dedicada exclusiva para administradores
// de audiovisual donde pueden ver las reservas pendientes
// y actualizar sus estados. Reutiliza la lógica de agrupación
// vista en la sección inferior de Audiovisual.js.
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiMonitor, FiFileText, FiCheckCircle, FiRefreshCw, FiFilter, FiSearch, FiUser, FiChevronDown } from "react-icons/fi";
import { toast } from "react-hot-toast";

// --- COMPONENTE SELECTOR DE ESTADOS (Muestra todos, bloquea los inválidos) ---
const CustomBadgeDropdown = ({ currentStatus, onChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Todos los estados del sistema con sus colores
  const ESTADOS = [
    { key: "Pendiente",   bg: "#fefce8", text: "#854d0e", border: "#fde047", dot: "#eab308" },
    { key: "En revisión", bg: "#dbeafe", text: "#1e3a8a", border: "#93c5fd", dot: "#3b82f6" },
    { key: "Aprobado",    bg: "#dcfce7", text: "#166534", border: "#86efac", dot: "#22c55e" },
    { key: "Completado",  bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", dot: "#16a34a" },
    { key: "Rechazado",   bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
  ];

  // Transiciones permitidas por estado actual
  const TRANSICIONES = {
    "Pendiente":   ["En revisión", "Rechazado"],
    "En revisión": ["Aprobado", "Rechazado"],
    "Aprobado":    ["Completado", "Rechazado"],
    "Completado":  [],
    "Rechazado":   ["En revisión"], // Reabrir
  };

  const permitidas = TRANSICIONES[currentStatus] || [];
  const esTerminal = permitidas.length === 0;
  const confActual = ESTADOS.find(e => e.key === currentStatus) || ESTADOS[0];

  const handleSelect = async (st) => {
    setIsOpen(false);
    if (!permitidas.includes(st)) return;
    setIsUpdating(true);
    try { await onChange(st); }
    finally { setIsUpdating(false); }
  };

  // Estado terminal o readOnly: solo badge estático
  if (esTerminal || props.readOnly) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
        backgroundColor: confActual.bg, color: confActual.text,
        border: `1px solid ${confActual.border}`, userSelect: 'none'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: confActual.dot, display: 'inline-block' }} />
        {currentStatus}
      </span>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botón principal — muestra el estado actual */}
      <button
        type="button"
        onClick={() => !isUpdating && setIsOpen(!isOpen)}
        disabled={isUpdating}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
          backgroundColor: confActual.bg, color: confActual.text,
          border: `1px solid ${confActual.border}`, borderRadius: '6px',
          fontSize: '12px', fontWeight: '600', cursor: isUpdating ? 'wait' : 'pointer',
          transition: 'all 0.2s', minWidth: '130px', justifyContent: 'space-between',
          opacity: isUpdating ? 0.6 : 1,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: confActual.dot, flexShrink: 0, display: 'inline-block' }} />
          {isUpdating ? 'Guardando...' : currentStatus}
        </span>
        <FiChevronDown size={13} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {/* Panel con TODOS los estados */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 1000,
          backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)', minWidth: '190px',
          padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px',
        }}>
          <div style={{ padding: '4px 8px 6px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9', marginBottom: '2px' }}>
            Cambiar estado
          </div>
          {ESTADOS.map(({ key, bg, text, border, dot }) => {
            const esCurrent  = key === currentStatus;
            const esValida   = permitidas.includes(key);
            const deshabilitada = !esValida && !esCurrent;

            return (
              <div
                key={key}
                onClick={() => !deshabilitada && !esCurrent && handleSelect(key)}
                title={deshabilitada ? `No se puede pasar de "${currentStatus}" a "${key}" directamente` : ''}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                  cursor: deshabilitada || esCurrent ? 'not-allowed' : 'pointer',
                  backgroundColor: deshabilitada ? '#f8fafc' : bg,
                  color: deshabilitada ? '#cbd5e1' : text,
                  border: `1px solid ${deshabilitada ? '#e2e8f0' : border}`,
                  opacity: deshabilitada ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { if (!deshabilitada && !esCurrent) e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={(e) => { if (!deshabilitada && !esCurrent) e.currentTarget.style.opacity = '1'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: deshabilitada ? '#cbd5e1' : dot, display: 'inline-block', flexShrink: 0 }} />
                  {key}
                </span>
                {esCurrent && (
                  <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: text, color: '#fff', borderRadius: '4px', padding: '1px 6px' }}>
                    Actual
                  </span>
                )}
                {deshabilitada && (
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>🔒</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Hooks y componentes para tablas
// (Ordenamiento por columna removido por petición del usuario)

// URL API Backend
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: GestionSolicitudesAV
// Recibe: usuario (Object con rol y token)
// ============================================================
export default function GestionSolicitudesAV({ usuario }) {
  // --- ESTADOS ---
  const [solicitudesAV, setSolicitudesAV] = useState([]); // Lista agrupada
  const [currentPage, setCurrentPage] = useState(1);      // Paginación
  const itemsPerPage = 10;

  const [selectedRequest, setSelectedRequest] = useState(null); // Detalle del modal
  const [isModalOpen, setIsModalOpen] = useState(false);        // Visibilidad modal

  // --- FILTROS Y ORDENAMIENTO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroSolicitante, setFiltroSolicitante] = useState("Todos");
  const [sortDirection, setSortDirection] = useState("descending"); // descending = Más recientes, ascending = Más antiguos
  const [isLoadingReload, setIsLoadingReload] = useState(false); // Estado de carga para recargar

  // --- FUNCIÓN: cargarSolicitudesAV ---
  const cargarSolicitudesAV = async () => {
    try {
      const res = await fetch(`${API}/audiovisual?t=${new Date().getTime()}`, { headers: { 'Cache-Control': 'no-cache' } });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Prioridad de estado del grupo: Pendiente > En revisión > Aprobado > Completado > Rechazado
        // Si cualquier equipo está en Pendiente, el grupo completo aparece como Pendiente
        const prioridad = { 'Pendiente': 1, 'En revisión': 2, 'Aprobado': 3, 'Completado': 4, 'Rechazado': 5 };
        const agrupadas = Object.values(data.reduce((acc, req) => {
          if (!acc[req.id_evento]) {
            acc[req.id_evento] = {
              id_evento: req.id_evento,
              nombre_evento: req.nombre_evento,
              fecha_evento: req.fecha_evento,
              nombre_usuario: req.nombre_usuario || "—",
              estado_av: req.estado_av || 'Pendiente',
              equipos: [],
              total_equipos: 0
            };
          } else {
            // El estado del grupo es el de menor prioridad (más pendiente) entre todos sus equipos
            const estadoActualGrupo = acc[req.id_evento].estado_av;
            const prioActual = prioridad[estadoActualGrupo] || 99;
            const prioNuevo  = prioridad[req.estado_av]   || 99;
            if (prioNuevo < prioActual) {
              acc[req.id_evento].estado_av = req.estado_av || 'Pendiente';
            }
          }
          acc[req.id_evento].equipos.push({
            id_servicio: req.id_servicio,
            equipo: req.equipo,
            cantidad: req.cantidad,
            ubicacion: req.ubicacion,
            observaciones: req.observaciones,
            estado_av: req.estado_av
          });
          acc[req.id_evento].total_equipos += 1;
          return acc;
        }, {}));
        setSolicitudesAV(agrupadas);
      } else {
        setSolicitudesAV([]);
      }
    } catch (err) {
      console.error("Error cargando solicitudes audiovisuales:", err);
      throw err;
    }
  };

  // --- EFECTO INICIAL ---
  useEffect(() => {
    cargarSolicitudesAV().catch(()=>{});
  }, [usuario]);

  // --- FUNCIÓN: handleRecargar ---
  const handleRecargar = async () => {
    setIsLoadingReload(true);
    setSearchTerm("");
    setFiltroEstado("Todos");
    setFiltroSolicitante("Todos");
    setSortDirection("descending");
    setCurrentPage(1);
    try {
      await cargarSolicitudesAV();
      toast.success("Datos actualizados y filtros limpiados");
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsLoadingReload(false);
    }
  };

  // --- FUNCIÓN: handleCambiarEstado (Sincronización DB) ---
  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    const solicitud = solicitudesAV.find(s => s.id_evento === id_evento);
    const estadoActual = solicitud ? solicitud.estado_av : "Pendiente";

    // Validaciones de flujo estricto por si acaso (el componente visual ya lo restringe)
    if (nuevoEstado !== "Rechazado") {
      if (estadoActual === "Pendiente" && nuevoEstado !== "En revisión") {
        toast.error(`Transición inválida. De "Pendiente" solo puede pasar a "En revisión".`);
        return;
      }
      if (estadoActual === "En revisión" && nuevoEstado !== "Aprobado") {
        toast.error(`Transición inválida. De "En revisión" solo puede pasar a "Aprobado".`);
        return;
      }
      if (estadoActual === "Aprobado" && nuevoEstado !== "Completado") {
        toast.error(`Transición inválida. De "Aprobado" solo puede pasar a "Completado".`);
        return;
      }
      if (estadoActual === "Completado") {
        toast.error("El equipo ya fue completado y no puede cambiar de estado.");
        return;
      }
    } else if (nuevoEstado === "En revisión" && estadoActual !== "Rechazado" && estadoActual !== "Pendiente") {
      toast.error(`Transición inválida.`);
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de que deseas cambiar el estado de "${estadoActual}" a "${nuevoEstado}" para el evento #${id_evento}?`);
    if (!confirmar) return;

    // 1. Optimistic Update visual al instante
    setSolicitudesAV(prev => prev.map(av =>
      av.id_evento === id_evento ? { ...av, estado_av: nuevoEstado } : av
    ));

    try {
      const res = await fetch(`${API}/audiovisual/evento/${id_evento}/estado`, {
        method: "PUT",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const body = await res.json();
      if (res.ok) {
        toast.success(`Estado actualizado a "${nuevoEstado}"`);
        cargarSolicitudesAV().catch(() => {});
      } else {
        toast.error(body?.mensaje || "Error al cambiar el estado.");
        cargarSolicitudesAV().catch(() => {});
      }
    } catch {
      toast.error("No se pudo conectar al servidor.");
      cargarSolicitudesAV().catch(() => {});
    }
  };

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const solicitantesUnicos = ["Todos", ...new Set(solicitudesAV.map(av => av.nombre_usuario).filter(Boolean))];

  const filteredSolicitudes = solicitudesAV.filter(av => {
    const matchSearch = searchTerm === "" || 
      av.nombre_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#EVT-${av.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filtroEstado === "Todos" || av.estado_av === filtroEstado;
    const matchSolicitante = filtroSolicitante === "Todos" || av.nombre_usuario === filtroSolicitante;

    return matchSearch && matchEstado && matchSolicitante;
  });

  const sortedSolicitudes = [...filteredSolicitudes].sort((a, b) => {
    if (sortDirection === 'ascending') {
      return a.id_evento - b.id_evento; // Más antiguos primero
    } else {
      return b.id_evento - a.id_evento; // Más recientes primero
    }
  });

  const sortedEquipos = selectedRequest?.equipos || [];

  const totalPages = Math.ceil(sortedSolicitudes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSolicitudes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="animate-fade">
      <style>{`
        @keyframes spin-cw { 100% { transform: rotate(360deg); } }
      `}</style>
      <div className="admin-controls-card" style={{ marginBottom: '24px' }}>
        <div className="controls-header">
          <div className="title-section">
            <FiMonitor className="header-icon" />
            <div>
              <h3>Gestión de Solicitudes Audiovisuales</h3>
              <p className="subtitle">Administra y actualiza el estado de las solicitudes técnicas de los eventos.</p>
            </div>
          </div>
          <div className="header-actions-group">
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={handleRecargar} 
              disabled={isLoadingReload}
              title="Recargar lista y reiniciar filtros"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isLoadingReload ? 0.7 : 1, cursor: isLoadingReload ? 'not-allowed' : 'pointer' }}
            >
              <FiRefreshCw style={{ animation: isLoadingReload ? 'spin-cw 1s linear infinite' : 'none' }} />
              {isLoadingReload ? "Recargando..." : "Recargar"}
            </button>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-item">
            <label><FiSearch style={{marginRight:'4px',verticalAlign:'middle'}}/>Buscar</label>
            <input 
              type="text" 
              placeholder="ID o nombre del evento..." 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="input-base" 
            />
          </div>

          <div className="filter-item">
            <label><FiFilter style={{marginRight:'4px',verticalAlign:'middle'}}/>Estado</label>
            <select 
              value={filtroEstado} 
              onChange={e => { setFiltroEstado(e.target.value); setCurrentPage(1); }} 
              className="input-base"
            >
              <option>Todos</option>
              <option>Pendiente</option>
              <option>En revisión</option>
              <option>Aprobado</option>
              <option>Rechazado</option>
              <option>Completado</option>
            </select>
          </div>

          <div className="filter-item">
            <label><FiUser style={{marginRight:'4px',verticalAlign:'middle'}}/>Solicitante</label>
            <select 
              value={filtroSolicitante} 
              onChange={e => { setFiltroSolicitante(e.target.value); setCurrentPage(1); }} 
              className="input-base"
            >
              {solicitantesUnicos.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-item" style={{display:'flex', flexDirection:'column', justifyContent:'flex-end'}}>
            <label style={{marginBottom:'6px', fontSize:'12px', color:'#64748b', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.04em'}}>
              &#8645; Ordenar por Creación
            </label>
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'descending' ? 'ascending' : 'descending')}
              title={sortDirection === 'descending' ? 'Click: más antiguos primero' : 'Click: más recientes primero'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: sortDirection === 'descending' ? '#bfdbfe' : '#e2e8f0',
                background: sortDirection === 'descending' ? '#eff6ff' : '#f8fafc',
                color: sortDirection === 'descending' ? '#1d4ed8' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%'
              }}
            >
              {sortDirection === 'descending'
                ? <><span style={{fontSize:'16px'}}>&#8595;</span> Más recientes</>
                : <><span style={{fontSize:'16px'}}>&#8593;</span> Más antiguos</>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID Evento</th>
              <th>Evento</th>
              <th>Solicitante</th>
              <th>Cant. Equipos</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((av) => (
              <tr key={av.id_evento}>
                <td style={{ fontWeight: '600', color: '#64748B' }}>#EVT-{av.id_evento}</td>
                <td style={{ fontWeight: '600', color: '#0F172A' }}>{av.nombre_evento}</td>
                <td>{av.nombre_usuario}</td>
                <td><span className="badge badge-slate">{av.total_equipos} equipo(s)</span></td>
                <td>
                  <CustomBadgeDropdown 
                    currentStatus={av.estado_av || "Pendiente"} 
                    onChange={(nuevoEstado) => handleCambiarEstado(av.id_evento, nuevoEstado)}
                    readOnly={!(usuario?.rol === "Administrador" || usuario?.rol === "Audiovisual" || usuario?.rol === "Administrador de Audiovisual")}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal(av)}>
                    <FiEye size={14} /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {solicitudesAV.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                  <FiMonitor size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontWeight: '600' }}>No hay solicitudes registradas</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {sortedSolicitudes.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedSolicitudes.length)} de {sortedSolicitudes.length} solicitudes
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Anterior
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
              Página {currentPage} de {totalPages || 1}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLES AUDIOVISUAL */}
      {isModalOpen && selectedRequest && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica Audiovisual</h3>
                <span className="modal-subtitle">Revisión de reserva de equipos y logística AV</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#AV-{selectedRequest.id_solicitud || selectedRequest.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-2">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiFileText size={14} /> Información del Evento
                  </div>
                  <div className="info-row">
                    <span className="info-label">Evento Relacionado</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>#EVT-{selectedRequest.id_evento} - {selectedRequest.nombre_evento}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Solicitante</span>
                    <span className="info-value">{selectedRequest.nombre_usuario || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha del Evento</span>
                    <span className="info-value">{formatFecha(selectedRequest.fecha_evento)}</span>
                  </div>
                </div>

                {/* Columna 2: Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiMonitor size={14} /> Estado de Solicitud AV
                  </div>
                  <div className="info-row">
                    <span className="info-label">Estado General</span>
                    <span className={`badge ${selectedRequest.estado_av === 'Aprobado' ? 'badge-green' : selectedRequest.estado_av === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado_av}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipos Solicitados */}
              <div className="modal-grid-1" style={{ marginTop: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Desglose de Equipos Solicitados
                  </div>
                  <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Equipo Requerido</th>
                          <th style={{ textAlign: 'center' }}>Cantidad</th>
                          <th>Ubicación</th>
                          <th>Observaciones Especiales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEquipos.map(eq => (
                          <tr key={eq.id_servicio}>
                            <td style={{ fontWeight: '600', color: '#0F172A' }}>{eq.equipo}</td>
                            <td style={{ textAlign: 'center', fontWeight: '700', color: '#3B82F6' }}>{eq.cantidad}</td>
                            <td>{eq.ubicacion || "N/D"}</td>
                            <td style={{ color: '#64748B', fontSize: '13px' }}>{eq.observaciones || "Ninguna"}</td>
                          </tr>
                        ))}
                        {(!selectedRequest.equipos || selectedRequest.equipos.length === 0) && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>
                              No hay detalle de equipos registrado para esta solicitud.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
