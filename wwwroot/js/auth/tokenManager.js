/* MatchPoint - JWT storage. localStorage holds only the token, its expiry and a user summary. */

window.MP = window.MP || {};

MP.tokenManager = (function () {
    'use strict';

    var KEYS = MP.config.STORAGE_KEYS;

    function safeGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            /* Storage unavailable (private mode / quota) - session stays in memory only. */
        }
    }

    function safeRemove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            /* no-op */
        }
    }

    function getToken() {
        return safeGet(KEYS.token);
    }

    function getExpiresAt() {
        var raw = safeGet(KEYS.expiresAt);
        if (!raw) {
            return null;
        }
        var date = new Date(raw);
        return isNaN(date.getTime()) ? null : date;
    }

    function getUser() {
        var raw = safeGet(KEYS.user);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (error) {
            safeRemove(KEYS.user);
            return null;
        }
    }

    function isExpired() {
        var expiresAt = getExpiresAt();
        if (!expiresAt) {
            return false;
        }
        // 30s of leeway keeps the client in step with the server's clock skew allowance.
        return expiresAt.getTime() - 30000 <= Date.now();
    }

    function hasValidSession() {
        return Boolean(getToken()) && !isExpired();
    }

    /** Persists the payload returned by /api/auth/login or the register endpoints. */
    function setSession(authResponse) {
        if (!authResponse || !authResponse.token) {
            return;
        }
        safeSet(KEYS.token, authResponse.token);
        if (authResponse.expiresAt) {
            safeSet(KEYS.expiresAt, new Date(authResponse.expiresAt).toISOString());
        }
        if (authResponse.user) {
            setUser(authResponse.user);
        }
    }

    function setUser(user) {
        if (!user) {
            return;
        }
        safeSet(KEYS.user, JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }));
    }

    function clear() {
        safeRemove(KEYS.token);
        safeRemove(KEYS.expiresAt);
        safeRemove(KEYS.user);
    }

    function getRole() {
        var user = getUser();
        return user ? user.role : null;
    }

    function authHeader() {
        var token = getToken();
        return token ? { Authorization: 'Bearer ' + token } : {};
    }

    return {
        getToken: getToken,
        getExpiresAt: getExpiresAt,
        getUser: getUser,
        getRole: getRole,
        isExpired: isExpired,
        hasValidSession: hasValidSession,
        setSession: setSession,
        setUser: setUser,
        clear: clear,
        authHeader: authHeader
    };
})();
