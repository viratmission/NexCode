/* MatchPoint - role aware sidebar navigation injected into #sidebar */

window.MP = window.MP || {};

MP.sidebar = (function () {
    'use strict';

    var MENUS = {
        JobSeeker: [
            { label: 'Dashboard', href: '/jobseeker/dashboard.html', icon: 'dashboard' },
            { label: 'Find Jobs', href: '/jobseeker/jobs.html', icon: 'search', match: ['/jobseeker/jobs.html', '/jobseeker/job-details.html'] },
            { label: 'My Applications', href: '/jobseeker/applications.html', icon: 'document' },
            { label: 'My Profile', href: '/jobseeker/profile.html', icon: 'user' },
            { label: 'Contact Requests', href: '/jobseeker/contact-requests.html', icon: 'mail' },
            { label: 'Notifications', href: '/jobseeker/notifications.html', icon: 'bell', badge: 'notifications' }
        ],
        Employer: [
            { label: 'Dashboard', href: '/employer/dashboard.html', icon: 'dashboard' },
            {
                label: 'Vacancies',
                href: '/employer/vacancies.html',
                icon: 'briefcase',
                match: ['/employer/vacancies.html', '/employer/vacancy-form.html', '/employer/vacancy-details.html']
            },
            {
                label: 'Applicants',
                href: '/employer/applicants.html',
                icon: 'users',
                match: ['/employer/applicants.html', '/employer/applicant-details.html']
            },
            { label: 'Company Profile', href: '/employer/company-profile.html', icon: 'building' },
            { label: 'Contact Requests', href: '/employer/contact-requests.html', icon: 'mail' }
        ],
        Administrator: [
            { label: 'Dashboard', href: '/admin/dashboard.html', icon: 'dashboard' },
            {
                label: 'User Accounts',
                href: '/admin/users.html',
                icon: 'users',
                match: ['/admin/users.html', '/admin/user-details.html']
            },
            { label: 'Settings', href: '/admin/settings.html', icon: 'settings' }
        ]
    };

    function isActive(item, path) {
        var targets = item.match || [item.href];
        return targets.indexOf(path) !== -1;
    }

    function linkHtml(item, path) {
        var active = isActive(item, path);
        return '<a class="sidebar__link' + (active ? ' is-active' : '') + '" href="' + item.href + '"'
            + (active ? ' aria-current="page"' : '') + '>'
            + MP.dom.icon(item.icon, 'sidebar__icon')
            + '<span>' + MP.dom.escapeHtml(item.label) + '</span>'
            + (item.badge === 'notifications'
                ? '<span class="sidebar__badge hidden" data-sidebar-unread></span>'
                : '')
            + '</a>';
    }

    function render() {
        var host = document.getElementById('sidebar');
        if (!host) {
            return;
        }

        var user = MP.tokenManager.getUser() || {};
        var role = user.role || '';
        var items = MENUS[role] || [];
        var path = window.location.pathname;

        host.innerHTML =
            '<aside class="sidebar" id="appSidebar">' +
                '<div class="sidebar__brand">' +
                    '<span class="sidebar__logo" aria-hidden="true">M</span>' +
                    '<span class="sidebar__brand-text">' +
                        '<span class="sidebar__brand-name">MatchPoint</span>' +
                        '<span class="sidebar__brand-role">' + MP.dom.escapeHtml(MP.formatters.roleLabel(role)) + '</span>' +
                    '</span>' +
                '</div>' +
                '<nav class="sidebar__nav" aria-label="Main navigation">' +
                    items.map(function (item) { return linkHtml(item, path); }).join('') +
                '</nav>' +
                '<div class="sidebar__footer">' +
                    '<div class="sidebar__user">' +
                        '<span class="avatar avatar--sm" aria-hidden="true">'
                            + MP.dom.escapeHtml(MP.formatters.initials(user.fullName)) + '</span>' +
                        '<span class="sidebar__user-info">' +
                            '<span class="sidebar__user-name">' + MP.dom.escapeHtml(user.fullName || 'Signed in') + '</span>' +
                            '<span class="sidebar__user-email">' + MP.dom.escapeHtml(user.email || '') + '</span>' +
                        '</span>' +
                    '</div>' +
                    '<button type="button" class="sidebar__logout" data-logout>' +
                        MP.dom.icon('logout', 'sidebar__icon') +
                        '<span>Logout</span>' +
                    '</button>' +
                '</div>' +
            '</aside>' +
            '<div class="sidebar-backdrop" data-sidebar-backdrop aria-hidden="true"></div>';

        MP.dom.on(host.querySelector('[data-logout]'), 'click', confirmLogout);
        MP.dom.on(host.querySelector('[data-sidebar-backdrop]'), 'click', closeDrawer);

        // Tapping a link on mobile should dismiss the drawer.
        MP.dom.qsa('.sidebar__link', host).forEach(function (link) {
            MP.dom.on(link, 'click', closeDrawer);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeDrawer();
            }
        });
    }

    function confirmLogout() {
        MP.modal.confirm({
            title: 'Sign out of MatchPoint?',
            message: 'You will need to sign in again to access your account.',
            icon: 'logout',
            tone: 'danger',
            confirmLabel: 'Sign out',
            confirmVariant: 'danger',
            onConfirm: function () {
                MP.authService.logout();
            }
        });
    }

    function openDrawer() {
        document.body.classList.add('sidebar-open');
    }

    function closeDrawer() {
        document.body.classList.remove('sidebar-open');
    }

    function toggleDrawer() {
        document.body.classList.toggle('sidebar-open');
    }

    /** Mirrors the header's unread count onto the Notifications nav item. */
    function setUnreadCount(count) {
        var badge = document.querySelector('[data-sidebar-unread]');
        if (!badge) {
            return;
        }
        var value = Number(count) || 0;
        if (value > 0) {
            badge.textContent = value > 99 ? '99+' : String(value);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    return {
        render: render,
        openDrawer: openDrawer,
        closeDrawer: closeDrawer,
        toggleDrawer: toggleDrawer,
        setUnreadCount: setUnreadCount,
        MENUS: MENUS
    };
})();
