// ============================================================
// COMPONENTE: Calendario
// Pertenece a: Módulo Global / Consultas
// Propósito: Interfaz visual de calendario que muestra los eventos 
// programados. Filtra eventos según el rol del usuario (personales o globales).
// ============================================================

import React, { useState, useEffect } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function Calendario({ usuario }) {
  // --- ESTADOS ---
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCal, setLoadingCal] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    cargarCalendario();
  }, [usuario]);

  // --- FUNCIÓN: cargarCalendario ---
  // Extrae los eventos desde la base de datos y los normaliza para el calendario
  const cargarCalendario = async () => {
    setLoadingCal(true);
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/calendario-eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/calendario-eventos`;
      const res = await fetch(url);
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(evt => ({
        ...evt,
        start: evt.start ? String(evt.start).substring(0, 10) : null,
        end:   evt.end   ? String(evt.end).substring(0, 10)   : null,
      })) : [];
      setCalendarEvents(normalized);
    } catch (err) {
      console.error("Error al cargar calendario:", err);
      setCalendarEvents([]);
    } finally {
      setLoadingCal(false);
    }
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // --- FUNCIÓN: renderCalendar ---
  // Genera dinámicamente las celdas del mes con sus respectivos eventos filtrados
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter(e => e.start && e.start.startsWith(dateStr));
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px', background: isToday ? '#F8FAFC' : '#FFFFFF', display: 'flex', flexDirection: 'column', minHeight: '0' }}>
          <span className="day-number" style={{ fontWeight: '700', fontSize: '12.5px', color: isToday ? '#3B82F6' : '#64748B', alignSelf: 'flex-end', marginBottom: '4px' }}>{d}</span>
          <div className="event-indicators" style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', flex: 1 }}>
            {dayEvents.map((e, idx) => (
              <div key={idx} style={{ 
                  fontSize: '10.5px', 
                  padding: '3px 5px', 
                  borderRadius: '3px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  backgroundColor: e.esPropio ? '#DBEAFE' : '#F1F5F9',
                  color: e.esPropio ? '#1E40AF' : '#475569',
                  borderLeft: e.necesita_audiovisual ? '3px solid #8B5CF6' : '3px solid transparent',
                  fontWeight: '600'
                }} title={e.title}>
                {e.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Controles del Calendario Fuera de la Tarjeta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Título, Descripción y Leyenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Calendario de Eventos</h1>
            <p style={{ color: '#64748B', fontSize: '13.5px', margin: 0 }}>
              {usuario?.rol === "Solicitante" ? "Visualiza la programación de tus eventos y reservas." : "Visualiza la programación general de todos los eventos."}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Tus Eventos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Ocupado (Otros)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Con Audiovisual</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cuadrícula Principal (Tarjeta) — altura ajustada al contenido */}
      <div className="card" style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>

        {/* Encabezado del Mes + Navegación (dentro de la tarjeta) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <FiCalendar className="text-primary" />
            {currentDate.toLocaleString('es-DO', { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrevMonth}><FiChevronLeft /> Anterior</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleNextMonth}>Siguiente <FiChevronRight /></button>
          </div>
        </div>

        {/* Separador sutil */}
        <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '10px' }} />

        {/* Cabecera de Días de la Semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '6px' }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: '700', fontSize: '11.5px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '4px' }}>{d}</div>
          ))}
        </div>

        {/* Celdas del Calendario — filas con altura fija generosa, sin espacio sobrante */}
        {loadingCal ? (
          <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <div className="loader" style={{ marginBottom: '12px', borderColor: '#E2E8F0', borderTopColor: '#3B82F6', width: '28px', height: '28px' }}></div>
            <span style={{ fontSize: '14px' }}>Cargando calendario...</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(82px, auto)', gap: '5px' }}>
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendario;
