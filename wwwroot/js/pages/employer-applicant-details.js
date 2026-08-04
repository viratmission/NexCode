/* MatchPoint - full applicant review: match breakdown, CV, status and contact request */

(function () {
    'use strict';

    var container;
    var applicationId;
    var applicant = null;

    var STATUS_ACTIONS = [
        { status: 'UnderReview', label: 'Mark under review', variant: 'secondary', icon: 'clock' },
        { status: 'Shortlisted', label: 'Shortlist', variant: 'success', icon: 'star' },
        { status: 'Rejected', label: 'Reject', variant: 'danger-soft', icon: 'xCircle' }
    ];

    function statusActionsHtml() {
        return STATUS_ACTIONS
            .filter(function (action) { return action.status !== applicant.applicationStatus; })
            .map(function (action) {
                return '<button type="button" class="btn btn--' + action.variant + ' btn--block" '
                    + 'data-status="' + action.status + '">' + MP.dom.icon(action.icon)
                    + MP.dom.escapeHtml(action.label) + '</button>';
            }).join('');
    }

    function contactRequestHtml() {
        if (applicant.contactRequestPending) {
            return '<div class="alert alert--warning">' + MP.dom.icon('clock') +
                '<span>A contact request is pending this candidate\'s response.</span></div>';
        }

        return '<button type="button" class="btn btn--primary btn--block" id="sendContactRequest">'
            + MP.dom.icon('mail') + 'Request contact permission</button>' +
            '<p class="text-sm text-secondary mt-2">The candidate must accept before you can reach out directly.</p>';
    }

    function cvPanelHtml() {
        if (!applicant.hasCv) {
            return '<div class="alert">' + MP.dom.icon('info') +
                '<span>This candidate has not uploaded a CV.</span></div>';
        }

        var cv = applicant.cvDocument;

        return '<div class="file-card">' +
                '<span class="file-card__icon">' + MP.dom.icon('document') + '</span>' +
                '<div class="file-card__info">' +
                    '<div class="file-card__name">'
                        + MP.dom.escapeHtml(cv ? cv.originalFileName : 'Candidate CV') + '</div>' +
                    '<div class="file-card__meta">' +
                        (cv
                            ? MP.formatters.fileSize(cv.fileSize) + ' · uploaded '
                                + MP.formatters.relativeTime(cv.uploadedAt)
                            : 'Available for download') +
                    '</div>' +
                '</div>' +
                '<div class="file-card__actions">' +
                    '<button type="button" class="btn btn--secondary btn--sm" id="downloadCv">'
                        + MP.dom.icon('download') + 'Download</button>' +
                '</div>' +
            '</div>';
    }

    function render() {
        var match = applicant.matchBreakdown;

        container.innerHTML =
            '<div class="page-header">' +
                '<div class="flex items-center gap-4">' +
                    '<span class="avatar avatar--xl" aria-hidden="true">'
                        + MP.dom.escapeHtml(MP.formatters.initials(applicant.candidateName)) + '</span>' +
                    '<div>' +
                        '<h1 class="page-header__title">' + MP.dom.escapeHtml(applicant.candidateName) + '</h1>' +
                        '<p class="page-header__description">'
                            + MP.dom.escapeHtml(applicant.professionalTitle) + '</p>' +
                        '<div class="flex items-center gap-2 mt-2 flex-wrap">' +
                            MP.statusBadge.application(applicant.applicationStatus) +
                            '<span class="badge badge--neutral badge--plain">Applied for '
                                + MP.dom.escapeHtml(applicant.jobTitle) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="grid grid--sidebar">' +
                '<div class="flex flex-col gap-5">' +
                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Candidate profile</h2></div>' +
                        '<div class="card__body">' +
                            '<div class="detail-list detail-list--2">' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Email</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(applicant.email) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Location</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(applicant.location) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Experience</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.experienceShort(applicant.experience)) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Education</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.orDash(applicant.education)) + '</div>' +
                                '</div>' +
                            '</div>' +

                            (applicant.about
                                ? '<div class="divider"></div>' +
                                  '<div class="detail-item__label">About</div>' +
                                  '<p class="text-secondary mt-1" style="white-space:pre-line;line-height:1.7">'
                                      + MP.dom.escapeHtml(applicant.about) + '</p>'
                                : '') +

                            '<div class="divider"></div>' +
                            '<div class="detail-item__label">Skills</div>' +
                            '<div class="mt-2">'
                                + MP.matchScore.skillChips(applicant.skills, '', 'No skills listed') + '</div>' +
                        '</div>' +
                    '</section>' +

                    (match
                        ? '<section class="card">' +
                            '<div class="card__header">' +
                                '<div>' +
                                    '<h2 class="card__title">Match breakdown</h2>' +
                                    '<p class="card__subtitle">Against "'
                                        + MP.dom.escapeHtml(applicant.jobTitle) + '"</p>' +
                                '</div>' +
                            '</div>' +
                            '<div class="card__body">' +
                                MP.matchScore.breakdown(match) +
                                '<div class="divider"></div>' +
                                MP.matchScore.skillComparison(match) +
                            '</div>' +
                          '</section>'
                        : '') +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Curriculum vitae</h2></div>' +
                        '<div class="card__body" id="cvPanel">' + cvPanelHtml() + '</div>' +
                    '</section>' +
                '</div>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__body text-center">' +
                            MP.matchScore.ring(applicant.matchScore, 'lg') +
                            '<div class="fw-semibold mt-4">'
                                + MP.dom.escapeHtml(MP.matchScore.tierLabel(applicant.matchScore)) + '</div>' +
                            '<p class="text-sm text-secondary mt-1">Overall fit for this role</p>' +
                            '<p class="text-sm text-secondary mt-3">Applied '
                                + MP.formatters.relativeTime(applicant.appliedAt) + '</p>' +
                        '</div>' +
                    '</section>' +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Update status</h2></div>' +
                        '<div class="card__body">' +
                            '<div class="flex flex-col gap-2" id="statusActions">' + statusActionsHtml() + '</div>' +
                        '</div>' +
                    '</section>' +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Contact candidate</h2></div>' +
                        '<div class="card__body" id="contactPanel">' + contactRequestHtml() + '</div>' +
                    '</section>' +

                    '<a class="btn btn--ghost btn--block" href="/employer/vacancy-details.html?id='
                        + applicant.vacancyId + '">View the vacancy</a>' +
                '</aside>' +
            '</div>';

        wireActions();

        MP.header.setTitle(applicant.candidateName, applicant.jobTitle);
        document.title = applicant.candidateName + ' · MatchPoint';
    }

    function wireActions() {
        MP.dom.qsa('[data-status]', container).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmStatusChange(button.getAttribute('data-status'), button);
            });
        });

        MP.dom.on(document.getElementById('downloadCv'), 'click', downloadCv);
        MP.dom.on(document.getElementById('sendContactRequest'), 'click', confirmContactRequest);
    }

    function confirmStatusChange(status, button) {
        var isReject = status === 'Rejected';

        MP.modal.confirm({
            title: 'Mark as ' + MP.formatters.humanize(status) + '?',
            message: applicant.candidateName + ' will be notified that their application status has changed.',
            icon: isReject ? 'xCircle' : 'checkCircle',
            tone: isReject ? 'danger' : 'success',
            confirmLabel: 'Confirm',
            confirmVariant: isReject ? 'danger' : 'success',
            onConfirm: function () {
                MP.dom.setButtonLoading(button, true);

                return MP.applicationService.updateStatus(applicationId, status)
                    .then(function (response) {
                        applicant = response.data || applicant;
                        MP.toast.success(response.message
                            || ('Application marked as ' + MP.formatters.humanize(status) + '.'));
                        render();
                    })
                    .catch(function (error) {
                        MP.dom.setButtonLoading(button, false);
                        MP.toast.error(MP.apiClient.messageOf(error, 'The status could not be updated.'));
                        throw error;
                    });
            }
        });
    }

    function downloadCv() {
        var fallback = applicant.cvDocument
            ? applicant.cvDocument.originalFileName
            : applicant.candidateName.replace(/\s+/g, '-').toLowerCase() + '-cv.pdf';

        MP.applicationService.downloadCv(applicationId, fallback)
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'The CV could not be downloaded.'));
            });
    }

    function confirmContactRequest() {
        MP.modal.confirm({
            title: 'Request permission to contact?',
            message: applicant.candidateName + ' will be asked to approve direct contact about '
                + applicant.jobTitle + '.',
            icon: 'mail',
            tone: 'primary',
            confirmLabel: 'Send request',
            confirmVariant: 'primary',
            onConfirm: function () {
                return MP.contactRequestService.createForApplication(applicationId)
                    .then(function (response) {
                        applicant.contactRequestPending = true;
                        MP.dom.setHtml(document.getElementById('contactPanel'), contactRequestHtml());
                        MP.toast.success(response.message || 'Contact request sent successfully.');
                    })
                    .catch(function (error) {
                        if (error.isConflict) {
                            // A request already exists for this application.
                            applicant.contactRequestPending = true;
                            MP.dom.setHtml(document.getElementById('contactPanel'), contactRequestHtml());
                            MP.toast.warning(error.message || 'A contact request already exists for this candidate.');
                            return;
                        }
                        MP.toast.error(MP.apiClient.messageOf(error, 'The contact request could not be sent.'));
                        throw error;
                    });
            }
        });
    }

    function load() {
        MP.loader.spinner(container, 'Loading applicant…');

        MP.applicationService.getById(applicationId)
            .then(function (response) {
                applicant = response.data;
                if (!applicant) {
                    throw new MP.ApiError(404, 'This application could not be found.');
                }
                render();
            })
            .catch(function (error) {
                if (error.isNotFound) {
                    MP.loader.empty(container, {
                        icon: 'alert',
                        title: 'Application not found',
                        message: 'This application does not exist, or it belongs to another employer.',
                        actionLabel: 'Back to applicants',
                        actionHref: '/employer/applicants.html'
                    });
                    return;
                }

                var message = MP.apiClient.messageOf(error, 'We could not load this applicant.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Applicant' });

        container = document.getElementById('applicantContent');
        applicationId = MP.dom.queryParamInt('id');

        if (!applicationId) {
            MP.loader.empty(container, {
                icon: 'alert',
                title: 'No applicant selected',
                message: 'Choose a candidate from your applicant list to review their full profile.',
                actionLabel: 'Back to applicants',
                actionHref: '/employer/applicants.html'
            });
            return;
        }

        load();
    });
})();
