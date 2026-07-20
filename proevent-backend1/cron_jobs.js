const cron = require('node-cron');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Usando Gmail Service
  auth: { 
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS 
  }
});

const delay = ms => new Promise(res => setTimeout(res, ms));

// Exportamos una función para inicializar todos los crons
function initCronJobs(db) {
  console.log('[CRON] Iniciando programador de tareas automáticas...');

  // Ejecutar todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Ejecutando: Notificación de vencimiento de cotizaciones a 48 hrs...');
    try {
      // 1. Solicitudes que vencen en 2 días y siguen abiertas
      const [solicitudes] = await db.promise().query(`
        SELECT s.id_solicitud, s.id_tipo_servicio, e.nombre AS nombre_evento, s.fecha_limite 
        FROM solicitud_cotizacion s
        JOIN evento e ON s.id_evento = e.id_evento
        WHERE DATEDIFF(s.fecha_limite, NOW()) = 2 AND s.estado = 'Abierta'
      `);

      for (const sol of solicitudes) {
        // 2. Traer proveedores de esta categoría que AÚN NO han enviado cotización
        const [proveedores] = await db.promise().query(`
          SELECT p.correo, p.nombre_empresa 
          FROM proveedor_externo p
          WHERE p.id_tipo_servicio = ? AND p.estado = 'Activo'
          AND p.id_proveedor NOT IN (
            SELECT id_proveedor FROM cotizacion_recibida WHERE id_solicitud = ?
          )
        `, [sol.id_tipo_servicio, sol.id_solicitud]);

        // 3. Sistema de Encolado y Throttling
        for (const prov of proveedores) {
          try {
            await transporter.sendMail({
              from: '"Portal UAPA ProEvent" <no-reply@uapa.edu.do>',
              to: prov.correo,
              subject: `Aviso: Cotización próxima a vencer - ${sol.nombre_evento}`,
              html: `
                <h3>Hola, ${prov.nombre_empresa}</h3>
                <p>Te recordamos que faltan <strong>menos de 48 horas</strong> para que cierre la licitación del evento <b>${sol.nombre_evento}</b>.</p>
                <p>Ingresa al Portal de Proveedores B2B de UAPA para enviar tu cotización PDF antes de que expire el <b>${new Date(sol.fecha_limite).toLocaleString()}</b>.</p>
              `
            });
            console.log(`[Queue] Correo de recordatorio enviado a ${prov.correo}`);
          } catch (mailError) {
            console.error(`[Queue] Error enviando correo a ${prov.correo}:`, mailError);
          }
          
          // PAUSA TÁCTICA: Detiene la ejecución 2.5 segundos para no colapsar Gmail
          await delay(2500); 
        }
      }
      console.log('[CRON] Tarea de notificación completada.');
    } catch (error) {
      console.error('[CRON] Error Crítico en Cron Job:', error);
    }
  });
}

module.exports = { initCronJobs };
