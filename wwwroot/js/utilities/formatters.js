/* MatchPoint - value formatting helpers */

window.MP = window.MP || {};

MP.formatters = (function () {
    'use strict';

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function toDate(value) {
        if (!value) {
            return null;
        }
        var date = value instanceof Date ? value : new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    function pad(value) {
        return value < 10 ? '0' + value : String(value);
    }

    function date(value, fallback) {
        var d = toDate(value);
        if (!d) {
            return fallback === undefined ? '—' : fallback;
        }
        return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function dateTime(value, fallback) {
        var d = toDate(value);
        if (!d) {
            return fallback === undefined ? '—' : fallback;
        }
        var hours = d.getHours();
        var suffix = hours >= 12 ? 'PM' : 'AM';
        var hour12 = hours % 12 === 0 ? 12 : hours % 12;
        return date(d) + ' · ' + hour12 + ':' + pad(d.getMinutes()) + ' ' + suffix;
    }

    function relativeTime(value, fallback) {
        var d = toDate(value);
        if (!d) {
            return fallback === undefined ? '—' : fallback;
        }

        var seconds = Math.round((Date.now() - d.getTime()) / 1000);
        var future = seconds < 0;
        seconds = Math.abs(seconds);

        var text;
        if (seconds < 45) {
            return future ? 'in a moment' : 'Just now';
        } else if (seconds < 3600) {
            var minutes = Math.round(seconds / 60);
            text = minutes + (minutes === 1 ? ' minute' : ' minutes');
        } else if (seconds < 86400) {
            var hours = Math.round(seconds / 3600);
            text = hours + (hours === 1 ? ' hour' : ' hours');
        } else if (seconds < 604800) {
            var days = Math.round(seconds / 86400);
            text = days + (days === 1 ? ' day' : ' days');
        } else if (seconds < 2629800) {
            var weeks = Math.round(seconds / 604800);
            text = weeks + (weeks === 1 ? ' week' : ' weeks');
        } else if (seconds < 31557600) {
            var months = Math.round(seconds / 2629800);
            text = months + (months === 1 ? ' month' : ' months');
        } else {
            var years = Math.round(seconds / 31557600);
            text = years + (years === 1 ? ' year' : ' years');
        }

        return future ? 'in ' + text : text + ' ago';
    }

    function fileSize(bytes) {
        var size = Number(bytes);
        if (!isFinite(size) || size <= 0) {
            return '0 KB';
        }
        if (size < 1024) {
            return size + ' B';
        }
        if (size < 1024 * 1024) {
            return (size / 1024).toFixed(1).replace(/\.0$/, '') + ' KB';
        }
        return (size / (1024 * 1024)).toFixed(2).replace(/\.00$/, '') + ' MB';
    }

    function number(value) {
        var n = Number(value);
        if (!isFinite(n)) {
            return '0';
        }
        return n.toLocaleString('en-US');
    }

    function initials(name) {
        if (!name) {
            return '?';
        }
        var parts = String(name).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return '?';
        }
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    /** Converts PascalCase / camelCase enum values into readable labels. */
    function humanize(value) {
        if (value === null || value === undefined || value === '') {
            return '—';
        }
        return String(value)
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function roleLabel(role) {
        if (role === 'JobSeeker') { return 'Job Seeker'; }
        if (role === 'Employer') { return 'Employer'; }
        if (role === 'Administrator') { return 'Administrator'; }
        return humanize(role);
    }

    function experience(years) {
        var n = Number(years) || 0;
        if (n === 0) {
            return 'No experience required';
        }
        return n + '+ ' + (n === 1 ? 'year' : 'years');
    }

    function experienceShort(years) {
        var n = Number(years) || 0;
        return n + ' ' + (n === 1 ? 'yr' : 'yrs');
    }

    function orDash(value) {
        if (value === null || value === undefined) {
            return '—';
        }
        var text = String(value).trim();
        return text === '' ? '—' : text;
    }

    function truncate(value, max) {
        var text = String(value || '');
        var limit = max || 160;
        return text.length > limit ? text.substring(0, limit).trim() + '…' : text;
    }

    function percent(value) {
        var n = Number(value);
        return (isFinite(n) ? Math.round(n) : 0) + '%';
    }

    return {
        date: date,
        dateTime: dateTime,
        relativeTime: relativeTime,
        fileSize: fileSize,
        number: number,
        initials: initials,
        humanize: humanize,
        roleLabel: roleLabel,
        experience: experience,
        experienceShort: experienceShort,
        orDash: orDash,
        truncate: truncate,
        percent: percent
    };
})();
