/* MatchPoint - status badge rendering for applications, vacancies, contact requests and users */

window.MP = window.MP || {};

MP.statusBadge = (function () {
    'use strict';

    var APPLICATION_TONES = {
        applied: 'info',
        underreview: 'warning',
        shortlisted: 'success',
        rejected: 'danger'
    };

    var VACANCY_TONES = {
        open: 'success',
        closed: 'neutral'
    };

    var CONTACT_TONES = {
        pending: 'warning',
        accepted: 'success',
        declined: 'danger'
    };

    var NOTIFICATION_TONES = {
        applicationreceived: 'primary',
        applicationstatuschanged: 'info',
        contactrequestcreated: 'accent',
        contactrequestresponded: 'success',
        vacancyclosed: 'neutral',
        general: 'neutral'
    };

    function key(status) {
        return String(status || '').toLowerCase().replace(/[\s_-]/g, '');
    }

    function render(status, tone, options) {
        var settings = options || {};
        var label = settings.label || MP.formatters.humanize(status);
        var classes = 'badge badge--' + (tone || 'neutral');

        if (settings.plain) {
            classes += ' badge--plain';
        }
        if (settings.className) {
            classes += ' ' + settings.className;
        }

        return '<span class="' + classes + '">' + MP.dom.escapeHtml(label) + '</span>';
    }

    function application(status, options) {
        return render(status, APPLICATION_TONES[key(status)] || 'neutral', options);
    }

    function vacancy(status, options) {
        return render(status, VACANCY_TONES[key(status)] || 'neutral', options);
    }

    function contactRequest(status, options) {
        return render(status, CONTACT_TONES[key(status)] || 'neutral', options);
    }

    function notificationTone(type) {
        return NOTIFICATION_TONES[key(type)] || 'neutral';
    }

    function userStatus(isActive) {
        return isActive
            ? render('Active', 'success')
            : render('Disabled', 'danger');
    }

    function role(roleName) {
        var tones = {
            jobseeker: 'primary',
            employer: 'accent',
            administrator: 'warning'
        };
        return render(roleName, tones[key(roleName)] || 'neutral', {
            label: MP.formatters.roleLabel(roleName),
            plain: true
        });
    }

    return {
        render: render,
        application: application,
        vacancy: vacancy,
        contactRequest: contactRequest,
        notificationTone: notificationTone,
        userStatus: userStatus,
        role: role,
        APPLICATION_TONES: APPLICATION_TONES
    };
})();
