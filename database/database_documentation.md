# Database Normalization & SQL Queries

## Database Normalization Process
The College Library System database has been designed and normalized up to Boyce-Codd Normal Form (BCNF) to eliminate data redundancy and ensure data integrity.

### 1. First Normal Form (1NF)
*Rule: Each cell should contain a single, atomic value, and each record needs to be unique.*
- All tables (`Users`, `Books`, `BorrowRequests`, `DiscussionRooms`, `RoomBookings`, `LibraryOccupancy`) have unique primary keys (`id`).
- All columns hold atomic values. For example, the `name` column holds the full name string, `title` holds a single string. We don't have comma-separated lists inside any cell.

### 2. Second Normal Form (2NF)
*Rule: Must be in 1NF and all non-key attributes must be fully functionally dependent on the primary key.*
- Since all our tables have a single-column primary key (`id`), there are no partial dependencies. Every non-prime attribute depends on the entire primary key.
- Example: In `RoomBookings`, `status` depends entirely on the specific booking `id`, not just the `user_id` or `room_id`.

### 3. Third Normal Form (3NF)
*Rule: Must be in 2NF and there should be no transitive dependency for non-prime attributes.*
- No non-prime attribute depends on another non-prime attribute.
- For example, in the `BorrowRequests` table, we store `user_id` and `book_id` rather than storing the user's name or book's title directly in the requests table. This prevents transitive dependencies and update anomalies.

### 4. Boyce-Codd Normal Form (BCNF)
*Rule: Must be in 3NF and for every non-trivial functional dependency X → Y, X must be a superkey.*
- In our schema, every determinant is a candidate key. 
- E.g., `Users.sap_id` is unique, and `Users.email` is unique. They both determine all other attributes in the `Users` table, thus making them candidate keys (superkeys). There are no cases where a non-prime attribute determines part of a candidate key. Thus, the database is in BCNF.

---

## 20 SQL Queries

**1. SELECT: Retrieve all users who are currently registered.**
```sql
SELECT sap_id, name, course, role FROM Users;
```
*Output Snapshot:* Returns a list of 10 users with their SAP IDs and Roles.

**2. WHERE: Find specifically the admins of the library.**
```sql
SELECT name, email FROM Users WHERE role = 'admin';
```
*Output Snapshot:* Returns 'Admin One' and 'Admin Two'.

**3. ORDER BY: List all books ordered by their total pages in descending order.**
```sql
SELECT title, author, total_pages FROM Books ORDER BY total_pages DESC;
```
*Output Snapshot:* Returns books starting from 'University Physics' (1600 pages).

**4. GROUP BY: Count the number of books in each subject category.**
```sql
SELECT subject, COUNT(*) as book_count FROM Books GROUP BY subject;
```
*Output Snapshot:* Returns Subjects and Counts (e.g., Programming: 4, Mathematics: 1).

**5. JOIN: Retrieve the names of students and the titles of books they requested.**
```sql
SELECT Users.name, Books.title, BorrowRequests.status 
FROM BorrowRequests
JOIN Users ON BorrowRequests.user_id = Users.id
JOIN Books ON BorrowRequests.book_id = Books.id;
```
*Output Snapshot:* Returns rows like (John Doe, Introduction to Algorithms, accepted).

**6. Aggregate Functions: Find the average total pages of all library books.**
```sql
SELECT AVG(total_pages) as avg_pages FROM Books;
```
*Output Snapshot:* ~1030.5

**7. Subqueries: Find students who have borrowed a book with more than 1000 pages.**
```sql
SELECT name FROM Users 
WHERE id IN (
  SELECT user_id FROM BorrowRequests 
  WHERE book_id IN (SELECT id FROM Books WHERE total_pages > 1000)
);
```
*Output Snapshot:* Returns students like John Doe, Jane Smith.

**8. UPDATE: Update the status of a specific borrow request.**
```sql
UPDATE BorrowRequests SET status = 'accepted' WHERE id = 3;
```
*Output Snapshot:* Modifies 1 row.

**9. DELETE: Delete a rejected borrow request.**
```sql
DELETE FROM BorrowRequests WHERE status = 'rejected';
```
*Output Snapshot:* Deletes 1 row.

**10. WHERE and AND: Find students in 'BTech' course from 'Computer Engineering' department.**
```sql
SELECT name, sap_id FROM Users WHERE course = 'BTech' AND department = 'Computer Engineering';
```
*Output Snapshot:* Returns John Doe.

**11. GROUP BY with HAVING: Find subjects that have more than 2 books.**
```sql
SELECT subject, COUNT(*) as count FROM Books GROUP BY subject HAVING count > 2;
```
*Output Snapshot:* Returns 'Programming' (4).

**12. LEFT JOIN: List all books and any borrow requests made for them.**
```sql
SELECT Books.title, BorrowRequests.status 
FROM Books LEFT JOIN BorrowRequests ON Books.id = BorrowRequests.book_id;
```
*Output Snapshot:* Returns all books, some with 'NULL' if never requested.

**13. Aggregate functions (MAX): Find the largest capacity discussion room.**
```sql
SELECT room_name, MAX(capacity) FROM DiscussionRooms;
```
*Output Snapshot:* Room H (12).

**14. Subquery: Find which room has the highest number of bookings.**
```sql
SELECT room_name FROM DiscussionRooms WHERE id = (
  SELECT room_id FROM RoomBookings GROUP BY room_id ORDER BY COUNT(*) DESC LIMIT 1
);
```
*Output Snapshot:* Returns 'Room A' or whichever has the most in seed.

**15. SELECT Distinct: Get distinct roles in the system.**
```sql
SELECT DISTINCT role FROM Users;
```
*Output Snapshot:* Returns 'admin' and 'student'.

**16. LIKE: Search books by title containing 'Data'.**
```sql
SELECT title, author FROM Books WHERE title LIKE '%Data%';
```
*Output Snapshot:* Returns 'Database System Concepts', 'Data Science from Scratch'.

**17. BETWEEN: Find Library Occupancy where entered students are between 150 and 200.**
```sql
SELECT record_date, total_students_entered FROM LibraryOccupancy WHERE total_students_entered BETWEEN 150 AND 200;
```
*Output Snapshot:* Returns (2023-10-02, 150), (2023-10-04, 180), (2023-10-05, 200).

**18. INNER JOIN & ORDER BY: Get a timeline of all discussion room bookings.**
```sql
SELECT Users.name, DiscussionRooms.room_name, RoomBookings.booking_date, RoomBookings.time_slot
FROM RoomBookings
JOIN Users ON RoomBookings.user_id = Users.id
JOIN DiscussionRooms ON RoomBookings.room_id = DiscussionRooms.id
ORDER BY RoomBookings.booking_date ASC;
```
*Output Snapshot:* Returns ordered chronological list of bookings.

**19. COUNT & GROUP BY: Count how many bookings each student has.**
```sql
SELECT Users.name, COUNT(RoomBookings.id) as total_bookings
FROM Users
JOIN RoomBookings ON Users.id = RoomBookings.user_id
GROUP BY Users.name;
```
*Output Snapshot:* Returns each student and their total room request count.

**20. UPDATE multiple: Mark all pending room bookings as accepted.**
```sql
UPDATE RoomBookings SET status = 'accepted' WHERE status = 'pending';
```
*Output Snapshot:* Updates multiple rows (pending -> accepted).
