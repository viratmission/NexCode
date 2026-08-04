/* MatchPoint - employer applicant list across all vacancies */

(function () {
    'use strict';

    var form;
    var listElement;
    var paginationElement;
    var summaryElement;
    var vacancySelect;

    var state = {
        vacancyId: '',
        status: '',
        pageNumber: 1,
        pageSize: MP.config.DEFAULT_PAGE_SIZE
    };

    function cardHtml(applicant) {
        var isTopThree = applicant.rank && applicant.rank <= 3;
        var matched = (applicant.matchedSkills || []).slice(0, 4);
        var missing = (applicant.missingSkills || []).length;

        return '<article class="applicant-card">' +
                '<span class="applicant-card__rank' + (isTopThree ? ' applicant-card__rank--top' : '') + '">'
                    + (applicant.rank || '–') + '</span>' +

                '<span class="avatar avatar--lg" aria-hidden="true">'
                    + MP.dom.escapeHtml(MP.formatters.initials(applicant.candidateName)) + '</span>' +

                '<div class="applicant-card__body">' +
                    '<div class="flex items-center gap-3 flex-wrap">' +
                        '<a class="applicant-card__name" href="/employer/applicant-details.html?id='
                            + applicant.applicationId + '">' + MP.dom.escapeHtml(applicant.candidateName) + '</a>' +
                        MP.statusBadge.application(applicant.applicationStatus) +
                    '</div>' +
                    '<div class="applicant-card__title">' + MP.dom.escapeHtml(applicant.professionalTitle) + '</div>' +

                    '<div class="meta-row mt-2">' +
                        '<span class="meta-row__item">' + MP.dom.icon('briefcase')
                            + MP.dom.escapeHtml(applicant.jobTitle) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('location')
                            + MP.dom.escapeHtml(applicant.location) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('clock')
                            + MP.dom.escapeHtml(MP.formatters.experienceShort(applicant.experience))
                            + ' experience</span>' +
                    '</div>' +

                    (matched.length
                        ? '<div class="chip-list mt-3">' + matched.map(function (skill) {
                                return '<span class="chip chip--success">' + MP.dom.escapeHtml(skill) + '</span>';
                            }).join('')
                            + (missing > 0
                                ? '<span class="chip chip--danger">' + missing + ' missing</span>'
                                : '')
                          + '</div>'
                        : '') +
                '</div>' +

                '<div class="applicant-card__side">' +
                    MP.matchScore.ring(applicant.matchScore, 'sm') +
                    '<a class="btn btn--secondary btn--sm" href="/employer/applicant-details.html?id='
                        + applicant.applicationId + '">Review</a>' +
                '</div>' +
            '</article>';
    }

    function renderResults(paged) {
        if (!paged.items.length) {
            summaryElement.textContent = '';
            paginationElement.innerHTML = '';

            var hasFilters = state.vacancyId || state.status;
            MP.loader.empty(listElement, {
                icon: 'users',
                title: hasFilters ? 'No applicants match these filters' : 'No applicants yet',
                message: hasFilters
                    ? 'Try selecting a different vacancy or clearing the status filter.'
                    : 'Once candidates apply to your vacancies they appear here, ranked by match score.',
                actionLabel: hasFilters ? null : 'Post a vacancy',
                actionHref: hasFilters ? null : '/employer/vacancy-form.html'
            });
            return;
        }

        summaryElement.textContent = MP.formatters.number(paged.totalItems)
            + (paged.totalItems === 1 ? ' applicant' : ' applicants') + ' found';

        listElement.innerHTML = '<div class="list-stack">'
            + paged.items.map(cardHtml).join('') + '</div>';

        MP.pagination.render(paginationElement, paged, function (page) {
            state.pageNumber = page;
            load();
            MP.dom.scrollToTop();
        });
    }

    function loadVacancyOptions() {
        return MP.jobService.getMine({ pageNumber: 1, pageSize: 100 })
            .then(function (response) {
                var paged = MP.apiClient.toPagedResult(response.data, 1, 100);

                paged.items.forEach(function (vacancy) {
                    var option = document.createElement('option');
                    option.value = vacancy.id;
                    option.textContent = vacancy.title + ' · ' + vacancy.location;
                    vacancySelect.appendChild(option);
                });

                vacancySelect.value = state.vacancyId || '';
            })
            .catch(function () {
                // The filter is optional; the list still works without vacancy options.
            });
    }

    function load() {
        MP.loader.skeletonCards(listElement, 4);
        summaryElement.textContent = '';
        paginationElement.innerHTML = '';

        MP.dom.replaceQuery({
            vacancyId: state.vacancyId,
            status: state.status,
            page: state.pageNumber > 1 ? state.pageNumber : ''
        });

        MP.applicationService.list(state)
            .then(function (response) {
                var paged = MP.apiClient.toPagedResult(response.data, state.pageNumber, state.pageSize);

                // `rank` is a position in the full result set, so keep the server's numbering.
                MP.matchScore.rank(paged.items, { renumber: false });

                renderResults(paged);
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load your applicants.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    function readFilters() {
        var values = MP.dom.serializeForm(form);
        state.vacancyId = values.vacancyId || '';
        state.status = values.status || '';
        state.pageNumber = 1;
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Applicants', subtitle: 'Ranked candidates across your vacancies' });

        form = document.getElementById('applicantFilters');
        listElement = document.getElementById('applicantList');
        paginationElement = document.getElementById('applicantPagination');
        summaryElement = document.getElementById('resultsSummary');
        vacancySelect = document.getElementById('vacancyId');

        state.vacancyId = MP.dom.queryParam('vacancyId', '') || '';
        state.status = MP.dom.queryParam('status', '') || '';
        state.pageNumber = MP.dom.queryParamInt('page', 1);

        form.querySelector('[name="status"]').value = state.status;

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

        MP.dom.on(vacancySelect, 'change', function () {
            readFilters();
            load();
        });

        MP.dom.on(form.querySelector('[name="status"]'), 'change', function () {
            readFilters();
            load();
        });

        loadVacancyOptions();
        load();
    });
})();
