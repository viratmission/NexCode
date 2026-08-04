/* MatchPoint - blocks unauthenticated access to protected pages */

window.MP = window.MP || {};

MP.authGuard = (function () {
    'use strict';

    function returnUrl() {
        return encodeURIComponent(window.location.pathname + window.location.search);
    }

    /**
     * Returns true when a valid session exists.
     * Otherwise sends the visitor to the login page (no token) or the
     * session-expired page (token present but past its expiry).
     */
    function require() {
        var token = MP.tokenManager.getToken();

        if (!token) {
            window.location.replace(MP.config.ROUTES.LOGIN + '?returnUrl=' + returnUrl());
            return false;
        }

        if (MP.tokenManager.isExpired()) {
            MP.tokenManager.clear();
            window.location.replace(MP.config.ROUTES.UNAUTHORIZED + '?returnUrl=' + returnUrl());
            return false;
        }

        return true;
    }

    /** Public pages (login / register) bounce signed in users to their role home. */
    function redirectIfAuthenticated() {
        if (!MP.tokenManager.hasValidSession()) {
            return false;
        }

        var user = MP.tokenManager.getUser();
        window.location.replace(user ? MP.config.homeForRole(user.role) : MP.config.ROUTES.HOME);
        return true;
    }

    /**
     * Verifies the token against /api/auth/me in the background.
     * A 401 is handled by apiClient, which clears the session and redirects.
     */
    function verify() {
        return MP.authService.me().catch(function () {
            return null;
        });
    }

    /** Removes the pre-auth visibility guard once the page is cleared to render. */
    function reveal() {
        document.body.classList.remove('auth-pending');
    }

    function logout() {
        MP.authService.logout();
    }

    return {
        require: require,
        redirectIfAuthenticated: redirectIfAuthenticated,
        verify: verify,
        reveal: reveal,
        logout: logout
    };
})();
