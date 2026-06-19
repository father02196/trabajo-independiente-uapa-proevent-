const fs = require('fs');
let c = fs.readFileSync('rutas_fase4.js', 'utf8');
c = c.replace(/\\\`/g, '\`');
c = c.replace(/\\\${/g, '${');
fs.writeFileSync('rutas_fase4.js', c);
console.log('Fixed');
