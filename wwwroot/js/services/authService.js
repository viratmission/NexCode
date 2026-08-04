/* MatchPoint - authentication service (register, login, session bootstrap) */

window.MP = window.MP || {};

MP.authService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    function registerJobSeeker(payload) {
        return MP.apiClient.post(E.registerJobSeeker, {
            fullName: payload.fullName,
            email: payload.email,
            password: payload.password,
            confirmPassword: payload.confirmPassword
        }, { auth: false, skipAuthRedirect: true }).then(persist);
    }

    function registerEmployer(payload) {
        return MP.apiClient.post(E.registerEmployer, {
            fullName: payload.fullName,
            email: payload.email,
            password: payload.password,
            confirmPassword: payload.confirmPassword,
            companyName: payload.companyName
        }, { auth: false, skipAuthRedirect: true }).then(persist);
    }

    function login(email, password) {
        return MP.apiClient.post(E.login, {
            email: email,
            password: password
        }, { auth: false, skipAuthRedirect: true }).then(persist);
    }

    function persist(response) {
        if (response && response.data && response.data.token) {
            MP.tokenManager.setSession(response.data);
        }
        return response;
    }

    /** Confirms the token is still valid and refreshes the cached user summary. */
    function me() {
        return MP.apiClient.get(E.me).then(function (response) {
            if (response && response.data) {
                MP.tokenManager.setUser(response.data);
            }
            return response;
        });
    }

    function logout(redirect) {
        MP.tokenManager.clear();
        if (redirect !== false) {
            window.location.href = MP.config.ROUTES.LOGIN;
        }
    }

    function currentUser() {
        return MP.tokenManager.getUser();
    }

    function isAuthenticated() {
        return MP.tokenManager.hasValidSession();
    }

    function homeUrl() {
        var user = currentUser();
        return user ? MP.config.homeForRole(user.role) : MP.config.ROUTES.LOGIN;
    }

    return {
        registerJobSeeker: registerJobSeeker,
        registerEmployer: registerEmployer,
        login: login,
        me: me,
        logout: logout,
        currentUser: currentUser,
        isAuthenticated: isAuthenticated,
        homeUrl: homeUrl
    };
})();
