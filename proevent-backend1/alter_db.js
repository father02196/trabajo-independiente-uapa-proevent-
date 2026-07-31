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

  const sql = "ALTER TABLE documento_evento ADD COLUMN estado_firma ENUM('Pendiente', 'Firmado', 'Rechazado') DEFAULT 'Pendiente'";
  
  db.query(sql, (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna estado_firma ya existe.');
      } else {
        console.error('Error alterando la tabla:', error);
      }
    } else {
      console.log('Columna estado_firma añadida con éxito.');
    }
    db.end();
  });
});
