const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos.');

  const alterQuery = `ALTER TABLE servicio_audiovisual MODIFY COLUMN estado ENUM('Pendiente', 'En revisión', 'Aprobado', 'Rechazado', 'Completado') DEFAULT 'Pendiente'`;

  connection.query(alterQuery, (error, results) => {
    if (error) {
      console.error('Error al modificar la tabla:', error);
    } else {
      console.log('Tabla servicio_audiovisual modificada exitosamente. ENUM actualizado.');
    }
    connection.end();
  });
});
