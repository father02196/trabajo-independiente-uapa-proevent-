// --- IMPORTACIONES PRINCIPALES ---
const express = require('express'); // Framework web minimalista para crear el servidor HTTP en Node.js
const mysql = require('mysql2'); // Driver para establecer y manejar conexiones con la base de datos MySQL
const cors = require('cors'); // Middleware que habilita CORS permitiendo que el Frontend (React) haga peticiones al Backend
const crypto = require('crypto'); // MÃƒÂ³dulo de criptografÃƒÂ­a nativo de Node (usado para generar tokens de contraseÃƒÂ±a)
const nodemailer = require('nodemailer'); // LibrerÃƒÂ­a estÃƒÂ¡ndar para el transporte y envÃƒÂ­o de correos electrÃƒÂ³nicos
const { OAuth2Client } = require('google-auth-library'); // SDK de Google para verificar tokens de sesiÃƒÂ³n OAuth2
const multer = require('multer'); // Middleware para el manejo de subida de archivos (multipart/form-data)
const path = require('path'); // MÃƒÂ³dulo de Node para trabajar con rutas de archivos
require('dotenv').config(); // Carga las variables de entorno almacenadas en el archivo .env al objeto process.env

// --- CONFIGURACIÃƒâ€œN DE GOOGLE OAUTH ---
const GOOGLE_CLIENT_ID = '426335318098-v39ood0lcapc22lgoq3lons62hbf507m.apps.googleusercontent.com'; // Credencial pÃƒÂºblica de la App en Google Cloud
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID); // Inicializa el cliente oficial de Google para validar inicio de sesiÃƒÂ³n

// --- CONFIGURACIÃƒâ€œN DEL SERVIDOR EXPRESS ---
const app = express(); // Instancia un nuevo servidor Express
app.use(cors()); // Se aÃƒÂ±ade el middleware global CORS a todas las rutas
app.use(express.json()); // Middleware global que parsea cualquier body JSON recibido en las peticiones entrantes

// --- MANEJO DE ERRORES DE JSON INVÃƒÂLIDO (adoptado de RM-fronters/BackendPROEVENT) ---
// Captura errores de sintaxis JSON antes de que lleguen a los manejadores de rutas
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Ã¢Å¡Â Ã¯Â¸Â  JSON invÃƒÂ¡lido recibido:', err.message); // Log del error en consola para depuraciÃƒÂ³n
    return res.status(400).json({ mensaje: 'JSON invÃƒÂ¡lido en la solicitud' }); // Respuesta controlada al cliente
  }
  next(); // Si no es un error JSON, pasa al siguiente middleware
});

// --- CONFIGURACIÃƒâ€œN DE MULTER Y GESTIÃƒâ€œN DOCUMENTAL (FASE 2) ---
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Sanitizar el nombre del archivo para evitar problemas en URLs
    const sanitizedName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    cb(null, Date.now() + '-' + sanitizedName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // LÃƒÂ­mite de 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo se aceptan PDFs o ImÃƒÂ¡genes (JPG/PNG).'));
    }
  }
});

// Exponer la carpeta de uploads para acceso estÃƒÂ¡tico
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint genÃƒÂ©rico para subir documentos
app.post('/api/documentos/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subiÃƒÂ³ ningÃƒÂºn archivo' });
  const { id_evento, tipo_documento, id_usuario_subio } = req.body;
  if (!id_evento || !tipo_documento) return res.status(400).json({ error: 'Faltan datos obligatorios' });

  const ruta_archivo = `/uploads/${req.file.filename}`;

  db.query('INSERT INTO documento_evento (id_evento, tipo_documento, nombre_archivo, ruta_archivo, id_usuario_subio) VALUES (?, ?, ?, ?, ?)',
    [id_evento, tipo_documento, req.file.originalname, ruta_archivo, id_usuario_subio || null], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Documento subido con ÃƒÂ©xito', id_documento: result.insertId, ruta_archivo });
  });
});

// Endpoint para listar documentos de un evento
app.get('/api/documentos/:id_evento', (req, res) => {
  db.query('SELECT d.*, u.nombre as usuario_nombre FROM documento_evento d LEFT JOIN usuario u ON d.id_usuario_subio = u.id_usuario WHERE d.id_evento = ? AND d.estado = "Activo" ORDER BY d.fecha_subida DESC', [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.delete('/api/documentos/:id_documento', (req, res) => {
  // En lugar de borrar fÃƒÂ­sicamente (por auditorÃƒÂ­a), marcamos como Archivado
  db.query('UPDATE documento_evento SET estado = "Archivado" WHERE id_documento = ?', [req.params.id_documento], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Documento archivado' });
  });
});

// --- CONFIGURACIÃƒâ€œN DE LA BASE DE DATOS MÃƒÅ¡LTIPLES-CONEXIONES (POOL) ---
const db = mysql.createPool({ // El Pool mantiene las conexiones vivas y las reutiliza en lugar de crear nuevas cada vez
  host: 'localhost', // DirecciÃƒÂ³n local de la base de datos
  user: 'root', // Usuario por defecto de instalaciÃƒÂ³n XAMPP/MySQL
  password: '', // Sin contraseÃƒÂ±a (por defecto de fÃƒÂ¡brica en instaladores locales)
  database: 'uapa_proevent', // El esquema lÃƒÂ³gico objetivo que debe existir en MySQL
  port: 3306, // Puerto especÃƒÂ­fico diferente al 3306 por defecto, configurado localmente
  charset: 'utf8mb4', // FORZAR CODIFICACIÃƒâ€œN UTF-8 PARA EVITAR CORRUPCIÃƒâ€œN DE ACENTOS Y EMOJIS
  waitForConnections: true, // Si todas las conexiones estÃƒÂ¡n en uso, las siguientes esperan libres en lugar de fallar
  connectionLimit: 10, // Define el nÃƒÂºmero mÃƒÂ¡ximo de conexiones para no saturar la base de datos
  queueLimit: 0 // Sin lÃƒÂ­mite en la cola de peticiones en espera (0 = infinito)
});

// Prueba de la conexiÃƒÂ³n inicial extrayendo un worker del pool de MySQL
db.getConnection((err, connection) => {
  if (err) { // EvalÃƒÂºa si ocurriÃƒÂ³ una falla en la conexiÃƒÂ³n inicial
    console.log('Error conectando a MySQL:', err); // Muestra el mensaje de error por consola
    return; // Cancela la continuaciÃƒÂ³n del flujo actual
  }
  if (connection) connection.release(); // Libera la conexiÃƒÂ³n devolviÃƒÂ©ndola al pool tras confirmar que sÃƒÂ­ funciona
  console.log('Ã¢Å“â€¦ Conectado a MySQL correctamente (Pool)'); // Notifica estado saludable por consola web/terminal

  // --- INICIALIZACIONES ESTRUCTURALES AUTOMÃƒÂTICAS ---
  // Script DDL de SQL para garantizar en caliente que la tabla de recuperaciÃƒÂ³n de clave existe siempre
  const createTokensTable = `
    CREATE TABLE IF NOT EXISTS restablecimiento_token ( -- Crea tabla solo si el esquema no la contiene
      id_token INT AUTO_INCREMENT PRIMARY KEY, -- Clave primaria que se numera sola por registro
      correo VARCHAR(120) NOT NULL, -- Columna string obligatoria para asociar el email al token
      token VARCHAR(255) NOT NULL, -- Columna string para guardar el hash encriptado
      expiracion DATETIME NOT NULL -- Marca de tiempo estricta para caducar el pin/token de seguridad
    )
  `;
  // InteracciÃƒÂ³n directa para ejecutar la creaciÃƒÂ³n preventiva de la tabla temporal de tokens
  db.query(createTokensTable, (err) => {
    if (err) console.error('Error al crear la tabla de tokens:', err); // Reporta fallo DDL si el usuario MySQL carece de permisos
    else console.log('Ã¢Å“â€¦ Tabla de tokens verificada/creada'); // Mensaje positivo validando que la tabla es funcional
  });

  // --- INICIALIZACIÃƒâ€œN DE TABLA DE EVALUACIONES ---
  // Define la estructura SQL necesaria para almacenar las evaluaciones de satisfacciÃƒÂ³n post-evento
  const createEvalTable = `
    CREATE TABLE IF NOT EXISTS evaluacion ( -- Solo crea la tabla si ÃƒÂ©sta no existe en la BD
      id_evaluacion INT AUTO_INCREMENT PRIMARY KEY, -- ID autoincremental para cada evaluaciÃƒÂ³n ÃƒÂºnica
      id_evento INT NOT NULL, -- Clave forÃƒÂ¡nea que vincula la evaluaciÃƒÂ³n con un evento especÃƒÂ­fico
      respuesta_solicitud ENUM('Si','No'), -- OpciÃƒÂ³n binaria sobre la agilidad de la respuesta
      recinto ENUM('Cibao Oriental','Nagua','Santo Domingo Oriental','Santiago'), -- UbicaciÃƒÂ³n fÃƒÂ­sica donde ocurriÃƒÂ³ el evento
      valoracion_respuesta ENUM('Muy eficiente','Excelente','Eficiente','Deficiente'), -- Escala cualitativa del servicio
      satisfaccion INT CHECK (satisfaccion BETWEEN 1 AND 5), -- Escala cuantitativa validada entre 1 y 5 estrellas
      comentario TEXT, -- Campo de texto libre para observaciones adicionales del solicitante
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP, -- Registra automÃƒÂ¡ticamente el momento exacto en que se creÃƒÂ³ la evaluaciÃƒÂ³n
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE -- Borra las evaluaciones si se borra el evento asociado (Integridad referencial estricta)
    )
  `;
  // Ejecuta la consulta de inicializaciÃƒÂ³n para la tabla de evaluaciÃƒÂ³n
  db.query(createEvalTable, (err) => {
    if (err) console.error('Error al crear la tabla de evaluaciones:', err); // Alerta en la consola de Node si falla el acceso o permisos
    else console.log('Ã¢Å“â€¦ Tabla de evaluaciones verificada/creada'); // Confirma por terminal que todo estÃƒÂ¡ en orden con el esquema
  });

  // --- INICIALIZACIÃƒâ€œN DE TABLA DE NOTIFICACIONES DEL SISTEMA ---
  const createNotifTable = `
    CREATE TABLE IF NOT EXISTS notificacion_sistema (
      id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario_destino INT NULL,
      rol_destino VARCHAR(100) NULL,
      titulo VARCHAR(255) NOT NULL,
      cuerpo TEXT NOT NULL,
      leido TINYINT(1) DEFAULT 0,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      enlace_accion VARCHAR(50) DEFAULT NULL,
      INDEX idx_usuario (id_usuario_destino),
      INDEX idx_rol (rol_destino)
    )
  `;
  db.query(createNotifTable, (err) => {
    if (err) console.error('Error al crear tabla notificacion_sistema:', err);
    else console.log('Ã¢Å“â€¦ Tabla notificacion_sistema verificada/creada');
  });
});

// --- FUNCIONES DE APOYO (HELPERS) ---
// Helper: Crear una notificaciÃƒÂ³n dirigida a un usuario especÃƒÂ­fico o a un rol completo
function crearNotificacion({ id_usuario_destino = null, rol_destino = null, titulo, cuerpo, enlace_accion = null }) {
  const sql = `INSERT INTO notificacion_sistema (id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion], (err) => {
    if (err) console.error('Error al crear notificaciÃƒÂ³n:', err.message);
  });
}

// FunciÃƒÂ³n reutilizable (Helper): Registra una acciÃƒÂ³n administrativa o del sistema en la base de datos auditable (BitÃƒÂ¡cora)
function registrarMovimiento(id_usuario, id_rol, accion, detalles = '') {
  if (!id_usuario) return; // ValidaciÃƒÂ³n de seguridad: no puede registrarse nada sin un responsable directo asociado (id_usuario)
  
  // Sub-funciÃƒÂ³n interna (Closure) que realiza la inserciÃƒÂ³n fÃƒÂ­sica real en la base de datos
  const registrar = (id_usr, id_rl) => {
    // Sentencia SQL insertando el log de forma parametrizada explÃƒÂ­cita (usando signaturas '?' para prevenir ataques de inyecciÃƒÂ³n SQL)
    const sql = 'INSERT INTO bitacora_movimiento (id_usuario, id_rol, accion, detalles) VALUES (?, ?, ?, ?)';
    db.query(sql, [id_usr, id_rl, accion, detalles], (err) => {
      // Manejo silencioso de errores para garantizar que si falla la bitÃƒÂ¡cora, NO derribe la peticiÃƒÂ³n en curso del usuario
      if (err) console.error('Error registrando bitÃƒÂ¡cora:', err); 
    });
  };

  if (!id_rol) { // Si la funciÃƒÂ³n padre fue llamada sin proveer un ID de rol, el sistema asume hacer una consulta extra para encontrarlo
    db.query('SELECT id_rol FROM usuario WHERE id_usuario = ?', [id_usuario], (err, res) => {
      if (!err && res.length > 0) registrar(id_usuario, res[0].id_rol); // Una vez obtenido de la base de datos, ejecuta el insert interno asincrÃƒÂ³nico
    });
  } else {
    registrar(id_usuario, id_rol); // Si la informaciÃƒÂ³n requerida ya estaba provista plenamente, la registra de manera inmediata y sincrÃƒÂ³nica
  }
}

// --- PROCESOS EN SEGUNDO PLANO (CRON JOBS SIMULADOS) ---
// Ã¢â€â‚¬Ã¢â€â‚¬ AUTO-FINALIZACIÃƒâ€œN DE EVENTOS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Tarea automÃƒÂ¡tica: Revisa iterativamente si algÃƒÂºn evento catalogado actualmente como 'Aprobado'
// ya dejÃƒÂ³ atrÃƒÂ¡s su fecha lÃƒÂ­mite esperada (fecha_fin) en el mundo real y lo auto-marca en tabla como 'Finalizado'.
function autoFinalizarEventos() {
  const hoy = new Date().toISOString().slice(0, 10); // Genera la cadena de texto de la fecha actual en formato ISO estricto 'YYYY-MM-DD' para comparar con MySQL

  // Consulta parametrizada para obtener los ID de todos los eventos aprobados donde la fecha de finalizaciÃƒÂ³n cronolÃƒÂ³gica general sea inferior a la de la medianoche pasada (eventos vencidos)
  const sql = `
    SELECT e.id_evento, e.nombre, e.id_usuario
    FROM evento e
    WHERE e.estado = 'Aprobado'
      AND DATE(e.fecha_fin) < ? -- Filtro restrictivo condicional evaluando si ya transcurriÃƒÂ³ en el calendario la fecha lÃƒÂ­mite
      AND NOT EXISTS (SELECT 1 FROM actividad_cronograma ac WHERE ac.id_evento = e.id_evento AND ac.estado != 'Completada')
      AND NOT EXISTS (SELECT 1 FROM servicio_externo se WHERE se.id_evento = e.id_evento AND se.estado_pago != 'Completado')
  `;

  // EjecuciÃƒÂ³n asÃƒÂ­ncrona de la consulta de letura hacia BD conectada
  db.query(sql, [hoy], (err, eventos) => {
    if (err) { // Captura si existiÃƒÂ³ error de sintaxis web u error del servidor MySQL local
      console.error('Ã¢ÂÅ’ Error en auto-finalizaciÃƒÂ³n:', err.message); // Notifica el fallo del Job iterativo en la terminal viva del administrador
      return; // Cesa y aborta la sub-ejecuciÃƒÂ³n anticipadamente de la funciÃƒÂ³n cron
    }
    if (eventos.length === 0) return; // ValidaciÃƒÂ³n de control de flujos: Si no encontrÃƒÂ³ absolutamente ningÃƒÂºn evento caducado en la bÃƒÂºsqueda, finaliza el script limpiamente en ese momento.

    const ids = eventos.map(e => e.id_evento); // Transforma en loop natural a Array los objetos y extrae ÃƒÂºnicamente todos los referenciales id_evento a la vista en un arreglo simple y plano ([1, 4, 6...])
    // Ejecuta consecuentemente una actualizaciÃƒÂ³n en masa (Bulk Operation en SQL) directamente sobre esos identificadores numÃƒÂ©ricos capturados
    db.query(
      `UPDATE evento SET estado = 'Finalizado' WHERE id_evento IN (?)`, // Reemplazamiento escalonado masivamente ordenado en un ÃƒÂºnico hilo
      [ids], // Acopla como variable ligada a la query todo el arreglo de identificantes en fila in(?) de sentencias directas
      (errUpd) => {
        if (errUpd) { // Manejador de catch de fallo secundario especÃƒÂ­fico para el intentador Update masivo
          console.error('Ã¢ÂÅ’ Error al finalizar eventos:', errUpd.message);
          return; // Destruye ciclo del updater si este fracasa
        }
        console.log(`Ã¢Å“â€¦ Auto-finalizados ${eventos.length} evento(s): IDs [${ids.join(', ')}]`); // Imprime satisfactoriamente registro de operaciÃƒÂ³n modificadora documentando tamaÃƒÂ±o impactado en consola
        
        // Ciclo secuencial interactivo para documentar uno por uno los histÃƒÂ³ricos operados en la base 
        eventos.forEach(e => {
          if (e.id_usuario) { // Garantiza seguridad asegurando que genuinamente existiÃƒÂ³ en el row el ID del originado humano
            registrarMovimiento(
              e.id_usuario, // Culpabilidad tÃƒÂ©cnica virtual auto-asignable como creador del originante inicial
              null, // Rol es null forzando auto-resolver el callback helper db para leer su row 
              'AUTO_FINALIZACION_EVENTO', // Bandera unÃƒÂ­voca clave sobre operaciÃƒÂ³n computacional sistemÃƒÂ¡tica programada
              `El evento "${e.nombre}" (ID: ${e.id_evento}) fue finalizado automÃƒÂ¡ticamente al superar su fecha de fin.` // Relato traducido plenamente legible a usuario corriente en la tabla visual de las bitÃƒÂ¡coras
            );
          }
        });
      }
    );
  });
}

// InteracciÃƒÂ³n para levantar servicios cron
autoFinalizarEventos(); // EfectÃƒÂºa una auto-revisiÃƒÂ³n instintivamente una sola vez de inmediato en el preciso microsegundo donde se habilita en RAM el servidor backend Node
setInterval(autoFinalizarEventos, 60 * 60 * 1000); // Dispara sub-rutina permanente a repetirse circular iterativamente eternamente con un plazo intermedio de 1 hora o 3600 segundos calculados matemÃƒÂ¡ticamente


// --- RUTAS DE AUTENTICACIÃƒâ€œN ---
// INICIO DE SESIÃƒâ€œN TRADICIONAL (Email y ContraseÃƒÂ±a)
app.post('/login', (req, res) => { // Define el endpoint HTTP POST para procesar credenciales nativas bajo la ruta '/login'
  const { correo, contrasena } = req.body; // Extrae descriptivamente (DesestructuraciÃƒÂ³n) los campos 'correo' y 'contrasena' del cuerpo JSON enviado por el cliente
  // Prepara la consulta para buscar en la base de datos si existe el usuario con ambos campos coincidentes
  db.query(
    `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol, u.estado
     FROM usuario u
     JOIN rol r ON u.id_rol = r.id_rol
     WHERE u.correo = ? AND u.contrasena = ?`, // Filtra los resultados usando placeholders seguros '(?)'
    [correo, contrasena], // Inyecta las variables limpias de usuario a la validaciÃƒÂ³n de base de datos
    (err, results) => { // FunciÃƒÂ³n flecha de callback (Callback) de llamada tras la ejecuciÃƒÂ³n MySQL
      if (err) return res.status(500).json({ mensaje: 'Error del servidor' }); // Retorna fallo HTTP 500 si la base de datos arrojÃƒÂ³ una excepciÃƒÂ³n tÃƒÂ©cnica 
      if (results.length === 0) { // Si el Array de resultados viene vacÃƒÂ­o significa que las credenciales no hacen "Match" (No existe el par correo/clave)
        return res.status(401).json({ mensaje: 'Correo o contraseÃƒÂ±a incorrectos' }); // Emite explÃƒÂ­citamente Rechazo de AutorizaciÃƒÂ³n (HTTP 401 Unauthorized)
      }
      const usuarioData = results[0]; // Extrae el primer (y esperado ÃƒÂºnico) registro validado desde la matriz del query
      if (usuarioData.estado === 'inactivo') {
        return res.status(403).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
      }
      res.json({ mensaje: 'Login exitoso', usuario: usuarioData }); // Entrega alegremente el payload (Datos permitidos) al framework frontend
      // Ejecuta asincrÃƒÂ³nicamente el guardado del incidente al libro de auditorÃƒÂ­as (BitÃƒÂ¡cora)
      registrarMovimiento(usuarioData.id_usuario, usuarioData.id_rol, 'LOGIN', `SesiÃƒÂ³n Inicada (Manual). Autenticado como ${usuarioData.nombre} (${correo}) bajo el rol de ${usuarioData.rol}.`);
    }
  );
});

// INICIO DE SESIÃƒâ€œN CON GOOGLE OAUTH2
app.post('/login-google', async (req, res) => { // Endpoint POST independiente destinado al servicio Third-Party Login ('/login-google')
  const { credential } = req.body; // Extrae el token encriptado que emitiÃƒÂ³ directamente el componente de Google en el frontal
  if (!credential) { // EvalÃƒÂºa de forma estricta que el intento no sea una peticiÃƒÂ³n defectuosa sin credencial lÃƒÂ³gica
    return res.status(400).json({ mensaje: 'Falta el token de Google' }); // Responde con Error HTTP 400 (Bad Request)
  }

  try { // Apertura de bloque Try-Catch global para gobernar las promesas asÃƒÂ­ncronas vulnerables a fallos lÃƒÂ³gicos
    // EnvÃƒÂ­a la firma codificada hacia las bÃƒÂ³vedas de Google remotamente para certificar criptogrÃƒÂ¡ficamente que el token sÃƒÂ­ lo fabricaron ellos y a nombre de esta App local
    const ticket = await googleClient.verifyIdToken({
      idToken: credential, // Inserta la credencial pÃƒÂºblica recuperada del front
      audience: GOOGLE_CLIENT_ID, // Compara verificando la huella originaria coincidente (Client ID oficial configurado en lÃƒÂ­neas iniciales)
    });
    const payload = ticket.getPayload(); // Desempaqueta y desencripta localmente la carga ÃƒÂºtil original enviada por los servidores robustos de Google con los datos de sesiÃƒÂ³n garantizados
    const correo = payload.email; // Rescata el correo verficado absoluto  (Propiedad 'email')

    // Ahora, realiza un chequeo intrÃƒÂ­nseco preguntando si este correo verificado externo existe empadronado positivamente dentro del software local
    db.query(
      `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol, u.estado
       FROM usuario u
       JOIN rol r ON u.id_rol = r.id_rol
       WHERE u.correo = ?`, // Busca estrictamente en columnario por correo ignorando contraseÃƒÂ±as tradicionales
      [correo], // Sustituye con el email validado internacionalmente en la red
      (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error del servidor' }); // Captura fallos directos a nivel de infraestructura de base de datos
        if (results.length === 0) { // Si el Array evaluado estÃƒÂ¡ hueco, asume tajantemente que el Google Account es vÃƒÂ¡lido pero no pertenece ni ha sido creado empleado de la instituciÃƒÂ³n local preexistente
          // Si el correo genuino devuelto por Google no existe explÃƒÂ­citamente en la base de datos MySQL local actual
          return res.status(403).json({ mensaje: 'Correo no registrado en el sistema. Contacte al administrador.' }); // Deniega sistemÃƒÂ¡ticamente el cruce de paso formalmente con Forbidden (HTTP status 403)
        }
        // Ãƒâ€°xito comprobado, el correo estÃƒÂ¡ registrado y habilitado funcionalmente
        const usuarioData = results[0]; // Captura y aparta en variable literal pura el paquete local del dependiente institucional
        if (usuarioData.estado === 'inactivo') {
          return res.status(403).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
        }
        res.json({ mensaje: 'Login exitoso', usuario: usuarioData }); // Permite entrada pasiva y le dispensa paralelamente su informaciÃƒÂ³n de acceso interior en estructura JSON al app cliente reactivo
        // Emplaza y archiva operativamente este acceso exterior exitoso de manera singular en el reporte histÃƒÂ³rico imborrable del sistema corporativo (BitÃƒÂ¡cora) 
        registrarMovimiento(usuarioData.id_usuario, usuarioData.id_rol, 'LOGIN_GOOGLE', `SesiÃƒÂ³n Inicada (Google OAuth). Autenticado como ${usuarioData.nombre} (${correo}) bajo el rol de ${usuarioData.rol}.`);
      }
    );
  } catch (error) { // Atrapa las crisis asÃƒÂ­ncronas impredecibles o exepciones latentes provenientes de la verificaciÃƒÂ³n forÃƒÂ¡nea Google en verifyIdToken() global
    console.error('Error verificando token de Google:', error); // Anuncia obligatoriamente la severidad tÃƒÂ©cnica real ocurrida en el background interno consola Nodejs
    res.status(401).json({ mensaje: 'Token de Google invÃƒÂ¡lido' }); // Emite y finÃƒÂ¡liza oficialmente devolviendo el evento de veto directo por Token corrompido, falso o flagrantemente vencido
  }
});

// --- RUTAS DE LECTURA GET (MÃƒâ€œDULO DE ADMINISTRACIÃƒâ€œN) ---
// OBTENER la lista completa de TODOS LOS USUARIOS adjuntando su denominaciÃƒÂ³n de Rol (Join)
app.get('/usuarios', (req, res) => { // Establece ruta HTTP GET universal en '/usuarios' para listados generales
  db.query( // Dispara y procesa sentencia MySQL a ejecutar 
    `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol, u.estado
     FROM usuario u
     JOIN rol r ON u.id_rol = r.id_rol`, // Une las dos entidades tabulares para traer el texto legible humano del "Rol" y no solo el ID numÃƒÂ©rico frÃƒÂ­o indexado
    (err, results) => { // FunciÃƒÂ³n anonima Callback
      if (err) return res.status(500).json({ error: err }); // Redirige en vivo un error tÃƒÂ©cnico o fallo persistente como respuesta interceptable terminal Server-error
      res.json(results); // Analiza, formatea, e hidrata masivamente en texto el conjunto compilado entregado en JSON Array para presentarlo al framework client
    }
  );
});

// OBTENER TODOS LOS HISTORIALES DE ACTIVIDAD CONTINUA (Vista principal de bitÃƒÂ¡cora referenciando movimientos y huellas completas unificadas)
app.get('/bitacora', (req, res) => { // Construye y expone la ruta vital GET '/bitacora'
  const query = `
    SELECT 
      b.id_bitacora, 
      b.id_usuario,
      u.nombre AS nombre_usuario, 
      r.nombre AS rol_usuario, 
      b.accion, 
      b.detalles, 
      b.fecha
    FROM bitacora_movimiento b
    LEFT JOIN usuario u ON b.id_usuario = u.id_usuario -- Se anexa el usuario atenuadamente y cruzando de forma holandesa parcial/izquierda para que estructuralmente no desaparezca la iteraciÃƒÂ³n original si un usuario gestor eventualmente fue permanentemente borrado del disco (Left Join DB Strategy)
    LEFT JOIN rol r ON b.id_rol = r.id_rol -- Lo mismo ocurre conceptualmente idÃƒÂ©ntico abogando la existencia perenne o nula temporal con el Rol referenciado
    ORDER BY b.fecha DESC; -- Ordena visualmente y operativamente siempre mostrando los eventos de actividad mÃƒÂ¡s frescos y transaccionales temporalmente recientes priorizados en la cima alta
  `;
  db.query(query, (err, results) => { // EfectÃƒÂºa internamente la lectura pasiva profunda del hilo MySQL
    if (err) return res.status(500).json({ error: err }); // DelegaciÃƒÂ³n estÃƒÂ¡ndar de abort failure handling
    res.json(results); // Encapsula y envÃƒÂ­a la respuesta global cruda generada por todos los registros clasificados en cascada tipo JSON Object Array al cliente virtual UI Frontend
  });
});

// OBTENER el compendio inmutable de ROLES estÃƒÂ¡ticos disponibles listos para ser usados en el engranaje del sistema (Normalmente selectores Select/Combobox Modales)
app.get('/roles', (req, res) => { // AsignaciÃƒÂ³n de Ruta simple universal '/roles'
  db.query('SELECT * FROM rol', (err, results) => { // Trae forzadamente el ÃƒÂ­ntegro universal existente desglosado localmente de la tabla incondicional 'rol'
    if (err) return res.status(500).json({ error: err }); // Retorno inminente fatal si explÃƒÂ­citamente falla todo el fetch backend
    res.json(results); // EmisiÃƒÂ³n simple nativa directa de un conjunto inactivo generalizado con opciones ÃƒÂºnicas de roles paramÃƒÂ©tricos integrales
  });
});

// --- RUTAS DE ESCRITURA Y MUTACIÃƒâ€œN ACTIVA (CRUD USUARIOS) ---
// CREAR UN NUEVO USUARIO EN PANEL ADMINISTRATIVO (MÃƒÂ©todo POST de inyecciÃƒÂ³n)
app.post('/usuarios', (req, res) => { // Asigna protocolo procedimental POST apuntado explÃƒÂ­citamente a '/usuarios'
  const { nombre, correo, contrasena, id_rol } = req.body; // Cosecha las especificaciones emitidas por el frontend a raÃƒÂ­z del formulario modal orgÃƒÂ¡nico rellenado
  if (!nombre || !correo || !contrasena || !id_rol) { // Mecanismo encriptado de control interno validacional previo estructural para proteger la BD de peticiones errÃƒÂ³neamente vacÃƒÂ­as o de origen nulo dudoso (Filtro Anti-Nulls)
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' }); // Rechaza procedencia terminantemente ante la imperativa escasez detectada de alguno de los 4 pilares informativos primordiales
  }
  db.query( // Realiza transaccionalmente un intento forzado de insercion relacional MySQL blindado asimÃƒÂ©tricamente con prepare-statement posicional ("?") para contrarrestar ataques cibernÃƒÂ©ticos elementales
    'INSERT INTO usuario (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)', 
    [nombre, correo, contrasena, id_rol], // Despliega e imbrica iterativamente la matriz natural emparejada correspondientemente a los placeholders huecos variables de la sentencia final en cadena generada
    (err, result) => {
      if (err) { // Manejador condicional iterativo estricto ramificado en base a la respuesta literal del servidor MySQL
        if (err.code === 'ER_DUP_ENTRY') { // Constata y sub-analiza comparativamente de manera explÃƒÂ­cita interna si el gestor MySQL flagrantemente detectÃƒÂ³ rebotando que el ÃƒÂ­ndice fÃƒÂ­sico fue violado en pura duplicidad prohibitiva (UNIQUE KEY interpuesta artificialmente en correo)
          return res.status(409).json({ mensaje: 'El correo ya estÃƒÂ¡ registrado' }); // Traduce diplomÃƒÂ¡ticamente el tecnicismo de backend a una respuesta cliente frontend 100% amigable y legible etiquetada con cÃƒÂ³digo de bloqueo '409 Conflict'
        }
        return res.status(500).json({ mensaje: 'Error al crear usuario', error: err }); // Redundancia y Falla genÃƒÂ©rica genÃƒÂ©rica absoluta no relacionada en esencia a factores obvios controlables (duplicados lÃƒÂ³gicos u ausencias de rellenado)
      }
      res.status(201).json({ mensaje: 'Usuario creado con ÃƒÂ©xito', id: result.insertId }); // Manifiesta veredicta positivamente Ãƒâ€°xito absoluto final emitiendo estatus de entidad forjada HTTP 201 (Created), transmitiÃƒÂ©ndole correlativamente el nuevo numÃƒÂ©rico nominal de llave primaria autogenerada MySQL finalizada satisfactoriamente (insertId referenciado)
      
      const adminId = req.headers['x-usuario-id']; // Lee proactivamente el metadato encajado Header silencioso adicional de la peticiÃƒÂ³n inyectada enviado para averiguar y destripar inteligentemente de facto a quiÃƒÂ©n (A quÃƒÂ© UUID especÃƒÂ­fico administrador) someter forzosamente a responsiva e identificar auditablemente
      if(adminId) registrarMovimiento(adminId, null, 'CREACION_USUARIO', `Registro de nuevo usuario. ID asignado: ${result.insertId}, Nombre: ${nombre}, Correo: ${correo}, Nivel de Rol ID: ${id_rol}.`); // Log histÃƒÂ³rico automÃƒÂ¡tico si hay autor rastreable
    }
  );
});

// ACTUALIZAR LOS METADATOS Y VARIABLES ATRIBUIBLES DE UN USUARIO EXISTENTE EXTERNO (MÃƒÂ©todo PUT dinÃƒÂ¡mico multi-factor)
app.put('/usuarios/:id', (req, res) => { // Genera la Ruta PUT hacia URI interna /usuarios portando y enlazando conjuntivamente un componente de parÃƒÂ¡metro referencial subyacente wildcard paramÃƒÂ©trico literal '/:id' para constatar individualizada y unitariamente inequÃƒÂ­vocamente a cual ÃƒÂºnico usuario existente se le va a castigar mutando su realidad relacional
  const { id } = req.params; // Saca, extrae e individualiza nominalmente el parÃƒÂ¡metro puro indexado integral literal forzado dentro de la URl misma HTTP enrutada al resolver la expresiÃƒÂ³n estÃƒÂ¡tica
  const { nombre, correo, contrasena, id_rol } = req.body; // Cosecha e interpreta descriptivamente la envoltura ÃƒÂºtil desde adentro profundo del cuerpo adjuntado original (body form JSON inyectado)

  if (contrasena && contrasena.trim() !== '') { // Verifica e inspecciona transversal y activamente si viajÃƒÂ³ informaciÃƒÂ³n nueva textual verÃƒÂ­dica procesable subyacente alojada intencionadamente en el espacio crudo de "contraseÃƒÂ±a", descalificando programaticamente y evadiendo de antemano el hipotÃƒÂ©tico cruce de strings artificialmente elaborados pero funcionalmente inÃƒÂºtiles no vacÃƒÂ­os (Ej. puros espacios inertes)
    db.query( // Procede a ejecutar contundentemente macro-tarea UPDATE de reemplazo incombustible en todos unificadamente y cada uno de los campos expuestos de control sistÃƒÂ©mico (Incluyendo radical y unilateralmente por ende la sobreescritura estricta sin compasiÃƒÂ³n criptogrÃƒÂ¡fica pre-hasheada en claro de la contraseÃƒÂ±a vital relacional del objetivo humano asignado en el wildcard base fundamental identificable indexadamente)
      'UPDATE usuario SET nombre = ?, correo = ?, contrasena = ?, id_rol = ? WHERE id_usuario = ?', // Plantilla query string forjada
      [nombre, correo, contrasena, id_rol, id], // Distribuye ordenadamente las facetas mutadas e ÃƒÂ­ntegras en conjunto al identificativo que asienta la mÃƒÂ©trica limitante en conjunciÃƒÂ³n resolutoria posicional a un ÃƒÂºnico respectivo sufijo unitario originario paramÃƒÂ©trico id final de lÃƒÂ­nea base condicional limitativo condicionado restrictivamente que encaja hermÃƒÂ©ticamente la ineludible condiciÃƒÂ³n inquebrantable de parada de scope operativo limitrofe totalitario (Clausula fundamental WHERE restrictiva)
      (err) => { // Funcion manejadora subyacente lambda callback
        if (err) return res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err }); // Escape prematuro por default e interrupciÃƒÂ³n forzada natural ante eventual manifestaciÃƒÂ³n fÃƒÂ­sica no controlable a eventual averÃƒÂ­a catastrofÃƒÂ­la MySQL local (Status 500 Code)
        res.json({ mensaje: 'Usuario actualizado con ÃƒÂ©xito' }); // Suministra luz verde y autorizaciÃƒÂ³n moral afirmativa generalizada con estatus 200 resolutivo estÃƒÂ¡tico exitoso pleno definitivo hacia el entorno espectral del marco renderizado componente del front end cliente terminal UI
        const adminId = req.headers['x-usuario-id']; // Inspecciona el encabezado encubierto Header intrÃƒÂ­nseco inyectado artificialmente previamenten por interceptor Intercept-Like frontend para recuperar al autor admin verazmente
        if(adminId) registrarMovimiento(adminId, null, 'ACTUALIZACION_USUARIO', `ModificaciÃƒÂ³n de Perfil. ID afectado: ${id}. Nuevos datos -> Nombre: ${nombre}, Correo: ${correo}, Rol ID: ${id_rol}. (ContraseÃƒÂ±a modificada)`); // BitÃƒÂ¡cora y libro log operativo incuestionable explÃƒÂ­cito auditado internamente en formato legible texto libre natural alertando y delatando intencionalmente cambios drÃƒÂ¡sticos inmiscuibles profundamente intrusivos e invasivos vitalmente operacionales a la infraestructura original ajena incluyendo recambio rotacional directo de credenciales de seguridad limitantes claves (contraseÃƒÂ±as mutantes reseteadas autoritariamente)
      }
    );
  } else {
    db.query(
      'UPDATE usuario SET nombre = ?, correo = ?, id_rol = ? WHERE id_usuario = ?',
      [nombre, correo, id_rol, id],
      (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err });
        res.json({ mensaje: 'Usuario actualizado con ÃƒÂ©xito' });
        const adminId = req.headers['x-usuario-id'];
        if(adminId) registrarMovimiento(adminId, null, 'ACTUALIZACION_USUARIO', `ModificaciÃƒÂ³n de Perfil. ID afectado: ${id}. Nuevos datos -> Nombre: ${nombre}, Correo: ${correo}, Rol ID: ${id_rol}. (Sin alterar contraseÃƒÂ±a)`);
      }
    );
  }
});

// ELIMINAR un usuario DE FORMA PERMANENTE (MÃƒÂ©todo DELETE destructivo)
app.delete('/usuarios/:id', (req, res) => { // Enruta peticiones Delete apuntando a un wildcard dinÃƒÂ¡mico :id discriminador 
  const { id } = req.params; // Extrae el nÃƒÂºmero identificador del segmento URL
  db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err) => { // Ejecuta sentencia irrecuperable paramÃƒÂ©trica de borrado fÃƒÂ­sico del registro en tabla 'usuario'
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err }); // Fracaso por llave forÃƒÂ¡nea atada o fallo motor MySQL
    res.json({ mensaje: 'Usuario eliminado con ÃƒÂ©xito' }); // Ãƒâ€°xito en borrado
    const adminId = req.headers['x-usuario-id']; // Identificador del autor (El administrador que presionÃƒÂ³ el botÃƒÂ³n de borrado)
    if(adminId) registrarMovimiento(adminId, null, 'ELIMINACION_USUARIO', `EliminaciÃƒÂ³n permanente de cuenta de usuario. ID del usuario erradicado: ${id}.`); // BitÃƒÂ¡cora de extrema sensibilidad para justificar la desapariciÃƒÂ³n de usuarios (Traceability total)
  });
});

// CAMBIAR ESTADO DE UN USUARIO (Activar/Desactivar)
app.put('/usuarios/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (estado !== 'activo' && estado !== 'inactivo') {
    return res.status(400).json({ mensaje: 'Estado invÃƒÂ¡lido. Debe ser activo o inactivo.' });
  }

  db.query('UPDATE usuario SET estado = ? WHERE id_usuario = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al cambiar estado del usuario', error: err });
    res.json({ mensaje: `Usuario marcado como ${estado} exitosamente` });
    
    const adminId = req.headers['x-usuario-id'];
    if (adminId) {
      registrarMovimiento(adminId, null, 'CAMBIO_ESTADO_USUARIO', `El estado del usuario con ID ${id} cambiÃƒÂ³ a: ${estado.toUpperCase()}.`);
    }
  });
});

// --- RUTAS DE CONSULTA PARA COMBOS Y BUSCADORES DE LA UI ---
// OBTENER el catÃƒÂ¡logo ÃƒÂ­ntegro de dependencias departamentales registradas en el sistema orgÃƒÂ¡nico de la UAPA
app.get('/dependencias', (req, res) => { // Endpoint genÃƒÂ©rico de lectura /dependencias
  db.query('SELECT * FROM dependencia', (err, results) => { // Lectura masiva simple del catÃƒÂ¡logo
    if (err) return res.status(500).json({ error: err }); // Fallback control de fallo base de datos
    res.json(results); // EnvÃƒÂ­a los objetos array formados
  });
});

// OBTENER la lista inamovible estructural fÃƒÂ­sica de recintos y sub-sedes universitarias
app.get('/recintos', (req, res) => { // Recurso de extracciÃƒÂ³n GET '/recintos'
  db.query('SELECT * FROM recinto', (err, results) => { // Barrido general para alimentar un Selector/Combobox
    if (err) return res.status(500).json({ error: err }); // Handler de error de base de datos
    res.json(results); // Serializa resultados a text/json
  });
});

// --- MÃƒâ€œDULO PRINCIPAL DE GESTIÃƒâ€œN DE EVENTOS (CORE EMPRESARIAL) ---
// CREAR UN NUEVO EVENTO MACRO INCLUYENDO PRESUPUESTO POA Y LOGÃƒÂSTICA COMPLEJA
app.post('/eventos', async (req, res) => { // DeclaraciÃƒÂ³n Async para el Endpoint transversal de generaciÃƒÂ³n de eventos POST
  const { // ExtracciÃƒÂ³n destructurada colosal del objeto JSON multipartito y denso que viaja del formulario del Frontend hacia el servidor Node
    nombre, modalidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
    cantidad_asistentes, tipo_evento, monto_poa, moneda,
    id_usuario, id_dependencia, id_recinto,
    detalles_corporativos, alimentos, observaciones
  } = req.body; // Volcado desde variable Request Body

  // Variables inicializadoras matemÃƒÂ¡ticas de pre-calculo en caso de requerirse coversiÃƒÂ³n divisa Extranjera -> Local (DOP)
  let tasa_cambio = 1; // Base multiplicadora natural neutra por defecto (Factor 1.0 = Peso Dominicano)
  let monto_dop = 0; // Contenedor vacÃƒÂ­o preparado para amparar el valor monetario real transformado a DOP 
  
  const montoPOA = parseFloat(monto_poa) || 0; // Extrae forzosamente y parsea estricto a tipo numÃƒÂ©rico de coma flotante la solicitud del fondo. Si llega falso/indefinido se anula a cero puro.

  try {
    const dbPromise = db.promise();

    // --- VALIDACIÃƒâ€œN DE CONFLICTO DE HORARIOS ---
    const conflictQuery = `
      SELECT id_evento, nombre 
      FROM evento 
      WHERE estado != 'Rechazado' 
        AND id_recinto = ? 
        AND (fecha_inicio <= ? AND fecha_fin >= ?)
        AND (hora_inicio < ? AND hora_fin > ?)
    `;
    const [conflictos] = await dbPromise.query(conflictQuery, [
      id_recinto, 
      fecha_fin, fecha_inicio, 
      hora_fin, hora_inicio
    ]);

    if (conflictos.length > 0) {
      return res.status(409).json({ 
        mensaje: `Existe un conflicto de horario. El recinto ya tiene programado el evento "${conflictos[0].nombre}" (#EVT-${conflictos[0].id_evento}) en esa misma fecha y hora.`
      });
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al verificar conflictos de horario', error: err.message });
  }

  // MOTOR MULTIMONEDA PARA ESTIMACIÃƒâ€œN FINANCIERA
  if (montoPOA > 0) { // Dispara la rutina cambiaria SÃƒâ€œLO si es que formalmente el usuario digitÃƒÂ³ un subsidio POA diferente a cero
    if (moneda && moneda !== 'DOP') { // Sub-evalÃƒÂºa si esa solicitud no corresponde deliberadamente a la moneda base matricial local nativa 'DOP'
      try { // Abre bloque Try-Catch para gobernar las peticiones asincrÃƒÂ³nicas a API externas sobre variables ajenas de valor cambiario global
        const fetchRes = await fetch(`https://open.er-api.com/v6/latest/${moneda}`); // Conecta con la API de Divisas para apuntando a base (Ej USD/EUR)
        const data = await fetchRes.json(); // Serializa y traduce localmente la telaraÃƒÂ±a JSON devuelta por la API bursÃƒÂ¡til
        tasa_cambio = data.rates.DOP || 1; // Localiza especÃƒÂ­ficamente la paridad de la moneda ForÃƒÂ¡nea VERSUS el Peso DOP. Si la API falla, por seguridad de redondeo regresa a 1 DOP.
      } catch (err) { // Captura de la caÃƒÂ­da de conexiÃƒÂ³n de API
        console.error("Error al obtener tasa de cambio:", err); // Expresa advertencia de error
      }
    }
    monto_dop = montoPOA * tasa_cambio; // EfectÃƒÂºa computacionalmente la conversiÃƒÂ³n multiplicativa real: Moneda Extranjera * Valor Peso DOP al dÃƒÂ­a presente y la ancla estÃƒÂ¡ticamente a la variable
  }

  // --- COMPROBACIÃƒâ€œN CONTABLE DEL PLAN OPERATIVO ANUAL (POA FISCAL) ---
  // Comprobar estrictamente si existe en vigencia temporal real un POA activo para deducir directamente y sin fallos
  let id_poa_activo = null; // Inicializa apuntador en nulo esperando asignaciÃƒÂ³n
  if (montoPOA > 0) { // Entra en este loop fiscal restrictivo si hay dinero fÃƒÂ­sico involucrado a deducir de universidad
    try {
      const dbPromise = db.promise(); // Fabrica e instancia un Wrapper de Promesas moderno sobre el pool DB de callbacks clÃƒÂ¡sico MySQL2 nativo
      // Obtiene como en un select estricto al POA matriz madre que envuelva entre sus fechas de existencia temporal al inicio perenne cronolÃƒÂ³gico de este Evento
      const [poas] = await dbPromise.query(
        "SELECT id_poa, monto_disponible FROM poa_fiscal WHERE fecha_inicio <= ? AND fecha_fin >= ? ORDER BY id_poa DESC LIMIT 1",
        [fecha_inicio, fecha_inicio] // Inyecta recursivamente la misma variable paramÃƒÂ©trica de arranque del evento
      );
      if (poas.length > 0) { // Revisa lÃƒÂ³gicamente post query si hallÃƒÂ³ ciertamente alguna cuenta contable madre capaz de auspiciar 
        id_poa_activo = poas[0].id_poa; // Asigna e ilumina afirmativamente a la variable superior nula el ID del POA fiscal matriculado 
        if (parseFloat(poas[0].monto_disponible) < monto_dop) { // Realiza confrontaciÃƒÂ³n algoritmica matemÃƒÂ¡tica: Resta hipotÃƒÂ©tica para averiguar si el saldo del POA banca alcanza para el monto solitado del Evento. 
          return res.status(400).json({ mensaje: 'Presupuesto POA insuficiente para este monto en la fecha del evento.' }); // Deniega de forma inmediata un fallo fatal cliente debido a insolvencia POA calculada en vivo
        }
      } else { // BifuraciÃƒÂ³n negativa en caso de que el universo carezca totalmente de fondo POA general 
        return res.status(400).json({ mensaje: 'No hay un aÃƒÂ±o fiscal registrado que coincida con la fecha del evento para asignar POA.' }); // Alarma la ausencia de configuraciones base POA para sostÃƒÂ©n
      }
    } catch (err) { // Evita que caiga la red
      return res.status(500).json({ mensaje: 'Error verificando POA', error: err.message }); // Falla interna de la comprobacion promise db
    }
  }

  // --- INSERCIÃƒâ€œN EN TABLA PADRE: EVENTO ---
  db.query( // Si la transacciÃƒÂ³n superÃƒÂ³ incÃƒÂ³lume las verificaciones monetarias pasadas, comienza el registro fÃƒÂ­sico vital de la solicitud cruda en evento
    `INSERT INTO evento (nombre, modalidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
      cantidad_asistentes, tipo_evento, monto_poa, moneda, id_usuario, id_dependencia, id_recinto)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Estructura un insert multi-paramÃƒÂ©trico estricto de valores
    [nombre, modalidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
      cantidad_asistentes, tipo_evento, monto_poa, moneda, id_usuario, id_dependencia, id_recinto], // Despliega la matriz asociativa estricta hacia SQL crudo nativo
    (err, result) => { // Callback lambda
      if (err) return res.status(500).json({ mensaje: 'Error al crear evento', error: err }); // Escape MySQL error
      const id_evento = result.insertId; // Recoge inmediatamente el AutoIncrement ÃƒÂºnico adjudicado a la tabla madre (Llave primaria evento)

      // --- INSERCIONES DE RELACIONES Y TABLAS HIJAS SUB-DIMENSIONADAS (RELACIONES N:M MULTIPLES) ---
      if (detalles_corporativos && detalles_corporativos.length > 0) { // EvalÃƒÂºa de existir si el usuario tildÃƒÂ³ casillas corporativas checkbox
        const valoresCorp = detalles_corporativos.map(tipo => [id_evento, tipo]); // Cosecha subarreglo asociado a cada foraneo
        db.query('INSERT INTO detalle_corporativo (id_evento, tipo) VALUES ?', [valoresCorp], () => { }); // BulkInsert array de multi-datos M:N
      }

      if (alimentos && alimentos.length > 0) { // EvalÃƒÂºa si la ui enviÃƒÂ³ lista selecta de alimentos (relaciÃƒÂ³n multijoin)
        db.query('SELECT id_alimento, nombre FROM alimento', (err2, alimentosDB) => { // Requiere urgentemente leer diccionario matriz Alimentos base de la BD (para empatar String vs Int)
          if (!err2) { // De sobrevivir el query normal
            const valores = []; // Inicializa contenedor puro
            alimentos.forEach(nombreAlimento => { // Loop sobre array ui de Strings de comida
              const encontrado = alimentosDB.find(a => a.nombre === nombreAlimento); // Ubica minuciosamente en el array extraÃƒÂ­do el Match por nombre textual
              if (encontrado) valores.push([id_evento, encontrado.id_alimento]); // Emparejando Clave forÃƒÂ¡nea de evento con Clave forÃƒÂ¡nea del alimento
            });
            if (valores.length > 0) { // Inserta final si armÃƒÂ³ data vÃƒÂ¡lida 
              db.query('INSERT INTO evento_alimento (id_evento, id_alimento) VALUES ?', [valores], () => { }); // Registra tabla conectora pivot evento_alimento
            }
          }
        });
      }

      if (observaciones && observaciones.trim() !== '') { // Filtra preventivamente descripciones largas de montaje si viajan vacÃƒÂ­as
        db.query('INSERT INTO detalle_montaje (id_evento, descripcion) VALUES (?, ?)', [id_evento, observaciones], () => { }); // Guarda comentario largo atado
      }

      // --- ACTUALIZACIÃƒâ€œN DE ESTADOS CONTABLES DINÃƒÂMICOS (SUSTRACCIÃƒâ€œN POR RESERVA FINANCIERA POA) ---
      if (montoPOA > 0 && id_poa_activo) { // Solo si hay monto y se validÃƒÂ³ exitosamente el id activo subyacente del poa fiscal vivo anual
        db.query( // Dispara transacciÃƒÂ³n a sub-tabla ledger de historial y log de rastreo financiero poa_movimiento
          `INSERT INTO poa_movimiento (id_poa, id_evento, monto_solicitado_original, moneda_original, tasa_cambio, monto_descontado_dop, estado)
           VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`, // Inyecta datos cambiarios calculados estÃƒÂ¡ticamente en este milisegundo al cambio del dÃƒÂ­a marcado 'Pendiente' hasta decisiÃƒÂ³n de los gestores
          [id_poa_activo, id_evento, montoPOA, moneda || 'DOP', tasa_cambio, monto_dop],
          (poaErr) => { // Espera respuesta asÃƒÂ­ncrona DB
            if (!poaErr) { // Y solo si no hubo fatal error de insercion en bitacora POA
               // Realiza el Descuento final FÃƒÂSICO Y MATEMÃƒÂTICO REAL de la base central sustrayendo sin compasiÃƒÂ³n el estimado para bloquear el dinero (reserva contable real en caliente UPDATE)
               db.query("UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?", [monto_dop, id_poa_activo], ()=>{}); // Deduce
            }
          }
        );
      }

      // CONCLUSIÃƒâ€œN DE MÃƒÅ¡LTIPLES HITOS INSERCIONALES EXITOSA (END)
      res.status(201).json({ mensaje: 'Evento creado con ÃƒÂ©xito', id_evento });
      const reqUserId = req.headers['x-usuario-id'] || id_usuario;
      if(reqUserId) registrarMovimiento(reqUserId, null, 'CREACION_EVENTO', `Nueva Solicitud de Evento. ID generado: ${id_evento}. TÃƒÂ­tulo: "${nombre}".`);

      // Ã¢â€â‚¬Ã¢â€â‚¬ NOTIFICACIONES FASE 1: Nueva solicitud de evento Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      // Alerta a los Administradores de Eventos para que revisen la nueva solicitud
      crearNotificacion({
        rol_destino: 'Administrador de Evento',
        titulo: 'Ã°Å¸â€œâ€¹ Nueva Solicitud de Evento',
        cuerpo: `Se recibiÃƒÂ³ una nueva solicitud de evento: "${nombre}" (#EVT-${id_evento}). Requiere revisiÃƒÂ³n y aprobaciÃƒÂ³n.`,
        enlace_accion: 'gestion-eventos'
      });
      // TambiÃƒÂ©n alerta al Administrador General
      crearNotificacion({
        rol_destino: 'Administrador',
        titulo: 'Ã°Å¸â€œâ€¹ Nueva Solicitud de Evento',
        cuerpo: `Se recibiÃƒÂ³ una nueva solicitud: "${nombre}" (#EVT-${id_evento}) pendiente de revisiÃƒÂ³n.`,
        enlace_accion: 'gestion-eventos'
      });
    }
  );
});

// Ã¢â€â‚¬Ã¢â€â‚¬ PLAN OPERATIVO ANUAL (POA) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// CREAR UN NUEVO PRESUPUESTO ANUAL POA (POST)
app.post('/poa', (req, res) => { // Declara la ruta POST '/poa'
  const { fecha_inicio, fecha_fin, monto_total } = req.body; // Extrae datos del cuerpo de solicitud 
  if (!fecha_inicio || !fecha_fin || !monto_total) return res.status(400).json({ mensaje: 'Datos incompletos.' }); // ValidaciÃƒÂ³n base de variables nulas

  const reqUserId = req.headers['x-usuario-id'] || null; // Identificar autor del movimiento 

  db.query( // Realiza la inserciÃƒÂ³n matriz del contenedor fiscal
    'INSERT INTO poa_fiscal (fecha_inicio, fecha_fin, monto_total, monto_disponible, creado_por) VALUES (?, ?, ?, ?, ?)',
    [fecha_inicio, fecha_fin, monto_total, monto_total, reqUserId], // Al nacer, el monto disponible es siempre ÃƒÂ­ntegra y matemÃƒÂ¡ticamente igual al total
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message }); // Escape en caso de error SQL
      res.status(201).json({ mensaje: 'POA Creado', id_poa: result.insertId }); // Respuesta exitosa con ID insertado
      if(reqUserId) registrarMovimiento(reqUserId, null, 'CREACION_POA', `Nuevo presupuesto POA por ${monto_total}.`); // Log bitÃƒÂ¡cora obligatoria
    }
  );
});

// OBTENER TODOS LOS PLANES POA EXISTENTES Y SUS MOVIMIENTOS HISTÃƒâ€œRICOS (GET)
app.get('/poa', (req, res) => { // Declara el endpoint de listado maestro GET '/poa'
  db.query('SELECT * FROM poa_fiscal ORDER BY fecha_inicio DESC', (err, poas) => { // Busca las carpetas contables matrices ordenadas por la mÃƒÂ¡s reciente
    if (err) return res.status(500).json({ error: err.message }); // Handlder err
    
    // Anida asincrÃƒÂ³nicamente una segunda consulta para obtener todos los sub-registros de consumiciÃƒÂ³n contable ('poa_movimiento')
    db.query(`
      SELECT m.*, e.nombre as nombre_evento, e.modalidad, e.fecha_inicio, e.fecha_fin,
             e.hora_inicio, e.hora_fin, e.cantidad_asistentes, e.tipo_evento,
             u.nombre as solicitante, r.nombre as recinto
      FROM poa_movimiento m
      JOIN evento e ON m.id_evento = e.id_evento
      LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
      LEFT JOIN recinto r ON e.id_recinto = r.id_recinto
      ORDER BY m.fecha_movimiento DESC -- Trae todo con un Left Join masivo para armar la tabla historial de egresos UI
    `, (errMov, movs) => {
      if (errMov) return res.status(500).json({ error: errMov.message }); // Fallback
      res.json({ poas, movimientos: movs }); // Responde entregando un Objeto JSON Compuesto: Array de POAs y Array de Movimientos
    });
  });
});

// ACTUALIZAR APROBACIÃƒâ€œN O RECHAZO DE UN DESCUENTO POA INDIVIDUAL (PUT)
app.put('/poa/movimiento/:id/estado', (req, res) => { // Metodo PUT apuntando a un elemento del ledger directamente
  const { id } = req.params; // Extrae ID URL param
  const { estado, motivo_rechazo } = req.body;  // Rescata el veredicto directivo ('Aprobado', 'Rechazado') y su justificaciÃƒÂ³n si la hubiese
  const reqUserId = req.headers['x-usuario-id']; // Validador autor humano en auditoria

  db.query('SELECT * FROM poa_movimiento WHERE id_movimiento = ?', [id], (err, results) => { // Lee el estado real anterior anclado en BD
    if (err || results.length === 0) return res.status(404).json({ mensaje: 'Movimiento no encontrado' }); // Validacion de no vacio
    
    const mov = results[0]; // Aparta var referencial
    if (mov.estado === estado) return res.json({ mensaje: 'Sin cambios en el estado' }); // Si el estado es identico, salta la iteracion para ahorrar recursos

    db.query('UPDATE poa_movimiento SET estado = ?, motivo_rechazo = ? WHERE id_movimiento = ?',  // Sobreescribe el log histÃƒÂ³rico contable
      [estado, motivo_rechazo || null, id],  // Pasa los parametros de justificaciÃƒÂ³n y estado nuevo
      (errUpdate) => {
        if (errUpdate) return res.status(500).json({ error: errUpdate.message }); // Fallo SQL update
        
        // MOTOR DE REINTEGRO/DEDUCCIÃƒâ€œN CONDICIONAL MULTIDIRECCIONAL (CONTABILIDAD INVERSA VIVA)
        // Si el estado anterior NO era Rechazado (Ej. Pendiente) y ahora se castiga como 'Rechazado', devolver integro el dinero a la bolsa POA
        if (estado === 'Rechazado' && mov.estado !== 'Rechazado') {
          db.query('UPDATE poa_fiscal SET monto_disponible = monto_disponible + ? WHERE id_poa = ?', [mov.monto_descontado_dop, mov.id_poa]); // Suma restauradora Update a base principal
        }
        // A la inversa: Si el estado anterior sÃƒÂ­ era Rechazado (dinero ya regresado al gran pool) y ahora por error o correciÃƒÂ©n es 'Aprobado/Pendiente', volver a restar el dinero fugazmente y bloquearlo
        else if (mov.estado === 'Rechazado' && estado !== 'Rechazado') {
          db.query('UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?', [mov.monto_descontado_dop, mov.id_poa]); // Resta deductiva Update base principal real
        }

        res.json({ mensaje: 'Estado del movimiento POA actualizado' }); // Success output client
        if(reqUserId) registrarMovimiento(reqUserId, null, 'ACTUALIZACION_POA', `Movimiento ${id} cambiado a ${estado}.`); // BitÃƒÂ¡cora audit trail
    });
  });
});
// ACTUALIZAR EVENTO EXISTENTE CRUD METADATA Y SUB-TABLAS (PUT)
app.put('/eventos/:id', async (req, res) => { // AsignaciÃƒÂ³n de Endpoint dinÃƒÂ¡mico
  const { id } = req.params; // Extrae ID target paramÃƒÂ©trico
  const { nombre, modalidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin, cantidad_asistentes, tipo_evento, id_recinto, id_dependencia, detalles_corporativos, alimentos, observaciones, monto_poa, moneda } = req.body; // Cosecha colosal json struct body
  const reqUserId = req.headers['x-usuario-id']; // Autor humano rastreable

  if (!id_recinto || !id_dependencia) { // Filtro de salvaguarda relacional ForÃƒÂ¡nea fundamental (Anti-Crash MySQL error 1048 Column cannot be null)
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios: Recinto o Dependencia.' });
  }

  try {
    const dbPromise = db.promise();

    // --- VALIDACIÃƒâ€œN DE CONFLICTO DE HORARIOS ---
    const conflictQuery = `
      SELECT id_evento, nombre 
      FROM evento 
      WHERE estado != 'Rechazado' 
        AND id_evento != ?
        AND id_recinto = ? 
        AND (fecha_inicio <= ? AND fecha_fin >= ?)
        AND (hora_inicio < ? AND hora_fin > ?)
    `;
    const [conflictos] = await dbPromise.query(conflictQuery, [
      id,
      id_recinto, 
      fecha_fin, fecha_inicio, 
      hora_fin, hora_inicio
    ]);

    if (conflictos.length > 0) {
      return res.status(409).json({ 
        mensaje: `Existe un conflicto de horario. El recinto ya tiene programado el evento "${conflictos[0].nombre}" (#EVT-${conflictos[0].id_evento}) en esa misma fecha y hora.`
      });
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al verificar conflictos de horario', error: err.message });
  }

  try {
    const dbPromise = db.promise();

    // --- PRE-CALCULO MONETARIO ---
    const montoPOA = parseFloat(monto_poa) || 0;
    let tasa_cambio = 1;
    let monto_dop = 0;

    if (montoPOA > 0) {
      if (moneda && moneda !== 'DOP') {
        try {
          const fetchRes = await fetch(`https://open.er-api.com/v6/latest/${moneda}`);
          const data = await fetchRes.json();
          tasa_cambio = data.rates.DOP || 1;
        } catch (e) {
          console.error("Error tasa cambio:", e);
        }
      }
      monto_dop = montoPOA * tasa_cambio;
    }

    // --- POA VERIFICACION PREVIA DE FONDOS Y RECONCILIACIÃƒâ€œN ---
    const [movs] = await dbPromise.query("SELECT * FROM poa_movimiento WHERE id_evento = ?", [id]);
    const movPrevio = movs.length > 0 ? movs[0] : null;
    let id_poa_activo = movPrevio ? movPrevio.id_poa : null;

    if (montoPOA > 0) {
      if (!id_poa_activo) {
        // Encontrar POA activo si no habÃƒÂ­a movimiento previo
        const [poas] = await dbPromise.query(
          "SELECT id_poa, monto_disponible FROM poa_fiscal WHERE fecha_inicio <= ? AND fecha_fin >= ? ORDER BY id_poa DESC LIMIT 1",
          [fecha_inicio, fecha_inicio]
        );
        if (poas.length > 0) {
          id_poa_activo = poas[0].id_poa;
          if (parseFloat(poas[0].monto_disponible) < monto_dop) {
            return res.status(400).json({ mensaje: 'Presupuesto POA insuficiente para este monto en la fecha del evento.' });
          }
        } else {
          return res.status(400).json({ mensaje: 'No hay un aÃƒÂ±o fiscal registrado que coincida con la fecha del evento para asignar POA.' });
        }
      } else {
        // Verificar si los fondos alcanzan asumiendo el reembolso del movimiento previo
        const [poas] = await dbPromise.query("SELECT monto_disponible FROM poa_fiscal WHERE id_poa = ?", [id_poa_activo]);
        if (poas.length > 0) {
          let fondosActuales = parseFloat(poas[0].monto_disponible);
          if (movPrevio.estado !== 'Rechazado') {
            fondosActuales += parseFloat(movPrevio.monto_descontado_dop);
          }
          if (fondosActuales < monto_dop) {
            return res.status(400).json({ mensaje: 'Presupuesto POA insuficiente para cubrir el nuevo monto solicitado.' });
          }
        }
      }
    }

    // --- ACTUALIZACION DEL EVENTO ---
    const sql = `UPDATE evento SET 
      nombre = ?, modalidad = ?, fecha_inicio = ?, fecha_fin = ?, 
      hora_inicio = ?, hora_fin = ?, cantidad_asistentes = ?, 
      tipo_evento = ?, id_recinto = ?, id_dependencia = ?,
      monto_poa = ?, moneda = ?
      WHERE id_evento = ?`;
    const params = [nombre, modalidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin, cantidad_asistentes, tipo_evento, id_recinto, id_dependencia, monto_poa, moneda, id];
    
    await dbPromise.query(sql, params);

    // --- APLICACION DE RECONCILIACION CONTABLE (POA) ---
    if (movPrevio) {
      if (movPrevio.estado !== 'Rechazado') {
        await dbPromise.query("UPDATE poa_fiscal SET monto_disponible = monto_disponible + ? WHERE id_poa = ?", [movPrevio.monto_descontado_dop, movPrevio.id_poa]);
      }
      if (montoPOA > 0) {
        await dbPromise.query("UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?", [monto_dop, movPrevio.id_poa]);
        await dbPromise.query(
          "UPDATE poa_movimiento SET monto_solicitado_original = ?, moneda_original = ?, tasa_cambio = ?, monto_descontado_dop = ?, estado = 'Pendiente', motivo_rechazo = NULL WHERE id_movimiento = ?", 
          [montoPOA, moneda || 'DOP', tasa_cambio, monto_dop, movPrevio.id_movimiento]
        );
      } else {
        await dbPromise.query("DELETE FROM poa_movimiento WHERE id_movimiento = ?", [movPrevio.id_movimiento]);
      }
    } else {
      if (montoPOA > 0 && id_poa_activo) {
        await dbPromise.query(
          `INSERT INTO poa_movimiento (id_poa, id_evento, monto_solicitado_original, moneda_original, tasa_cambio, monto_descontado_dop, estado) VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
          [id_poa_activo, id, montoPOA, moneda || 'DOP', tasa_cambio, monto_dop]
        );
        await dbPromise.query("UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?", [monto_dop, id_poa_activo]);
      }
    }

    // --- LIMPIEZA M:N --- 
    // Usamos callbacks normales para operaciones no-bloqueantes de satÃƒÂ©lites
    db.query('DELETE FROM detalle_corporativo WHERE id_evento = ?', [id], () => {
      if (detalles_corporativos && detalles_corporativos.length > 0) {
        const valoresCorp = detalles_corporativos.map(tipo => [id, tipo]);
        db.query('INSERT INTO detalle_corporativo (id_evento, tipo) VALUES ?', [valoresCorp], () => { });
      }
    });

    db.query('DELETE FROM evento_alimento WHERE id_evento = ?', [id], () => {
      if (alimentos && alimentos.length > 0) {
        db.query('SELECT id_alimento, nombre FROM alimento', (err2, alimentosDB) => {
          if (!err2) {
            const valores = [];
            alimentos.forEach(nombreAlimento => {
              const encontrado = alimentosDB.find(a => a.nombre === nombreAlimento);
              if (encontrado) valores.push([id, encontrado.id_alimento]);
            });
            if (valores.length > 0) {
              db.query('INSERT INTO evento_alimento (id_evento, id_alimento) VALUES ?', [valores], () => { });
            }
          }
        });
      }
    });

    db.query('DELETE FROM detalle_montaje WHERE id_evento = ?', [id], () => {
      if (observaciones && observaciones.trim() !== '') {
        db.query('INSERT INTO detalle_montaje (id_evento, descripcion) VALUES (?, ?)', [id, observaciones], () => { });
      }
    });

    res.json({ mensaje: 'Evento actualizado correctamente y POA conciliado' });
    if(reqUserId) registrarMovimiento(reqUserId, null, 'EDICION_EVENTO', `Evento ${id} actualizado. Presupuesto nuevo: ${montoPOA} ${moneda || 'DOP'}.`);

  } catch (err) {
    console.error('Error en reconciliacion PUT /eventos:', err.message);
    return res.status(500).json({ mensaje: 'Error al actualizar evento o conciliar POA', error: err.message });
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVENTOS Ã¢â‚¬â€ OBTENER TODOS (LECTURA ADMINISTRADOR/SISTEMA) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/eventos', (req, res) => { // Declara la gran ruta HTTP GET '/eventos'
  const { usuario_id } = req.query; // Permite discriminar la vista extrayendo el parametro de busqueda URL Query String param
  let sql = `SELECT
       e.id_evento, e.nombre, e.modalidad, e.fecha_inicio, e.fecha_fin,
       e.hora_inicio, e.hora_fin, e.cantidad_asistentes, e.tipo_evento,
       e.monto_poa, e.moneda, e.estado, e.fecha_creacion,
       e.id_recinto, e.id_dependencia,
       pm.estado AS estado_poa, pm.motivo_rechazo AS motivo_rechazo_poa,
       u.nombre  AS solicitante,
       u.id_usuario,
       d.nombre  AS dependencia,
       r.nombre  AS recinto,
       (SELECT GROUP_CONCAT(dc.tipo SEPARATOR ', ') FROM detalle_corporativo dc WHERE dc.id_evento = e.id_evento) AS detalles_corporativos,
       (SELECT GROUP_CONCAT(a.nombre SEPARATOR ', ') FROM evento_alimento ea JOIN alimento a ON ea.id_alimento = a.id_alimento WHERE ea.id_evento = e.id_evento) AS alimentos,
       (SELECT GROUP_CONCAT(dm.descripcion SEPARATOR ' | ') FROM detalle_montaje dm WHERE dm.id_evento = e.id_evento) AS observaciones,
       IF((SELECT COUNT(*) FROM servicio_audiovisual sa WHERE sa.id_evento = e.id_evento) > 0, 1, 0) AS necesita_audiovisual,
       (SELECT GROUP_CONCAT(CONCAT(sa.cantidad, 'x ', sa.tipo_servicio) SEPARATOR ', ') FROM servicio_audiovisual sa WHERE sa.id_evento = e.id_evento AND sa.estado != 'Rechazado') AS equipos_audiovisuales
     FROM evento e
     LEFT JOIN poa_movimiento pm ON e.id_evento = pm.id_evento
     LEFT JOIN usuario     u ON e.id_usuario     = u.id_usuario
     LEFT JOIN dependencia d ON e.id_dependencia = d.id_dependencia
     LEFT JOIN recinto     r ON e.id_recinto     = r.id_recinto`; // Enorme Query multi-dimensional con Selects Anidados (Subqueries) para extraer relaciones M:N serializadas en strings separados por comas usando GROUP_CONCAT, evitando duplicar filas.
  
  const params = []; // Lista local vacia de bindings paramÃƒÂ©tricos a inyectar seguros en BD
  if (usuario_id) { // Si el front end explicitÃƒÂ³ a quien pertenece...
    sql += ` WHERE e.id_usuario = ?`; // Filtra contundentemente por ID de su creador usando WHERE
    params.push(usuario_id); // Alimenta el stack de valores inyectables 
  }

  sql += ` ORDER BY e.fecha_creacion DESC`; // Ordena cronolÃƒÂ³gicamente descendente por default

  db.query(sql, params, (err, results) => { // Lectura final
    if (err) return res.status(500).json({ error: err.message }); // Ataja de inmediato error MySQL
    res.json(results); // Serializa masivamente el conjunto crudo parseandolo transparentemente en un modelo JSON legible de Array 
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVENTOS Ã¢â‚¬â€ CALENDARIO PRIVADO (UI SCHEDULING INTERFACE) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/calendario-eventos', (req, res) => { // Endpoint dedicado a despachar metadatos para llenar componentes grÃƒÂ¡ficos tipo FullCalendar o BigCalendar
  const { usuario_id } = req.query; // ID del usuario local que activamente consulta (Viene del JWT Decode Front o Token Storage)
  
  const sql = `
    SELECT 
      e.id_evento, e.nombre, e.fecha_inicio, e.fecha_fin, e.id_usuario,
      r.nombre AS recinto,
      IF((SELECT COUNT(*) FROM servicio_audiovisual sa WHERE sa.id_evento = e.id_evento AND sa.estado != 'Rechazado') > 0, 1, 0) AS necesita_audiovisual
    FROM evento e
    LEFT JOIN recinto r ON e.id_recinto = r.id_recinto
    WHERE e.estado != 'Rechazado' -- Evade y excluye completamente del dibujo agendado aquellos planes flagrantemente rechazados
  `; // Select parcial que ignora data confidencial administrativa e incluye banderas booleanas IF

  db.query(sql, (err, results) => { // Lanza Query
    if (err) return res.status(500).json({ error: err.message }); // Error Handling

    const processed = results.map(evt => { // Despliega iterador funcional Map sobre matriz bruta para formatear un nuevo objeto anÃƒÂ³nimo calibrado para React-Big-Calendar Standard
      const esPropio = usuario_id && evt.id_usuario == usuario_id; // ValidaciÃƒÂ³n booleana analizando PosesiÃƒÂ³n (Si el evento iterado me pertenece o es de alguien ajeno en la red institucional)
      return { // Estructura formal standard object
        id: evt.id_evento, // Asignacion llave
        start: evt.fecha_inicio, // Mapping param start date 
        end: evt.fecha_fin, // Mapping param end date
        title: esPropio ? evt.nombre : "Ocupado", // Censura dinÃƒÂ¡mica: Si es mÃƒÂ­o revelo titulo, sino aplico etiqueta privada estÃƒÂ¡ndar "Ocupado"
        recinto: esPropio ? evt.recinto : "InformaciÃƒÂ³n Privada", // Censura espacial local
        esPropio: esPropio, // Bandera de propiedad
        necesita_audiovisual: evt.necesita_audiovisual === 1 // Cast int to bool verdadero/falso
      };
    });

    res.json(processed); // Responde el array calibrado final transformado iterativamente
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVENTOS Ã¢â‚¬â€ ACTUALIZAR ESTADO GERENCIAL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.put('/eventos/:id/estado', (req, res) => { 
  // --- MÃƒÂ³dulo: Eventos | FunciÃƒÂ³n: Actualizar estado y asignar coordinador (Fase 1 del Relevo) ---
  const { id } = req.params; 
  const { estado, id_coordinador } = req.body; 
  const estadosValidos = ['Pendiente', 'Aprobado', 'Rechazado', 'Finalizado']; 
  
  if (!estadosValidos.includes(estado)) 
    return res.status(400).json({ mensaje: 'Estado no vÃƒÂ¡lido' }); 

  // FunciÃƒÂ³n interna para proceder con la actualizaciÃƒÂ³n
  const procederUpdate = () => {
    // Leer datos del evento antes de actualizar para poder generar notificaciones correctas
    db.query('SELECT nombre, id_usuario FROM evento WHERE id_evento = ?', [id], (errEvt, evtRows) => {
      if (errEvt || evtRows.length === 0) return res.status(404).json({ mensaje: 'Evento no encontrado' });
      const { nombre: nombreEvt, id_usuario: idSolicitante } = evtRows[0];

      db.query('UPDATE evento SET estado=? WHERE id_evento=?', [estado, id], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al actualizar estado', error: err.message });

        // Si el evento fue Aprobado y se enviÃƒÂ³ un coordinador, se le asigna la responsabilidad en la tabla puente
        if (estado === 'Aprobado' && id_coordinador) {
          db.query(`DELETE FROM evento_organizador WHERE id_evento=? AND rol_organizacion='Coordinador'`, [id], () => {
            db.query(`INSERT INTO evento_organizador (id_evento, id_usuario, rol_organizacion) VALUES (?, ?, 'Coordinador')`, [id, id_coordinador]);
          });
        }

        // Ã¢â€â‚¬Ã¢â€â‚¬ FASE 2: REVERSIÃƒâ€œN AUTOMÃƒÂTICA DEL PRESUPUESTO POA AL RECHAZAR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        if (estado === 'Rechazado') {
          db.query(
            `SELECT id_movimiento, id_poa, monto_descontado_dop FROM poa_movimiento WHERE id_evento = ? AND estado != 'Rechazado'`,
            [id],
            (errPoa, movs) => {
              if (!errPoa && movs.length > 0) {
                movs.forEach(mov => {
                  // Marcar el movimiento como Rechazado
                  db.query(`UPDATE poa_movimiento SET estado = 'Rechazado', motivo_rechazo = 'Evento rechazado por administrador' WHERE id_movimiento = ?`, [mov.id_movimiento]);
                  // Devolver el dinero al POA fiscal (reversiÃƒÂ³n contable automÃƒÂ¡tica)
                  db.query(`UPDATE poa_fiscal SET monto_disponible = monto_disponible + ? WHERE id_poa = ?`, [mov.monto_descontado_dop, mov.id_poa]);
                  console.log(`Ã°Å¸â€™Â° POA revertido: +${mov.monto_descontado_dop} DOP al POA ${mov.id_poa} por rechazo del evento ${id}`);
                });
              }
            }
          );
        }

        // Ã¢â€â‚¬Ã¢â€â‚¬ NOTIFICACIONES FASE 2: Cambio de estado Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        if (estado === 'Aprobado') {
          // Notificar al Solicitante del evento
          if (idSolicitante) {
            crearNotificacion({ id_usuario_destino: idSolicitante, titulo: 'Ã¢Å“â€¦ Evento Aprobado', cuerpo: `Tu evento "${nombreEvt}" (#EVT-${id}) ha sido aprobado. Ya estÃƒÂ¡ en proceso de organizaciÃƒÂ³n.`, enlace_accion: 'mis-eventos' });
          }
          // Notificar a Presupuesto/VAF
          crearNotificacion({ rol_destino: 'Presupuesto', titulo: 'Ã°Å¸â€™Â° Nuevo evento aprobado requiere revisiÃƒÂ³n POA', cuerpo: `El evento "${nombreEvt}" (#EVT-${id}) fue aprobado. Verifica el estado del presupuesto POA asignado.`, enlace_accion: 'poa-admin' });
          // Notificar a Legal
          crearNotificacion({ rol_destino: 'Legal', titulo: 'Ã°Å¸â€œÅ“ Nuevo evento aprobado requiere contrato', cuerpo: `El evento "${nombreEvt}" (#EVT-${id}) fue aprobado. Procede a revisar y firmar los contratos legales correspondientes.`, enlace_accion: 'flujo-administrativo' });
          // Notificar a Compras/B2B
          crearNotificacion({ rol_destino: 'Compras', titulo: 'Ã°Å¸â€ºâ€™ Nuevo evento aprobado listo para licitaciones', cuerpo: `El evento "${nombreEvt}" (#EVT-${id}) fue aprobado. Puedes iniciar las solicitudes de cotizaciÃƒÂ³n a proveedores.`, enlace_accion: 'compras' });
          // Notificar al ÃƒÂ¡rea de Audiovisual
          crearNotificacion({ rol_destino: 'Audiovisual', titulo: 'Ã°Å¸Å½Â¬ Evento aprobado: verificar solicitud AV', cuerpo: `El evento "${nombreEvt}" (#EVT-${id}) fue aprobado. Revisa si tiene requerimientos de equipos audiovisuales.`, enlace_accion: 'audiovisual' });
        } else if (estado === 'Rechazado') {
          if (idSolicitante) {
            crearNotificacion({ id_usuario_destino: idSolicitante, titulo: 'Ã¢ÂÅ’ Evento Rechazado', cuerpo: `Tu evento "${nombreEvt}" (#EVT-${id}) ha sido rechazado. Puedes contactar a la administraciÃƒÂ³n para mÃƒÂ¡s detalles.`, enlace_accion: 'mis-eventos' });
          }
        } else if (estado === 'Finalizado') {
          if (idSolicitante) {
            crearNotificacion({ id_usuario_destino: idSolicitante, titulo: 'Ã°Å¸Å½â€° Evento finalizado Ã¢â‚¬â€œ EvalÃƒÂºa el servicio', cuerpo: `Tu evento "${nombreEvt}" (#EVT-${id}) ha concluido exitosamente. Ã‚Â¡Completa la evaluaciÃƒÂ³n de calidad para ayudarnos a mejorar!`, enlace_accion: 'evaluacion' });
          }
        }

        res.json({ mensaje: 'Estado actualizado con ÃƒÂ©xito' });
        const reqUserId = req.headers['x-usuario-id'];
        if(reqUserId) registrarMovimiento(reqUserId, null, 'ACTUALIZACION_EVENTO', `ResoluciÃƒÂ³n de Estado del Evento. El Evento con ID ${id} ha pasado al estado: "${estado}".`);
      });
    });
  };

  // Fase 5: ValidaciÃƒÂ³n Estricta para el Cierre Administrativo
  if (estado === 'Finalizado') {
    db.query(`SELECT COUNT(*) as pendientes FROM actividad_cronograma WHERE id_evento = ? AND estado != 'Completada'`, [id], (errTask, resultsTask) => {
      if (errTask) return res.status(500).json({ error: errTask.message });
      if (resultsTask[0].pendientes > 0) {
        return res.status(400).json({ mensaje: `No se puede finalizar el evento porque hay ${resultsTask[0].pendientes} tarea(s) del cronograma sin completar.` });
      }

      db.query(`
        SELECT COUNT(*) as pendientes_pago 
        FROM analisis_ia_comparativo a 
        JOIN cotizacion_recibida c ON a.proveedor_recomendado_id = c.id_proveedor AND a.id_solicitud = c.id_solicitud 
        JOIN solicitud_cotizacion s ON a.id_solicitud = s.id_solicitud 
        WHERE s.id_evento = ? AND (c.estado_pago != 'Pagado' OR c.estado_pago IS NULL)
      `, [id], (errB2B, resultsB2B) => {
        if (errB2B) return res.status(500).json({ error: errB2B.message });
        if (resultsB2B[0].pendientes_pago > 0) {
          return res.status(400).json({ mensaje: `No se puede finalizar el evento porque hay ${resultsB2B[0].pendientes_pago} factura(s) de proveedores sin pagar o subir comprobante.` });
        }

        procederUpdate(); // Si pasa las validaciones, procede a actualizar
      });
    });
  } else {
    procederUpdate();
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVENTOS Ã¢â‚¬â€ ELIMINAR MANUALMENTE UNA SOLICITUD Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.delete('/eventos/:id', (req, res) => { // Ruta explÃƒÂ­cita DELETE masivo de cascada manual
  const { id } = req.params; // Saca var id forÃƒÂ¡nea de URL param
  db.query('DELETE FROM detalle_corporativo WHERE id_evento=?', [id], () => { // Cadena callback 1: Borrado de nodos adjuntos corporativos subyacentes
    db.query('DELETE FROM evento_alimento WHERE id_evento=?', [id], () => { // Cadena callback 2: Borrado de relaciÃƒÂ³n de nodos puente alimentos
      db.query('DELETE FROM detalle_montaje WHERE id_evento=?', [id], () => { // Cadena callback 3: Borrado de descripciones anexas de montaje
        db.query('DELETE FROM evento WHERE id_evento=?', [id], (err) => { // Fin de cascada Callback Hell piramidal manual: ExtinciÃƒÂ³n del Padre/Tronco Matrix del suceso central
          if (err) return res.status(500).json({ mensaje: 'Error al eliminar evento', error: err.message }); // Falla de sustracciÃƒÂ³n profunda
          res.json({ mensaje: 'Evento eliminado con ÃƒÂ©xito' }); // Respuesta limpia tras purga
          const reqUserId = req.headers['x-usuario-id']; // Autoria identificativa
          if(reqUserId) registrarMovimiento(reqUserId, null, 'ELIMINACION_EVENTO', `CancelaciÃƒÂ³n y Borrado de Evento. Evento afectado ID: ${id}.`); // Confirmacion Bitacora de borrado de root tree evento
        });
      });
    });
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ AUDIOVISUAL Ã¢â‚¬â€ CREAR SOLICITUD INDEPENDIENTE O AÃƒâ€˜EXA Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/audiovisual', (req, res) => { // Endpoint de generacion POST /audiovisual
  const { id_evento, servicios } = req.body; // Pide llave evento parejada y array puro de necesidades tecnicas
  // servicios serÃƒÂ¡ un array de objetos parseados desde JSON front: { equipo: 'Proyector', cantidad: 2, descripcion: '...', ubicacion: '...', observaciones: '...' }

  if (!id_evento || !servicios || servicios.length === 0) { // Cortafuegos de seguridad Anti-Null arrays
    return res.status(400).json({ mensaje: 'Faltan datos requeridos o servicios audiovisuales.' }); // Desprecia peticiones anemicas sin payload util
  }

  // 1. Validar la estricta regla organizacional de 5 dÃƒÂ­as mÃƒÂ­nimos calendarios requeridos de anticipaciÃƒÂ³n tÃƒÂ©cnica 
  db.query('SELECT fecha_inicio FROM evento WHERE id_evento = ?', [id_evento], (err, results) => { // Primero lee fecha planeada matriz
    if (err) return res.status(500).json({ mensaje: 'Error al buscar el evento', error: err.message }); // Caida DB MySQL
    if (results.length === 0) return res.status(404).json({ mensaje: 'Evento no encontrado' }); // ID Foraneo corrupto false / Desaparecido

    const fechaEvento = new Date(results[0].fecha_inicio); // Construye Data Object referencial real calculable apuntando a la fecha evento guardada
    const fechaActual = new Date(); // Constructor dia servidor presente
    // Neutralizar horas nativas exactas para calcular la diferencia de dÃƒÂ­as netos naturales en el calendario correctamente
    fechaEvento.setHours(0, 0, 0, 0); // Vaciado de offset de huso horario truncando a base Date Object a hora muerta media noche absoluta
    fechaActual.setHours(0, 0, 0, 0); // ModificaciÃƒÂ³n de calibrado idÃƒÂ©ntico al pivote actual presente dia

    const diferenciaTiempo = fechaEvento.getTime() - fechaActual.getTime(); // Matematica base de Unix Milisegundos epoch Timestamp gap subtraction
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)); // ModulaciÃƒÂ³n por modulo division de formula magica de conversion temporal ms->dias naturales enteros (Milisegundo * horas * 24 h)

    if (diferenciaDias < 5) { // Aplicacion CategÃƒÂ³rica Logica de Negocio UAPA Privada: Implanta politica de cierre y denegaciÃƒÂ³n dura
      return res.status(400).json({ // Devuelve HTTP 400 y cancela emision de alerta cortado a la capa visual 
        mensaje: `PolÃƒÂ­ticas institucionales: La solicitud de equipos audiovisuales requiere un mÃƒÂ­nimo de 5 dÃƒÂ­as de antelaciÃƒÂ³n. Faltan ${diferenciaDias} dÃƒÂ­as para el evento.`,
        dias_restantes: diferenciaDias // Adjunta un param int extra aclaratorio para logicas condicionales UI Frontend de React
      });
    }

    // 2. Transaccion pre-condiciÃƒÂ³n aceptada: Insertar masivamente los servicios reales limpios pre-filtrados en db con map bulk
    const values = servicios.map(s => { // Generacion del array dimensional anidado usando .map() list traversal function
      // Estructura posicional parametrizada de columnas: (id_evento, tipo_servicio, estado, cantidad, ubicacion, observaciones)
      return [ // Bracket array sub-indice
        id_evento, // Foreign key link principal
        s.equipo, // Item string nominal del equipo
        'Pendiente', // Estatus text inmutable forzado al momento de creaciÃƒÂ³n
        s.cantidad || 1,  // Cantidad solicitada (Fallo positivo asume 1 unidad como valor mÃƒÂ­nimo estÃƒÂ¡ndar base)
        s.ubicacion || '', // String metadata location text field
        s.observaciones || '' // Metadata comments string field
      ];
    });

    db.query('INSERT INTO servicio_audiovisual (id_evento, tipo_servicio, estado, cantidad, ubicacion, observaciones) VALUES ?', [values], (errInsert) => { // Ejecuta Bulkinsert masivo blindado de la matriz preparada posicional
      if (errInsert) return res.status(500).json({ mensaje: 'Error al registrar servicios', error: errInsert.message });
      res.status(201).json({ mensaje: 'Solicitud audiovisual registrada con ÃƒÂ©xito' });
      const reqUserId = req.headers['x-usuario-id'];
      if(reqUserId) registrarMovimiento(reqUserId, null, 'CREACION_AUDIOVISUAL', `Se levantÃƒÂ³ una Solicitud de Servicios Audiovisuales. Evento Asociado ID: ${id_evento}. Equipos requeridos: ${servicios.map(s => s.equipo).join(', ')}.`);
    });
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ AUDIOVISUAL Ã¢â‚¬â€ OBTENER TODAS LAS SOLICITUDES MATRICES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/audiovisual', (req, res) => { // Endpoint de lectura gerencial administrativa GET /audiovisual
  const { usuario_id } = req.query; // Permite discriminar la vista extrayendo el parametro de filtro por owner URL Query String param
  let sql = `SELECT 
       s.id_servicio, s.id_evento, s.tipo_servicio, s.estado AS estado_av,  -- Renombramiento Alias para evadir colisiones semÃƒÂ¡nticas con estado del root evento
       s.cantidad, s.ubicacion, s.observaciones,
       e.nombre AS nombre_evento, e.fecha_inicio, r.nombre AS recinto,
       e.id_usuario, u.nombre AS nombre_usuario
     FROM servicio_audiovisual s
     JOIN evento e ON s.id_evento = e.id_evento -- Amarre fuerte obligatorio (INNER JOIN) con la matrix de Evento (El servicio no puede existir huÃƒÂ©rfano)
     LEFT JOIN recinto r ON e.id_recinto = r.id_recinto -- Amarre dÃƒÂ©bil izquierdo con su recinto posicional
     LEFT JOIN usuario u ON e.id_usuario = u.id_usuario`; // Amarre dÃƒÂ©bil izquierdo con la firma de creador
  
  const params = []; // ColecciÃƒÂ³n de inyecciÃƒÂ³n segura vacÃƒÂ­a
  if (usuario_id) { // Condicional discriminador: Si hay ID, solo muestro su pedazo de la torta de Data
    sql += ` WHERE e.id_usuario = ?`; // Filtro subyacente de la Foreign Key del evento padre
    params.push(usuario_id); // Alimento de Bindings
  }

  sql += ` ORDER BY s.id_servicio DESC`; // DisposiciÃƒÂ³n lÃƒÂ³gica natural descendente para ver lo nuevo en la cima (LIFO visual)

  db.query(sql, params, (err, results) => { // Despliegue de DB callback
    if (err) return res.status(500).json({ error: err.message }); // Ataja de inmediato error MySQL

    const parsedResults = results.map(row => { // Algoritmo de mapeo puramente preventivo
        // Fallback robusto en caso de que aÃƒÂºn exista data comprimida vieja incrustada en BD heredada del diseÃƒÂ±o antiguo (ej: Proyector|Cant:2|Ubic:A)
        let equipo = row.tipo_servicio; // Intento 1: Asume estructura moderna normalizada 
        let cant = row.cantidad;
        let ubic = row.ubicacion;
        let obs = row.observaciones;

        if (row.tipo_servicio.includes('|Cant:')) { // PatrÃƒÂ³n RegEx-like de cacerÃƒÂ­a indicando si este registro particular obedece al esquema viejo pipe concat String V1
          const parts = row.tipo_servicio.split('|'); // Despedaza la cadena cruda separÃƒÂ¡ndola nativamente por sÃƒÂ­mbolo Pipe
          equipo = parts[0]; // Extrae el nombre crudo de la mÃƒÂ¡quina de manera aislada en slot 0
          if (parts[1]) cant = parts[1].replace('Cant:', ''); // Extrae e higieniza removiendo texto prefijo cant en slot 1
          if (parts[2]) ubic = parts[2].replace('Ubic:', ''); // Remueve prefijo Ubic en slot 2
          if (parts[3]) obs = parts[3].replace('Obs:', ''); // Extrae anotaciones finales en slot 3
        }

        return { // Retorna y construye al paso dinÃƒÂ¡mico on-the-fly el JSON Object sanitizado definitivo estandarizado listo para inyecciÃƒÂ³n Front UI
          id_servicio: row.id_servicio, // Puntero primario del requerimiento unitario equipo
          id_evento: row.id_evento, // Puntero FK anexo Evento
          nombre_evento: row.nombre_evento, // Texto
          fecha_evento: row.fecha_inicio, // Fecha programada para uso real calendario
          estado_av: row.estado_av, // Situacional status aislado solo de este equipo (Aprob/Rech)
          equipo: equipo, // Nombre de maquina
          cantidad: cant || 1, // Fallback si era NaN a 1 
          ubicacion: ubic || '', // String Vacio en caso Null
          observaciones: obs || '', // Comments String
          nombre_usuario: row.nombre_usuario || '' // Autor
        };
      });

      res.json(parsedResults); // Envia lista saneada parseada global al receptor React Hook
    }
  );
});

// Ã¢â€â‚¬Ã¢â€â‚¬ AUDIOVISUAL Ã¢â‚¬â€ ACTUALIZAR ESTADO ITEM ÃƒÅ¡NICO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.put('/audiovisual/:id/estado', (req, res) => { // Endpoint de mutabilidad dinÃƒÂ¡mica de micro-estatus PUT Unitario individual 
  const { id } = req.params; // Desentrama ID URL parameter
  const { estado } = req.body; // Pospone el paquete de decisiÃƒÂ³n estatus
  const estadosValidos = ['Pendiente', 'En revisiÃƒÂ³n', 'Aprobado', 'Rechazado', 'Completado']; // Enumera virtualmente en Node el diccionario de Listas Blancas validadoras lÃƒÂ³gicas en ram de Estados Aceptables (Previene Injection Attacks de Fake States)

  if (!estadosValidos.includes(estado)) // Caza intentos maliciosos o bugeados de sobre-escritura con estados extraterrestres no contemplados por el core negocio
    return res.status(400).json({ mensaje: 'Estado audiovisual no vÃƒÂ¡lido' }); // Detiene ejecucion y repulsa via 400 Bad Request client mistake

  db.query('UPDATE servicio_audiovisual SET estado=? WHERE id_servicio=?', [estado, id], (err, result) => { // Activa UPDATE MySQL de una sola pieza referida apuntando exclusivamente al row especifico del Service Item id
    if (err) { // Handle callback Error
      console.error('Update Error:', err); // Aviso Logger Silencioso NodeJS Host
      return res.status(500).json({ mensaje: 'Error al actualizar estado', error: err.message }); // Rechazo final HTTP Backend down status 500
    }
    console.log(`Update Result for id ${id}:`, result); // Logger satisfactorio de depuracion 
    res.json({ mensaje: 'Estado audiovisual actualizado con ÃƒÂ©xito', affectedRows: result.affectedRows }); // HTTP response emite cuantas filas exactas se alteraron (deberia ser 1 siempre)
    const reqUserId = req.headers['x-usuario-id']; // Busca el Header oculto del panel admin para ficharlo 
    if(reqUserId) registrarMovimiento(reqUserId, null, 'ACTUALIZACION_AUDIOVISUAL', `ResoluciÃƒÂ³n de Solicitud Audiovisual. El ticket ID ${id} ha pasado al estado: "${estado}".`); // Trazo logÃƒÂ­stico oficial de bitÃƒÂ¡cora
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ AUDIOVISUAL Ã¢â‚¬â€ ACTUALIZAR ESTADO (GLOBAL MASIVO POR CLUSTER EVENTO) Ã¢â€â‚¬
app.put('/audiovisual/evento/:id_evento/estado', (req, res) => { // Sub-endpoint derivado que apunta al Cluster Superior Agrupador de la familia completa de audiovisuales (El id de su evento padre creador orgÃƒÂ¡nico) en caso que el gerente de audiovisulaes quiera Aprobar masivamente en 1 Clic una canasta de equipos solicitada entera
  const { id_evento } = req.params;  // Pide el Foreign Key id_evento por sobre el Primary id_servicio 
  const { estado } = req.body;  // Absorbe intencion de masa Update Generalizado Global  
  const estadosValidos = ['Pendiente', 'En revisiÃƒÂ³n', 'Aprobado', 'Rechazado', 'Completado']; // Whitelist constante protectora en memoria Node

  if (!estadosValidos.includes(estado)) // Caza Fake States
    return res.status(400).json({ mensaje: 'Estado audiovisual no vÃƒÂ¡lido' }); // Return false stop Request 400 bad data payload

  db.query('UPDATE servicio_audiovisual SET estado=? WHERE id_evento=?', [estado, id_evento], (err, result) => { // Sobrescribe implacablemente con una sola Query a N cantidad multiplicada de sub elementos adosados todos coincidentemente a un mismo Foraneo id_evento
    if (err) { // Manejador basico error
      console.error('Update All Error:', err); // Trace terminal error Node JS Process instance PM2
      return res.status(500).json({ mensaje: 'Error al actualizar estado general', error: err.message }); // HTTP Stop error database unreachable
    }
    res.json({ mensaje: 'Estado audiovisual del evento actualizado con ÃƒÂ©xito', affectedRows: result.affectedRows }); // Respuesta victoriosa HTTP Front 
    const reqUserId = req.headers['x-usuario-id']; // Puntero Header Autor Humano Culpable/Responsable del Click accionador masivamente transformador
    if(reqUserId) registrarMovimiento(reqUserId, null, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', `ResoluciÃƒÂ³n Global de Audiovisual. Los servicios del Evento ID ${id_evento} pasaron al estado: "${estado}".`); // Inscribe de un solo tajo la alteraciÃƒÂ³n estructural global en el libro contable de Bitacora Admin Action Logs History Table Auditorial general del sistema.
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ RESTABLECIMIENTO DE CONTRASEÃƒâ€˜A (EMAIL FLOW OAUTH BYPASS) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/solicitar-restablecimiento', (req, res) => { // Endpoint de disparo inicial para flujo "OlvidÃƒÂ© mi contraseÃƒÂ±a"
  const { correo } = req.body; // Extrae el input string del email digitado por el usuario en conflicto

  db.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo], (err, results) => { // Chequeo de seguridad: Validar si de hecho existe
    if (err) return res.status(500).json({ mensaje: 'Error al consultar la base de datos' }); // Falla de lectura base MySQL
    if (results.length === 0) { // Si el motor retorna Array vacÃƒÂ­o = El usuario es fantasma o se equivocÃƒÂ³ al teclear
      return res.status(404).json({ mensaje: 'El correo no estÃƒÂ¡ registrado' }); // 404 No encontrado explÃƒÂ­cito
    }

    // Generar token criptogrÃƒÂ¡fico pseudo-aleatorio ÃƒÂºnico de seguridad (Non-guessable Hash string)
    const token = crypto.randomBytes(32).toString('hex'); // LibrerÃƒÂ­a Crypto nativa NodeJS: Genera 64 caracteres Hexadecimales
    const expiracion = new Date(Date.now() + 3600000); // 1 hora exacta de validez estricta (Time to live TTL) sumada en formato Milisegundos Epoch a la fecha Actual

    db.query( // Asienta transaccionalmente en la Tabla Temporal el hash y su atadura al correo
      'INSERT INTO restablecimiento_token (correo, token, expiracion) VALUES (?, ?, ?)',
      [correo, token, expiracion], // Pasa parÃƒÂ¡metros
      (errInsert) => { // Callback
        if (errInsert) return res.status(500).json({ mensaje: 'Error al generar el token' }); // Rechazo por caÃƒÂ­da de disco

        const link = `http://localhost:3000/reset-password/${token}`; // Concatena el hipervÃƒÂ­nculo fÃƒÂ­sico mÃƒÂ¡gico inyectando el Hash como segmento URL DinÃƒÂ¡mico

        // ConfiguraciÃƒÂ³n de Transportador SMTP Gmail (Nodemailer Middleware Module)
        const transporter = nodemailer.createTransport({ // Instancia la conexiÃƒÂ³n transaccional
          service: 'gmail', // Target OAuth/BasicAuth G Suite/Google Mail Service Cloud Provider
          auth: { // AutenticaciÃƒÂ³n del sender server backoffice bot origin source account
            user: process.env.GMAIL_USER, // Credencial Segura Oculta `.env` String
            pass: process.env.GMAIL_PASS, // App Password Autenticado Google Security `.env`
          },
        });

        const mailOptions = { // Objeto estructurado Diccionario de Parametros SendMail Base HTML/Texto
          from: `"ProEvent UAPA" <${process.env.GMAIL_USER}>`, // MÃƒÂ¡scara spoof de remitente alias
          to: correo, // Target endpoint receptor (Cliente)
          subject: 'Restablecer tu contraseÃƒÂ±a - ProEvent UAPA', // TÃƒÂ­tulo Subject header tag
          text: `Hola,\n\nRecibimos una solicitud para restablecer la contraseÃƒÂ±a de tu cuenta en ProEvent UAPA.\n\nEnlace de restablecimiento (vÃƒÂ¡lido por 1 hora):\n${link}\n\nSi no solicitaste este cambio, ignora este correo.\n\nSistema de GestiÃƒÂ³n de Eventos Ã¢â‚¬â€œ UAPA ProEvent`, // Fallback plaintext puro si cliente correo NO admite HTML Render
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e0e0e0; border-radius: 14px;">
              <div style="text-align:center; margin-bottom: 20px;">
                <span style="background:#1e3a5f; color:white; font-size:22px; font-weight:bold; padding:8px 18px; border-radius:8px;">PE</span>
                <span style="font-size:22px; font-weight:bold; color:#1e3a5f; margin-left:10px;">Pro<span style="color:#f97316;">Event</span></span>
              </div>
              <h2 style="color:#1e3a5f; text-align:center;">RecuperaciÃƒÂ³n de ContraseÃƒÂ±a</h2>
              <p>Hola,</p>
              <p>Recibimos una solicitud para restablecer la contraseÃƒÂ±a de tu cuenta. Haz clic en el botÃƒÂ³n de abajo para continuar. <strong>Este enlace es vÃƒÂ¡lido por 1 hora.</strong></p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${link}" style="background-color:#1e3a5f; color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px; display:inline-block;">
                  Restablecer ContraseÃƒÂ±a
                </a>
              </div>
              <p style="font-size:13px; color:#555;">O copia y pega este enlace en tu navegador:</p>
              <p style="word-break:break-all; color:#1e3a5f; font-size:13px;">${link}</p>
              <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
              <p style="color:#aaa; font-size:12px;">Si no solicitaste este cambio, ignora este correo. Tu cuenta sigue segura.</p>
              <p style="color:#ccc; font-size:11px;">Sistema de GestiÃƒÂ³n de Eventos Ã¢â‚¬â€œ Universidad UAPA</p>
            </div>
          `, // InyecciÃƒÂ³n Inline CSS para bypass de Email Clients restrictivos (Gmail/Outlook safe css render engine compliant code structure rules block table formatting hack fix)
        };

        transporter.sendMail(mailOptions, (errMail, info) => { // Disparo real TCP del socket hacia SMTP Servers remotos en red con payload compilado base64 content type multipart
          if (errMail) { // Fracaso de conexiÃƒÂ³n o credenciales errÃƒÂ³neas banneadas por google policies o bad TLS Handshake protocol mismatch port 465 587 block
            console.error('Ã¢ÂÅ’ Error enviando correo:', errMail.message); // Consola verbose local log failure
            return res.status(500).json({ mensaje: 'Error al enviar el correo. Intente de nuevo.' }); // Avisa fallo
          }
          console.log(`Ã¢Å“â€¦ Correo enviado a: ${correo} (ID: ${info.messageId})`); // Rastreo feliz Server Node Terminal log monitor process trace uid ID messageid
          res.json({ mensaje: 'Se ha enviado un enlace a su correo electrÃƒÂ³nico.' }); // Respuesta final HTTP STATUS 200 al UI solicitante de paciencia para revisiÃƒÂ³n Inbox
        });
      }
    );
  });
});

app.get('/validar-token/:token', (req, res) => { // Endpoint auxiliar silencioso de ping pong. Su funciÃƒÂ³n es que la Pantalla GUI Reset password se auto-destruya si el token URL caducÃƒÂ³ o es falso sin requerir botonazo al montar en RAM component
  const { token } = req.params; // Toma segmento Path Dinamico
  db.query( // Lee la tabla sucia temporal de tokens
    'SELECT correo FROM restablecimiento_token WHERE token = ? AND expiracion > NOW()', // Magia SQL C: Chequea MATCH de string con WHERE y usa funciÃƒÂ³n matemÃƒÂ¡tica Date de base de datos nativa NOW() para verificar si expirÃƒÂ³ (Time Travel Logic Validation Engine)
    [token],
    (err, results) => { // Analiza return array length bool
      if (err) return res.status(500).json({ mensaje: 'Error al validar el token' }); // Manejador basico logico error
      if (results.length === 0) { // Si fallÃƒÂ³ (O no existe ese hash inventado hacker, o sÃƒÂ­ existe pero expiracion < menor que NOW())
        return res.status(400).json({ mensaje: 'Token invÃƒÂ¡lido o expirado' }); // Lanza destello mortal al UI para bloquear y ocultar inputs del formulario de nueva key
      }
      res.json({ mensaje: 'Token vÃƒÂ¡lido', correo: results[0].correo }); // Concede Permiso UI Temporal a renderizar Cajas de Texto "Nueva ContraseÃƒÂ±a x2" y exporta el Mail Subyacente acoplado al hash index
    }
  );
});

app.post('/restablecer-contrasena', (req, res) => { // Endpoint Definitivo Mutador TÃƒÂ¡ctico Finalizador (Post de ejecuciÃƒÂ³n destructiva y sobre-escritura)
  const { token, nuevaContrasena } = req.body; // Requiere la llave token devuelta en payload y el plaintext string password recien digitado
  
  // 1. Re-Validar Estrictamente lado servidor node el token antes de matar contraseÃƒÂ±a antigua (Evita Bypassing REST calls Postman y Replays)
  db.query(
    'SELECT correo FROM restablecimiento_token WHERE token = ? AND expiracion > NOW()', // Mismo chequeo de caducidad temporal anti-latencia
    [token],
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: 'Error al validar el token' }); // Fallo Try Catch like
      if (results.length === 0) { // Timeout confirmacion reaccion tardia usuario o inyeccion delay ataque
        return res.status(400).json({ mensaje: 'Token invÃƒÂ¡lido o expirado' });
      }

      const correo = results[0].correo; // Pinpoint selectivo estricto de la cuenta vÃƒÂ­ctima objetiva a actualizar segun el token

      // 2. Actualizar contraseÃƒÂ±a oficial (Idealmente aquÃƒÂ­ se usarÃƒÂ­a un Bcrypt Hash gen salt, pero ProEvent iteraciÃƒÂ³n Mvp usa Plaintext local en db SQL Base table usuario provisorio por ahora para prueba simple acadÃƒÂ©mica de flujo login basico)
      db.query(
        'UPDATE usuario SET contrasena = ? WHERE correo = ?', // Exec Update query basico relacional root string modify setter
        [nuevaContrasena, correo],
        (errUpdate) => {
          if (errUpdate) return res.status(500).json({ mensaje: 'Error al actualizar la contraseÃƒÂ±a' }); // Fallo MySQL Update query parse

          // 3. Destruir e incinerar el token usado para asegurar su condiciÃƒÂ³n "Uso ÃƒÅ¡nico Desechable Limitado" o (One Time Use - Burn after read single use ticket policy enforcer mechanism destructor)
          db.query('DELETE FROM restablecimiento_token WHERE correo = ?', [correo], () => { }); // Purga silenciada sin catch back alert trigger

          res.json({ mensaje: 'ContraseÃƒÂ±a actualizada con ÃƒÂ©xito' }); // Respuesta Ok Verde HTTP 200 Exito UI Router App PWA React Redirect logic flag return
        }
      );
    }
  );
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVALUACIONES DE CALIDAD EVENTO POST-MORTEM Ã¢â‚¬â€ CREAR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.post('/evaluaciones', (req, res) => { // Via POST API graba encuesta final de calidad retroalimentadora del solicitante
  const { id_evento, respuesta_solicitud, recinto, valoracion_respuesta, satisfaccion, comentario } = req.body; // Cosecha respuestas y variables metricas JSON parse destructuradas
  
  // Regla Negocio Fuerte Validatoria de Nulls Protectores (Anti-Blank Form submit prevention)
  if (!id_evento || !respuesta_solicitud || !recinto || !valoracion_respuesta || !satisfaccion) { 
    return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados.' }); // Bouncer reject fail fast param guard
  }

  // Regla Negocio LÃƒÂ³gica MatemÃƒÂ¡tica Limitante de fronteras (Threshold constraint estricto min 1 estrella - max 5 estrellas rank)
  if (satisfaccion < 1 || satisfaccion > 5) {
    return res.status(400).json({ mensaje: 'El nivel de satisfacciÃƒÂ³n debe estar entre 1 y 5.' }); // Repulsa hacker attacks override API parameter mutation string
  }

  db.query( // Disparo de acciÃƒÂ³n transaccional de InserciÃƒÂ³n de Metric Collection data log base
    `INSERT INTO evaluacion (id_evento, respuesta_solicitud, recinto, valoracion_respuesta, satisfaccion, comentario)
     VALUES (?, ?, ?, ?, ?, ?)`, // Transfiere variables paramÃƒÂ©tricas enmascaradas con placeholders '?' previniendo inyecciÃƒÂ³n de consultas SQL 
    [id_evento, respuesta_solicitud, recinto, valoracion_respuesta, satisfaccion, comentario || null], // Matriz condicional array 
    (err, result) => { // Node JS lambda Callback
      if (err) return res.status(500).json({ mensaje: 'Error al registrar la evaluaciÃƒÂ³n', error: err.message }); // Fallback control de base de datos error (Fallo en constraint llave forÃƒÂ¡nea si el evento no existe)
      res.status(201).json({ mensaje: 'EvaluaciÃƒÂ³n enviada con ÃƒÂ©xito', id_evaluacion: result.insertId }); // Okey verde HTTP 201 Created Status Devuelve UUID nuevo auto num generado al vuelo en MySQL Server
      const reqUserId = req.headers['x-usuario-id']; // Busca Head Admin ID para historial (Puede ser nulo u opcional dependiendo de quiÃƒÂ©n dispara si es logueado)
      if (reqUserId) registrarMovimiento( // Apunta function call Historial Bitacora Transversal Global
        reqUserId, null, 'CREACION_EVALUACION', // Dispara el evento nomenclado
        `Nueva evaluaciÃƒÂ³n registrada. ID: ${result.insertId}. Evento ID: ${id_evento}. Recinto: ${recinto}. ValoraciÃƒÂ³n: ${valoracion_respuesta}. SatisfacciÃƒÂ³n: ${satisfaccion}/5.` // Trazo detallado metrico log audit template string con variables concatenadas para rastreo analÃƒÂ³gico histÃƒÂ³rico forense.
      );
    }
  );
});

// Ã¢â€â‚¬Ã¢â€â‚¬ EVALUACIONES Ã¢â‚¬â€ OBTENER TODAS GERENCIAL MASTER STATS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
app.get('/evaluaciones', (req, res) => { // Resumen General de encuestas Extraidas (Soporte ideal PowerBi Data Mining Stats o Dashboard Stats Panel GUI Front)
  db.query( // Inner query con macro join a root evento matriz para sacar el titulo textual semÃƒÂ¡ntico relacional
    `SELECT
       ev.id_evaluacion, ev.id_evento, ev.respuesta_solicitud,
       ev.recinto, ev.valoracion_respuesta, ev.satisfaccion,
       ev.comentario, ev.fecha,
       e.nombre AS nombre_evento
     FROM evaluacion ev
     LEFT JOIN evento e ON ev.id_evento = e.id_evento -- Cruza foreign ID number key para leer titulo textual descriptivo de quÃƒÂ© evento estamos opinando en forma de texto humano
     ORDER BY ev.fecha DESC`, // MÃƒÂ¡s reciente siempre en el tope LIFO top visual sort engine descendente para que lo nuevo aparezca a simple vista sin scroll
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message }); // InterrupciÃƒÂ³n destructiva controlada DB Outage Error response JSON obj export down error msg string
      res.json(results); // Exporta Data Frame Result Set completo Array listo para tablas y grÃƒÂ¡ficos dashboard rendering react context
    }
  );
});

// Ã¢â€â‚¬Ã¢â€â‚¬ CATÃƒÂLOGOS DINÃƒÂMICOS CRUD BÃƒÂSICO MANTENEDORES GLOBALES (Settings Generales) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// 1. Equipos Audiovisuales Abm (Alta Baja Modificacion Diccionario)
app.get('/equipos-audiovisuales', (req, res) => { // Listado API Get route fetch call global index search parameter
  db.query('SELECT * FROM equipo_audiovisual ORDER BY nombre ASC', (err, results) => { // Llama el diccionario total alfanumericamente ordenado natural de letras A-Z ASC Ascending
    if (err) return res.status(500).json({ error: err.message }); // Handle return res status code http
    res.json(results); // Export Result Array Collection List elements
  });
});
app.post('/equipos-audiovisuales', (req, res) => { // Creacion de Item de CatÃƒÂ¡logo ('Nueva mÃƒÂ¡quina registrada al inventario fÃƒÂ­sico real uapa db')
  const { nombre, icono, cantidad_total } = req.body; // Objeto data prop input elements req format JSON parse
  if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' }); // Condicion 0 validation rules blank logic guard fail bypass trigger
  db.query('INSERT INTO equipo_audiovisual (nombre, icono, cantidad_total) VALUES (?, ?, ?)', [nombre, icono || 'FiMonitor', cantidad_total || 0], (err, result) => { // Instancia fisicamente con iconos feather react default FiMonitor icon fallback default parameter text string array insert in mysql parameter object array value struct
    if (err) return res.status(500).json({ error: err.message }); // HTTP Exception catcher JSON send out return 
    res.status(201).json({ mensaje: 'Equipo Creado', id: result.insertId }); // Ok 201 Created Inserted id fetch global parameter object ID assign index
  });
});
app.put('/equipos-audiovisuales/:id', (req, res) => { // Edita existencia metadatos update edit modify properties update string metadata name icon icon-pack count de maquinas en diccionario inventario existencias update method parameter query in url express route regex param target
  const { nombre, icono, cantidad_total } = req.body; // Cosechadora req body object param element properties destruct obj js target keys vars constants extract assignment data string array number
  db.query('UPDATE equipo_audiovisual SET nombre=?, icono=?, cantidad_total=? WHERE id_equipo=?', [nombre, icono, cantidad_total || 0, req.params.id], (err) => { // Update estatico param string replacement index target where equals strict math int sql native syntax execute connection string payload transmit variable mapping 
    if (err) return res.status(500).json({ error: err.message }); // error boundary stop execution logic chain return object json content type text
    res.json({ mensaje: 'Equipo Actualizado' }); // Ok 200 return object text 
  });
});
app.delete('/equipos-audiovisuales/:id', (req, res) => { // API Backend server Delete Endpoint Router parameter express method destructure
  db.query('DELETE FROM equipo_audiovisual WHERE id_equipo=?', [req.params.id], (err) => { // Desvanece item fisico dictionary delete wipe erase action function database table action native execution run commit delete math 
    if (err) return res.status(500).json({ error: err.message }); // Falla por FK constraint constraint de evento previo en foreign rules (foreign key constraint error mysql native failure code prevention crash loop block mechanism return code string)
    res.json({ mensaje: 'Equipo Eliminado' }); // Success Result Out JSON body string text response status 200 HTTP API Standard return
  });
});

// 2. Tipos de Evento Master (CatÃƒÂ¡logo EstÃƒÂ¡tico Funcional)
app.get('/tipos-evento', (req, res) => { // Endpoint Listar GET
  db.query('SELECT * FROM tipo_evento_master ORDER BY nombre ASC', (err, results) => { // Query Orden Alfabetico 
    if (err) return res.status(500).json({ error: err.message }); // Escudo Error
    res.json(results); // Export Result List JSON array
  });
});
app.post('/tipos-evento', (req, res) => { // Add new type
  const { nombre } = req.body; // Pide string param input
  if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' }); // Bouncer vacio
  db.query('INSERT INTO tipo_evento_master (nombre) VALUES (?)', [nombre], (err, result) => { // Insert Table
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Tipo Creado', id: result.insertId }); // Exito
  });
});
app.put('/tipos-evento/:id', (req, res) => { // Modificador Metadata
  db.query('UPDATE tipo_evento_master SET nombre=? WHERE id_tipo_evento=?', [req.body.nombre, req.params.id], (err) => { // Update row
    if (err) return res.status(500).json({ error: err.message }); // Error throw handler
    res.json({ mensaje: 'Tipo Actualizado' }); // Success return message string object JSON HTTP 200
  });
});
app.delete('/tipos-evento/:id', (req, res) => { // Borrado duro
  db.query('DELETE FROM tipo_evento_master WHERE id_tipo_evento=?', [req.params.id], (err) => { // Destructor
    if (err) return res.status(500).json({ error: err.message }); // Bloqueo de Foreign Key Restrict si algun evento viejo usa este tipo master 
    res.json({ mensaje: 'Tipo Eliminado' }); // Success 200 OK 
  });
});

// 3. Tipos de Detalle Corporativo (Checkboxes Master list)
app.get('/tipos-detalle-corporativo', (req, res) => { // Ruta listado GET HTTP Endpoint Node API Router
  db.query('SELECT * FROM tipo_detalle_corporativo ORDER BY nombre ASC', (err, results) => { // Llama datos
    if (err) return res.status(500).json({ error: err.message }); // Interrumpt catch error
    res.json(results); // Array obj dump 
  });
});
app.post('/tipos-detalle-corporativo', (req, res) => { // Ruta insercion base
  const { nombre } = req.body; // Text param
  if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' }); // Regex not null check false bypass prevent
  db.query('INSERT INTO tipo_detalle_corporativo (nombre) VALUES (?)', [nombre], (err, result) => { // SQL Ejecucion
    if (err) return res.status(500).json({ error: err.message }); // Caida DB MySQL Log error string parse
    res.status(201).json({ mensaje: 'Detalle Creado', id: result.insertId }); // Send Object Response
  });
});
app.put('/tipos-detalle-corporativo/:id', (req, res) => { // Alter param row 
  db.query('UPDATE tipo_detalle_corporativo SET nombre=? WHERE id_detalle_corp=?', [req.body.nombre, req.params.id], (err) => { // Update Setter target mapping match
    if (err) return res.status(500).json({ error: err.message }); // Error
    res.json({ mensaje: 'Detalle Actualizado' }); // Return UI msg string
  });
});
app.delete('/tipos-detalle-corporativo/:id', (req, res) => { // Destruction Drop delete node row
  db.query('DELETE FROM tipo_detalle_corporativo WHERE id_detalle_corp=?', [req.params.id], (err) => { // Purga 
    if (err) return res.status(500).json({ error: err.message }); // SQL Restrict prevent crash log text error code mysql backend query
    res.json({ mensaje: 'Detalle Eliminado' }); // Send
  });
});

// 4. Alimentos (Catering Master Dictionary Base)
app.get('/alimentos', (req, res) => { // API List Data GET Fetch Call URL Point Route Express Middleware
  db.query('SELECT * FROM alimento ORDER BY nombre ASC', (err, results) => { // SQL Sort Read array from physical drive Table Base DB Connector Connection Thread Pool Loop Callback lambda
    if (err) return res.status(500).json({ error: err.message }); // Exception 
    res.json(results); // Serializer Output
  });
});
app.post('/alimentos', (req, res) => { // AÃƒÂ±ade Elemento 
  const { nombre } = req.body; // Pide Data 
  if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' }); // Filtra vacios null string undefined 
  db.query('INSERT INTO alimento (nombre) VALUES (?)', [nombre], (err, result) => { // Dispara Query
    if (err) return res.status(500).json({ error: err.message }); // Throw log node app error
    res.status(201).json({ mensaje: 'Alimento Creado', id: result.insertId }); // Good path
  });
});
app.put('/alimentos/:id', (req, res) => { // Edita String texto Metadata 
  db.query('UPDATE alimento SET nombre=? WHERE id_alimento=?', [req.body.nombre, req.params.id], (err) => { // Modifica
    if (err) return res.status(500).json({ error: err.message }); // Handler log text response function 
    res.json({ mensaje: 'Alimento Actualizado' }); // Send back ok status code 200 normal text string object 
  });
});
app.delete('/alimentos/:id', (req, res) => { // Remueve Item fisico de sistema global
  db.query('DELETE FROM alimento WHERE id_alimento=?', [req.params.id], (err) => { // Delete action execute query commit MySQL Storage Engine trigger match target ID PK Primary key filter search row delete math function log transaction node router
    if (err) return res.status(500).json({ error: err.message }); // Evita colapso si un Evento historico ya lo seleccionÃƒÂ³ previamente y tiene FK Lock table rules constraint trigger abort 
    res.json({ mensaje: 'Alimento Eliminado' }); // Terminado HTTP End response write socket close output message
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ FASE: FLUJO DOCUMENTAL (SUBIDA DE ARCHIVOS) Ã¢â€â‚¬Ã¢â€â‚¬
// (La configuraciÃƒÂ³n de multer 'storage' y 'upload' ya estÃƒÂ¡ definida en la parte superior del archivo)

// Endpoint para subir documentos asociados a un evento
app.post('/api/eventos/:id/documentos', upload.single('archivo'), (req, res) => {
  const id_evento = req.params.id;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No se subiÃƒÂ³ ningÃƒÂºn archivo' });
  }

  const ruta_archivo = req.file.filename;
  const nombre_original = req.file.originalname;
  // Extraemos tipo_documento y id_usuario del body (FormData)
  const tipo_documento = req.body.tipo_documento || 'Otro';
  const id_usuario_subio = req.body.id_usuario || null;
  
  const query = 'INSERT INTO documento_evento (id_evento, tipo_documento, nombre_archivo, ruta_archivo, id_usuario_subio) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [id_evento, tipo_documento, nombre_original, ruta_archivo, id_usuario_subio], (err, result) => {
    if (err) {
      console.error("Error al registrar documento:", err);
      return res.status(500).json({ error: 'Error al registrar el documento en la base de datos' });
    }
    res.status(201).json({ 
      mensaje: 'Documento subido y registrado con ÃƒÂ©xito', 
      ruta: ruta_archivo,
      id_documento: result.insertId 
    });
  });
});

// Exponer la carpeta uploads estÃƒÂ¡ticamente para que el frontend pueda descargar los archivos si es necesario
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ã¢â€â‚¬Ã¢â€â‚¬ FASE 1: MÃƒâ€œDULOS DE SERVICIOS EXTERNOS, ORGANIZADORES Y CRONOGRAMA Ã¢â€â‚¬Ã¢â€â‚¬

// 1. CatÃƒÂ¡logo de Servicios Externos
app.get('/tipos-servicio-externo', (req, res) => {
  db.query('SELECT * FROM tipo_servicio_externo ORDER BY clasificacion, nombre ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/tipos-servicio-externo', (req, res) => {
  const { nombre, clasificacion } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' });
  db.query('INSERT INTO tipo_servicio_externo (nombre, clasificacion) VALUES (?, ?)', [nombre, clasificacion || 'Corriente'], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Tipo de Servicio Creado', id: result.insertId });
  });
});
app.put('/tipos-servicio-externo/:id', (req, res) => {
  const { nombre, clasificacion } = req.body;
  db.query('UPDATE tipo_servicio_externo SET nombre=?, clasificacion=? WHERE id_tipo_servicio=?', [nombre, clasificacion, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Tipo de Servicio Actualizado' });
  });
});
app.delete('/tipos-servicio-externo/:id', (req, res) => {
  db.query('DELETE FROM tipo_servicio_externo WHERE id_tipo_servicio=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Tipo de Servicio Eliminado' });
  });
});

// 2. Servicios Externos Solicitados
app.get('/servicios-externos/:id_evento', (req, res) => {
  db.query(`
    SELECT se.*, tse.nombre as tipo_servicio, tse.clasificacion
    FROM servicio_externo se
    JOIN tipo_servicio_externo tse ON se.id_tipo_servicio = tse.id_tipo_servicio
    WHERE se.id_evento = ?
    ORDER BY se.fecha_solicitud DESC`, [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/servicios-externos', (req, res) => {
  const { id_evento, id_tipo_servicio, detalles, cantidad } = req.body;
  if (!id_evento || !id_tipo_servicio) return res.status(400).json({ mensaje: 'Datos requeridos faltantes' });
  db.query('INSERT INTO servicio_externo (id_evento, id_tipo_servicio, detalles, cantidad) VALUES (?, ?, ?, ?)', 
    [id_evento, id_tipo_servicio, detalles || '', cantidad || 1], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Servicio Externo Solicitado', id: result.insertId });
  });
});
app.put('/servicios-externos/:id/estado', (req, res) => {
  const { estado } = req.body;
  db.query('UPDATE servicio_externo SET estado=? WHERE id_servicio_ext=?', [estado, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Estado de Servicio Actualizado' });
  });
});
app.delete('/servicios-externos/:id', (req, res) => {
  db.query('DELETE FROM servicio_externo WHERE id_servicio_ext=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Servicio Externo Eliminado' });
  });
});

// 3. MÃƒÂ³dulo Organizadores
app.get('/organizadores/:id_evento', (req, res) => {
  db.query(`
    SELECT eo.id_evento_org, eo.rol_organizacion, u.id_usuario, u.nombre, u.correo
    FROM evento_organizador eo
    JOIN usuario u ON eo.id_usuario = u.id_usuario
    WHERE eo.id_evento = ?`, [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/organizadores', (req, res) => {
  const { id_evento, id_usuario, rol_organizacion } = req.body;
  if (!id_evento || !id_usuario || !rol_organizacion) return res.status(400).json({ mensaje: 'Datos faltantes' });
  db.query('INSERT INTO evento_organizador (id_evento, id_usuario, rol_organizacion) VALUES (?, ?, ?)', 
    [id_evento, id_usuario, rol_organizacion], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Organizador asignado' });
  });
});
app.delete('/organizadores/:id_evento_org', (req, res) => {
  db.query('DELETE FROM evento_organizador WHERE id_evento_org=?', [req.params.id_evento_org], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Organizador removido' });
  });
});

// 4. MÃƒÂ³dulo Cronograma
app.get('/cronograma/:id_evento', (req, res) => {
  db.query(`
    SELECT ac.*, u.nombre as responsable
    FROM actividad_cronograma ac
    LEFT JOIN usuario u ON ac.id_usuario_responsable = u.id_usuario
    WHERE ac.id_evento = ?
    ORDER BY ac.fecha_cumplimiento ASC`, [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/mis-tareas/:id_usuario', (req, res) => {
  db.query(`
    SELECT ac.*, e.nombre as nombre_evento
    FROM actividad_cronograma ac
    JOIN evento e ON ac.id_evento = e.id_evento
    WHERE ac.id_usuario_responsable = ?
    ORDER BY ac.fecha_cumplimiento ASC`, [req.params.id_usuario], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/usuarios-coordinadores', (req, res) => {
  db.query(`SELECT id_usuario, nombre FROM usuario WHERE id_rol IN (SELECT id_rol FROM rol WHERE nombre = 'Coordinador de Evento' OR nombre = 'Administrador' OR nombre = 'Administrador de Evento' OR nombre = 'Especialista de eventos')`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/usuarios-apoyo', (req, res) => {
  db.query(`SELECT id_usuario, nombre FROM usuario WHERE id_rol IN (SELECT id_rol FROM rol WHERE nombre = 'Personal de Apoyo' OR nombre = 'Apoyo logÃƒÂ­stico')`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/cronograma', (req, res) => {
  const { id_evento, nombre_actividad, id_usuario_responsable, fecha_cumplimiento } = req.body;
  if (!id_evento || !nombre_actividad || !fecha_cumplimiento) return res.status(400).json({ mensaje: 'Datos faltantes' });
  db.query('INSERT INTO actividad_cronograma (id_evento, nombre_actividad, id_usuario_responsable, fecha_cumplimiento) VALUES (?, ?, ?, ?)', 
    [id_evento, nombre_actividad, id_usuario_responsable || null, fecha_cumplimiento], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Actividad agregada al cronograma' });
  });
});
app.put('/cronograma/:id_actividad/estado', (req, res) => {
  const { estado } = req.body;
  db.query('UPDATE actividad_cronograma SET estado=? WHERE id_actividad=?', [estado, req.params.id_actividad], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Estado de actividad actualizado' });
  });
});
app.delete('/cronograma/:id_actividad', (req, res) => {
  db.query('DELETE FROM actividad_cronograma WHERE id_actividad=?', [req.params.id_actividad], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Actividad eliminada' });
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ FASE 2: MOTOR DE GESTIÃƒâ€œN DOCUMENTAL Y CONTRACTUAL Ã¢â€â‚¬Ã¢â€â‚¬

// fs ya estÃƒÂ¡ requerido arriba

// const multer = require('multer');

// (ConfiguraciÃƒÂ³n de multer y creaciÃƒÂ³n de directorio removida por estar duplicada)
/*
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ storage: storage });
*/

// Mock temporal de upload fue eliminado porque ya implementamos multer de forma real

// Hacer pÃƒÂºblica la carpeta de uploads para descargar
app.use('/uploads', express.static(uploadDir));

// 1. Registro de envÃ­o al proveedor + CreaciÃ³n automÃ¡tica de Solicitud de CotizaciÃ³n en el Portal B2B
app.put('/servicios-externos/:id/proveedor', (req, res) => {
  const { id } = req.params;
  const { fecha_envio, id_proveedor_destino, descripcion_requerimientos, fecha_limite } = req.body;

  // Leer el servicio externo para obtener el evento y el tipo de servicio
  db.query('SELECT se.*, e.nombre as nombre_evento FROM servicio_externo se JOIN evento e ON se.id_evento = e.id_evento WHERE se.id_servicio_ext = ?', [id], (errRead, rows) => {
    if (errRead || rows.length === 0) return res.status(404).json({ error: 'Servicio externo no encontrado' });
    const servicio = rows[0];

    // Paso A: Actualizar fecha_envio_proveedor en servicio_externo
    db.query('UPDATE servicio_externo SET fecha_envio_proveedor = ? WHERE id_servicio_ext = ?', [fecha_envio || new Date(), id], (errUpd) => {
      if (errUpd) return res.status(500).json({ error: errUpd.message });

      // Paso B: Crear la solicitud de cotizaciÃ³n para que aparezca en el Portal del Proveedor
      const descReq = descripcion_requerimientos || `Servicio requerido: ${servicio.tipo_servicio || 'General'}`;
      const fechaLim = fecha_limite || (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();

      db.query(
        `INSERT INTO solicitud_cotizacion (id_evento, id_tipo_servicio, descripcion_requerimientos, fecha_limite, estado)
         VALUES (?, ?, ?, ?, 'Abierta')`,
        [servicio.id_evento, servicio.id_tipo_servicio, descReq, fechaLim],
        (errSol, solResult) => {
          // Paso C (opcional): Notificar por correo al proveedor especÃ­fico seleccionado
          if (!errSol && id_proveedor_destino) {
            db.query('SELECT correo, nombre_empresa, persona_contacto FROM proveedor_externo WHERE id_proveedor = ?', [id_proveedor_destino], (errProv, provRows) => {
              if (!errProv && provRows.length > 0) {
                const prov = provRows[0];
                // Enviar correo si el transporter estÃ¡ disponible
                try {
                  const nodemailer = require('nodemailer');
                  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: 'uapaproeventstmdeevento@gmail.com', pass: 'zhusbixlqltrkfoh' } });
                  transporter.sendMail({
                    from: 'uapaproeventstmdeevento@gmail.com',
                    to: prov.correo,
                    subject: `Nueva Solicitud de Servicio - UAPA ProEvent`,
                    html: `<h3>Hola ${prov.nombre_empresa},</h3>
                      <p>Se te ha asignado una nueva solicitud de cotizaciÃ³n para el evento <strong>${servicio.nombre_evento}</strong>.</p>
                      <p><strong>Servicio requerido:</strong> ${descReq}</p>
                      <p><strong>Fecha lÃ­mite para cotizar:</strong> ${fechaLim}</p>
                      <br><p>Ingresa a tu <a href="http://localhost:3000/licitaciones">Portal de Proveedores B2B</a> para enviar tu oferta.</p>
                      <p>Atentamente,<br>Departamento de Compras UAPA</p>`
                  }).catch(e => console.error('Error enviando correo a proveedor:', e));
                } catch(e) { /* transporter no disponible, silencio */ }
              }
            });
          }

          // Responder Ã©xito independientemente del correo
          res.json({ mensaje: 'Orden enviada y solicitud de cotizaciÃ³n creada en el portal del proveedor.', id_solicitud: errSol ? null : solResult.insertId });

          // Registrar en bitÃ¡cora
          const reqUserId = req.headers['x-usuario-id'];
          if (reqUserId) registrarMovimiento(reqUserId, null, 'ENVIO_ORDEN_PROVEEDOR', `Orden enviada para servicio externo ID ${id} del evento ID ${servicio.id_evento}. Solicitud de cotizaciÃ³n creada.`);
        }
      );
    });
  });
});

// 1. GestiÃƒÂ³n de Documentos
app.get('/documentos/:id_evento', (req, res) => {
  db.query(`
    SELECT d.*, u.nombre as subido_por
    FROM documento_evento d
    LEFT JOIN usuario u ON d.id_usuario_subio = u.id_usuario
    WHERE d.id_evento = ? AND d.estado = 'Activo'
    ORDER BY d.fecha_subida DESC`, [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/documentos/:id_evento', upload.single('archivo'), (req, res) => {
  const { id_evento } = req.params;
  const { tipo_documento, id_usuario_subio } = req.body;
  
  if (!req.file) return res.status(400).json({ mensaje: 'No se subiÃƒÂ³ ningÃƒÂºn archivo' });
  if (!tipo_documento) return res.status(400).json({ mensaje: 'Falta el tipo de documento' });

  const ruta_archivo = '/uploads/' + req.file.filename;
  const nombre_archivo = req.file.originalname;

  db.query(`INSERT INTO documento_evento (id_evento, tipo_documento, nombre_archivo, ruta_archivo, id_usuario_subio) VALUES (?, ?, ?, ?, ?)`,
    [id_evento, tipo_documento, nombre_archivo, ruta_archivo, id_usuario_subio || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Documento subido con ÃƒÂ©xito', id: result.insertId, ruta_archivo });
  });
});

app.delete('/documentos/:id_documento', (req, res) => {
  // LÃƒÂ³gica de borrado suave (Soft Delete) o archivo
  db.query(`UPDATE documento_evento SET estado = 'Archivado' WHERE id_documento = ?`, [req.params.id_documento], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Documento archivado' });
  });
});

// 2. Flujo de AprobaciÃƒÂ³n Legal
app.get('/flujo-legal/:id_evento', (req, res) => {
  db.query(`SELECT f.*, u.nombre as revisor FROM flujo_aprobacion_legal f LEFT JOIN usuario u ON f.id_usuario_revisor = u.id_usuario WHERE f.id_evento = ?`, 
    [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.length > 0 ? results[0] : null);
  });
});

app.post('/flujo-legal/:id_evento', (req, res) => {
  const { id_evento } = req.params;
  // Inicializar flujo
  db.query(`INSERT INTO flujo_aprobacion_legal (id_evento, estado_legal) VALUES (?, 'Pendiente') ON DUPLICATE KEY UPDATE estado_legal='Pendiente'`, 
    [id_evento], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Flujo legal iniciado' });
  });
});

app.put('/flujo-legal/:id_evento/resolucion', (req, res) => {
  const { id_evento } = req.params;
  const { estado_legal, observacion_legal, id_usuario_revisor } = req.body;
  
  db.query(`UPDATE flujo_aprobacion_legal SET estado_legal=?, observacion_legal=?, id_usuario_revisor=? WHERE id_evento=?`,
    [estado_legal, observacion_legal || '', id_usuario_revisor, id_evento], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'ResoluciÃƒÂ³n legal actualizada' });
  });
});

// Ã¢â€â‚¬Ã¢â€â‚¬ FASE 3: GESTIÃƒâ€œN OPERATIVA DEL SERVICIO Y CONTABILIDAD Ã¢â€â‚¬Ã¢â€â‚¬

app.put('/servicios-externos/:id/recepcion', (req, res) => {
  const { id } = req.params;
  const { estado_recepcion, incidencias } = req.body;
  db.query('UPDATE servicio_externo SET estado_recepcion = ?, incidencias = ?, fecha_recepcion = NOW() WHERE id_servicio_ext = ?', 
    [estado_recepcion || 'Recibido', incidencias || '', id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'RecepciÃƒÂ³n del servicio registrada' });
  });
});

// 3. Ciclo contable manual (Estado del pago)
app.put('/servicios-externos/:id/pago', (req, res) => {
  const { id } = req.params;
  const { estado_pago } = req.body;
  db.query('UPDATE servicio_externo SET estado_pago = ? WHERE id_servicio_ext = ?', [estado_pago, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Estado contable del pago actualizado' });
  });
});

// 4. Cierre manual de expediente validado
app.put('/eventos/:id/cerrar-expediente', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM actividad_cronograma WHERE id_evento = ? AND estado != 'Completada') as pendientes_cronograma,
      (SELECT COUNT(*) FROM servicio_externo WHERE id_evento = ? AND estado_pago != 'Completado') as pendientes_pago
  `;
  
  db.query(query, [id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const { pendientes_cronograma, pendientes_pago } = results[0];
    if (pendientes_cronograma > 0 || pendientes_pago > 0) {
      return res.status(400).json({ 
        mensaje: 'No se puede cerrar el expediente. Faltan actividades por completar o pagos por procesar.',
        pendientes_cronograma,
        pendientes_pago
      });
    }

    db.query('UPDATE evento SET estado = ? WHERE id_evento = ?', ['Finalizado', id], (errUpd) => {
      if (errUpd) return res.status(500).json({ error: errUpd.message });
      res.json({ mensaje: 'Expediente del evento cerrado correctamente.' });
    });
  });
});

// 5. Endpoint global para MÃƒÂ³dulo Proveedores (Frontend)
app.get('/servicios-externos-all', (req, res) => {
  db.query(`
    SELECT se.*, tse.nombre as tipo_servicio, tse.clasificacion, e.nombre as nombre_evento, e.fecha_inicio
    FROM servicio_externo se
    JOIN tipo_servicio_externo tse ON se.id_tipo_servicio = tse.id_tipo_servicio
    JOIN evento e ON se.id_evento = e.id_evento
    ORDER BY e.fecha_inicio DESC, se.fecha_solicitud DESC
  `, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// --- ENDPOINTS ADMINISTRATIVOS FASE 2 ---
app.put('/api/servicio_externo/:id/admin', (req, res) => {
  const { numero_orden_compra, requiere_contrato } = req.body;
  const id_usuario = req.headers['x-usuario-id'];
  db.query('UPDATE servicio_externo SET numero_orden_compra = ?, requiere_contrato = ? WHERE id_servicio_ext = ?', 
    [numero_orden_compra, requiere_contrato, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      if(id_usuario) db.query('INSERT INTO bitacora_movimiento (id_usuario, accion, detalles) VALUES (?, ?, ?)', [id_usuario, 'ACTUALIZAR_OC_SERVICIO', `OC asignada a servicio ext ID ${req.params.id}`]);
      res.json({ mensaje: 'Datos administrativos del servicio actualizados' });
  });
});

app.put('/api/presupuesto/:id_evento', (req, res) => {
  const { estado } = req.body;
  const id_usuario = req.headers['x-usuario-id'];
  db.query('SELECT id_presupuesto FROM presupuesto WHERE id_evento = ?', [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      db.query('INSERT INTO presupuesto (id_evento, total, estado) VALUES (?, 0, ?)', [req.params.id_evento, estado], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if(id_usuario) db.query('INSERT INTO bitacora_movimiento (id_usuario, accion, detalles) VALUES (?, ?, ?)', [id_usuario, 'CREAR_PRESUPUESTO', `Presupuesto creado con estado ${estado} para evento ${req.params.id_evento}`]);
        res.json({ mensaje: 'Presupuesto creado y estado actualizado' });
      });
    } else {
      db.query('UPDATE presupuesto SET estado = ? WHERE id_evento = ?', [estado, req.params.id_evento], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if(id_usuario) db.query('INSERT INTO bitacora_movimiento (id_usuario, accion, detalles) VALUES (?, ?, ?)', [id_usuario, 'ACTUALIZAR_PRESUPUESTO', `Presupuesto actualizado a ${estado} para evento ${req.params.id_evento}`]);
        res.json({ mensaje: 'Estado del presupuesto actualizado' });
      });
    }
  });
});

app.put('/api/flujo_legal/:id_evento', (req, res) => {
  const { estado_legal, observacion_legal, id_usuario_revisor } = req.body;
  const id_usuario = req.headers['x-usuario-id'] || id_usuario_revisor;
  db.query('SELECT id_flujo_legal FROM flujo_aprobacion_legal WHERE id_evento = ?', [req.params.id_evento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      db.query('INSERT INTO flujo_aprobacion_legal (id_evento, estado_legal, observacion_legal, id_usuario_revisor) VALUES (?, ?, ?, ?)', 
        [req.params.id_evento, estado_legal, observacion_legal, id_usuario_revisor], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if(id_usuario) db.query('INSERT INTO bitacora_movimiento (id_usuario, accion, detalles) VALUES (?, ?, ?)', [id_usuario, 'DICTAMEN_LEGAL', `Dictamen Legal: ${estado_legal} para evento ${req.params.id_evento}`]);
          res.json({ mensaje: 'Flujo legal creado y actualizado' });
      });
    } else {
      db.query('UPDATE flujo_aprobacion_legal SET estado_legal = ?, observacion_legal = ?, id_usuario_revisor = ? WHERE id_evento = ?', 
        [estado_legal, observacion_legal, id_usuario_revisor, req.params.id_evento], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if(id_usuario) db.query('INSERT INTO bitacora_movimiento (id_usuario, accion, detalles) VALUES (?, ?, ?)', [id_usuario, 'DICTAMEN_LEGAL_ACTUALIZADO', `Dictamen actualizado a ${estado_legal} para evento ${req.params.id_evento}`]);
          res.json({ mensaje: 'Flujo legal actualizado' });
      });
    }
  });
});

app.get('/api/admin_evento/:id_evento', (req, res) => {
  const id_evento = req.params.id_evento;
  db.query('SELECT * FROM presupuesto WHERE id_evento = ?', [id_evento], (e1, r1) => {
    db.query('SELECT * FROM flujo_aprobacion_legal WHERE id_evento = ?', [id_evento], (e2, r2) => {
      db.query(`
        SELECT cr.*, sc.id_evento, pe.nombre as proveedor_nombre 
        FROM cotizacion_recibida cr
        JOIN solicitud_cotizacion sc ON cr.id_solicitud = sc.id_solicitud
        JOIN proveedor_externo pe ON cr.id_proveedor = pe.id_proveedor
        WHERE sc.id_evento = ?`, [id_evento], (e3, r3) => {
          res.json({
            presupuesto: r1[0] || { estado: 'Pendiente' },
            legal: r2[0] || { estado_legal: 'Pendiente', observacion_legal: '' },
            cotizaciones: r3 || []
          });
      });
    });
  });
});

app.get('/api/notificaciones/cotizaciones-vencidas', (req, res) => {
  db.query(`
    SELECT cr.id_cotizacion, pe.nombre as proveedor_nombre, cr.fecha_vigencia, sc.id_evento
    FROM cotizacion_recibida cr
    JOIN solicitud_cotizacion sc ON cr.id_solicitud = sc.id_solicitud
    JOIN proveedor_externo pe ON cr.id_proveedor = pe.id_proveedor
    WHERE cr.fecha_vigencia < DATE_ADD(NOW(), INTERVAL 5 DAY)
  `, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// --- INTEGRACIÃƒâ€œN FASE 4 (Proveedores Externos e IA) ---
// Transportador configurado con GMail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'uapaproeventstmdeevento@gmail.com', pass: 'zhusbixlqltrkfoh' }
});
const rutasFase4 = require('./rutas_fase4')(db, transporter);
app.use('/api', rutasFase4);

// INSTANCIACIÃƒâ€œN DE SERVIDOR EXPRESS JS AL PUERTO ESPECIFICADO LEYENDO VARIABLES DOTENV Y ARRANCANDO CICLO HOST NODE
app.listen(8080, () => { // Bucle infinito Server Boot Initialization process process.env.PORT || 8080 Start Listen TCP Socket Interface Binding Local Network Address Loopback Loop Listen Loop Cycle
  console.log('Ã°Å¸Å¡â‚¬ Servidor corriendo en http://localhost:8080'); // Terminal Print Output Message Banner Ready System OK Green Light Go Online Broadcast Network Server JS Master
});
// -- MODULO DE NOTIFICACIONES DEL SISTEMA --
// GET: Notificaciones no leidas del usuario activo (por ID y por rol)
app.get('/api/notificaciones', (req, res) => {
  const { id_usuario, rol } = req.query;
  if (!id_usuario && !rol) return res.status(400).json({ mensaje: 'Se requiere id_usuario o rol' });
  const sql = 'SELECT * FROM notificacion_sistema WHERE leido = 0 AND (id_usuario_destino = ? OR rol_destino = ?) ORDER BY fecha DESC LIMIT 50';
  db.query(sql, [id_usuario || null, rol || null], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// PUT: Marcar una notificacion como leida
app.put('/api/notificaciones/:id/leer', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE notificacion_sistema SET leido = 1 WHERE id_notificacion = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Notificacion marcada como leida' });
  });
});

// PUT: Marcar TODAS las notificaciones de un usuario/rol como leidas
app.put('/api/notificaciones/marcar-todas-leidas', (req, res) => {
  const { id_usuario, rol } = req.body;
  const sql = 'UPDATE notificacion_sistema SET leido = 1 WHERE leido = 0 AND (id_usuario_destino = ? OR rol_destino = ?)';
  db.query(sql, [id_usuario || null, rol || null], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Todas las notificaciones marcadas como leidas' });
  });
});
