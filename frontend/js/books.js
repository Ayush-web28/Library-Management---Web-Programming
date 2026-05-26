app.controller('BooksController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
    
    $scope.books = [];
    $scope.searchQuery = '';
    $scope.filterSubject = '';
    
    // Custom Dropdown Logic
    $scope.subjects = [
        { label: 'ALL SUBJECTS', value: '' },
        { label: 'MATHEMATICS', value: 'Mathematics' },
        { label: 'PHYSICS', value: 'Physics' },
        { label: 'CHEMISTRY', value: 'Chemistry' },
        { label: 'CALCULUS', value: 'Calculus' },
        { label: 'DATABASES', value: 'Databases' },
        { label: 'PROGRAMMING', value: 'Programming' }
    ];
    $scope.showSubjectDropdown = false;

    $scope.toggleSubjectDropdown = function() {
        $scope.showSubjectDropdown = !$scope.showSubjectDropdown;
    };

    $scope.selectSubject = function(subject) {
        $scope.filterSubject = subject.value;
        $scope.showSubjectDropdown = false;
        $scope.fetchBooks();
    };

    $scope.getSubjectLabel = function(value) {
        const sub = $scope.subjects.find(s => s.value === value);
        return sub ? sub.label : 'ALL SUBJECTS';
    };

    
    $scope.message = '';
    $scope.error = '';

    // Search and Filter Tabs State
    $scope.activeTab = 'search'; // Default to search
    $scope.switchTab = function(tab) {
        $scope.activeTab = tab;
        // Optionally clear inputs when switching for a clean feel?
        // $scope.searchQuery = '';
        // $scope.filterSubject = '';
    };

    // Modal State
    $scope.selectedBook = null;

    $scope.openModal = function(book) {
        $scope.selectedBook = book;
    };
    $scope.closeModal = function() {
        $scope.selectedBook = null;
    };

    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && $scope.selectedBook) {
            $scope.$apply(() => { $scope.closeModal(); });
        }
    });

    // Function to fetch books with filters
    $scope.fetchBooks = function() {
        let url = '/api/books?';
        if ($scope.searchQuery) url += `search=${encodeURIComponent($scope.searchQuery)}&`;
        if ($scope.filterSubject) url += `subject=${encodeURIComponent($scope.filterSubject)}`;
        
        $http.get(url, { withCredentials: true })
            .then(function(res) {
                // Ensure is_requested is treated as boolean from SQL int
                $scope.books = res.data.map(b => {
                    b.is_requested = !!b.is_requested;
                    return b;
                });
            })
            .catch(function(err) {
                console.error("Failed to fetch books", err);
            });
    };

    // Make request on load
    $scope.fetchBooks();

    // Helper to update book status across card and modal
    const updateBookStatus = function(bookId, status, requestedSuccess = false) {
        $scope.books = $scope.books.map(b => {
            if (b.id === bookId) {
                b.is_requested = status;
                b.requestedSuccessfully = requestedSuccess;
            }
            return b;
        });
        if ($scope.selectedBook && $scope.selectedBook.id === bookId) {
            $scope.selectedBook.is_requested = status;
            $scope.selectedBook.requestedSuccessfully = requestedSuccess;
        }
    };

    // Store timeouts to cancel them if needed (e.g. on early cancellation)
    const pendingTimeouts = {};

    // Borrow Request
    $scope.requestHardCopy = function(book) {
        $http.post('/api/books/borrow', { book_id: book.id })
            .then(function(res) {
                updateBookStatus(book.id, true, true);
                
                // Requirement 1: Store timeout to allow cancellation
                if (pendingTimeouts[book.id]) $timeout.cancel(pendingTimeouts[book.id]);
                
                pendingTimeouts[book.id] = $timeout(function() {
                    updateBookStatus(book.id, true, false);
                    delete pendingTimeouts[book.id];
                }, 4000);
            })
            .catch(function(err) {
                console.error("Borrowing failed:", err);
                book.requestError = err.data.error || "Failed to request book.";
                $timeout(function() { book.requestError = ''; }, 4000);
            });
    };

    // Cancel Request
    $scope.cancelRequest = function(book) {
        // Requirement 1: Cancel any pending success timers and reset UI immediately
        if (pendingTimeouts[book.id]) {
            $timeout.cancel(pendingTimeouts[book.id]);
            delete pendingTimeouts[book.id];
        }
        updateBookStatus(book.id, false, false);

        $http.post('/api/books/cancel', { book_id: book.id })
            .then(function(res) {
                // Already updated UI, just sync with backend if needed
                $scope.fetchBooks();
            })
            .catch(function(err) {
                console.error("Cancellation failed:", err);
                // Revert if it actually failed on server
                $scope.fetchBooks(); 
            });
    };

    // Download mock
    $scope.downloadSoftCopy = function(url) {
        // Mock download mechanic
        alert("Downloading file from: " + url + "\n(This is a simulated download feature)");
    };

    // Close dropdown on click outside
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.custom-dropdown-container');
        if (dropdown && !dropdown.contains(event.target)) {
            $scope.$apply(() => {
                $scope.showSubjectDropdown = false;
            });
        }
    });

}]);
