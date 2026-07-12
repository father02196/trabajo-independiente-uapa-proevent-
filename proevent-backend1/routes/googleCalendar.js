// ============================================================
// MÓDULO: Google Calendar Integration Service
// PROYECTO: UAPA-PROEVENT
// DESCRIPCIÓN: Servicio independiente y desacoplado para sincronizar
//              eventos de UAPA-PROEVENT con Google Calendar API v3
//              mediante autenticación OAuth 2.0.
// ============================================================

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const mysql = require('mysql2');
require('dotenv').config();

// ── CONEXIÓN A BASE DE DATOS ──────────────────────────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'uapa_proevent',
  waitForConnections: true,
  connectionLimit: 10,
});

// ── CONFIGURACIÓN DEL CLIENTE OAUTH 2.0 ───────────────────────────────────────
const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/google-calendar/callback'
  );
};

// ── ALMACÉN DE TOKENS EN MEMORIA (para cuenta institucional) ──────────────────
// En producción, guardar los tokens en base de datos o archivo seguro.
let storedTokens = null;

// ── HELPER: Obtener cliente autenticado ───────────────────────────────────────
const getAuthenticatedClient = () => {
  if (!storedTokens) {
    throw new Error('NO_AUTH');
  }
  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials(storedTokens);

  // Renovar token automáticamente si está próximo a expirar
  oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      storedTokens = { ...storedTokens, ...tokens };
    }
    if (tokens.access_token) {
      storedTokens = { ...storedTokens, access_token: tokens.access_token };
    }
  });

  return oAuth2Client;
};

// ── HELPER: Construir objeto de evento para Google Calendar ───────────────────
const buildGoogleEvent = (evento) => {
  const fechaInicio = evento.fecha_inicio
    ? evento.fecha_inicio.substring(0, 10)
    : new Date().toISOString().substring(0, 10);
  const fechaFin = evento.fecha_fin
    ? evento.fecha_fin.substring(0, 10)
    : fechaInicio;

  const horaInicio = evento.hora_inicio || '08:00:00';
  const horaFin = evento.hora_fin || '10:00:00';

  const startDateTime = `${fechaInicio}T${horaInicio}`;
  const endDateTime = `${fechaFin}T${horaFin}`;

  // Construir descripción rica con datos del evento
  let description = `📋 EVENTO UAPA-PROEVENT\n\n`;
  description += `🏛️ Institución: Universidad Abierta para Adultos (UAPA)\n`;
  if (evento.tipo_evento) description += `📌 Tipo: ${evento.tipo_evento}\n`;
  if (evento.modalidad) description += `💻 Modalidad: ${evento.modalidad}\n`;
  if (evento.cantidad_asistentes) description += `👥 Asistentes: ${evento.cantidad_asistentes}\n`;
  if (evento.estado) description += `🔖 Estado: ${evento.estado}\n`;
  if (evento.dependencia) description += `🏢 Dependencia: ${evento.dependencia}\n`;
  if (evento.solicitante) description += `👤 Solicitante: ${evento.solicitante}\n`;
  if (evento.detalles_corporativos) description += `\n📝 Detalles:\n${evento.detalles_corporativos}\n`;
  if (evento.observaciones) description += `\n💬 Observaciones:\n${evento.observaciones}\n`;
  description += `\n🔗 Sistema: UAPA-PROEVENT (ID: ${evento.id_evento})`;

  const googleEvent = {
    summary: evento.nombre || 'Evento UAPA-PROEVENT',
    description,
    location: evento.recinto || evento.lugar || '',
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Santo_Domingo',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Santo_Domingo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 día antes
        { method: 'popup', minutes: 60 },        // 1 hora antes
      ],
    },
  };

  // Añadir invitados si el organizador tiene email
  if (evento.email_solicitante) {
    googleEvent.attendees = [{ email: evento.email_solicitante }];
  }

  return googleEvent;
};

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /google-calendar/auth-url
 * Genera la URL para autorizar la cuenta de Google (primer paso OAuth 2.0).
 */
router.get('/auth-url', (req, res) => {
  try {
    const oAuth2Client = createOAuthClient();
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent', // Forzar pantalla de consentimiento para obtener refresh_token
    });
    res.json({ url });
  } catch (error) {
    console.error('[GCal] Error generando auth URL:', error);
    res.status(500).json({ error: 'Error al generar URL de autorización' });
  }
});

/**
 * GET /google-calendar/callback
 * Recibe el código de autorización de Google y guarda los tokens.
 */
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Código de autorización faltante.');

  try {
    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    storedTokens = tokens;
    console.log('[GCal] ✅ Tokens OAuth guardados correctamente.');

    // Redirigir al usuario de vuelta al sistema
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?google_auth=success`);
  } catch (error) {
    console.error('[GCal] Error en callback OAuth:', error);
    res.status(500).send('Error al procesar autorización de Google.');
  }
});

/**
 * GET /google-calendar/auth-status
 * Verifica si ya hay tokens de autorización guardados.
 */
router.get('/auth-status', (req, res) => {
  res.json({ authorized: !!storedTokens });
});

/**
 * POST /google-calendar/exportar/:id
 * Crea o actualiza el evento en Google Calendar.
 * Si ya existe (google_event_id no es null), lo actualiza.
 * Si no existe, lo crea y guarda el google_event_id en la BD.
 */
router.post('/exportar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const auth = getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Obtener datos completos del evento desde la BD
    const sql = `
      SELECT
        e.id_evento, e.nombre, e.fecha_inicio, e.fecha_fin,
        e.hora_inicio, e.hora_fin, e.tipo_evento, e.modalidad,
        e.cantidad_asistentes, e.estado, e.google_event_id,
        e.detalles_corporativos, e.observaciones, e.monto_poa,
        r.nombre AS recinto,
        d.nombre AS dependencia,
        u.nombre AS solicitante, u.correo AS email_solicitante
      FROM evento e
      LEFT JOIN recinto r ON e.id_recinto = r.id_recinto
      LEFT JOIN dependencia d ON e.id_dependencia = d.id_dependencia
      LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
      WHERE e.id_evento = ?
    `;

    db.query(sql, [id], async (err, results) => {
      if (err) {
        console.error('[GCal] Error consultando evento:', err);
        return res.status(500).json({ error: 'Error al consultar el evento' });
      }
      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const evento = results[0];
      const googleEvent = buildGoogleEvent(evento);

      try {
        let googleEventId;
        let accion;

        if (evento.google_event_id) {
          // ── ACTUALIZAR evento existente en Google Calendar
          await calendar.events.update({
            calendarId,
            eventId: evento.google_event_id,
            requestBody: googleEvent,
          });
          googleEventId = evento.google_event_id;
          accion = 'actualizado';
          console.log(`[GCal] ✅ Evento ${id} actualizado en Google Calendar (${googleEventId})`);
        } else {
          // ── CREAR nuevo evento en Google Calendar
          const response = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });
          googleEventId = response.data.id;
          accion = 'creado';
          console.log(`[GCal] ✅ Evento ${id} creado en Google Calendar (${googleEventId})`);

          // Guardar google_event_id en la BD para evitar duplicados
          db.query(
            'UPDATE evento SET google_event_id = ? WHERE id_evento = ?',
            [googleEventId, id],
            (updateErr) => {
              if (updateErr) {
                console.error('[GCal] Error guardando google_event_id:', updateErr);
              }
            }
          );
        }

        res.json({
          success: true,
          accion,
          googleEventId,
          mensaje: `Evento ${accion} exitosamente en Google Calendar`,
          googleEventUrl: `https://calendar.google.com/calendar/event?eid=${Buffer.from(googleEventId).toString('base64')}`,
        });
      } catch (gCalError) {
        // Si el evento fue eliminado manualmente de Google Calendar, crear uno nuevo
        if (gCalError.code === 404 || gCalError.code === 410) {
          try {
            const response = await calendar.events.insert({
              calendarId,
              requestBody: googleEvent,
            });
            const nuevoId = response.data.id;
            db.query('UPDATE evento SET google_event_id = ? WHERE id_evento = ?', [nuevoId, id]);
            return res.json({
              success: true,
              accion: 'recreado',
              googleEventId: nuevoId,
              mensaje: 'Evento recreado en Google Calendar (el anterior fue eliminado)',
            });
          } catch (retryError) {
            console.error('[GCal] Error al recrear evento:', retryError);
            return res.status(500).json({ error: 'Error al exportar a Google Calendar' });
          }
        }
        console.error('[GCal] Error de Google Calendar API:', gCalError.message);
        return res.status(500).json({
          error: 'Error al comunicarse con Google Calendar',
          detalle: gCalError.message,
        });
      }
    });
  } catch (error) {
    if (error.message === 'NO_AUTH') {
      return res.status(401).json({
        error: 'NO_AUTORIZADO',
        mensaje: 'Debes autorizar tu cuenta de Google primero',
      });
    }
    console.error('[GCal] Error inesperado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /google-calendar/eliminar/:id
 * Elimina el evento de Google Calendar cuando se elimina del sistema.
 */
router.delete('/eliminar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const auth = getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Obtener el google_event_id del evento
    db.query(
      'SELECT google_event_id FROM evento WHERE id_evento = ?',
      [id],
      async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al consultar evento' });
        if (!results || results.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });

        const { google_event_id } = results[0];
        if (!google_event_id) {
          return res.json({ success: true, mensaje: 'El evento no tenía sincronización con Google Calendar' });
        }

        try {
          await calendar.events.delete({ calendarId, eventId: google_event_id });

          // Limpiar el google_event_id de la BD
          db.query('UPDATE evento SET google_event_id = NULL WHERE id_evento = ?', [id]);

          console.log(`[GCal] 🗑️ Evento ${id} eliminado de Google Calendar (${google_event_id})`);
          res.json({ success: true, mensaje: 'Evento eliminado de Google Calendar' });
        } catch (gCalError) {
          if (gCalError.code === 404 || gCalError.code === 410) {
            db.query('UPDATE evento SET google_event_id = NULL WHERE id_evento = ?', [id]);
            return res.json({ success: true, mensaje: 'El evento ya no existía en Google Calendar' });
          }
          throw gCalError;
        }
      }
    );
  } catch (error) {
    if (error.message === 'NO_AUTH') {
      return res.status(401).json({ error: 'NO_AUTORIZADO', mensaje: 'Debes autorizar tu cuenta de Google primero' });
    }
    console.error('[GCal] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar de Google Calendar' });
  }
});

module.exports = router;
