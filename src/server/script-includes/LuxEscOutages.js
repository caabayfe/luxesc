// Known issues: what is broken for everyone right now (active major incidents and recent
// outages), and whether colleagues are reporting the same problem. The intake agent checks it
// before drafting a ticket, and the home page shows it, so an employee hit by an outage follows
// the major incident instead of raising a duplicate.
// Classic script, like LuxEscConcierge, because the sn_aia runtime rejects module code.
var LuxEscOutages = Class.create();

LuxEscOutages.LIMIT = 8;
// Outages without an end that began earlier than this are left-over data, not current issues
LuxEscOutages.RECENT_DAYS = 3;
// "Others are reporting this": incidents raised in the last hours by different callers
LuxEscOutages.BURST_HOURS = 4;
LuxEscOutages.BURST_CALLERS = 3;
LuxEscOutages.CLOSED_STATES = '6,7,8';
// Major incidents opened earlier than this many days are forgotten data, not current issues
LuxEscOutages.MAX_AGE_PROPERTY = 'x_everi_luxesc.known_issues.max_age_days';

LuxEscOutages.prototype = {
    initialize: function () {},

    // ---- REST -----------------------------------------------------------------------------

    // Current known issues, with whether the signed-in employee already follows each one
    current: function () {
        var userId = gs.getUserID();
        var self = this;
        return this._issues().map(function (issue) {
            issue.following = issue.linkable && self._following(issue.sysId, userId);
            return issue;
        });
    },

    // Raises the employee's incident as a child of the major incident, so they are kept up to
    // date and the incident closes with it (platform parent/child incident behaviour)
    follow: function (issueId, shortDescription, description) {
        var issue = this.find(issueId);
        if (!issue || !issue.linkable) throw new Error('This issue is no longer active');
        var userId = gs.getUserID();
        var existing = this._following(issue.sysId, userId);
        if (existing) return existing;
        var incident = new GlideRecord('incident');
        incident.initialize();
        incident.setValue('caller_id', userId);
        incident.setValue('parent_incident', issue.sysId);
        incident.setValue('short_description', String(shortDescription || issue.title).substring(0, 160));
        incident.setValue('description', String(description || '').substring(0, 4000) ||
            'I am affected by ' + issue.number + ': ' + issue.title);
        incident.setValue('contact_type', 'self-service');
        var parent = new GlideRecord('incident');
        if (parent.get(issue.sysId)) {
            incident.setValue('category', parent.getValue('category'));
            incident.setValue('business_service', parent.getValue('business_service'));
            incident.setValue('cmdb_ci', parent.getValue('cmdb_ci'));
        }
        if (!incident.insert()) throw new Error('Your incident could not be raised');
        return { sysId: incident.getUniqueValue(), number: incident.getValue('number') };
    },

    // ---- Agent tool -----------------------------------------------------------------------

    // All current issues (there are few, and matching "Outlook does not sync" to "Exchange is
    // down" is the agent's job), plus how many colleagues reported something similar lately
    knownIssues: function (runId, query) {
        if (!new x_everi_luxesc.LuxEscIntake()._run(runId)) return { error: 'Unknown intake run' };
        return { issues: this._issues(), othersReporting: this._othersReporting(runId, query) };
    },

    // The issue with this sys_id if it is still current; the triage only keeps real ones
    find: function (sysId) {
        var issues = this._issues();
        for (var i = 0; i < issues.length; i++) {
            if (issues[i].sysId === sysId) return issues[i];
        }
        return null;
    },

    // ---- Internals ------------------------------------------------------------------------

    _issues: function () {
        var issues = this._majorIncidents();
        var seen = {};
        issues.forEach(function (issue) {
            seen[issue.sysId] = true;
        });
        this._outages().forEach(function (issue) {
            if (!seen[issue.sysId]) issues.push(issue);
        });
        return issues.slice(0, LuxEscOutages.LIMIT);
    },

    _majorIncidents: function () {
        var incident = new GlideRecord('incident');
        incident.addActiveQuery();
        incident.addQuery('major_incident_state', 'accepted');
        incident.addQuery('state', 'NOT IN', LuxEscOutages.CLOSED_STATES);
        incident.addQuery('opened_at', '>=', gs.daysAgoStart(parseInt(gs.getProperty(LuxEscOutages.MAX_AGE_PROPERTY, '14'), 10) || 14));
        incident.orderByDesc('opened_at');
        incident.setLimit(LuxEscOutages.LIMIT);
        incident.query();
        var issues = [];
        while (incident.next()) {
            issues.push({
                sysId: incident.getUniqueValue(),
                number: incident.getValue('number'),
                title: incident.getValue('short_description'),
                service: incident.getDisplayValue('business_service') || incident.getDisplayValue('cmdb_ci'),
                since: incident.getDisplayValue('opened_at'),
                kind: 'major_incident',
                linkable: true,
                update: this._lastUpdate(incident.getUniqueValue()),
            });
        }
        return issues;
    },

    // Outages that started recently and have not ended; linkable when raised from an incident
    _outages: function () {
        var outage = new GlideRecord('cmdb_ci_outage');
        outage.addNullQuery('end');
        outage.addQuery('begin', '>=', gs.daysAgoStart(LuxEscOutages.RECENT_DAYS));
        outage.orderByDesc('begin');
        outage.setLimit(LuxEscOutages.LIMIT);
        outage.query();
        var issues = [];
        while (outage.next()) {
            var task = outage.task_number.getRefRecord();
            var incident = task && task.isValidRecord() && task.getValue('sys_class_name') === 'incident' &&
                task.active.toString() === 'true';
            issues.push({
                sysId: incident ? task.getUniqueValue() : outage.getUniqueValue(),
                number: incident ? task.getValue('number') : '',
                title: outage.getValue('short_description') || outage.getDisplayValue('cmdb_ci') + ' ' + outage.getDisplayValue('type'),
                service: outage.getDisplayValue('cmdb_ci'),
                since: outage.getDisplayValue('begin'),
                kind: outage.getValue('type') === 'degradation' ? 'degradation' : 'outage',
                linkable: !!incident,
                update: incident ? this._lastUpdate(task.getUniqueValue()) : '',
            });
        }
        return issues;
    },

    // The latest customer-visible comment, which major incident managers use for updates
    _lastUpdate: function (taskId) {
        var journal = new GlideRecord('sys_journal_field');
        journal.addQuery('element_id', taskId);
        journal.addQuery('element', 'comments');
        journal.orderByDesc('sys_created_on');
        journal.setLimit(1);
        journal.query();
        return journal.next() ? String(journal.getValue('value')).substring(0, 400) : '';
    },

    _following: function (issueId, userId) {
        var child = new GlideRecord('incident');
        child.addActiveQuery();
        child.addQuery('parent_incident', issueId);
        child.addQuery('caller_id', userId);
        child.setLimit(1);
        child.query();
        return child.next() ? { sysId: child.getUniqueValue(), number: child.getValue('number') } : null;
    },

    // Callers other than the employee who raised a matching incident in the last hours
    _othersReporting: function (runId, query) {
        var words = new x_everi_luxesc.LuxEscIntake()._words(query);
        if (!words) return 0;
        var run = new GlideRecord('x_everi_luxesc_concierge_run');
        var userId = run.get(runId) ? run.getValue('user') : '';
        var since = new GlideDateTime();
        since.addSeconds(-3600 * LuxEscOutages.BURST_HOURS);
        var incident = new GlideAggregate('incident');
        incident.addQuery('sys_created_on', '>=', since);
        incident.addQuery('caller_id', '!=', userId);
        incident.addQuery('123TEXTQUERY321', words);
        incident.addAggregate('COUNT(DISTINCT', 'caller_id');
        incident.setGroup(false);
        incident.query();
        var callers = incident.next() ? parseInt(incident.getAggregate('COUNT(DISTINCT', 'caller_id'), 10) || 0 : 0;
        return callers >= LuxEscOutages.BURST_CALLERS ? callers : 0;
    },

    type: 'LuxEscOutages',
};
