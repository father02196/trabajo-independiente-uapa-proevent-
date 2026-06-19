const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos para migración de Fase 4 (Proveedores e IA).');

  const queries = [
    `CREATE TABLE IF NOT EXISTS proveedor_externo (
      id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
      nombre_empresa VARCHAR(255) NOT NULL,
      rnc_cedula VARCHAR(50) NOT NULL UNIQUE,
      id_tipo_servicio INT NOT NULL, -- Categoría principal a la que pertenece
      persona_contacto VARCHAR(255),
      correo VARCHAR(255) NOT NULL UNIQUE,
      telefono VARCHAR(50),
      contrasena_hash VARCHAR(255) NOT NULL,
      estado ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_tipo_servicio) REFERENCES tipo_servicio_externo(id_tipo_servicio) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS solicitud_cotizacion (
      id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL,
      id_tipo_servicio INT NOT NULL,
      descripcion_requerimientos TEXT,
      fecha_limite DATETIME NOT NULL,
      estado ENUM('Abierta', 'Cerrada', 'Adjudicada') DEFAULT 'Abierta',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_tipo_servicio) REFERENCES tipo_servicio_externo(id_tipo_servicio) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS cotizacion_recibida (
      id_cotizacion INT AUTO_INCREMENT PRIMARY KEY,
      id_solicitud INT NOT NULL,
      id_proveedor INT NOT NULL,
      moneda ENUM('DOP', 'USD', 'EUR') DEFAULT 'DOP',
      fecha_vigencia DATE NOT NULL,
      comentarios TEXT,
      ruta_documento_pdf VARCHAR(500) NOT NULL,
      monto_total_detectado DECIMAL(10,2), -- Puede ser rellenado por la IA o manualmente
      estado ENUM('Subida', 'Evaluada', 'Seleccionada', 'Rechazada') DEFAULT 'Subida',
      fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_solicitud) REFERENCES solicitud_cotizacion(id_solicitud) ON DELETE CASCADE,
      FOREIGN KEY (id_proveedor) REFERENCES proveedor_externo(id_proveedor) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS analisis_ia_comparativo (
      id_analisis INT AUTO_INCREMENT PRIMARY KEY,
      id_solicitud INT NOT NULL UNIQUE,
      proveedor_recomendado_id INT,
      justificacion_ia TEXT,
      matriz_comparativa_json JSON,
      fecha_analisis DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_solicitud) REFERENCES solicitud_cotizacion(id_solicitud) ON DELETE CASCADE,
      FOREIGN KEY (proveedor_recomendado_id) REFERENCES proveedor_externo(id_proveedor) ON DELETE SET NULL
    )`
  ];

  let completed = 0;

  queries.forEach((query, index) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`Error ejecutando query ${index + 1}:`, err.message);
      } else {
        console.log(`Query ${index + 1} ejecutada con éxito.`);
      }

      completed++;
      if (completed === queries.length) {
        console.log('Migración Fase 4 finalizada.');
        db.end();
      }
    });
  });
});
