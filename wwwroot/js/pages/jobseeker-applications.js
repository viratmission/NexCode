/* MatchPoint - job seeker application history */

(function () {
    'use strict';

    var statsElement;
    var tabsElement;
    var listElement;

    var allApplications = [];
    var activeStatus = 'All';

    var TABS = ['All'].concat(MP.config.APPLICATION_STATUSES);

    function countBy(status) {
        if (status === 'All') {
            return allApplications.length;
        }
        return allApplications.filter(function (application) {
            return application.status === status;
        }).length;
    }

    function renderStats() {
        var cards = [
            { label: 'Total', status: 'All', icon: 'document', tone: 'primary' },
            { label: 'Applied', status: 'Applied', icon: 'send', tone: 'info' },
            { label: 'Under review', status: 'UnderReview', icon: 'clock', tone: 'warning' },
            { label: 'Shortlisted', status: 'Shortlisted', icon: 'star', tone: 'success' },
            { label: 'Rejected', status: 'Rejected', icon: 'xCircle', tone: 'danger' }
        ];

        statsElement.innerHTML = cards.map(function (card) {
            return '<article class="stat-card">' +
                    '<span class="stat-card__icon stat-card__icon--' + card.tone + '">'
                        + MP.dom.icon(card.icon) + '</span>' +
                    '<div class="stat-card__body">' +
                        '<div class="stat-card__label">' + MP.dom.escapeHtml(card.label) + '</div>' +
                        '<div class="stat-card__value">' + countBy(card.status) + '</div>' +
                    '</div>' +
                '</article>';
        }).join('');
    }

    function renderTabs() {
        tabsElement.innerHTML = TABS.map(function (status) {
            var label = status === 'All' ? 'All applications' : MP.formatters.humanize(status);
            return '<button type="button" class="tab' + (status === activeStatus ? ' is-active' : '')
                + '" data-status="' + status + '">' + MP.dom.escapeHtml(label)
                + ' (' + countBy(status) + ')</button>';
        }).join('');

        MP.dom.qsa('[data-status]', tabsElement).forEach(function (tab) {
            MP.dom.on(tab, 'click', function () {
                activeStatus = tab.getAttribute('data-status');
                renderTabs();
                renderList();
            });
        });
    }

    function rowHtml(application) {
        return '<tr data-job-id="' + application.vacancyId + '">' +
                '<td>' +
                    '<div class="table__primary">' + MP.dom.escapeHtml(application.jobTitle) + '</div>' +
                    '<div class="table__secondary">' + MP.dom.escapeHtml(application.companyName) + '</div>' +
                '</td>' +
                '<td class="table__secondary">' + MP.dom.escapeHtml(application.location) + '</td>' +
                '<td>' + MP.matchScore.pill(application.matchScore, { showLabel: false }) + '</td>' +
                '<td>' + MP.statusBadge.application(application.status) + '</td>' +
                '<td>' +
                    '<div class="table__secondary">' + MP.formatters.date(application.appliedAt) + '</div>' +
                    '<div class="table__secondary">' + MP.formatters.relativeTime(application.appliedAt) + '</div>' +
                '</td>' +
                '<td>' +
                    '<div class="table__actions">' +
                        '<a class="btn btn--secondary btn--sm" href="/jobseeker/job-details.html?id='
                            + application.vacancyId + '">View job</a>' +
                    '</div>' +
                '</td>' +
            '</tr>';
    }

    function renderList() {
        var filtered = activeStatus === 'All'
            ? allApplications
            : allApplications.filter(function (application) {
                return application.status === activeStatus;
            });

        if (!filtered.length) {
            MP.loader.empty(listElement, {
                icon: 'document',
                title: allApplications.length === 0 ? 'No applications yet' : 'Nothing in this stage',
                message: allApplications.length === 0
                    ? 'Once you apply to a vacancy it will appear here with its live status and match score.'
                    : 'You have no applications with the status "' + MP.formatters.humanize(activeStatus) + '" right now.',
                actionLabel: allApplications.length === 0 ? 'Find jobs' : null,
                actionHref: allApplications.length === 0 ? '/jobseeker/jobs.html' : null
            });
            return;
        }

        listElement.innerHTML =
            '<div class="table-wrapper">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th>Role</th><th>Location</th><th>Match</th><th>Status</th><th>Applied</th><th></th>' +
                    '</tr></thead>' +
                    '<tbody>' + filtered.map(rowHtml).join('') + '</tbody>' +
                '</table>' +
            '</div>';
    }

    function load() {
        statsElement.innerHTML = '';
        MP.loader.skeletonRows(listElement, 5);

        MP.profileService.getApplications()
            .then(function (response) {
                allApplications = MP.apiClient.toList(response.data);

                // Newest first so the most relevant activity is on top.
                allApplications.sort(function (a, b) {
                    return new Date(b.appliedAt) - new Date(a.appliedAt);
                });

                renderStats();
                renderTabs();
                renderList();
            })
            .catch(function (error) {
                statsElement.innerHTML = '';
                tabsElement.innerHTML = '';
                var message = MP.apiClient.messageOf(error, 'We could not load your applications.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'My applications', subtitle: 'Track every application you have submitted' });

        statsElement = document.getElementById('applicationStats');
        tabsElement = document.getElementById('statusTabs');
        listElement = document.getElementById('applicationsList');

        load();
    });
})();
