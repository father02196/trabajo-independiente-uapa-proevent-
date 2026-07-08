const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent',
  port: 3306
});

const query = `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol, u.estado, u.contrasena, u.password_hash, u.locked_until, u.failed_login_attempts, u.token_version
     FROM usuario u
     JOIN rol r ON u.id_rol = r.id_rol
     WHERE u.correo = ?`;

db.query(query, ['test@uapa.edu.do'], (err, results) => {
  if (err) {
    console.error("ERROR:");
    console.error(err);
  } else {
    console.log("SUCCESS:");
    console.log(results);
  }
  db.end();
});
