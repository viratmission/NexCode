/* MatchPoint - match score rings, pills and weighted breakdowns */

window.MP = window.MP || {};

MP.matchScore = (function () {
    'use strict';

    // Mirrors the server side Matching weights (Skills 60, Experience 20, Education 10, Location 10).
    var METRICS = [
        { key: 'skillsScore', label: 'Skills', weight: 60, bar: 'accent' },
        { key: 'experienceScore', label: 'Experience', weight: 20, bar: '' },
        { key: 'educationScore', label: 'Education', weight: 10, bar: 'success' },
        { key: 'locationScore', label: 'Location', weight: 10, bar: 'warning' }
    ];

    function normalize(score) {
        var value = Number(score);
        return isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
    }

    function tier(score) {
        var value = normalize(score);
        if (value >= 80) { return 'strong'; }
        if (value >= 60) { return 'good'; }
        if (value >= 40) { return 'fair'; }
        return 'low';
    }

    function tierLabel(score) {
        var labels = {
            strong: 'Strong match',
            good: 'Good match',
            fair: 'Fair match',
            low: 'Low match'
        };
        return labels[tier(score)];
    }

    function color(score) {
        var colors = {
            strong: 'var(--color-success)',
            good: 'var(--color-primary)',
            fair: 'var(--color-warning)',
            low: 'var(--color-text-tertiary)'
        };
        return colors[tier(score)];
    }

    /** Circular progress ring. size: 'sm' | '' | 'lg' */
    function ring(score, size) {
        var value = normalize(score);
        var modifier = size ? ' match-ring--' + size : '';

        return '<div class="match-ring' + modifier + '" style="--ring-value:' + value
            + ';--ring-color:' + color(value) + '" role="img" aria-label="Match score '
            + value + ' percent">'
            + '<span class="match-ring__value">' + value + '<sup>%</sup></span>'
            + '</div>';
    }

    function pill(score, options) {
        var settings = options || {};
        var value = normalize(score);
        var label = settings.showLabel === false
            ? value + '% match'
            : value + '% · ' + tierLabel(value);

        return '<span class="match-pill match-pill--' + tier(value) + '">'
            + MP.dom.icon('target') + MP.dom.escapeHtml(label) + '</span>';
    }

    /**
     * Orders applicants strongest first, in place.
     * The API already ranks results; this keeps the display correct even if a
     * filtered or merged list arrives in another order.
     * Pass `{ renumber: false }` for a single page of a paged list, where `rank`
     * is a position in the whole result set rather than within the page.
     */
    function rank(applicants, options) {
        if (!Array.isArray(applicants)) {
            return [];
        }

        applicants.sort(function (a, b) {
            var difference = normalize(b.matchScore) - normalize(a.matchScore);
            if (difference !== 0) {
                return difference;
            }
            return new Date(a.appliedAt || 0) - new Date(b.appliedAt || 0);
        });

        if (!options || options.renumber !== false) {
            applicants.forEach(function (applicant, index) {
                applicant.rank = index + 1;
            });
        }

        return applicants;
    }

    function metricRow(label, score, weight, barModifier) {
        var value = Number(score) || 0;
        var percent = weight > 0 ? Math.round((value / weight) * 100) : 0;

        return '<div class="match-metric">' +
            '<div class="match-metric__head">' +
                '<span class="match-metric__label">' + MP.dom.escapeHtml(label) + '</span>' +
                '<span class="match-metric__value">' + value + ' / ' + weight + '</span>' +
            '</div>' +
            '<div class="progress"><div class="progress__bar' + (barModifier ? ' progress__bar--' + barModifier : '')
                + '" style="width:' + Math.max(0, Math.min(100, percent)) + '%"></div></div>' +
        '</div>';
    }

    /** Score contribution per category, using the server's weight allocation. */
    function breakdown(matchResult) {
        if (!matchResult) {
            return '';
        }

        var rows = METRICS.map(function (metric) {
            return metricRow(metric.label, matchResult[metric.key], metric.weight, metric.bar);
        }).join('');

        return '<div class="match-breakdown">' + rows + '</div>';
    }

    function skillChips(skills, variant, emptyText) {
        if (!Array.isArray(skills) || skills.length === 0) {
            return '<p class="text-sm text-secondary">' + MP.dom.escapeHtml(emptyText || 'None') + '</p>';
        }

        return '<div class="chip-list">' + skills.map(function (skill) {
            return '<span class="chip' + (variant ? ' chip--' + variant : '') + '">'
                + MP.dom.escapeHtml(skill) + '</span>';
        }).join('') + '</div>';
    }

    /** Matched vs missing skills, side by side. */
    function skillComparison(matchResult) {
        if (!matchResult) {
            return '';
        }

        var matched = matchResult.matchedSkills || [];
        var missing = matchResult.missingSkills || [];

        return '<div class="grid grid--2">' +
            '<div>' +
                '<div class="detail-item__label">' + MP.dom.escapeHtml('Matched skills (' + matched.length + ')') + '</div>' +
                skillChips(matched, 'success', 'No matching skills yet') +
            '</div>' +
            '<div>' +
                '<div class="detail-item__label">' + MP.dom.escapeHtml('Missing skills (' + missing.length + ')') + '</div>' +
                skillChips(missing, 'danger', 'You have every required skill') +
            '</div>' +
        '</div>';
    }

    /** Full panel: ring + headline + breakdown + skills, used on detail pages. */
    function panel(matchResult, options) {
        if (!matchResult) {
            return '';
        }

        var settings = options || {};
        var score = normalize(matchResult.totalScore);
        var missingCount = (matchResult.missingSkills || []).length;

        var headline = settings.headline || tierLabel(score);
        var text = settings.text || (missingCount === 0
            ? 'Your profile covers every skill this role asks for.'
            : 'You are missing ' + missingCount + ' of the required skill' + (missingCount === 1 ? '' : 's') + '.');

        return '<div class="match-panel">' +
                ring(score, 'lg') +
                '<div class="match-panel__summary">' +
                    '<div class="match-panel__headline">' + MP.dom.escapeHtml(headline) + '</div>' +
                    '<p class="match-panel__text">' + MP.dom.escapeHtml(text) + '</p>' +
                '</div>' +
            '</div>' +
            '<div class="divider"></div>' +
            breakdown(matchResult) +
            '<div class="divider"></div>' +
            skillComparison(matchResult);
    }

    return {
        normalize: normalize,
        tier: tier,
        tierLabel: tierLabel,
        color: color,
        ring: ring,
        pill: pill,
        rank: rank,
        breakdown: breakdown,
        skillChips: skillChips,
        skillComparison: skillComparison,
        panel: panel
    };
})();
