// ============================================================
// GESTIÓN DE EVENTOS - Componente Principal
// Pertenece a: Módulo de Administración de Eventos (ProEvent)
// Propósito: Muestra la tabla principal de solicitudes de eventos,
// permite cambiar estados, ver la Ficha Técnica en detalle,
// asignar servicios externos, personal y cronograma.
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// Iconos de Feather Icons usados en la UI de la tabla y modales
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiFilter, FiSearch, FiSliders, FiTrash2, FiGrid, FiDollarSign, FiBriefcase, FiSend, FiActivity, FiPlay, FiLock, FiAlertCircle, FiXCircle, FiInfo } from "react-icons/fi";

// Sistema de notificaciones flotantes (toasts)
import { toast } from "react-hot-toast";

// Hook personalizado para ordenar columnas de la tabla
import { useSortableData } from "../hooks/useSortableData";

// Sub-componentes de la Ficha Técnica del evento
import FichaTecnicaPDF from "./FichaTecnicaPDF";        // Genera el resumen PDF del evento
import AsignacionPersonal from "./AsignacionPersonal"; // Panel de asignación de personal/organizadores
import CronogramaGlobal from "./CronogramaGlobal";     // Panel del cronograma de actividades

// Estilos globales del panel de administración
import './../css/Dashboard.css';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: GestionEventos
// Recibe: usuario (objeto del usuario logueado), searchTerm
// (texto de búsqueda global), onEditEvent (callback para editar)
// ============================================================
function GestionEventos({ usuario, searchTerm = "", onEditEvent }) {

  // --- ESTADOS DE FILTROS DE LA TABLA ---
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos los Departamentos');
  const [filtroFecha, setFiltroFecha] = useState('');

  // --- DATOS PRINCIPALES ---
  // Lista completa de solicitudes de eventos traídas del backend
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true); // Indicador de carga inicial
  const [error, setError] = useState("");        // Mensaje de error si falla la API
  
  // --- PAGINACIÓN DE LA TABLA ---
  // Controla qué página de resultados se muestra (8 eventos por página)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- ESTADOS DEL MODAL DE FICHA TÉCNICA ---
  // selectedRequest: el evento que se está viendo en detalle
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAsignarServicioModalOpen, setIsAsignarServicioModalOpen] = useState(false); // Modal para Asignar Servicio Externo
  const [coordinadores, setCoordinadores] = useState([]); // Lista de coordinadores disponibles para asignar

  // --- LÓGICA DE APROBACIONES PREVIAS AL INICIO ---
  // aprobacionesMap: mapa de id_evento → { puede_iniciar, aprobaciones[] }
  // Se consulta antes de permitir cambiar estado a "En Progreso"
  const [aprobacionesMap, setAprobacionesMap] = useState({}); // { [id_evento]: { puede_iniciar, aprobaciones, ... } }
  const [modalAprobaciones, setModalAprobaciones] = useState(null); // Evento seleccionado para ver aprobaciones faltantes
  const [loadingAprobaciones, setLoadingAprobaciones] = useState({});

  // --- SUB-PANELES DE LA FICHA TÉCNICA ---
  // Controlan si se muestran los sub-componentes dentro del modal de detalle
  const [showPersonal, setShowPersonal] = useState(false);    // Muestra el panel de AsignacionPersonal
  const [showCronograma, setShowCronograma] = useState(false); // Muestra el CronogramaGlobal del evento

  // --- CARGA INICIAL: COORDINADORES ---
  // Al montar el componente, obtiene la lista de usuarios con rol coordinador
  // para el selector de asignación de personal dentro de la ficha
  useEffect(() => {
    fetch(`${API}/usuarios-coordinadores`)
      .then(res => res.json())
      .then(data => setCoordinadores(data))
      .catch(err => console.error("Error al cargar coordinadores:", err));
  }, []);

  // --- FUNCIÓN: handleVerDetalles ---
  // Se ejecuta al hacer clic en el botón "Ver" de cualquier evento en la tabla.
  // Abre el modal principal y pre-carga en paralelo:
  //   1. Datos administrativos (presupuesto VAF, estado legal, cotizaciones)
  //   2. Servicios externos asociados al evento
  //   3. Personal/organizadores asignados
  // Esto permite que la vista previa del PDF esté lista sin esperar al usuario.
  const handleVerDetalles = async (req) => {
    setSelectedRequest(req); // Establece el evento activo en el modal
    setIsModalOpen(true);    // Abre el modal de la Ficha Técnica
    
    // Pre-carga de datos enriquecidos para la vista de detalle y el PDF
    try {
      const resAdmin = await fetch(`${API}/api/admin_evento/${req.id_evento}`);
      const dataAdmin = await resAdmin.json();
      
      const resServ = await fetch(`${API}/servicios-externos-all`);
      const dataServ = await resServ.json();
      const servicios = Array.isArray(dataServ) ? dataServ.filter(s => s.id_evento === req.id_evento) : [];

      const resOrg = await fetch(`${API}/eventos/${req.id_evento}/personal`);
      const dataOrg = await resOrg.json();

      // Almacena todos los datos en el estado pdfData para el componente FichaTecnicaPDF
      setPdfData({
        presupuesto: dataAdmin.presupuesto,
        legal: dataAdmin.legal,
        servicios,
        organizadores: Array.isArray(dataOrg) ? dataOrg : []
      });
    } catch (e) {
      console.error("Error pre-cargando datos del PDF", e);
    }
    cargarOrganizadoresAsignados(req.id_evento); // También carga los organizadores asignados
  };

  // --- FUNCIÓN: closeModal ---
  // Cierra el modal de la Ficha Técnica y limpia todos los estados
  // relacionados con el evento activo para evitar datos obsoletos.
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);        // Limpia el evento seleccionado
    setOrganizadoresAsignados([]);   // Limpia la lista de organizadores
    setShowFichaPDF(false);          // Oculta el sub-panel PDF
    setShowPersonal(false);          // Oculta el panel de personal
    setShowCronograma(false);        // Oculta el cronograma
  };

  // --- ESTADOS DEL FORMULARIO DE SERVICIOS EXTERNOS ---
  // Gestionan el modal para asignar un servicio externo (Catering, Audio, etc.) al evento
  const [tiposServicioExterno, setTiposServicioExterno] = useState([]); // Catálogo de tipos de servicio disponibles
  const [servicioForm, setServicioForm] = useState({ id_tipo_servicio: "", detalles: "", cantidad: 1 }); // Formulario del nuevo servicio
  
  // --- ESTADOS DE LA FICHA TÉCNICA PDF ---
  // Controlan si se muestra el componente FichaTecnicaPDF y los datos que alimenta
  const [showFichaPDF, setShowFichaPDF] = useState(false);
  const [pdfData, setPdfData] = useState({ presupuesto: null, legal: null, servicios: [], organizadores: [] });
  const [enviandoServicio, setEnviandoServicio] = useState(false); // Bloquea el botón mientras se guarda un servicio

  // --- FUNCIÓN: openAsignarServicioModal ---
  // Abre el modal de asignación de servicio externo.
  // Al abrirlo, consulta la API para obtener los tipos de servicio disponibles (catálogo)
  // que luego se muestran en el selector del formulario.
  const openAsignarServicioModal = async () => {
    setIsAsignarServicioModalOpen(true);
    try {
      const res = await fetch(`${API}/tipos-servicio-externo`);
      if (res.ok) {
        setTiposServicioExterno(await res.json()); // Carga el catálogo de servicios desde el backend
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- FUNCIÓN: closeAsignarServicioModal ---
  // Cierra el modal de asignación de servicio y resetea el formulario a sus valores iniciales
  const closeAsignarServicioModal = () => {
    setIsAsignarServicioModalOpen(false);
    setServicioForm({ id_tipo_servicio: "", detalles: "", cantidad: 1 }); // Limpia el formulario
  };

  // --- FUNCIÓN: handleSubmitServicio ---
  // Envía el formulario de asignación de servicio externo.
  // Valida que se haya seleccionado un tipo de servicio, luego hace
  // POST al backend para registrar el servicio en la tabla servicios_externos.
  // Al completarse, recarga los datos del evento para reflejar el nuevo servicio
  // en la Ficha Técnica sin cerrar el modal principal.
  const handleSubmitServicio = async (e) => {
    e.preventDefault();
    if (!servicioForm.id_tipo_servicio) {
      toast.error("Seleccione un tipo de servicio");
      return;
    }
    setEnviandoServicio(true); // Desactiva el botón de envío mientras se procesa
    try {
      const res = await fetch(`${API}/servicios-externos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_evento: selectedRequest.id_evento,
          id_tipo_servicio: servicioForm.id_tipo_servicio,
          detalles: servicioForm.detalles,
          cantidad: servicioForm.cantidad
        })
      });
      if (res.ok) {
        toast.success("Servicio asignado correctamente a Logística Operativa");
        closeAsignarServicioModal();
        handleVerDetalles(selectedRequest); // Recarga el modal con los datos actualizados incluyendo el nuevo servicio
      } else {
        toast.error("Error al asignar servicio");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setEnviandoServicio(false); // Reactiva el botón independientemente del resultado
    }
  };

  // Lista de organizadores/personal asignados al evento actualmente abierto en la ficha
  const [organizadoresAsignados, setOrganizadoresAsignados] = useState([]);

  // --- FUNCIÓN: cargarOrganizadoresAsignados ---
  // Obtiene del backend los usuarios asignados como organizadores del evento.
  // Se llama al abrir la ficha técnica y también después de asignar un nuevo rol.
  const cargarOrganizadoresAsignados = async (id_evento) => {
    try {
      const res = await fetch(`${API}/organizadores/${id_evento}`);
      if (res.ok) {
        setOrganizadoresAsignados(await res.json()); // Actualiza la lista de personal mostrada en la ficha
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- FUNCIÓN: asignarRol ---
  // Asigna un usuario a un rol específico dentro del evento (Coordinador, Asistente, etc.).
  // Realiza POST al endpoint /organizadores y luego recarga la lista para actualizar la UI.
  const asignarRol = async (id_evento, id_usuario, rol) => {
    if (!id_usuario) return; // Evita envíos sin usuario seleccionado
    try {
      const res = await fetch(`${API}/organizadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_evento, id_usuario, rol_organizacion: rol })
      });
      if (res.ok) {
        toast.success(`${rol} asignado correctamente`);
        cargarOrganizadoresAsignados(id_evento); // Refresca la tabla de personal dentro de la ficha
      } else {
        toast.error(`Error al asignar ${rol}`);
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  // --- FUNCIÓN: cargarAprobacionesEvento ---
  // Consulta el estado de las aprobaciones previas necesarias para iniciar un evento.
  // El sistema requiere que Compras, Legal y VAF hayan dado su OK antes de permitir
  // cambiar el estado a "En Progreso". Almacena el resultado en aprobacionesMap.
  const cargarAprobacionesEvento = async (id_evento) => {
    setLoadingAprobaciones(prev => ({ ...prev, [id_evento]: true })); // Activa el loader para ese evento
    try {
      const res = await fetch(`${API}/api/aprobaciones-evento/${id_evento}`);
      if (res.ok) {
        const data = await res.json();
        setAprobacionesMap(prev => ({ ...prev, [id_evento]: data })); // Guarda el mapa de aprobaciones
      }
    } catch (e) {
      console.error('Error cargando aprobaciones:', e);
    } finally {
      setLoadingAprobaciones(prev => ({ ...prev, [id_evento]: false })); // Apaga el loader
    }
  };

  // --- EFECTO: Carga de eventos al cambiar de usuario ---
  // Se ejecuta automáticamente cuando el prop 'usuario' cambia (ej. al iniciar sesión).
  // Reinicia la paginación a la primera página y recarga toda la lista de eventos.
  useEffect(() => {
    cargarEventos();
    setCurrentPage(1); // Siempre vuelve a la página 1 al recargar los datos
  }, [usuario]);

  // --- FUNCIÓN: cargarEventos ---
  // Función principal de carga de datos de la tabla.
  // - Si el usuario es Solicitante: solo trae SUS eventos (filtrado por usuario_id)
  // - Si es Admin u otro rol: trae TODOS los eventos del sistema
  // Adicionalmente, para cada evento en estado "Aprobado" carga el mapa de aprobaciones
  // administrativas necesarias para el botón de "Iniciar Evento".
  const cargarEventos = async () => {
    setLoading(true);
    setError("");
    try {
      // URL condicional según el rol del usuario logueado
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}` // Solo sus eventos
        : `${API}/eventos`;                                  // Todos los eventos
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEventRequests(data);
        // Carga aprobaciones para los eventos "Aprobados" (candidatos a pasar a "En Progreso")
        const aprobados = data.filter(e => e.estado === 'Aprobado');
        aprobados.forEach(e => cargarAprobacionesEvento(e.id_evento));
      } else {
        setError("Error al cargar eventos.");
        toast.error("Error al cargar eventos.");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor de eventos.");
      toast.error("No se pudo conectar al servidor de eventos.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN: handleCambiarEstado ---
  // Cambia el estado de un evento (Pendiente → Aprobado → En Progreso → Finalizado / Rechazado).
  // REGLA ESPECIAL: Para pasar a "En Progreso" el sistema verifica que existan aprobaciones
  // de Compras, Legal y VAF. Si alguna falta, muestra el modal de aprobaciones pendientes
  // en lugar de permitir el cambio de estado.
  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    // Bloqueo especial: solo permite iniciar si todas las áreas han aprobado
    if (nuevoEstado === 'En Progreso') {
      const aprobInfo = aprobacionesMap[id_evento];
      if (!aprobInfo) {
        // Si aún no se cargaron las aprobaciones, las solicita y aborta esta vez
        toast.error('Verificando aprobaciones... Por favor intenta de nuevo.');
        cargarAprobacionesEvento(id_evento);
        return;
      }
      if (!aprobInfo.puede_iniciar) {
        // Muestra el modal con el checklist de aprobaciones faltantes
        setModalAprobaciones({ id_evento, ...aprobInfo });
        return;
      }
    }
    // Si pasa la validación (o el estado no es "En Progreso"), hace el PUT al backend
    try {
      const res = await fetch(`${API}/eventos/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${usuario?.token || ""}`,
          "x-usuario-id": usuario?.id_usuario || "" // Auditoría: quién hizo el cambio
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        toast.success(`Estado actualizado a ${nuevoEstado}`);
        
        // Efecto Cascada UI: Si se rechaza, el POA también se rechaza visualmente sin esperar recarga
        setEventRequests(prev => prev.map(e => e.id_evento === id_evento 
            ? { ...e, estado: nuevoEstado, ...(nuevoEstado === 'Rechazado' ? { estado_poa: 'Rechazado' } : {}) } 
            : e));
        
        if (selectedRequest && selectedRequest.id_evento === id_evento) {
           setSelectedRequest(prev => ({ ...prev, estado: nuevoEstado, ...(nuevoEstado === 'Rechazado' ? { estado_poa: 'Rechazado' } : {}) }));
        }
        
        cargarEventos(); // Refresca la tabla completa en background
      } else {
        toast.error("Error al cambiar el estado del evento.");
      }
    } catch {
      toast.error("No se pudo conectar al servidor para actualizar el estado.");
    }
  };

  // --- FUNCIÓN: handleEliminarEvento ---
  // Elimina permanentemente un evento del sistema previa confirmación del usuario.
  // Solo usuarios con permisos de administrador deberían ver este botón.
  // Al completarse, recarga la tabla para remover el evento de la vista.
  const handleEliminarEvento = async (id_evento) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/eventos/${id_evento}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${usuario?.token || ""}`,
          "x-usuario-id": usuario?.id_usuario || "" // Auditoría del usuario que elimina
        }
      });
      if (res.ok) {
        toast.success("Evento eliminado exitosamente.");
        cargarEventos(); // Actualiza la tabla sin el evento borrado
      } else {
        const errorData = await res.json();
        toast.error(errorData.mensaje || "Error al eliminar el evento.");
      }
    } catch (err) {
      toast.error("No se pudo conectar al servidor para eliminar el evento.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN UTILITARIA: formatFecha ---
  // Convierte una fecha ISO del backend (ej: "2026-06-14T00:00:00Z") a formato
  // legible en español dominicano (ej: "14 jun 2026").
  // El ajuste de timezone evita que las fechas aparezcan un día antes por UTC.
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset()); // Corrección de zona horaria local
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };
  
  // --- FUNCIÓN UTILITARIA: formatHora ---
  // Convierte una hora en formato 24h ("14:30:00") al formato 12h con AM/PM ("2:30 PM").
  // Se usa para mostrar las horas de inicio y fin del evento en la Ficha Técnica.
  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const [hora, min] = horaStr.split(':');
    const h = parseInt(hora, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; // Convierte 0 → 12 para medianoche
    return `${h12}:${min} ${ampm}`;
  };

  // --- FUNCIÓN UTILITARIA: getStatusClass ---
  // Devuelve la clase CSS correspondiente al estado de un evento.
  // Estas clases están definidas en Dashboard.css y controlan el color del badge de estado.
  const getStatusClass = (estado) => {
    switch (estado) {
      case "Pendiente":  return "pending";  // Amarillo
      case "Aprobado":   return "approved"; // Verde
      case "Rechazado":  return "rejected"; // Rojo
      case "Finalizado": return "approved"; // Verde (mismo que aprobado)
      default:           return "pending";  // Amarillo por defecto
    }
  };

  const departamentosUnicos = ["Todos", ...new Set(eventRequests.map((e) => e.dependencia).filter(Boolean))];

  const filteredRequests = eventRequests
    .filter((req) => {
      const matchSearch = searchTerm === "" || 
        req.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#EVT-${req.id_evento}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.solicitante?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = filtroEstado === 'Todos los estados' || req.estado === filtroEstado;
      const matchDept = filtroDepartamento === 'Todos los Departamentos' || req.dependencia === filtroDepartamento;
      const matchFecha = !filtroFecha || (req.fecha_inicio && req.fecha_inicio.startsWith(filtroFecha));
      
      return matchSearch && matchEstado && matchDept && matchFecha;
    });

  const { items: sortedRequests, requestSort, sortConfig } = useSortableData(filteredRequests, { key: 'fecha_inicio', direction: 'descending' });

  // Paginación
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);

  // (Efecto de paginación reseteo eliminado ya que no hay filtros extra)

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiSliders className="header-icon" />
            <div>
              <h3>Panel de Control de Solicitudes</h3>
              <p className="subtitle">Filtra, aprueba y administra todas las solicitudes de eventos institucionales</p>
            </div>
          </div>
          <div className="header-actions-group">
            <button className="btn btn-secondary btn-sm" onClick={cargarEventos} title="Recargar lista">
              <FiRefreshCw /> Recargar
            </button>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-item">
            <label><FiFilter style={{marginRight:'4px',verticalAlign:'middle'}}/>Estado</label>
            <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setCurrentPage(1); }}>
              <option>Todos los estados</option>
              <option>Pendiente</option>
              <option>Aprobado</option>
              <option>Rechazado</option>
              <option>En Progreso</option>
              <option>Finalizado</option>
            </select>
          </div>

          <div className="filter-item">
            <label><FiGrid style={{marginRight:'4px',verticalAlign:'middle'}}/>Departamento / Dependencia</label>
            <select value={filtroDepartamento} onChange={e => { setFiltroDepartamento(e.target.value); setCurrentPage(1); }}>
              {departamentosUnicos.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="filter-item">
            <label><FiCalendar style={{marginRight:'4px',verticalAlign:'middle'}}/>Fecha del Evento</label>
            <input type="date" value={filtroFecha} onChange={e => { setFiltroFecha(e.target.value); setCurrentPage(1); }} />
          </div>

          <div className="filter-item" style={{display:'flex', flexDirection:'column', justifyContent:'flex-end'}}>
            <label style={{marginBottom:'6px', fontSize:'12px', color:'#64748b', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.04em'}}>
              &#8645; Ordenar por Fecha
            </label>
            <button
              onClick={() => requestSort('fecha_inicio')}
              title={sortConfig?.direction === 'ascending' ? 'Click: más recientes primero' : 'Click: más antiguos primero'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: sortConfig?.direction === 'ascending' ? '#bfdbfe' : '#e2e8f0',
                background: sortConfig?.direction === 'ascending' ? '#eff6ff' : '#f8fafc',
                color: sortConfig?.direction === 'ascending' ? '#1d4ed8' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%'
              }}
            >
              {sortConfig?.direction === 'ascending'
                ? <><span style={{fontSize:'16px'}}>&#8593;</span> Más antiguos</>
                : <><span style={{fontSize:'16px'}}>&#8595;</span> Más recientes</>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="recent-requests-section admin-table-card">
        <div className="table-container">
          {loading ? (
            <div className="table-state-loading">
              <div className="loader"></div>
              <p>Cargando lista de solicitudes de eventos...</p>
            </div>
          ) : error ? (
            <div className="table-state-error">
              <p>{error}</p>
              <button className="retry-btn" onClick={cargarEventos}>Reintentar conexión</button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="table-state-empty">
              <FiFileText className="empty-icon" />
              <h4>No se encontraron solicitudes</h4>
              <p>Prueba ajustando los filtros de búsqueda o fecha.</p>
            </div>
          ) : (
            <table className="requests-table modern-table">
              <thead>
                <tr>
                  <th>EVENTO ID & NOMBRE</th>
                  {usuario?.rol !== "Solicitante" && <th>SOLICITANTE</th>}
                  {usuario?.rol !== "Solicitante" && <th>DEPENDENCIA</th>}
                  <th>FECHA DE INICIO</th>
                  <th>RECINTO / LUGAR</th>
                  <th>ESTADO EVENTO</th>
                  <th>CONTABILIDAD POA</th>
                  <th>MÁS DETALLES</th>
                  {usuario?.rol !== "Administrador V-A-F" && <th style={{ textAlign: 'center' }}>ACCIONES DE GESTIÓN</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((req) => (
                  <tr key={req.id_evento} className="table-hover-row">
                    <td>
                      <div className="event-name-cell">
                        <strong>{req.nombre}</strong>
                        <span className="event-id-tag">#EVT-{req.id_evento}</span>
                      </div>
                    </td>
                    {usuario?.rol !== "Solicitante" && (
                      <td>
                        <div className="solicitante-cell">
                          <span className="avatar-char">{req.solicitante ? req.solicitante.charAt(0).toUpperCase() : "U"}</span>
                          <span>{req.solicitante || "—"}</span>
                        </div>
                      </td>
                    )}
                    {usuario?.rol !== "Solicitante" && <td>{req.dependencia || "—"}</td>}
                    <td>
                      <div className="date-cell">
                        <FiCalendar className="date-icon" />
                        <span>{formatFecha(req.fecha_inicio)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="venue-cell">
                        <span>{req.recinto || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${getStatusClass(req.estado)}`}>
                        {req.estado || "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${getStatusClass(req.estado_poa)}`}>
                        {req.estado_poa || "Ninguno"}
                      </span>
                    </td>
                    <td>
                      <button className="details-btn" onClick={() => handleVerDetalles(req)}>
                        <FiEye /> Ver detalles
                      </button>
                    </td>
                    {usuario?.rol !== "Administrador V-A-F" && (
                      <td>
                        <div className="actions-cell">
                          {usuario?.rol === "Solicitante" ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="action-icon-btn edit" 
                                onClick={() => onEditEvent(req)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes editar solicitudes pendientes" : "Editar solicitud"}
                              >
                                <FiEdit2 />
                              </button>
                              <button 
                                className="action-icon-btn delete" 
                                onClick={() => handleEliminarEvento(req.id_evento)}
                                disabled={req.estado !== "Pendiente"}
                                title={req.estado !== "Pendiente" ? "Solo puedes eliminar solicitudes pendientes" : "Eliminar solicitud"}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(!req.estado || req.estado === "Pendiente") && (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleCambiarEstado(req.id_evento, "Aprobado")} style={{ padding: '6px 12px', width: '100%' }}>
                                    <FiCheckCircle /> Aprobar
                                  </button>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', width: '100%', color: '#ef4444', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }} onClick={() => handleCambiarEstado(req.id_evento, "Rechazado")}>
                                    <FiXCircle /> Rechazar
                                  </button>
                                </>
                              )}
                              {req.estado === "Aprobado" && (() => {
                                const aprobInfo = aprobacionesMap[req.id_evento];
                                const isLoading = loadingAprobaciones[req.id_evento];
                                const puedeIniciar = aprobInfo?.puede_iniciar;
                                const hayRechazos = aprobInfo?.hay_rechazos;
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <button 
                                      className={`btn btn-sm ${ puedeIniciar ? '' : 'btn-secondary'}`}
                                      style={{
                                        padding: '6px 12px', width: '100%',
                                        backgroundColor: puedeIniciar ? '#0ea5e9' : hayRechazos ? '#fef2f2' : '#f1f5f9',
                                        color: puedeIniciar ? '#fff' : hayRechazos ? '#ef4444' : '#64748b',
                                        border: puedeIniciar ? 'none' : `1px solid ${hayRechazos ? '#fca5a5' : '#e2e8f0'}`,
                                        cursor: puedeIniciar ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        fontWeight: '600', borderRadius: '8px', fontSize: '12.5px',
                                        transition: 'all 0.2s'
                                      }}
                                      onClick={() => {
                                        if (puedeIniciar) {
                                          handleCambiarEstado(req.id_evento, 'En Progreso');
                                        } else {
                                          if (aprobInfo) setModalAprobaciones({ id_evento: req.id_evento, ...aprobInfo });
                                          else { cargarAprobacionesEvento(req.id_evento); toast('Cargando estado de aprobaciones...'); }
                                        }
                                      }}
                                      title={puedeIniciar ? 'Iniciar evento' : hayRechazos ? 'Evento rechazado por un área' : 'Aprobaciones pendientes'}
                                    >
                                      {isLoading ? <FiClock size={13} /> : puedeIniciar ? <FiPlay size={13} /> : <FiLock size={13} />}
                                      {isLoading ? 'Verificando...' : puedeIniciar ? 'Iniciar Evento' : hayRechazos ? 'Rechazado' : 'Pendiente'}
                                    </button>
                                    {/* Mini badge de estado de aprobaciones */}
                                    {aprobInfo && !puedeIniciar && (
                                      <button
                                        onClick={() => setModalAprobaciones({ id_evento: req.id_evento, ...aprobInfo })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center', padding: '2px', textDecoration: 'underline' }}
                                      >
                                        <FiInfo size={11} /> Ver aprobaciones
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                              {req.estado === "En Progreso" && (
                                <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#10b981', border: 'none', padding: '6px 12px', width: '100%' }} onClick={() => handleCambiarEstado(req.id_evento, "Finalizado")}>
                                  Finalizar
                                </button>
                              )}
                              {["Finalizado", "Rechazado", "Cancelado"].includes(req.estado) && (
                                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600', textAlign: 'center', display: 'block' }}>Sin acciones</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!loading && filteredRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredRequests.length)}</strong> de <strong>{filteredRequests.length}</strong> solicitudes
            </div>
            <div className="pagination-controls" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft /> Anterior
              </button>
              <span style={{fontWeight: 700, color: 'var(--text-main)', fontSize: '13px'}}>
                Pág. {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLES */}
      {isModalOpen && selectedRequest && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica del Evento</h3>
                <span className="modal-subtitle">Revisión exhaustiva y logística completa</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#EVT-{selectedRequest.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-3">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiFileText size={14} /> Información General
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nombre del Evento</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>{selectedRequest.nombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Solicitante</span>
                    <span className="info-value">{selectedRequest.solicitante || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Dependencia</span>
                    <span className="info-value">{selectedRequest.dependencia || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fechas</span>
                    <span className="info-value">
                      {formatFecha(selectedRequest.fecha_inicio)} 
                      {selectedRequest.fecha_fin && selectedRequest.fecha_fin !== selectedRequest.fecha_inicio ? ` al ${formatFecha(selectedRequest.fecha_fin)}` : ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Horario</span>
                    <span className="info-value">
                      {selectedRequest.hora_inicio ? formatHora(selectedRequest.hora_inicio) : "—"} 
                      {selectedRequest.hora_fin ? ` a ${formatHora(selectedRequest.hora_fin)}` : ""}
                    </span>
                  </div>
                </div>
                {/* Columna 2: Logística y Asistencia */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiGrid size={14} /> Logística y Asistencia
                  </div>
                  <div className="info-row">
                    <span className="info-label">Recinto</span>
                    <span className="info-value">{selectedRequest.recinto || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Modalidad</span>
                    <span className="info-value">{selectedRequest.modalidad || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tipo de Evento</span>
                    <span className="info-value">{selectedRequest.tipo_evento || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Asistentes Esperados</span>
                    <span className="info-value">{selectedRequest.cantidad_asistentes ? `${selectedRequest.cantidad_asistentes} personas` : "—"}</span>
                  </div>
                </div>

                {/* Columna 3: Finanzas y Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiDollarSign size={14} /> Presupuesto y Estado
                  </div>
                  <div className="info-row">
                    <span className="info-label">Presupuesto POA Solicitado</span>
                    <span className="info-value" style={{ color: '#10B981' }}>
                      {selectedRequest.monto_poa ? `${Number(selectedRequest.monto_poa).toLocaleString("en-US", {minimumFractionDigits: 2})} ${selectedRequest.moneda || 'DOP'}` : "Sin Presupuesto POA"}
                    </span>
                  </div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado de la Solicitud</span>
                    <span className={`badge ${selectedRequest.estado === 'Aprobado' ? 'badge-green' : selectedRequest.estado === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado || "Pendiente"}
                    </span>
                  </div>
                  <div className="info-row" style={{ marginTop: '12px' }}>
                    <span className="info-label">Estado Presupuesto (POA)</span>
                    <span className={`badge ${selectedRequest.estado_poa === 'Aprobado' ? 'badge-green' : selectedRequest.estado_poa === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado_poa || "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Administrativo a Ancho Completo */}
              <div className="modal-grid-1" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiActivity size={14} /> Tracking Administrativo (Lectura)
                  </div>
                  <div className="modal-grid-3">

                    <div className="info-row">
                      <span className="info-label">Revisión Legal</span>
                      <span className={`badge ${pdfData.legal?.estado_contrato === 'Vigente' ? 'badge-green' : pdfData.legal?.estado_contrato === 'Vencido' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                        {pdfData.legal?.estado_contrato || "Pendiente"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Compras y Logística (B2B)</span>
                      <span className="info-value" style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', fontWeight: 'bold' }}>
                        {pdfData.servicios?.length > 0 
                          ? `${pdfData.servicios.length} servicio(s) gestionado(s)` 
                          : "Ninguno en proceso"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* === Sección Expandible: Asignación de Personal === */}
              <div className="modal-grid-1" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="info-card" style={{ cursor: 'pointer' }} onClick={() => setShowPersonal(!showPersonal)}>
                  <div className="info-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiPlay size={14} style={{ transform: showPersonal ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} /> Asignación de Personal Operativo</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{showPersonal ? 'Ocultar' : 'Expandir'}</span>
                  </div>
                  {showPersonal && (
                    <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <AsignacionPersonal usuario={usuario} eventoPreseleccionado={selectedRequest} />
                    </div>
                  )}
                </div>
              </div>

              {/* === Sección Expandible: Cronograma Logístico === */}
              <div className="modal-grid-1" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="info-card" style={{ cursor: 'pointer' }} onClick={() => setShowCronograma(!showCronograma)}>
                  <div className="info-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiPlay size={14} style={{ transform: showCronograma ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} /> Cronograma Logístico</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{showCronograma ? 'Ocultar' : 'Expandir'}</span>
                  </div>
                  {showCronograma && (
                    <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <CronogramaGlobal usuario={usuario} eventoPreseleccionado={selectedRequest} />
                    </div>
                  )}
                </div>
              </div>

              {/* Requerimientos Adicionales a Ancho Completo */}
              <div className="modal-grid-1" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Requerimientos Adicionales
                  </div>
                  <div className="modal-grid-3">
                    {selectedRequest.detalles_corporativos && (
                      <div className="info-row">
                        <span className="info-label">Montaje Corporativo</span>
                        <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>{selectedRequest.detalles_corporativos}</span>
                      </div>
                    )}
                    {selectedRequest.alimentos && (
                      <div className="info-row">
                        <span className="info-label">Alimentos (Catering)</span>
                        <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>{selectedRequest.alimentos}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Equipos Audiovisuales</span>
                      <span className="info-value" style={{ fontSize: '13.5px', color: '#475569' }}>
                        {selectedRequest.necesita_audiovisual 
                          ? (selectedRequest.equipos_audiovisuales || "Sí (Pendiente/Sin Especificar)") 
                          : "Ninguno"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedRequest.observaciones && (
                  <div className="info-card">
                    <div className="info-card-title">
                      <FiFileText size={14} /> Observaciones y Sugerencias
                    </div>
                    {selectedRequest.observaciones.includes('[SUGERENCIAS EXTERNAS]:') ? (
                      <>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                          "{selectedRequest.observaciones.split('\n\n[SUGERENCIAS EXTERNAS]:')[0]}"
                        </p>
                        <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                          <h4 style={{ color: '#D97706', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiBriefcase /> Sugerencia de Servicios Externos (Por Solicitante)</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                            {selectedRequest.observaciones.split('\n\n[SUGERENCIAS EXTERNAS]:')[1]}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                        "{selectedRequest.observaciones}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {usuario?.rol !== "Solicitante" && (
                  <button className="btn btn-secondary" onClick={openAsignarServicioModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiSend /> Asignar Servicio Externo
                  </button>
                )}
                {usuario?.rol === "Solicitante" && selectedRequest.estado !== "Aprobado" && selectedRequest.estado !== "Finalizado" && onEditEvent && (
                  <button className="btn btn-secondary" onClick={() => { closeModal(); onEditEvent(selectedRequest); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiEdit2 /> Editar Evento
                  </button>
                )}
                {usuario?.rol !== "Solicitante" && (
                  <button className="btn btn-secondary" onClick={() => setShowFichaPDF(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFileText /> Generar PDF
                  </button>
                )}
              </div>
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha Técnica</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RENDER FICHA PDF OCULTO/MODAL */}
      {showFichaPDF && selectedRequest && (
        <FichaTecnicaPDF 
          evento={selectedRequest} 
          presupuesto={pdfData.presupuesto}
          legal={pdfData.legal}
          servicios={pdfData.servicios}
          organizadores={pdfData.organizadores}
          onClose={() => setShowFichaPDF(false)}
        />
      )}

      {/* MODAL ASIGNAR SERVICIO EXTERNO */}
      {isAsignarServicioModalOpen && selectedRequest && createPortal(
        <div className="modal-overlay" onClick={closeAsignarServicioModal} style={{ zIndex: 1060 }}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Asignar Servicio Externo</h3>
                <span className="modal-subtitle">Enviar requerimiento a Logística Operativa</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={closeAsignarServicioModal}>X</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitServicio} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Tipo de Servicio</label>
                  <select 
                    className="input-base" 
                    value={servicioForm.id_tipo_servicio}
                    onChange={(e) => setServicioForm({...servicioForm, id_tipo_servicio: e.target.value})}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {tiposServicioExterno.map(t => (
                      <option key={t.id_tipo_servicio} value={t.id_tipo_servicio}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Detalles / Especificaciones</label>
                  <textarea 
                    className="input-base" 
                    placeholder="Ej: Necesitamos una tarima de 4x4m..."
                    value={servicioForm.detalles}
                    onChange={(e) => setServicioForm({...servicioForm, detalles: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">Cantidad</label>
                  <input 
                    type="number" 
                    className="input-base" 
                    min="1" 
                    value={servicioForm.cantidad}
                    onChange={(e) => setServicioForm({...servicioForm, cantidad: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAsignarServicioModal}>Cancelar</button>
                  <button type="submit" className="btn btn-success" disabled={enviandoServicio}>
                    {enviandoServicio ? "Asignando..." : "Asignar Servicio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL ESTADO DE APROBACIONES */}
      {modalAprobaciones && createPortal(
        <div className="modal-overlay" onClick={() => setModalAprobaciones(null)} style={{ zIndex: 1060 }}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-circle" style={{ backgroundColor: modalAprobaciones.hay_rechazos ? '#fee2e2' : modalAprobaciones.puede_iniciar ? '#dcfce7' : '#e0e7ff', color: modalAprobaciones.hay_rechazos ? '#ef4444' : modalAprobaciones.puede_iniciar ? '#10b981' : '#6366f1' }}>
                  {modalAprobaciones.hay_rechazos ? <FiXCircle size={20} /> : modalAprobaciones.puede_iniciar ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">Estado de Aprobaciones</h3>
                  <span className="modal-subtitle">
                    {modalAprobaciones.hay_rechazos 
                      ? 'El evento ha sido rechazado por una o más áreas.'
                      : modalAprobaciones.puede_iniciar 
                        ? 'Todas las áreas han aprobado. Listo para iniciar.'
                        : 'Aún hay áreas pendientes de revisión.'}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalAprobaciones(null)}>X</button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modalAprobaciones.aprobaciones.map((aprob, index) => (
                  <div key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '12px 16px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    opacity: aprob.requerido ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>{aprob.area}</span>
                      {!aprob.requerido && <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>No requerido</span>}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {aprob.estado === 'Aprobado' && <><FiCheckCircle color="#10b981" /><span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Aprobado</span></>}
                      {aprob.estado === 'Rechazado' && <><FiXCircle color="#ef4444" /><span style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Rechazado</span></>}
                      {aprob.estado === 'Pendiente' && <><FiClock color="#f59e0b" /><span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '13px' }}>Pendiente</span></>}
                      {aprob.estado === 'No aplica' && <><span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>No aplica</span></>}
                    </div>
                  </div>
                ))}
              </div>

              {!modalAprobaciones.puede_iniciar && !modalAprobaciones.hay_rechazos && modalAprobaciones.pendientes.length > 0 && (
                <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <FiAlertCircle color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '13px', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                      <strong>Acción bloqueada:</strong> No puedes iniciar este evento hasta que las áreas pendientes emitan su dictamen final.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              {modalAprobaciones.puede_iniciar ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    handleCambiarEstado(modalAprobaciones.id_evento, 'En Progreso');
                    setModalAprobaciones(null);
                  }}
                  style={{ backgroundColor: '#0ea5e9', border: 'none' }}
                >
                  <FiPlay /> Iniciar Evento Ahora
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => setModalAprobaciones(null)}>Entendido</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default GestionEventos;
