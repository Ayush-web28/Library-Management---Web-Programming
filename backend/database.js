const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../database/library.db');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Run schema
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error("Failed to run schema.sql:", err.message);
            } else {
                console.log("Database schema applied.");
                runSeed();
            }
        });
    } else {
        console.log("schema.sql not found.");
    }
}

function runSeed() {
    const seedPath = path.resolve(__dirname, '../database/seed.sql');
    if (fs.existsSync(seedPath)) {
        // Only run seed if users table is empty
        db.get("SELECT count(*) as count FROM Users", (err, row) => {
            if (!err && row && row.count === 0) {
                const seed = fs.readFileSync(seedPath, 'utf8');
                db.exec(seed, (err) => {
                    if (err) {
                        console.error("Failed to run seed.sql:", err.message);
                    } else {
                        console.log("Database seeded with sample data.");
                    }
                });
            } else {
                console.log("Database already has data. Seed skipped.");
            }
        });
    }
}

module.exports = db;
