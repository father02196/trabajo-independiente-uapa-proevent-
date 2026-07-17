const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'uapa_proevent', port: 3306 });
db.query("SHOW COLUMNS FROM servicio_audiovisual LIKE 'estado'", (err, results) => {
  if (err) console.error(err);
  else console.log(results);
  db.end();
});
