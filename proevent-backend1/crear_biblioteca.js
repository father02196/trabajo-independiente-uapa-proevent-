require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uapa_proevent'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado a la base de datos.');

  const sql = `
    CREATE TABLE IF NOT EXISTS biblioteca_legal (
      id_documento INT AUTO_INCREMENT PRIMARY KEY,
      nombre_archivo VARCHAR(255) NOT NULL,
      ruta_archivo VARCHAR(255) NOT NULL,
      categoria ENUM('Contratos', 'Reglamentos', 'Políticas', 'Leyes', 'Resoluciones', 'Plantillas') NOT NULL,
      tamano_bytes INT,
      id_usuario_carga INT,
      fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error creando la tabla:', error);
    } else {
      console.log('Tabla biblioteca_legal verificada/creada con éxito.');
    }
    db.end();
  });
});
