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
    CREATE TABLE IF NOT EXISTS auditoria_legal (
      id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      id_usuario INT,
      accion_realizada VARCHAR(255),
      id_evento INT,
      tipo_documento VARCHAR(150),
      estado_anterior VARCHAR(150),
      estado_nuevo VARCHAR(150),
      direccion_ip VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error creando la tabla:', error);
    } else {
      console.log('Tabla auditoria_legal verificada/creada con éxito.');
    }
    db.end();
  });
});
