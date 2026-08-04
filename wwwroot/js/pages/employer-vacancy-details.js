/* MatchPoint - employer vacancy overview with its ranked applicants */

(function () {
    'use strict';

    var container;
    var vacancyId;
    var vacancy = null;
    var applicants = [];

    function isOpen() {
        return String(vacancy.status).toLowerCase() === 'open';
    }

    function applicantRowHtml(applicant) {
        var isTopThree = applicant.rank <= 3;

        return '<tr>' +
                '<td>' +
                    '<span class="applicant-card__rank' + (isTopThree ? ' applicant-card__rank--top' : '') + '">'
                        + applicant.rank + '</span>' +
                '</td>' +
                '<td>' +
                    '<div class="table__primary">' + MP.dom.escapeHtml(applicant.candidateName) + '</div>' +
                    '<div class="table__secondary">' + MP.dom.escapeHtml(applicant.professionalTitle) + '</div>' +
                '</td>' +
                '<td class="table__secondary">' + MP.dom.escapeHtml(applicant.location) + '</td>' +
                '<td class="table__secondary">'
                    + MP.dom.escapeHtml(MP.formatters.experienceShort(applicant.experience)) + '</td>' +
                '<td>' + MP.matchScore.pill(applicant.matchScore, { showLabel: false }) + '</td>' +
                '<td>' + MP.statusBadge.application(applicant.applicationStatus) + '</td>' +
                '<td class="table__secondary">' + MP.formatters.relativeTime(applicant.appliedAt) + '</td>' +
                '<td>' +
                    '<div class="table__actions">' +
                        '<a class="btn btn--secondary btn--sm" href="/employer/applicant-details.html?id='
                            + applicant.applicationId + '">Review</a>' +
                    '</div>' +
                '</td>' +
            '</tr>';
    }

    function applicantsSectionHtml() {
        if (!applicants.length) {
            return '<div id="applicantsEmpty"></div>';
        }

        return '<div class="table-wrapper">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th>Rank</th><th>Candidate</th><th>Location</th><th>Experience</th>' +
                        '<th>Match</th><th>Status</th><th>Applied</th><th></th>' +
                    '</tr></thead>' +
                    '<tbody>' + applicants.map(applicantRowHtml).join('') + '</tbody>' +
                '</table>' +
            '</div>';
    }

    function render() {
        var topScore = applicants.length ? applicants[0].matchScore : null;
        var shortlisted = applicants.filter(function (a) {
            return a.applicationStatus === 'Shortlisted';
        }).length;

        container.innerHTML =
            '<div class="page-header">' +
                '<div>' +
                    '<h1 class="page-header__title">' + MP.dom.escapeHtml(vacancy.title) + '</h1>' +
                    '<p class="page-header__description">' + MP.dom.escapeHtml(vacancy.companyName) + '</p>' +
                '</div>' +
                '<div class="page-header__actions">' +
                    MP.statusBadge.vacancy(vacancy.status) +
                    '<a class="btn btn--secondary" href="/employer/vacancy-form.html?id=' + vacancy.id + '">'
                        + MP.dom.icon('edit') + 'Edit</a>' +
                    (isOpen()
                        ? '<button type="button" class="btn btn--danger-soft" id="closeVacancy">'
                            + MP.dom.icon('ban') + 'Close vacancy</button>'
                        : '<button type="button" class="btn btn--soft" id="reopenVacancy">'
                            + MP.dom.icon('refresh') + 'Reopen</button>') +
                '</div>' +
            '</div>' +

            '<div class="stat-grid stat-grid--3">' +
                '<article class="stat-card">' +
                    '<span class="stat-card__icon stat-card__icon--primary">' + MP.dom.icon('users') + '</span>' +
                    '<div class="stat-card__body">' +
                        '<div class="stat-card__label">Applicants</div>' +
                        '<div class="stat-card__value">' + applicants.length + '</div>' +
                    '</div>' +
                '</article>' +
                '<article class="stat-card">' +
                    '<span class="stat-card__icon stat-card__icon--success">' + MP.dom.icon('target') + '</span>' +
                    '<div class="stat-card__body">' +
                        '<div class="stat-card__label">Best match</div>' +
                        '<div class="stat-card__value">' + (topScore === null ? '—' : topScore + '%') + '</div>' +
                    '</div>' +
                '</article>' +
                '<article class="stat-card">' +
                    '<span class="stat-card__icon stat-card__icon--accent">' + MP.dom.icon('star') + '</span>' +
                    '<div class="stat-card__body">' +
                        '<div class="stat-card__label">Shortlisted</div>' +
                        '<div class="stat-card__value">' + shortlisted + '</div>' +
                    '</div>' +
                '</article>' +
            '</div>' +

            '<div class="grid grid--sidebar">' +
                '<section class="card">' +
                    '<div class="card__header">' +
                        '<div>' +
                            '<h2 class="card__title">Applicants</h2>' +
                            '<p class="card__subtitle">Ranked by match score, strongest first</p>' +
                        '</div>' +
                        (applicants.length
                            ? '<a class="btn btn--ghost btn--sm" href="/employer/applicants.html?vacancyId='
                                + vacancy.id + '">Open in applicants</a>'
                            : '') +
                    '</div>' +
                    applicantsSectionHtml() +
                '</section>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Role details</h2></div>' +
                        '<div class="card__body">' +
                            '<div class="detail-list">' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Location</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(vacancy.location) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Required experience</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.experience(vacancy.requiredExperience)) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Education requirement</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.orDash(vacancy.educationRequirement)) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Posted</div>' +
                                    '<div class="detail-item__value">' + MP.formatters.date(vacancy.createdAt) + '</div>' +
                                '</div>' +
                                (vacancy.closedAt
                                    ? '<div class="detail-item">' +
                                        '<div class="detail-item__label">Closed</div>' +
                                        '<div class="detail-item__value">' + MP.formatters.date(vacancy.closedAt) + '</div>' +
                                      '</div>'
                                    : '') +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Required skills</div>' +
                                    MP.matchScore.skillChips(vacancy.requiredSkills, 'primary', 'None listed') +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Description</h2></div>' +
                        '<div class="card__body">' +
                            '<p class="text-secondary" style="white-space:pre-line;line-height:1.7">'
                                + MP.dom.escapeHtml(vacancy.description) + '</p>' +
                        '</div>' +
                    '</section>' +
                '</aside>' +
            '</div>';

        if (!applicants.length) {
            MP.loader.empty(document.getElementById('applicantsEmpty'), {
                icon: 'users',
                title: 'No applicants yet',
                message: isOpen()
                    ? 'Candidates who apply will appear here, automatically ranked by how well they match this role.'
                    : 'This vacancy was closed without receiving any applications.'
            });
        }

        MP.dom.on(document.getElementById('closeVacancy'), 'click', confirmClose);
        MP.dom.on(document.getElementById('reopenVacancy'), 'click', reopen);

        MP.header.setTitle(vacancy.title, vacancy.location);
        document.title = vacancy.title + ' · MatchPoint';
    }

    function confirmClose() {
        MP.modal.confirm({
            title: 'Close "' + vacancy.title + '"?',
            message: 'New applications will be blocked immediately and applicants will be notified. '
                + 'You can still review everyone who has already applied.',
            icon: 'ban',
            tone: 'danger',
            confirmLabel: 'Close vacancy',
            confirmVariant: 'danger',
            body: applicants.length
                ? '<div class="alert alert--warning">' + MP.dom.icon('alert')
                    + '<span>This vacancy has <strong>' + applicants.length + '</strong> applicant'
                    + (applicants.length === 1 ? '' : 's') + '. They will be notified that it has closed.</span></div>'
                : undefined,
            onConfirm: function () {
                return MP.jobService.close(vacancyId)
                    .then(function (response) {
                        vacancy = response.data || vacancy;
                        MP.toast.success(response.message || 'Vacancy closed successfully.');
                        render();
                    })
                    .catch(function (error) {
                        MP.toast.error(MP.apiClient.messageOf(error, 'The vacancy could not be closed.'));
                        throw error;
                    });
            }
        });
    }

    function reopen() {
        MP.jobService.reopen(vacancyId)
            .then(function (response) {
                vacancy = response.data || vacancy;
                MP.toast.success(response.message || 'Vacancy reopened successfully.');
                render();
            })
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'The vacancy could not be reopened.'));
            });
    }

    function load() {
        MP.loader.spinner(container, 'Loading vacancy…');

        Promise.all([
            MP.jobService.getMyVacancy(vacancyId),
            MP.jobService.getApplicants(vacancyId).catch(function () { return { data: [] }; })
        ])
            .then(function (responses) {
                vacancy = responses[0].data;
                applicants = MP.apiClient.toList(responses[1].data);

                if (!vacancy) {
                    throw new MP.ApiError(404, 'This vacancy could not be found.');
                }

                MP.matchScore.rank(applicants);

                render();
            })
            .catch(function (error) {
                if (error.isNotFound) {
                    MP.loader.empty(container, {
                        icon: 'alert',
                        title: 'Vacancy not found',
                        message: 'This vacancy does not exist, or it belongs to another employer.',
                        actionLabel: 'Back to vacancies',
                        actionHref: '/employer/vacancies.html'
                    });
                    return;
                }

                var message = MP.apiClient.messageOf(error, 'We could not load this vacancy.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Vacancy details' });

        container = document.getElementById('vacancyContent');
        vacancyId = MP.dom.queryParamInt('id');

        if (!vacancyId) {
            MP.loader.empty(container, {
                icon: 'alert',
                title: 'No vacancy selected',
                message: 'Choose a vacancy from your list to see its applicants and details.',
                actionLabel: 'Back to vacancies',
                actionHref: '/employer/vacancies.html'
            });
            return;
        }

        load();
    });
})();
