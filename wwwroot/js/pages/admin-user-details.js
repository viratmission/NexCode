/* MatchPoint - administrator view of a single user account */

(function () {
    'use strict';

    var container;
    var userId;
    var user = null;
    var isSelf = false;

    function roleSpecificDetails() {
        if (user.role === 'Employer') {
            return '<div class="detail-item">' +
                    '<div class="detail-item__label">Company</div>' +
                    '<div class="detail-item__value">'
                        + MP.dom.escapeHtml(MP.formatters.orDash(user.companyName)) + '</div>' +
                '</div>';
        }

        if (user.role === 'JobSeeker') {
            return '<div class="detail-item">' +
                    '<div class="detail-item__label">Professional title</div>' +
                    '<div class="detail-item__value">'
                        + MP.dom.escapeHtml(MP.formatters.orDash(user.professionalTitle)) + '</div>' +
                '</div>';
        }

        return '';
    }

    function actionPanelHtml() {
        if (isSelf) {
            return '<div class="alert alert--info">' + MP.dom.icon('info') +
                '<span>This is your own account. Administrators cannot change their own access status.</span></div>';
        }

        if (user.isActive) {
            return '<button type="button" class="btn btn--danger btn--block" id="toggleStatus">'
                    + MP.dom.icon('ban') + 'Disable this account</button>' +
                '<p class="text-sm text-secondary mt-2">The user is signed out and blocked from signing in again.</p>';
        }

        return '<button type="button" class="btn btn--success btn--block" id="toggleStatus">'
                + MP.dom.icon('checkCircle') + 'Enable this account</button>' +
            '<p class="text-sm text-secondary mt-2">The user regains access to MatchPoint immediately.</p>';
    }

    function render() {
        container.innerHTML =
            '<div class="page-header">' +
                '<div class="flex items-center gap-4">' +
                    '<span class="avatar avatar--xl" aria-hidden="true">'
                        + MP.dom.escapeHtml(MP.formatters.initials(user.fullName)) + '</span>' +
                    '<div>' +
                        '<h1 class="page-header__title">' + MP.dom.escapeHtml(user.fullName) + '</h1>' +
                        '<p class="page-header__description">' + MP.dom.escapeHtml(user.email) + '</p>' +
                        '<div class="flex items-center gap-2 mt-2 flex-wrap">' +
                            MP.statusBadge.role(user.role) +
                            MP.statusBadge.userStatus(user.isActive) +
                            (isSelf ? '<span class="badge badge--primary badge--plain">Your account</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="grid grid--sidebar">' +
                '<section class="card">' +
                    '<div class="card__header"><h2 class="card__title">Account details</h2></div>' +
                    '<div class="card__body">' +
                        '<div class="detail-list detail-list--2">' +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Account ID</div>' +
                                '<div class="detail-item__value">#' + user.id + '</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Role</div>' +
                                '<div class="detail-item__value">'
                                    + MP.dom.escapeHtml(MP.formatters.roleLabel(user.role)) + '</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Email</div>' +
                                '<div class="detail-item__value">' + MP.dom.escapeHtml(user.email) + '</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Location</div>' +
                                '<div class="detail-item__value">'
                                    + MP.dom.escapeHtml(MP.formatters.orDash(user.location)) + '</div>' +
                            '</div>' +
                            roleSpecificDetails() +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Registered</div>' +
                                '<div class="detail-item__value">' + MP.formatters.dateTime(user.createdAt) + '</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-item__label">Access status</div>' +
                                '<div class="detail-item__value">'
                                    + (user.isActive ? 'Active — can sign in' : 'Disabled — cannot sign in') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</section>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Access control</h2></div>' +
                        '<div class="card__body" id="actionPanel">' + actionPanelHtml() + '</div>' +
                    '</section>' +

                    '<a class="btn btn--ghost btn--block" href="/admin/users.html?role='
                        + encodeURIComponent(user.role) + '">See all '
                        + MP.dom.escapeHtml(MP.formatters.roleLabel(user.role).toLowerCase()) + ' accounts</a>' +
                '</aside>' +
            '</div>';

        MP.dom.on(document.getElementById('toggleStatus'), 'click', confirmToggle);

        MP.header.setTitle(user.fullName, MP.formatters.roleLabel(user.role));
        document.title = user.fullName + ' · MatchPoint';
    }

    function confirmToggle() {
        var nextActive = !user.isActive;

        MP.modal.confirm({
            title: nextActive
                ? 'Enable ' + user.fullName + '?'
                : 'Disable ' + user.fullName + '?',
            message: nextActive
                ? 'They will be able to sign in and use MatchPoint again immediately.'
                : 'They will be signed out and blocked from signing in until the account is re-enabled.',
            icon: nextActive ? 'checkCircle' : 'ban',
            tone: nextActive ? 'success' : 'danger',
            confirmLabel: nextActive ? 'Enable account' : 'Disable account',
            confirmVariant: nextActive ? 'success' : 'danger',
            body: nextActive
                ? undefined
                : '<div class="alert alert--warning">' + MP.dom.icon('alert') +
                    '<span>Their vacancies, applications and history are preserved &mdash; only access is revoked.</span></div>',
            onConfirm: function () {
                return MP.adminService.updateUserStatus(userId, nextActive)
                    .then(function (response) {
                        user = response.data || Object.assign({}, user, { isActive: nextActive });
                        MP.toast.success(response.message
                            || (nextActive ? 'User account enabled.' : 'User account disabled.'));
                        render();
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
        MP.loader.spinner(container, 'Loading account…');

        MP.adminService.getUser(userId)
            .then(function (response) {
                user = response.data;
                if (!user) {
                    throw new MP.ApiError(404, 'This account could not be found.');
                }

                var signedIn = MP.tokenManager.getUser();
                isSelf = Boolean(signedIn) && signedIn.id === user.id;

                render();
            })
            .catch(function (error) {
                if (error.isNotFound) {
                    MP.loader.empty(container, {
                        icon: 'users',
                        title: 'Account not found',
                        message: 'No account exists with this identifier. It may have been removed.',
                        actionLabel: 'Back to user accounts',
                        actionHref: '/admin/users.html'
                    });
                    return;
                }

                var message = MP.apiClient.messageOf(error, 'We could not load this account.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.ADMINISTRATOR)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'User account' });

        container = document.getElementById('userContent');
        userId = MP.dom.queryParamInt('id');

        if (!userId) {
            MP.loader.empty(container, {
                icon: 'users',
                title: 'No account selected',
                message: 'Choose an account from the user list to review and moderate it.',
                actionLabel: 'Back to user accounts',
                actionHref: '/admin/users.html'
            });
            return;
        }

        load();
    });
})();
