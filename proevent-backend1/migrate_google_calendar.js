const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'uapa_proevent';
    const con = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: dbName
    });

    console.log(`Verificando la tabla 'evento' en la base de datos '${dbName}'...`);
    
    // Verificar si la columna google_event_id ya existe
    const [rows] = await con.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'evento' 
      AND COLUMN_NAME = 'google_event_id'
    `, [dbName]);

    if (rows.length === 0) {
      console.log('⚠️  La columna google_event_id no existe. Creando...');
      await con.query(`
        ALTER TABLE evento 
        ADD COLUMN google_event_id VARCHAR(255) NULL DEFAULT NULL
      `);
      console.log('✅ Columna google_event_id agregada con éxito.');
    } else {
      console.log('✅ La columna google_event_id ya existe. Se ignoró la modificación para evitar errores.');
    }

    con.end();
  } catch (error) {
    console.error('❌ Error al actualizar la base de datos:', error);
  }
}

run();
