/* MatchPoint - notification feed */

(function () {
    'use strict';

    var listElement;
    var summaryElement;
    var markAllButton;

    var notifications = [];
    var unreadCount = 0;
    var filter = 'all';

    var TYPE_ICONS = {
        applicationreceived: 'document',
        applicationstatuschanged: 'refresh',
        contactrequestcreated: 'mail',
        contactrequestresponded: 'checkCircle',
        vacancyclosed: 'ban',
        general: 'bell'
    };

    function typeKey(type) {
        return String(type || '').toLowerCase().replace(/[\s_-]/g, '');
    }

    function itemHtml(notification) {
        var key = typeKey(notification.type);
        var tone = MP.statusBadge.notificationTone(notification.type);

        return '<article class="notification-item' + (notification.isRead ? '' : ' is-unread') + '" '
                + 'data-notification="' + notification.id + '">' +
                '<span class="notification-item__icon notification-item__icon--' + tone + '">'
                    + MP.dom.icon(TYPE_ICONS[key] || 'bell') + '</span>' +
                '<div class="notification-item__body">' +
                    '<div class="notification-item__title">' +
                        (notification.isRead ? '' : '<span class="notification-item__dot" aria-label="Unread"></span>') +
                        MP.dom.escapeHtml(notification.title) +
                    '</div>' +
                    '<p class="notification-item__message">' + MP.dom.escapeHtml(notification.message) + '</p>' +
                    '<div class="notification-item__time">' + MP.formatters.relativeTime(notification.createdAt)
                        + ' · ' + MP.formatters.dateTime(notification.createdAt) + '</div>' +
                '</div>' +
                (notification.isRead
                    ? ''
                    : '<button type="button" class="btn btn--ghost btn--sm" data-mark-read="' + notification.id
                        + '">Mark read</button>') +
            '</article>';
    }

    function renderSummary() {
        if (summaryElement) {
            summaryElement.textContent = unreadCount > 0
                ? unreadCount + ' unread notification' + (unreadCount === 1 ? '' : 's')
                : 'You are all caught up.';
        }

        if (markAllButton) {
            markAllButton.disabled = unreadCount === 0;
        }

        MP.header.setUnreadCount(unreadCount);
    }

    function renderList() {
        var filtered = filter === 'unread'
            ? notifications.filter(function (item) { return !item.isRead; })
            : notifications;

        if (!filtered.length) {
            MP.loader.empty(listElement, {
                icon: 'bell',
                title: filter === 'unread' ? 'No unread notifications' : 'No notifications yet',
                message: filter === 'unread'
                    ? 'Everything has been read. New updates will appear here as they happen.'
                    : 'Application updates, contact requests and status changes will show up here.'
            });
            return;
        }

        listElement.innerHTML = filtered.map(itemHtml).join('');

        MP.dom.qsa('[data-mark-read]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function (event) {
                event.stopPropagation();
                markAsRead(parseInt(button.getAttribute('data-mark-read'), 10));
            });
        });
    }

    function markAsRead(id) {
        MP.notificationService.markAsRead(id)
            .then(function () {
                notifications = notifications.map(function (item) {
                    return item.id === id ? Object.assign({}, item, { isRead: true }) : item;
                });
                unreadCount = Math.max(0, unreadCount - 1);
                renderSummary();
                renderList();
            })
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'The notification could not be updated.'));
            });
    }

    function markAllAsRead() {
        if (unreadCount === 0) {
            return;
        }

        MP.dom.setButtonLoading(markAllButton, true);

        MP.notificationService.markAllAsRead()
            .then(function (response) {
                notifications = notifications.map(function (item) {
                    return Object.assign({}, item, { isRead: true });
                });
                unreadCount = 0;
                renderSummary();
                renderList();
                MP.toast.success(response.message || 'All notifications marked as read.');
            })
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'The notifications could not be updated.'));
            })
            .then(function () {
                MP.dom.setButtonLoading(markAllButton, false);
                if (markAllButton) {
                    markAllButton.disabled = unreadCount === 0;
                }
            });
    }

    function load() {
        MP.loader.skeletonRows(listElement, 5);

        MP.notificationService.list(false)
            .then(function (response) {
                var payload = response.data || {};
                notifications = Array.isArray(payload.items) ? payload.items : [];
                unreadCount = Number(payload.unreadCount) || 0;

                renderSummary();
                renderList();
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load your notifications.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Notifications', subtitle: 'Everything that happened on your account' });

        listElement = document.getElementById('notificationList');
        summaryElement = document.getElementById('notificationSummary');
        markAllButton = document.getElementById('markAllRead');

        MP.dom.on(markAllButton, 'click', markAllAsRead);

        MP.dom.qsa('[data-filter]').forEach(function (tab) {
            MP.dom.on(tab, 'click', function () {
                filter = tab.getAttribute('data-filter');
                MP.dom.qsa('[data-filter]').forEach(function (other) {
                    other.classList.toggle('is-active', other === tab);
                });
                renderList();
            });
        });

        load();
    });
})();
