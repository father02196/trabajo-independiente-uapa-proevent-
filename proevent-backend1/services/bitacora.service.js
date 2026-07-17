const { validateAction, AUDIT_CRITICALITY, AUDIT_ACTIONS } = require('../constants/bitacora.actions');
const { normalizeAndValidateActor, AUDIT_ACTOR_TYPES } = require('../constants/bitacora.actors');
const { serializeDetails } = require('../utils/sanitizer');

class BitacoraService {

  static pool = null;

  static init(dbPool) {
    this.pool = dbPool;
  }

  static _buildPayload(req, actor, metadata) {
    return {
      requestId: req ? req.requestId : null,
      detalles: serializeDetails({
        modulo: metadata.modulo || null,
        entidad: metadata.entidad || null,
        id_entidad: metadata.id_entidad || null,
        resultado: metadata.resultado || 'EXITOSO',
        cambios: metadata.cambios || null,
        ip: req ? req.ip : '127.0.0.1',
        userAgent: req ? (req.headers['user-agent'] || 'Unknown') : 'System',
        metodoHttp: req ? req.method : 'INTERNAL',
        ruta: req ? req.originalUrl : 'INTERNAL'
      })
    };
  }

  static async auditCritical({ req, accion, metadata, connection, actorOverride }) {
    validateAction(accion);
    if (accion.criticality !== AUDIT_CRITICALITY.CRITICAL) throw new Error('Acción no crítica.');
    if (!connection) throw new Error('Falta connection transaccional.');

    const actorRaw = actorOverride || (req ? req.user : null);
    if (actorRaw && actorRaw.tipo_actor === AUDIT_ACTOR_TYPES.ANONIMO) throw new Error('ANONIMO no autorizado para auditCritical.');

    const actor = normalizeAndValidateActor(actorRaw);
    const { requestId, detalles } = this._buildPayload(req, actor, metadata);

    const query = `INSERT INTO bitacora_movimiento (id_usuario, id_rol, id_proveedor, tipo_actor, accion, detalles, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await connection.execute(query, [actor.id_usuario, actor.id_rol, actor.id_proveedor, actor.tipo_actor, accion.code, detalles, requestId]);
  }

  static auditBestEffort({ req, accion, metadata, actorOverride }) {
    return new Promise((resolve) => {
      (async () => {
        let poolConn = null;
        try {
          validateAction(accion);
          if (accion.criticality !== AUDIT_CRITICALITY.BEST_EFFORT) return;

          const actor = normalizeAndValidateActor(actorOverride || (req ? req.user : null) || { tipo_actor: AUDIT_ACTOR_TYPES.ANONIMO });
          const { requestId, detalles } = this._buildPayload(req, actor, metadata);

          const query = `INSERT INTO bitacora_movimiento (id_usuario, id_rol, id_proveedor, tipo_actor, accion, detalles, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
          
          if (!this.pool) {
            console.error('[AUDIT_ERROR] BitacoraService no ha sido inicializado con un pool de base de datos.');
            return resolve();
          }

          poolConn = await this.pool.promise().getConnection();
          await poolConn.execute(query, [actor.id_usuario, actor.id_rol, actor.id_proveedor, actor.tipo_actor, accion.code, detalles, requestId]);

        } catch (error) {
          console.error(`[AUDIT_BEST_EFFORT_FAILED] Action: ${accion?.code}. Error:`, error);
        } finally {
          if (poolConn) poolConn.release();
          resolve(); 
        }
      })();
    });
  }

  // --- MÉTODOS ESPECIALIZADOS FASE 2 ---
  static auditSystem({ accion, metadata }) {
    return this.auditBestEffort({
      req: null,
      accion,
      metadata,
      actorOverride: { tipo_actor: AUDIT_ACTOR_TYPES.SISTEMA }
    });
  }

  static auditAnonymous({ req, accion, metadata }) {
    return this.auditBestEffort({
      req,
      accion,
      metadata,
      actorOverride: { tipo_actor: AUDIT_ACTOR_TYPES.ANONIMO }
    });
  }

  static _maskEmail(email) {
    if (!email || typeof email !== 'string') return '[INVALID_EMAIL]';
    const parts = email.split('@');
    if (parts.length !== 2) return '[INVALID_FORMAT]';
    return `${parts[0].length > 2 ? parts[0].substring(0, 2) + '***' : parts[0] + '***'}@${parts[1]}`;
  }

  static logLoginFailure({ req, correoIntentado }) {
    this.auditAnonymous({
      req, accion: AUDIT_ACTIONS.LOGIN_FALLIDO,
      metadata: { cambios: { intentoCorreo: this._maskEmail((correoIntentado || '').toString().toLowerCase().trim()) } }
    });
  }

  static async logLoginSuccess({ req, user, connection }) {
    await this.auditCritical({
      req,
      accion: AUDIT_ACTIONS.LOGIN_EXITOSO,
      metadata: { entidad: 'Sesión', id_entidad: user.id_usuario },
      connection,
      actorOverride: { 
        id_usuario: user.id_usuario, 
        id_rol: user.id_rol, 
        tipo_actor: AUDIT_ACTOR_TYPES.INTERNO 
      }
    });
  }

  // --- FASE 4: CONSULTAS AVANZADAS, PAGINACIÓN Y EXPORTACIÓN ---
  static async getAuditLogs(queryParams) {
    if (!this.pool) throw new Error('BitacoraService no inicializado con la base de datos.');
    
    let { 
      page = 1, limit = 50, 
      fecha_inicio, fecha_fin, 
      id_usuario, tipo_actor, accion, modulo, entidad, resultado, request_id, 
      export_format 
    } = queryParams;
    
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 1000) limit = 50;
    if (export_format === 'csv') limit = 10000; // Permitir exportar hasta 10,000 en CSV
    
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM bitacora_movimiento b
      LEFT JOIN usuario u ON b.id_usuario = u.id_usuario
      LEFT JOIN rol r ON b.id_rol = r.id_rol
      LEFT JOIN proveedor_externo p ON b.id_proveedor = p.id_proveedor
      WHERE 1=1
    `;
    const queryValues = [];

    // Filtros
    if (fecha_inicio && fecha_fin) {
      baseQuery += ' AND b.fecha BETWEEN ? AND ?';
      queryValues.push(`${fecha_inicio} 00:00:00`, `${fecha_fin} 23:59:59`);
    }
    if (id_usuario) { baseQuery += ' AND b.id_usuario = ?'; queryValues.push(id_usuario); }
    if (tipo_actor) { baseQuery += ' AND b.tipo_actor = ?'; queryValues.push(tipo_actor); }
    if (accion) { baseQuery += ' AND b.accion = ?'; queryValues.push(accion); }
    if (modulo) { baseQuery += ' AND b.modulo = ?'; queryValues.push(modulo); }
    if (entidad) { baseQuery += ' AND b.entidad = ?'; queryValues.push(entidad); }
    if (resultado) { baseQuery += ' AND b.resultado = ?'; queryValues.push(resultado); }
    if (request_id) { baseQuery += ' AND b.request_id = ?'; queryValues.push(request_id); }

    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
    
    const selectQuery = `
      SELECT 
        b.id_bitacora, b.id_usuario, b.id_proveedor, b.id_rol, b.tipo_actor, 
        b.accion, b.detalles, b.fecha, b.request_id, b.modulo, b.entidad, b.id_entidad, b.resultado,
        u.nombre AS nombre_usuario, r.nombre AS rol_usuario, p.nombre_empresa AS nombre_proveedor
      ${baseQuery}
      ORDER BY b.fecha DESC
      LIMIT ? OFFSET ?
    `;

    const poolConn = this.pool.promise();
    const [countRows] = await poolConn.query(countQuery, queryValues);
    const total = countRows[0].total;

    const dataValues = [...queryValues, limit, offset];
    const [rows] = await poolConn.query(selectQuery, dataValues);

    if (export_format === 'csv') {
      return this._generateCSV(rows);
    }

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static _generateCSV(rows) {
    if (rows.length === 0) return 'Sin datos';
    const fields = ['ID', 'Fecha', 'Actor', 'Usuario/Proveedor', 'Acción', 'Módulo', 'Entidad', 'Resultado', 'Detalles JSON', 'Request ID'];
    const csvRows = [fields.join(',')];

    for (const row of rows) {
      const fecha = row.fecha ? new Date(row.fecha).toISOString() : '';
      const actorName = row.nombre_usuario || row.nombre_proveedor || row.tipo_actor;
      const details = (row.detalles ? row.detalles.replace(/"/g, '""') : '');
      const values = [
        row.id_bitacora,
        fecha,
        row.tipo_actor,
        `"${actorName}"`,
        row.accion,
        row.modulo || '',
        row.entidad || '',
        row.resultado || '',
        `"${details}"`,
        row.request_id || ''
      ];
      csvRows.push(values.join(','));
    }
    return csvRows.join('\\n');
  }

}

module.exports = BitacoraService;
