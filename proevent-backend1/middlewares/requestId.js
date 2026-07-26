// ============================================================
// MIDDLEWARE: requestId
// Pertenece a: Capa de Infraestructura (middlewares)
// Propósito: Asigna un ID único (UUID v4) a cada petición HTTP
// para permitir el rastreo de solicitudes de extremo a extremo
// en los logs, la bitácora de auditoría y las cabeceras de respuesta.
// ============================================================

const crypto = require('crypto');

/**
 * Detecta si la petición llega a través de un proxy confiable.
 * Express solo puebla req.ips cuando la opción 'trust proxy' está activa.
 * @param {Object} req - Objeto de petición de Express
 * @returns {boolean} true si la petición pasó por un proxy configurado
 */
function trustedProxy(req) {
  return req.ips && req.ips.length > 0;
}

/**
 * Middleware que asigna req.requestId y el header X-Request-Id.
 * Si la petición viene de un proxy confiable y ya trae un UUID válido
 * en el header 'x-request-id', reutiliza ese valor para mantener
 * la trazabilidad entre servicios. De lo contrario, genera uno nuevo.
 */
module.exports = function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  // Solo acepta UUIDs con formato estándar para prevenir inyección de valores maliciosos
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (trustedProxy(req) && incomingId && uuidRegex.test(incomingId)) {
    req.requestId = incomingId; // Reutiliza el ID del proxy para mantener trazabilidad
  } else {
    req.requestId = crypto.randomUUID(); // Genera un UUID nuevo para esta petición
  }
  
  // Expone el ID en la respuesta para facilitar el debugging desde el cliente
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
