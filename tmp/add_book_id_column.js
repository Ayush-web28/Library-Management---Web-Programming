const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/library.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check if book_id column exists
    db.all("PRAGMA table_info(Books)", (err, rows) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        
        const hasBookId = rows.some(row => row.name === 'book_id');
        if (!hasBookId) {
            console.log("Adding book_id column to Books table...");
            db.run("ALTER TABLE Books ADD COLUMN book_id TEXT", (err) => {
                if (err) {
                    console.error("Error adding column:", err.message);
                } else {
                    console.log("Column added successfully. Creating unique index...");
                    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_book_id ON Books(book_id)", (err) => {
                        if (err) console.error("Error creating index:", err.message);
                        else console.log("Unique index created.");
                        db.close();
                    });
                }
            });
        } else {
            console.log("book_id column already exists.");
            db.close();
        }
    });
});
