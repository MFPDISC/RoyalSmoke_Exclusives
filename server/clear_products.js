var db = require('better-sqlite3')(require('path').resolve(__dirname, '../database/royalsmoke.db'));
db.pragma('foreign_keys = OFF');
var stmt = db.prepare('DELETE FROM products');
var info = stmt.run();
console.log('Force deleted ' + info.changes + ' products.');
