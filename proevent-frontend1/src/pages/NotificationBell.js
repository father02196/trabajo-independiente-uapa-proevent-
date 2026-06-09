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
 *  - onGoToEvaluacion: (eventoId?) => void   -> Solicitante: navega al form de evaluación
 *  - onGoToVisualizarEvaluaciones: () => void -> Admin: navega al historial
 *  - onGoToPoaAdmin: () => void -> Admin: navega a presupuesto POA
 */
export default function NotificationBell({ usuario, onGoToEvaluacion, onGoToVisualizarEvaluaciones, onGoToPoaAdmin }) {
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
      fetch(`${API}/eventos?usuario_id=${usuario.id_usuario}`)
        .then(r => r.json())
        .then(data => {
          const eventNotifs = [];
          if (Array.isArray(data)) {
            data.forEach(e => {
              if (e.estado === 'Aprobado') {
                eventNotifs.push({ id: `evt-apr-${e.id_evento}`, id_evento: e.id_evento, titulo: '✅ Evento Aprobado', cuerpo: `Tu evento "${e.nombre}" (#EVT-${e.id_evento}) ha sido aprobado.` });
              } else if (e.estado === 'Rechazado') {
                eventNotifs.push({ id: `evt-rej-${e.id_evento}`, id_evento: e.id_evento, titulo: '❌ Evento Rechazado', cuerpo: `Tu evento "${e.nombre}" (#EVT-${e.id_evento}) ha sido rechazado.` });
              } else if (e.estado === 'En Progreso') {
                eventNotifs.push({ id: `evt-prog-${e.id_evento}`, id_evento: e.id_evento, titulo: '🚀 Evento en Progreso', cuerpo: `Tu evento "${e.nombre}" (#EVT-${e.id_evento}) está actualmente en progreso.` });
              } else if (e.estado === 'Finalizado') {
                eventNotifs.push({ id: `evt-fin-${e.id_evento}`, id_evento: e.id_evento, titulo: '🎉 Evento finalizado', cuerpo: `Tu evento "${e.nombre}" (#EVT-${e.id_evento}) ha concluido. ¡Evalúa el servicio!` });
              }
            });
          }
          setNotifications(prev => {
             const existingIds = new Set(prev.map(p => p.id));
             const additions = eventNotifs.filter(n => !existingIds.has(n.id));
             return [...prev, ...additions];
          });
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

    if (rol === 'Administrador') {
      fetch(`${API}/eventos`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const pendientes = data.filter(e => e.estado === 'Pendiente');
            const pNotifs = pendientes.map(e => ({
              id: `evt-pend-${e.id_evento}`,
              id_evento: e.id_evento,
              titulo: '⏳ Nueva Solicitud de Evento',
              cuerpo: `El evento "${e.nombre}" (#EVT-${e.id_evento}) requiere tu revisión y aprobación.`
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

    if (rol === 'Administrador de Audiovisual' || rol === 'Audiovisual') {
      Promise.all([
        fetch(`${API}/eventos`).then(r => r.json()),
        fetch(`${API}/audiovisual`).then(r => r.json())
      ])
      .then(([eventosData, avData]) => {
         if (Array.isArray(eventosData) && Array.isArray(avData)) {
            const avPendientes = avData.filter(av => av.estado_av === 'Pendiente');
            const approvedEventsIds = new Set(eventosData.filter(e => e.estado === 'Aprobado').map(e => e.id_evento));
            const validAv = avPendientes.filter(av => approvedEventsIds.has(av.id_evento));
            const uniqueAvEvents = [...new Set(validAv.map(av => av.id_evento))];

            const avNotifs = uniqueAvEvents.map(id_evento => ({
               id: `evt-av-${id_evento}`,
               id_evento: id_evento,
               titulo: '📹 Requerimiento Audiovisual',
               cuerpo: `El evento Aprobado #EVT-${id_evento} tiene equipos audiovisuales pendientes de asignación.`
            }));

            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const additions = avNotifs.filter(n => !existingIds.has(n.id));
              return [...prev, ...additions];
            });
         }
      })
      .catch(() => {});
    }

    if (rol === 'Administrador' || rol === 'Compras' || rol === 'Direccion') {
      fetch(`${API}/api/notificaciones/cotizaciones-vencidas`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const cNotifs = data.map(c => {
              const diffDays = Math.ceil((new Date(c.fecha_vigencia) - new Date()) / (1000 * 60 * 60 * 24));
              const estado = diffDays < 0 ? 'VENCIDA' : 'próxima a vencer';
              return {
                id: `cot-${c.id_cotizacion}`,
                titulo: diffDays < 0 ? '🚨 Cotización Vencida' : '⚠️ Cotización por Vencer',
                cuerpo: `La cotización de ${c.proveedor_nombre} para el evento #EVT-${c.id_evento} está ${estado}.`,
              };
            });
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const additions = cNotifs.filter(n => !existingIds.has(n.id));
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
    
    if (notif.id.startsWith('evt-')) {
      onGoToEvaluacion && onGoToEvaluacion(notif.id_evento);
    } else if (notif.id.startsWith('eval-')) {
      onGoToVisualizarEvaluaciones && onGoToVisualizarEvaluaciones();
    } else if (notif.id.startsWith('poa-')) {
      onGoToPoaAdmin && onGoToPoaAdmin();
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
