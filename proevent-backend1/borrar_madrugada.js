const mysql = require('mysql');
const db = mysql.createConnection({host:'localhost', user:'root', password:'', database:'uapa_proevent'});

db.query("DELETE FROM evento WHERE hora_inicio < '07:00:00' OR hora_inicio = '00:00:00'", (err, results) => {
  if (err) console.error(err);
  else console.log('Eventos eliminados:', results.affectedRows);
  process.exit();
});
