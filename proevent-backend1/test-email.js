require('dotenv').config();
const { sendMailCentralizado } = require('./config/mailer');

async function testEmail() {
  try {
    console.log('Probando configuración de correo...');
    console.log('Usuario:', process.env.GMAIL_USER);
    // Verificamos si la contraseña está presente (sin mostrarla completa)
    console.log('Contraseña presente:', !!process.env.GMAIL_PASS);

    const mailOptions = {
      to: process.env.GMAIL_USER, // Enviarse un correo a sí mismo
      subject: 'Prueba de conexión',
      text: 'Este es un correo de prueba.'
    };

    const info = await sendMailCentralizado(mailOptions);
    console.log('✅ Éxito:', info.messageId);
  } catch (error) {
    console.error('❌ Error de conexión Nodemailer:', error.message);
  }
}

testEmail();
