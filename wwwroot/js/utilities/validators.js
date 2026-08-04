/* MatchPoint - client side validation helpers */

window.MP = window.MP || {};

MP.validators = (function () {
    'use strict';

    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

    function isBlank(value) {
        return value === null || value === undefined || String(value).trim() === '';
    }

    function required(value, label) {
        return isBlank(value) ? (label || 'This field') + ' is required.' : null;
    }

    function email(value) {
        if (isBlank(value)) {
            return 'Email address is required.';
        }
        return EMAIL_PATTERN.test(String(value).trim()) ? null : 'Enter a valid email address.';
    }

    function minLength(value, min, label) {
        if (isBlank(value)) {
            return (label || 'This field') + ' is required.';
        }
        return String(value).length < min
            ? (label || 'This field') + ' must be at least ' + min + ' characters.'
            : null;
    }

    function maxLength(value, max, label) {
        if (value && String(value).length > max) {
            return (label || 'This field') + ' must be ' + max + ' characters or fewer.';
        }
        return null;
    }

    function password(value) {
        if (isBlank(value)) {
            return 'Password is required.';
        }
        if (String(value).length < 8) {
            return 'Password must be at least 8 characters.';
        }
        return null;
    }

    function matches(value, other, label) {
        if (isBlank(value)) {
            return (label || 'Confirmation') + ' is required.';
        }
        return value !== other ? 'Passwords do not match.' : null;
    }

    function integerInRange(value, min, max, label) {
        if (isBlank(value)) {
            return (label || 'This field') + ' is required.';
        }
        var parsed = Number(value);
        if (!isFinite(parsed) || Math.floor(parsed) !== parsed) {
            return (label || 'This field') + ' must be a whole number.';
        }
        if (parsed < min || parsed > max) {
            return (label || 'This field') + ' must be between ' + min + ' and ' + max + '.';
        }
        return null;
    }

    function nonEmptyList(list, label) {
        if (!Array.isArray(list) || list.length === 0) {
            return 'Add at least one ' + (label || 'item') + '.';
        }
        return null;
    }

    /**
     * Validates a CV upload against the allowed extensions and 5 MB size limit.
     * Returns an error string, or null when the file is acceptable.
     */
    function cvFile(file) {
        if (!file) {
            return 'Choose a file to upload.';
        }

        var upload = MP.config.UPLOAD;
        var name = String(file.name || '').toLowerCase();
        var dotIndex = name.lastIndexOf('.');
        var extension = dotIndex === -1 ? '' : name.substring(dotIndex);

        if (upload.allowedExtensions.indexOf(extension) === -1) {
            return 'Only ' + upload.allowedExtensions.join(', ') + ' files are allowed.';
        }

        if (file.size > upload.maxFileSizeBytes) {
            return 'File is too large. The maximum size is '
                + MP.formatters.fileSize(upload.maxFileSizeBytes) + '.';
        }

        if (file.size === 0) {
            return 'The selected file is empty.';
        }

        return null;
    }

    /**
     * Runs a map of { fieldName: errorOrNull } and returns
     * { isValid: bool, errors: { field: message } }.
     */
    function collect(results) {
        var errors = {};
        var isValid = true;

        Object.keys(results).forEach(function (key) {
            if (results[key]) {
                errors[key] = results[key];
                isValid = false;
            }
        });

        return { isValid: isValid, errors: errors };
    }

    return {
        isBlank: isBlank,
        required: required,
        email: email,
        minLength: minLength,
        maxLength: maxLength,
        password: password,
        matches: matches,
        integerInRange: integerInRange,
        nonEmptyList: nonEmptyList,
        cvFile: cvFile,
        collect: collect
    };
})();
