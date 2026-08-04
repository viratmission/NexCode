/* MatchPoint - Fetch API wrapper: bearer auth, envelope unwrapping and HTTP error translation */

window.MP = window.MP || {};

/**
 * Error thrown for any non-successful API response.
 * Carries the HTTP status, the server message and ModelState style validation errors.
 */
MP.ApiError = function (status, message, errors) {
    this.name = 'ApiError';
    this.status = status;
    this.message = message || 'Something went wrong. Please try again.';
    this.errors = errors || null;

    this.isValidation = status === 400 && Boolean(errors);
    this.isUnauthorized = status === 401;
    this.isForbidden = status === 403;
    this.isNotFound = status === 404;
    this.isConflict = status === 409;
    this.isNetwork = status === 0;
    this.isServer = status >= 500;
};

MP.ApiError.prototype = Object.create(Error.prototype);
MP.ApiError.prototype.constructor = MP.ApiError;

/** Flattens the errors dictionary into a single readable sentence. */
MP.ApiError.prototype.flatten = function () {
    if (!this.errors) {
        return this.message;
    }

    var messages = [];
    Object.keys(this.errors).forEach(function (key) {
        var value = this.errors[key];
        if (Array.isArray(value)) {
            messages = messages.concat(value);
        } else if (value) {
            messages.push(String(value));
        }
    }, this);

    return messages.length ? messages.join(' ') : this.message;
};

MP.apiClient = (function () {
    'use strict';

    var STATUS_MESSAGES = {
        400: 'The request could not be processed. Please check your input.',
        401: 'Your session has expired. Please sign in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        409: 'This action conflicts with the current state of the data.',
        413: 'The file you tried to upload is too large.',
        429: 'Too many requests. Please slow down and try again.',
        500: 'An unexpected server error occurred. Please try again later.'
    };

    var isRedirecting = false;

    function currentLocation() {
        return window.location.pathname + window.location.search;
    }

    function redirectTo(path, includeReturnUrl) {
        if (isRedirecting || window.location.pathname === path) {
            return;
        }
        isRedirecting = true;

        var target = path;
        if (includeReturnUrl) {
            target += '?returnUrl=' + encodeURIComponent(currentLocation());
        }
        window.location.replace(target);
    }

    /** 401 means the token is missing, expired or rejected: drop it and bounce the user out. */
    function handleUnauthorized() {
        var hadSession = Boolean(MP.tokenManager.getToken());
        MP.tokenManager.clear();
        redirectTo(hadSession ? MP.config.ROUTES.UNAUTHORIZED : MP.config.ROUTES.LOGIN, true);
    }

    function handleForbidden() {
        redirectTo(MP.config.ROUTES.FORBIDDEN, false);
    }

    function buildQuery(params) {
        if (!params) {
            return '';
        }

        var search = new URLSearchParams();
        Object.keys(params).forEach(function (key) {
            var value = params[key];
            if (value === null || value === undefined || value === '') {
                return;
            }
            if (Array.isArray(value)) {
                value.forEach(function (item) {
                    if (item !== null && item !== undefined && item !== '') {
                        search.append(key, item);
                    }
                });
            } else {
                search.append(key, value);
            }
        });

        var query = search.toString();
        return query ? '?' + query : '';
    }

    function parseJsonSafely(text) {
        if (!text) {
            return null;
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    }

    function fileNameFromDisposition(header, fallback) {
        if (!header) {
            return fallback;
        }

        var utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
        if (utf8Match) {
            try {
                return decodeURIComponent(utf8Match[1]);
            } catch (error) {
                return utf8Match[1];
            }
        }

        var match = /filename="?([^";]+)"?/i.exec(header);
        return match ? match[1] : fallback;
    }

    /**
     * Core request.
     * options: { method, body, query, headers, isFormData, auth, skipAuthRedirect }
     * Resolves with the API envelope: { status, success, message, data }.
     */
    function request(path, options) {
        var settings = options || {};
        var method = (settings.method || 'GET').toUpperCase();
        var url = MP.config.url(path) + buildQuery(settings.query);

        var headers = Object.assign({ Accept: 'application/json' }, settings.headers || {});
        var fetchOptions = { method: method, headers: headers };

        if (settings.auth !== false) {
            Object.assign(headers, MP.tokenManager.authHeader());
        }

        if (settings.body !== undefined && settings.body !== null) {
            if (settings.isFormData || settings.body instanceof FormData) {
                // The browser sets the multipart boundary itself.
                fetchOptions.body = settings.body;
            } else {
                headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify(settings.body);
            }
        }

        return fetch(url, fetchOptions)
            .catch(function () {
                throw new MP.ApiError(0, 'Cannot reach the server. Check your connection and try again.');
            })
            .then(function (response) {
                if (response.status === 204 || response.status === 205) {
                    return { status: response.status, success: true, message: '', data: null };
                }

                return response.text().then(function (text) {
                    var payload = parseJsonSafely(text);
                    var isEnvelope = payload && typeof payload === 'object' && 'success' in payload;

                    if (response.ok) {
                        if (isEnvelope) {
                            return {
                                status: response.status,
                                success: payload.success,
                                message: payload.message || '',
                                data: payload.data === undefined ? null : payload.data
                            };
                        }
                        return { status: response.status, success: true, message: '', data: payload };
                    }

                    var message = (isEnvelope && payload.message)
                        || (payload && payload.title)
                        || STATUS_MESSAGES[response.status]
                        || ('Request failed with status ' + response.status + '.');

                    var errors = (isEnvelope && payload.errors) || (payload && payload.errors) || null;

                    if (response.status === 401 && settings.skipAuthRedirect !== true) {
                        handleUnauthorized();
                    } else if (response.status === 403 && settings.skipAuthRedirect !== true) {
                        handleForbidden();
                    }

                    throw new MP.ApiError(response.status, message, errors);
                });
            });
    }

    function get(path, query, options) {
        return request(path, Object.assign({ method: 'GET', query: query }, options || {}));
    }

    function post(path, body, options) {
        return request(path, Object.assign({ method: 'POST', body: body }, options || {}));
    }

    function put(path, body, options) {
        return request(path, Object.assign({ method: 'PUT', body: body }, options || {}));
    }

    function patch(path, body, options) {
        return request(path, Object.assign({ method: 'PATCH', body: body }, options || {}));
    }

    function del(path, options) {
        return request(path, Object.assign({ method: 'DELETE' }, options || {}));
    }

    function upload(path, formData, options) {
        return request(path, Object.assign({ method: 'POST', body: formData, isFormData: true }, options || {}));
    }

    /** Downloads a file endpoint and resolves with { blob, fileName }. */
    function download(path, fallbackFileName) {
        var url = MP.config.url(path);
        var headers = Object.assign({}, MP.tokenManager.authHeader());

        return fetch(url, { method: 'GET', headers: headers })
            .catch(function () {
                throw new MP.ApiError(0, 'Cannot reach the server. Check your connection and try again.');
            })
            .then(function (response) {
                if (!response.ok) {
                    if (response.status === 401) {
                        handleUnauthorized();
                    } else if (response.status === 403) {
                        handleForbidden();
                    }

                    return response.text().then(function (text) {
                        var payload = parseJsonSafely(text);
                        var message = (payload && payload.message)
                            || STATUS_MESSAGES[response.status]
                            || 'The file could not be downloaded.';
                        throw new MP.ApiError(response.status, message, payload && payload.errors);
                    });
                }

                var fileName = fileNameFromDisposition(
                    response.headers.get('Content-Disposition'),
                    fallbackFileName || 'download'
                );

                return response.blob().then(function (blob) {
                    return { blob: blob, fileName: fileName };
                });
            });
    }

    /** Downloads then triggers the browser save dialog. */
    function downloadAndSave(path, fallbackFileName) {
        return download(path, fallbackFileName).then(function (file) {
            MP.dom.downloadBlob(file.blob, file.fileName);
            return file;
        });
    }

    /**
     * Normalises a paged payload, which the API may return either
     * directly or nested inside `data`.
     */
    function toPagedResult(payload, requestedPage, requestedSize) {
        var source = payload && payload.items ? payload : (payload && payload.data ? payload.data : null);

        if (!source || !Array.isArray(source.items)) {
            var items = Array.isArray(payload) ? payload : [];
            return {
                items: items,
                pageNumber: requestedPage || 1,
                pageSize: requestedSize || MP.config.DEFAULT_PAGE_SIZE,
                totalItems: items.length,
                totalPages: items.length ? 1 : 0
            };
        }

        return {
            items: source.items,
            pageNumber: Number(source.pageNumber) || requestedPage || 1,
            pageSize: Number(source.pageSize) || requestedSize || MP.config.DEFAULT_PAGE_SIZE,
            totalItems: Number(source.totalItems) || source.items.length,
            totalPages: Number(source.totalPages) || (source.items.length ? 1 : 0)
        };
    }

    /** Normalises a list payload the API may return bare or wrapped in `items`. */
    function toList(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }
        if (payload && Array.isArray(payload.items)) {
            return payload.items;
        }
        return [];
    }

    /** Turns any thrown value into a user-facing sentence. */
    function messageOf(error, fallback) {
        if (error instanceof MP.ApiError) {
            return error.isValidation ? error.flatten() : error.message;
        }
        if (error && error.message) {
            return error.message;
        }
        return fallback || 'Something went wrong. Please try again.';
    }

    return {
        request: request,
        get: get,
        post: post,
        put: put,
        patch: patch,
        del: del,
        upload: upload,
        download: download,
        downloadAndSave: downloadAndSave,
        toPagedResult: toPagedResult,
        toList: toList,
        messageOf: messageOf,
        buildQuery: buildQuery
    };
})();
