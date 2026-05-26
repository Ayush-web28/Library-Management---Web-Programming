const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database/library.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Current Users in Database ---');
db.all("SELECT id, sap_id, name, role FROM Users", [], (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }
    rows.forEach((row) => {
        console.log(`${row.id} | ${row.sap_id} | ${row.name} | ${row.role}`);
    });
    db.close();
});
