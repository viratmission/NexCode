/* MatchPoint - landing page: routes signed in visitors to their role home */

(function () {
    'use strict';

    function renderSignedInActions(user) {
        var home = MP.config.homeForRole(user.role);

        var navActions = document.getElementById('navActions');
        if (navActions) {
            navActions.innerHTML =
                '<span class="text-sm text-secondary">Signed in as <strong>'
                    + MP.dom.escapeHtml(user.fullName) + '</strong></span>' +
                '<a class="btn btn--primary" href="' + home + '">Go to dashboard</a>';
        }

        var heroActions = document.getElementById('heroActions');
        if (heroActions) {
            heroActions.innerHTML =
                '<a class="btn btn--primary btn--lg" href="' + home + '">Open my '
                    + MP.dom.escapeHtml(MP.formatters.roleLabel(user.role).toLowerCase()) + ' dashboard</a>' +
                '<button type="button" class="btn btn--secondary btn--lg" id="signOutButton">Sign out</button>';

            MP.dom.on(document.getElementById('signOutButton'), 'click', function () {
                MP.authService.logout(false);
                window.location.reload();
            });
        }
    }

    MP.dom.ready(function () {
        var yearElement = document.getElementById('year');
        if (yearElement) {
            yearElement.textContent = String(new Date().getFullYear());
        }

        if (!MP.tokenManager.hasValidSession()) {
            // A stale token should not leave the visitor in a half signed in state.
            if (MP.tokenManager.getToken()) {
                MP.tokenManager.clear();
            }
            return;
        }

        var user = MP.tokenManager.getUser();
        if (!user || !user.role) {
            MP.tokenManager.clear();
            return;
        }

        // Send authenticated visitors straight to their workspace.
        window.location.replace(MP.config.homeForRole(user.role));

        // If the redirect is blocked, at least surface the correct entry points.
        renderSignedInActions(user);
    });
})();
