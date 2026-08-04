/* MatchPoint - top header injected into #header, with the notification bell */

window.MP = window.MP || {};

MP.header = (function () {
    'use strict';

    // Only job seekers have a dedicated notifications page; other roles get a panel.
    var NOTIFICATIONS_PAGE = {
        JobSeeker: '/jobseeker/notifications.html'
    };

    var NOTIFICATION_ICONS = {
        applicationreceived: 'document',
        applicationstatuschanged: 'refresh',
        contactrequestcreated: 'mail',
        contactrequestresponded: 'checkCircle',
        vacancyclosed: 'ban',
        general: 'bell'
    };

    var pollTimer = null;

    /**
     * Renders the header.
     * options: { title, subtitle, actions (HTML), showNotifications }
     */
    function render(options) {
        var host = document.getElementById('header');
        if (!host) {
            return;
        }

        var settings = options || {};
        var user = MP.tokenManager.getUser() || {};
        var role = user.role || '';
        var showBell = settings.showNotifications !== false;
        var notificationsPage = NOTIFICATIONS_PAGE[role];

        var bellHtml = '';
        if (showBell) {
            var bellInner = MP.dom.icon('bell')
                + '<span class="header-icon-button__dot hidden" data-unread-count></span>';

            bellHtml = notificationsPage
                ? '<a class="header-icon-button" href="' + notificationsPage
                    + '" aria-label="Notifications">' + bellInner + '</a>'
                : '<button type="button" class="header-icon-button" aria-label="Notifications" '
                    + 'data-notification-panel>' + bellInner + '</button>';
        }

        host.innerHTML =
            '<header class="app-header">' +
                '<button type="button" class="app-header__menu" data-menu-toggle aria-label="Open navigation">' +
                    MP.dom.icon('menu') +
                '</button>' +
                '<div class="app-header__titles">' +
                    '<div class="app-header__title" data-header-title>'
                        + MP.dom.escapeHtml(settings.title || document.title.replace(' · MatchPoint', '')) + '</div>' +
                    (settings.subtitle
                        ? '<div class="app-header__subtitle" data-header-subtitle>'
                            + MP.dom.escapeHtml(settings.subtitle) + '</div>'
                        : '<div class="app-header__subtitle hidden" data-header-subtitle></div>') +
                '</div>' +
                '<div class="app-header__actions">' +
                    (settings.actions || '') +
                    bellHtml +
                    '<div class="header-user">' +
                        '<div class="header-user__meta">' +
                            '<div class="header-user__name">' + MP.dom.escapeHtml(user.fullName || '—') + '</div>' +
                            '<div class="header-user__role">' + MP.dom.escapeHtml(MP.formatters.roleLabel(role)) + '</div>' +
                        '</div>' +
                        '<span class="avatar" aria-hidden="true">'
                            + MP.dom.escapeHtml(MP.formatters.initials(user.fullName)) + '</span>' +
                    '</div>' +
                '</div>' +
            '</header>';

        MP.dom.on(host.querySelector('[data-menu-toggle]'), 'click', MP.sidebar.toggleDrawer);
        MP.dom.on(host.querySelector('[data-notification-panel]'), 'click', openPanel);

        if (showBell) {
            refreshUnreadCount();
            startPolling();
        }
    }

    function notificationHtml(notification) {
        var key = String(notification.type || '').toLowerCase().replace(/[\s_-]/g, '');
        var tone = MP.statusBadge.notificationTone(notification.type);

        return '<article class="notification-item' + (notification.isRead ? '' : ' is-unread') + '">' +
                '<span class="notification-item__icon notification-item__icon--' + tone + '">'
                    + MP.dom.icon(NOTIFICATION_ICONS[key] || 'bell') + '</span>' +
                '<div class="notification-item__body">' +
                    '<div class="notification-item__title">' +
                        (notification.isRead
                            ? ''
                            : '<span class="notification-item__dot" aria-label="Unread"></span>') +
                        MP.dom.escapeHtml(notification.title) +
                    '</div>' +
                    '<p class="notification-item__message">' + MP.dom.escapeHtml(notification.message) + '</p>' +
                    '<div class="notification-item__time">'
                        + MP.formatters.relativeTime(notification.createdAt) + '</div>' +
                '</div>' +
                (notification.isRead
                    ? ''
                    : '<button type="button" class="btn btn--ghost btn--sm" data-read="'
                        + notification.id + '">Mark read</button>') +
            '</article>';
    }

    /** Notification panel for roles without a dedicated notifications page. */
    function openPanel() {
        var modalRoot = MP.modal.open({
            title: 'Notifications',
            description: 'Your most recent platform activity',
            icon: 'bell',
            tone: 'primary',
            size: 'lg',
            body: '<div id="headerNotificationList"></div>',
            buttons: [
                { label: 'Close', variant: 'secondary' },
                {
                    label: 'Mark all as read',
                    variant: 'primary',
                    closeOnClick: false,
                    onClick: function (root, button) {
                        MP.dom.setButtonLoading(button, true);

                        MP.notificationService.markAllAsRead()
                            .then(function (response) {
                                MP.toast.success(response.message || 'All notifications marked as read.');
                                setUnreadCount(0);
                                loadPanel(root);
                            })
                            .catch(function (error) {
                                MP.toast.error(MP.apiClient.messageOf(
                                    error, 'The notifications could not be updated.'));
                            })
                            .then(function () {
                                MP.dom.setButtonLoading(button, false);
                            });

                        return false;
                    }
                }
            ]
        });

        loadPanel(modalRoot);
    }

    function loadPanel(modalRoot) {
        var list = modalRoot.querySelector('#headerNotificationList');
        if (!list) {
            return;
        }

        MP.loader.spinner(list, 'Loading notifications…');

        MP.notificationService.list(false)
            .then(function (response) {
                var payload = response.data || {};
                var items = payload.items || [];

                setUnreadCount(payload.unreadCount || 0);

                if (!items.length) {
                    MP.loader.empty(list, {
                        icon: 'bell',
                        title: 'No notifications yet',
                        message: 'Activity on your account will appear here.'
                    });
                    return;
                }

                list.innerHTML = items.map(notificationHtml).join('');

                MP.dom.qsa('[data-read]', list).forEach(function (button) {
                    MP.dom.on(button, 'click', function () {
                        button.disabled = true;

                        MP.notificationService.markAsRead(button.getAttribute('data-read'))
                            .then(function () {
                                loadPanel(modalRoot);
                                refreshUnreadCount();
                            })
                            .catch(function (error) {
                                button.disabled = false;
                                MP.toast.error(MP.apiClient.messageOf(
                                    error, 'The notification could not be updated.'));
                            });
                    });
                });
            })
            .catch(function (error) {
                MP.loader.error(list, MP.apiClient.messageOf(error, 'We could not load your notifications.'),
                    function () { loadPanel(modalRoot); });
            });
    }

    function setTitle(title, subtitle) {
        var titleElement = document.querySelector('[data-header-title]');
        var subtitleElement = document.querySelector('[data-header-subtitle]');

        if (titleElement && title) {
            titleElement.textContent = title;
        }

        if (subtitleElement) {
            if (subtitle) {
                subtitleElement.textContent = subtitle;
                subtitleElement.classList.remove('hidden');
            } else {
                subtitleElement.classList.add('hidden');
            }
        }
    }

    function setUnreadCount(count) {
        var badge = document.querySelector('[data-unread-count]');
        var value = Number(count) || 0;

        if (badge) {
            if (value > 0) {
                badge.textContent = value > 99 ? '99+' : String(value);
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        MP.sidebar.setUnreadCount(value);
    }

    /** Silently refreshes the bell; failures must never interrupt the page. */
    function refreshUnreadCount() {
        return MP.notificationService.unreadCount()
            .then(function (response) {
                setUnreadCount(response.data);
                return response.data;
            })
            .catch(function () {
                return 0;
            });
    }

    function startPolling() {
        stopPolling();
        pollTimer = window.setInterval(function () {
            if (!document.hidden) {
                refreshUnreadCount();
            }
        }, 60000);
    }

    function stopPolling() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    return {
        render: render,
        setTitle: setTitle,
        setUnreadCount: setUnreadCount,
        refreshUnreadCount: refreshUnreadCount,
        stopPolling: stopPolling
    };
})();
