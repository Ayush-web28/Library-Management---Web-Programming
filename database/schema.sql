-- Database Schema for College Library System
-- Normalized to 3NF/BCNF

-- 1. Users table (Students and Admins)
-- SAP ID is unique (11 digits enforced in application logic)
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sap_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    course TEXT,
    department TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' -- 'student' or 'admin'
);

-- 2. Books table
CREATE TABLE IF NOT EXISTS Books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    total_pages INTEGER,
    subject TEXT NOT NULL,
    has_soft_copy BOOLEAN DEFAULT 0,
    soft_copy_url TEXT,
    total_hard_copies INTEGER DEFAULT 0,
    available_hard_copies INTEGER DEFAULT 0
);

-- 3. BorrowRequests table
CREATE TABLE IF NOT EXISTS BorrowRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'returned'
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(book_id) REFERENCES Books(id)
);

-- 4. DiscussionRooms table
CREATE TABLE IF NOT EXISTS DiscussionRooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL
);

-- 5. RoomBookings table
CREATE TABLE IF NOT EXISTS RoomBookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    num_students INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(room_id) REFERENCES DiscussionRooms(id)
);

-- 6. LibraryOccupancy table
-- Keeps track of daily entry for the library visualizer
CREATE TABLE IF NOT EXISTS LibraryOccupancy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_date DATE UNIQUE NOT NULL,
    total_students_entered INTEGER DEFAULT 0,
    occupied_pcs INTEGER DEFAULT 0
);

-- 7. GPAMarks table
-- Stores subject details and marks for each student
CREATE TABLE IF NOT EXISTS GPAMarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL, -- 1-indexed semester
    subject_idx INTEGER NOT NULL, -- 0-indexed subject within semester
    name TEXT,
    credits INTEGER,
    m1 INTEGER,
    m2 INTEGER,
    internals INTEGER,
    term_end INTEGER,
    desired_grade TEXT,
    is_prediction BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
);
