/* MatchPoint - pagination control for paged API results */

window.MP = window.MP || {};

MP.pagination = (function () {
    'use strict';

    /** Builds the visible page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
    function buildPages(current, total) {
        var pages = [];

        if (total <= 7) {
            for (var i = 1; i <= total; i++) {
                pages.push(i);
            }
            return pages;
        }

        pages.push(1);

        var start = Math.max(2, current - 1);
        var end = Math.min(total - 1, current + 1);

        if (current <= 3) {
            start = 2;
            end = 4;
        } else if (current >= total - 2) {
            start = total - 3;
            end = total - 1;
        }

        if (start > 2) {
            pages.push('…');
        }

        for (var page = start; page <= end; page++) {
            pages.push(page);
        }

        if (end < total - 1) {
            pages.push('…');
        }

        pages.push(total);

        return pages;
    }

    /**
     * Renders pagination into `target`.
     * result: { pageNumber, pageSize, totalItems, totalPages }
     * onChange(pageNumber) fires when the user picks a different page.
     */
    function render(target, result, onChange) {
        var element = typeof target === 'string' ? MP.dom.qs(target) : target;
        if (!element) {
            return;
        }

        var paged = result || {};
        var totalPages = Number(paged.totalPages) || 0;
        var current = Number(paged.pageNumber) || 1;
        var pageSize = Number(paged.pageSize) || MP.config.DEFAULT_PAGE_SIZE;
        var totalItems = Number(paged.totalItems) || 0;

        if (totalItems === 0) {
            element.innerHTML = '';
            element.classList.add('hidden');
            return;
        }

        element.classList.remove('hidden');

        var first = (current - 1) * pageSize + 1;
        var last = Math.min(current * pageSize, totalItems);

        var controls = '';

        if (totalPages > 1) {
            controls += '<button type="button" class="pagination__button" data-page="' + (current - 1) + '"'
                + (current <= 1 ? ' disabled' : '') + ' aria-label="Previous page">'
                + MP.dom.icon('chevronLeft') + '</button>';

            buildPages(current, totalPages).forEach(function (page) {
                if (page === '…') {
                    controls += '<span class="pagination__ellipsis">…</span>';
                } else {
                    controls += '<button type="button" class="pagination__button'
                        + (page === current ? ' is-active' : '') + '" data-page="' + page + '"'
                        + (page === current ? ' aria-current="page"' : '') + '>' + page + '</button>';
                }
            });

            controls += '<button type="button" class="pagination__button" data-page="' + (current + 1) + '"'
                + (current >= totalPages ? ' disabled' : '') + ' aria-label="Next page">'
                + MP.dom.icon('chevronRight') + '</button>';
        }

        element.innerHTML =
            '<div class="pagination">' +
                '<span class="pagination__summary">Showing <strong>' + first + '–' + last
                    + '</strong> of <strong>' + MP.formatters.number(totalItems) + '</strong></span>' +
                (controls ? '<div class="pagination__controls">' + controls + '</div>' : '') +
            '</div>';

        if (typeof onChange === 'function') {
            MP.dom.qsa('[data-page]', element).forEach(function (button) {
                button.addEventListener('click', function () {
                    var page = parseInt(button.getAttribute('data-page'), 10);
                    if (!isNaN(page) && page >= 1 && page <= totalPages && page !== current) {
                        onChange(page);
                    }
                });
            });
        }
    }

    return {
        render: render,
        buildPages: buildPages
    };
})();
