app.controller('ProfileController', ['$scope', '$http', '$interval', '$timeout', function ($scope, $http, $interval, $timeout) {

    // Core Profile Arrays
    $scope.profile = {};
    $scope.summary = {};
    $scope.borrowedBooks = [];
    $scope.roomBookings = [];
    $scope.newBookingCount = 0;

    // Admin Arrays & UI State
    $scope.adminRequests = { books: [], rooms: [] };
    $scope.inventory = [];
    $scope.adminTab = 'requests'; // Tabs for main admin sections (Inventory vs Requests Dashboard)

    // Student Tabs
    $scope.studentTab = 'books'; // Default student tab (Books vs Rooms)

    // Admin Request Dashboard Tabs
    $scope.adminRequestTab = 'books'; // Default request tab (Books vs Rooms)

    $scope.adminSearchBook = ''; // Search query
    $scope.inventoryFilterSubject = ''; // Requirement 7: Admin subject filter

    // Custom Dropdown Logic (Requirement 1)
    $scope.showAddSubjectDropdown = false;
    $scope.showInvSubjectDropdown = false;
    $scope.dynamicSubjects = ["Computer Science", "Finance", "Management", "Mechanical", "Civil", "AI/ML", "Ethics"];

    $scope.toggleAddSubject = function () { $scope.showAddSubjectDropdown = !$scope.showAddSubjectDropdown; $scope.showInvSubjectDropdown = false; };
    $scope.toggleInvSubject = function () { $scope.showInvSubjectDropdown = !$scope.showInvSubjectDropdown; $scope.showAddSubjectDropdown = false; };

    $scope.selectAddSubject = function (subj) {
        $scope.newBook.subject = subj;
        $scope.showAddSubjectDropdown = false;
    };

    $scope.selectInvSubject = function (subj) {
        $scope.inventoryFilterSubject = subj;
        $scope.showInvSubjectDropdown = false;
    };

    $scope.getInvSubjectLabel = function () {
        return $scope.inventoryFilterSubject || 'All Subjects';
    };

    $scope.getAddSubjectLabel = function () {
        return $scope.newBook.subject || 'Select Subject...';
    };

    // Close on outside click
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-dropdown-container')) {
            if ($scope.showAddSubjectDropdown || $scope.showInvSubjectDropdown) {
                $scope.$apply(() => {
                    $scope.showAddSubjectDropdown = false;
                    $scope.showInvSubjectDropdown = false;
                });
            }
        }
    });

    $scope.switchStudentTab = function (tab) { $scope.studentTab = tab; };
    $scope.switchAdminRequestTab = function (tab) { $scope.adminRequestTab = tab; };

    // Explicit filter for inventory search (Title, Subject, Author, Book ID)
    $scope.searchInventory = function (book) {
        // First check subject filter
        if ($scope.inventoryFilterSubject && book.subject !== $scope.inventoryFilterSubject) return false;

        if (!$scope.adminSearchBook) return true;
        const q = $scope.adminSearchBook.toLowerCase();
        return (book.title && book.title.toLowerCase().indexOf(q) !== -1) ||
            (book.subject && book.subject.toLowerCase().indexOf(q) !== -1) ||
            (book.author && book.author.toLowerCase().indexOf(q) !== -1) ||
            (book.book_id && book.book_id.toLowerCase().indexOf(q) !== -1);
    };

    $scope.newBook = { book_id: '', title: '', author: '', subject: '', total_copies: 1 };
    $scope.addBookSuccess = '';
    $scope.addBookError = '';

    $scope.loadProfile = function () {
        $http.get('/api/profile')
            .then(function (res) {
                $scope.profile = res.data.user;
                $scope.summary = res.data.activity_summary;

                const allBooks = res.data.borrowed_books || [];
                $scope.pendingBooks = allBooks.filter(b => b.status === 'pending');
                $scope.acceptedBooks = allBooks.filter(b => b.status === 'accepted' || b.status === 'returned');

                const allRooms = res.data.room_bookings || [];
                $scope.pendingRooms = allRooms.filter(r => r.status === 'pending');
                $scope.acceptedRooms = allRooms.filter(r => r.status === 'accepted');

                // Track recent accepted bookings without being intrusive
                $scope.newBookingCount = $scope.acceptedRooms.length;

                // If admin, load admin requests & inventory
                if ($scope.profile.role === 'admin') {
                    $scope.loadAdminRequests();
                    $scope.loadInventory();
                }
            })
            .catch(function (err) {
                console.error("Failed to load profile", err);
            });
    };

    $scope.loadAdminRequests = function () {
        $http.get('/api/admin/requests')
            .then(function (res) {
                $scope.adminRequests.books = res.data.bookRequests;
                $scope.adminRequests.rooms = res.data.roomRequests;
            });
    };

    $scope.loadInventory = function () {
        // Skip background refresh if any book has an active sync error
        // to prevent flickering or losing the error state.
        const hasError = ($scope.inventory || []).some(b => b.stockError);
        if (hasError) return;

        $http.get('/api/books')
            .then(function (res) {
                // Preserve local state if needed (optional)
                $scope.inventory = res.data;
                $scope.updateDynamicSubjects();
            });
    };

    // --- Dynamic Subject Logic ---
    $scope.staticSubjects = ["Mathematics", "Physics", "Computer Science", "Literature", "History", "Design", "Engineering"];
    $scope.dynamicSubjects = angular.copy($scope.staticSubjects);

    $scope.updateDynamicSubjects = function () {
        if (!$scope.inventory) return;

        // Extract unique subjects from inventory
        const uniqueInDb = [...new Set($scope.inventory.map(b => b.subject))];

        // Merge with static ones
        const combined = [...new Set([...$scope.staticSubjects, ...uniqueInDb])];

        // Sort alphabetically
        $scope.dynamicSubjects = combined.sort();
    };

    $scope.addBook = function () {
        $scope.addBookSuccess = '';
        $scope.addBookError = '';

        $http.post('/api/admin/books', $scope.newBook)
            .then(function (res) {
                $scope.addBookSuccess = res.data.message;

                // Clear model
                $scope.newBook = { book_id: '', title: '', author: '', subject: '', total_copies: 1 };

                // Clear validation states
                if ($scope.addBookForm) {
                    $scope.addBookForm.$setPristine();
                    $scope.addBookForm.$setUntouched();
                }

                $scope.loadInventory(); // Refresh list for immediate sync

                // Success message for 4s
                $timeout(function () {
                    $scope.addBookSuccess = '';
                }, 4000);
            })
            .catch(function (err) {
                $scope.addBookError = err.data.error || 'Failed to add book';
            });
    };

    // Admin Action: Update Book Stock
    $scope.updateStock = function (book) {
        book.stockError = "";

        // Auto-Correct Validation: Revert to original value instantly
        if (book.available_hard_copies > book.total_hard_copies || book.available_hard_copies < 0) {
            book.available_hard_copies = book.originalStock;
            return;
        }

        $http.post('/api/admin/books/update-stock', {
            book_id: book.id,
            available_hard_copies: book.available_hard_copies
        })
            .then(function (res) {
                console.log("Stock updated for book:", book.id);
                book.stockError = ""; // Clear existing error on success
            })
            .catch(function (err) {
                book.stockError = (err.data && err.data.error) ? err.data.error : "Sync Failed";
                console.error("Stock sync error:", err);
            });
    };

    $scope.trackOriginalStock = function (book) {
        book.stockError = "";
        book.originalStock = book.available_hard_copies;
    };

    $scope.enforceMaxStock = function (book) {
        if (book.available_hard_copies !== undefined && book.available_hard_copies !== null) {
            if (book.available_hard_copies > book.total_hard_copies || book.available_hard_copies < 0) {
                // Defer the revert by 1 cycle using $timeout to force DOM text box to re-render
                $timeout(function() {
                    book.available_hard_copies = book.originalStock;
                });
            }
        }
    };

    // Admin Action: Update Book 
    $scope.updateBookStatus = function (id, status) {
        $http.post(`/api/admin/request/book/${id}`, { status: status })
            .then(function (res) {
                $scope.loadAdminRequests();
                $scope.loadProfile(); // Instantly refresh
            })
            .catch(function (err) {
                $scope.adminRequestError = err.data.error || "Failed to update book status";
                $timeout(() => { $scope.adminRequestError = ''; }, 4000);
            });
    };

    // Admin Action: Update Room
    $scope.updateRoomStatus = function (id, status) {
        $http.post(`/api/admin/request/room/${id}`, { status: status })
            .then(function (res) {
                $scope.loadAdminRequests();
                $scope.loadProfile(); // Instantly refresh
            })
            .catch(function (err) {
                $scope.adminRequestError = err.data.error || "Failed to update room status";
                $timeout(() => { $scope.adminRequestError = ''; }, 4000);
            });
    };

    // Load initial data
    $scope.loadProfile();

    // Live Auto-Refresh Data Every 15 Seconds
    var profileRefreshInterval = $interval(function () {
        if ($scope.profile) {
            $scope.loadProfile();
        }
    }, 15000);

    // Cleanup interval on page exit
    $scope.$on('$destroy', function () {
        if (profileRefreshInterval) {
            $interval.cancel(profileRefreshInterval);
        }
    });

}]);
