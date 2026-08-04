/* MatchPoint - registration page (job seeker or employer) */

(function () {
    'use strict';

    var form;
    var submitButton;
    var alertBox;
    var companyField;
    var selectedRole = MP.config.ROLES.JOB_SEEKER;

    function showAlert(message) {
        if (!alertBox) {
            return;
        }
        alertBox.innerHTML = MP.dom.icon('alert') + '<span>' + MP.dom.escapeHtml(message) + '</span>';
        alertBox.classList.remove('hidden');
    }

    function hideAlert() {
        if (alertBox) {
            alertBox.classList.add('hidden');
        }
    }

    function isEmployer() {
        return selectedRole === MP.config.ROLES.EMPLOYER;
    }

    function selectRole(role) {
        selectedRole = role;

        MP.dom.qsa('[data-role-option]').forEach(function (option) {
            var isSelected = option.getAttribute('data-role-option') === role;
            option.classList.toggle('is-selected', isSelected);
            var radio = option.querySelector('input');
            if (radio) {
                radio.checked = isSelected;
            }
        });

        MP.dom.toggle(companyField, isEmployer());

        var companyInput = document.getElementById('companyName');
        if (companyInput) {
            companyInput.required = isEmployer();
            if (!isEmployer()) {
                companyInput.value = '';
                MP.dom.setFieldError(form, 'companyName', null);
            }
        }
    }

    function validate(values) {
        var checks = {
            fullName: MP.validators.required(values.fullName, 'Full name')
                || MP.validators.maxLength(values.fullName, 150, 'Full name'),
            email: MP.validators.email(values.email),
            password: MP.validators.password(values.password),
            confirmPassword: MP.validators.matches(values.confirmPassword, values.password, 'Password confirmation')
        };

        if (isEmployer()) {
            checks.companyName = MP.validators.required(values.companyName, 'Company name')
                || MP.validators.maxLength(values.companyName, 200, 'Company name');
        }

        return MP.validators.collect(checks);
    }

    function onSubmit(event) {
        event.preventDefault();
        hideAlert();

        var values = MP.dom.serializeForm(form);
        var result = validate(values);

        if (!result.isValid) {
            MP.dom.applyErrors(form, result.errors);
            return;
        }

        MP.dom.clearFormErrors(form);
        MP.dom.setButtonLoading(submitButton, true);

        var request = isEmployer()
            ? MP.authService.registerEmployer(values)
            : MP.authService.registerJobSeeker(values);

        request
            .then(function (response) {
                var user = response.data && response.data.user;

                if (!user) {
                    throw new MP.ApiError(500, 'Your account was created but sign in details were not returned.');
                }

                MP.toast.success('Welcome to MatchPoint, ' + user.fullName + '.');
                window.location.replace(MP.config.homeForRole(user.role));
            })
            .catch(function (error) {
                MP.dom.setButtonLoading(submitButton, false);

                if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                    MP.toast.error('Please correct the highlighted fields.');
                    return;
                }

                if (error.isConflict) {
                    MP.dom.setFieldError(form, 'email', error.message || 'That email address is already registered.');
                }

                var message = MP.apiClient.messageOf(error, 'We could not create your account. Please try again.');
                showAlert(message);
                MP.toast.error(message);
            });
    }

    function wirePasswordToggles() {
        MP.dom.qsa('[data-toggle-password]').forEach(function (button) {
            button.innerHTML = MP.dom.icon('eye');

            MP.dom.on(button, 'click', function () {
                var input = document.getElementById(button.getAttribute('data-toggle-password'));
                if (!input) {
                    return;
                }
                var isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                button.innerHTML = MP.dom.icon(isPassword ? 'eyeOff' : 'eye');
                button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        });
    }

    MP.dom.ready(function () {
        if (MP.authGuard.redirectIfAuthenticated()) {
            return;
        }

        form = document.getElementById('registerForm');
        submitButton = document.getElementById('registerSubmit');
        alertBox = document.getElementById('registerAlert');
        companyField = document.getElementById('companyNameField');

        MP.dom.qsa('[data-role-option]').forEach(function (option) {
            MP.dom.on(option, 'click', function () {
                selectRole(option.getAttribute('data-role-option'));
            });
        });

        // Deep link support: /register.html?role=Employer
        var requestedRole = MP.dom.queryParam('role');
        selectRole(requestedRole === MP.config.ROLES.EMPLOYER
            ? MP.config.ROLES.EMPLOYER
            : MP.config.ROLES.JOB_SEEKER);

        MP.dom.on(form, 'submit', onSubmit);
        wirePasswordToggles();

        var nameInput = form.querySelector('[name="fullName"]');
        if (nameInput) {
            nameInput.focus();
        }
    });
})();
