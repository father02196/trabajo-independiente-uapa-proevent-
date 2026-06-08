const mysql = require('mysql2');
const db = mysql.createConnection({host:'localhost', user:'root', password:'', database:'uapa_proevent'});

db.query("ALTER TABLE servicio_externo ADD COLUMN numero_orden_compra VARCHAR(50) DEFAULT NULL", (err) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  db.query("ALTER TABLE servicio_externo ADD COLUMN requiere_contrato BOOLEAN DEFAULT FALSE", (err2) => {
    if (err2 && err2.code !== 'ER_DUP_FIELDNAME') console.error(err2);
    db.query("ALTER TABLE presupuesto MODIFY COLUMN estado ENUM('Pendiente','Asignado','Aprobado','Rechazado') DEFAULT 'Pendiente'", (err3) => {
       if (err3) console.error(err3);
       console.log("DB altered");
       process.exit();
    });
  });
});
