/* MatchPoint - loading, empty and error state renderers */

window.MP = window.MP || {};

MP.loader = (function () {
    'use strict';

    function resolve(target) {
        return typeof target === 'string' ? MP.dom.qs(target) : target;
    }

    /** Centered spinner, used while a page's primary request is in flight. */
    function spinner(target, message) {
        var element = resolve(target);
        if (!element) {
            return;
        }
        element.innerHTML =
            '<div class="state">' +
                '<div class="spinner" role="status" aria-label="Loading"></div>' +
                (message ? '<p class="state__message mt-3">' + MP.dom.escapeHtml(message) + '</p>' : '') +
            '</div>';
    }

    /** Shimmer placeholders that mimic the shape of the content being loaded. */
    function skeletonRows(target, count) {
        var element = resolve(target);
        if (!element) {
            return;
        }
        var rows = '';
        for (var i = 0; i < (count || 4); i++) {
            rows += '<div class="skeleton skeleton--row"></div>';
        }
        element.innerHTML = '<div style="padding:16px">' + rows + '</div>';
    }

    function skeletonCards(target, count) {
        var element = resolve(target);
        if (!element) {
            return;
        }
        var cards = '';
        for (var i = 0; i < (count || 3); i++) {
            cards += '<div class="skeleton skeleton--card"></div>';
        }
        element.innerHTML = '<div class="list-stack">' + cards + '</div>';
    }

    function skeletonStats(target, count) {
        var element = resolve(target);
        if (!element) {
            return;
        }
        var cards = '';
        for (var i = 0; i < (count || 4); i++) {
            cards += '<div class="skeleton" style="height:96px;border-radius:14px"></div>';
        }
        element.innerHTML = cards;
    }

    function empty(target, options) {
        var element = resolve(target);
        if (!element) {
            return;
        }
        var settings = options || {};
        var actionHtml = '';

        if (settings.actionLabel && settings.actionHref) {
            actionHtml = '<a class="btn btn--primary mt-2" href="' + settings.actionHref + '">'
                + MP.dom.escapeHtml(settings.actionLabel) + '</a>';
        } else if (settings.actionLabel && settings.actionId) {
            actionHtml = '<button type="button" class="btn btn--primary mt-2" id="'
                + settings.actionId + '">' + MP.dom.escapeHtml(settings.actionLabel) + '</button>';
        }

        element.innerHTML =
            '<div class="state">' +
                '<div class="state__icon">' + MP.dom.icon(settings.icon || 'inbox') + '</div>' +
                '<h3 class="state__title">' + MP.dom.escapeHtml(settings.title || 'Nothing here yet') + '</h3>' +
                '<p class="state__message">' + MP.dom.escapeHtml(settings.message || '') + '</p>' +
                actionHtml +
            '</div>';
    }

    /**
     * Error state with an optional retry button.
     * `onRetry` is wired up directly so callers don't have to manage ids.
     */
    function error(target, message, onRetry) {
        var element = resolve(target);
        if (!element) {
            return;
        }

        element.innerHTML =
            '<div class="state">' +
                '<div class="state__icon state__icon--danger">' + MP.dom.icon('alert') + '</div>' +
                '<h3 class="state__title">We could not load this</h3>' +
                '<p class="state__message">' + MP.dom.escapeHtml(message || 'An unexpected error occurred. Please try again.') + '</p>' +
                (onRetry ? '<button type="button" class="btn btn--secondary mt-2" data-retry>'
                    + MP.dom.icon('refresh') + 'Try again</button>' : '') +
            '</div>';

        if (onRetry) {
            var button = element.querySelector('[data-retry]');
            if (button) {
                button.addEventListener('click', onRetry);
            }
        }
    }

    var overlayElement = null;

    function showOverlay() {
        if (overlayElement) {
            return;
        }
        overlayElement = document.createElement('div');
        overlayElement.className = 'page-loader';
        overlayElement.innerHTML = '<div class="spinner" role="status" aria-label="Loading"></div>';
        document.body.appendChild(overlayElement);
    }

    function hideOverlay() {
        if (overlayElement && overlayElement.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
        }
        overlayElement = null;
    }

    return {
        spinner: spinner,
        skeletonRows: skeletonRows,
        skeletonCards: skeletonCards,
        skeletonStats: skeletonStats,
        empty: empty,
        error: error,
        showOverlay: showOverlay,
        hideOverlay: hideOverlay
    };
})();
