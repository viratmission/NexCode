/* MatchPoint - toast notifications */

window.MP = window.MP || {};

MP.toast = (function () {
    'use strict';

    var container = null;

    var ICONS = {
        success: 'checkCircle',
        error: 'xCircle',
        warning: 'alert',
        info: 'info'
    };

    var TITLES = {
        success: 'Success',
        error: 'Something went wrong',
        warning: 'Heads up',
        info: 'Information'
    };

    function ensureContainer() {
        if (container && document.body.contains(container)) {
            return container;
        }
        container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.setAttribute('role', 'region');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(container);
        }
        return container;
    }

    function dismiss(toast) {
        if (!toast || toast.classList.contains('is-hiding')) {
            return;
        }
        toast.classList.add('is-hiding');
        window.setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 220);
    }

    function show(type, message, options) {
        var settings = options || {};
        var kind = ICONS[type] ? type : 'info';
        var host = ensureContainer();

        var toast = document.createElement('div');
        toast.className = 'toast toast--' + kind;
        toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');

        toast.innerHTML =
            MP.dom.icon(ICONS[kind], 'toast__icon') +
            '<div class="toast__content">' +
                '<div class="toast__title">' + MP.dom.escapeHtml(settings.title || TITLES[kind]) + '</div>' +
                (message ? '<div class="toast__message">' + MP.dom.escapeHtml(message) + '</div>' : '') +
            '</div>' +
            '<button type="button" class="toast__close" aria-label="Dismiss notification">&times;</button>';

        toast.querySelector('.toast__close').addEventListener('click', function () {
            dismiss(toast);
        });

        host.appendChild(toast);

        var duration = settings.duration === undefined
            ? (kind === 'error' ? 6500 : 4200)
            : settings.duration;

        if (duration > 0) {
            window.setTimeout(function () {
                dismiss(toast);
            }, duration);
        }

        return toast;
    }

    function clear() {
        if (container) {
            MP.dom.qsa('.toast', container).forEach(dismiss);
        }
    }

    return {
        success: function (message, options) { return show('success', message, options); },
        error: function (message, options) { return show('error', message, options); },
        warning: function (message, options) { return show('warning', message, options); },
        info: function (message, options) { return show('info', message, options); },
        show: show,
        clear: clear
    };
})();
