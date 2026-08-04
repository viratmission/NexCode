/* MatchPoint - administrator application settings */

(function () {
    'use strict';

    var container;
    var settings = null;

    function validate(values) {
        return MP.validators.collect({
            applicationName: MP.validators.required(values.applicationName, 'Application name')
                || MP.validators.maxLength(values.applicationName, 150, 'Application name'),
            defaultPageSize: MP.validators.integerInRange(values.defaultPageSize, 1, 50, 'Default page size'),
            maintenanceMessage: MP.validators.maxLength(values.maintenanceMessage, 500, 'Maintenance message')
        });
    }

    function onSubmit(event) {
        event.preventDefault();

        var form = event.currentTarget;
        var submitButton = document.getElementById('saveSettings');
        var values = MP.dom.serializeForm(form);
        var result = validate(values);

        if (!result.isValid) {
            MP.dom.applyErrors(form, result.errors);
            MP.toast.error('Please correct the highlighted fields.');
            return;
        }

        MP.dom.clearFormErrors(form);

        MP.modal.confirm({
            title: 'Save application settings?',
            message: 'These values apply to every user on the platform straight away.',
            icon: 'settings',
            tone: 'primary',
            confirmLabel: 'Save settings',
            confirmVariant: 'primary',
            onConfirm: function () {
                MP.dom.setButtonLoading(submitButton, true);

                return MP.adminService.updateSettings(values)
                    .then(function (response) {
                        settings = response.data || settings;
                        MP.toast.success(response.message || 'Application settings updated successfully.');
                        render();
                    })
                    .catch(function (error) {
                        MP.dom.setButtonLoading(submitButton, false);

                        if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                            MP.toast.error('Please correct the highlighted fields.');
                            return;
                        }

                        MP.toast.error(MP.apiClient.messageOf(error, 'The settings could not be saved.'));
                        throw error;
                    });
            }
        });
    }

    function render() {
        container.innerHTML =
            '<div class="grid grid--sidebar">' +
                '<section class="card">' +
                    '<div class="card__header">' +
                        '<div>' +
                            '<h2 class="card__title">General</h2>' +
                            '<p class="card__subtitle">Branding, paging defaults and maintenance messaging</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card__body">' +
                        '<form id="settingsForm" novalidate>' +
                            '<div class="form-grid">' +
                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="applicationName">' +
                                        'Application name <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="applicationName" ' +
                                        'name="applicationName" maxlength="150" required />' +
                                    '<span class="form-hint">Displayed in emails and platform messaging.</span>' +
                                    '<span class="form-error" data-error-for="applicationName"></span>' +
                                '</div>' +

                                '<div class="form-field">' +
                                    '<label class="form-label" for="defaultPageSize">' +
                                        'Default page size <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="number" id="defaultPageSize" ' +
                                        'name="defaultPageSize" min="1" max="50" step="1" required />' +
                                    '<span class="form-hint">Rows returned per page for lists and searches (1&ndash;50).</span>' +
                                    '<span class="form-error" data-error-for="defaultPageSize"></span>' +
                                '</div>' +

                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="maintenanceMessage">Maintenance message</label>' +
                                    '<textarea class="form-control" id="maintenanceMessage" ' +
                                        'name="maintenanceMessage" maxlength="500" ' +
                                        'placeholder="Leave blank when there is nothing to announce."></textarea>' +
                                    '<span class="form-hint">Shown to users when planned maintenance is scheduled.</span>' +
                                    '<span class="form-error" data-error-for="maintenanceMessage"></span>' +
                                '</div>' +
                            '</div>' +

                            '<div class="form-actions">' +
                                '<button type="button" class="btn btn--secondary" id="resetSettings">Reset</button>' +
                                '<button type="submit" class="btn btn--primary" id="saveSettings">Save settings</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</section>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Current configuration</h2></div>' +
                        '<div class="card__body">' +
                            '<div class="detail-list">' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Application name</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.orDash(settings.applicationName)) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Default page size</div>' +
                                    '<div class="detail-item__value">' + settings.defaultPageSize + ' rows</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Maintenance message</div>' +
                                    '<div class="detail-item__value">' +
                                        (settings.maintenanceMessage
                                            ? MP.dom.escapeHtml(settings.maintenanceMessage)
                                            : '<span class="text-secondary">None set</span>') +
                                    '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Last updated</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.formatters.dateTime(settings.updatedAt) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +

                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Matching weights</h2></div>' +
                        '<div class="card__body">' +
                            '<p class="text-sm text-secondary mb-4">Scoring weights are configured on the server ' +
                                'and always total 100.</p>' +
                            '<div class="match-breakdown">' +
                                '<div class="match-metric">' +
                                    '<div class="match-metric__head">' +
                                        '<span class="match-metric__label">Skills</span>' +
                                        '<span class="match-metric__value">60</span>' +
                                    '</div>' +
                                    '<div class="progress"><div class="progress__bar progress__bar--accent" ' +
                                        'style="width:60%"></div></div>' +
                                '</div>' +
                                '<div class="match-metric">' +
                                    '<div class="match-metric__head">' +
                                        '<span class="match-metric__label">Experience</span>' +
                                        '<span class="match-metric__value">20</span>' +
                                    '</div>' +
                                    '<div class="progress"><div class="progress__bar" style="width:20%"></div></div>' +
                                '</div>' +
                                '<div class="match-metric">' +
                                    '<div class="match-metric__head">' +
                                        '<span class="match-metric__label">Education</span>' +
                                        '<span class="match-metric__value">10</span>' +
                                    '</div>' +
                                    '<div class="progress"><div class="progress__bar progress__bar--success" ' +
                                        'style="width:10%"></div></div>' +
                                '</div>' +
                                '<div class="match-metric">' +
                                    '<div class="match-metric__head">' +
                                        '<span class="match-metric__label">Location</span>' +
                                        '<span class="match-metric__value">10</span>' +
                                    '</div>' +
                                    '<div class="progress"><div class="progress__bar progress__bar--warning" ' +
                                        'style="width:10%"></div></div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +
                '</aside>' +
            '</div>';

        var form = document.getElementById('settingsForm');
        form.querySelector('[name="applicationName"]').value = settings.applicationName || '';
        form.querySelector('[name="defaultPageSize"]').value = settings.defaultPageSize || 10;
        form.querySelector('[name="maintenanceMessage"]').value = settings.maintenanceMessage || '';

        MP.dom.on(form, 'submit', onSubmit);

        MP.dom.on(document.getElementById('resetSettings'), 'click', function () {
            render();
            MP.toast.info('Unsaved changes discarded.');
        });
    }

    function load() {
        MP.loader.spinner(container, 'Loading settings…');

        MP.adminService.getSettings()
            .then(function (response) {
                settings = response.data || {};
                render();
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load the application settings.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.ADMINISTRATOR)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Application settings', subtitle: 'Platform wide configuration' });

        container = document.getElementById('settingsContent');
        load();
    });
})();
