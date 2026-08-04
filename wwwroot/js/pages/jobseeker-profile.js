/* MatchPoint - job seeker profile editor with skill chips and CV management */

(function () {
    'use strict';

    var container;
    var profile = null;
    var cvDocument = null;
    var skills = [];

    /* ---------- Skills chips ---------- */

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
                updateSkillCount();
            });
        });
    }

    function updateSkillCount() {
        var counter = document.getElementById('skillCount');
        if (counter) {
            counter.textContent = skills.length + (skills.length === 1 ? ' skill added' : ' skills added');
        }
        MP.dom.setFieldError(document.getElementById('profileForm'), 'skillInput', null);
    }

    function addSkill(rawValue) {
        var value = String(rawValue || '').trim().replace(/,+$/, '').trim();
        if (!value) {
            return;
        }

        if (value.length > 100) {
            MP.toast.warning('Skill names must be 100 characters or fewer.');
            return;
        }

        var exists = skills.some(function (skill) {
            return skill.toLowerCase() === value.toLowerCase();
        });

        if (exists) {
            MP.toast.info('"' + value + '" is already on your profile.');
            return;
        }

        skills.push(value);
        renderSkills();
        updateSkillCount();
    }

    /* ---------- CV panel ---------- */

    function cvPanelHtml() {
        if (!cvDocument) {
            return '<div class="dropzone" id="cvDropzone">' +
                    '<div class="dropzone__icon">' + MP.dom.icon('upload') + '</div>' +
                    '<div class="dropzone__title"><span>Click to upload</span> or drag and drop</div>' +
                    '<div class="dropzone__hint">PDF, DOC or DOCX &middot; up to '
                        + MP.formatters.fileSize(MP.config.UPLOAD.maxFileSizeBytes) + '</div>' +
                    '<input type="file" id="cvInput" accept="' + MP.config.UPLOAD.accept + '" />' +
                '</div>';
        }

        return '<div class="file-card">' +
                '<span class="file-card__icon">' + MP.dom.icon('document') + '</span>' +
                '<div class="file-card__info">' +
                    '<div class="file-card__name">' + MP.dom.escapeHtml(cvDocument.originalFileName) + '</div>' +
                    '<div class="file-card__meta">' + MP.formatters.fileSize(cvDocument.fileSize)
                        + ' · uploaded ' + MP.formatters.relativeTime(cvDocument.uploadedAt) + '</div>' +
                '</div>' +
                '<div class="file-card__actions">' +
                    '<button type="button" class="btn btn--secondary btn--sm" id="downloadCv">'
                        + MP.dom.icon('download') + 'Download</button>' +
                    '<button type="button" class="btn btn--danger-soft btn--sm btn--icon" id="deleteCv" '
                        + 'aria-label="Delete CV">' + MP.dom.icon('trash') + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="dropzone mt-4" id="cvDropzone">' +
                '<div class="dropzone__title"><span>Replace CV</span></div>' +
                '<div class="dropzone__hint">Uploading a new file replaces the current one</div>' +
                '<input type="file" id="cvInput" accept="' + MP.config.UPLOAD.accept + '" />' +
            '</div>';
    }

    function renderCvPanel() {
        var host = document.getElementById('cvPanel');
        if (!host) {
            return;
        }
        host.innerHTML = cvPanelHtml();
        wireCvPanel();
    }

    function wireCvPanel() {
        var dropzone = document.getElementById('cvDropzone');
        var input = document.getElementById('cvInput');

        if (dropzone && input) {
            MP.dom.on(dropzone, 'click', function () { input.click(); });

            MP.dom.on(dropzone, 'dragover', function (event) {
                event.preventDefault();
                dropzone.classList.add('is-dragover');
            });

            MP.dom.on(dropzone, 'dragleave', function () {
                dropzone.classList.remove('is-dragover');
            });

            MP.dom.on(dropzone, 'drop', function (event) {
                event.preventDefault();
                dropzone.classList.remove('is-dragover');
                if (event.dataTransfer.files && event.dataTransfer.files.length) {
                    uploadCv(event.dataTransfer.files[0]);
                }
            });

            MP.dom.on(input, 'change', function () {
                if (input.files && input.files.length) {
                    uploadCv(input.files[0]);
                }
                input.value = '';
            });
        }

        MP.dom.on(document.getElementById('downloadCv'), 'click', downloadCv);
        MP.dom.on(document.getElementById('deleteCv'), 'click', confirmDeleteCv);
    }

    function uploadCv(file) {
        var validationError = MP.validators.cvFile(file);
        if (validationError) {
            MP.toast.error(validationError);
            return;
        }

        MP.loader.showOverlay();

        MP.profileService.uploadCv(file)
            .then(function (response) {
                cvDocument = response.data;
                renderCvPanel();
                MP.toast.success(response.message || 'CV uploaded successfully.');
            })
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'Your CV could not be uploaded.'));
            })
            .then(MP.loader.hideOverlay);
    }

    function downloadCv() {
        MP.profileService.downloadCv(cvDocument ? cvDocument.originalFileName : 'cv.pdf')
            .catch(function (error) {
                MP.toast.error(MP.apiClient.messageOf(error, 'Your CV could not be downloaded.'));
            });
    }

    function confirmDeleteCv() {
        MP.modal.confirm({
            title: 'Delete your CV?',
            message: 'Employers reviewing your existing applications will no longer be able to download it.',
            icon: 'trash',
            tone: 'danger',
            confirmLabel: 'Delete CV',
            confirmVariant: 'danger',
            onConfirm: function () {
                return MP.profileService.deleteCv()
                    .then(function (response) {
                        cvDocument = null;
                        renderCvPanel();
                        MP.toast.success(response.message || 'CV deleted successfully.');
                    })
                    .catch(function (error) {
                        MP.toast.error(MP.apiClient.messageOf(error, 'Your CV could not be deleted.'));
                        throw error;
                    });
            }
        });
    }

    /* ---------- Profile form ---------- */

    function validate(values) {
        return MP.validators.collect({
            professionalTitle: MP.validators.required(values.professionalTitle, 'Professional title')
                || MP.validators.maxLength(values.professionalTitle, 200, 'Professional title'),
            location: MP.validators.required(values.location, 'Location')
                || MP.validators.maxLength(values.location, 150, 'Location'),
            yearsOfExperience: MP.validators.integerInRange(values.yearsOfExperience, 0, 50, 'Years of experience'),
            education: MP.validators.required(values.education, 'Education')
                || MP.validators.maxLength(values.education, 200, 'Education'),
            about: MP.validators.maxLength(values.about, 2000, 'About')
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

        values.skills = skills;

        MP.profileService.updateProfile(values)
            .then(function (response) {
                profile = response.data || profile;
                skills = (profile.skills || []).slice();
                renderSkills();
                updateSkillCount();
                updateSummary();
                MP.toast.success(response.message || 'Profile updated successfully.');
            })
            .catch(function (error) {
                if (error.isValidation && MP.dom.applyServerErrors(form, error.errors)) {
                    MP.toast.error('Please correct the highlighted fields.');
                    return;
                }
                MP.toast.error(MP.apiClient.messageOf(error, 'Your profile could not be saved.'));
            })
            .then(function () {
                MP.dom.setButtonLoading(submitButton, false);
            });
    }

    function updateSummary() {
        var title = document.getElementById('summaryTitle');
        if (title) {
            title.textContent = profile.professionalTitle || 'Add your professional title';
        }

        var location = document.getElementById('summaryLocation');
        if (location) {
            location.textContent = MP.formatters.orDash(profile.location);
        }
    }

    /* ---------- Render ---------- */

    function render() {
        container.innerHTML =
            '<div class="grid grid--sidebar">' +
                '<div class="flex flex-col gap-5">' +
                    '<section class="card">' +
                        '<div class="card__header">' +
                            '<div>' +
                                '<h2 class="card__title">Professional details</h2>' +
                                '<p class="card__subtitle">Used to score you against every open vacancy</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card__body">' +
                            '<form id="profileForm" novalidate>' +
                                '<div class="form-grid">' +
                                    '<div class="form-field form-field--full">' +
                                        '<label class="form-label" for="professionalTitle">' +
                                            'Professional title <span class="form-label__required">*</span></label>' +
                                        '<input class="form-control" type="text" id="professionalTitle" ' +
                                            'name="professionalTitle" maxlength="200" ' +
                                            'placeholder="e.g. Senior Backend Engineer" required />' +
                                        '<span class="form-error" data-error-for="professionalTitle"></span>' +
                                    '</div>' +

                                    '<div class="form-field">' +
                                        '<label class="form-label" for="location">' +
                                            'Location <span class="form-label__required">*</span></label>' +
                                        '<input class="form-control" type="text" id="location" name="location" ' +
                                            'maxlength="150" placeholder="e.g. Chennai, India" required />' +
                                        '<span class="form-error" data-error-for="location"></span>' +
                                    '</div>' +

                                    '<div class="form-field">' +
                                        '<label class="form-label" for="yearsOfExperience">' +
                                            'Years of experience <span class="form-label__required">*</span></label>' +
                                        '<input class="form-control" type="number" id="yearsOfExperience" ' +
                                            'name="yearsOfExperience" min="0" max="50" step="1" required />' +
                                        '<span class="form-error" data-error-for="yearsOfExperience"></span>' +
                                    '</div>' +

                                    '<div class="form-field form-field--full">' +
                                        '<label class="form-label" for="education">' +
                                            'Education <span class="form-label__required">*</span></label>' +
                                        '<input class="form-control" type="text" id="education" name="education" ' +
                                            'maxlength="200" placeholder="e.g. B.Tech Computer Science" required />' +
                                        '<span class="form-hint">Matched against each vacancy\'s education requirement.</span>' +
                                        '<span class="form-error" data-error-for="education"></span>' +
                                    '</div>' +

                                    '<div class="form-field form-field--full">' +
                                        '<label class="form-label" for="about">About you</label>' +
                                        '<textarea class="form-control" id="about" name="about" maxlength="2000" ' +
                                            'placeholder="A short summary employers will read on your application."></textarea>' +
                                        '<span class="form-error" data-error-for="about"></span>' +
                                    '</div>' +

                                    '<div class="form-field form-field--full">' +
                                        '<label class="form-label" for="skillInput">Skills</label>' +
                                        '<div class="skills-input">' +
                                            '<div class="skills-input__chips" id="skillChips"></div>' +
                                            '<div class="skills-input__row">' +
                                                '<input class="skills-input__field" type="text" id="skillInput" ' +
                                                    'name="skillInput" placeholder="Type a skill and press Enter" />' +
                                                '<button type="button" class="btn btn--soft btn--sm" id="addSkill">'
                                                    + MP.dom.icon('plus') + 'Add</button>' +
                                            '</div>' +
                                        '</div>' +
                                        '<span class="form-hint" id="skillCount">0 skills added</span>' +
                                        '<span class="form-error" data-error-for="skillInput"></span>' +
                                    '</div>' +
                                '</div>' +

                                '<div class="form-actions">' +
                                    '<button type="button" class="btn btn--secondary" id="resetProfile">Reset</button>' +
                                    '<button type="submit" class="btn btn--primary" id="saveProfile">Save changes</button>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                    '</section>' +

                    '<section class="card">' +
                        '<div class="card__header">' +
                            '<div>' +
                                '<h2 class="card__title">Curriculum vitae</h2>' +
                                '<p class="card__subtitle">Shared with employers when you apply</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card__body" id="cvPanel"></div>' +
                    '</section>' +
                '</div>' +

                '<aside class="sticky-aside">' +
                    '<section class="card">' +
                        '<div class="profile-hero">' +
                            '<span class="avatar avatar--xl" aria-hidden="true">'
                                + MP.dom.escapeHtml(MP.formatters.initials(profile.fullName)) + '</span>' +
                            '<div class="profile-hero__info">' +
                                '<div class="profile-hero__name">' + MP.dom.escapeHtml(profile.fullName) + '</div>' +
                                '<div class="profile-hero__title" id="summaryTitle">'
                                    + MP.dom.escapeHtml(profile.professionalTitle || 'Add your professional title') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card__body" style="border-top:1px solid var(--color-border)">' +
                            '<div class="detail-list">' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Email</div>' +
                                    '<div class="detail-item__value">' + MP.dom.escapeHtml(profile.email) + '</div>' +
                                '</div>' +
                                '<div class="detail-item">' +
                                    '<div class="detail-item__label">Location</div>' +
                                    '<div class="detail-item__value" id="summaryLocation">'
                                        + MP.dom.escapeHtml(MP.formatters.orDash(profile.location)) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +

                    '<div class="alert alert--info">' + MP.dom.icon('info') +
                        '<span>Skills carry 60% of every match score. Adding the exact tools and technologies ' +
                        'you know is the fastest way to improve your matches.</span>' +
                    '</div>' +
                '</aside>' +
            '</div>';

        var form = document.getElementById('profileForm');
        form.querySelector('[name="professionalTitle"]').value = profile.professionalTitle || '';
        form.querySelector('[name="location"]').value = profile.location || '';
        form.querySelector('[name="yearsOfExperience"]').value = profile.yearsOfExperience || 0;
        form.querySelector('[name="education"]').value = profile.education || '';
        form.querySelector('[name="about"]').value = profile.about || '';

        renderSkills();
        updateSkillCount();
        renderCvPanel();

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
                updateSkillCount();
            }
        });

        MP.dom.on(document.getElementById('addSkill'), 'click', function () {
            addSkill(skillInput.value);
            skillInput.value = '';
            skillInput.focus();
        });

        MP.dom.on(document.getElementById('resetProfile'), 'click', function () {
            skills = (profile.skills || []).slice();
            MP.dom.clearFormErrors(form);
            render();
            MP.toast.info('Unsaved changes discarded.');
        });
    }

    function load() {
        MP.loader.spinner(container, 'Loading your profile…');

        Promise.all([
            MP.profileService.getProfile(),
            MP.profileService.getCv().catch(function () { return { data: null }; })
        ])
            .then(function (responses) {
                profile = responses[0].data || {};
                skills = (profile.skills || []).slice();
                cvDocument = responses[1].data || profile.cvDocument || null;
                render();
            })
            .catch(function (error) {
                var message = MP.apiClient.messageOf(error, 'We could not load your profile.');
                MP.loader.error(container, message, load);
                MP.toast.error(message);
            });
    }

    MP.dom.ready(function () {
        if (!MP.roleGuard.require(MP.config.ROLES.JOB_SEEKER)) {
            return;
        }

        MP.sidebar.render();
        MP.header.render({ title: 'My profile', subtitle: 'Keep your skills and experience up to date' });

        container = document.getElementById('profileContent');
        load();
    });
})();
