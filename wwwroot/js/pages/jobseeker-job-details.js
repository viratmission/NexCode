/* MatchPoint - job details with match breakdown and apply action */

(function () {
    'use strict';

    var container;
    var jobId;
    var current = null;

    function applyButtonHtml(details) {
        var job = details.job;
        var isClosed = String(job.status).toLowerCase() === 'closed';

        if (isClosed) {
            return '<button type="button" class="btn btn--secondary btn--lg btn--block" disabled>'
                + 'This vacancy is closed</button>';
        }

        if (details.alreadyApplied) {
            return '<button type="button" class="btn btn--success btn--lg btn--block" disabled>'
                + MP.dom.icon('check') + 'Already applied</button>';
        }

        return '<button type="button" class="btn btn--primary btn--lg btn--block" id="applyButton">'
            + MP.dom.icon('send') + 'Apply for this role</button>';
    }

    function render(details) {
        var job = details.job || {};
        var match = details.matchResult;

        container.innerHTML =
            '<div class="page-header">' +
                '<div>' +
                    '<h1 class="page-header__title">' + MP.dom.escapeHtml(job.title) + '</h1>' +
                    '<p class="page-header__description">' + MP.dom.escapeHtml(job.companyName) + '</p>' +
                '</div>' +
                '<div class="page-header__actions">' + MP.statusBadge.vacancy(job.status) + '</div>' +
            '</div>' +

            '<div class="grid grid--sidebar">' +
                '<div class="flex flex-col gap-5">' +
                    '<section class="card">' +
                        '<div class="card__body">' +
                            '<div class="meta-row mb-5">' +
                                '<span class="meta-row__item">' + MP.dom.icon('location')
                                    + MP.dom.escapeHtml(job.location) + '</span>' +
                                '<span class="meta-row__item">' + MP.dom.icon('briefcase')
                                    + MP.dom.escapeHtml(MP.formatters.experience(job.requiredExperience)) + '</span>' +
                                '<span class="meta-row__item">' + MP.dom.icon('graduation')
                                    + MP.dom.escapeHtml(MP.formatters.orDash(job.educationRequirement)) + '</span>' +
                                '<span class="meta-row__item">' + MP.dom.icon('clock')
                                    + 'Posted ' + MP.formatters.relativeTime(job.createdAt) + '</span>' +
                            '</div>' +

                            '<h2 class="section__title mb-3">Role description</h2>' +
                            '<p class="text-secondary" style="white-space:pre-line;line-height:1.7">'
                                + MP.dom.escapeHtml(job.description) + '</p>' +

                            '<div class="divider"></div>' +

                            '<h2 class="section__title mb-3">Required skills</h2>' +
                            MP.matchScore.skillChips(job.requiredSkills, 'primary', 'No specific skills listed') +
                        '</div>' +
                    '</section>' +

                    (match
                        ? '<section class="card">' +
                            '<div class="card__header">' +
                                '<div>' +
                                    '<h2 class="card__title">How you match</h2>' +
                                    '<p class="card__subtitle">Skills 60 · Experience 20 · Education 10 · Location 10</p>' +
                                '</div>' +
                            '</div>' +
                            '<div class="card__body">' + MP.matchScore.panel(match) + '</div>' +
                          '</section>'
                        : '<div class="alert alert--info">' + MP.dom.icon('info') +
                            '<span>Add your skills, experience, education and location to your profile to see how ' +
                            'well you match this role. <a href="/jobseeker/profile.html">Complete your profile</a>.</span>' +
                          '</div>') +
                '</div>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__body text-center">' +
                            (match
                                ? MP.matchScore.ring(match.totalScore, 'lg')
                                    + '<div class="fw-semibold mt-4">' + MP.dom.escapeHtml(MP.matchScore.tierLabel(match.totalScore)) + '</div>'
                                    + '<p class="text-sm text-secondary mt-1">Your overall match for this role</p>'
                                : '<div class="state__icon" style="margin:0 auto">' + MP.dom.icon('target') + '</div>'
                                    + '<div class="fw-semibold mt-3">No match score yet</div>'
                                    + '<p class="text-sm text-secondary mt-1">Complete your profile to unlock scoring</p>') +
                            '<div class="mt-6" id="applyContainer">' + applyButtonHtml(details) + '</div>' +
                            (details.alreadyApplied
                                ? '<p class="text-sm text-secondary mt-3">You can track this in '
                                    + '<a href="/jobseeker/applications.html">My Applications</a>.</p>'
                                : '') +
                        '</div>' +
                    '</section>' +

                    (match && (match.missingSkills || []).length
                        ? '<section class="card">' +
                            '<div class="card__header"><h2 class="card__title">Close the gap</h2></div>' +
                            '<div class="card__body">' +
                                '<p class="text-sm text-secondary mb-3">Adding these skills to your profile would ' +
                                    'raise your score for this and similar roles.</p>' +
                                MP.matchScore.skillChips(match.missingSkills, 'danger') +
                                '<a class="btn btn--secondary btn--sm mt-4 btn--block" href="/jobseeker/profile.html">' +
                                    'Update my skills</a>' +
                            '</div>' +
                          '</section>'
                        : '') +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">About the employer</h2></div>' +
                        '<div class="card__body">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="avatar avatar--lg" aria-hidden="true">'
                                    + MP.dom.escapeHtml(MP.formatters.initials(job.companyName)) + '</span>' +
                                '<div>' +
                                    '<div class="fw-semibold">' + MP.dom.escapeHtml(job.companyName) + '</div>' +
                                    '<div class="text-sm text-secondary">' + MP.dom.escapeHtml(job.location) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +
                '</aside>' +
            '</div>';

        var applyButton = document.getElementById('applyButton');
        if (applyButton) {
            MP.dom.on(applyButton, 'click', confirmApply);
        }

        MP.header.setTitle(job.title, job.companyName);
        document.title = job.title + ' · MatchPoint';
    }

    function confirmApply() {
        var job = current.job;
        var match = current.matchResult;
        var missing = match ? (match.missingSkills || []).length : 0;

        MP.modal.confirm({
            title: 'Apply for ' + job.title + '?',
            message: 'Your profile and CV will be shared with ' + job.companyName + '.',
            icon: 'send',
            tone: 'primary',
            confirmLabel: 'Submit application',
            confirmVariant: 'primary',
            body: match
                ? '<div class="alert ' + (missing === 0 ? 'alert--success' : 'alert--warning') + '">'
                    + MP.dom.icon(missing === 0 ? 'checkCircle' : 'alert')
                    + '<span>You match this role at <strong>' + MP.matchScore.normalize(match.totalScore)
                    + '%</strong>. ' + (missing === 0
                        ? 'You meet every required skill.'
                        : 'You are missing ' + missing + ' required skill' + (missing === 1 ? '' : 's') + '.')
                    + '</span></div>'
                : undefined,
            onConfirm: apply
        });
    }

    function apply() {
        return MP.jobService.apply(jobId)
            .then(function (response) {
                MP.toast.success(response.message || 'Application submitted successfully.');
                current.alreadyApplied = true;

                var applyContainer = document.getElementById('applyContainer');
                if (applyContainer) {
                    applyContainer.innerHTML = applyButtonHtml(current);
                }

                MP.header.refreshUnreadCount();
            })
            .catch(function (error) {
                if (error.isConflict) {
                    // The API rejects a second application for the same vacancy.
                    MP.toast.warning(error.message || 'You have already applied to this vacancy.');
                    current.alreadyApplied = true;
                    var container409 = document.getElementById('applyContainer');
                    if (container409) {
                        container409.innerHTML = applyButtonHtml(current);
                    }
                    return;
                }

                MP.toast.error(MP.apiClient.messageOf(error, 'Your application could not be submitted.'));
                throw error;
            });
    }

    function load() {
        MP.loader.spinner(container, 'Loading job details…');

        MP.jobService.getById(jobId)
            .then(function (response) {
                current = response.data || {};
                if (!current.job) {
                    throw new MP.ApiError(404, 'This vacancy could not be found.');
                }
                render(current);
            })
            .catch(function (error) {
                if (error.isNotFound) {
                    MP.loader.empty(container, {
                        icon: 'search',
                        title: 'Vacancy not found',
                        message: 'This vacancy may have been removed or is no longer available.',
                        actionLabel: 'Back to all jobs',
                        actionHref: '/jobseeker/jobs.html'
                    });
                    return;
                }

                var message = MP.apiClient.messageOf(error, 'We could not load this vacancy.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Job details' });

        container = document.getElementById('jobDetails');
        jobId = MP.dom.queryParamInt('id');

        if (!jobId) {
            MP.loader.empty(container, {
                icon: 'alert',
                title: 'No vacancy selected',
                message: 'Pick a vacancy from the job list to see its details and your match breakdown.',
                actionLabel: 'Browse jobs',
                actionHref: '/jobseeker/jobs.html'
            });
            return;
        }

        load();
    });
})();
