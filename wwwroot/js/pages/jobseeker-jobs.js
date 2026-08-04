/* MatchPoint - job seeker vacancy search */

(function () {
    'use strict';

    var form;
    var listElement;
    var paginationElement;
    var summaryElement;

    var state = {
        search: '',
        location: '',
        minimumMatch: '',
        minimumExperience: '',
        pageNumber: 1,
        pageSize: MP.config.DEFAULT_PAGE_SIZE
    };

    function jobCardHtml(job) {
        var skills = (job.requiredSkills || []).slice(0, 6);
        var extra = (job.requiredSkills || []).length - skills.length;
        var hasScore = job.matchScore !== null && job.matchScore !== undefined;
        var missing = Number(job.missingSkillsCount) || 0;

        return '<article class="job-card">' +
                '<div class="job-card__body">' +
                    '<div class="job-card__top">' +
                        '<a class="job-card__title" href="/jobseeker/job-details.html?id=' + job.id + '">'
                            + MP.dom.escapeHtml(job.title) + '</a>' +
                        MP.statusBadge.vacancy(job.status) +
                    '</div>' +
                    '<div class="job-card__company">' + MP.dom.escapeHtml(job.companyName) + '</div>' +

                    '<div class="meta-row mt-3">' +
                        '<span class="meta-row__item">' + MP.dom.icon('location')
                            + MP.dom.escapeHtml(job.location) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('briefcase')
                            + MP.dom.escapeHtml(MP.formatters.experience(job.requiredExperience)) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('clock')
                            + 'Posted ' + MP.formatters.relativeTime(job.createdAt) + '</span>' +
                    '</div>' +

                    (skills.length
                        ? '<div class="chip-list mt-4">' + skills.map(function (skill) {
                                return '<span class="chip">' + MP.dom.escapeHtml(skill) + '</span>';
                            }).join('')
                            + (extra > 0 ? '<span class="chip chip--primary">+' + extra + ' more</span>' : '')
                          + '</div>'
                        : '') +

                    '<div class="job-card__footer">' +
                        (hasScore && missing > 0
                            ? '<span class="text-sm text-secondary">' + missing + ' required skill'
                                + (missing === 1 ? '' : 's') + ' missing from your profile</span>'
                            : hasScore
                                ? '<span class="text-sm text-success fw-medium">Your profile covers every required skill</span>'
                                : '<span class="text-sm text-secondary">Complete your profile to see your match score</span>') +
                        '<a class="btn btn--soft btn--sm" href="/jobseeker/job-details.html?id=' + job.id + '">'
                            + 'View details' + MP.dom.icon('arrowRight') + '</a>' +
                    '</div>' +
                '</div>' +

                (hasScore
                    ? '<div class="job-card__side">' + MP.matchScore.ring(job.matchScore) +
                        '<span class="match-pill match-pill--' + MP.matchScore.tier(job.matchScore) + '">'
                            + MP.dom.escapeHtml(MP.matchScore.tierLabel(job.matchScore)) + '</span>' +
                      '</div>'
                    : '') +
            '</article>';
    }

    function renderResults(paged) {
        if (!paged.items.length) {
            summaryElement.textContent = '';
            paginationElement.innerHTML = '';

            var hasFilters = state.search || state.location || state.minimumMatch || state.minimumExperience;
            MP.loader.empty(listElement, {
                icon: 'search',
                title: hasFilters ? 'No jobs match these filters' : 'No open vacancies right now',
                message: hasFilters
                    ? 'Try widening your search: remove the location or lower the minimum match score.'
                    : 'There are no open vacancies at the moment. Check back soon, or complete your profile so you are ready.'
            });
            return;
        }

        summaryElement.textContent = MP.formatters.number(paged.totalItems)
            + (paged.totalItems === 1 ? ' vacancy' : ' vacancies') + ' found';

        listElement.innerHTML = '<div class="list-stack">'
            + paged.items.map(jobCardHtml).join('') + '</div>';

        MP.pagination.render(paginationElement, paged, function (page) {
            state.pageNumber = page;
            load();
            MP.dom.scrollToTop();
        });
    }

    function load() {
        MP.loader.skeletonCards(listElement, 4);
        summaryElement.textContent = '';
        paginationElement.innerHTML = '';

        MP.dom.replaceQuery({
            search: state.search,
            location: state.location,
            minimumMatch: state.minimumMatch,
            minimumExperience: state.minimumExperience,
            page: state.pageNumber > 1 ? state.pageNumber : ''
        });

        MP.jobService.search(state)
            .then(function (response) {
                renderResults(MP.apiClient.toPagedResult(response.data, state.pageNumber, state.pageSize));
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load the job list.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    function readFilters() {
        var values = MP.dom.serializeForm(form);
        state.search = values.search || '';
        state.location = values.location || '';
        state.minimumMatch = values.minimumMatch || '';
        state.minimumExperience = values.minimumExperience || '';
        state.pageNumber = 1;
    }

    function applyQueryToForm() {
        state.search = MP.dom.queryParam('search', '') || '';
        state.location = MP.dom.queryParam('location', '') || '';
        state.minimumMatch = MP.dom.queryParam('minimumMatch', '') || '';
        state.minimumExperience = MP.dom.queryParam('minimumExperience', '') || '';
        state.pageNumber = MP.dom.queryParamInt('page', 1);

        form.querySelector('[name="search"]').value = state.search;
        form.querySelector('[name="location"]').value = state.location;
        form.querySelector('[name="minimumMatch"]').value = state.minimumMatch;
        form.querySelector('[name="minimumExperience"]').value = state.minimumExperience;
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Find jobs', subtitle: 'Open vacancies scored against your profile' });

        form = document.getElementById('jobFilters');
        listElement = document.getElementById('jobsList');
        paginationElement = document.getElementById('jobsPagination');
        summaryElement = document.getElementById('resultsSummary');

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

        // Typing in the keyword box searches automatically after a short pause.
        MP.dom.on(form.querySelector('[name="search"]'), 'input', MP.dom.debounce(function () {
            readFilters();
            load();
        }, 450));

        applyQueryToForm();
        load();
    });
})();
