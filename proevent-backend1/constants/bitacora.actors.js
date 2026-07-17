const AUDIT_ACTOR_TYPES = Object.freeze({
  INTERNO: 'INTERNO',
  PROVEEDOR: 'PROVEEDOR',
  SISTEMA: 'SISTEMA',
  SERVICIO_EXTERNO: 'SERVICIO_EXTERNO',
  IA: 'IA',
  ANONIMO: 'ANONIMO'
});

function normalizeAndValidateActor(actor) {
  if (!actor || !actor.tipo_actor) throw new Error('Actor must have a defined tipo_actor');
  
  const type = actor.tipo_actor;
  if (!Object.values(AUDIT_ACTOR_TYPES).includes(type)) throw new Error(`Invalid actor type: ${type}`);

  const normalized = { id_usuario: null, id_rol: null, id_proveedor: null, tipo_actor: type };

  switch (type) {
    case AUDIT_ACTOR_TYPES.INTERNO:
      if (!actor.id_usuario) throw new Error('INTERNO requires id_usuario');
      normalized.id_usuario = actor.id_usuario;
      normalized.id_rol = actor.id_rol ?? null; 
      break;
    case AUDIT_ACTOR_TYPES.PROVEEDOR:
      if (!actor.id_proveedor) throw new Error('PROVEEDOR requires id_proveedor');
      normalized.id_proveedor = actor.id_proveedor;
      break;
    default:
      break;
  }
  return normalized;
}

module.exports = { AUDIT_ACTOR_TYPES, normalizeAndValidateActor };
