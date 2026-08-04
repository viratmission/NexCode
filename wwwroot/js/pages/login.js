/* MatchPoint - sign in page */

(function () {
    'use strict';

    var form;
    var submitButton;
    var alertBox;

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

    function validate(values) {
        return MP.validators.collect({
            email: MP.validators.email(values.email),
            password: MP.validators.required(values.password, 'Password')
        });
    }

    /** Honours ?returnUrl= so guards can send users back where they were. */
    function destinationFor(user) {
        var returnUrl = MP.dom.queryParam('returnUrl');

        if (returnUrl && returnUrl.charAt(0) === '/' && returnUrl.indexOf('//') !== 0) {
            var isPublic = /(login|register|unauthorized|forbidden|not-found|index)\.html/.test(returnUrl);
            if (!isPublic) {
                return returnUrl;
            }
        }

        return MP.config.homeForRole(user.role);
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

        MP.authService.login(values.email, values.password)
            .then(function (response) {
                var user = response.data && response.data.user;

                if (!user) {
                    throw new MP.ApiError(500, 'Sign in succeeded but no account details were returned.');
                }

                if (user.isActive === false) {
                    MP.tokenManager.clear();
                    throw new MP.ApiError(403, 'This account has been disabled. Contact an administrator.');
                }

                MP.toast.success('Signed in as ' + user.fullName + '.');
                window.location.replace(destinationFor(user));
            })
            .catch(function (error) {
                MP.dom.setButtonLoading(submitButton, false);

                if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                    return;
                }

                var message = error.status === 401
                    ? 'Incorrect email or password. Please try again.'
                    : MP.apiClient.messageOf(error, 'We could not sign you in. Please try again.');

                showAlert(message);
                MP.toast.error(message);
            });
    }

    function wirePasswordToggle() {
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

    function wireDemoAccounts() {
        MP.dom.qsa('[data-demo-email]').forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                form.querySelector('[name="email"]').value = button.getAttribute('data-demo-email');
                form.querySelector('[name="password"]').value = button.getAttribute('data-demo-password');
                MP.dom.clearFormErrors(form);
                hideAlert();
                submitButton.focus();
            });
        });
    }

    MP.dom.ready(function () {
        if (MP.authGuard.redirectIfAuthenticated()) {
            return;
        }

        form = document.getElementById('loginForm');
        submitButton = document.getElementById('loginSubmit');
        alertBox = document.getElementById('loginAlert');

        MP.dom.on(form, 'submit', onSubmit);
        wirePasswordToggle();
        wireDemoAccounts();

        // Coming back from a guard means the previous session ended.
        if (MP.dom.queryParam('returnUrl')) {
            showAlert('Please sign in to continue.');
        }

        var emailInput = form.querySelector('[name="email"]');
        if (emailInput) {
            emailInput.focus();
        }
    });
})();
