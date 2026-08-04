/* MatchPoint - 404 page */

(function () {
    'use strict';

    MP.dom.ready(function () {
        var homeLink = document.getElementById('homeLink');
        var backButton = document.getElementById('backButton');
        var message = document.getElementById('notFoundMessage');
        var reason = MP.dom.queryParam('reason');

        if (reason && message) {
            message.textContent = reason;
        }

        if (MP.tokenManager.hasValidSession()) {
            var user = MP.tokenManager.getUser();
            if (user && user.role && homeLink) {
                homeLink.href = MP.config.homeForRole(user.role);
                homeLink.textContent = 'Back to my dashboard';
            }
        }

        MP.dom.on(backButton, 'click', function () {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = homeLink ? homeLink.href : MP.config.ROUTES.HOME;
            }
        });
    });
})();
