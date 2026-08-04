/* MatchPoint - job seeker dashboard */

(function () {
    'use strict';

    var bannerElement;
    var statsElement;
    var recommendedElement;
    var recentElement;

    function renderBanner(dashboard) {
        var completion = MP.matchScore.normalize(dashboard.profileCompletionPercent);
        var isComplete = completion >= 100;

        bannerElement.innerHTML =
            '<section class="welcome-banner">' +
                '<div class="welcome-banner__content">' +
                    '<div>' +
                        '<h1 class="welcome-banner__title">Welcome back, '
                            + MP.dom.escapeHtml((dashboard.fullName || '').split(' ')[0] || 'there') + '</h1>' +
                        '<p class="welcome-banner__text">' +
                            (isComplete
                                ? 'Your profile is complete. Keep an eye on your recommendations below.'
                                : 'Complete your profile to unlock more accurate matches and better recommendations.') +
                        '</p>' +
                        '<div class="welcome-banner__actions mt-4">' +
                            '<a class="btn btn--primary" href="/jobseeker/jobs.html">Find jobs</a>' +
                            (isComplete
                                ? ''
                                : '<a class="btn btn--secondary" href="/jobseeker/profile.html">Complete profile</a>') +
                        '</div>' +
                    '</div>' +
                    '<div class="completion-widget">' +
                        '<div class="completion-widget__head">' +
                            '<span class="completion-widget__label">Profile completion</span>' +
                            '<span class="completion-widget__value">' + completion + '%</span>' +
                        '</div>' +
                        '<div class="progress"><div class="progress__bar" style="width:' + completion + '%"></div></div>' +
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
        var bestMatch = dashboard.bestMatchScore === null || dashboard.bestMatchScore === undefined
            ? '—'
            : dashboard.bestMatchScore + '%';

        statsElement.innerHTML =
            statCard('sparkles', 'primary', 'Skills on profile', MP.formatters.number(dashboard.skillCount),
                dashboard.skillCount === 0 ? 'Add skills to start matching' : 'Used for every match') +
            statCard('briefcase', 'accent', 'Matching open jobs', MP.formatters.number(dashboard.openMatchingJobs),
                'Vacancies you are eligible for') +
            statCard('document', 'info', 'Applications sent', MP.formatters.number(dashboard.applicationCount),
                'Across all employers') +
            statCard('target', 'success', 'Best match score', bestMatch,
                dashboard.bestMatchScore ? MP.matchScore.tierLabel(dashboard.bestMatchScore) : 'No matches yet');
    }

    function recommendedJobHtml(job) {
        var missing = Number(job.missingSkillsCount) || 0;

        return '<a class="activity-item" href="/jobseeker/job-details.html?id=' + job.id + '">' +
                MP.matchScore.ring(job.matchScore, 'sm') +
                '<div class="activity-item__body">' +
                    '<div class="activity-item__title">' + MP.dom.escapeHtml(job.title) + '</div>' +
                    '<div class="activity-item__meta">' + MP.dom.escapeHtml(job.companyName)
                        + ' · ' + MP.dom.escapeHtml(job.location) + '</div>' +
                    '<div class="mt-2">' +
                        (missing === 0
                            ? '<span class="badge badge--success">All skills matched</span>'
                            : '<span class="badge badge--warning">' + missing + ' skill'
                                + (missing === 1 ? '' : 's') + ' missing</span>') +
                    '</div>' +
                '</div>' +
                '<div class="activity-item__side">' + MP.dom.icon('chevronRight', 'sidebar__icon') + '</div>' +
            '</a>';
    }

    function renderRecommended(jobs) {
        if (!jobs || jobs.length === 0) {
            MP.loader.empty(recommendedElement, {
                icon: 'search',
                title: 'No recommendations yet',
                message: 'Add your skills, experience and location to your profile so we can match you with open vacancies.',
                actionLabel: 'Complete my profile',
                actionHref: '/jobseeker/profile.html'
            });
            return;
        }

        recommendedElement.innerHTML = '<div class="activity-list">'
            + jobs.map(recommendedJobHtml).join('') + '</div>';
    }

    function recentApplicationHtml(application) {
        return '<div class="activity-item">' +
                '<div class="activity-item__body">' +
                    '<div class="activity-item__title">' + MP.dom.escapeHtml(application.jobTitle) + '</div>' +
                    '<div class="activity-item__meta">' + MP.dom.escapeHtml(application.companyName)
                        + ' · ' + MP.formatters.relativeTime(application.appliedAt) + '</div>' +
                    '<div class="mt-2 flex items-center gap-2 flex-wrap">' +
                        MP.statusBadge.application(application.status) +
                        MP.matchScore.pill(application.matchScore, { showLabel: false }) +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function renderRecent(applications) {
        if (!applications || applications.length === 0) {
            MP.loader.empty(recentElement, {
                icon: 'document',
                title: 'No applications yet',
                message: 'When you apply to a vacancy it will appear here so you can track its progress.',
                actionLabel: 'Find jobs',
                actionHref: '/jobseeker/jobs.html'
            });
            return;
        }

        recentElement.innerHTML = '<div class="activity-list">'
            + applications.map(recentApplicationHtml).join('') + '</div>';
    }

    function load() {
        MP.loader.skeletonStats(statsElement, 4);
        MP.loader.skeletonRows(recommendedElement, 3);
        MP.loader.skeletonRows(recentElement, 3);

        MP.profileService.getDashboard()
            .then(function (response) {
                var dashboard = response.data || {};

                renderBanner(dashboard);
                renderStats(dashboard);
                renderRecommended(dashboard.recommendedJobs);
                renderRecent(dashboard.recentApplications);

                MP.header.setTitle('Dashboard', 'Your matches and applications at a glance');
            })
            .catch(function (error) {
                bannerElement.innerHTML = '';
                statsElement.innerHTML = '';
                recentElement.innerHTML = '';

                var message = MP.apiClient.messageOf(error, 'We could not load your dashboard.');
                MP.loader.error(recommendedElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Dashboard', subtitle: 'Your matches and applications at a glance' });

        bannerElement = document.getElementById('dashboardBanner');
        statsElement = document.getElementById('dashboardStats');
        recommendedElement = document.getElementById('recommendedJobs');
        recentElement = document.getElementById('recentApplications');

        load();
    });
})();
