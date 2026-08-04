/* MatchPoint - administrator dashboard */

(function () {
    'use strict';

    var bannerElement;
    var userStatsElement;
    var activityStatsElement;
    var compositionElement;
    var vacancyElement;

    function statCard(icon, tone, label, value, meta, href) {
        var inner =
            '<span class="stat-card__icon stat-card__icon--' + tone + '">' + MP.dom.icon(icon) + '</span>' +
            '<div class="stat-card__body">' +
                '<div class="stat-card__label">' + MP.dom.escapeHtml(label) + '</div>' +
                '<div class="stat-card__value">' + MP.dom.escapeHtml(String(value)) + '</div>' +
                (meta ? '<div class="stat-card__meta">' + MP.dom.escapeHtml(meta) + '</div>' : '') +
            '</div>';

        return href
            ? '<a class="stat-card" href="' + href + '">' + inner + '</a>'
            : '<article class="stat-card">' + inner + '</article>';
    }

    function renderBanner(dashboard) {
        var disabledShare = dashboard.totalUsers > 0
            ? Math.round((dashboard.disabledUsers / dashboard.totalUsers) * 100)
            : 0;

        bannerElement.innerHTML =
            '<section class="welcome-banner">' +
                '<div class="welcome-banner__content">' +
                    '<div>' +
                        '<h1 class="welcome-banner__title">Platform overview</h1>' +
                        '<p class="welcome-banner__text">' +
                            MP.formatters.number(dashboard.totalUsers) + ' registered account'
                            + (dashboard.totalUsers === 1 ? '' : 's') + ', '
                            + MP.formatters.number(dashboard.openVacancies) + ' open vacanc'
                            + (dashboard.openVacancies === 1 ? 'y' : 'ies') + ' and '
                            + MP.formatters.number(dashboard.totalApplications) + ' application'
                            + (dashboard.totalApplications === 1 ? '' : 's') + ' in total.' +
                        '</p>' +
                        '<div class="welcome-banner__actions mt-4">' +
                            '<a class="btn btn--primary" href="/admin/users.html">Manage user accounts</a>' +
                            '<a class="btn btn--secondary" href="/admin/settings.html">Application settings</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="completion-widget">' +
                        '<div class="completion-widget__head">' +
                            '<span class="completion-widget__label">Disabled accounts</span>' +
                            '<span class="completion-widget__value">' + disabledShare + '%</span>' +
                        '</div>' +
                        '<div class="progress"><div class="progress__bar" style="width:'
                            + disabledShare + '%"></div></div>' +
                    '</div>' +
                '</div>' +
            '</section>';
    }

    function renderStats(dashboard) {
        userStatsElement.innerHTML =
            statCard('users', 'primary', 'Total users', MP.formatters.number(dashboard.totalUsers),
                'All roles', '/admin/users.html') +
            statCard('user', 'info', 'Job seekers', MP.formatters.number(dashboard.jobSeekers),
                null, '/admin/users.html?role=JobSeeker') +
            statCard('building', 'accent', 'Employers', MP.formatters.number(dashboard.employers),
                null, '/admin/users.html?role=Employer') +
            statCard('checkCircle', 'success', 'Active', MP.formatters.number(dashboard.activeUsers),
                null, '/admin/users.html?isActive=true') +
            statCard('ban', 'danger', 'Disabled', MP.formatters.number(dashboard.disabledUsers),
                null, '/admin/users.html?isActive=false');

        activityStatsElement.innerHTML =
            statCard('briefcase', 'primary', 'Total vacancies', MP.formatters.number(dashboard.totalVacancies)) +
            statCard('trendUp', 'success', 'Open vacancies', MP.formatters.number(dashboard.openVacancies)) +
            statCard('ban', 'neutral', 'Closed vacancies', MP.formatters.number(dashboard.closedVacancies)) +
            statCard('document', 'accent', 'Applications', MP.formatters.number(dashboard.totalApplications));
    }

    function barRow(label, value, total, modifier) {
        var percent = total > 0 ? Math.round((value / total) * 100) : 0;

        return '<div class="match-metric">' +
                '<div class="match-metric__head">' +
                    '<span class="match-metric__label">' + MP.dom.escapeHtml(label) + '</span>' +
                    '<span class="match-metric__value">' + MP.formatters.number(value)
                        + ' · ' + percent + '%</span>' +
                '</div>' +
                '<div class="progress"><div class="progress__bar' + (modifier ? ' progress__bar--' + modifier : '')
                    + '" style="width:' + percent + '%"></div></div>' +
            '</div>';
    }

    function renderPanels(dashboard) {
        var administrators = Math.max(0,
            dashboard.totalUsers - dashboard.jobSeekers - dashboard.employers);

        compositionElement.innerHTML =
            '<div class="match-breakdown">' +
                barRow('Job seekers', dashboard.jobSeekers, dashboard.totalUsers, '') +
                barRow('Employers', dashboard.employers, dashboard.totalUsers, 'accent') +
                barRow('Administrators', administrators, dashboard.totalUsers, 'warning') +
                '<div class="divider" style="margin:4px 0"></div>' +
                barRow('Active accounts', dashboard.activeUsers, dashboard.totalUsers, 'success') +
                barRow('Disabled accounts', dashboard.disabledUsers, dashboard.totalUsers, 'danger') +
            '</div>';

        var applicationsPerVacancy = dashboard.totalVacancies > 0
            ? (dashboard.totalApplications / dashboard.totalVacancies).toFixed(1)
            : '0';

        vacancyElement.innerHTML =
            '<div class="match-breakdown">' +
                barRow('Open', dashboard.openVacancies, dashboard.totalVacancies, 'success') +
                barRow('Closed', dashboard.closedVacancies, dashboard.totalVacancies, '') +
            '</div>' +
            '<div class="divider"></div>' +
            '<div class="detail-list detail-list--2">' +
                '<div class="detail-item">' +
                    '<div class="detail-item__label">Applications per vacancy</div>' +
                    '<div class="detail-item__value fw-semibold">' + applicationsPerVacancy + '</div>' +
                '</div>' +
                '<div class="detail-item">' +
                    '<div class="detail-item__label">Employers per vacancy</div>' +
                    '<div class="detail-item__value fw-semibold">' +
                        (dashboard.employers > 0
                            ? (dashboard.totalVacancies / dashboard.employers).toFixed(1)
                            : '0') +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function load() {
        MP.loader.skeletonStats(userStatsElement, 5);
        MP.loader.skeletonStats(activityStatsElement, 4);
        MP.loader.spinner(compositionElement);
        MP.loader.spinner(vacancyElement);

        MP.adminService.getDashboard()
            .then(function (response) {
                var dashboard = response.data || {};
                renderBanner(dashboard);
                renderStats(dashboard);
                renderPanels(dashboard);
            })
            .catch(function (error) {
                bannerElement.innerHTML = '';
                userStatsElement.innerHTML = '';
                activityStatsElement.innerHTML = '';
                vacancyElement.innerHTML = '';

                var message = MP.apiClient.messageOf(error, 'We could not load the platform overview.');
                MP.loader.error(compositionElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.ADMINISTRATOR)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Dashboard', subtitle: 'Platform wide statistics' });

        bannerElement = document.getElementById('dashboardBanner');
        userStatsElement = document.getElementById('userStats');
        activityStatsElement = document.getElementById('activityStats');
        compositionElement = document.getElementById('compositionPanel');
        vacancyElement = document.getElementById('vacancyPanel');

        load();
    });
})();
