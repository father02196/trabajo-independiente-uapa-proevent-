const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../rutas_fase4.js'), 'utf8');

if (!content.includes('BitacoraService')) {
    content = content.replace("const express = require('express');", "const express = require('express');\nconst BitacoraService = require('./services/bitacora.service');\nconst { AUDIT_CRITICALITY } = require('./constants/bitacora.actions');");
}

// Reemplazo para 4 params: [id_usuario, id_rol, 'ACCION', `Detalles...`]
content = content.replace(/db\.query\([\s]*'INSERT INTO bitacora_movimiento \(id_usuario, id_rol, accion, detalles\) VALUES \(\?, \?, \?, \?\)',[\s]*\[([^,]+),([^,]+),\s*'([^']+)',\s*([\s\S]+?)\],[\s]*\([^)]*\)[\s]*=>[\s]*\{[\s\S]*?\}[\s]*\);/g, 
"BitacoraService.logBestEffort({ req, accion: { code: '$3', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: $4 } }, actorOverride: { id_usuario: $1, id_rol: $2, tipo_actor: 'INTERNO' } });");

// Reemplazo para 3 params: [id_usuario, 'ACCION', `Detalles...`]
content = content.replace(/db\.query\([\s]*'INSERT INTO bitacora_movimiento \(id_usuario, accion, detalles\) VALUES \(\?, \?, \?\)',[\s]*\[([^,]+),\s*'([^']+)',\s*([\s\S]+?)\],[\s]*\([^)]*\)[\s]*=>[\s]*\{[\s\S]*?\}[\s]*\);/g, 
"BitacoraService.logBestEffort({ req, accion: { code: '$2', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: $3 } }, actorOverride: { id_usuario: $1, id_rol: null, tipo_actor: 'INTERNO' } });");

// Reemplazar los if(id_usuario) db.query de una línea:
content = content.replace(/db\.query\([\s]*'INSERT INTO bitacora_movimiento \(id_usuario, id_rol, accion, detalles\) VALUES \(\?, \?, \?, \?\)',[\s]*\[([^,]+),([^,]+),\s*'([^']+)',\s*([^\]]+)\]\);/g, 
"BitacoraService.logBestEffort({ req, accion: { code: '$3', criticality: AUDIT_CRITICALITY.BEST_EFFORT }, metadata: { cambios: { legacyDetalles: $4 } }, actorOverride: { id_usuario: $1, id_rol: $2, tipo_actor: 'INTERNO' } });");

fs.writeFileSync(path.join(__dirname, '../rutas_fase4.js'), content, 'utf8');
console.log("rutas_fase4.js patched.");
