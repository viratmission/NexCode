/* MatchPoint - in-app notifications for any authenticated user */

window.MP = window.MP || {};

MP.notificationService = (function () {
    'use strict';

    var E = MP.config.ENDPOINTS;

    /** All methods resolve with the API envelope: { status, success, message, data }. */

    /** data: { items: NotificationDto[], unreadCount: number } */
    function list(unreadOnly) {
        return MP.apiClient.get(E.notifications, { unreadOnly: unreadOnly ? 'true' : null });
    }

    function unreadCount() {
        return MP.apiClient.get(E.notificationsUnreadCount);
    }

    function markAsRead(notificationId) {
        return MP.apiClient.put(E.notifications + '/' + notificationId + '/read');
    }

    function markAllAsRead() {
        return MP.apiClient.put(E.notificationsReadAll);
    }

    return {
        list: list,
        unreadCount: unreadCount,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead
    };
})();
