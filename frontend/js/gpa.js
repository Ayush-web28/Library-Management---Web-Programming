app.controller('GPAController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
    
    $scope.isPredictionMode = false;
    $scope.totalGPA = 0;
    $scope.activeSemesterIndex = 0;
    $scope.isLoaded = false;

    // Grade to Points mapping
    const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
    const gradeThresholds = { 'O': 90, 'A+': 80, 'A': 70, 'B+': 60, 'B': 50, 'C': 40 };

    // Group subjects by semester
    $scope.semesters = [
        {
            id: 1,
            gpa: 0,
            subjects: [
                { name: '', credits: 3, m1: null, m2: null, internals: null, termEndMarks: null, desiredGrade: 'A', ica: 0, finalScore: 0, grade: 'F', requiredTermEnd: 0 }
            ]
        }
    ];

    $scope.loadMarks = function() {
        $http.get('/api/gpa/load').then(function(res) {
            if (res.data && res.data.length > 0) {
                const tempSemesters = [];
                // 1. Group by semester_id
                res.data.forEach(row => {
                    let sem = tempSemesters.find(s => s.id === row.semester_id);
                    if (!sem) {
                        sem = { id: row.semester_id, gpa: 0, subjects: [] };
                        tempSemesters.push(sem);
                    }
                    // 2. Ensure subjects array is not sparse by using push or finding index
                    const subjectObj = {
                        name: row.name,
                        credits: row.credits,
                        m1: row.m1,
                        m2: row.m2,
                        internals: row.internals,
                        termEndMarks: row.term_end,
                        desiredGrade: row.desired_grade,
                        ica: 0, finalScore: 0, grade: 'F', requiredTermEnd: 0
                    };
                    sem.subjects[row.subject_idx] = subjectObj;
                });

                // Clean up any holes in the subjects array just in case
                tempSemesters.forEach(sem => {
                    sem.subjects = sem.subjects.filter(s => s !== undefined && s !== null);
                });

                $scope.semesters = tempSemesters;
                $scope.isPredictionMode = res.data[0].is_prediction === 1;
            }

            // Perform initial calculations without triggering save
            $scope.semesters.forEach(sem => sem.subjects.forEach(s => $scope.calculateBox(sem, s)));
            
            // Finally flag as loaded so FUTURE changes trigger saveMarks
            $timeout(() => {
                $scope.isLoaded = true;
            }, 500);
        });
    };

    let saveTimeout;
    $scope.saveMarks = function() {
        if (!$scope.isLoaded) return;
        if (saveTimeout) $timeout.cancel(saveTimeout);
        saveTimeout = $timeout(function() {
            $http.post('/api/gpa/save', {
                semesters: $scope.semesters,
                isPredictionMode: $scope.isPredictionMode
            });
        }, 1000);
    };

    $scope.toggleMode = function() {
        $scope.isPredictionMode = !$scope.isPredictionMode;
        // Recalculate all boxes on mode switch
        $scope.semesters.forEach(sem => sem.subjects.forEach(s => $scope.calculateBox(sem, s)));
        $scope.saveMarks();
    };

    $scope.addSemester = function() {
        if ($scope.semesters.length < 10) {
            $scope.semesters.push({
                id: $scope.semesters.length + 1,
                gpa: 0,
                subjects: [ { name: '', credits: 3, m1: null, m2: null, internals: null, termEndMarks: null, desiredGrade: 'A', ica: 0, finalScore: 0, grade: 'F', requiredTermEnd: 0 } ]
            });
            $scope.saveMarks();
        }
    };

    $scope.removeSemester = function(index) {
        if ($scope.semesters.length > 1) {
            $scope.semesters.splice(index, 1);
            // Reindex remaining semesters
            $scope.semesters.forEach((sem, idx) => { sem.id = idx + 1; });
            $scope.calculateGPA();
            $scope.saveMarks();
        }
    };

    $scope.addSubject = function(semester) {
        semester.subjects.push({ 
            name: '', credits: 3, m1: null, m2: null, internals: null, termEndMarks: null, desiredGrade: 'A', ica: 0, finalScore: 0, grade: 'F', requiredTermEnd: 0 
        });
        $scope.saveMarks();
    };

    $scope.removeSubject = function(semester, index) {
        semester.subjects.splice(index, 1);
        if (semester.subjects.length === 0) {
            // Push a default blank box instead of showing an alert
            $scope.addSubject(semester);
        }
        $scope.calculateGPA();
        $scope.saveMarks();
    };

    $scope.calculateBox = function(semester, subject) {
        // Enforce strict max bounds (Clamping)
        subject.credits = subject.credits === null ? null : Math.min(Math.max(subject.credits, 1), 10);
        subject.m1 = subject.m1 === null ? null : Math.min(Math.max(subject.m1, 0), 10);
        subject.m2 = subject.m2 === null ? null : Math.min(Math.max(subject.m2, 0), 10);
        subject.internals = subject.internals === null ? null : Math.min(Math.max(subject.internals, 0), 30);
        subject.termEndMarks = subject.termEndMarks === null ? null : Math.min(Math.max(subject.termEndMarks, 0), 100);

        // Requirement 8: Check for duplicate subject names
        subject.nameError = '';
        if (subject.name && subject.name.trim() !== '') {
            let count = 0;
            $scope.semesters.forEach(sem => {
                sem.subjects.forEach(s => {
                    if (s !== subject && s.name && s.name.trim().toLowerCase() === subject.name.trim().toLowerCase()) {
                        count++;
                    }
                });
            });
            if (count > 0) {
                subject.nameError = 'Subject already exists';
            }
        }

        let m1val = subject.m1 || 0;
        let m2val = subject.m2 || 0;
        let intval = subject.internals || 0;
        let termval = subject.termEndMarks || 0;

        // Calculate ICA
        subject.ica = m1val + m2val + intval;
        
        if ($scope.isPredictionMode) {
            // Mode 1: Prediction
            let targetScore = gradeThresholds[subject.desiredGrade];
            let requiredEnd = 2 * (targetScore - subject.ica);
            
            // Requirement 2: If calculated required marks < 40, show 40
            if (requiredEnd <= 40) {
                subject.requiredTermEnd = 40; 
            } else if (requiredEnd > 100) {
                subject.requiredTermEnd = 'Unachievable (>100)';
            } else {
                subject.requiredTermEnd = requiredEnd;
            }
            subject.grade = subject.desiredGrade;

        } else {
            // Mode 2: Manual
            subject.finalScore = subject.ica + (termval / 2);
            
            if (subject.finalScore >= 90) subject.grade = 'O';
            else if (subject.finalScore >= 80) subject.grade = 'A+';
            else if (subject.finalScore >= 70) subject.grade = 'A';
            else if (subject.finalScore >= 60) subject.grade = 'B+';
            else if (subject.finalScore >= 50) subject.grade = 'B';
            else if (subject.finalScore >= 40) subject.grade = 'C';
            else subject.grade = 'F';
        }
        
        $scope.calculateGPA();
        $scope.saveMarks();
    };

    $scope.calculateGPA = function() {
        let globalPoints = 0;
        let globalCredits = 0;

        $scope.semesters.forEach(semester => {
            let semPoints = 0;
            let semCredits = 0;

            semester.subjects.forEach(subject => {
                let credits = subject.credits || 0;
                let points = gradePoints[subject.grade] || 0;
                
                semPoints += (points * credits);
                semCredits += credits;
                
                globalPoints += (points * credits);
                globalCredits += credits;
            });

            semester.gpa = semCredits > 0 ? (semPoints / semCredits) : 0;
        });

        $scope.totalGPA = globalCredits > 0 ? (globalPoints / globalCredits) : 0;
    };

    $scope.loadMarks();

}]);
