// ============================================================
// COMPONENTE: Calendario (VERSIÓN AVANZADA PREMIUM)
// Pertenece a: Módulo Global / Consultas
// Propósito: Interfaz visual de calendario FullCalendar con vistas
// de Mes, Semana y Día, filtros avanzados y detalles modales.
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FiCalendar, FiFilter, FiCheckCircle, FiClock, FiMapPin, FiMonitor, FiUser, FiInfo } from "react-icons/fi";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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

  useEffect(() => {
    cargarCalendario();
  }, [usuario]);

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

        // Si el evento tiene horas específicas, las combinamos con la fecha para FullCalendar
        let startIso = evt.start;
        let endIso = evt.end;
        if (evt.hora_inicio && evt.start.length <= 10) {
           startIso = `${evt.start.substring(0,10)}T${evt.hora_inicio}`;
        }
        if (evt.hora_fin && evt.end && evt.end.length <= 10) {
           endIso = `${evt.end.substring(0,10)}T${evt.hora_fin}`;
        }

        return {
          id: evt.id_evento,
          title: evt.title || evt.nombre,
          start: startIso,
          end: endIso,
          allDay: !evt.hora_inicio,
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

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '800px' }}>
      
      {/* --- INYECCIÓN DE ESTILOS CSS OVERRIDES PARA FULLCALENDAR PREMIUM --- */}
      <style>
        {`
          .fc {
            font-family: 'Inter', sans-serif !important;
            --fc-border-color: #e2e8f0;
            --fc-button-text-color: #475569;
            --fc-button-bg-color: #ffffff;
            --fc-button-border-color: #cbd5e1;
            --fc-button-hover-bg-color: #f8fafc;
            --fc-button-hover-border-color: #94a3b8;
            --fc-button-active-bg-color: #eff6ff;
            --fc-button-active-border-color: #3b82f6;
            --fc-event-border-color: transparent;
            --fc-today-bg-color: #f0fdf4;
          }
          .fc-header-toolbar {
            margin-bottom: 24px !important;
            padding: 0 8px;
          }
          .fc-toolbar-title {
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            text-transform: capitalize;
            letter-spacing: -0.02em;
          }
          .fc-button {
            border-radius: 8px !important;
            font-weight: 600 !important;
            text-transform: capitalize !important;
            padding: 8px 16px !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          }
          .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active {
            color: #2563eb !important;
            background-color: #eff6ff !important;
            border-color: #bfdbfe !important;
            box-shadow: inset 0 0 0 1px #bfdbfe !important;
          }
          .fc-theme-standard th {
            padding: 12px 0 !important;
            background: #f8fafc !important;
            color: #475569 !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            border-bottom: 2px solid #e2e8f0 !important;
          }
          .fc-daygrid-day-number {
            font-weight: 600 !important;
            color: #475569 !important;
            padding: 8px !important;
            text-decoration: none !important;
          }
          .fc-day-today .fc-daygrid-day-number {
            color: #16a34a !important;
            font-weight: 800 !important;
            background: #dcfce7;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px;
          }
          .fc-event {
            border-radius: 6px !important;
            padding: 3px 6px !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            cursor: pointer !important;
          }
          .fc-event:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
            z-index: 10 !important;
          }
          .fc-v-event .fc-event-main-frame {
            padding: 4px;
          }
          .calendar-premium-container {
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            border: 1px solid #e2e8f0;
            padding: 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }
        `}
      </style>

      {/* --- ENCABEZADO Y FILTROS --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCalendar className="text-primary" /> Calendario Interactivo
          </h1>
          <p style={{ color: '#64748B', fontSize: '14.5px', margin: 0 }}>
            Visualización avanzada, filtros y disponibilidad de recintos.
          </p>
        </div>

        {/* Panel de Filtros */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#ffffff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', borderRight: '1px solid #e2e8f0' }}>
            <FiFilter color="#94a3b8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Filtros:</span>
          </div>

          <select className="saas-select" value={filtroPropiedad} onChange={(e) => setFiltroPropiedad(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', outline: 'none', cursor: 'pointer', background: '#f8fafc' }}>
            <option value="todos">Todos los eventos</option>
            <option value="mios">Mis Eventos</option>
          </select>

          <select className="saas-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', outline: 'none', cursor: 'pointer', background: '#f8fafc' }}>
            <option value="todos">Cualquier Estado</option>
            <option value="Aprobado">Solo Aprobados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Rechazado">Rechazados</option>
          </select>

          <select className="saas-select" value={filtroAudiovisual} onChange={(e) => setFiltroAudiovisual(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0f172a', outline: 'none', cursor: 'pointer', background: '#f8fafc' }}>
            <option value="todos">Audiovisual (Todos)</option>
            <option value="con_av">Con Requerimiento AV</option>
            <option value="sin_av">Sin Requerimiento AV</option>
          </select>
        </div>
      </div>

      {/* --- LEYENDA VISUAL --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '12px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#3b82f6' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>General</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#8b5cf6' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Mis Eventos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#f59e0b' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Pendientes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#ef4444' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Rechazados</span>
        </div>
      </div>

      {/* --- CONTENEDOR DEL CALENDARIO --- */}
      <div className="calendar-premium-container">
        {loadingCal ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
            <div className="loader" style={{ marginBottom: '16px' }}></div>
            <p style={{ color: '#64748b', fontWeight: 500 }}>Sincronizando calendario interactivo...</p>
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
            height="100%"
            dayMaxEvents={4}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
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
              <button onClick={() => setSelectedEvent(null)} style={{background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                Cerrar
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
