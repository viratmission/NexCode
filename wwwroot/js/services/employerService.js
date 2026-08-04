/* MatchPoint - employer company profile and dashboard */

window.MP = window.MP || {};

MP.employerService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    function getProfile() {
        return MP.apiClient.get(E.employerProfile);
    }

    function updateProfile(profile) {
        return MP.apiClient.put(E.employerProfile, {
            companyName: profile.companyName,
            industry: profile.industry,
            location: profile.location,
            description: profile.description || ''
        });
    }

    function getDashboard() {
        return MP.apiClient.get(E.employerDashboard);
    }

    return {
        getProfile: getProfile,
        updateProfile: updateProfile,
        getDashboard: getDashboard
    };
})();
