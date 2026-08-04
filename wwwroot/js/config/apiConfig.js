/* MatchPoint - API configuration and shared constants */

window.MP = window.MP || {};

MP.config = (function () {
    'use strict';

    // Empty string => same origin as the ASP.NET Core host serving wwwroot.
    var BASE_URL = '';

    var ROLES = {
        JOB_SEEKER: 'JobSeeker',
        EMPLOYER: 'Employer',
        ADMINISTRATOR: 'Administrator'
    };

    var ROLE_HOME = {
        JobSeeker: '/jobseeker/dashboard.html',
        Employer: '/employer/dashboard.html',
        Administrator: '/admin/dashboard.html'
    };

    var ROUTES = {
        LOGIN: '/login.html',
        REGISTER: '/register.html',
        HOME: '/index.html',
        UNAUTHORIZED: '/unauthorized.html',
        FORBIDDEN: '/forbidden.html',
        NOT_FOUND: '/not-found.html'
    };

    var ENDPOINTS = {
        // Auth
        registerJobSeeker: '/api/auth/register/job-seeker',
        registerEmployer: '/api/auth/register/employer',
        login: '/api/auth/login',
        me: '/api/auth/me',

        // Job seeker
        jobSeekerProfile: '/api/job-seekers/profile',
        jobSeekerCv: '/api/job-seekers/cv',
        jobSeekerCvDownload: '/api/job-seekers/cv/download',
        jobSeekerApplications: '/api/job-seekers/applications',
        jobSeekerContactRequests: '/api/job-seekers/contact-requests',
        jobSeekerDashboard: '/api/job-seekers/dashboard',

        // Employer
        employerProfile: '/api/employers/profile',
        employerDashboard: '/api/employers/dashboard',

        // Jobs
        jobs: '/api/jobs',
        myJobs: '/api/jobs/mine',

        // Applications
        applications: '/api/applications',

        // Contact requests
        contactRequests: '/api/contact-requests',

        // Notifications
        notifications: '/api/notifications',
        notificationsUnreadCount: '/api/notifications/unread-count',
        notificationsReadAll: '/api/notifications/read-all',

        // Admin
        adminDashboard: '/api/admin/dashboard',
        adminUsers: '/api/admin/users',
        adminSettings: '/api/admin/settings'
    };

    var APPLICATION_STATUSES = ['Applied', 'UnderReview', 'Shortlisted', 'Rejected'];
    var CONTACT_REQUEST_STATUSES = ['Pending', 'Accepted', 'Declined'];
    var VACANCY_STATUSES = ['Open', 'Closed'];

    var UPLOAD = {
        maxFileSizeBytes: 5 * 1024 * 1024,
        allowedExtensions: ['.pdf', '.doc', '.docx'],
        accept: '.pdf,.doc,.docx'
    };

    var STORAGE_KEYS = {
        token: 'matchpoint.token',
        expiresAt: 'matchpoint.expiresAt',
        user: 'matchpoint.user'
    };

    var DEFAULT_PAGE_SIZE = 10;

    return {
        BASE_URL: BASE_URL,
        ROLES: ROLES,
        ROLE_HOME: ROLE_HOME,
        ROUTES: ROUTES,
        ENDPOINTS: ENDPOINTS,
        APPLICATION_STATUSES: APPLICATION_STATUSES,
        CONTACT_REQUEST_STATUSES: CONTACT_REQUEST_STATUSES,
        VACANCY_STATUSES: VACANCY_STATUSES,
        UPLOAD: UPLOAD,
        STORAGE_KEYS: STORAGE_KEYS,
        DEFAULT_PAGE_SIZE: DEFAULT_PAGE_SIZE,

        url: function (path) {
            return BASE_URL + path;
        },

        homeForRole: function (role) {
            return ROLE_HOME[role] || ROUTES.HOME;
        }
    };
})();
