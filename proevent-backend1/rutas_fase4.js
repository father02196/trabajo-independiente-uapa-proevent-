const express = require('express');
const BitacoraService = require('./services/bitacora.service');
const { AUDIT_CRITICALITY } = require('./constants/bitacora.actions');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const multer = require('multer');
const router = express.Router();
const { sendMailCentralizado } = require('./config/mailer');

// Configuración de Multer para aceptar PDFs hasta 10MB
const upload = multer({
  storage: multer.memoryStorage(), // Usamos memoria para parsear directamente sin guardar si no queremos, o podemos guardar.
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF.'));
    }
  }
});

// [REFAC] transporter removido de los parámetros, ahora usa sendMailCentralizado
const { verificarToken } = require('./utils/jwtUtils');

module.exports = (db) => {

  // --- RUTAS DEL ADMINISTRADOR ---

  // 1. Crear un Proveedor (Solo Admin)
  router.post('/admin/proveedor', verificarToken, async (req, res) => {
    try {
      const { nombre_empresa, rnc_cedula, id_tipo_servicio, persona_contacto, correo, telefono, contrasena } = req.body;
      
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const contrasena_hash = await bcrypt.hash(contrasena, salt);

      const query = `
        INSERT INTO proveedor_externo 
        (nombre_empresa, rnc_cedula, id_tipo_servicio, persona_contacto, correo, telefono, contrasena_hash) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
      db.query(query, [nombre_empresa, rnc_cedula, id_tipo_servicio, persona_contacto, correo, telefono, contrasena_hash], (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'RNC o Correo ya registrado.' });
          return res.status(500).json({ error: err.message });
        }
        
        // Enviar correo de bienvenida al proveedor (opcional/ideal)
        sendMailCentralizado({
          to: correo,
          subject: 'Accesos a Portal de Proveedores - UAPA ProEvent',
          text: `Hola ${persona_contacto},\n\nSe ha creado tu cuenta en el Portal de Proveedores de la UAPA.\nCredenciales:\nCorreo: ${correo}\nContraseña: ${contrasena}\n\nPuedes ingresar en el portal.`
        }).catch(console.error);

        const id_usuario = req.headers['x-usuario-id'] || (req.user ? req.user.id : null);
        if (id_usuario) {
          BitacoraService.auditCritical({
            req, 
            accion: { code: 'CREACION_PROVEEDOR', criticality: AUDIT_CRITICALITY.CRITICAL },
            metadata: { entidad_catalogo: 'proveedor_externo', id_entidad: results.insertId, cambios: { nombre_empresa, rnc_cedula } },
            actorOverride: { id_usuario, id_rol: null, tipo_actor: 'INTERNO' },
            connection: db.promise()
          }).catch(console.error);
        }

        res.json({ message: 'Proveedor creado con éxito', id: results.insertId });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Obtener lista de proveedores (Para Admin y para disparador)
  router.get('/admin/proveedores', verificarToken, (req, res) => {
    db.query('SELECT p.*, t.nombre as categoria FROM proveedor_externo p JOIN tipo_servicio_externo t ON p.id_tipo_servicio = t.id_tipo_servicio ORDER BY p.fecha_registro DESC', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // --- Módulo: Directorio de Suplidores | Función: Editar Proveedor ---
  router.put('/admin/proveedor/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { nombre_empresa, rnc_cedula, id_tipo_servicio, persona_contacto, correo, telefono } = req.body;
    const query = `
      UPDATE proveedor_externo 
      SET nombre_empresa = ?, rnc_cedula = ?, id_tipo_servicio = ?, persona_contacto = ?, correo = ?, telefono = ? 
      WHERE id_proveedor = ?
    `;
    db.query(query, [nombre_empresa, rnc_cedula, id_tipo_servicio, persona_contacto, correo, telefono, id], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'RNC o Correo ya en uso por otro proveedor.' });
        return res.status(500).json({ error: err.message });
      }
      const id_usuario = req.headers['x-usuario-id'] || (req.user ? req.user.id : null);
      if (id_usuario) {
        BitacoraService.auditBestEffort({ req, accion: { code: 'ACTUALIZACION_PROVEEDOR', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: `Proveedor ID ${id} actualizado. Empresa: ${nombre_empresa}, Categoria ID: ${id_tipo_servicio}` } }, actorOverride: { id_usuario, id_rol: null, tipo_actor: 'INTERNO' } });
      }
      res.json({ message: 'Proveedor actualizado con éxito' });
    });
  });

  // --- Módulo: Directorio de Suplidores | Función: Cambiar Estado Proveedor ---
  router.put('/admin/proveedor/:id/estado', verificarToken, (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'Activo' o 'Inactivo'
    db.query('UPDATE proveedor_externo SET estado = ? WHERE id_proveedor = ?', [estado, id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const id_usuario = req.headers['x-usuario-id'] || (req.user ? req.user.id : null);
      if (id_usuario) {
        BitacoraService.auditBestEffort({ req, accion: { code: 'CAMBIO_ESTADO_PROVEEDOR', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: `Proveedor ID ${id} marcado como ${estado}` } }, actorOverride: { id_usuario, id_rol: null, tipo_actor: 'INTERNO' } });
      }
      res.json({ message: `Proveedor marcado como ${estado}` });
    });
  });


  // 2.1 Crear Solicitud de Cotización (RF-22: Envío automatizado a Proveedores)
  router.post('/admin/solicitud-cotizacion', verificarToken, (req, res) => {
    const { id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite } = req.body;
    db.query(
      'INSERT INTO solicitud_cotizacion (id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite) VALUES (?, ?, ?, ?)',
      [id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // --- TRIGGER RF-22: NOTIFICACIÓN A PROVEEDORES DEL MISMO TIPO ---
        db.query('SELECT nombre FROM evento WHERE id_evento = ?', [id_evento], (errEv, evRes) => {
          db.query('SELECT correo, nombre_empresa FROM proveedor_externo WHERE id_tipo_servicio = ? AND estado = "Activo"', [id_tipo_servicio], (errProv, provRes) => {
            if (!errEv && !errProv && evRes.length > 0 && provRes.length > 0) {
              const eventoNombre = evRes[0].nombre;
              
              provRes.forEach(proveedor => {
                if (proveedor.correo) {
                  // [REFAC] Usando sendMailCentralizado de config/mailer.js
                  sendMailCentralizado({
                    to: proveedor.correo,
                    subject: `Nueva Oportunidad de Negocio - UAPA ProEvent`,
                    html: `
                      <h3>Hola ${proveedor.nombre_empresa},</h3>
                      <p>Se ha abierto una nueva licitación que coincide con tu categoría de servicio para el evento <strong>${eventoNombre}</strong>.</p>
                      <p><strong>Detalles requeridos:</strong> ${descripcion_requerimientos}</p>
                      <p><strong>Fecha Límite:</strong> ${new Date(fecha_limite).toLocaleDateString()}</p>
                      <br>
                      <p>Puedes enviar tu cotización a través de nuestro <a href="http://localhost:3000/licitaciones">Portal de Proveedores B2B</a>.</p>
                      <br><p>Atentamente,<br>Departamento de Compras UAPA</p>
                    `
                  }).catch(err => console.error('Error enviando notificación B2B:', err));
                }
              });
            }
          });
        });

        const id_usuario = req.headers['x-usuario-id'] || (req.user ? req.user.id : null);
        if (id_usuario) {
          BitacoraService.auditBestEffort({
            req, 
            accion: { code: 'SOLICITUD_SERVICIO_EXTERNO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
            metadata: { entidad_catalogo: 'solicitud_cotizacion', id_entidad: results.insertId, cambios: { id_evento, descripcion_requerimientos } },
            actorOverride: { id_usuario, id_rol: null, tipo_actor: 'INTERNO' }
          });
        }

        res.json({ message: 'Solicitud abierta y notificaciones enviadas a proveedores.', id: results.insertId });
      }
    );
  });

  // --- RUTAS PÚBLICAS B2B ---
  
  router.get('/licitaciones-abiertas', (req, res) => {
    db.query(`
      SELECT s.*, e.nombre as nombre_evento, t.nombre as categoria_servicio
      FROM solicitud_cotizacion s
      JOIN evento e ON s.id_evento = e.id_evento
      JOIN tipo_servicio_externo t ON s.id_tipo_servicio = t.id_tipo_servicio
      WHERE s.estado = 'Abierta' AND s.fecha_limite >= CURDATE()
      ORDER BY s.fecha_creacion DESC
    `, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // --- RUTAS DEL PROVEEDOR ---

  // 3. Login de Proveedor
  router.post('/proveedor/login', (req, res) => {
    const { correo, contrasena } = req.body;
    db.query('SELECT * FROM proveedor_externo WHERE correo = ?', [correo], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) {
        BitacoraService.auditBestEffort({
          req, accion: { code: 'LOGIN_FALLIDO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
          metadata: { correoIntentado: correo, razon: 'No encontrado' },
          actorOverride: { tipo_actor: 'ANONIMO' }
        });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const proveedor = results[0];
      const validPassword = await bcrypt.compare(contrasena, proveedor.contrasena_hash);
      
      if (!validPassword) {
        BitacoraService.auditBestEffort({
          req, accion: { code: 'LOGIN_FALLIDO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
          metadata: { correoIntentado: correo, razon: 'Contraseña incorrecta' },
          actorOverride: { id_proveedor: proveedor.id_proveedor, tipo_actor: 'PROVEEDOR' }
        });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      if (proveedor.estado !== 'Activo') {
        BitacoraService.auditBestEffort({
          req, accion: { code: 'LOGIN_FALLIDO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
          metadata: { correoIntentado: correo, razon: 'Cuenta inactiva' },
          actorOverride: { id_proveedor: proveedor.id_proveedor, tipo_actor: 'PROVEEDOR' }
        });
        return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' });
      }

      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('./utils/jwtUtils');
      const tokenPayload = {
        id_proveedor: proveedor.id_proveedor,
        id_tipo: proveedor.id_tipo_servicio,
        nombre: proveedor.nombre_empresa,
        tipo_usuario: 'proveedor'
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
      
      res.cookie('accessToken', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 });

      BitacoraService.auditCritical({
        req, 
        accion: { code: 'LOGIN_EXITOSO', criticality: AUDIT_CRITICALITY.CRITICAL },
        metadata: { portal: 'B2B', proveedor_nombre: proveedor.nombre_empresa },
        actorOverride: { id_proveedor: proveedor.id_proveedor, tipo_actor: 'PROVEEDOR' },
        connection: db.promise()
      }).catch(console.error);

      res.json({ message: 'Login exitoso', proveedor: { id: proveedor.id_proveedor, nombre: proveedor.nombre_empresa, id_tipo: proveedor.id_tipo_servicio } });
    });
  });

  // --- RESTABLECIMIENTO DE CONTRASEÑA DE PROVEEDOR ---

  router.post('/proveedor/solicitar-restablecimiento', (req, res) => {
    const { correo } = req.body;
    db.query('SELECT id_proveedor FROM proveedor_externo WHERE correo = ?', [correo], (err, results) => {
      if (err) return res.status(500).json({ mensaje: 'Error de base de datos' });
      if (results.length === 0) return res.status(404).json({ mensaje: 'El correo no está registrado como proveedor' });

      const token = crypto.randomBytes(32).toString('hex');

      db.query(
        'INSERT INTO restablecimiento_token (correo, token, expiracion) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
        [correo, token],
        (errInsert) => {
          if (errInsert) return res.status(500).json({ mensaje: 'Error al generar el token' });

          const link = `http://localhost:3000/proveedor/reset-password/${token}`;

          const mailOptions = {
            from: `"ProEvent Suplidores" <${process.env.GMAIL_USER}>`,
            to: correo,
            subject: 'Restablecer tu contraseña de Proveedor - ProEvent UAPA',
            html: `
              <div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 40px 20px 20px 20px;">
                      <img src="cid:logoproevent" alt="Logo ProEvent" style="max-width: 200px; height: auto;" />
                    </td>
                  </tr>
                  <!-- Content Section -->
                  <tr>
                    <td style="padding: 0 40px 20px 40px;">
                      <h2 style="color: #1e3a5f; text-align: center; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Recuperación de Contraseña</h2>
                      <p style="font-size: 16px; margin: 0 0 20px 0; color: #4a4a4a;">Hola, hemos recibido una solicitud para restablecer la contraseña de la siguiente cuenta:</p>
                      
                      <!-- User Email Highlight -->
                      <div style="background-color: #f8fafc; border-left: 4px solid #f58220; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e3a5f;">
                          <span style="font-size: 18px; vertical-align: middle; margin-right: 8px;">📧</span> ${correo}
                        </p>
                      </div>

                      <!-- Info Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px; background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                        <tr>
                          <td style="padding-bottom: 10px; font-size: 14px;"><strong>&bull; Estado:</strong> <span style="color: #28a745;">Solicitud recibida</span></td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 10px; font-size: 14px;"><strong>&bull; Vigencia del enlace:</strong> 1 hora</td>
                        </tr>
                        <tr>
                          <td style="font-size: 14px;"><strong>&bull; Plataforma:</strong> UAPA-PROEVENT (Suplidores)</td>
                        </tr>
                      </table>

                      <!-- Reset Button -->
                      <div style="text-align: center; margin-bottom: 25px;">
                        <a href="${link}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Restablecer contraseña</a>
                      </div>

                      <!-- Alternative Link -->
                      <p style="font-size: 13px; color: #6c757d; text-align: center; margin: 0 0 30px 0; word-break: break-all;">
                        O copia y pega el siguiente enlace en tu navegador:<br>
                        <a href="${link}" style="color: #1e3a5f; text-decoration: underline;">${link}</a>
                      </p>

                      <!-- Warning Box -->
                      <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="30" valign="top" style="font-size: 18px; padding-right: 10px;">🔒</td>
                            <td style="font-size: 14px; color: #856404; line-height: 1.5;">Si usted no solicitó este cambio, ignore este correo. Su contraseña permanecerá segura.</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <hr style="border: 0; border-top: 1px solid #e9ecef; margin: 0;">
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 30px 40px; background-color: #fdfdfd;">
                      <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #1e3a5f;">Sistema UAPA-PROEVENT</p>
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #6c757d;">Plataforma Institucional para la Gestión y Trazabilidad de Eventos y Servicios Externos</p>
                      <p style="margin: 0 0 15px 0; font-size: 12px; color: #6c757d;">Universidad Abierta para Adultos (UAPA)</p>
                      <p style="margin: 0; font-size: 12px; color: #adb5bd;">&copy; 2026 Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </div>
            `,
            attachments: [
              {
                filename: 'logo-proevent.jpeg',
                path: require('path').join(__dirname, '../proevent-frontend1/src/img/logo-proevent.jpeg'),
                cid: 'logoproevent'
              }
            ]
          };

          sendMailCentralizado(mailOptions).then(info => {
            console.log(`✅ Correo enviado a proveedor: ${correo} (ID: ${info.messageId})`);
            
            BitacoraService.auditBestEffort({
              req,
              accion: { code: 'ACTUALIZACION_PROVEEDOR', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
              metadata: { proveedor_correo: correo, detalle: 'Solicitó restablecimiento de contraseña B2B' },
              actorOverride: { tipo_actor: 'ANONIMO' }
            });

            res.json({ mensaje: 'Se ha enviado un enlace a su correo electrónico.' });
          }).catch(errMail => {
            console.error('Error enviando correo a proveedor:', errMail.message);
            return res.status(500).json({ mensaje: 'Error al enviar el correo. Intente de nuevo.' });
          });
        }
      );
    });
  });

  router.get('/proveedor/validar-token/:token', (req, res) => {
    const { token } = req.params;
    db.query(
      'SELECT correo FROM restablecimiento_token WHERE token = ? AND expiracion > NOW()',
      [token],
      (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al validar el token' });
        if (results.length === 0) return res.status(400).json({ mensaje: 'Token inválido o expirado' });
        res.json({ mensaje: 'Token válido', correo: results[0].correo });
      }
    );
  });

  router.post('/proveedor/restablecer-contrasena', async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    db.query(
      'SELECT correo FROM restablecimiento_token WHERE token = ? AND expiracion > NOW()',
      [token],
      async (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al validar el token' });
        if (results.length === 0) return res.status(400).json({ mensaje: 'Token inválido o expirado' });

        const correo = results[0].correo;
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

        db.query(
          'UPDATE proveedor_externo SET contrasena_hash = ? WHERE correo = ?',
          [hashedPassword, correo],
          (errUpdate) => {
            if (errUpdate) return res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });

            db.query('DELETE FROM restablecimiento_token WHERE correo = ?', [correo], () => {});
            
            BitacoraService.auditBestEffort({
              req,
              accion: { code: 'ACTUALIZACION_PROVEEDOR', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
              metadata: { proveedor_correo: correo, detalle: 'Completó restablecimiento de contraseña B2B' },
              actorOverride: { tipo_actor: 'PROVEEDOR' }
            });

            res.json({ mensaje: 'Contraseña actualizada con éxito' });
          }
        );
      }
    );
  });

  // 4. Ver solicitudes abiertas para su categoría
  router.get('/proveedor/:id_tipo/solicitudes', verificarToken, (req, res) => {
    if (req.user.tipo_usuario !== 'proveedor' || req.user.id_tipo.toString() !== req.params.id_tipo.toString()) {
      return res.status(403).json({ error: 'Acceso denegado a estas solicitudes' });
    }
    const id_tipo = req.params.id_tipo;
    db.query(`
      SELECT s.*, e.nombre as nombre_evento, e.fecha_inicio
      FROM solicitud_cotizacion s
      JOIN evento e ON s.id_evento = e.id_evento
      WHERE s.id_tipo_servicio = ? AND s.estado = 'Abierta'`, [id_tipo], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // 4.5 Obtener métricas del proveedor (Dashboard B2B)
  router.get('/proveedor/:id_proveedor/metricas', verificarToken, (req, res) => {
    if (req.user.tipo_usuario !== 'proveedor' || req.user.id_proveedor.toString() !== req.params.id_proveedor.toString()) {
      return res.status(403).json({ error: 'Acceso denegado a estas métricas' });
    }
    const { id_proveedor } = req.params;
    db.query(`
      SELECT 
        COUNT(*) as enviadas,
        SUM(CASE WHEN estado IN ('Subida', 'Evaluada') THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Seleccionada' THEN 1 ELSE 0 END) as ganadas
      FROM cotizacion_recibida
      WHERE id_proveedor = ?
    `, [id_proveedor], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const row = results[0];
      res.json({
        enviadas: row.enviadas || 0,
        pendientes: row.pendientes || 0,
        ganadas: row.ganadas || 0
      });
    });
  });

  // 5. Subir cotización (El proveedor envía la oferta)
  router.post('/proveedor/subir-cotizacion', upload.single('archivo_pdf'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Debe adjuntar un PDF válido menor a 10MB.' });
      
      const { id_solicitud, id_proveedor, moneda, fecha_vigencia, comentarios } = req.body;

      // 1. Guardar archivo en disco (simulado aquí, pero idealmente fs.writeFileSync)
      // Como estamos en un entorno restrictivo, usaremos el buffer para parsear, pero guardaremos un nombre simulado
      const fileName = `cotizacion_${id_solicitud}_${id_proveedor}_${Date.now()}.pdf`;
      const uploadPath = './uploads/' + fileName;
      
      if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
      fs.writeFileSync(uploadPath, req.file.buffer);

      // 2. Extraer el texto con pdf-parse para pre-procesamiento
      const data = await pdfParse(req.file.buffer);
      const rawText = data.text;

      // 3. Limpieza heurística a JSON (Simulación de Regex en Node)
      // Buscamos totales y lineas clave
      let monto_detectado = null;
      const regexTotal = /(total|monto|neto|pagar)[\s\S]{0,10}?\$?\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/gi;
      let match;
      while ((match = regexTotal.exec(rawText)) !== null) {
          // Tomamos el último monto encontrado como total
          monto_detectado = match[2].replace(/,/g, '');
      }

      // Guardamos la cotización en BD
      db.query(`
        INSERT INTO cotizacion_recibida 
        (id_solicitud, id_proveedor, moneda, fecha_vigencia, comentarios, ruta_documento_pdf, monto_total_detectado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id_solicitud, id_proveedor, moneda, fecha_vigencia, comentarios, uploadPath, monto_detectado], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        BitacoraService.auditBestEffort({
          req,
          accion: { code: 'SUBIDA_COTIZACION', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
          metadata: { entidad_catalogo: 'cotizacion_recibida', id_entidad: results.insertId, monto_detectado, moneda },
          actorOverride: { id_proveedor: id_proveedor, tipo_actor: 'PROVEEDOR' }
        });

        res.json({ message: 'Cotización subida correctamente.', monto_extraido: monto_detectado });
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Módulo: Proveedores | Función: Subir comprobante de pago/factura saldada (Fase 4 del Relevo) ---
  router.post('/admin/factura-proveedor/:id_cotizacion', upload.single('archivo_factura'), async (req, res) => {
    try {
      const { id_cotizacion } = req.params;
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo PDF.' });

      const fileName = `factura_pagada_${id_cotizacion}_${Date.now()}.pdf`;
      const uploadPath = './uploads/' + fileName;
      
      if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
      fs.writeFileSync(uploadPath, req.file.buffer);

      db.query(`UPDATE cotizacion_recibida SET factura_pdf = ?, estado_pago = 'Pagado' WHERE id_cotizacion = ?`, [uploadPath, id_cotizacion], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // AuditService: Registrar el pago
        const reqUserId = req.headers['x-usuario-id'];
        if(reqUserId) BitacoraService.auditBestEffort({ req: null, accion: { code: 'PAGO_FACTURA_B2B', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: `Se ha subido el comprobante de pago para la cotización ID ${id_cotizacion}` } }, actorOverride: { id_usuario: reqUserId, id_rol: 1, tipo_actor: 'INTERNO' } });
        
        res.json({ message: 'Factura subida y marcada como pagada correctamente.' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });


  // --- RUTAS DE INTELIGENCIA ARTIFICIAL Y LISTADO B2B (ADMIN) ---

  // Nueva ruta para obtener licitaciones ELEGIDAS (adjudicadas por el encargado) para el historial global
  router.get('/admin/licitaciones-elegidas', verificarToken, (req, res) => {
    db.query(`
      SELECT 
        se.numero_orden_compra,
        e.id_evento, e.nombre as nombre_evento, e.fecha_inicio as fecha_evento,
        cr.id_cotizacion, cr.monto_total_detectado, cr.moneda, cr.ruta_documento_pdf,
        pe.id_proveedor, pe.nombre_empresa as proveedor_nombre,
        de.id_usuario_subio as oc_id_usuario, de.fecha_subida as oc_fecha_subida,
        u.nombre as oc_nombre_usuario
      FROM servicio_externo se
      JOIN cotizacion_recibida cr ON se.id_cotizacion_adjudicada = cr.id_cotizacion
      JOIN evento e ON se.id_evento = e.id_evento
      JOIN proveedor_externo pe ON cr.id_proveedor = pe.id_proveedor
      LEFT JOIN documento_evento de ON de.numero_orden_compra = se.numero_orden_compra AND de.tipo_documento = 'Orden de Compra' AND de.estado = 'Activo'
      LEFT JOIN usuario u ON de.id_usuario_subio = u.id_usuario
      ORDER BY se.id_servicio_ext DESC
    `, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // Ruta para obtener licitaciones evaluadas por IA
  router.get('/admin/licitaciones-adjudicadas', verificarToken, (req, res) => {
    db.query(`
      SELECT a.id_analisis, a.id_solicitud, a.proveedor_recomendado_id, a.fecha_analisis, 
             s.id_evento, s.requisitos, e.nombre as nombre_evento, 
             p.nombre_empresa as proveedor_nombre,
             c.monto_total_detectado, c.estado_pago, c.id_cotizacion
      FROM analisis_ia_comparativo a
      JOIN solicitud_cotizacion s ON a.id_solicitud = s.id_solicitud
      JOIN evento e ON s.id_evento = e.id_evento
      JOIN proveedor_externo p ON a.proveedor_recomendado_id = p.id_proveedor
      LEFT JOIN cotizacion_recibida c ON a.proveedor_recomendado_id = c.id_proveedor AND a.id_solicitud = c.id_solicitud
      ORDER BY a.fecha_analisis DESC
    `, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key' // Asume que se ha puesto en .env. El dummy evita crasheo al iniciar.
  });

  router.post('/admin/evaluar-cotizaciones/:id_solicitud', verificarToken, async (req, res) => {
    const id_solicitud = req.params.id_solicitud;

    // 1. Obtener todas las cotizaciones de esta solicitud
    db.query(`
      SELECT c.*, p.nombre_empresa 
      FROM cotizacion_recibida c 
      JOIN proveedor_externo p ON c.id_proveedor = p.id_proveedor 
      WHERE c.id_solicitud = ?`, [id_solicitud], async (err, cotizaciones) => {
      
      if (err) return res.status(500).json({ error: err.message });
      if (cotizaciones.length < 2) return res.status(400).json({ error: 'Se necesitan al menos 2 cotizaciones para comparar.' });

      // 2. Extraer y armar el contexto JSON limpio
      let payloadToAI = {
        solicitud_id: id_solicitud,
        ofertas: []
      };

      for (let cot of cotizaciones) {
        // En una implementación real más robusta, usaríamos el fs para volver a leer el PDF o guardar el texto
        payloadToAI.ofertas.push({
          proveedor_id: cot.id_proveedor,
          empresa: cot.nombre_empresa,
          moneda: cot.moneda,
          monto_extraido_por_node: cot.monto_total_detectado,
          comentarios_proveedor: cot.comentarios
        });
      }

      // 3. Enviar a OpenAI
      const prompt = `
        Eres un auditor de compras experto.
        Analiza el siguiente JSON con ofertas estructuradas para una solicitud de servicio.
        Compara los costos considerando la moneda (asume USD=60 DOP, EUR=65 DOP si hay diferencias).
        Devuelve tu respuesta estrictamente en JSON con este formato:
        {
          "proveedor_recomendado_id": <id>,
          "justificacion": "<razón de la elección>",
          "matriz_comparativa": [
             {"proveedor": "<nombre>", "ventajas": ["<v1>"], "desventajas": ["<d1>"], "costo_normalizado_dop": <num>}
          ]
        }
        
        Datos: ${JSON.stringify(payloadToAI)}
      `;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const veredicto = JSON.parse(aiResponse.choices[0].message.content);

        // 4. Guardar en BD
        db.query(`
          INSERT INTO analisis_ia_comparativo (id_solicitud, proveedor_recomendado_id, justificacion_ia, matriz_comparativa_json)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          proveedor_recomendado_id = VALUES(proveedor_recomendado_id),
          justificacion_ia = VALUES(justificacion_ia),
          matriz_comparativa_json = VALUES(matriz_comparativa_json)
        `, [id_solicitud, veredicto.proveedor_recomendado_id, veredicto.justificacion, JSON.stringify(veredicto.matriz_comparativa)], (errInsert) => {
          if (errInsert) return res.status(500).json({ error: errInsert.message });

          const id_usuario = req.headers['x-usuario-id'] || (req.user ? req.user.id : null);
          if (id_usuario) {
            BitacoraService.auditCritical({
              req,
              accion: { code: 'EVALUACION_COTIZACION', criticality: AUDIT_CRITICALITY.CRITICAL },
              metadata: { entidad_catalogo: 'analisis_ia_comparativo', id_entidad: id_solicitud, id_proveedor_recomendado: veredicto.proveedor_recomendado_id },
              actorOverride: { id_usuario, id_rol: null, tipo_actor: 'INTERNO' },
              connection: db.promise()
            }).catch(console.error);
          }

          res.json({ message: 'Análisis de IA completado.', veredicto });
        });

      } catch (aiError) {
        console.error('Error con OpenAI API:', aiError);
        res.status(500).json({ error: 'Error comunicándose con la IA. Verifique su OPENAI_API_KEY.', detalles: aiError.message });
      }
    });
  });

  // --- Módulo: Gestión de Categorías | Funciones CRUD ---
  router.get('/admin/categorias-servicio', (req, res) => {
    db.query('SELECT * FROM tipo_servicio_externo ORDER BY id_tipo_servicio ASC', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  router.post('/admin/categorias-servicio', (req, res) => {
    const { nombre, clasificacion } = req.body;
    db.query('INSERT INTO tipo_servicio_externo (nombre, clasificacion) VALUES (?, ?)', [nombre, clasificacion || 'Corriente'], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      BitacoraService.auditBestEffort({
        req, accion: { code: 'CREACION_CATALOGO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
        metadata: { cambios: { legacyDetalles: `Categoría creada: ${nombre}` } }
      });
      res.json({ message: 'Categoría creada', id: results.insertId });
    });
  });

  router.put('/admin/categorias-servicio/:id', (req, res) => {
    const { nombre, clasificacion } = req.body;
    db.query('UPDATE tipo_servicio_externo SET nombre = ?, clasificacion = ? WHERE id_tipo_servicio = ?', [nombre, clasificacion, req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      BitacoraService.auditBestEffort({
        req, accion: { code: 'ACTUALIZACION_CATALOGO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
        metadata: { cambios: { legacyDetalles: `Categoría ID ${req.params.id} actualizada: ${nombre}` } }
      });
      res.json({ message: 'Categoría actualizada' });
    });
  });

  router.put('/admin/categorias-servicio/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE tipo_servicio_externo SET estado = ? WHERE id_tipo_servicio = ?', [estado, req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      BitacoraService.auditBestEffort({
        req, accion: { code: 'ACTUALIZACION_CATALOGO', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
        metadata: { cambios: { legacyDetalles: `Estado de Categoría ID ${req.params.id} cambiado a: ${estado}` } }
      });
      res.json({ message: `Categoría marcada como ${estado}` });
    });
  });

  return router;
};
