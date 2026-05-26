const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database/library.db');

function getISTDate() {
    return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
}

// Mimic the backend logic in /api/seats/occupancy
const date = new Date().toISOString().split('T')[0];
const ist = getISTDate();
const currentHour = ist.getUTCHours();

db.get(`SELECT * FROM LibraryOccupancy WHERE record_date = ?`, [date], (err, row) => {
    const occ = row || { total_students_entered: 150, occupied_pcs: 30 };
    
    db.all(`SELECT time_slot, num_students FROM RoomBookings WHERE booking_date = ? AND status = 'accepted'`, [date], (err, bookings) => {
        let studentsInRooms = 0;
        console.log(`Debug - Date: ${date}, Hour: ${currentHour}`);
        console.log(`Debug - Bookings for ${date}:`, JSON.stringify(bookings));
        
        if (bookings) {
            bookings.forEach(b => {
                const startHour = parseInt(b.time_slot.split(':')[0]);
                const endHour = parseInt(b.time_slot.split('-')[1].split(':')[0]);
                console.log(`Checking slot: ${b.time_slot} (${startHour}-${endHour}) vs Hour: ${currentHour}`);
                if (currentHour >= startHour && currentHour < endHour) {
                    studentsInRooms += b.num_students;
                }
            });
        }
        
        console.log(`Final Result - studentsInRooms: ${studentsInRooms}`);
        db.close();
    });
});
