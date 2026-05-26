const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/library.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM GPAMarks", [], (err, rows) => {
    if (err) {
        console.error("Error:", err.message);
    } else {
        console.log("GPAMarks Rows:", rows.length);
        if (rows.length > 0) {
            console.log("Sample Row:", JSON.stringify(rows[0], null, 2));
        }
    }
    db.close();
});
