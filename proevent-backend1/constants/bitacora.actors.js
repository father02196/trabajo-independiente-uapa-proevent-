// ============================================================
// CONSTANTES: bitacora.actors
// Pertenece a: Capa de Auditoría (constants)
// Propósito: Define los tipos de actores reconocidos por el sistema
// de bitácora y provee una función de normalización/validación
// que garantiza que cada registro de auditoría tenga un actor
// bien formado antes de ser persistido en la base de datos.
// ============================================================

/**
 * Catálogo inmutable de tipos de actores que pueden generar
 * registros de auditoría en la bitácora del sistema.
 *
 * - INTERNO:          Usuario interno de la plataforma (personal UAPA).
 * - PROVEEDOR:        Proveedor externo autenticado en el portal B2B.
 * - SISTEMA:          Acciones automáticas sin intervención humana (cron jobs, scripts).
 * - SERVICIO_EXTERNO: Servicios de terceros que llaman a la API (ej. Google Calendar OAuth).
 * - IA:               Agentes de inteligencia artificial (ej. Antigravity).
 * - ANONIMO:          Peticiones no autenticadas (intentos de login fallido, etc.).
 */
const AUDIT_ACTOR_TYPES = Object.freeze({
  INTERNO: 'INTERNO',
  PROVEEDOR: 'PROVEEDOR',
  SISTEMA: 'SISTEMA',
  SERVICIO_EXTERNO: 'SERVICIO_EXTERNO',
  IA: 'IA',
  ANONIMO: 'ANONIMO'
});

/**
 * Normaliza y valida un objeto actor antes de persistirlo en la bitácora.
 * Garantiza que el tipo sea uno de los valores definidos en AUDIT_ACTOR_TYPES
 * y que los IDs requeridos según el tipo estén presentes.
 *
 * @param {Object} actor - Objeto actor a validar. Debe tener `tipo_actor`.
 * @param {string} actor.tipo_actor - Uno de los valores de AUDIT_ACTOR_TYPES.
 * @param {number} [actor.id_usuario] - Requerido si tipo_actor === 'INTERNO'.
 * @param {number} [actor.id_rol] - Opcional para actores INTERNOS.
 * @param {number} [actor.id_proveedor] - Requerido si tipo_actor === 'PROVEEDOR'.
 * @returns {Object} Actor normalizado con campos id_usuario, id_rol, id_proveedor y tipo_actor.
 * @throws {Error} Si el tipo de actor es inválido o faltan IDs requeridos.
 */
function normalizeAndValidateActor(actor) {
  if (!actor || !actor.tipo_actor) throw new Error('Actor must have a defined tipo_actor');
  
  const type = actor.tipo_actor;
  if (!Object.values(AUDIT_ACTOR_TYPES).includes(type)) throw new Error(`Invalid actor type: ${type}`);

  // Estructura base del actor normalizado con todos los IDs en null por defecto
  const normalized = { id_usuario: null, id_rol: null, id_proveedor: null, tipo_actor: type };

  switch (type) {
    case AUDIT_ACTOR_TYPES.INTERNO:
      // Los actores internos DEBEN tener un ID de usuario para ser trazables
      if (!actor.id_usuario) throw new Error('INTERNO requires id_usuario');
      normalized.id_usuario = actor.id_usuario;
      normalized.id_rol = actor.id_rol ?? null; 
      break;
    case AUDIT_ACTOR_TYPES.PROVEEDOR:
      // Los proveedores externos DEBEN tener su propio ID de proveedor
      if (!actor.id_proveedor) throw new Error('PROVEEDOR requires id_proveedor');
      normalized.id_proveedor = actor.id_proveedor;
      break;
    default:
      // SISTEMA, IA, SERVICIO_EXTERNO y ANONIMO no requieren IDs adicionales
      break;
  }
  return normalized;
}

module.exports = { AUDIT_ACTOR_TYPES, normalizeAndValidateActor };
