const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent',
  port: 3306,
  multipleStatements: true
});

const query = `
  ALTER TABLE usuario 
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN password_changed_at DATETIME NULL,
  ADD COLUMN failed_login_attempts INT DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL,
  ADD COLUMN token_version INT DEFAULT 1;
`;

db.query(query, (err, results) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.error("ERROR:");
    console.error(err);
  } else {
    console.log("SUCCESS: Columns added or already exist.");
  }
  db.end();
});
