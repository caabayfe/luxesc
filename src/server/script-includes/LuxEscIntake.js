// Employee Intake: the tools of the intake AI agent, which turns an employee's description of a
// problem into self-help from the knowledge base and similar fixed incidents, and a drafted
// incident or catalog request. The employee reviews and submits the draft in the portal.
// Classic script, like LuxEscConcierge, because the sn_aia runtime rejects module code.
var LuxEscIntake = Class.create();

LuxEscIntake.RUN = 'x_everi_luxesc_concierge_run';
LuxEscIntake.LIMIT = 5;
LuxEscIntake.TYPES = ['incident', 'catalog', 'none'];
LuxEscIntake.URGENCIES = ['1', '2', '3'];

LuxEscIntake.prototype = {
    initialize: function () {},

    // Published articles matching the words, best match first (platform text search)
    searchKnowledge: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var article = new GlideRecord('kb_knowledge');
        article.addQuery('workflow_state', 'published');
        article.addActiveQuery();
        article.addQuery('123TEXTQUERY321', this._words(query));
        article.setLimit(LuxEscIntake.LIMIT);
        article.query();
        var articles = [];
        while (article.next()) {
            articles.push({
                sysId: article.getUniqueValue(),
                number: article.getValue('number'),
                title: article.getValue('short_description'),
                excerpt: this._plain(article.getValue('text')).substring(0, 1200),
            });
        }
        return { articles: articles };
    },

    // Resolved incidents about the same thing and how they were fixed; numbers are not shown to
    // the employee because the incidents belong to other people
    similarIncidents: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var incident = new GlideRecord('incident');
        incident.addQuery('state', 'IN', '6,7');
        incident.addQuery('close_notes', '!=', '');
        incident.addQuery('123TEXTQUERY321', this._words(query));
        incident.setLimit(LuxEscIntake.LIMIT);
        incident.query();
        var incidents = [];
        while (incident.next()) {
            incidents.push({
                problem: incident.getValue('short_description'),
                category: incident.getValue('category'),
                fix: this._plain(incident.getValue('close_notes')).substring(0, 600),
            });
        }
        return { incidents: incidents };
    },

    // Orderable catalog items (requests for hardware, software, access)
    searchCatalog: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var item = new GlideRecord('sc_cat_item');
        item.addActiveQuery();
        item.addQuery('sys_class_name', 'IN', 'sc_cat_item,sc_cat_item_producer');
        item.addQuery('123TEXTQUERY321', this._words(query));
        item.setLimit(LuxEscIntake.LIMIT);
        item.query();
        var items = [];
        while (item.next()) {
            items.push({
                sysId: item.getUniqueValue(),
                name: item.getValue('name'),
                description: this._plain(item.getValue('short_description')).substring(0, 300),
            });
        }
        return { items: items };
    },

    saveTriage: function (runId, triageJson) {
        var run = this._run(runId);
        if (!run) throw new Error('Unknown intake run ' + runId);
        var triage = typeof triageJson === 'string' ? JSON.parse(triageJson) : triageJson;
        if (!triage || typeof triage.summary !== 'string' || !triage.recommendation) {
            throw new Error('The triage must be {"summary": "...", "selfHelp": {...} or null, "recommendation": {...}}');
        }
        var recommendation = triage.recommendation;
        var type = LuxEscIntake.TYPES.indexOf(recommendation.type) >= 0 ? recommendation.type : 'incident';
        var clean = {
            summary: triage.summary.substring(0, 300),
            selfHelp: this._cleanSelfHelp(triage.selfHelp),
            recommendation: {
                type: type,
                reason: String(recommendation.reason || '').substring(0, 400),
            },
        };
        if (type === 'catalog') {
            var item = recommendation.catalogItem || {};
            if (!/^[0-9a-f]{32}$/.test(item.sysId) || !new GlideRecord('sc_cat_item').get(item.sysId)) {
                throw new Error('catalogItem.sysId must be a sysId returned by the Search catalog tool');
            }
            clean.recommendation.catalogItem = { sysId: item.sysId, name: String(item.name || '').substring(0, 200) };
            clean.recommendation.details = String(recommendation.details || '').substring(0, 1000);
        }
        if (type === 'incident') {
            var draft = recommendation.incident || {};
            clean.recommendation.incident = {
                shortDescription: String(draft.shortDescription || triage.summary).substring(0, 160),
                description: String(draft.description || '').substring(0, 4000),
                category: this._isChoice('incident', 'category', draft.category) ? draft.category : 'inquiry',
                urgency: LuxEscIntake.URGENCIES.indexOf(String(draft.urgency)) >= 0 ? String(draft.urgency) : '3',
            };
        }
        run.setValue('briefing', JSON.stringify(clean));
        run.update();
        return 'Triage saved: ' + type;
    },

    // ---- Internals ------------------------------------------------------------------------

    _run: function (runId) {
        var run = new GlideRecord(LuxEscIntake.RUN);
        return run.get(runId) && run.getValue('kind') === 'intake' ? run : null;
    },

    _cleanSelfHelp: function (selfHelp) {
        if (!selfHelp || !(selfHelp.steps instanceof Array) || !selfHelp.steps.length) return null;
        return {
            title: String(selfHelp.title || '').substring(0, 200),
            steps: selfHelp.steps.slice(0, 6).map(function (step) {
                return String(step).substring(0, 400);
            }),
            articles: (selfHelp.articles instanceof Array ? selfHelp.articles : []).slice(0, 3).filter(function (article) {
                return article && /^[0-9a-f]{32}$/.test(article.sysId);
            }).map(function (article) {
                return { sysId: article.sysId, number: String(article.number || ''), title: String(article.title || '').substring(0, 200) };
            }),
        };
    },

    _isChoice: function (table, element, value) {
        var choice = new GlideRecord('sys_choice');
        choice.addQuery('name', table);
        choice.addQuery('element', element);
        choice.addQuery('value', String(value || ''));
        choice.addQuery('inactive', false);
        choice.setLimit(1);
        choice.query();
        return choice.hasNext();
    },

    _words: function (query) {
        return String(query || '').replace(/[^\w\sÀ-ɏ-]/g, ' ').substring(0, 200);
    },

    _plain: function (html) {
        return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    },

    type: 'LuxEscIntake',
};
