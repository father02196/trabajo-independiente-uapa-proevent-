const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const multer = require('multer');
const router = express.Router();

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

module.exports = (db, transporter) => {

  // --- RUTAS DEL ADMINISTRADOR ---

  // 1. Crear un Proveedor (Solo Admin)
  router.post('/admin/proveedor', async (req, res) => {
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
        if (transporter) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Accesos a Portal de Proveedores - UAPA ProEvent',
            text: `Hola ${persona_contacto},\n\nSe ha creado tu cuenta en el Portal de Proveedores de la UAPA.\nCredenciales:\nCorreo: ${correo}\nContraseña: ${contrasena}\n\nPuedes ingresar en el portal.`
          }).catch(console.error);
        }

        res.json({ message: 'Proveedor creado con éxito', id: results.insertId });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Obtener lista de proveedores (Para Admin y para disparador)
  router.get('/admin/proveedores', (req, res) => {
    db.query('SELECT p.*, t.nombre as categoria FROM proveedor_externo p JOIN tipo_servicio_externo t ON p.id_tipo_servicio = t.id_tipo_servicio', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // 2.1 Crear Solicitud de Cotización (Activa la Mejora 3 - Notificación Interna)
  router.post('/admin/solicitud-cotizacion', (req, res) => {
    const { id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite } = req.body;
    db.query(
      'INSERT INTO solicitud_cotizacion (id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite) VALUES (?, ?, ?, ?)',
      [id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // --- TRIGGER MEJORA 3: NOTIFICACIÓN INTERNA AL ADMINISTRADOR ---
        db.query('SELECT nombre FROM evento WHERE id_evento = ?', [id_evento], (errEv, evRes) => {
          db.query('SELECT nombre FROM tipo_servicio_externo WHERE id_tipo_servicio = ?', [id_tipo_servicio], (errTs, tsRes) => {
            if (!errEv && !errTs && evRes.length > 0 && tsRes.length > 0) {
              const eventoNombre = evRes[0].nombre;
              const categoria = tsRes[0].nombre;
              
              if (transporter) {
                transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: process.env.ADMIN_EMAIL || 'admin@uapa.edu.do', // Correo del administrador u organizador
                  subject: `ALERTA: Solicitud de Proveedores (${categoria})`,
                  text: `Se requieren servicios de categoría [${categoria}] para el evento [${eventoNombre}].\n\nPor favor, contacte a los proveedores registrados en esta categoría para invitarles a subir sus cotizaciones al portal.`
                }).catch(console.error);
              }
            }
          });
        });

        res.json({ message: 'Solicitud creada y notificación interna enviada.', id: results.insertId });
      }
    );
  });

  // --- RUTAS DEL PROVEEDOR ---

  // 3. Login de Proveedor
  router.post('/proveedor/login', (req, res) => {
    const { correo, contrasena } = req.body;
    db.query('SELECT * FROM proveedor_externo WHERE correo = ?', [correo], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const proveedor = results[0];
      const validPassword = await bcrypt.compare(contrasena, proveedor.contrasena_hash);
      
      if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });
      if (proveedor.estado !== 'Activo') return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' });

      res.json({ message: 'Login exitoso', proveedor: { id: proveedor.id_proveedor, nombre: proveedor.nombre_empresa, id_tipo: proveedor.id_tipo_servicio } });
    });
  });

  // 4. Ver solicitudes abiertas para su categoría
  router.get('/proveedor/:id_tipo/solicitudes', (req, res) => {
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
        res.json({ message: 'Cotización subida correctamente.', monto_extraido: monto_detectado });
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });


  // --- RUTAS DE INTELIGENCIA ARTIFICIAL (ADMIN) ---

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key' // Asume que se ha puesto en .env. El dummy evita crasheo al iniciar.
  });

  router.post('/admin/evaluar-cotizaciones/:id_solicitud', async (req, res) => {
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
          res.json({ message: 'Análisis de IA completado.', veredicto });
        });

      } catch (aiError) {
        console.error('Error con OpenAI API:', aiError);
        res.status(500).json({ error: 'Error comunicándose con la IA. Verifique su OPENAI_API_KEY.', detalles: aiError.message });
      }
    });
  });

  return router;
};
