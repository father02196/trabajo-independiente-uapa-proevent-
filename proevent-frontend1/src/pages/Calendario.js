// ============================================================
// COMPONENTE: Calendario (VERSIÓN AVANZADA PREMIUM)
// Pertenece a: Módulo Global / Consultas
// Propósito: Interfaz visual de calendario FullCalendar con vistas
// de Mes, Semana y Día, filtros avanzados y detalles modales.
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FiCalendar, FiFilter, FiCheckCircle, FiClock, FiMapPin, FiMonitor, FiUser, FiInfo, FiLayers, FiX } from "react-icons/fi";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function Calendario({ usuario }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCal, setLoadingCal] = useState(true);
  
  // Estados de Filtros
  const [filtroPropiedad, setFiltroPropiedad] = useState("todos"); // "todos", "mios"
  const [filtroAudiovisual, setFiltroAudiovisual] = useState("todos"); // "todos", "con_av", "sin_av"
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "Aprobado", "Pendiente", "Rechazado"
  
  // Estado para el Modal de Detalle
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const calendarRef = useRef(null);

  // Hook de Google Calendar
  const { loading: loadingGCal, authorized, checkAuthStatus, authorize, exportarEvento } = useGoogleCalendar();

  useEffect(() => {
    checkAuthStatus();
    cargarCalendario();
  }, [usuario, checkAuthStatus]);

  const cargarCalendario = async () => {
    setLoadingCal(true);
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/calendario-eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/calendario-eventos`;
      const res = await fetch(url);
      const data = await res.json();
      
      const normalized = Array.isArray(data) ? data.map(evt => {
        // Asignación de colores basada en propiedad y estado
        let bgColor = '#3b82f6'; // Azul por defecto (Otros / General)
        let borderColor = '#2563eb';
        
        if (evt.esPropio) {
          bgColor = '#8b5cf6'; // Morado para los propios
          borderColor = '#7c3aed';
        }
        
        if (evt.estado === 'Rechazado') {
          bgColor = '#ef4444'; // Rojo si está rechazado
          borderColor = '#dc2626';
        } else if (evt.estado === 'Pendiente') {
          bgColor = '#f59e0b'; // Amarillo si está pendiente
          borderColor = '#d97706';
        }

        // Combinar fecha con hora_inicio y hora_fin si existen en la BD
        let startIso = evt.start ? evt.start.substring(0, 10) : '';
        let endIso = evt.end ? evt.end.substring(0, 10) : '';

        if (evt.hora_inicio && startIso) {
          startIso = `${startIso}T${evt.hora_inicio}`;
        }
        if (evt.hora_fin && endIso) {
          endIso = `${endIso}T${evt.hora_fin}`;
        }

        // Si no tiene hora (ej: "2026-07-10" con longitud 10), FullCalendar lo toma como All Day automáticamente.
        // Como todos los eventos deberían tener hora_inicio, ya no se apilarán en Todo el Día.
        return {
          id: evt.id || evt.id_evento || Math.random().toString(),
          title: evt.title || evt.nombre,
          start: startIso,
          end: endIso,
          backgroundColor: bgColor,
          borderColor: borderColor,
          textColor: '#ffffff',
          extendedProps: { ...evt } // Guardamos todos los datos extra
        };
      }) : [];
      setCalendarEvents(normalized);
    } catch (err) {
      console.error("Error al cargar calendario:", err);
      setCalendarEvents([]);
    } finally {
      setLoadingCal(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
  };

  // --- FILTRADO EN TIEMPO REAL ---
  const filteredEvents = calendarEvents.filter(evt => {
    const props = evt.extendedProps;
    
    if (filtroPropiedad === "mios" && !props.esPropio) return false;
    
    if (filtroAudiovisual === "con_av" && !props.necesita_audiovisual) return false;
    if (filtroAudiovisual === "sin_av" && props.necesita_audiovisual) return false;
    
    if (filtroEstado !== "todos" && props.estado !== filtroEstado) return false;
    
    return true;
  });

  const totalEventos = filteredEvents.length;
  const eventosAprobados = filteredEvents.filter(e => e.extendedProps.estado === 'Aprobado').length;
  const eventosPendientes = filteredEvents.filter(e => e.extendedProps.estado === 'Pendiente').length;
  const eventosRechazados = filteredEvents.filter(e => e.extendedProps.estado === 'Rechazado').length;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '800px', gap: '24px' }}>
      
      {/* --- INYECCIÓN DE ESTILOS CSS OVERRIDES PARA FULLCALENDAR PREMIUM --- */}
      <style>
        {`
          .fc {
            font-family: 'Inter', system-ui, sans-serif !important;
            --fc-border-color: #e2e8f0; /* Borde más visible para las divisiones */
            --fc-button-text-color: #475569;
            --fc-button-bg-color: #ffffff;
            --fc-button-border-color: #e2e8f0;
            --fc-button-hover-bg-color: #f8fafc;
            --fc-button-hover-border-color: #cbd5e1;
            --fc-button-active-bg-color: #eff6ff;
            --fc-button-active-border-color: #3b82f6;
            --fc-event-border-color: transparent;
            --fc-today-bg-color: #faf5ff; /* Soft purple for UAPA/ProEvent */
          }
          /* Animaciones suaves */
          .fc-view-harness {
            transition: height 0.3s ease;
          }
          .fc-view {
            animation: fadeIn 0.4s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fc-header-toolbar {
            margin-bottom: 24px !important;
            padding: 12px 16px;
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
            flex-wrap: wrap;
            gap: 12px;
          }
          .fc-toolbar-title {
            font-size: 22px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            text-transform: capitalize;
            letter-spacing: -0.02em;
          }
          .fc-button {
            border-radius: 10px !important;
            font-weight: 600 !important;
            text-transform: capitalize !important;
            padding: 10px 18px !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active {
            color: #2563eb !important;
            background-color: #eff6ff !important;
            border-color: #bfdbfe !important;
            box-shadow: inset 0 0 0 1px #bfdbfe, 0 4px 6px -1px rgba(59, 130, 246, 0.1) !important;
          }
          .fc-button:hover {
            transform: translateY(-1px);
          }
          .fc-theme-standard th {
            padding: 16px 0 !important;
            background: #f8fafc !important;
            color: #64748b !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            border-bottom: 2px solid #e2e8f0 !important;
          }
          
          /* Celdas del calendario */
          .fc-daygrid-day {
            transition: background-color 0.2s;
          }
          .fc-daygrid-day:hover {
            background-color: #f8fafc;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: #e2e8f0 !important;
          }
          .fc-daygrid-day-frame {
            padding: 4px !important;
          }
          .fc-daygrid-day-number {
            font-weight: 700 !important;
            color: #475569 !important;
            padding: 8px 12px !important;
            text-decoration: none !important;
            opacity: 0.8;
          }
          
          /* Destacar el día actual */
          .fc-day-today .fc-daygrid-day-number {
            color: #ffffff !important;
            font-weight: 800 !important;
            background: #3b82f6;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
            opacity: 1;
          }
          .fc-day-today {
            background-color: #eff6ff !important;
          }
          
          /* Tarjetas de eventos */
          .fc-event {
            border-radius: 8px !important;
            padding: 4px 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            cursor: pointer !important;
            margin-bottom: 4px !important;
          }
          .fc-event:hover {
            transform: translateY(-2px) scale(1.02) !important;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
            z-index: 10 !important;
          }
          .fc-event-title {
            font-weight: 600 !important;
          }
          .fc-event-time {
            font-weight: 800 !important;
            opacity: 0.9;
            margin-right: 6px;
          }
          .fc-v-event .fc-event-main-frame {
            padding: 6px;
          }
          
          /* Contenedor Premium */
          .calendar-premium-container {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            border: 1px solid #e2e8f0;
            padding: 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-height: 600px;
          }
        `}
      </style>

      {/* --- ENCABEZADO Y FILTROS --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCalendar size={24} />
            </div>
            Calendario de Eventos
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', margin: 0, fontWeight: 500 }}>
            Visualización interactiva, programación y disponibilidad de recintos de UAPA-PROEVENT.
          </p>
        </div>

        {/* Panel de Filtros */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#ffffff', padding: '10px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRight: '1px solid #e2e8f0' }}>
            <FiFilter color="#64748b" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Filtros</span>
          </div>

          <select className="saas-select" value={filtroPropiedad} onChange={(e) => setFiltroPropiedad(e.target.value)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid transparent', fontSize: '14px', color: '#0f172a', fontWeight: 600, outline: 'none', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}>
            <option value="todos">Todos los eventos</option>
            <option value="mios">Mis Eventos</option>
          </select>

          <select className="saas-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid transparent', fontSize: '14px', color: '#0f172a', fontWeight: 600, outline: 'none', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}>
            <option value="todos">Cualquier Estado</option>
            <option value="Aprobado">Solo Aprobados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Rechazado">Rechazados</option>
          </select>

          <button 
            onClick={() => {
              setFiltroPropiedad("todos");
              setFiltroEstado("todos");
              setFiltroAudiovisual("todos");
            }} 
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#64748b', fontWeight: 600, cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
          >
            <FiX size={16} /> Limpiar filtros
          </button>

          {/* Botón de Google Calendar Auth */}
          <button 
            onClick={authorized ? null : authorize}
            disabled={loadingGCal}
            style={{ 
              padding: '8px 16px', borderRadius: '10px', border: authorized ? '1px solid #a7f3d0' : '1px solid #bfdbfe', 
              fontSize: '14px', color: authorized ? '#065f46' : '#1d4ed8', fontWeight: 600, 
              cursor: authorized ? 'default' : 'pointer', background: authorized ? '#ecfdf5' : '#eff6ff', 
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' 
            }}
          >
            <FiCalendar size={16} /> {loadingGCal ? 'Cargando...' : authorized ? 'Google Calendar Vinculado' : 'Vincular Google Calendar'}
          </button>
        </div>
      </div>

      {/* --- TARJETAS DE RESUMEN --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }}>
           <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLayers size={28} /></div>
           <div><p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Eventos</p><h3 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: 800 }}>{totalEventos}</h3></div>
        </div>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }}>
           <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheckCircle size={28} /></div>
           <div><p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aprobados</p><h3 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: 800 }}>{eventosAprobados}</h3></div>
        </div>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }}>
           <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiClock size={28} /></div>
           <div><p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</p><h3 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: 800 }}>{eventosPendientes}</h3></div>
        </div>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }}>
           <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiMapPin size={28} /></div>
           <div><p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rechazados</p><h3 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: 800 }}>{eventosRechazados}</h3></div>
        </div>
      </div>

      {/* --- LEYENDA VISUAL --- */}
      <div style={{ display: 'flex', gap: '24px', padding: '16px 24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '6px', backgroundColor: '#3b82f6', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>General</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '6px', backgroundColor: '#8b5cf6', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.4)' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Mis Eventos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '6px', backgroundColor: '#f59e0b', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.4)' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Pendientes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '6px', backgroundColor: '#ef4444', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Rechazados</span>
        </div>
      </div>

      {/* --- CONTENEDOR DEL CALENDARIO --- */}
      <div className="calendar-premium-container">
        {loadingCal ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '500px' }}>
            <div className="loader" style={{ marginBottom: '20px', borderTopColor: '#3b82f6', width: '40px', height: '40px' }}></div>
            <p style={{ color: '#475569', fontWeight: 600, fontSize: '16px' }}>Sincronizando calendario institucional...</p>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día'
            }}
            locale="es"
            events={filteredEvents}
            eventClick={handleEventClick}
            contentHeight="auto"
            dayMaxEvents={4}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            allDayText="Todo el día"
          />
        )}
      </div>

      {/* --- MODAL PREMIUM DE DETALLES DEL EVENTO --- */}
      {selectedEvent && ReactDOM.createPortal(
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
          <div className="premium-modal-vaf animate-fade" style={{background: '#ffffff', width: '100%', maxWidth: '750px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderBottom: '1px solid #e2e8f0'}}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <div style={{width: '64px', height: '64px', borderRadius: '18px', background: selectedEvent.estado === 'Aprobado' ? '#dcfce7' : selectedEvent.estado === 'Rechazado' ? '#fee2e2' : '#fef3c7', color: selectedEvent.estado === 'Aprobado' ? '#16a34a' : selectedEvent.estado === 'Rechazado' ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)'}}>
                  <FiCalendar size={32} />
                </div>
                <div>
                  <h2 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em'}}>
                    {selectedEvent.nombre || selectedEvent.title}
                  </h2>
                  <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
                    <span style={{color: '#64748b', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <FiInfo /> ID: #{selectedEvent.id_evento || selectedEvent.id}
                    </span>
                    <span style={{color: '#64748b', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <FiUser /> {selectedEvent.solicitante || "Sistema"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center'}} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}>
                <FiX size={20} />
              </button>
            </div>
            
            <div style={{padding: '32px', overflowY: 'auto', background: '#fcfcfd'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                
                {/* Fechas */}
                <div style={{background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
                  <div style={{fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiClock /> Horario Programado
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#64748b', fontSize: '14px'}}>Fecha Inicio:</span>
                      <span style={{fontWeight: 700, color: '#0f172a', fontSize: '14px'}}>{selectedEvent.fecha_inicio ? selectedEvent.fecha_inicio.substring(0,10) : (selectedEvent.start ? selectedEvent.start.substring(0,10) : '')}</span>
                    </div>
                    {selectedEvent.hora_inicio && (
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{color: '#64748b', fontSize: '14px'}}>Hora Inicio:</span>
                        <span style={{fontWeight: 700, color: '#0f172a', fontSize: '14px'}}>{selectedEvent.hora_inicio.substring(0,5)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ubicación */}
                <div style={{background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
                  <div style={{fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiMapPin /> Ubicación y Logística
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#64748b', fontSize: '14px'}}>Recinto:</span>
                      <span style={{fontWeight: 700, color: '#0f172a', fontSize: '14px'}}>{selectedEvent.recinto || "Por definir"}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#64748b', fontSize: '14px'}}>Modalidad:</span>
                      <span style={{fontWeight: 700, color: '#0f172a', fontSize: '14px'}}>{selectedEvent.modalidad || "Presencial"}</span>
                    </div>
                  </div>
                </div>

                {/* Estatus */}
                <div style={{background: selectedEvent.estado === 'Aprobado' ? '#ecfdf5' : selectedEvent.estado === 'Rechazado' ? '#fef2f2' : '#fffbeb', padding: '24px', borderRadius: '16px', border: `1px solid ${selectedEvent.estado === 'Aprobado' ? '#a7f3d0' : selectedEvent.estado === 'Rechazado' ? '#fecaca' : '#fde68a'}`}}>
                  <div style={{fontSize: '13px', color: selectedEvent.estado === 'Aprobado' ? '#065f46' : selectedEvent.estado === 'Rechazado' ? '#991b1b' : '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiCheckCircle /> Estado de Aprobación
                  </div>
                  <div style={{fontSize: '24px', fontWeight: 800, color: selectedEvent.estado === 'Aprobado' ? '#16a34a' : selectedEvent.estado === 'Rechazado' ? '#dc2626' : '#d97706'}}>
                    {selectedEvent.estado || "Pendiente"}
                  </div>
                </div>

                {/* Requerimientos Extra */}
                <div style={{background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
                  <div style={{fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiMonitor /> Requerimientos
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#64748b', fontSize: '14px'}}>Audiovisual:</span>
                      <span style={{fontWeight: 700, color: selectedEvent.necesita_audiovisual ? '#8b5cf6' : '#64748b', fontSize: '14px'}}>{selectedEvent.necesita_audiovisual ? 'Requerido' : 'No'}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#64748b', fontSize: '14px'}}>Alimentos:</span>
                      <span style={{fontWeight: 700, color: '#0f172a', fontSize: '14px', textAlign: 'right', maxWidth: '60%'}}>{selectedEvent.alimentos || "Ninguno"}</span>
                    </div>
                  </div>
                </div>

                {/* Sincronización Google Calendar */}
                <div style={{background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', gridColumn: '1 / -1'}}>
                  <div style={{fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FiCalendar /> Sincronización
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{color: '#64748b', fontSize: '14px'}}>
                      {selectedEvent.google_event_id ? "Sincronizado con Google Calendar" : "No sincronizado en Google Calendar"}
                    </span>
                    <button 
                      onClick={async () => {
                        const evtId = selectedEvent.id_evento || selectedEvent.id;
                        const result = await exportarEvento(evtId);
                        if (result.success) {
                          alert('Evento exportado/actualizado en Google Calendar con éxito.');
                          cargarCalendario(); // Recargar eventos para actualizar estado
                          setSelectedEvent(null); // Cerrar modal o actualizar el actual
                        } else {
                          alert(`Error: ${result.mensaje}`);
                        }
                      }}
                      disabled={loadingGCal}
                      style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiCalendar size={16} /> 
                      {loadingGCal ? 'Procesando...' : selectedEvent.google_event_id ? 'Actualizar en GCal' : 'Exportar a GCal'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default Calendario;
