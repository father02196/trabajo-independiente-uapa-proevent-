import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiBell } from 'react-icons/fi';
import './../css/NotificationBell.css';

const API = 'http://localhost:8080';

/**
 * NotificationBell — Sistema real de notificaciones (Fase 3)
 * Consume el endpoint /api/notificaciones del backend para mostrar
 * alertas personalizadas por usuario y por rol, en tiempo real.
 *
 * Props:
 *  - usuario: { id_usuario, rol }
 *  - onGoToEvaluacion: (eventoId?) => void
 *  - onGoToVisualizarEvaluaciones: () => void
 *  - onGoToPoaAdmin: () => void
 */
export default function NotificationBell({ usuario, onGoToEvaluacion, onGoToVisualizarEvaluaciones, onGoToPoaAdmin }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const pollingRef = useRef(null);

  const rol = usuario?.rol;
  const id_usuario = usuario?.id_usuario;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Función para cargar notificaciones desde el backend real
  const fetchNotifications = useCallback(() => {
    if (!id_usuario && !rol) return;
    setLoading(true);
    fetch(`${API}/api/notificaciones?id_usuario=${id_usuario || ''}&rol=${encodeURIComponent(rol || '')}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id_usuario, rol]);

  // Carga inicial y polling cada 60 segundos
  useEffect(() => {
    if (!rol) return;
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(pollingRef.current);
  }, [fetchNotifications, rol]);

  // Marcar una notificación como leída en el backend y en el estado local
  const markRead = (notif) => {
    fetch(`${API}/api/notificaciones/${notif.id_notificacion}/leer`, { method: 'PUT' })
      .catch(() => {});
    setNotifications(prev => prev.filter(n => n.id_notificacion !== notif.id_notificacion));
    setOpen(false);

    // Navegar a la sección correspondiente
    const accion = notif.enlace_accion;
    if (accion === 'evaluacion') {
      onGoToEvaluacion && onGoToEvaluacion(notif.id_evento);
    } else if (accion === 'poa-admin') {
      onGoToPoaAdmin && onGoToPoaAdmin();
    } else if (accion === 'mis-evaluaciones') {
      onGoToVisualizarEvaluaciones && onGoToVisualizarEvaluaciones();
    }
  };

  // Marcar todas como leídas
  const markAllRead = () => {
    fetch(`${API}/api/notificaciones/marcar-todas-leidas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario, rol })
    }).catch(() => {});
    setNotifications([]);
  };

  // Formatear la fecha de la notificación
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (!rol) return null;

  const unreadCount = notifications.length;

  return (
    <div className="nbell-wrapper" ref={ref}>
      <button
        className="nbell-btn"
        onClick={() => {
          setOpen(o => !o);
          if (!open) fetchNotifications(); // Refresca al abrir
        }}
        title="Notificaciones"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="nbell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-drop-header">
            <span className="nbell-drop-title">Notificaciones</span>
            {unreadCount > 0 && (
              <button className="nbell-mark-all" onClick={markAllRead}>
                Marcar todas
              </button>
            )}
          </div>

          <div className="nbell-list">
            {loading && notifications.length === 0 ? (
              <div className="nbell-empty">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="nbell-empty">No tienes notificaciones nuevas</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id_notificacion}
                  className="nbell-item unread"
                  onClick={() => markRead(n)}
                >
                  <div className="nbell-item-title">{n.titulo}</div>
                  <div className="nbell-item-body">{n.cuerpo}</div>
                  <div className="nbell-item-date">{formatFecha(n.fecha)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
