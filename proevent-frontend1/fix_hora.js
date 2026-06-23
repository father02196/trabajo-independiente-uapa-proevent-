const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'pages', 'dashboards')
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) continue;
    if (!fullPath.endsWith('.js')) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // 1. <span>{evt.hora_inicio}</span> -> <span>{evt.hora_inicio?.substring(0, 5)}</span>
    if (content.includes('<span>{evt.hora_inicio}</span>')) {
      content = content.replace(/<span>\{evt\.hora_inicio\}<\/span>/g, '<span>{evt.hora_inicio?.substring(0, 5)}</span>');
      changed = true;
    }

    // 2. {evt.hora_inicio} inside spans where maybe it's not the exact string
    // e.g., <span className="info-value">{selectedRequest.hora_inicio || '—'} – {selectedRequest.hora_fin || '—'}</span>
    if (content.includes('selectedRequest.hora_inicio || \'—\'')) {
      content = content.replace(/selectedRequest\.hora_inicio \|\| '—'/g, 'selectedRequest.hora_inicio?.substring(0,5) || \'—\'');
      changed = true;
    }
    if (content.includes('selectedRequest.hora_fin || \'—\'')) {
      content = content.replace(/selectedRequest\.hora_fin \|\| '—'/g, 'selectedRequest.hora_fin?.substring(0,5) || \'—\'');
      changed = true;
    }

    // 3. modalEvento
    if (content.includes('modalEvento.hora_inicio || \'—\'')) {
      content = content.replace(/modalEvento\.hora_inicio \|\| '—'/g, 'modalEvento.hora_inicio?.substring(0,5) || \'—\'');
      changed = true;
    }
    if (content.includes('modalEvento.hora_fin || \'—\'')) {
      content = content.replace(/modalEvento\.hora_fin \|\| '—'/g, 'modalEvento.hora_fin?.substring(0,5) || \'—\'');
      changed = true;
    }
    
    // 4. FichaTecnicaPDF
    // ({evento.hora_inicio})
    if (content.includes('({evento.hora_inicio})')) {
      content = content.replace(/\(\{evento\.hora_inicio\}\)/g, '({evento.hora_inicio?.substring(0,5)})');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('Updated: ' + file);
    }
  }
}

dirs.forEach(processDirectory);
console.log('Done!');
