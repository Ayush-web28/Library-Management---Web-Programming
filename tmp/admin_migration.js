const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, '../database/library.db');
const db = new sqlite3.Database(dbPath);

async function runMigration() {
    console.log("Starting Admin Migration...");

    // 1. Ensure schema is updated (in case server didn't run it yet)
    db.run(`CREATE TABLE IF NOT EXISTS GPAMarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        semester_id INTEGER NOT NULL,
        subject_idx INTEGER NOT NULL,
        name TEXT,
        credits INTEGER,
        m1 INTEGER,
        m2 INTEGER,
        internals INTEGER,
        term_end INTEGER,
        desired_grade TEXT,
        is_prediction BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
    )`);

    const admins = [
        { sap_id: '10000000001', name: 'Admin Alpha', email: 'alpha@admin.com' },
        { sap_id: '10000000002', name: 'Admin Beta', email: 'beta@admin.com' },
        { sap_id: '10000000003', name: 'Admin Gamma', email: 'gamma@admin.com' },
        { sap_id: '10000000004', name: 'Admin Delta', email: 'delta@admin.com' },
        { sap_id: '10000000005', name: 'Admin Epsilon', email: 'epsilon@admin.com' }
    ];

    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    for (const admin of admins) {
        db.get("SELECT id FROM Users WHERE sap_id = ?", [admin.sap_id], (err, row) => {
            if (!row) {
                console.log(`Inserting admin: ${admin.name}`);
                db.run(
                    "INSERT INTO Users (sap_id, name, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
                    [admin.sap_id, admin.name, admin.email, hashedPassword],
                    (err) => {
                        if (err) console.error(`Failed to insert ${admin.name}:`, err.message);
                    }
                );
            } else {
                console.log(`Admin ${admin.name} already exists.`);
            }
        });
    }

    // Give it a moment to finish
    setTimeout(() => {
        db.close();
        console.log("Migration finished.");
    }, 2000);
}

runMigration();
