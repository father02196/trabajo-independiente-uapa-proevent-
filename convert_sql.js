const fs = require('fs');
console.log('Reading database_backup.sql as UTF-16LE...');
const content = fs.readFileSync('database_backup.sql', 'utf16le');
console.log('Writing database_backup_utf8_clean.sql as UTF-8...');
fs.writeFileSync('database_backup_utf8_clean.sql', content, 'utf8');
console.log('Done!');
