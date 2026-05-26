const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/library.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Starting Book ID backfill...");
    
    db.all("SELECT id, subject FROM Books WHERE book_id IS NULL OR book_id = ''", (err, rows) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        
        console.log(`Found ${rows.length} books without IDs.`);
        
        const stmt = db.prepare("UPDATE Books SET book_id = ? WHERE id = ?");
        
        rows.forEach((row, index) => {
            // Generate ID: LIB-[SUB_SHORT]-100+i
            const subPrefix = (row.subject || "GEN").substring(0, 3).toUpperCase();
            const dummyId = `LIB-${subPrefix}-${100 + index + row.id}`;
            
            console.log(`Assigning ID ${dummyId} to book record #${row.id}`);
            stmt.run(dummyId, row.id);
        });
        
        stmt.finalize();
        console.log("Backfill complete.");
        db.close();
    });
});
