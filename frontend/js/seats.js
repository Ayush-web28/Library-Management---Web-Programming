app.controller('SeatsController', ['$scope', '$http', '$interval', '$timeout', function($scope, $http, $interval, $timeout) {
    // Configurations representing the blueprint exactly
    $scope.totalPcs = 6; // 4 Regular + 2 Bloomberg
    $scope.totalReadingSeats = 96; // 12 tables of 8 seats (6 top half, 6 bottom half)

    $scope.occupancy = {
        total_students: 0,
        occupied_pcs: 0,
        in_rooms: 0,
        open_reading_occupied: 0
    };

    $scope.visualSeats = [];
    $scope.pcSeats = [];
    $scope.discussionRooms = [];
    
    $scope.booking = {};
    $scope.errorMsg = '';
    $scope.successMsg = '';
    $scope.formSubmitted = false;

    // Custom Dropdown Logic (Requirement 1)
    $scope.showRoomDropdown = false;
    $scope.showSlotDropdown = false;

    $scope.toggleRoomDropdown = function() { $scope.showRoomDropdown = !$scope.showRoomDropdown; $scope.showSlotDropdown = false; };
    $scope.toggleSlotDropdown = function() { $scope.showSlotDropdown = !$scope.showSlotDropdown; $scope.showRoomDropdown = false; };

    $scope.selectDropdownRoom = function(room) {
        $scope.booking.room_id = room.id.toString();
        $scope.booking.num_students = null;
        $scope.showRoomDropdown = false;
        $scope.fetchBookedSlots();
    };

    $scope.selectDropdownSlot = function(slot) {
        $scope.booking.time_slot = slot;
        $scope.showSlotDropdown = false;
    };

    $scope.getSelectedRoomLabel = function() {
        const room = $scope.getSelectedRoom();
        return room ? `${room.room_name} (Max: ${room.capacity})` : '-- Choose Room --';
    };

    $scope.getSelectedSlotLabel = function() {
        return $scope.booking.time_slot ? $scope.booking.time_slot : '-- Choose Slot --';
    };

    // Close dropdowns on outside click
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.custom-dropdown-container')) {
            $scope.$apply(() => {
                $scope.showRoomDropdown = false;
                $scope.showSlotDropdown = false;
            });
        }
    });

    // Helper to get YYYY-MM-DD in LOCAL time (prevents timezone-shift bugs)
    function getLocalDateString(date) {
        const d = date || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    $scope.todayDate = getLocalDateString();

    $scope.timeSlots = [
        '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
        '14:00-15:00', '15:00-16:00', '16:00-17:00'
    ];
    $scope.bookedSlots = []; // Slots already approved for others

    // Helper: get the currently selected room object
    $scope.getSelectedRoom = function() {
        if (!$scope.booking.room_id) return null;
        return $scope.discussionRooms.find(function(r) {
            return r.id.toString() === $scope.booking.room_id.toString();
        }) || null;
    };

    // Helper: get max capacity for dynamic HTML max attribute
    $scope.getSelectedRoomCapacity = function() {
        const room = $scope.getSelectedRoom();
        return room ? room.capacity : 12;
    };

    // Let user easily select room from blueprint map
    $scope.selectRoom = function(roomId) {
        $scope.booking.room_id = roomId.toString();
        $scope.booking.num_students = null; 
        $scope.successMsg = ''; 
        $scope.errorMsg = '';
        $scope.fetchBookedSlots(); // Check availability for this room on selected date
        let f = document.getElementById('bookingFormSection');
        if(f) f.scrollIntoView({ behavior: 'smooth' });
    };

    $scope.fetchBookedSlots = function() {
        if (!$scope.booking.date) return;
        const dateStr = ($scope.booking.date instanceof Date) ? getLocalDateString($scope.booking.date) : $scope.booking.date;
        $http.get('/api/seats/booked-slots?date=' + dateStr)
            .then(function(res) {
                $scope.bookedSlots = res.data;
            });
    };

    $scope.isSlotDisabled = function(slot) {
        // 1. Check if slot is already booked
        const isBooked = $scope.bookedSlots.some(s => s.room_id && s.room_id.toString() === $scope.booking.room_id.toString() && s.time_slot === slot);
        if (isBooked) return true;

        // 2. If Today, check if hour has passed
        const selectedDateStr = ($scope.booking.date instanceof Date) ? getLocalDateString($scope.booking.date) : $scope.booking.date;
        if (selectedDateStr === $scope.todayDate) {
            const currentHour = new Date().getHours();
            const slotStartHour = parseInt(slot.split(':')[0]);
            if (slotStartHour <= currentHour) return true; // Block current and past hours
        }
        
        return false;
    };

    // Form logic to somewhat randomize occupancy within limits on each refresh interval to simulate live usage
    $scope.randomShift = function() {
        let maxShift = 5;
        let shift = Math.floor(Math.random() * maxShift * 2) - maxShift; // -5 to +5
        $scope.occupancy.open_reading_occupied = Math.max(0, Math.min($scope.totalReadingSeats, $scope.occupancy.open_reading_occupied + shift));
        
        let pcShift = Math.floor(Math.random() * 3) - 1; // -1 to +1
        $scope.occupancy.occupied_pcs = Math.max(0, Math.min($scope.totalPcs, $scope.occupancy.occupied_pcs + pcShift));
    };

    // Fetch Occupancy data
    $scope.fetchOccupancy = function() {
        $http.get('/api/seats/occupancy')
            .then(function(res) {
                let data = res.data;
                $scope.occupancy.in_rooms = data.in_rooms;
                
                // Initialize base occupancy
                if ($scope.occupancy.open_reading_occupied === 0) {
                     $scope.occupancy.open_reading_occupied = Math.min(data.open_reading_occupied || 30, $scope.totalReadingSeats);
                     $scope.occupancy.occupied_pcs = Math.min(data.occupied_pcs || 2, $scope.totalPcs);
                     $scope.occupancy.total_students = data.total_students;
                } else {
                     // Add subtle shifts if just updating
                     $scope.randomShift();
                }
                
                $scope.generateVisualizer();
            })
            .catch(function(err) {
                console.error("Failed to fetch occupancy", err);
            });
    };

    // Fetch Rooms from Backend (now exactly 3 rooms since our seed script)
    $scope.fetchRooms = function() {
        $http.get('/api/seats/rooms')
            .then(function(res) {
                $scope.discussionRooms = res.data;
            });
    };

    // Generate BookMyShow style seat visualization with random distribution
    $scope.generateVisualizer = function() {
        // Update Total Stats sum
        $scope.occupancy.total_students = $scope.occupancy.in_rooms + $scope.occupancy.occupied_pcs + $scope.occupancy.open_reading_occupied;

        // --- PCs ---
        let pSeats = Array($scope.totalPcs).fill('available');
        let pcOcc = $scope.occupancy.occupied_pcs;
        while(pcOcc > 0) {
            let randIndex = Math.floor(Math.random() * $scope.totalPcs);
            if (pSeats[randIndex] === 'available') {
                pSeats[randIndex] = 'occupied';
                pcOcc--;
            }
        }
        $scope.pcSeats = pSeats.map((status, i) => ({ type: 'pc', status: status, label: `PC${i+1}` }));

        // --- Reading Seats ---
        let rSeats = Array($scope.totalReadingSeats).fill('available');
        let rOcc = $scope.occupancy.open_reading_occupied;
        while(rOcc > 0) {
            let randIndex = Math.floor(Math.random() * $scope.totalReadingSeats);
            if (rSeats[randIndex] === 'available') {
                rSeats[randIndex] = 'occupied';
                rOcc--;
            }
        }
        $scope.visualSeats = rSeats.map((status, i) => ({ type: 'reading', status: status, label: `S${i+1}` }));
        
        $scope.updateRoomOccupancyColors();
    };

    $scope.updateRoomOccupancyColors = function() {
        // Get current IST time to see which slot we are in
        const ist = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        const hour = ist.getUTCHours();
        const min = ist.getUTCMinutes();
        const currentTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const today = getLocalDateString(ist);

        // Fetch all accepted bookings for today
        $http.get('/api/seats/booked-slots?date=' + today)
            .then(function(res) {
                const todayBookings = res.data;
                $scope.discussionRooms.forEach(room => {
                    let isCurrentlyOccupied = false;
                    const roomBookings = todayBookings.filter(b => b.room_id.toString() === room.id.toString());
                    
                    roomBookings.forEach(b => {
                        const [start, end] = b.time_slot.split('-');
                        if (currentTime >= start && currentTime < end) {
                            isCurrentlyOccupied = true;
                        }
                    });
                    room.is_currently_occupied = isCurrentlyOccupied;
                });
            });
    };

    // Submit Booking
    $scope.bookRoom = function() {
        $scope.errorMsg = '';
        $scope.successMsg = '';
        $scope.formSubmitted = true;

        const reportError = function(msg) {
            $scope.errorMsg = msg;
        };

        // --- MANUAL VALIDATION ---
        // 1. Check if all required fields are filled
        if (!$scope.booking.room_id || !$scope.booking.date || !$scope.booking.time_slot || !$scope.booking.num_students) {
            reportError('Please complete all fields in the booking form.');
            // Trigger $touched on all fields to show error spans if they are empty
            if ($scope.roomForm) {
                angular.forEach($scope.roomForm.$error.required, function(field) {
                    field.$setTouched();
                });
            }
            return;
        }

        // 2. Date & Time Validation
        const now = new Date();
        const todayStr = getLocalDateString(now);
        const selectedDateStr = ($scope.booking.date instanceof Date) ? getLocalDateString($scope.booking.date) : $scope.booking.date;

        if (selectedDateStr < todayStr) {
            reportError('Booking date cannot be in the past.');
            return;
        }

        if (selectedDateStr === todayStr) {
            const currentHour = now.getHours();
            const slotStartHour = parseInt($scope.booking.time_slot.split(':')[0]);
            if (slotStartHour <= currentHour) {
                reportError('Cannot book a room for the current or past hours of today.');
                return;
            }
        }

        // 3. Room selection
        const selectedRoom = $scope.getSelectedRoom();
        if (!selectedRoom) {
            reportError('Please select a valid discussion room.');
            return;
        }

        // 4. Number of students
        const numStudents = parseInt($scope.booking.num_students);
        if (numStudents > selectedRoom.capacity) {
            reportError(`"${selectedRoom.room_name}" has a maximum capacity of ${selectedRoom.capacity} students. You entered ${numStudents}.`);
            return;
        }

        // --- SUBMIT ---
        let bookingData = { 
            room_id: $scope.booking.room_id,
            time_slot: $scope.booking.time_slot,
            num_students: numStudents,
            date: selectedDateStr
        };

        $http.post('/api/seats/book-room', bookingData)
            .then(function(res) {
                $scope.successMsg = res.data.message || 'Room booking request submitted!';
                $scope.booking = {}; // Reset form fields
                $scope.formSubmitted = false; // Reset submission state
                if ($scope.roomForm) {
                    $scope.roomForm.$setPristine();
                    $scope.roomForm.$setUntouched();
                }
                
                // Hide success message after 4 seconds to give user time to read
                $timeout(function() {
                    $scope.successMsg = '';
                }, 4000);

                // Refresh data
                $scope.fetchOccupancy();
            })
            .catch(function(err) {
                const errorDetail = (err.data && err.data.error) ? err.data.error : 'Failed to submit booking.';
                reportError(errorDetail);
            });
    };

    // Live update toggle
    let updateInterval = $interval(function() {
        $scope.fetchOccupancy(); // Pull API, random shifts
    }, 20000); // 20,000 ms = 20 Sec refresh

    $scope.$on('$destroy', function() {
        // Destroy interval when leaving the view to stop background lag
        if (angular.isDefined(updateInterval)) {
            $interval.cancel(updateInterval);
            updateInterval = undefined;
        }
    });

    // Init Data load
    $scope.fetchOccupancy();
    $scope.fetchRooms();
}]);
