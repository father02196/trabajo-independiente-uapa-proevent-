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
  console.log('Conectado a la base de datos para migración de Fase 3.');

  const queries = [
    `ALTER TABLE servicio_externo 
     ADD COLUMN fecha_envio_proveedor DATETIME NULL,
     ADD COLUMN fecha_recepcion DATETIME NULL,
     ADD COLUMN estado_recepcion ENUM('Pendiente', 'Recibido', 'Con Incidencias') DEFAULT 'Pendiente',
     ADD COLUMN incidencias TEXT NULL,
     ADD COLUMN estado_pago ENUM('Pendiente', 'En revisión', 'Procesado', 'Completado') DEFAULT 'Pendiente'
    `
  ];

  let completed = 0;

  queries.forEach((query, index) => {
    db.query(query, (error) => {
      if (error) {
        // Ignorar error si las columnas ya existen (Duplicate column name)
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`Query ${index + 1}: Las columnas ya existen.`);
        } else {
            console.error(`Error ejecutando query ${index + 1}:`, error);
        }
      } else {
        console.log(`Query ${index + 1} ejecutado correctamente.`);
      }
      completed++;
      if (completed === queries.length) {
        console.log('Migración de Fase 3 completada.');
        db.end();
      }
    });
  });
});
