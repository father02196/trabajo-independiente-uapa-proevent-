const mysql = require('./proevent-backend1/node_modules/mysql2/promise');

async function fixEncoding() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', port: 3306,
    database: 'uapa_proevent', charset: 'utf8mb4'
  });

  console.log('Conectado. Corrigiendo datos corruptos...\n');

  // Fix dependencias
  const dependencias = [
    [1,  'CEGES'],
    [2,  'Rectoría'],
    [3,  'Centro de apoyo'],
    [4,  'Asesoría legal'],
    [5,  'Dirección de tecnología informática'],
    [6,  'Secretaría general'],
    [7,  'Archivo central'],
    [8,  'Registro'],
    [9,  'Vicerrectoría académica'],
    [10, 'Dirección académica'],
    [11, 'Servicio al participante y vida universitaria'],
    [12, 'Evaluación de los aprendizajes'],
    [13, 'Menciones tecnopedagógicas'],
    [14, 'Práctica profesional y servicio social'],
    [15, 'Dirección académica de recintos'],
    [16, 'Vicerrectoría de investigación y posgrado'],
    [17, 'Investigación divulgación científica'],
    [18, 'Investigación formativa'],
    [19, 'Dirección de programa de posgrado'],
    [20, 'Biblioteca'],
    [21, 'Vicerrectorías administrativa y financiera'],
    [22, 'Dirección administrativa'],
    [23, 'Dirección financiera'],
    [24, 'Gestión humana'],
    [25, 'Publicaciones'],
    [26, 'CAP'],
    [27, 'CUDE'],
    [28, 'Vicerrectoría de planificación, innovación y desarrollo'],
    [29, 'Aseguración de la calidad'],
    [30, 'Planificación y control'],
    [31, 'Innovación'],
    [32, 'Vicerrectoría de vinculación y comunicación'],
    [33, 'Relaciones institucionales e interinstitucionales'],
    [34, 'Dirección de vinculación y extensión'],
    [35, 'Extensión voluntariado'],
    [36, 'Admisiones'],
    [37, 'Protocolo y eventos'],
    [38, 'Relaciones públicas'],
    [39, 'Captación de nuevos participantes'],
    [40, 'Coopfre UAPA'],
  ];

  for (const [id, nombre] of dependencias) {
    await conn.execute('UPDATE dependencia SET nombre=? WHERE id_dependencia=?', [nombre, id]);
  }
  console.log('✅ Dependencias corregidas');

  // Fix roles
  const roles = [
    [1, 'Administrador'],
    [2, 'Especialista de eventos'],
    [3, 'Solicitante'],
    [4, 'Apoyo logístico'],
    [5, 'Responsable de área audiovisual'],
    [6, 'Asesor legal'],
    [7, 'Proveedor externo'],
  ];
  for (const [id, nombre] of roles) {
    await conn.execute('UPDATE rol SET nombre=? WHERE id_rol=?', [nombre, id]).catch(() => {});
  }
  console.log('✅ Roles corregidos');

  // Fix recintos
  const recintos = [
    [1, 'Cibao Oriental'],
    [2, 'Nagua'],
    [3, 'Santo Domingo Oriental'],
    [4, 'Santiago'],
  ];
  for (const [id, nombre] of recintos) {
    await conn.execute('UPDATE recinto SET nombre=? WHERE id_recinto=?', [nombre, id]).catch(() => {});
  }
  console.log('✅ Recintos corregidos');

  // Fix tipo_evento_master (event types)
  const [tiposEvento] = await conn.execute('SELECT id_tipo_evento, nombre FROM tipo_evento_master');
  for (const t of tiposEvento) {
    const fixed = fixText(t.nombre);
    if (fixed !== t.nombre) {
      await conn.execute('UPDATE tipo_evento_master SET nombre=? WHERE id_tipo_evento=?', [fixed, t.id_tipo_evento]);
    }
  }
  console.log('✅ Tipos de evento corregidos');

  // Fix tipo_detalle_corporativo
  const [tiposDetalle] = await conn.execute('SELECT id_tipo, nombre FROM tipo_detalle_corporativo').catch(() => [[]]);
  for (const t of tiposDetalle) {
    const fixed = fixText(t.nombre);
    if (fixed !== t.nombre) {
      await conn.execute('UPDATE tipo_detalle_corporativo SET nombre=? WHERE id_tipo=?', [fixed, t.id_tipo]);
    }
  }
  console.log('✅ Detalles corporativos corregidos');

  // Fix alimento
  const [alimentos] = await conn.execute('SELECT id_alimento, nombre FROM alimento').catch(() => [[]]);
  for (const a of alimentos) {
    const fixed = fixText(a.nombre);
    if (fixed !== a.nombre) {
      await conn.execute('UPDATE alimento SET nombre=? WHERE id_alimento=?', [fixed, a.id_alimento]);
    }
  }
  console.log('✅ Alimentos corregidos');

  // Fix tipo_servicio_externo
  const [tiposServ] = await conn.execute('SELECT id_tipo_servicio, nombre FROM tipo_servicio_externo').catch(() => [[]]);
  for (const t of tiposServ) {
    const fixed = fixText(t.nombre);
    if (fixed !== t.nombre) {
      await conn.execute('UPDATE tipo_servicio_externo SET nombre=? WHERE id_tipo_servicio=?', [fixed, t.id_tipo_servicio]);
    }
  }
  console.log('✅ Tipos de servicio externo corregidos');

  // Fix usuarios nombres
  const [usuarios] = await conn.execute('SELECT id_usuario, nombre FROM usuario').catch(() => [[]]);
  for (const u of usuarios) {
    const fixed = fixText(u.nombre);
    if (fixed !== u.nombre) {
      await conn.execute('UPDATE usuario SET nombre=? WHERE id_usuario=?', [fixed, u.id_usuario]);
    }
  }
  console.log('✅ Nombres de usuarios corregidos');

  await conn.end();
  console.log('\n🎉 Todo corregido exitosamente!');
}

// Helper to fix common UTF-8 double-encoding issues
function fixText(str) {
  if (!str) return str;
  try {
    // The data was stored as latin1 bytes that represent utf8 sequences
    // We decode them by treating each char code as a byte
    const bytes = Buffer.from(str.split('').map(c => c.charCodeAt(0)));
    return bytes.toString('utf8');
  } catch (e) {
    return str;
  }
}

fixEncoding().catch(console.error);
