/* MatchPoint - administrator dashboard, user accounts and application settings */

window.MP = window.MP || {};

MP.adminService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    function getDashboard() {
        return MP.apiClient.get(E.adminDashboard);
    }

    /** filters: { search, role, isActive, pageNumber, pageSize } */
    function getUsers(filters) {
        var f = filters || {};
        return MP.apiClient.get(E.adminUsers, {
            search: f.search,
            role: f.role,
            isActive: f.isActive === null || f.isActive === undefined || f.isActive === '' ? null : f.isActive,
            pageNumber: f.pageNumber || 1,
            pageSize: f.pageSize || MP.config.DEFAULT_PAGE_SIZE
        });
    }

    function getUser(userId) {
        return MP.apiClient.get(E.adminUsers + '/' + userId);
    }

    /** The API rejects an administrator disabling their own account with a 409. */
    function updateUserStatus(userId, isActive) {
        return MP.apiClient.put(E.adminUsers + '/' + userId + '/status', { isActive: Boolean(isActive) });
    }

    function getSettings() {
        return MP.apiClient.get(E.adminSettings);
    }

    function updateSettings(settings) {
        return MP.apiClient.put(E.adminSettings, {
            applicationName: settings.applicationName,
            defaultPageSize: Number(settings.defaultPageSize) || 10,
            maintenanceMessage: settings.maintenanceMessage || ''
        });
    }

    return {
        getDashboard: getDashboard,
        getUsers: getUsers,
        getUser: getUser,
        updateUserStatus: updateUserStatus,
        getSettings: getSettings,
        updateSettings: updateSettings
    };
})();
