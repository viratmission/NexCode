/* MatchPoint - restricts pages to specific roles */

window.MP = window.MP || {};

MP.roleGuard = (function () {
    'use strict';

    function toList(roles) {
        if (!roles) {
            return [];
        }
        return Array.isArray(roles) ? roles : [roles];
    }

    function hasRole(roles) {
        var allowed = toList(roles);
        if (allowed.length === 0) {
            return true;
        }
        var role = MP.tokenManager.getRole();
        return Boolean(role) && allowed.indexOf(role) !== -1;
    }

    /**
     * Runs the auth guard, then checks the role claim cached at sign in.
     * Returns true when the page may render.
     */
    function require(roles) {
        if (!MP.authGuard.require()) {
            return false;
        }

        if (!hasRole(roles)) {
            window.location.replace(MP.config.ROUTES.FORBIDDEN);
            return false;
        }

        MP.authGuard.reveal();
        return true;
    }

    function isJobSeeker() {
        return hasRole(MP.config.ROLES.JOB_SEEKER);
    }

    function isEmployer() {
        return hasRole(MP.config.ROLES.EMPLOYER);
    }

    function isAdministrator() {
        return hasRole(MP.config.ROLES.ADMINISTRATOR);
    }

    return {
        require: require,
        hasRole: hasRole,
        isJobSeeker: isJobSeeker,
        isEmployer: isEmployer,
        isAdministrator: isAdministrator
    };
})();
