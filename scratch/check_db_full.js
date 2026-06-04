const mysql = require('c:/xampp/htdocs/cd/proevent-backend1/node_modules/mysql2/promise');

async function checkAllTables() {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', port: 3306,
    database: 'uapa_proevent', charset: 'utf8mb4'
  });

  const [tables] = await c.execute("SHOW TABLES");
  const dbName = 'Tables_in_uapa_proevent';

  console.log("--- EXAMINANDO BASE DE DATOS COMPLETA ---");
  for (const tRow of tables) {
    const tableName = tRow[dbName];
    // Obtener columnas de tipo texto
    const [cols] = await c.execute(`SHOW COLUMNS FROM \`${tableName}\``);
    const textCols = cols.filter(col => 
      col.Type.includes('varchar') || col.Type.includes('text') || col.Type.includes('char')
    ).map(col => col.Field);

    if (textCols.length === 0) continue;

    // Buscar si hay filas en esta tabla
    const [rows] = await c.execute(`SELECT * FROM \`${tableName}\``);
    if (rows.length === 0) continue;

    console.log(`\nTabla: ${tableName} (${rows.length} filas)`);
    for (const row of rows) {
      let foundCorrupt = false;
      let corruptDetails = [];
      
      for (const col of textCols) {
        const val = row[col];
        if (typeof val === 'string') {
          // Detectar caracteres corruptos comunes
          const hasBrokenUtf8 = val.includes('├') || val.includes('│') || val.includes('┬') || val.includes('┤') || val.includes('─') || val.includes('┼');
          const hasBrokenUnicode = /[\u0010-\u001F]/.test(val) || val.includes('\u001c') || val.includes('\u0002');
          
          if (hasBrokenUtf8 || hasBrokenUnicode) {
            foundCorrupt = true;
            corruptDetails.push(`${col}: "${val}"`);
          }
        }
      }
      
      if (foundCorrupt) {
        console.log(`  -> Fila:`, JSON.stringify(row).substring(0, 150));
        console.log(`     Corrupción detectada en:`, corruptDetails.join(' | '));
      }
    }
  }

  await c.end();
}

checkAllTables().catch(console.error);
