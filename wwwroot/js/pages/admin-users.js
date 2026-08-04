/* MatchPoint - administrator user account management */

(function () {
    'use strict';

    var form;
    var listElement;
    var paginationElement;
    var summaryElement;

    var users = [];
    var currentUserId = null;

    var state = {
        search: '',
        role: '',
        isActive: '',
        pageNumber: 1,
        pageSize: MP.config.DEFAULT_PAGE_SIZE
    };

    function secondaryLine(user) {
        if (user.role === 'Employer' && user.companyName) {
            return user.companyName;
        }
        if (user.role === 'JobSeeker' && user.professionalTitle) {
            return user.professionalTitle;
        }
        return MP.formatters.roleLabel(user.role);
    }

    function rowHtml(user) {
        var isSelf = currentUserId !== null && user.id === currentUserId;

        return '<tr>' +
                '<td>' +
                    '<div class="flex items-center gap-3">' +
                        '<span class="avatar avatar--sm" aria-hidden="true">'
                            + MP.dom.escapeHtml(MP.formatters.initials(user.fullName)) + '</span>' +
                        '<div>' +
                            '<div class="table__primary">' + MP.dom.escapeHtml(user.fullName) +
                                (isSelf ? ' <span class="badge badge--primary badge--plain">You</span>' : '') + '</div>' +
                            '<div class="table__secondary">' + MP.dom.escapeHtml(user.email) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td>' + MP.statusBadge.role(user.role) + '</td>' +
                '<td class="table__secondary">' + MP.dom.escapeHtml(secondaryLine(user)) + '</td>' +
                '<td class="table__secondary">' + MP.dom.escapeHtml(MP.formatters.orDash(user.location)) + '</td>' +
                '<td>' + MP.statusBadge.userStatus(user.isActive) + '</td>' +
                '<td class="table__secondary">' + MP.formatters.date(user.createdAt) + '</td>' +
                '<td>' +
                    '<div class="table__actions">' +
                        '<a class="btn btn--secondary btn--sm" href="/admin/user-details.html?id='
                            + user.id + '">View</a>' +
                        (isSelf
                            ? '<button type="button" class="btn btn--ghost btn--sm" disabled '
                                + 'title="You cannot change your own account status">Disable</button>'
                            : user.isActive
                                ? '<button type="button" class="btn btn--danger-soft btn--sm" data-disable="'
                                    + user.id + '">Disable</button>'
                                : '<button type="button" class="btn btn--soft btn--sm" data-enable="'
                                    + user.id + '">Enable</button>') +
                    '</div>' +
                '</td>' +
            '</tr>';
    }

    function renderResults(paged) {
        users = paged.items;

        if (!users.length) {
            summaryElement.textContent = '';
            paginationElement.innerHTML = '';

            var hasFilters = state.search || state.role || state.isActive !== '';
            MP.loader.empty(listElement, {
                icon: 'users',
                title: hasFilters ? 'No accounts match these filters' : 'No user accounts',
                message: hasFilters
                    ? 'Try a different search term, or clear the role and status filters.'
                    : 'There are no registered accounts on the platform yet.'
            });
            return;
        }

        summaryElement.textContent = MP.formatters.number(paged.totalItems)
            + (paged.totalItems === 1 ? ' account' : ' accounts') + ' found';

        listElement.innerHTML =
            '<div class="table-wrapper">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th>User</th><th>Role</th><th>Details</th><th>Location</th>' +
                        '<th>Status</th><th>Joined</th><th></th>' +
                    '</tr></thead>' +
                    '<tbody>' + users.map(rowHtml).join('') + '</tbody>' +
                '</table>' +
            '</div>';

        MP.pagination.render(paginationElement, paged, function (page) {
            state.pageNumber = page;
            load();
            MP.dom.scrollToTop();
        });

        MP.dom.qsa('[data-disable]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmStatusChange(parseInt(button.getAttribute('data-disable'), 10), false);
            });
        });

        MP.dom.qsa('[data-enable]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmStatusChange(parseInt(button.getAttribute('data-enable'), 10), true);
            });
        });
    }

    function confirmStatusChange(userId, isActive) {
        var user = users.filter(function (item) { return item.id === userId; })[0] || {};

        MP.modal.confirm({
            title: isActive
                ? 'Enable ' + user.fullName + '?'
                : 'Disable ' + user.fullName + '?',
            message: isActive
                ? 'They will be able to sign in and use MatchPoint again immediately.'
                : 'They will be signed out and blocked from signing in until the account is re-enabled.',
            icon: isActive ? 'checkCircle' : 'ban',
            tone: isActive ? 'success' : 'danger',
            confirmLabel: isActive ? 'Enable account' : 'Disable account',
            confirmVariant: isActive ? 'success' : 'danger',
            body: isActive
                ? undefined
                : '<div class="alert alert--warning">' + MP.dom.icon('alert') +
                    '<span>Their vacancies, applications and history are preserved &mdash; only access is revoked.</span></div>',
            onConfirm: function () {
                return MP.adminService.updateUserStatus(userId, isActive)
                    .then(function (response) {
                        MP.toast.success(response.message
                            || (isActive ? 'User account enabled.' : 'User account disabled.'));
                        load();
                    })
                    .catch(function (error) {
                        // The API returns 409 when an administrator targets their own account.
                        MP.toast.error(MP.apiClient.messageOf(error, 'The account status could not be changed.'));
                        throw error;
                    });
            }
        });
    }

    function load() {
        MP.loader.skeletonRows(listElement, 6);
        summaryElement.textContent = '';
        paginationElement.innerHTML = '';

        MP.dom.replaceQuery({
            search: state.search,
            role: state.role,
            isActive: state.isActive,
            page: state.pageNumber > 1 ? state.pageNumber : ''
        });

        MP.adminService.getUsers(state)
            .then(function (response) {
                renderResults(MP.apiClient.toPagedResult(response.data, state.pageNumber, state.pageSize));
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load the user accounts.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    function readFilters() {
        var values = MP.dom.serializeForm(form);
        state.search = values.search || '';
        state.role = values.role || '';
        state.isActive = values.isActive || '';
        state.pageNumber = 1;
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.ADMINISTRATOR)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'User accounts', subtitle: 'Search and moderate every account' });

        form = document.getElementById('userFilters');
        listElement = document.getElementById('userList');
        paginationElement = document.getElementById('userPagination');
        summaryElement = document.getElementById('resultsSummary');

        var signedIn = MP.tokenManager.getUser();
        currentUserId = signedIn ? signedIn.id : null;

        state.search = MP.dom.queryParam('search', '') || '';
        state.role = MP.dom.queryParam('role', '') || '';
        state.isActive = MP.dom.queryParam('isActive', '') || '';
        state.pageNumber = MP.dom.queryParamInt('page', 1);

        form.querySelector('[name="search"]').value = state.search;
        form.querySelector('[name="role"]').value = state.role;
        form.querySelector('[name="isActive"]').value = state.isActive;

        MP.dom.on(form, 'submit', function (event) {
            event.preventDefault();
            readFilters();
            load();
        });

        MP.dom.on(document.getElementById('resetFilters'), 'click', function () {
            form.reset();
            readFilters();
            load();
        });

        MP.dom.on(form.querySelector('[name="search"]'), 'input', MP.dom.debounce(function () {
            readFilters();
            load();
        }, 450));

        MP.dom.on(form.querySelector('[name="role"]'), 'change', function () {
            readFilters();
            load();
        });

        MP.dom.on(form.querySelector('[name="isActive"]'), 'change', function () {
            readFilters();
            load();
        });

        load();
    });
})();
