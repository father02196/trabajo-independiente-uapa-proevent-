const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'uapa_proevent'
  });

  try {
    console.log('Iniciando migración de bitacora_movimiento...');

    // Convertir detalles que no son JSON a un JSON válido para que ALTER TABLE no falle
    await connection.execute(`
      UPDATE bitacora_movimiento 
      SET detalles = JSON_OBJECT('mensajeOriginal', detalles) 
      WHERE JSON_VALID(detalles) = 0 AND detalles IS NOT NULL;
    `);
    console.log('Filas actualizadas a JSON válido.');

    await connection.execute(`
      ALTER TABLE bitacora_movimiento 
        ADD COLUMN id_proveedor INT NULL AFTER id_usuario,
        ADD COLUMN tipo_actor ENUM('INTERNO', 'PROVEEDOR', 'SISTEMA', 'SERVICIO_EXTERNO', 'IA', 'ANONIMO') NOT NULL DEFAULT 'INTERNO' AFTER id_rol,
        ADD COLUMN request_id VARCHAR(36) NULL AFTER fecha,
        MODIFY COLUMN detalles JSON;
    `);
    console.log('Columnas añadidas y modificadas con éxito.');

    await connection.execute(`CREATE INDEX idx_bitacora_request ON bitacora_movimiento(request_id);`);
    await connection.execute(`CREATE INDEX idx_bitacora_actor ON bitacora_movimiento(tipo_actor, id_usuario, id_proveedor);`);
    await connection.execute(`CREATE INDEX idx_bitacora_accion ON bitacora_movimiento(accion);`);
    
    console.log('Índices creados con éxito.');
    console.log('Migración completada.');

  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
