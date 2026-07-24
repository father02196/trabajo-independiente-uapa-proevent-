const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uapa_proevent'
});

const query = `
      SELECT a.id_analisis, a.id_solicitud, a.proveedor_recomendado_id, a.fecha_analisis, 
             'Licitacion' AS origen,
             s.id_evento, s.descripcion_requerimientos as requisitos, e.nombre as nombre_evento, 
             p.nombre_empresa as proveedor_nombre,
             c.monto_total_detectado, c.estado_pago, c.id_cotizacion as id_deuda, c.factura_pdf
      FROM analisis_ia_comparativo a
      JOIN solicitud_cotizacion s ON a.id_solicitud = s.id_solicitud
      JOIN evento e ON s.id_evento = e.id_evento
      JOIN proveedor_externo p ON a.proveedor_recomendado_id = p.id_proveedor
      LEFT JOIN cotizacion_recibida c ON a.proveedor_recomendado_id = c.id_proveedor AND a.id_solicitud = c.id_solicitud
      WHERE c.estado = 'Seleccionada'

      UNION ALL

      SELECT se.id_servicio_ext as id_analisis, NULL as id_solicitud, se.id_proveedor as proveedor_recomendado_id, se.fecha_envio_proveedor as fecha_analisis,
             'Logistica' AS origen,
             se.id_evento, se.detalles as requisitos, e.nombre as nombre_evento,
             p.nombre_empresa as proveedor_nombre,
             0 as monto_total_detectado, 
             CASE WHEN se.evidencia_contabilidad_ruta IS NOT NULL THEN 'Pagado' ELSE 'Pendiente' END as estado_pago,
             se.id_servicio_ext as id_deuda, se.evidencia_contabilidad_ruta as factura_pdf
      FROM servicio_externo se
      JOIN evento e ON se.id_evento = e.id_evento
      JOIN proveedor_externo p ON se.id_proveedor = p.id_proveedor
      WHERE se.fecha_envio_proveedor IS NOT NULL

      ORDER BY fecha_analisis DESC
`;

connection.query(query, (err, results) => {
  if (err) {
    console.error("SQL Error:", err.message);
  } else {
    console.log("Success! Found", results.length, "rows.");
  }
  process.exit(0);
});
