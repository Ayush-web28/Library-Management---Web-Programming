const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../database/library.db');
const seedPath = path.resolve(__dirname, '../database/seed.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the library database.');
    
    // Reset Tables
    const tables = ['Users', 'Books', 'DiscussionRooms', 'BorrowRequests', 'RoomBookings', 'LibraryOccupancy'];
    db.serialize(() => {
        tables.forEach(table => {
            db.run(`DELETE FROM ${table}`, (err) => {
                if (err) console.error(`Failed to clear ${table}:`, err.message);
                else console.log(`Cleared ${table}.`);
            });
        });

        // Run Seed
        if (fs.existsSync(seedPath)) {
            const seed = fs.readFileSync(seedPath, 'utf8');
            db.exec(seed, (err) => {
                if (err) {
                    console.error("Failed to run seed.sql:", err.message);
                } else {
                    console.log("Database seeded successfully.");
                }
                db.close();
            });
        } else {
            console.error("seed.sql not found.");
            db.close();
        }
    });
});
