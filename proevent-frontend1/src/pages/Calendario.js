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
      setCalendarEvents(data);
    } catch (err) {
      console.error("Error al cargar calendario:", err);
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
      const dayEvents = calendarEvents.filter(e => e.start.startsWith(dateStr));
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <span className="day-number">{d}</span>
          <div className="event-indicators">
            {dayEvents.map((e, idx) => (
              <div key={idx} className={`event-dot ${e.esPropio ? 'mine' : 'others'} ${e.necesita_audiovisual ? 'av-req' : ''}`} title={e.title}>
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
    <div className="calendar-card">
      <style>{`
        .event-dot.av-req {
          background-color: #8b5cf6 !important;
          color: white !important;
        }
        .legend-color.av-req {
          background-color: #8b5cf6 !important;
        }
      `}</style>
      <div className="calendar-header">
        <h3><FiCalendar /> Calendario {usuario?.rol === "Solicitante" ? "Privado" : "General"} de Eventos</h3>
        <div className="calendar-controls">
          <span style={{ marginRight: '15px', fontWeight: '600', fontSize: '14px' }}>
            {currentDate.toLocaleString('es-DO', { month: 'long', year: 'numeric' }).toUpperCase()}
          </span>
          <button className="calendar-nav-btn" onClick={handlePrevMonth}><FiChevronLeft /></button>
          <button className="calendar-nav-btn" onClick={handleNextMonth}><FiChevronRight /></button>
        </div>
      </div>
      <div className="calendar-grid">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}
        {loadingCal ? (
            <div style={{ gridColumn: 'span 7', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Cargando calendario...
            </div>
        ) : renderCalendar()}
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color mine"></div>
          <span>Tus Eventos</span>
        </div>
        <div className="legend-item">
          <div className="legend-color others"></div>
          <span>Ocupado (Otros)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color av-req"></div>
          <span>Con Audiovisual</span>
        </div>
      </div>
    </div>
  );
}

export default Calendario;
