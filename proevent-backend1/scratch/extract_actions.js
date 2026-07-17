const fs = require('fs');
const path = require('path');

const files = ['server.js', 'rutas_fase4.js', 'utils/notificacionService.js'];
const actions = new Set();

files.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(__dirname, '../', file), 'utf8');
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.includes('registrarMovimiento(')) {
                // simple split by comma
                const parts = line.split(',');
                if (parts.length >= 3) {
                    let actionPart = parts[2].trim();
                    if (actionPart.startsWith("'") || actionPart.startsWith('"')) {
                        actions.add(actionPart.replace(/['"]/g, ''));
                    }
                }
            }
            if (line.includes('INSERT INTO bitacora_movimiento')) {
                 const match = line.match(/VALUES \([^,]+, [^,]+, '([^']+)'/);
                 if(match) actions.add(match[1]);
                 const match2 = line.match(/VALUES \([^,]+, '([^']+)'/);
                 if(match2) actions.add(match2[1]);
            }
        });
    } catch(e) {
        console.error(e);
    }
});

console.log(Array.from(actions).sort().join('\n'));
