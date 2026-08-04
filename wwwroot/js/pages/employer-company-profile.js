/* MatchPoint - employer company profile editor */

(function () {
    'use strict';

    var container;
    var profile = null;

    function validate(values) {
        return MP.validators.collect({
            companyName: MP.validators.required(values.companyName, 'Company name')
                || MP.validators.maxLength(values.companyName, 200, 'Company name'),
            industry: MP.validators.required(values.industry, 'Industry')
                || MP.validators.maxLength(values.industry, 150, 'Industry'),
            location: MP.validators.required(values.location, 'Location')
                || MP.validators.maxLength(values.location, 150, 'Location'),
            description: MP.validators.maxLength(values.description, 2000, 'Description')
        });
    }

    function onSubmit(event) {
        event.preventDefault();

        var form = event.currentTarget;
        var submitButton = document.getElementById('saveProfile');
        var values = MP.dom.serializeForm(form);
        var result = validate(values);

        if (!result.isValid) {
            MP.dom.applyErrors(form, result.errors);
            MP.toast.error('Please correct the highlighted fields.');
            return;
        }

        MP.dom.clearFormErrors(form);
        MP.dom.setButtonLoading(submitButton, true);

        MP.employerService.updateProfile(values)
            .then(function (response) {
                profile = response.data || profile;
                MP.toast.success(response.message || 'Company profile updated successfully.');
                render();
            })
            .catch(function (error) {
                if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                    MP.toast.error('Please correct the highlighted fields.');
                    return;
                }
                MP.toast.error(MP.apiClient.messageOf(error, 'Your company profile could not be saved.'));
            })
            .then(function () {
                MP.dom.setButtonLoading(submitButton, false);
            });
    }

    function render() {
        container.innerHTML =
            '<div class="grid grid--sidebar">' +
                '<section class="card">' +
                    '<div class="card__header">' +
                        '<div>' +
                            '<h2 class="card__title">Company details</h2>' +
                            '<p class="card__subtitle">Shown to every candidate who views your vacancies</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card__body">' +
                        '<form id="companyForm" novalidate>' +
                            '<div class="form-grid">' +
                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="companyName">' +
                                        'Company name <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="companyName" name="companyName" ' +
                                        'maxlength="200" placeholder="e.g. Acme Technologies" required />' +
                                    '<span class="form-error" data-error-for="companyName"></span>' +
                                '</div>' +

                                '<div class="form-field">' +
                                    '<label class="form-label" for="industry">' +
                                        'Industry <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="industry" name="industry" ' +
                                        'maxlength="150" placeholder="e.g. Software & IT Services" required />' +
                                    '<span class="form-error" data-error-for="industry"></span>' +
                                '</div>' +

                                '<div class="form-field">' +
                                    '<label class="form-label" for="location">' +
                                        'Head office location <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="location" name="location" ' +
                                        'maxlength="150" placeholder="e.g. Bengaluru, India" required />' +
                                    '<span class="form-error" data-error-for="location"></span>' +
                                '</div>' +

                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="description">About the company</label>' +
                                    '<textarea class="form-control" id="description" name="description" ' +
                                        'maxlength="2000" style="min-height:160px" ' +
                                        'placeholder="What does your company do, and what is it like to work there?"></textarea>' +
                                    '<span class="form-error" data-error-for="description"></span>' +
                                '</div>' +
                            '</div>' +

                            '<div class="form-actions">' +
                                '<button type="button" class="btn btn--secondary" id="resetProfile">Reset</button>' +
                                '<button type="submit" class="btn btn--primary" id="saveProfile">Save changes</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</section>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="profile-hero">' +
                            '<span class="avatar avatar--xl" aria-hidden="true">'
                                + MP.dom.escapeHtml(MP.formatters.initials(profile.companyName)) + '</span>' +
                            '<div class="profile-hero__info">' +
                                '<div class="profile-hero__name">'
                                    + MP.dom.escapeHtml(profile.companyName || 'Your company') + '</div>' +
                                '<div class="profile-hero__title">'
                                    + MP.dom.escapeHtml(MP.formatters.orDash(profile.industry)) + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card__body" style="border-top:1px solid var(--color-border)">' +
                            '<div class="detail-list">' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Account holder</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(profile.fullName) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Email</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(profile.email) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Location</div>' +
                                    '<div class="detail-item__value">'
                                        + MP.dom.escapeHtml(MP.formatters.orDash(profile.location)) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +

                    '<div class="alert alert--info">' + MP.dom.icon('info') +
                        '<span>A clear company description and accurate location help candidates decide whether ' +
                        'to apply, and the location feeds into their match score.</span>' +
                    '</div>' +
                '</aside>' +
            '</div>';

        var form = document.getElementById('companyForm');
        form.querySelector('[name="companyName"]').value = profile.companyName || '';
        form.querySelector('[name="industry"]').value = profile.industry || '';
        form.querySelector('[name="location"]').value = profile.location || '';
        form.querySelector('[name="description"]').value = profile.description || '';

        MP.dom.on(form, 'submit', onSubmit);

        MP.dom.on(document.getElementById('resetProfile'), 'click', function () {
            render();
            MP.toast.info('Unsaved changes discarded.');
        });
    }

    function load() {
        MP.loader.spinner(container, 'Loading company profile…');

        MP.employerService.getProfile()
            .then(function (response) {
                profile = response.data || {};
                render();
                MP.header.setTitle('Company profile', profile.companyName);
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load your company profile.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'Company profile', subtitle: 'How candidates see your organisation' });

        container = document.getElementById('profileContent');
        load();
    });
})();
