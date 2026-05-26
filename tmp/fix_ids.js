const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/library.db');

async function fixIds() {
    const db = new sqlite3.Database(dbPath);
    
    const getBooks = () => new Promise((resolve, reject) => {
        db.all("SELECT id, subject FROM Books WHERE book_id IS NULL OR book_id = ''", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    const updateBook = (id, bookId) => new Promise((resolve, reject) => {
        db.run("UPDATE Books SET book_id = ? WHERE id = ?", [bookId, id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    try {
        console.log("Fetching books with NULL IDs...");
        const books = await getBooks();
        console.log(`Found ${books.length} books to update.`);

        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            const sub = (book.subject || "General").substring(0, 2).toUpperCase();
            // Ensure uniqueness by using record ID in the string
            const bookId = `LIB-${sub}-${100 + book.id}`;
            console.log(`Updating Book #${book.id} -> ${bookId}`);
            await updateBook(book.id, bookId);
        }
        console.log("Successfully backfilled all IDs.");
    } catch (err) {
        console.error("Error during backfill:", err);
    } finally {
        db.close();
    }
}

fixIds();
