const app = angular.module('LibraryApp', ['ngRoute']);

// Setup Routing
app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'pages/login.html?v=' + Date.now(),
            controller: 'AuthController'
        })
        .when('/books', {
            templateUrl: 'pages/books.html?v=' + Date.now(),
            controller: 'BooksController'
        })
        .when('/seats', {
            templateUrl: 'pages/librarySeats.html?v=' + Date.now(),
            controller: 'SeatsController'
        })
        .when('/gpa', {
            templateUrl: 'pages/gpaCalculator.html?v=' + Date.now(),
            controller: 'GPAController'
        })
        .when('/profile', {
            templateUrl: 'pages/profile.html?v=' + Date.now(),
            controller: 'ProfileController'
        })
        .when('/inventory', {
            templateUrl: 'pages/inventory.html?v=' + Date.now(),
            controller: 'ProfileController' // Reuse logic
        })

        .otherwise({
            redirectTo: '/login' // Default to login to prevent blueprint flashing
        });

    // Provide interceptor for 401 Unauthorized responses
    $httpProvider.interceptors.push(['$q', '$window', '$location', function($q, $window, $location) {
        return {
            responseError: function(rejection) {
                if (rejection.status === 401) {
                    // Server session is dead, kill frontend session and force login
                    $window.sessionStorage.removeItem('user');
                    $location.path('/login');
                }
                return $q.reject(rejection);
            }
        };
    }]);
}]);

// Main Controller (Handles Theme & Global State)
app.controller('MainController', ['$scope', '$window', '$location', '$http', function($scope, $window, $location, $http) {
    // 1. Theme Management
    // Initialize Theme (Default to Dark)
    $scope.theme = $window.localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', $scope.theme);

    $scope.toggleTheme = function() {
        $scope.theme = $scope.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', $scope.theme);
        $window.localStorage.setItem('theme', $scope.theme);
    };

    // 2. Auth State Management
    $scope.user = JSON.parse($window.sessionStorage.getItem('user')) || null;

    $scope.isLoggedIn = function() {
        return $scope.user !== null;
    };

    $scope.logout = function() {
        $http.post('/api/auth/logout')
            .then(function(res) {
                $scope.user = null;
                $window.sessionStorage.removeItem('user');
                $location.path('/login');
            })
            .catch(function(err) {
                console.error("Logout failed", err);
            });
    };

    // Global listener for redirect if not logged in
    $scope.$on('$routeChangeStart', function(event, next, current) {
        // If not logged in and not heading to login, redirect to login
        if (!$scope.isLoggedIn() && next.templateUrl !== 'pages/login.html') {
            $location.path('/login');
        }
    });
}]);
