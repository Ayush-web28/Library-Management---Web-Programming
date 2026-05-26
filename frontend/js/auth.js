app.controller('AuthController', ['$scope', '$http', '$location', '$window', '$timeout', function($scope, $http, $location, $window, $timeout) {
    if ($scope.$parent.isLoggedIn()) {
        const role = $scope.$parent.user.role;
        $location.path(role === 'admin' ? '/seats' : '/books');
        return;
    }

    $scope.loginData = { useOtp: false };
    $scope.signupData = {};
    $scope.selectedRole = null;
    $scope.isLogin = true;

    $scope.loginError = '';
    $scope.signupError = '';
    $scope.signupSuccess = '';
    $scope.signupFieldErrors = {};
    $scope.showPasswordLogin = false;
    $scope.showPasswordSignup = false;

    $scope.resetForms = function() {
        $scope.selectedRole = null;
        $scope.isLogin = true;
        $scope.loginData = { useOtp: false };
        $scope.signupData = {};
        $scope.loginError = '';
        $scope.signupError = '';
        $scope.signupSuccess = '';
        $scope.signupFieldErrors = {};
        $scope.otpToast = null;
        $scope.showPasswordLogin = false;
        $scope.showPasswordSignup = false;
        if ($scope.loginForm) {
            $scope.loginForm.$setPristine();
            $scope.loginForm.$setUntouched();
        }
        if ($scope.signupForm) {
            $scope.signupForm.$setPristine();
            $scope.signupForm.$setUntouched();
        }
    };

    // Premium Toast Logic
    $scope.otpToast = null;
    $scope.copyOtp = function() {
        if (!$scope.otpToast) return;
        navigator.clipboard.writeText($scope.otpToast.otp).then(() => {
            $scope.$apply(() => {
                $scope.otpToast.copied = true;
            });
            $timeout(() => {
                if ($scope.otpToast) $scope.otpToast.copied = false;
            }, 2000);
        });
    };

    $scope.generateOtp = function() {
        if (!$scope.loginData.sap_id || $scope.loginData.sap_id.length !== 11) {
            $scope.loginError = 'Please enter a valid 11-digit SAP ID first.';
            return;
        }
        $http.get('/api/auth/send-otp?sap_id=' + $scope.loginData.sap_id)
            .then(function(res) {
                $scope.otpToast = {
                    otp: res.data.otp,
                    message: res.data.message,
                    copied: false
                };
            })
            .catch(function(err) {
                $scope.loginError = err.data.error || 'Failed to generate OTP.';
            });
    };

    $scope.closeOtpToast = function() {
        $scope.otpToast = null;
    };

    $scope.login = function() {
        $scope.loginError = '';
        const payload = {
            sap_id: $scope.loginData.sap_id,
            role: $scope.selectedRole
        };
        
        if ($scope.loginData.useOtp) {
            payload.otp = $scope.loginData.otp;
        } else {
            payload.password = $scope.loginData.password;
        }

        $http.post('/api/auth/login', payload)
            .then(function(res) {
                const userData = res.data;
                $window.sessionStorage.setItem('user', JSON.stringify(userData));
                $scope.$parent.user = userData;
                $location.path(userData.role === 'admin' ? '/seats' : '/books');
            })
            .catch(function(err) {
                $scope.loginError = err.data.error || 'Login failed. Please check credentials.';
            });
    };

    $scope.signup = function() {
        $scope.signupError = '';
        $scope.signupSuccess = '';
        $scope.signupFieldErrors = {};

        $scope.signupData.role = $scope.selectedRole;

        $http.post('/api/auth/signup', $scope.signupData)
            .then(function(res) {
                $scope.signupSuccess = 'Account created successfully! You can now log in.';
                $scope.signupData = {};
                $scope.signupForm.$setPristine();
                $scope.signupForm.$setUntouched();
                $timeout(() => {
                    $scope.isLogin = true;
                    $scope.signupSuccess = '';
                }, 1500);
            })
            .catch(function(err) {
                if (err.data && err.data.field) {
                    $scope.signupFieldErrors[err.data.field] = err.data.error;
                } else {
                    $scope.signupError = err.data.error || 'Signup failed.';
                }
            });
    };
}]);
