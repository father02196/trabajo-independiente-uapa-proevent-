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
  console.log('Conectado a la base de datos para migración de Fase 2.');

  const queries = [
    `CREATE TABLE IF NOT EXISTS documento_evento (
      id_documento INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL,
      tipo_documento ENUM('Cotización', 'Certificación Presupuestaria', 'Orden de Compra', 'Contrato', 'Factura', 'Otro') NOT NULL,
      nombre_archivo VARCHAR(255) NOT NULL,
      ruta_archivo VARCHAR(500) NOT NULL,
      id_usuario_subio INT,
      estado ENUM('Activo', 'Archivado') DEFAULT 'Activo',
      fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario_subio) REFERENCES usuario(id_usuario) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS flujo_aprobacion_legal (
      id_flujo_legal INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL UNIQUE,
      estado_legal ENUM('Pendiente', 'En revisión', 'Observado', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
      observacion_legal TEXT,
      id_usuario_revisor INT,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario_revisor) REFERENCES usuario(id_usuario) ON DELETE SET NULL
    )`
  ];

  let completed = 0;

  queries.forEach((query, index) => {
    db.query(query, (error) => {
      if (error) {
        console.error(`Error ejecutando query ${index + 1}:`, error);
      } else {
        console.log(`Query ${index + 1} ejecutado correctamente.`);
      }
      completed++;
      if (completed === queries.length) {
        console.log('Migración de Fase 2 completada.');
        db.end();
      }
    });
  });
});
