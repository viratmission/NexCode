/* MatchPoint - vacancy search, vacancy management and job applications */

window.MP = window.MP || {};

MP.jobService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    /** Open vacancy search. Job seekers additionally receive a match score per result. */
    function search(filters) {
        var f = filters || {};
        return MP.apiClient.get(E.jobs, {
            search: f.search,
            location: f.location,
            minimumMatch: f.minimumMatch,
            minimumExperience: f.minimumExperience,
            pageNumber: f.pageNumber || 1,
            pageSize: f.pageSize || MP.config.DEFAULT_PAGE_SIZE
        });
    }

    /** Job details. For job seekers the payload is { job, matchResult, alreadyApplied }. */
    function getById(vacancyId) {
        return MP.apiClient.get(E.jobs + '/' + vacancyId);
    }

    function getMine(filters) {
        var f = filters || {};
        return MP.apiClient.get(E.myJobs, {
            search: f.search,
            location: f.location,
            pageNumber: f.pageNumber || 1,
            pageSize: f.pageSize || MP.config.DEFAULT_PAGE_SIZE
        });
    }

    function getMyVacancy(vacancyId) {
        return MP.apiClient.get(E.myJobs + '/' + vacancyId);
    }

    function create(vacancy) {
        return MP.apiClient.post(E.jobs, toPayload(vacancy));
    }

    function update(vacancyId, vacancy) {
        return MP.apiClient.put(E.jobs + '/' + vacancyId, toPayload(vacancy));
    }

    function close(vacancyId) {
        return MP.apiClient.patch(E.jobs + '/' + vacancyId + '/close');
    }

    function reopen(vacancyId) {
        return MP.apiClient.patch(E.jobs + '/' + vacancyId + '/reopen');
    }

    function remove(vacancyId) {
        return MP.apiClient.del(E.jobs + '/' + vacancyId);
    }

    /** Applicants for one vacancy, already ranked by the API. */
    function getApplicants(vacancyId) {
        return MP.apiClient.get(E.jobs + '/' + vacancyId + '/applicants');
    }

    /** Job seeker applies. A 409 means they have already applied to this vacancy. */
    function apply(jobId) {
        return MP.apiClient.post(E.jobs + '/' + jobId + '/applications');
    }

    function toPayload(vacancy) {
        return {
            title: vacancy.title,
            description: vacancy.description,
            location: vacancy.location,
            requiredExperience: Number(vacancy.requiredExperience) || 0,
            educationRequirement: vacancy.educationRequirement || '',
            requiredSkills: vacancy.requiredSkills || []
        };
    }

    return {
        search: search,
        getById: getById,
        getMine: getMine,
        getMyVacancy: getMyVacancy,
        create: create,
        update: update,
        close: close,
        reopen: reopen,
        remove: remove,
        getApplicants: getApplicants,
        apply: apply
    };
})();
