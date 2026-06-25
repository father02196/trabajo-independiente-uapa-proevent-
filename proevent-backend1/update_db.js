const mysql = require('mysql2/promise');

async function run() {
  try {
    const con = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'uapa_proevent',
      multipleStatements: true
    });

    const query = `
      ALTER TABLE presupuesto MODIFY COLUMN estado ENUM('Pendiente','Asignado','Aprobado','Rechazado','Devuelto') DEFAULT 'Pendiente';
      ALTER TABLE evento MODIFY COLUMN estado ENUM('Pendiente','Aprobado','Rechazado','Finalizado','Observado') DEFAULT 'Pendiente';
      ALTER TABLE documento_evento MODIFY COLUMN tipo_documento ENUM('Cotización','Certificación Presupuestaria','Orden de Compra','Contrato','Factura','Evidencia Contabilidad','Otro');
      ALTER TABLE servicio_externo ADD COLUMN evidencia_contabilidad_ruta VARCHAR(500) NULL AFTER numero_orden_compra, ADD COLUMN usuario_resolucion_incidencia INT(11) NULL, ADD COLUMN comentario_resolucion TEXT NULL;
      
      CREATE TABLE IF NOT EXISTS historial_observaciones (
          id_observacion INT AUTO_INCREMENT PRIMARY KEY,
          id_evento INT NOT NULL,
          id_usuario INT NOT NULL,
          departamento ENUM('Legal', 'VAF-Presupuesto', 'Compras') NOT NULL,
          comentario TEXT NOT NULL,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_evento) REFERENCES evento(id_evento),
          FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
      );
    `;

    await con.query(query);
    console.log('Database updated successfully');
    con.end();
  } catch (error) {
    console.error('Error updating DB:', error);
  }
}

run();
