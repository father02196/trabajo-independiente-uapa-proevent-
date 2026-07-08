const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent',
  port: 3306
});

db.query("SHOW COLUMNS FROM usuario", (err, results) => {
  if (err) {
    console.error("ERROR al obtener columnas:");
    console.error(err);
  } else {
    console.log("Columnas de la tabla usuario:");
    results.forEach(r => console.log(` - ${r.Field} (${r.Type})`));
  }
  
  db.query("SELECT correo, contrasena, password_hash, id_rol FROM usuario LIMIT 5", (err2, rows) => {
    if (err2) {
      console.error("ERROR al obtener usuarios:", err2.message);
    } else {
      console.log("\nPrimeros 5 usuarios:");
      rows.forEach(u => console.log(JSON.stringify(u)));
    }
    db.end();
  });
});
