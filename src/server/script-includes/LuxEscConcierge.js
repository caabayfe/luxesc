// Employee Concierge: starts the portal's AI agents for the signed-in employee (the concierge
// briefing, or the problem intake served by LuxEscIntake), serves the concierge's tools (the
// employee's requests and approvals, saving the briefing) and reports progress.
// Classic script on purpose: the sn_aia runtime rejects calls made from module code.
var LuxEscConcierge = Class.create();

LuxEscConcierge.AGENTS = {
    concierge: 'Employee Concierge',
    intake: 'Employee Intake',
    plan: 'Request Planner',
    article: 'Knowledge Drafter',
};
LuxEscConcierge.RUN = 'x_everi_luxesc_concierge_run';
LuxEscConcierge.REQUEST_CLASSES = 'sc_req_item,incident';
// Execution plan states after which the agent writes no more steps
LuxEscConcierge.DONE_STATES = ['completed', 'terminated', 'failed', 'cancelled', 'canceled', 'error'];
LuxEscConcierge.MAX_ITEMS = 6;
LuxEscConcierge.OUTCOMES = ['approve', 'reject', 'comment', 'close', 'reopen'];

LuxEscConcierge.prototype = {
    initialize: function () {},

    // ---- REST: start, latest, trace -------------------------------------------------------

    // kind: 'concierge' (default), or 'intake' and 'plan', which need the employee's own words in
    // text, or 'article', whose text names the confirmed fix (see LuxEscKnowledge)
    start: function (kind, text) {
        kind = LuxEscConcierge.AGENTS.hasOwnProperty(kind) ? kind : 'concierge';
        text = String(text || '').trim().substring(0, 2000);
        if (kind !== 'concierge' && !text) throw new Error('Describe what you need first');

        var run = new GlideRecord(LuxEscConcierge.RUN);
        run.initialize();
        run.setValue('user', gs.getUserID());
        run.setValue('kind', kind);
        run.setValue('prompt', text);
        run.setValue('state', 'running');
        var runId = run.insert();

        try {
            var agent = LuxEscConcierge.AGENTS[kind];
            var agentId = this._agentId(agent);
            if (!agentId) throw new Error('The ' + agent + ' agent is not installed');
            var words = '. The employee wrote: """' + text.replace(/"""/g, '"') + '"""';
            var objective = {
                // The briefing has no words of the employee to follow, so it takes their UI language
                concierge: 'Prepare the concierge briefing for ' + gs.getUserDisplayName() + '. Run id: ' + runId +
                    '. Write it in the language with code "' + (gs.getSession().getLanguage() || 'en') + '"',
                intake: 'Help ' + gs.getUserDisplayName() + ' with this problem. Run id: ' + runId + words,
                plan: 'Plan the catalog requests for ' + gs.getUserDisplayName() + '. Today is ' +
                    new GlideDate().getValue() + '. Run id: ' + runId + words,
                article: 'Draft a knowledge article from a confirmed fix. Run id: ' + runId,
            }[kind];
            var result = new sn_aia.AiAgentRuntimeUtil().startAiAgentConversation({
                agentId: agentId,
                objective: objective,
                conversationLabel: 'Lux Employee Center ' + kind,
                // Unattended: the agent must finish without asking the employee anything
                canInteractWithUser: false,
            });
            if (!result) throw new Error('AI Agents are not available on this instance');
            if (result.status !== 'success' || !result.data || !result.data.executionPlanId) {
                gs.error('Concierge agent did not start: ' + JSON.stringify(result));
                throw new Error((result.error && result.error.message) || 'the AI agent runtime refused the request');
            }
            run.setValue('execution_plan', result.data.executionPlanId);
            run.setValue('conversation', result.data.conversationId || '');
        } catch (e) {
            run.setValue('state', 'failed');
            run.setValue('error', String(e.message || e).substring(0, 1000));
            run.setValue('finished_on', new GlideDateTime());
        }
        run.update();
        return this._dto(run, []);
    },

    // Today's latest run, so the briefing survives a page reload
    latest: function () {
        var run = new GlideRecord(LuxEscConcierge.RUN);
        run.addQuery('user', gs.getUserID());
        run.addQuery('kind', 'concierge').addOrCondition('kind', '');
        run.addQuery('sys_created_on', '>=', gs.beginningOfToday());
        run.orderByDesc('sys_created_on');
        run.setLimit(1);
        run.query();
        return run.next() ? this.trace(run.getUniqueValue()) : null;
    },

    // Runs are private to whoever started them
    trace: function (runId) {
        var run = new GlideRecord(LuxEscConcierge.RUN);
        if (!run.get(runId) || run.getValue('user') !== gs.getUserID()) return null;
        if (run.getValue('state') === 'running') this._refresh(run);
        var planId = run.getValue('execution_plan');
        return this._dto(run, planId ? this._steps(planId) : []);
    },

    // ---- Agent tools ----------------------------------------------------------------------

    // The run names the employee, so tools answer for the person who asked even though the
    // agent works in the background
    openRequests: function (runId) {
        var userId = this._runUser(runId);
        if (!userId) return { error: 'Unknown concierge run' };
        var task = new GlideRecord('task');
        task.addActiveQuery();
        task.addQuery('sys_class_name', 'IN', LuxEscConcierge.REQUEST_CLASSES);
        var mine = task.addQuery('opened_by', userId);
        mine.addOrCondition('sys_id', 'IN', this._requestedFor(userId));
        task.orderByDesc('sys_updated_on');
        task.setLimit(15);
        task.query();
        var now = new GlideDateTime();
        var requests = [];
        while (task.next()) {
            var updated = new GlideDateTime(task.getValue('sys_updated_on'));
            requests.push({
                sysId: task.getUniqueValue(),
                number: task.getValue('number'),
                type: task.getDisplayValue('sys_class_name'),
                summary: task.getValue('short_description'),
                state: task.getDisplayValue('state'),
                approval: task.getDisplayValue('approval'),
                assignedGroup: task.getDisplayValue('assignment_group'),
                openedOn: task.getDisplayValue('opened_at'),
                daysSinceUpdate: Math.floor(GlideDateTime.subtract(updated, now).getNumericValue() / 86400000),
                lastComment: this._lastComment(task),
            });
        }
        return { requests: requests };
    },

    pendingApprovals: function (runId) {
        var userId = this._runUser(runId);
        if (!userId) return { error: 'Unknown concierge run' };
        var approval = new GlideRecord('sysapproval_approver');
        approval.addQuery('approver', userId);
        approval.addQuery('state', 'requested');
        approval.orderBy('sys_created_on');
        approval.setLimit(10);
        approval.query();
        var now = new GlideDateTime();
        var approvals = [];
        while (approval.next()) {
            var created = new GlideDateTime(approval.getValue('sys_created_on'));
            var target = approval.sysapproval.getRefRecord();
            var found = target && target.isValidRecord();
            approvals.push({
                approvalSysId: approval.getUniqueValue(),
                forRecord: approval.getDisplayValue('sysapproval') || approval.getDisplayValue('document_id'),
                summary: found ? target.getValue('short_description') : '',
                requestedBy: found ? target.getDisplayValue('opened_by') : '',
                price: found && target.isValidField('price') ? target.getDisplayValue('price') : '',
                daysWaiting: Math.floor(GlideDateTime.subtract(created, now).getNumericValue() / 86400000),
            });
        }
        return { approvals: approvals };
    },

    saveBriefing: function (runId, briefingJson) {
        var run = new GlideRecord(LuxEscConcierge.RUN);
        if (!run.get(runId)) throw new Error('Unknown concierge run ' + runId);
        var briefing = typeof briefingJson === 'string' ? JSON.parse(briefingJson) : briefingJson;
        if (!briefing || typeof briefing.headline !== 'string' || !(briefing.items instanceof Array)) {
            throw new Error('The briefing must be {"headline": "...", "items": [...]}');
        }
        var clean = {
            headline: briefing.headline.substring(0, 300),
            items: briefing.items.slice(0, LuxEscConcierge.MAX_ITEMS).map(function (item) {
                return {
                    kind: String(item.kind || 'info').substring(0, 20),
                    number: String(item.number || '').substring(0, 40),
                    sysId: /^[0-9a-f]{32}$/.test(item.sysId) ? item.sysId : '',
                    approvalId: /^[0-9a-f]{32}$/.test(item.approvalId) ? item.approvalId : '',
                    draft: String(item.draft || '').substring(0, 500),
                    title: String(item.title || '').substring(0, 200),
                    detail: String(item.detail || '').substring(0, 600),
                    question: String(item.question || '').substring(0, 300),
                };
            }),
        };
        run.setValue('briefing', JSON.stringify(clean));
        run.update();
        return 'Briefing saved with ' + clean.items.length + ' items';
    },

    // Remembers what the employee did on a briefing item (approve, comment, ...), so the
    // briefing does not offer it again after a reload. Only the run's owner can record.
    recordOutcome: function (runId, key, action) {
        var run = new GlideRecord(LuxEscConcierge.RUN);
        if (!run.get(runId) || run.getValue('user') !== gs.getUserID()) return null;
        if (LuxEscConcierge.OUTCOMES.indexOf(action) < 0) throw new Error('Unknown action ' + action);
        var briefing = this._parse(run.getValue('briefing') || '');
        if (!briefing || !(briefing.items instanceof Array)) return null;
        var found = false;
        briefing.items.forEach(function (item) {
            if (key && (item.approvalId === key || item.sysId === key)) {
                item.outcome = action;
                found = true;
            }
        });
        if (!found) return null;
        run.setValue('briefing', JSON.stringify(briefing));
        run.update();
        return this.trace(runId);
    },

    // ---- Internals ------------------------------------------------------------------------

    _agentId: function (name) {
        var agent = new GlideRecord('sn_aia_agent');
        return agent.get('name', name) ? agent.getUniqueValue() : '';
    },

    _runUser: function (runId) {
        var run = new GlideRecord(LuxEscConcierge.RUN);
        return run.get(runId) ? run.getValue('user') : '';
    },

    // Requested items raised on the employee's behalf by someone else
    _requestedFor: function (userId) {
        var ids = [];
        var item = new GlideRecord('sc_req_item');
        item.addActiveQuery();
        item.addQuery('request.requested_for', userId);
        item.setLimit(15);
        item.query();
        while (item.next()) ids.push(item.getUniqueValue());
        return ids.join(',');
    },

    _lastComment: function (task) {
        var journal = new GlideRecord('sys_journal_field');
        journal.addQuery('element_id', task.getUniqueValue());
        journal.addQuery('element', 'comments');
        journal.orderByDesc('sys_created_on');
        journal.setLimit(1);
        journal.query();
        if (!journal.next()) return '';
        return (journal.getValue('sys_created_by') + ': ' + journal.getValue('value')).substring(0, 300);
    },

    _dto: function (run, steps) {
        var briefing = null;
        try {
            briefing = run.getValue('briefing') ? JSON.parse(run.getValue('briefing')) : null;
        } catch (e) {
            briefing = null;
        }
        return {
            id: run.getUniqueValue(),
            kind: run.getValue('kind') || 'concierge',
            prompt: run.getValue('prompt') || '',
            state: run.getValue('state'),
            startedOn: run.getDisplayValue('sys_created_on'),
            finishedOn: run.getDisplayValue('finished_on'),
            output: run.getValue('output') || '',
            error: run.getValue('error') || '',
            ms: parseInt(run.getValue('execution_ms'), 10) || 0,
            briefing: briefing,
            steps: steps,
        };
    },

    // Copies the plan's progress onto the run; once the plan finished the result is final
    _refresh: function (run) {
        var plan = new GlideRecord('sn_aia_execution_plan');
        if (!plan.get(run.getValue('execution_plan'))) return;
        var planState = plan.getValue('state') || '';
        run.setValue('plan_state', planState);
        run.setValue('execution_ms', plan.getValue('execution_time_ms') || 0);
        if (LuxEscConcierge.DONE_STATES.indexOf(planState) >= 0) {
            var output = this._finalAnswer(plan.getUniqueValue());
            var saved = !!run.getValue('briefing');
            var noun = { intake: 'triage', plan: 'plan', article: 'draft' }[run.getValue('kind')] || 'briefing';
            run.setValue('state', planState === 'completed' && saved ? 'completed' : 'failed');
            run.setValue('output', output.substring(0, 4000));
            if (!saved || planState !== 'completed') {
                run.setValue('error', ('The agent ' + (saved ? 'stopped' : 'finished without a ' + noun) +
                    ' (' + planState + (plan.getValue('state_reason') ? ': ' + plan.getValue('state_reason') : '') + ')').substring(0, 1000));
            }
            run.setValue('finished_on', new GlideDateTime());
        }
        run.update();
    },

    _parse: function (text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    },

    // gen_ai steps carry the ReAct answer as a JSON string under result: Thought and Action[].Name
    _steps: function (planId) {
        var task = new GlideRecord('sn_aia_execution_task');
        task.addQuery('execution_plan', planId);
        task.orderBy('order');
        task.orderBy('sys_created_on');
        task.query();
        var steps = [];
        while (task.next()) {
            var type = task.getValue('type');
            var thought = '';
            var actions = [];
            if (type === 'gen_ai') {
                var output = this._parse(task.getValue('output') || '');
                var answer = output && typeof output.result === 'string' ? this._parse(output.result) : output && output.result;
                if (answer && typeof answer === 'object') {
                    thought = String(answer.Thought || '').substring(0, 800);
                    actions = (answer.Action instanceof Array ? answer.Action : []).map(function (action) {
                        return String(action && action.Name);
                    }).filter(function (name) {
                        return name && name !== 'undefined';
                    });
                }
            }
            steps.push({
                order: parseInt(task.getValue('order'), 10) || 0,
                type: type,
                status: task.getValue('status') || '',
                name: type === 'gen_ai' ? 'Reasoning' : task.getValue('description') || type,
                thought: thought,
                actions: actions,
            });
        }
        return steps;
    },

    // The answer is the latest agent message addressed to the user (user_message)
    _finalAnswer: function (planId) {
        var message = new GlideRecord('sn_aia_message');
        message.addQuery('execution_plan', planId);
        message.addQuery('role', 'agent');
        message.orderByDesc('sys_created_on');
        message.setLimit(30);
        message.query();
        while (message.next()) {
            var answer = (message.getValue('user_message') || '').trim();
            if (answer) return answer;
        }
        return '';
    },

    type: 'LuxEscConcierge',
};
