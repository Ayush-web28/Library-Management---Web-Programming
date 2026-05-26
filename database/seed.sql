-- Insert Seed Data (At least 10 records per table where applicable)

-- Users (2 Admins, 8 Students)
-- Passwords should theoretically be hashed, but for seeding simplicity we put plain or pre-hashed values.
-- In a real scenario, the app hashes 'password123' to something like '$2b$10$...'
INSERT INTO Users (sap_id, name, course, department, email, phone, password, role) VALUES
('70012345601', 'Admin One', NULL, NULL, 'admin1@nmims.in', '9876543210', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'admin'),
('70012345602', 'Admin Two', NULL, NULL, 'admin2@nmims.in', '9876543211', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'admin'),
('70012345603', 'John Doe', 'BTech', 'Computer Engineering', 'john.doe@nmims.in', '9876543212', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345604', 'Jane Smith', 'MBA Tech', 'IT', 'jane.smith@nmims.in', '9876543213', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345605', 'Sam Wilson', 'BTech', 'Civil', 'sam.wilson@nmims.in', '9876543214', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345606', 'Lisa Ray', 'BTech', 'Mechanical', 'lisa.ray@nmims.in', '9876543215', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345607', 'Paul Walker', 'BTI', 'AI', 'paul.walker@nmims.in', '9876543216', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345608', 'Emma Stone', 'CSBS', 'DS', 'emma.stone@nmims.in', '9876543217', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345609', 'Bruce Wayne', 'MBA Tech', 'Computer Engineering', 'bruce.wayne@nmims.in', '9876543218', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student'),
('70012345610', 'Clark Kent', 'BTech', 'IT', 'clark.kent@nmims.in', '9876543219', '$2b$10$9vPxyqW2O.M62Z.9KkV9/.C.G0N8R2z.n4lS4U5s.O64.qY.e.w32', 'student');

-- Books
INSERT INTO Books (title, author, total_pages, subject, has_soft_copy, soft_copy_url, total_hard_copies, available_hard_copies) VALUES
('Advanced Engineering Mathematics', 'Erwin Kreyszig', 1200, 'Mathematics', 1, '/downloads/book1.pdf', 5, 5),
('Introduction to Algorithms', 'Thomas H. Cormen', 1312, 'Programming', 0, NULL, 3, 2),
('Database System Concepts', 'Abraham Silberschatz', 1140, 'Databases', 1, '/downloads/book3.pdf', 4, 3),
('Calculus: Early Transcendentals', 'James Stewart', 1368, 'Calculus', 1, '/downloads/book4.pdf', 6, 6),
('University Physics', 'Hugh D. Young', 1600, 'Physics', 0, NULL, 3, 1),
('Organic Chemistry', 'Paula Yurkanis Bruice', 1344, 'Chemistry', 1, '/downloads/book6.pdf', 2, 2),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell', 1152, 'Programming', 1, '/downloads/book7.pdf', 4, 0),
('Data Science from Scratch', 'Joel Grus', 330, 'Databases', 1, '/downloads/book8.pdf', 5, 5),
('Clean Code', 'Robert C. Martin', 464, 'Programming', 0, NULL, 2, 2),
('Design Patterns', 'Erich Gamma', 395, 'Programming', 1, '/downloads/book10.pdf', 4, 4),
-- New Mathematics Books
('Linear Algebra and Its Applications', 'Gilbert Strang', 576, 'Mathematics', 1, '/downloads/math5.pdf', 8, 8),
('Mathematical Statistics with Applications', 'Dennis Wackerly', 944, 'Mathematics', 0, NULL, 5, 5),
('Discrete Mathematics with Applications', 'Susanna S. Epp', 984, 'Mathematics', 1, '/downloads/math7.pdf', 6, 6),
('A First Course in Probability', 'Sheldon Ross', 480, 'Mathematics', 1, '/downloads/math8.pdf', 4, 4),
('Abstract Algebra', 'David S. Dummit', 944, 'Mathematics', 0, NULL, 3, 3),
-- New Programming Books
('The C++ Programming Language', 'Bjarne Stroustrup', 1366, 'Programming', 1, '/downloads/prog5.pdf', 5, 5),
('Java: The Complete Reference', 'Herbert Schildt', 1248, 'Programming', 1, '/downloads/prog6.pdf', 7, 7),
('Effective Java', 'Joshua Bloch', 416, 'Programming', 1, '/downloads/prog7.pdf', 4, 4),
('Programming Pearls', 'Jon Bentley', 256, 'Programming', 0, NULL, 3, 3),
('Code Complete 2', 'Steve McConnell', 960, 'Programming', 1, '/downloads/prog9.pdf', 6, 6),
-- New Databases Books
('Fundamentals of Database Systems', 'Ramez Elmasri', 1272, 'Databases', 1, '/downloads/db5.pdf', 5, 5),
('SQL in 10 Minutes', 'Ben Forta', 288, 'Databases', 1, '/downloads/db6.pdf', 10, 10),
('Designing Data-Intensive Applications', 'Martin Kleppmann', 616, 'Databases', 1, '/downloads/db7.pdf', 4, 4),
('Learning SQL', 'Alan Beaulieu', 384, 'Databases', 0, NULL, 6, 6),
('Database Internals', 'Alex Petrov', 376, 'Databases', 1, '/downloads/db9.pdf', 5, 5),
-- New Calculus Books
('Thomas'' Calculus', 'Joel Hass', 1248, 'Calculus', 1, '/downloads/calc5.pdf', 6, 6),
('Real Analysis', 'H.L. Royden', 512, 'Calculus', 0, NULL, 4, 4),
('Vector Calculus', 'Jerrold E. Marsden', 715, 'Calculus', 1, '/downloads/calc7.pdf', 5, 5),
('Essential Calculus', 'James Stewart', 960, 'Calculus', 1, '/downloads/calc8.pdf', 4, 4),
('Calculus on Manifolds', 'Michael Spivak', 160, 'Calculus', 0, NULL, 3, 3),
-- New Physics Books
('Fundamentals of Physics', 'David Halliday', 1200, 'Physics', 1, '/downloads/phys5.pdf', 8, 8),
('Introduction to Electrodynamics', 'David J. Griffiths', 624, 'Physics', 1, '/downloads/phys6.pdf', 5, 5),
('General Physics', 'Douglas C. Giancoli', 1000, 'Physics', 0, NULL, 6, 6),
('Concepts of Physics', 'H.C. Verma', 440, 'Physics', 1, '/downloads/phys8.pdf', 15, 15),
('Six Easy Pieces', 'Richard P. Feynman', 176, 'Physics', 1, '/downloads/phys9.pdf', 12, 12),
-- New Chemistry Books
('Inorganic Chemistry', 'Gary L. Miessler', 704, 'Chemistry', 1, '/downloads/chem5.pdf', 5, 5),
('Physical Chemistry', 'Peter Atkins', 1008, 'Chemistry', 1, '/downloads/chem6.pdf', 4, 4),
('General Chemistry', 'Linus Pauling', 992, 'Chemistry', 0, NULL, 3, 3),
('Bio-Organic Chemistry', 'John McMurry', 600, 'Chemistry', 1, '/downloads/chem8.pdf', 6, 6),
('Analytical Chemistry', 'Gary D. Christian', 848, 'Chemistry', 1, '/downloads/chem9.pdf', 5, 5);

-- DiscussionRooms
INSERT INTO DiscussionRooms (room_name, capacity) VALUES
('Room A', 4), ('Room B', 4), ('Room C', 6);

-- BorrowRequests
INSERT INTO BorrowRequests (user_id, book_id, request_date, status) VALUES
(3, 2, '2023-10-01 10:00:00', 'accepted'),
(4, 5, '2023-10-02 11:30:00', 'accepted'),
(5, 7, '2023-10-03 14:15:00', 'pending'),
(6, 3, '2023-10-04 09:45:00', 'rejected'),
(7, 5, '2023-10-05 16:20:00', 'accepted'),
(8, 7, '2023-10-06 10:10:00', 'returned'),
(9, 1, '2023-10-07 13:00:00', 'pending'),
(3, 8, '2023-10-08 15:30:00', 'accepted'),
(4, 10, '2023-10-09 11:11:00', 'pending'),
(10, 4, '2023-10-10 12:00:00', 'returned');

-- RoomBookings
INSERT INTO RoomBookings (user_id, room_id, booking_date, time_slot, num_students, status) VALUES
(3, 1, '2023-10-15', '10:00-11:00', 3, 'accepted'),
(4, 2, '2023-10-15', '11:00-12:00', 4, 'pending'),
(5, 3, '2023-10-16', '14:00-15:00', 5, 'rejected'),
(6, 1, '2023-10-16', '15:00-16:00', 6, 'accepted'),
(7, 2, '2023-10-17', '09:00-10:00', 4, 'pending'),
(8, 3, '2023-10-17', '10:00-11:00', 5, 'accepted'),
(9, 1, '2023-10-18', '12:00-13:00', 4, 'pending'),
(10, 2, '2023-10-18', '13:00-14:00', 3, 'accepted'),
(3, 3, '2023-10-19', '16:00-17:00', 2, 'pending'),
(4, 1, '2023-10-19', '17:00-18:00', 3, 'accepted');

-- LibraryOccupancy (Mock data for the last 10 days)
INSERT INTO LibraryOccupancy (record_date, total_students_entered, occupied_pcs) VALUES
('2023-10-01', 120, 20),
('2023-10-02', 150, 25),
('2023-10-03', 110, 15),
('2023-10-04', 180, 40),
('2023-10-05', 200, 50),
('2023-10-06', 90, 10),
('2023-10-07', 80, 5),
('2023-10-08', 210, 45),
('2023-10-09', 230, 60),
('2023-10-10', 140, 30);
