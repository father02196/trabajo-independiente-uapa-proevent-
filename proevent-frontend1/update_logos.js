const fs = require('fs');
const path = require('path');
const dir = 'c:/xampp/htdocs/cp/proevent-frontend1/src/pages/';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Dashboard') && f.endsWith('.js'));

files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf8');

  // Replace any brand-subtitle text with the unified institutional subtitle
  let newContent = content.replace(
    /<span className="brand-subtitle">([^<]*)<\/span>/g,
    '<span className="brand-subtitle">Sistema de Gestión de Eventos Institucionales</span>'
  );

  if (content !== newContent) {
    fs.writeFileSync(path.join(dir, f), newContent);
    console.log('Updated subtitle in: ' + f);
  } else {
    console.log('No subtitle found in: ' + f);
  }
});
