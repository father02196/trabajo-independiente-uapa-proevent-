const mysql = require('c:/xampp/htdocs/cd/proevent-backend1/node_modules/mysql2/promise');

// Mapeos de corrección para caracteres rotos (UTF-8 roto en latin1)
const utf8Replacements = [
  { bad: '├í', good: 'á' },
  { bad: '├⌐', good: 'é' },
  { bad: '├í', good: 'á' }, // Duplicado de seguridad
  { bad: '├¡', good: 'í' },
  { bad: '├│', good: 'ó' },
  { bad: '├║', good: 'ú' },
  { bad: '├▒', good: 'ñ' },
  { bad: '├╝', good: 'ü' },
  { bad: '├┬', good: 'Â' },
  { bad: '├┬', good: 'Á' },
  { bad: '├┴', good: 'Á' },
  { bad: '├┼', good: 'É' },
  { bad: '├═', good: 'Í' },
  { bad: '├У', good: 'Ó' },
  { bad: '├Ъ', good: 'Ú' },
  { bad: '├С', good: 'Ñ' },
  { bad: '├Ф', good: 'Ö' },
  { bad: '├û', good: 'Ö' },
  { bad: '├а', good: 'à' },
  { bad: '├и', good: 'è' },
  { bad: '├о', good: 'ò' },
  { bad: '├╣', good: 'ù' },
  { bad: '├в', good: 'â' },
  { bad: '├к', good: 'ê' },
  { bad: '├о', good: 'î' },
  { bad: '├┤', good: 'ô' },
  { bad: '├╗', good: 'û' },
  { bad: '├Д', good: 'Ä' },
  { bad: '├Х', good: 'ë' },
  { bad: '├Ц', good: 'Ö' },
  { bad: '├Ь', good: 'Ü' },
  { bad: '├о', good: 'î' }
];

// Mapeos de caracteres corruptos de UTF-16LE interpretados incorrectamente
const unicodeReplacements = [
  { bad: 'pr\u001cctico', good: 'práctico' },
  { bad: 'pr\u001cctico', good: 'práctico' },
  { bad: 'investigaci\u001c\u0002n', good: 'investigación' },
  { bad: 'investigaci\u001cn', good: 'investigación' },
  { bad: 'Reuni\u001c\u0002n', good: 'Reunión' },
  { bad: 'Reuni\u001cn', good: 'Reunión' },
  { bad: 'acad\u001c\u0010mico', good: 'académico' },
  { bad: 'acad\u001cmico', good: 'académico' },
  { bad: 'Decoraci\u001c\u0002n', good: 'Decoración' },
  { bad: 'Decoraci\u001cn', good: 'Decoración' },
  { bad: 'Log\u001cstica', good: 'Logística' },
  { bad: 'Log\u001cstica', good: 'Logística' },
  // General fallback patterns for these weird binary insertions
  { bad: /\u001c\u0002/g, good: 'ó' },
  { bad: /\u001c\u0010/g, good: 'é' },
  { bad: /\u001c/g, good: 'á' }, // Puede ser á o í, veamos la palabra
];

// Correcciones específicas por tabla y columna conocidas
const specificCorrections = [
  { table: 'tipo_evento_master', col: 'nombre', idCol: 'id_tipo_evento', idVal: 2, good: 'Curso taller práctico' },
  { table: 'tipo_evento_master', col: 'nombre', idCol: 'id_tipo_evento', idVal: 9, good: 'Jornada de investigación' },
  { table: 'tipo_evento_master', col: 'nombre', idCol: 'id_tipo_evento', idVal: 1, good: 'Reunión' },
  { table: 'tipo_evento_master', col: 'nombre', idCol: 'id_tipo_evento', idVal: 13, good: 'Reunión de cuentas' },
  { table: 'tipo_evento_master', col: 'nombre', idCol: 'id_tipo_evento', idVal: 5, good: 'Seminario académico' },
  
  { table: 'tipo_servicio_externo', col: 'nombre', idCol: 'id_tipo_servicio', idVal: 2, good: 'Decoración' },
  { table: 'tipo_servicio_externo', col: 'nombre', idCol: 'id_tipo_servicio', idVal: 5, good: 'Logística' },

  { table: 'equipo_audiovisual', col: 'nombre', idCol: 'id_equipo', idVal: 3, good: 'Micrófonos' },
  { table: 'equipo_audiovisual', col: 'nombre', idCol: 'id_equipo', idVal: 4, good: 'Cámaras (Grabación)' },
  { table: 'equipo_audiovisual', col: 'nombre', idCol: 'id_equipo', idVal: 5, good: 'Transmisión en vivo' },
  { table: 'equipo_audiovisual', col: 'nombre', idCol: 'id_equipo', idVal: 6, good: 'Iluminación' },

  { table: 'recinto', col: 'nombre', idCol: 'id_recinto', idVal: 8, good: 'Higüey' }
];

async function runFix() {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', port: 3306,
    database: 'uapa_proevent', charset: 'utf8mb4'
  });

  console.log("--- INICIANDO CORRECCIÓN GENERAL DE CARACTERES CORRUPTOS ---");

  // 1. Aplicar correcciones específicas conocidas
  console.log("\n1. Aplicando correcciones específicas conocidas...");
  for (const corr of specificCorrections) {
    try {
      const [res] = await c.execute(
        `UPDATE \`${corr.table}\` SET \`${corr.col}\` = ? WHERE \`${corr.idCol}\` = ?`,
        [corr.good, corr.idVal]
      );
      if (res.affectedRows > 0) {
        console.log(`  [OK] ${corr.table} (ID ${corr.idVal}): ${corr.col} -> "${corr.good}"`);
      }
    } catch (e) {
      console.error(`  [ERROR] Al corregir ${corr.table}:`, e.message);
    }
  }

  // 2. Escanear y reparar dinámicamente todas las tablas usando las reglas generales de UTF-8 corrupto
  console.log("\n2. Escaneando y reparando dinámicamente todas las tablas...");
  const [tables] = await c.execute("SHOW TABLES");
  const dbName = 'Tables_in_uapa_proevent';

  for (const tRow of tables) {
    const tableName = tRow[dbName];
    // Obtener columnas de tipo texto
    const [cols] = await c.execute(`SHOW COLUMNS FROM \`${tableName}\``);
    const textCols = cols.filter(col => 
      col.Type.includes('varchar') || col.Type.includes('text') || col.Type.includes('char')
    ).map(col => col.Field);

    if (textCols.length === 0) continue;

    // Buscar el campo primario ID
    const idField = cols.find(col => col.Key === 'PRI')?.Field || textCols[0];

    const [rows] = await c.execute(`SELECT * FROM \`${tableName}\``);
    if (rows.length === 0) continue;

    for (const row of rows) {
      let needsUpdate = false;
      const updateData = {};

      for (const col of textCols) {
        let val = row[col];
        if (typeof val === 'string') {
          let cleanedVal = val;
          
          // Reemplazar UTF-8 roto
          for (const rep of utf8Replacements) {
            if (cleanedVal.includes(rep.bad)) {
              cleanedVal = cleanedVal.split(rep.bad).join(rep.good);
            }
          }

          // Reemplazar Unicode roto
          for (const rep of unicodeReplacements) {
            if (rep.bad instanceof RegExp) {
              if (rep.bad.test(cleanedVal)) {
                cleanedVal = cleanedVal.replace(rep.bad, rep.good);
              }
            } else {
              if (cleanedVal.includes(rep.bad)) {
                cleanedVal = cleanedVal.split(rep.bad).join(rep.good);
              }
            }
          }

          // Si cambió, marcar para actualizar
          if (cleanedVal !== val) {
            needsUpdate = true;
            updateData[col] = cleanedVal;
          }
        }
      }

      if (needsUpdate) {
        const idVal = row[idField];
        const updateSets = Object.keys(updateData).map(k => `\`${k}\` = ?`).join(', ');
        const updateValues = Object.values(updateData);
        updateValues.push(idVal);

        try {
          await c.execute(
            `UPDATE \`${tableName}\` SET ${updateSets} WHERE \`${idField}\` = ?`,
            updateValues
          );
          console.log(`  [REPARADO] Tabla ${tableName} ID ${idVal}:`, JSON.stringify(updateData));
        } catch (e) {
          console.error(`  [ERROR UPDATE] En tabla ${tableName} ID ${idVal}:`, e.message);
        }
      }
    }
  }

  // 3. Limpiar valores rotos en las tablas que referencian nombres corruptos de forma histórica
  console.log("\n3. Corrigiendo referencias históricas (como en 'evento' y 'servicio_audiovisual')...");
  try {
    const [evRes] = await c.execute(
      `UPDATE evento SET tipo_evento = REPLACE(tipo_evento, 'Curso taller pr├íctico', 'Curso taller práctico')`
    );
    console.log(`  [OK] Eventos corregidos: ${evRes.affectedRows}`);
  } catch (e) {
    console.error(`  [ERROR] En evento:`, e.message);
  }

  try {
    const [saRes1] = await c.execute(
      `UPDATE servicio_audiovisual SET tipo_servicio = 'Cámaras (Grabación)' WHERE tipo_servicio LIKE '%C├ímaras%'`
    );
    const [saRes2] = await c.execute(
      `UPDATE servicio_audiovisual SET tipo_servicio = 'Iluminación' WHERE tipo_servicio LIKE '%Iluminaci├│n%'`
    );
    const [saRes3] = await c.execute(
      `UPDATE servicio_audiovisual SET tipo_servicio = 'Micrófonos' WHERE tipo_servicio LIKE '%Micr├│fonos%'`
    );
    console.log(`  [OK] Servicios AV corregidos: Cámaras (${saRes1.affectedRows}), Iluminación (${saRes2.affectedRows}), Micrófonos (${saRes3.affectedRows})`);
  } catch (e) {
    console.error(`  [ERROR] En servicio_audiovisual:`, e.message);
  }

  // 4. Hacer una última verificación de escaneo
  console.log("\n4. Ejecutando verificación final...");
  await c.end();
  
  console.log("--- FINALIZADO ---");
}

runFix().catch(console.error);
