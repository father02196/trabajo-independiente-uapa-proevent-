const fs = require('fs');
const path = require('path');

const files = ['server.js', 'rutas_fase4.js', 'utils/notificacionService.js'];
const actions = new Set();
const regex = /registrarMovimiento\([^,]+,\s*[^,]+,\s*'([^']+)'/g;
const regex2 = /INSERT INTO bitacora_movimiento \(id_usuario, id_rol, accion, detalles\) VALUES \([^,]+, [^,]+, '([^']+)'/g;
const regex3 = /INSERT INTO bitacora_movimiento \(id_usuario, accion, detalles\) VALUES \([^,]+, '([^']+)'/g;


files.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            actions.add(match[1]);
        }
        while ((match = regex2.exec(content)) !== null) {
            actions.add(match[1]);
        }
        while ((match = regex3.exec(content)) !== null) {
            actions.add(match[1]);
        }
    } catch(e){}
});

console.log(Array.from(actions).sort());
