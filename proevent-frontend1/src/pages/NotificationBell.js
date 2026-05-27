import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import './../css/NotificationBell.css';

const API = 'http://localhost:8080';
const LS_KEY = 'proevent_seen_notifications';

/**
 * NotificationBell
 * 
 * Props:
 *  - usuario: { id_usuario, rol }
 *  - onGoToEvaluacion: (eventoId?) => void   → Solicitante: navega al form de evaluación
 *  - onGoToVisualizarEvaluaciones: () => void → Admin: navega al historial
 */
export default function NotificationBell({ usuario, onGoToEvaluacion, onGoToVisualizarEvaluaciones }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch { return []; }
  });
  const ref = useRef(null);

  const rol = usuario?.rol;
  const isAdmin = rol && rol !== 'Solicitante';
  const isSolicitante = rol === 'Solicitante';

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load notifications
  useEffect(() => {
    if (!rol) return;

    if (isSolicitante) {
      // Fetch finished events belonging to this user
      fetch(`${API}/eventos?usuario_id=${usuario.id_usuario}`)
        .then(r => r.json())
        .then(data => {
          const finalizados = Array.isArray(data)
            ? data.filter(e => e.estado === 'Finalizado')
            : [];
          setNotifications(finalizados.map(e => ({
            id: `evt-${e.id_evento}`,
            id_evento: e.id_evento,
            titulo: '🎉 Evento finalizado',
            cuerpo: `Tu evento "${e.nombre}" (#EVT-${e.id_evento}) ha concluido. ¡Evalúa el servicio!`,
          })));
        })
        .catch(() => {});
    }

    if (isAdmin) {
      // Fetch recent evaluations as notifications
      fetch(`${API}/evaluaciones`)
        .then(r => r.json())
        .then(data => {
          const evals = Array.isArray(data) ? data : [];
          setNotifications(prev => {
             const existingIds = new Set(prev.map(p => p.id));
             const eNotifs = evals.slice(0, 20).map(e => ({
                id: `eval-${e.id_evaluacion}`,
                id_evaluacion: e.id_evaluacion,
                titulo: '📋 Nueva evaluación recibida',
                cuerpo: `Evento "${e.nombre_evento || `#${e.id_evento}`}" fue evaluado con ${e.satisfaccion}/5 estrellas.`,
             })).filter(n => !existingIds.has(n.id));
             return [...prev, ...eNotifs];
          });
        })
        .catch(() => {});
    }

    if (rol === 'Administrador' || rol === 'Administrador V-A-F') {
      fetch(`${API}/poa`)
        .then(r => r.json())
        .then(data => {
          if (data && data.movimientos) {
            const pendientes = data.movimientos.filter(m => m.estado === 'Pendiente');
            const pNotifs = pendientes.map(m => ({
              id: `poa-${m.id_movimiento}`,
              titulo: '💰 Aprobación POA Pendiente',
              cuerpo: `El evento "#EVT-${m.id_evento}" actualizó su presupuesto por ${m.monto_solicitado_original} ${m.moneda_original || 'DOP'}.`,
            }));
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const additions = pNotifs.filter(n => !existingIds.has(n.id));
              return [...prev, ...additions];
            });
          }
        })
        .catch(() => {});
    }
  }, [rol, usuario?.id_usuario]);

  const unread = notifications.filter(n => !seenIds.includes(n.id));

  const markSeen = (id) => {
    setSeenIds(prev => {
      const next = [...new Set([...prev, id])];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markAllSeen = () => {
    const allIds = notifications.map(n => n.id);
    setSeenIds(prev => {
      const next = [...new Set([...prev, ...allIds])];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleNotifClick = (notif) => {
    markSeen(notif.id);
    setOpen(false);
    if (isSolicitante && notif.id_evento) {
      onGoToEvaluacion && onGoToEvaluacion(notif.id_evento);
    }
    if (isAdmin) {
      onGoToVisualizarEvaluaciones && onGoToVisualizarEvaluaciones();
    }
  };

  if (!rol) return null;

  return (
    <div className="nbell-wrapper" ref={ref}>
      <button
        className="nbell-btn"
        onClick={() => { setOpen(o => !o); }}
        title="Notificaciones"
      >
        <FiBell />
        {unread.length > 0 && (
          <span className="nbell-badge">{unread.length > 9 ? '9+' : unread.length}</span>
        )}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-drop-header">
            <span className="nbell-drop-title">Notificaciones</span>
            {unread.length > 0 && (
              <button className="nbell-mark-all" onClick={markAllSeen}>
                Marcar todas
              </button>
            )}
          </div>

          <div className="nbell-list">
            {notifications.length === 0 ? (
              <div className="nbell-empty">No tienes notificaciones</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nbell-item ${seenIds.includes(n.id) ? 'seen' : 'unread'}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="nbell-item-title">{n.titulo}</div>
                  <div className="nbell-item-body">{n.cuerpo}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
