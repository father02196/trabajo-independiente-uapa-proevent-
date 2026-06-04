import React, { useState, useEffect } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import './../css/Dashboard.css';

const API = "http://localhost:8080";

function Calendario({ usuario }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCal, setLoadingCal] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`} style={{ minHeight: '100px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '8px', background: isToday ? '#F8FAFC' : '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
          <span className="day-number" style={{ fontWeight: '700', fontSize: '14px', color: isToday ? '#3B82F6' : '#64748B', alignSelf: 'flex-end', marginBottom: '8px' }}>{d}</span>
          <div className="event-indicators" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
            {dayEvents.map((e, idx) => (
              <div key={idx} style={{ 
                  fontSize: '11px', 
                  padding: '4px 6px', 
                  borderRadius: '4px', 
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
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Calendario de Eventos</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>{usuario?.rol === "Solicitante" ? "Visualiza la programación de tus eventos y reservas." : "Visualiza la programación general de todos los eventos."}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FiCalendar className="text-primary" /> {currentDate.toLocaleString('es-DO', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}><FiChevronLeft /> Anterior</button>
            <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>Siguiente <FiChevronRight /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: '700', fontSize: '13px', color: '#64748B', paddingBottom: '8px' }}>{d}</div>
          ))}
          {loadingCal ? (
            <div style={{ gridColumn: 'span 7', padding: '60px', textAlign: 'center', color: '#64748B' }}>
              <div className="loader" style={{ margin: '0 auto 16px', borderColor: '#E2E8F0', borderTopColor: '#3B82F6' }}></div>
              Cargando calendario...
            </div>
          ) : renderCalendar()}
        </div>
      </div>

      <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tus Eventos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Ocupado (Otros)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}></div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Con Audiovisual</span>
        </div>
      </div>
    </div>
  );
}

export default Calendario;
