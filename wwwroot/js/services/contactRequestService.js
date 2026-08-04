/* MatchPoint - contact requests (employer sends, job seeker responds) */

window.MP = window.MP || {};

MP.contactRequestService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    /** Employer view. Optional status filter: Pending | Accepted | Declined. */
    function listForEmployer(status) {
        return MP.apiClient.get(E.contactRequests, { status: status });
    }

    function getById(contactRequestId) {
        return MP.apiClient.get(E.contactRequests + '/' + contactRequestId);
    }

    /** Employer asks a candidate for permission to make contact. 409 if one already exists. */
    function createForApplication(applicationId) {
        return MP.apiClient.post(E.contactRequests + '/applications/' + applicationId);
    }

    /** Job seeker view of the requests they have received. */
    function listForJobSeeker() {
        return MP.profileService.getContactRequests();
    }

    /** status: 'Accepted' | 'Declined' */
    function respond(contactRequestId, status) {
        return MP.profileService.respondToContactRequest(contactRequestId, status);
    }

    return {
        listForEmployer: listForEmployer,
        getById: getById,
        createForApplication: createForApplication,
        listForJobSeeker: listForJobSeeker,
        respond: respond
    };
})();
