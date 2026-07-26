// ============================================================
// UTILIDAD: sanitizer
// Pertenece a: Capa de Infraestructura (utils)
// Propósito: Limpia y normaliza los metadatos antes de persitirlos
// en la bitácora de auditoría. Elimina datos sensibles, referencias
// circulares, buffers, y trunca payloads que superen el límite de la BD.
// ============================================================

// Conjunto de claves cuyo valor será reemplazado por '[REDACTED]'
// para evitar que tokens, contraseñas y secretos queden en la bitácora.
const SENSITIVE_KEYS = new Set([
  'password', 'contrasena', 'contraseña', 'token', 'authorization', 'cookie', 'secret', 'apikey'
]);

/**
 * Recorre recursivamente un objeto y lo prepara para serialización segura.
 * Protecciones que aplica:
 *  - Profundidad máxima: evita stack overflows en objetos muy anidados.
 *  - Referencias circulares: detectadas con WeakSet para evitar bucles infinitos.
 *  - Errores de Node.js: los serializa (sin stack en producción).
 *  - Buffers: los reemplaza por un marcador legible.
 *  - Claves sensibles: su valor queda como '[REDACTED]'.
 *  - Strings muy largos (>5000 chars): se truncan para no rebasar el campo TEXT de MySQL.
 *
 * @param {*} obj - Valor a sanitizar (puede ser cualquier tipo)
 * @param {number} currentDepth - Nivel de profundidad actual (interno)
 * @param {number} maxDepth - Profundidad máxima permitida (default 5)
 * @param {WeakSet} seen - Registro de objetos ya visitados (interno)
 * @returns {*} El valor sanitizado, listo para JSON.stringify
 */
function sanitizeAuditMetadata(obj, currentDepth = 0, maxDepth = 5, seen = new WeakSet()) {
  if (currentDepth > maxDepth) return '[MAX_DEPTH_REACHED]';
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    if (seen.has(obj)) return '[CIRCULAR_REFERENCE_REMOVED]';
    seen.add(obj);
  }

  if (obj instanceof Error) {
    const isDev = process.env.NODE_ENV === 'development';
    // En producción se omite el stack trace para no exponer rutas internas del servidor
    return { name: obj.name, message: obj.message, stack: isDev ? obj.stack : '[REDACTED_IN_PROD]' };
  }

  if (Buffer.isBuffer(obj)) return '[BUFFER_REMOVED]';

  if (Array.isArray(obj)) return obj.map(item => sanitizeAuditMetadata(item, currentDepth + 1, maxDepth, seen));

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 5000) {
        sanitized[key] = value.substring(0, 5000) + '...[TRUNCATED]';
      } else {
        sanitized[key] = sanitizeAuditMetadata(value, currentDepth + 1, maxDepth, seen);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Serializa los metadatos de auditoría a una cadena JSON segura para la BD.
 * Aplica sanitización previa, luego verifica que el resultado no supere
 * los 64 KB permitidos por el campo MEDIUMTEXT de la tabla bitacora_movimiento.
 *
 * @param {Object} metadata - Objeto con los metadatos del evento a auditar
 * @returns {string} Cadena JSON sanitizada y truncada si es necesario
 */
function serializeDetails(metadata) {
  const enrichedMetadata = { auditVersion: '1.0', ...metadata };
  const sanitized = sanitizeAuditMetadata(enrichedMetadata);
  let stringified;
  
  try {
    stringified = JSON.stringify(sanitized);
  } catch(e) {
    // Si el objeto no es serializable, devuelve un JSON de error controlado
    return JSON.stringify({ auditVersion: '1.0', error: 'Unserializable Payload' });
  }
  
  // Límite de 64 KB para el campo de detalles en la tabla de bitácora
  if (Buffer.byteLength(stringified, 'utf8') > 64000) {
    return JSON.stringify({ auditVersion: '1.0', metadataTruncated: true, error: 'Payload size exceeded 64KB' });
  }
  return stringified;
}

module.exports = { sanitizeAuditMetadata, serializeDetails };
