const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Helper for IST Time ---
function getISTDate() {
    return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
}

function formatToISTDate(dateObj) {
    if (!dateObj) return null;
    // Check if it's already in DD-MM-YYYY format (from getISTTimestamp)
    if (typeof dateObj === 'string' && dateObj.match(/^\d{2}-\d{2}-\d{4}/)) {
        return dateObj.split(' ')[0]; // Just return the date part
    }
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return String(dateObj); // Fallback
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
}
function getISTTimestamp() {
    const d = getISTDate();
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(session({
    secret: 'library-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- Middleware to check auth ---
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
}
function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
}

// ================= AUTHENTICATION =================
app.post('/api/auth/signup', async (req, res) => {
    const { name, sap_id, course, department, email, phone, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'student';
        if (userRole === 'admin') {
            return res.status(403).json({ error: 'Admin signup is disabled. Use pre-existing credentials.' });
        }
        // Handle optional fields for admins
        const userCourse = null; // Admins are disabled here
        const userDept = null;

        const query = `INSERT INTO Users (sap_id, name, course, department, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(query, [sap_id, name, userCourse, userDept, email, phone, hashedPassword, userRole], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('Users.sap_id')) {
                        return res.status(400).json({ field: 'sap_id', error: `${userRole === 'admin' ? 'Admin' : 'Student'} ID already exists.` });
                    }
                    if (err.message.includes('Users.email')) {
                        return res.status(400).json({ field: 'email', error: 'Email already exists.' });
                    }
                }
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ message: 'Signup successful!' });
        });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/send-otp', (req, res) => {
    const { sap_id } = req.query;
    if (!sap_id) return res.status(400).json({ error: 'SAP ID is required to send OTP.' });
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in session (mocking actual SMS/Email delivery)
    req.session.generatedOtp = otp;
    req.session.otpSapId = sap_id;
    
    // Return it in response for the "premium" alert in frontend
    res.json({ message: 'OTP sent successfully!', otp: otp }); 
});

app.post('/api/auth/login', (req, res) => {
    const { sap_id, password, otp, role } = req.body;
    db.get(`SELECT * FROM Users WHERE sap_id = ?`, [sap_id], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'User does not exist.' });
        
        // Strict Role Validation
        if (role && user.role !== role) {
            return res.status(401).json({ error: 'User does not exist in this role.' });
        }
        
        let valid = false;
        if (otp) {
            // Verify against session
            if (otp === req.session.generatedOtp && sap_id === req.session.otpSapId) {
                valid = true;
                // Clear OTP after use
                delete req.session.generatedOtp;
                delete req.session.otpSapId;
            }
        } else if (password) {
            valid = await bcrypt.compare(password, user.password);
        }

        if (valid) {
            req.session.userId = user.id;
            req.session.role = user.role;
            res.json({ message: 'Login successful', role: user.role, name: user.name });
        } else {
            res.status(401).json({ error: otp ? 'Invalid OTP' : 'Invalid credentials' });
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// ================= BOOKS =================
app.get('/api/books', requireAuth, (req, res) => {
    const { search, subject, author } = req.query;
    const userId = req.session.userId;
    
    // We select all columns PLUS a check if the current user has an active pending request for this book
    let query = `
        SELECT Books.*, 
        EXISTS (
            SELECT 1 FROM BorrowRequests 
            WHERE user_id = ? AND book_id = Books.id AND status = 'pending'
        ) as is_requested
        FROM Books WHERE 1=1
    `;
    const params = [userId];

    if (search) {
        query += ` AND (title LIKE ? OR author LIKE ? OR subject LIKE ? OR book_id LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (subject) {
        query += ` AND subject = ?`;
        params.push(subject);
    }
    if (author) {
        query += ` AND author LIKE ?`;
        params.push(`%${author}%`);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/books/borrow', requireAuth, (req, res) => {
    const { book_id } = req.body;
    const requestDate = getISTTimestamp();
    db.run(`INSERT INTO BorrowRequests (user_id, book_id, request_date, status) VALUES (?, ?, ?, 'pending')`, [req.session.userId, book_id, requestDate], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Borrow request submitted successfully.' });
    });
});

app.post('/api/books/cancel', requireAuth, (req, res) => {
    let { book_id } = req.body;
    book_id = Number(book_id);
    const userId = req.session.userId;
    
    if (!book_id) return res.status(400).json({ error: "Invalid Book ID." });

    db.run(`DELETE FROM BorrowRequests WHERE user_id = ? AND book_id = ? AND status = 'pending'`, [userId, book_id], function(err) {
        if (err) return res.status(500).json({ error: 'Database Error: ' + err.message });
        
        // Use 204 or a successful message even if 0 changes, because the goal was for there to be no request
        // But for better debugging, let's return a success but tell the truth
        if (this.changes === 0) {
            // Logically, if it doesn't exist, it's "cancelled" (already gone)
            return res.json({ message: 'No pending request found to cancel, UI should reset.' });
        }
        
        res.json({ message: 'Borrow request cancelled successfully.' });
    });
});

// ================= SEATS AND ROOMS =================
app.get('/api/seats/occupancy', requireAuth, (req, res) => {
    const ist = getISTDate();
    const date = ist.toISOString().split('T')[0];
    const currentHour = ist.getUTCHours();
    
    db.get(`SELECT * FROM LibraryOccupancy WHERE record_date = ?`, [date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Mock default if none exists for today
        const occ = row || { total_students_entered: 150, occupied_pcs: 30 };
        
        db.all(`SELECT time_slot, num_students FROM RoomBookings WHERE booking_date = ? AND status = 'accepted'`, [date], (err, bookings) => {
            let studentsInRooms = 0;
            
            if (bookings) {
                bookings.forEach(b => {
                    const startHour = parseInt(b.time_slot.split(':')[0]);
                    const endHour = parseInt(b.time_slot.split('-')[1].split(':')[0]);
                    if (currentHour >= startHour && currentHour < endHour) {
                        studentsInRooms += b.num_students;
                    }
                });
            }
            
            const openReadingSeatsOccupied = occ.total_students_entered - occ.occupied_pcs - studentsInRooms;
            
            res.json({
                total_students: occ.total_students_entered,
                occupied_pcs: occ.occupied_pcs,
                in_rooms: studentsInRooms,
                open_reading_occupied: Math.max(0, openReadingSeatsOccupied)
            });
        });
    });
});

app.post('/api/seats/book-room', requireAuth, (req, res) => {
    const { room_id, time_slot, num_students, date } = req.body;

    if (!room_id || !time_slot || !num_students || !date) {
        return res.status(400).json({ error: 'All fields (Room, Time Slot, Date, Students) are required.' });
    }

    // Robust Date & Time Validation
    const now = new Date();
    
    // Helper to get local YYYY-MM-DD for comparison
    const getLocalStr = (d) => {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    const todayStr = getLocalStr(now);
    const bookingDateStr = date; // date is already YYYY-MM-DD string from frontend

    if (bookingDateStr < todayStr) {
        return res.status(400).json({ error: 'Booking date cannot be in the past.' });
    }

    if (bookingDateStr === todayStr) {
        const ist = getISTDate();
        const currentHour = ist.getUTCHours();
        const slotStartHour = parseInt(time_slot.split(':')[0]);
        if (slotStartHour <= currentHour) {
            return res.status(400).json({ error: 'Cannot book a room for the current or past hours of today.' });
        }
    }

    // Check if student already has a pending/accepted request for this specific slot
    db.get(`SELECT status FROM RoomBookings WHERE user_id = ? AND booking_date = ? AND time_slot = ? AND status != 'rejected'`, [req.session.userId, date, time_slot], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error while checking your existing requests.' });
        if (row) {
            if (row.status === 'accepted') {
                return res.status(409).json({ error: 'Room already booked (Your request is accepted).' });
            } else {
                return res.status(409).json({ error: 'Request already sent (Pending Admin Approval).' });
            }
        }

        db.get(`SELECT capacity, room_name FROM DiscussionRooms WHERE id = ?`, [room_id], (err, room) => {
            if (err) return res.status(500).json({ error: 'Internal database error.' });
            if (!room) return res.status(404).json({ error: 'Selected room not found.' });

            const students = parseInt(num_students);
            if (isNaN(students) || students < 1) {
                return res.status(400).json({ error: 'Number of students must be at least 1.' });
            }
            if (students > room.capacity) {
                return res.status(400).json({ error: `"${room.room_name}" has a maximum capacity of ${room.capacity} students. You requested ${students}.` });
            }

            // Check if slot is taken by ANYONE ELSE (either pending or accepted)
            db.get(`SELECT status FROM RoomBookings WHERE room_id = ? AND booking_date = ? AND time_slot = ? AND status != 'rejected'`, [room_id, date, time_slot], (err, row) => {
                if (err) return res.status(500).json({ error: 'Database error while checking availability.' });
                if (row) {
                    if (row.status === 'accepted') {
                        return res.status(409).json({ error: 'This time slot is already fully booked and approved for this room.' });
                    } else {
                        // Based on Requirement 4: blocked even if someone else's is pending
                        return res.status(409).json({ error: 'Another student has already sent a request for this slot. Please try another room or slot.' });
                    }
                }
                
                db.run(`INSERT INTO RoomBookings (user_id, room_id, booking_date, time_slot, num_students, status) VALUES (?, ?, ?, ?, ?, 'pending')`, 
                [req.session.userId, room_id, date, time_slot, students], function(err) {
                    if (err) return res.status(400).json({ error: 'Failed to create booking request: ' + err.message });
                    res.json({ message: 'Room booking request submitted successfully! (Pending Admin Approval)' });
                });
            });
        });
    });
});

app.get('/api/seats/booked-slots', requireAuth, (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required.' });
    
    db.all(`SELECT room_id, time_slot FROM RoomBookings WHERE booking_date = ? AND status = 'accepted'`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/seats/rooms', requireAuth, (req, res) => {
    const ist = getISTDate();
    const date = ist.toISOString().split('T')[0];
    const currentHour = ist.getUTCHours();
    
    db.all(`SELECT * FROM DiscussionRooms`, (err, rooms) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT room_id, time_slot FROM RoomBookings WHERE booking_date = ? AND status = 'accepted'`, [date], (err, bookings) => {
            rooms.forEach(room => {
                room.is_currently_occupied = false;
                if (bookings) {
                    const roomBookings = bookings.filter(b => Number(b.room_id) === Number(room.id));
                    for (let b of roomBookings) {
                        if (!b.time_slot) continue;
                        const startHour = parseInt(b.time_slot.split(':')[0]);
                        const endHour = parseInt(b.time_slot.split('-')[1].split(':')[0]);
                        if (currentHour >= startHour && currentHour < endHour) {
                            room.is_currently_occupied = true;
                            break;
                        }
                    }
                }
            });
            res.json(rooms);
        });
    });
});

// ================= PROFILE =================
app.get('/api/profile', requireAuth, (req, res) => {
    db.get(`SELECT id, sap_id, name, course, department, email, phone, role FROM Users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT Books.title, BorrowRequests.status, BorrowRequests.request_date FROM BorrowRequests JOIN Books ON BorrowRequests.book_id = Books.id WHERE BorrowRequests.user_id = ?`, [req.session.userId], (err, books) => {
            
            db.all(`SELECT DiscussionRooms.room_name, RoomBookings.time_slot, RoomBookings.booking_date, RoomBookings.status FROM RoomBookings JOIN DiscussionRooms ON RoomBookings.room_id = DiscussionRooms.id WHERE RoomBookings.user_id = ?`, [req.session.userId], (err, rooms) => {
                
                // Format dates for display
                const formattedBooks = (books || []).map(b => ({...b, request_date: formatToISTDate(b.request_date)}));
                const formattedRooms = (rooms || []).map(r => ({...r, booking_date: formatToISTDate(r.booking_date)}));

                res.json({
                    user,
                    borrowed_books: formattedBooks,
                    room_bookings: formattedRooms,
                    activity_summary: {
                        total_borrowed: (books || []).length,
                        total_room_bookings: (rooms || []).length
                    }
                });
            });
        });
    });
});

// ================= ADMIN ROUTES =================
app.get('/api/admin/requests', requireAdmin, (req, res) => {
    db.all(`SELECT BorrowRequests.id, Users.name, Books.title, BorrowRequests.status, BorrowRequests.request_date FROM BorrowRequests JOIN Users ON BorrowRequests.user_id = Users.id JOIN Books ON BorrowRequests.book_id = Books.id`, (err, booksReqs) => {
        
        db.all(`SELECT RoomBookings.id, Users.name, DiscussionRooms.room_name, RoomBookings.booking_date, RoomBookings.time_slot, RoomBookings.status FROM RoomBookings JOIN Users ON RoomBookings.user_id = Users.id JOIN DiscussionRooms ON RoomBookings.room_id = DiscussionRooms.id`, (err, roomReqs) => {
            
            const formattedBooks = (booksReqs || []).map(b => ({...b, request_date: formatToISTDate(b.request_date)}));
            const formattedRooms = (roomReqs || []).map(r => ({...r, booking_date: formatToISTDate(r.booking_date)}));

            res.json({ bookRequests: formattedBooks, roomRequests: formattedRooms });
        });
    });
});

app.post('/api/admin/request/:type/:id', requireAdmin, (req, res) => {
    const { type, id } = req.params; // type: 'book' or 'room'
    const { status } = req.body; // 'accepted' or 'rejected'
    
    let table = type === 'book' ? 'BorrowRequests' : 'RoomBookings';
    db.run(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Request ${status} successfully.` });
    });
});

app.post('/api/admin/books', requireAdmin, (req, res) => {
    const { book_id, title, author, subject, total_copies } = req.body;
    
    // Check if book_id already exists
    db.get(`SELECT id FROM Books WHERE book_id = ?`, [book_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(409).json({ error: `A book with ID "${book_id}" already exists in the database.` });

        db.run(`INSERT INTO Books (book_id, title, author, subject, total_hard_copies, available_hard_copies) VALUES (?, ?, ?, ?, ?, ?)`,
        [book_id, title, author, subject, total_copies, total_copies], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Book added successfully!' });
        });
    });
});

app.post('/api/admin/books/update-stock', requireAdmin, (req, res) => {
    const { book_id, available_hard_copies } = req.body;
    
    if (!book_id) return res.status(400).json({ error: "Book ID is required." });

    // Validate: available cannot be > total
    db.get(`SELECT total_hard_copies FROM Books WHERE id = ?`, [book_id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Book not found." });
        
        if (available_hard_copies > row.total_hard_copies) {
            return res.status(400).json({ error: "Available copies cannot exceed total copies." });
        }

        db.run(`UPDATE Books SET available_hard_copies = ? WHERE id = ?`, [available_hard_copies, book_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Stock updated successfully." });
        });
    });
});

// ================= GPA STORAGE =================
app.get('/api/gpa/load', requireAuth, (req, res) => {
    db.all(`SELECT * FROM GPAMarks WHERE user_id = ? ORDER BY semester_id, subject_idx`, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/gpa/save', requireAuth, (req, res) => {
    const { semesters, isPredictionMode } = req.body;
    const userId = req.session.userId;

    if (!Array.isArray(semesters)) {
        return res.status(400).json({ error: "Invalid semesters data" });
    }

    db.serialize(() => {
        db.run(`DELETE FROM GPAMarks WHERE user_id = ?`, [userId], (err) => {
            if (err) console.error("GPA Delete Error:", err);
        });

        const stmt = db.prepare(`INSERT INTO GPAMarks (user_id, semester_id, subject_idx, name, credits, m1, m2, internals, term_end, desired_grade, is_prediction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        try {
            semesters.forEach(sem => {
                if (sem.subjects && Array.isArray(sem.subjects)) {
                    sem.subjects.forEach((subj, idx) => {
                        if (subj) { // Skip null/undefined in sparse arrays
                            stmt.run(
                                userId, sem.id, idx, subj.name || '', 
                                subj.credits || 0, subj.m1 || 0, subj.m2 || 0, subj.internals || 0, 
                                subj.termEndMarks || 0, subj.desiredGrade || 'A', (isPredictionMode ? 1 : 0)
                            );
                        }
                    });
                }
            });
            
            stmt.finalize((err) => {
                if (err) {
                    console.error("GPA Save Finalize Error:", err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Marks saved successfully!' });
            });
        } catch (e) {
            console.error("GPA Save Exception:", e);
            res.status(500).json({ error: e.message });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
