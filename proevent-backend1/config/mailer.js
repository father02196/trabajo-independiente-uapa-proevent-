const nodemailer = require('nodemailer');
require('dotenv').config();

// Variables de entorno para Gmail
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

let transporter = null;

// Validación no bloqueante en arranque
if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn('⚠️  [ADVERTENCIA]: Faltan credenciales GMAIL_USER o GMAIL_PASS en el entorno (.env).');
  console.warn('⚠️  El sistema arrancará, pero el envío de correos fallará si se invoca.');
} else {
  // Instanciación única global (Singleton)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });
}

/**
 * Función centralizada para enviar correos usando la cuenta institucional.
 * Evita hardcodear el correo remitente en los controladores.
 * 
 * @param {Object} mailOptions Objeto con los parámetros del correo (to, subject, text, html, etc.)
 * @returns {Promise}
 */
const sendMailCentralizado = async (mailOptions) => {
  if (!transporter) {
    throw new Error('El servicio de correos no está configurado (faltan credenciales SMTP).');
  }

  // Si no viene un 'from' explícito, inyectamos el centralizado
  if (!mailOptions.from) {
    mailOptions.from = `"ProEvent UAPA" <${GMAIL_USER}>`;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendMailCentralizado,
  getTransporter: () => transporter // Exportado por si algún módulo estricto necesita la instancia pura
};
