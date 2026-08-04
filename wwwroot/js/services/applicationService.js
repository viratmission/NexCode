/* MatchPoint - employer application review */

window.MP = window.MP || {};

MP.applicationService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    /** Paged applicants across every vacancy owned by the signed in employer. */
    function list(filters) {
        var f = filters || {};
        return MP.apiClient.get(E.applications, {
            vacancyId: f.vacancyId,
            status: f.status,
            pageNumber: f.pageNumber || 1,
            pageSize: f.pageSize || MP.config.DEFAULT_PAGE_SIZE
        });
    }

    function getById(applicationId) {
        return MP.apiClient.get(E.applications + '/' + applicationId);
    }

    /** status: 'Applied' | 'UnderReview' | 'Shortlisted' | 'Rejected' */
    function updateStatus(applicationId, status) {
        return MP.apiClient.put(E.applications + '/' + applicationId + '/status', { status: status });
    }

    function downloadCv(applicationId, fallbackFileName) {
        return MP.apiClient.downloadAndSave(
            E.applications + '/' + applicationId + '/cv',
            fallbackFileName || 'candidate-cv.pdf'
        );
    }

    return {
        list: list,
        getById: getById,
        updateStatus: updateStatus,
        downloadCv: downloadCv
    };
})();
