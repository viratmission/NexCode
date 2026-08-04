/* MatchPoint - create and edit a vacancy */

(function () {
    'use strict';

    var container;
    var vacancyId = null;
    var skills = [];

    var SUGGESTED_SKILLS = [
        'C#', 'ASP.NET Core', 'SQL Server', 'Entity Framework', 'JavaScript',
        'React', 'TypeScript', 'Azure', 'Docker', 'REST APIs'
    ];

    function isEdit() {
        return vacancyId !== null;
    }

    /* ---------- Skills ---------- */

    function renderSkills() {
        var host = document.getElementById('skillChips');
        if (!host) {
            return;
        }

        host.innerHTML = skills.map(function (skill, index) {
            return '<span class="chip chip--primary">' + MP.dom.escapeHtml(skill) +
                '<button type="button" class="chip__remove" data-remove-skill="' + index
                + '" aria-label="Remove ' + MP.dom.escapeHtml(skill) + '">&times;</button></span>';
        }).join('');

        MP.dom.qsa('[data-remove-skill]', host).forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                skills.splice(parseInt(button.getAttribute('data-remove-skill'), 10), 1);
                renderSkills();
                updateSkillHint();
            });
        });
    }

    function updateSkillHint() {
        var hint = document.getElementById('skillHint');
        if (hint) {
            hint.textContent = skills.length === 0
                ? 'At least one required skill is needed.'
                : skills.length + (skills.length === 1 ? ' skill added' : ' skills added')
                    + ' · skills carry 60% of each applicant\'s match score';
        }
    }

    function addSkill(rawValue) {
        var value = String(rawValue || '').trim().replace(/,+$/, '').trim();
        if (!value) {
            return;
        }

        var exists = skills.some(function (skill) {
            return skill.toLowerCase() === value.toLowerCase();
        });

        if (exists) {
            MP.toast.info('"' + value + '" has already been added.');
            return;
        }

        skills.push(value);
        renderSkills();
        updateSkillHint();
        MP.dom.setFieldError(document.getElementById('vacancyForm'), 'skillInput', null);
    }

    /* ---------- Validation ---------- */

    function validate(values) {
        var checks = {
            title: MP.validators.required(values.title, 'Job title')
                || MP.validators.maxLength(values.title, 200, 'Job title'),
            description: MP.validators.required(values.description, 'Description')
                || MP.validators.maxLength(values.description, 5000, 'Description'),
            location: MP.validators.required(values.location, 'Location')
                || MP.validators.maxLength(values.location, 150, 'Location'),
            requiredExperience: MP.validators.integerInRange(values.requiredExperience, 0, 50, 'Required experience'),
            educationRequirement: MP.validators.maxLength(values.educationRequirement, 200, 'Education requirement'),
            skillInput: MP.validators.nonEmptyList(skills, 'required skill')
        };

        return MP.validators.collect(checks);
    }

    function onSubmit(event) {
        event.preventDefault();

        var form = event.currentTarget;
        var submitButton = document.getElementById('saveVacancy');
        var values = MP.dom.serializeForm(form);
        var result = validate(values);

        if (!result.isValid) {
            MP.dom.applyErrors(form, result.errors);
            MP.toast.error('Please correct the highlighted fields.');
            return;
        }

        MP.dom.clearFormErrors(form);
        MP.dom.setButtonLoading(submitButton, true);

        values.requiredSkills = skills;

        var request = isEdit()
            ? MP.jobService.update(vacancyId, values)
            : MP.jobService.create(values);

        request
            .then(function (response) {
                var vacancy = response.data || {};
                MP.toast.success(response.message
                    || (isEdit() ? 'Vacancy updated successfully.' : 'Vacancy created successfully.'));
                window.location.href = '/employer/vacancy-details.html?id=' + (vacancy.id || vacancyId);
            })
            .catch(function (error) {
                MP.dom.setButtonLoading(submitButton, false);

                if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                    MP.toast.error('Please correct the highlighted fields.');
                    return;
                }

                MP.toast.error(MP.apiClient.messageOf(error, 'The vacancy could not be saved.'));
            });
    }

    /* ---------- Render ---------- */

    function render(vacancy) {
        container.innerHTML =
            '<div class="grid grid--sidebar">' +
                '<section class="card">' +
                    '<div class="card__header">' +
                        '<div>' +
                            '<h2 class="card__title">Vacancy details</h2>' +
                            '<p class="card__subtitle">These fields feed directly into applicant scoring</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card__body">' +
                        '<form id="vacancyForm" novalidate>' +
                            '<div class="form-grid">' +
                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="title">' +
                                        'Job title <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="title" name="title" ' +
                                        'maxlength="200" placeholder="e.g. Senior Backend Engineer" required />' +
                                    '<span class="form-error" data-error-for="title"></span>' +
                                '</div>' +

                                '<div class="form-field">' +
                                    '<label class="form-label" for="location">' +
                                        'Location <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="text" id="location" name="location" ' +
                                        'maxlength="150" placeholder="e.g. Chennai or Remote" required />' +
                                    '<span class="form-hint">Include "Remote" to score every candidate fully on location.</span>' +
                                    '<span class="form-error" data-error-for="location"></span>' +
                                '</div>' +

                                '<div class="form-field">' +
                                    '<label class="form-label" for="requiredExperience">' +
                                        'Required experience (years) <span class="form-label__required">*</span></label>' +
                                    '<input class="form-control" type="number" id="requiredExperience" ' +
                                        'name="requiredExperience" min="0" max="50" step="1" value="0" required />' +
                                    '<span class="form-error" data-error-for="requiredExperience"></span>' +
                                '</div>' +

                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="educationRequirement">Education requirement</label>' +
                                    '<input class="form-control" type="text" id="educationRequirement" ' +
                                        'name="educationRequirement" maxlength="200" ' +
                                        'placeholder="e.g. Bachelor degree in Computer Science" />' +
                                    '<span class="form-hint">Leave blank if education is not a factor.</span>' +
                                    '<span class="form-error" data-error-for="educationRequirement"></span>' +
                                '</div>' +

                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="description">' +
                                        'Description <span class="form-label__required">*</span></label>' +
                                    '<textarea class="form-control" id="description" name="description" ' +
                                        'maxlength="5000" style="min-height:200px" ' +
                                        'placeholder="Describe the role, the team and what success looks like." required></textarea>' +
                                    '<span class="form-error" data-error-for="description"></span>' +
                                '</div>' +

                                '<div class="form-field form-field--full">' +
                                    '<label class="form-label" for="skillInput">' +
                                        'Required skills <span class="form-label__required">*</span></label>' +
                                    '<div class="skills-input">' +
                                        '<div class="skills-input__chips" id="skillChips"></div>' +
                                        '<div class="skills-input__row">' +
                                            '<input class="skills-input__field" type="text" id="skillInput" ' +
                                                'name="skillInput" placeholder="Type a skill and press Enter" />' +
                                            '<button type="button" class="btn btn--soft btn--sm" id="addSkill">'
                                                + MP.dom.icon('plus') + 'Add</button>' +
                                        '</div>' +
                                    '</div>' +
                                    '<span class="form-hint" id="skillHint"></span>' +
                                    '<span class="form-error" data-error-for="skillInput"></span>' +
                                '</div>' +
                            '</div>' +

                            '<div class="form-actions form-actions--between">' +
                                '<a class="btn btn--ghost" href="/employer/vacancies.html">Cancel</a>' +
                                '<button type="submit" class="btn btn--primary" id="saveVacancy">'
                                    + (isEdit() ? 'Save changes' : 'Publish vacancy') + '</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</section>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="card__header"><h2 class="card__title">Suggested skills</h2></div>' +
                        '<div class="card__body">' +
                            '<p class="text-sm text-secondary mb-3">Click to add a commonly requested skill.</p>' +
                            '<div class="chip-list">' + SUGGESTED_SKILLS.map(function (skill) {
                                return '<button type="button" class="chip" data-suggest="'
                                    + MP.dom.escapeHtml(skill) + '">' + MP.dom.icon('plus')
                                    + MP.dom.escapeHtml(skill) + '</button>';
                            }).join('') + '</div>' +
                        '</div>' +
                    '</section>' +

                    '<div class="alert alert--info">' + MP.dom.icon('info') +
                        '<span>Match scores weight <strong>skills 60</strong>, <strong>experience 20</strong>, ' +
                        '<strong>education 10</strong> and <strong>location 10</strong>. Listing precise skills ' +
                        'produces the most useful ranking.</span>' +
                    '</div>' +
                '</aside>' +
            '</div>';

        var form = document.getElementById('vacancyForm');

        if (vacancy) {
            form.querySelector('[name="title"]').value = vacancy.title || '';
            form.querySelector('[name="location"]').value = vacancy.location || '';
            form.querySelector('[name="requiredExperience"]').value = vacancy.requiredExperience || 0;
            form.querySelector('[name="educationRequirement"]').value = vacancy.educationRequirement || '';
            form.querySelector('[name="description"]').value = vacancy.description || '';
        }

        renderSkills();
        updateSkillHint();

        MP.dom.on(form, 'submit', onSubmit);

        var skillInput = document.getElementById('skillInput');

        MP.dom.on(skillInput, 'keydown', function (event) {
            if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addSkill(skillInput.value);
                skillInput.value = '';
            } else if (event.key === 'Backspace' && skillInput.value === '' && skills.length) {
                skills.pop();
                renderSkills();
                updateSkillHint();
            }
        });

        MP.dom.on(document.getElementById('addSkill'), 'click', function () {
            addSkill(skillInput.value);
            skillInput.value = '';
            skillInput.focus();
        });

        MP.dom.qsa('[data-suggest]').forEach(function (button) {
            MP.dom.on(button, 'click', function () {
                addSkill(button.getAttribute('data-suggest'));
            });
        });
    }

    function load() {
        if (!isEdit()) {
            render(null);
            return;
        }

        MP.loader.spinner(container, 'Loading vacancy…');

        MP.jobService.getMyVacancy(vacancyId)
            .then(function (response) {
                var vacancy = response.data || {};
                skills = (vacancy.requiredSkills || []).slice();
                render(vacancy);

                document.getElementById('pageTitle').textContent = 'Edit vacancy';
                document.getElementById('pageDescription').textContent =
                    'Changes are reflected in every applicant\'s match score.';
                MP.header.setTitle('Edit vacancy', vacancy.title);
                document.title = 'Edit ' + vacancy.title + ' · MatchPoint';
            })
            .catch(function (error) {
                if (error.isNotFound) {
                    MP.loader.empty(container, {
                        icon: 'alert',
                        title: 'Vacancy not found',
                        message: 'This vacancy does not exist, or it belongs to another employer.',
                        actionLabel: 'Back to vacancies',
                        actionHref: '/employer/vacancies.html'
                    });
                    return;
                }

                var message = MP.apiClient.messageOf(error, 'We could not load this vacancy.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.EMPLOYER)) {
            return;
        }

        MP.sidebar.render();

        container = document.getElementById('formContainer');
        vacancyId = MP.dom.queryParamInt('id');

        MP.header.render({
            title: isEdit() ? 'Edit vacancy' : 'Post a vacancy',
            subtitle: isEdit() ? 'Update the role requirements' : 'Describe the role you are hiring for'
        });

        load();
    });
})();
