/* MatchPoint - job seeker inbox of employer contact requests */

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
        return requests.filter(function (request) {
            return request.status === status;
        }).length;
    }

    function renderStats() {
        var cards = [
            { label: 'Pending your response', status: 'Pending', icon: 'clock', tone: 'warning' },
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

    function cardHtml(request) {
        var isPending = request.status === 'Pending';

        return '<article class="card" data-request="' + request.id + '">' +
                '<div class="card__body">' +
                    '<div class="flex items-start gap-4 flex-wrap">' +
                        '<span class="avatar avatar--lg" aria-hidden="true">'
                            + MP.dom.escapeHtml(MP.formatters.initials(request.companyName)) + '</span>' +

                        '<div class="flex-1" style="min-width:200px">' +
                            '<div class="flex items-center gap-3 flex-wrap">' +
                                '<h2 class="section__title">' + MP.dom.escapeHtml(request.companyName) + '</h2>' +
                                MP.statusBadge.contactRequest(request.status) +
                            '</div>' +
                            '<p class="text-secondary mt-1">' +
                                MP.dom.escapeHtml(request.employerName) + ' would like to contact you about ' +
                                '<strong>' + MP.dom.escapeHtml(request.vacancyTitle) + '</strong>.' +
                            '</p>' +
                            '<div class="meta-row mt-3">' +
                                '<span class="meta-row__item">' + MP.dom.icon('clock')
                                    + 'Requested ' + MP.formatters.relativeTime(request.createdAt) + '</span>' +
                                (request.respondedAt
                                    ? '<span class="meta-row__item">' + MP.dom.icon('check')
                                        + 'Responded ' + MP.formatters.relativeTime(request.respondedAt) + '</span>'
                                    : '') +
                            '</div>' +
                        '</div>' +

                        (isPending
                            ? '<div class="flex gap-2 flex-wrap">' +
                                '<button type="button" class="btn btn--secondary" data-decline="' + request.id + '">'
                                    + MP.dom.icon('xCircle') + 'Decline</button>' +
                                '<button type="button" class="btn btn--success" data-accept="' + request.id + '">'
                                    + MP.dom.icon('check') + 'Accept</button>' +
                              '</div>'
                            : '') +
                    '</div>' +

                    (request.status === 'Accepted'
                        ? '<div class="alert alert--success mt-4">' + MP.dom.icon('checkCircle') +
                            '<span>You accepted this request. ' + MP.dom.escapeHtml(request.companyName)
                            + ' can now reach out to you directly.</span></div>'
                        : '') +
                '</div>' +
            '</article>';
    }

    function renderList() {
        var filtered = activeStatus === 'All'
            ? requests
            : requests.filter(function (request) { return request.status === activeStatus; });

        if (!filtered.length) {
            listElement.innerHTML = '<section class="card"><div id="emptyHost"></div></section>';
            MP.loader.empty(document.getElementById('emptyHost'), {
                icon: 'mail',
                title: requests.length === 0 ? 'No contact requests yet' : 'Nothing in this view',
                message: requests.length === 0
                    ? 'When an employer wants to reach out about one of your applications, their request will appear here.'
                    : 'You have no ' + activeStatus.toLowerCase() + ' contact requests.'
            });
            return;
        }

        listElement.innerHTML = '<div class="list-stack">' + filtered.map(cardHtml).join('') + '</div>';

        MP.dom.qsa('[data-accept]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmRespond(parseInt(button.getAttribute('data-accept'), 10), 'Accepted');
            });
        });

        MP.dom.qsa('[data-decline]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmRespond(parseInt(button.getAttribute('data-decline'), 10), 'Declined');
            });
        });
    }

    function findRequest(id) {
        return requests.filter(function (request) { return request.id === id; })[0];
    }

    function confirmRespond(id, status) {
        var request = findRequest(id);
        if (!request) {
            return;
        }

        var isAccept = status === 'Accepted';

        MP.modal.confirm({
            title: isAccept ? 'Accept this contact request?' : 'Decline this contact request?',
            message: isAccept
                ? request.companyName + ' will be able to contact you about ' + request.vacancyTitle + '.'
                : request.companyName + ' will be told you declined. They will not be able to contact you.',
            icon: isAccept ? 'checkCircle' : 'xCircle',
            tone: isAccept ? 'success' : 'danger',
            confirmLabel: isAccept ? 'Accept request' : 'Decline request',
            confirmVariant: isAccept ? 'success' : 'danger',
            onConfirm: function () {
                return MP.contactRequestService.respond(id, status)
                    .then(function (response) {
                        var updated = response.data;
                        if (updated) {
                            requests = requests.map(function (item) {
                                return item.id === id ? updated : item;
                            });
                        }
                        renderStats();
                        renderTabs();
                        renderList();
                        MP.toast.success(response.message
                            || ('Contact request ' + status.toLowerCase() + '.'));
                        MP.header.refreshUnreadCount();
                    })
                    .catch(function (error) {
                        MP.toast.error(MP.apiClient.messageOf(error, 'We could not record your response.'));
                        throw error;
                    });
            }
        });
    }

    function load() {
        statsElement.innerHTML = '';
        MP.loader.skeletonCards(listElement, 3);

        MP.contactRequestService.listForJobSeeker()
            .then(function (response) {
                requests = MP.apiClient.toList(response.data);

                // Pending requests need action, so surface them first.
                requests.sort(function (a, b) {
                    if (a.status === 'Pending' && b.status !== 'Pending') { return -1; }
                    if (b.status === 'Pending' && a.status !== 'Pending') { return 1; }
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
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Contact requests', subtitle: 'Employers asking permission to reach out' });

        statsElement = document.getElementById('contactStats');
        tabsElement = document.getElementById('statusTabs');
        listElement = document.getElementById('contactList');

        load();
    });
})();
