/* MatchPoint - session expired page */

(function () {
    'use strict';

    MP.dom.ready(function () {
        // Anything left in storage is stale by the time this page renders.
        MP.tokenManager.clear();

        var returnUrl = MP.dom.queryParam('returnUrl');
        var link = document.getElementById('signInLink');

        if (link && returnUrl && returnUrl.charAt(0) === '/' && returnUrl.indexOf('//') !== 0) {
            link.href = MP.config.ROUTES.LOGIN + '?returnUrl=' + encodeURIComponent(returnUrl);
        }
    });
})();
