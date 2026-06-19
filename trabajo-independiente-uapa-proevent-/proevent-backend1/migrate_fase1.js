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
  console.log('Conectado a la base de datos para migración de Fase 1.');

  const queries = [
    `CREATE TABLE IF NOT EXISTS tipo_servicio_externo (
      id_tipo_servicio INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      clasificacion ENUM('Corriente', 'Especializado') DEFAULT 'Corriente'
    )`,
    `CREATE TABLE IF NOT EXISTS servicio_externo (
      id_servicio_ext INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL,
      id_tipo_servicio INT NOT NULL,
      estado ENUM('Pendiente', 'En revisión', 'Aprobado', 'Rechazado', 'Completado') DEFAULT 'Pendiente',
      detalles TEXT,
      cantidad INT DEFAULT 1,
      fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_tipo_servicio) REFERENCES tipo_servicio_externo(id_tipo_servicio) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS evento_organizador (
      id_evento_org INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL,
      id_usuario INT NOT NULL,
      rol_organizacion ENUM('Responsable', 'Coordinador', 'Apoyo') NOT NULL,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS actividad_cronograma (
      id_actividad INT AUTO_INCREMENT PRIMARY KEY,
      id_evento INT NOT NULL,
      nombre_actividad VARCHAR(255) NOT NULL,
      id_usuario_responsable INT,
      fecha_cumplimiento DATE NOT NULL,
      estado ENUM('Pendiente', 'En progreso', 'Completada', 'Retrasada') DEFAULT 'Pendiente',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_evento) REFERENCES evento(id_evento) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario_responsable) REFERENCES usuario(id_usuario) ON DELETE SET NULL
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
        // Insertar datos por defecto si no existen
        const insertCatalog = `
          INSERT IGNORE INTO tipo_servicio_externo (nombre, clasificacion) VALUES
          ('Sonido', 'Corriente'),
          ('Decoración', 'Corriente'),
          ('Catering', 'Corriente'),
          ('Transporte', 'Corriente'),
          ('Logística', 'Corriente'),
          ('Seguridad', 'Especializado'),
          ('Protocolo', 'Especializado')
        `;
        db.query(insertCatalog, (errInsert) => {
          if (errInsert) {
             console.error('Error insertando catálogo:', errInsert);
          } else {
             console.log('Catálogo base insertado.');
          }
          db.end();
        });
      }
    });
  });
});
