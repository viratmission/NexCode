/* MatchPoint - employer view of contact requests they have sent */

(function () {
    'use strict';

    var statsElement;
    var tabsElement;
    var listElement;

    var requests = [];
    var activeStatus = 'All';

    var TABS = ['All'].concat(MP.config.CONTACT_REQUEST_STATUSES);

    function countBy(status) {
        if (status === 'All') {
            return requests.length;
        }
        return requests.filter(function (request) { return request.status === status; }).length;
    }

    function renderStats() {
        var cards = [
            { label: 'Awaiting response', status: 'Pending', icon: 'clock', tone: 'warning' },
            { label: 'Accepted', status: 'Accepted', icon: 'checkCircle', tone: 'success' },
            { label: 'Declined', status: 'Declined', icon: 'xCircle', tone: 'danger' }
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
            var label = status === 'All' ? 'All requests' : status;
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

    function rowHtml(request) {
        return '<tr>' +
                '<td>' +
                    '<div class="flex items-center gap-3">' +
                        '<span class="avatar avatar--sm" aria-hidden="true">'
                            + MP.dom.escapeHtml(MP.formatters.initials(request.jobSeekerName)) + '</span>' +
                        '<div>' +
                            '<div class="table__primary">' + MP.dom.escapeHtml(request.jobSeekerName) + '</div>' +
                            '<div class="table__secondary">Candidate</div>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td class="table__secondary">' + MP.dom.escapeHtml(request.vacancyTitle) + '</td>' +
                '<td>' + MP.statusBadge.contactRequest(request.status) + '</td>' +
                '<td>' +
                    '<div class="table__secondary">' + MP.formatters.date(request.createdAt) + '</div>' +
                    '<div class="table__secondary">' + MP.formatters.relativeTime(request.createdAt) + '</div>' +
                '</td>' +
                '<td class="table__secondary">' +
                    (request.respondedAt ? MP.formatters.relativeTime(request.respondedAt) : 'Awaiting response') +
                '</td>' +
                '<td>' +
                    '<div class="table__actions">' +
                        '<a class="btn btn--secondary btn--sm" href="/employer/vacancy-details.html?id='
                            + request.vacancyId + '">View vacancy</a>' +
                    '</div>' +
                '</td>' +
            '</tr>';
    }

    function renderList() {
        var filtered = activeStatus === 'All'
            ? requests
            : requests.filter(function (request) { return request.status === activeStatus; });

        if (!filtered.length) {
            MP.loader.empty(listElement, {
                icon: 'mail',
                title: requests.length === 0 ? 'No contact requests sent' : 'Nothing in this view',
                message: requests.length === 0
                    ? 'Open a shortlisted applicant and request permission to contact them directly.'
                    : 'You have no ' + activeStatus.toLowerCase() + ' contact requests.',
                actionLabel: requests.length === 0 ? 'Review applicants' : null,
                actionHref: requests.length === 0 ? '/employer/applicants.html' : null
            });
            return;
        }

        listElement.innerHTML =
            '<div class="table-wrapper">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th>Candidate</th><th>Vacancy</th><th>Status</th><th>Requested</th>' +
                        '<th>Responded</th><th></th>' +
                    '</tr></thead>' +
                    '<tbody>' + filtered.map(rowHtml).join('') + '</tbody>' +
                '</table>' +
            '</div>';
    }

    function load() {
        statsElement.innerHTML = '';
        MP.loader.skeletonRows(listElement, 4);

        MP.contactRequestService.listForEmployer()
            .then(function (response) {
                requests = MP.apiClient.toList(response.data);

                requests.sort(function (a, b) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                renderStats();
                renderTabs();
                renderList();
            })
            .catch(function (error) {
                statsElement.innerHTML = '';
                tabsElement.innerHTML = '';
                var message = MP.apiClient.messageOf(error, 'We could not load your contact requests.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Contact requests', subtitle: 'Permission requests sent to candidates' });

        statsElement = document.getElementById('contactStats');
        tabsElement = document.getElementById('statusTabs');
        listElement = document.getElementById('contactList');

        load();
    });
})();
