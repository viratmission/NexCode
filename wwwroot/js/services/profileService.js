/* MatchPoint - job seeker profile, CV and dashboard */

window.MP = window.MP || {};

MP.profileService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    function getProfile() {
        return MP.apiClient.get(E.jobSeekerProfile);
    }

    function updateProfile(profile) {
        return MP.apiClient.put(E.jobSeekerProfile, {
            professionalTitle: profile.professionalTitle,
            location: profile.location,
            yearsOfExperience: Number(profile.yearsOfExperience) || 0,
            education: profile.education,
            about: profile.about || '',
            skills: profile.skills || []
        });
    }

    function getDashboard() {
        return MP.apiClient.get(E.jobSeekerDashboard);
    }

    function getCv() {
        return MP.apiClient.get(E.jobSeekerCv);
    }

    /** The controller binds an IFormFile named `file`, so the form field name must match. */
    function uploadCv(file) {
        var formData = new FormData();
        formData.append('file', file, file.name);
        return MP.apiClient.upload(E.jobSeekerCv, formData);
    }

    function deleteCv() {
        return MP.apiClient.del(E.jobSeekerCv);
    }

    function downloadCv(fallbackFileName) {
        return MP.apiClient.downloadAndSave(E.jobSeekerCvDownload, fallbackFileName || 'cv.pdf');
    }

    function getApplications() {
        return MP.apiClient.get(E.jobSeekerApplications);
    }

    function getContactRequests() {
        return MP.apiClient.get(E.jobSeekerContactRequests);
    }

    function respondToContactRequest(contactRequestId, status) {
        return MP.apiClient.put(E.jobSeekerContactRequests + '/' + contactRequestId, { status: status });
    }

    return {
        getProfile: getProfile,
        updateProfile: updateProfile,
        getDashboard: getDashboard,
        getCv: getCv,
        uploadCv: uploadCv,
        deleteCv: deleteCv,
        downloadCv: downloadCv,
        getApplications: getApplications,
        getContactRequests: getContactRequests,
        respondToContactRequest: respondToContactRequest
    };
})();
