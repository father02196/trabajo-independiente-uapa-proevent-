const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado a MySQL');
  
  const query = `
    CREATE TABLE IF NOT EXISTS mantenimiento_audiovisual (
      id_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
      id_equipo INT NOT NULL,
      tipo VARCHAR(100) NOT NULL,
      descripcion TEXT,
      cantidad INT DEFAULT 1,
      estado_registro ENUM('Activo', 'Resuelto') DEFAULT 'Activo',
      fecha_inicio DATE,
      fecha_fin DATE,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_equipo) REFERENCES equipo_audiovisual(id_equipo) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error creando tabla mantenimiento_audiovisual:', error);
    } else {
      console.log('Tabla mantenimiento_audiovisual creada o verificada exitosamente.');
    }
    db.end();
  });
});
