/* MatchPoint - employer vacancy management */

(function () {
    'use strict';

    var form;
    var listElement;
    var paginationElement;
    var summaryElement;

    var state = {
        search: '',
        location: '',
        statusFilter: '',
        pageNumber: 1,
        pageSize: MP.config.DEFAULT_PAGE_SIZE
    };

    function isOpen(vacancy) {
        return String(vacancy.status).toLowerCase() === 'open';
    }

    function cardHtml(vacancy) {
        var skills = (vacancy.requiredSkills || []).slice(0, 6);
        var extra = (vacancy.requiredSkills || []).length - skills.length;
        var open = isOpen(vacancy);

        return '<article class="job-card" data-vacancy="' + vacancy.id + '">' +
                '<div class="job-card__body">' +
                    '<div class="job-card__top">' +
                        '<a class="job-card__title" href="/employer/vacancy-details.html?id=' + vacancy.id + '">'
                            + MP.dom.escapeHtml(vacancy.title) + '</a>' +
                        MP.statusBadge.vacancy(vacancy.status) +
                    '</div>' +

                    '<div class="meta-row mt-2">' +
                        '<span class="meta-row__item">' + MP.dom.icon('location')
                            + MP.dom.escapeHtml(vacancy.location) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('briefcase')
                            + MP.dom.escapeHtml(MP.formatters.experience(vacancy.requiredExperience)) + '</span>' +
                        '<span class="meta-row__item">' + MP.dom.icon('clock')
                            + 'Posted ' + MP.formatters.relativeTime(vacancy.createdAt) + '</span>' +
                    '</div>' +

                    (skills.length
                        ? '<div class="chip-list mt-4">' + skills.map(function (skill) {
                                return '<span class="chip">' + MP.dom.escapeHtml(skill) + '</span>';
                            }).join('')
                            + (extra > 0 ? '<span class="chip chip--primary">+' + extra + ' more</span>' : '')
                          + '</div>'
                        : '') +

                    '<div class="job-card__footer">' +
                        '<a class="text-sm fw-medium" href="/employer/applicants.html?vacancyId=' + vacancy.id + '">'
                            + MP.formatters.number(vacancy.applicantCount)
                            + (vacancy.applicantCount === 1 ? ' applicant' : ' applicants') + '</a>' +
                        '<div class="flex gap-2 flex-wrap">' +
                            '<a class="btn btn--secondary btn--sm" href="/employer/vacancy-form.html?id='
                                + vacancy.id + '">' + MP.dom.icon('edit') + 'Edit</a>' +
                            (open
                                ? '<button type="button" class="btn btn--danger-soft btn--sm" data-close="'
                                    + vacancy.id + '">' + MP.dom.icon('ban') + 'Close</button>'
                                : '<button type="button" class="btn btn--soft btn--sm" data-reopen="'
                                    + vacancy.id + '">' + MP.dom.icon('refresh') + 'Reopen</button>') +
                            '<a class="btn btn--primary btn--sm" href="/employer/vacancy-details.html?id='
                                + vacancy.id + '">View</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="job-card__side">' +
                    '<div class="stat-card__value">' + MP.formatters.number(vacancy.applicantCount) + '</div>' +
                    '<div class="text-xs text-secondary">applicants</div>' +
                '</div>' +
            '</article>';
    }

    function renderResults(paged) {
        // The list endpoint has no status filter, so narrow it client side.
        var items = state.statusFilter
            ? paged.items.filter(function (vacancy) {
                return String(vacancy.status).toLowerCase() === state.statusFilter.toLowerCase();
            })
            : paged.items;

        if (!items.length) {
            summaryElement.textContent = '';
            paginationElement.innerHTML = '';

            var hasFilters = state.search || state.location || state.statusFilter;
            MP.loader.empty(listElement, {
                icon: 'briefcase',
                title: hasFilters ? 'No vacancies match these filters' : 'No vacancies yet',
                message: hasFilters
                    ? 'Try clearing the filters to see every vacancy you have posted.'
                    : 'Post your first vacancy and MatchPoint will rank every applicant against your requirements.',
                actionLabel: hasFilters ? null : 'Post a vacancy',
                actionHref: hasFilters ? null : '/employer/vacancy-form.html'
            });
            return;
        }

        summaryElement.textContent = MP.formatters.number(paged.totalItems)
            + (paged.totalItems === 1 ? ' vacancy' : ' vacancies')
            + (state.statusFilter ? ' · showing ' + items.length + ' ' + state.statusFilter.toLowerCase() : '');

        listElement.innerHTML = '<div class="list-stack">' + items.map(cardHtml).join('') + '</div>';

        MP.pagination.render(paginationElement, paged, function (page) {
            state.pageNumber = page;
            load();
            MP.dom.scrollToTop();
        });

        MP.dom.qsa('[data-close]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                confirmClose(parseInt(button.getAttribute('data-close'), 10), items);
            });
        });

        MP.dom.qsa('[data-reopen]', listElement).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                reopen(parseInt(button.getAttribute('data-reopen'), 10));
            });
        });
    }

    function confirmClose(vacancyId, items) {
        var vacancy = items.filter(function (item) { return item.id === vacancyId; })[0] || {};

        MP.modal.confirm({
            title: 'Close "' + (vacancy.title || 'this vacancy') + '"?',
            message: 'The vacancy stops accepting new applications immediately. Existing applicants are '
                + 'notified and you can still review them.',
            icon: 'ban',
            tone: 'danger',
            confirmLabel: 'Close vacancy',
            confirmVariant: 'danger',
            onConfirm: function () {
                return MP.jobService.close(vacancyId)
                    .then(function (response) {
                        MP.toast.success(response.message || 'Vacancy closed successfully.');
                        load();
                    })
                    .catch(function (error) {
                        MP.toast.error(MP.apiClient.messageOf(error, 'The vacancy could not be closed.'));
                        throw error;
                    });
            }
        });
    }

    function reopen(vacancyId) {
        MP.jobService.reopen(vacancyId)
            .then(function (response) {
                MP.toast.success(response.message || 'Vacancy reopened successfully.');
                load();
            })
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'The vacancy could not be reopened.'));
            });
    }

    function load() {
        MP.loader.skeletonCards(listElement, 4);
        summaryElement.textContent = '';
        paginationElement.innerHTML = '';

        MP.dom.replaceQuery({
            search: state.search,
            location: state.location,
            status: state.statusFilter,
            page: state.pageNumber > 1 ? state.pageNumber : ''
        });

        MP.jobService.getMine(state)
            .then(function (response) {
                renderResults(MP.apiClient.toPagedResult(response.data, state.pageNumber, state.pageSize));
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load your vacancies.');
                MP.loader.error(listElement, message, load);
                MP.toast.error(message);
            });
    }

    function readFilters() {
        var values = MP.dom.serializeForm(form);
        state.search = values.search || '';
        state.location = values.location || '';
        state.statusFilter = values.statusFilter || '';
        state.pageNumber = 1;
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Vacancies', subtitle: 'Manage the roles you are hiring for' });

        form = document.getElementById('vacancyFilters');
        listElement = document.getElementById('vacancyList');
        paginationElement = document.getElementById('vacancyPagination');
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

        MP.dom.on(form.querySelector('[name="search"]'), 'input', MP.dom.debounce(function () {
            readFilters();
            load();
        }, 450));

        state.search = MP.dom.queryParam('search', '') || '';
        state.location = MP.dom.queryParam('location', '') || '';
        state.statusFilter = MP.dom.queryParam('status', '') || '';
        state.pageNumber = MP.dom.queryParamInt('page', 1);

        form.querySelector('[name="search"]').value = state.search;
        form.querySelector('[name="location"]').value = state.location;
        form.querySelector('[name="statusFilter"]').value = state.statusFilter;

        load();
    });
})();
