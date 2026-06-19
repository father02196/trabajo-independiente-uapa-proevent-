const mysql = require('./proevent-backend1/node_modules/mysql2/promise');

async function fixRoles() {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', port: 3306,
    database: 'uapa_proevent', charset: 'utf8mb4'
  });

  const [roles] = await c.execute('SELECT * FROM rol ORDER BY id_rol');
  console.log('Roles actuales:', JSON.stringify(roles, null, 2));

  // Insert missing roles
  const rolesNeeded = [
    [2, 'Especialista de eventos'],
    [6, 'Asesor legal'],
  ];
  for (const [id, nombre] of rolesNeeded) {
    const [existing] = await c.execute('SELECT id_rol FROM rol WHERE id_rol=?', [id]);
    if (existing.length === 0) {
      await c.execute('INSERT INTO rol (id_rol, nombre) VALUES (?, ?)', [id, nombre]);
      console.log(`✅ Rol insertado: ${nombre}`);
    } else {
      // Update the name in case it's corrupted
      await c.execute('UPDATE rol SET nombre=? WHERE id_rol=?', [nombre, id]);
      console.log(`✅ Rol actualizado: ${nombre}`);
    }
  }

  const [r2] = await c.execute('SELECT * FROM rol ORDER BY id_rol');
  console.log('\nRoles finales:', JSON.stringify(r2, null, 2));
  await c.end();
}

fixRoles().catch(console.error);
