const SENSITIVE_KEYS = new Set([
  'password', 'contrasena', 'contraseña', 'token', 'authorization', 'cookie', 'secret', 'apikey'
]);

function sanitizeAuditMetadata(obj, currentDepth = 0, maxDepth = 5, seen = new WeakSet()) {
  if (currentDepth > maxDepth) return '[MAX_DEPTH_REACHED]';
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    if (seen.has(obj)) return '[CIRCULAR_REFERENCE_REMOVED]';
    seen.add(obj);
  }

  if (obj instanceof Error) {
    const isDev = process.env.NODE_ENV === 'development';
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

function serializeDetails(metadata) {
  const enrichedMetadata = { auditVersion: '1.0', ...metadata };
  const sanitized = sanitizeAuditMetadata(enrichedMetadata);
  let stringified;
  
  try {
    stringified = JSON.stringify(sanitized);
  } catch(e) {
    return JSON.stringify({ auditVersion: '1.0', error: 'Unserializable Payload' });
  }
  
  if (Buffer.byteLength(stringified, 'utf8') > 64000) {
    return JSON.stringify({ auditVersion: '1.0', metadataTruncated: true, error: 'Payload size exceeded 64KB' });
  }
  return stringified;
}

module.exports = { sanitizeAuditMetadata, serializeDetails };
