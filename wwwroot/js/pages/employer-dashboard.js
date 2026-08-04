/* MatchPoint - employer dashboard */

(function () {
    'use strict';

    var bannerElement;
    var statsElement;
    var applicantsElement;
    var vacanciesElement;

    function renderBanner(dashboard) {
        bannerElement.innerHTML =
            '<section class="welcome-banner">' +
                '<div class="welcome-banner__content">' +
                    '<div>' +
                        '<h1 class="welcome-banner__title">' + MP.dom.escapeHtml(dashboard.companyName || 'Your company') + '</h1>' +
                        '<p class="welcome-banner__text">' +
                            (dashboard.openVacancies > 0
                                ? 'You have ' + dashboard.openVacancies + ' open vacanc'
                                    + (dashboard.openVacancies === 1 ? 'y' : 'ies') + ' and '
                                    + dashboard.totalApplications + ' application'
                                    + (dashboard.totalApplications === 1 ? '' : 's') + ' to review.'
                                : 'You have no open vacancies. Post one to start receiving ranked applicants.') +
                        '</p>' +
                        '<div class="welcome-banner__actions mt-4">' +
                            '<a class="btn btn--primary" href="/employer/vacancy-form.html">Post a vacancy</a>' +
                            '<a class="btn btn--secondary" href="/employer/applicants.html">Review applicants</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>';
    }

    function statCard(icon, tone, label, value, meta) {
        return '<article class="stat-card">' +
                '<span class="stat-card__icon stat-card__icon--' + tone + '">' + MP.dom.icon(icon) + '</span>' +
                '<div class="stat-card__body">' +
                    '<div class="stat-card__label">' + MP.dom.escapeHtml(label) + '</div>' +
                    '<div class="stat-card__value">' + MP.dom.escapeHtml(String(value)) + '</div>' +
                    (meta ? '<div class="stat-card__meta">' + MP.dom.escapeHtml(meta) + '</div>' : '') +
                '</div>' +
            '</article>';
    }

    function renderStats(dashboard) {
        statsElement.innerHTML =
            statCard('briefcase', 'primary', 'Open vacancies', MP.formatters.number(dashboard.openVacancies),
                MP.formatters.number(dashboard.closedVacancies) + ' closed') +
            statCard('users', 'accent', 'Total applications', MP.formatters.number(dashboard.totalApplications),
                'Across every vacancy') +
            statCard('clock', 'warning', 'Under review', MP.formatters.number(dashboard.underReview),
                'Waiting on your decision') +
            statCard('star', 'success', 'Shortlisted', MP.formatters.number(dashboard.shortlisted),
                MP.formatters.number(dashboard.contactRequests) + ' contact requests sent');
    }

    function applicantHtml(applicant) {
        return '<a class="activity-item" href="/employer/applicant-details.html?id=' + applicant.applicationId + '">' +
                MP.matchScore.ring(applicant.matchScore, 'sm') +
                '<div class="activity-item__body">' +
                    '<div class="activity-item__title">' + MP.dom.escapeHtml(applicant.candidateName) + '</div>' +
                    '<div class="activity-item__meta">' + MP.dom.escapeHtml(applicant.jobTitle)
                        + ' · applied ' + MP.formatters.relativeTime(applicant.appliedAt) + '</div>' +
                    '<div class="mt-2">' + MP.statusBadge.application(applicant.status) + '</div>' +
                '</div>' +
                '<div class="activity-item__side">' + MP.dom.icon('chevronRight', 'sidebar__icon') + '</div>' +
            '</a>';
    }

    function renderApplicants(applicants) {
        if (!applicants || applicants.length === 0) {
            MP.loader.empty(applicantsElement, {
                icon: 'users',
                title: 'No applicants yet',
                message: 'Once candidates apply to your vacancies they will appear here, ranked by match score.',
                actionLabel: 'Post a vacancy',
                actionHref: '/employer/vacancy-form.html'
            });
            return;
        }

        applicantsElement.innerHTML = '<div class="activity-list">'
            + applicants.map(applicantHtml).join('') + '</div>';
    }

    function vacancyHtml(vacancy) {
        return '<a class="activity-item" href="/employer/vacancy-details.html?id=' + vacancy.id + '">' +
                '<div class="activity-item__body">' +
                    '<div class="activity-item__title">' + MP.dom.escapeHtml(vacancy.title) + '</div>' +
                    '<div class="activity-item__meta">' + MP.dom.escapeHtml(vacancy.location)
                        + ' · posted ' + MP.formatters.relativeTime(vacancy.createdAt) + '</div>' +
                '</div>' +
                '<div class="activity-item__side">' +
                    '<span class="badge badge--primary badge--plain">' + MP.formatters.number(vacancy.applicantCount)
                        + (vacancy.applicantCount === 1 ? ' applicant' : ' applicants') + '</span>' +
                '</div>' +
            '</a>';
    }

    function renderVacancies(vacancies) {
        if (!vacancies || vacancies.length === 0) {
            MP.loader.empty(vacanciesElement, {
                icon: 'briefcase',
                title: 'No open vacancies',
                message: 'Post a vacancy to start attracting candidates that match your requirements.'
            });
            return;
        }

        vacanciesElement.innerHTML = '<div class="activity-list">'
            + vacancies.map(vacancyHtml).join('') + '</div>';
    }

    function load() {
        MP.loader.skeletonStats(statsElement, 4);
        MP.loader.skeletonRows(applicantsElement, 3);
        MP.loader.skeletonRows(vacanciesElement, 3);

        MP.employerService.getDashboard()
            .then(function (response) {
                var dashboard = response.data || {};

                renderBanner(dashboard);
                renderStats(dashboard);
                renderApplicants(dashboard.recentApplicants);
                renderVacancies(dashboard.activeVacancies);

                MP.header.setTitle('Dashboard', dashboard.companyName || 'Your hiring overview');
            })
            .catch(function (error) {
                bannerElement.innerHTML = '';
                statsElement.innerHTML = '';
                vacanciesElement.innerHTML = '';

                var message = MP.apiClient.messageOf(error, 'We could not load your dashboard.');
                MP.loader.error(applicantsElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Dashboard', subtitle: 'Your hiring overview' });

        bannerElement = document.getElementById('dashboardBanner');
        statsElement = document.getElementById('dashboardStats');
        applicantsElement = document.getElementById('recentApplicants');
        vacanciesElement = document.getElementById('activeVacancies');

        load();
    });
})();
