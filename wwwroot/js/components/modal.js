/* MatchPoint - modal dialogs and confirmation prompts */

window.MP = window.MP || {};

MP.modal = (function () {
    'use strict';

    var current = null;
    var previousFocus = null;

    function close() {
        if (!current) {
            return;
        }
        var backdrop = current;
        current = null;

        document.removeEventListener('keydown', onKeyDown);
        if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
        document.body.style.removeProperty('overflow');

        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
        previousFocus = null;
    }

    function onKeyDown(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    /**
     * Opens a modal.
     * options: { title, description, icon, tone, body, size, buttons: [{ label, variant, onClick, closeOnClick }] }
     * Returns the modal element so callers can query fields inside a custom body.
     */
    function open(options) {
        close();

        var settings = options || {};
        previousFocus = document.activeElement;

        var backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');

        var iconHtml = '';
        if (settings.icon) {
            iconHtml = '<div class="modal__icon' + (settings.tone ? ' modal__icon--' + settings.tone : '') + '">'
                + MP.dom.icon(settings.icon) + '</div>';
        }

        var buttons = settings.buttons || [];
        var buttonsHtml = buttons.map(function (button, index) {
            return '<button type="button" class="btn btn--' + (button.variant || 'secondary') + '" data-modal-button="'
                + index + '">' + MP.dom.escapeHtml(button.label) + '</button>';
        }).join('');

        backdrop.innerHTML =
            '<div class="modal' + (settings.size === 'lg' ? ' modal--lg' : '') + '">' +
                '<div class="modal__header">' +
                    iconHtml +
                    '<div class="modal__titles">' +
                        '<h2 class="modal__title">' + MP.dom.escapeHtml(settings.title || '') + '</h2>' +
                        (settings.description
                            ? '<p class="modal__description">' + MP.dom.escapeHtml(settings.description) + '</p>'
                            : '') +
                    '</div>' +
                    '<button type="button" class="modal__close" data-modal-close aria-label="Close dialog">&times;</button>' +
                '</div>' +
                (settings.body ? '<div class="modal__body">' + settings.body + '</div>' : '') +
                (buttonsHtml ? '<div class="modal__footer">' + buttonsHtml + '</div>' : '') +
            '</div>';

        backdrop.addEventListener('click', function (event) {
            if (event.target === backdrop) {
                close();
            }
        });

        backdrop.querySelector('[data-modal-close]').addEventListener('click', close);

        buttons.forEach(function (button, index) {
            var element = backdrop.querySelector('[data-modal-button="' + index + '"]');
            if (!element) {
                return;
            }
            element.addEventListener('click', function () {
                var result = button.onClick ? button.onClick(backdrop, element) : undefined;
                if (button.closeOnClick !== false && result !== false) {
                    close();
                }
            });
        });

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        current = backdrop;

        var focusTarget = backdrop.querySelector('.modal__body input, .modal__body select, .modal__body textarea')
            || backdrop.querySelector('.modal__footer .btn');
        if (focusTarget) {
            focusTarget.focus();
        }

        return backdrop;
    }

    /**
     * Confirmation dialog. Resolves true when confirmed, false otherwise.
     * The confirm button shows a spinner while an async onConfirm runs.
     */
    function confirm(options) {
        var settings = options || {};

        return new Promise(function (resolve) {
            var settled = false;

            function finish(value) {
                if (!settled) {
                    settled = true;
                    resolve(value);
                }
            }

            var backdrop = open({
                title: settings.title || 'Are you sure?',
                description: settings.message || '',
                icon: settings.icon || 'alert',
                tone: settings.tone || 'warning',
                body: settings.body,
                buttons: [
                    {
                        label: settings.cancelLabel || 'Cancel',
                        variant: 'secondary',
                        onClick: function () { finish(false); }
                    },
                    {
                        label: settings.confirmLabel || 'Confirm',
                        variant: settings.confirmVariant || 'primary',
                        closeOnClick: false,
                        onClick: function (modalRoot, button) {
                            if (!settings.onConfirm) {
                                finish(true);
                                close();
                                return;
                            }

                            MP.dom.setButtonLoading(button, true);

                            Promise.resolve(settings.onConfirm(modalRoot))
                                .then(function (result) {
                                    if (result === false) {
                                        MP.dom.setButtonLoading(button, false);
                                        return;
                                    }
                                    finish(true);
                                    close();
                                })
                                .catch(function () {
                                    MP.dom.setButtonLoading(button, false);
                                });

                            return false;
                        }
                    }
                ]
            });

            // Closing via Escape, the backdrop or the X button counts as a cancel.
            var observer = new MutationObserver(function () {
                if (!document.body.contains(backdrop)) {
                    observer.disconnect();
                    finish(false);
                }
            });
            observer.observe(document.body, { childList: true });
        });
    }

    return {
        open: open,
        close: close,
        confirm: confirm
    };
})();
