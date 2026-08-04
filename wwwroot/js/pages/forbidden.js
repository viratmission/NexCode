/* MatchPoint - 403 access denied page */

(function () {
    'use strict';

    MP.dom.ready(function () {
        var user = MP.tokenManager.getUser();
        var homeLink = document.getElementById('homeLink');
        var message = document.getElementById('forbiddenMessage');
        var signOutButton = document.getElementById('signOutButton');

        if (user && user.role) {
            if (homeLink) {
                homeLink.href = MP.config.homeForRole(user.role);
                homeLink.textContent = 'Go to my ' + MP.formatters.roleLabel(user.role).toLowerCase() + ' dashboard';
            }
            if (message) {
                message.textContent = 'You are signed in as a ' + MP.formatters.roleLabel(user.role).toLowerCase()
                    + ', and this page belongs to a different role. Head back to your dashboard to continue.';
            }
        } else if (homeLink) {
            homeLink.href = MP.config.ROUTES.LOGIN;
            homeLink.textContent = 'Sign in';
        }

        MP.dom.on(signOutButton, 'click', function () {
            MP.tokenManager.clear();
            window.location.href = MP.config.ROUTES.LOGIN;
        });
    });
})();
