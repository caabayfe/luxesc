// Employee Intake: the tools of the intake AI agent, which turns an employee's description of a
// problem into self-help from the knowledge base and similar fixed incidents, and a drafted
// incident or catalog request. The employee reviews and submits the draft in the portal.
// Classic script, like LuxEscConcierge, because the sn_aia runtime rejects module code.
var LuxEscIntake = Class.create();

LuxEscIntake.RUN = 'x_everi_luxesc_concierge_run';
LuxEscIntake.LIMIT = 5;
LuxEscIntake.TYPES = ['incident', 'catalog', 'none'];
// The request planner shares the catalog search, the knowledge drafter the knowledge search
LuxEscIntake.KINDS = ['intake', 'plan', 'article'];
LuxEscIntake.MAX_OTHERS = 50;
// Items that go in the cart (no record producers, order guides or content items)
LuxEscIntake.ORDERABLE = 'sc_cat_item,pc_hardware_cat_item,pc_software_cat_item,sc_cat_item_service';
LuxEscIntake.URGENCIES = ['1', '2', '3'];

LuxEscIntake.prototype = {
    initialize: function () {},

    // Published articles matching the words, best match first (platform text search)
    searchKnowledge: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var self = this;
        var articles = this._search(query, function (words) {
            var article = new GlideRecord('kb_knowledge');
            article.addQuery('workflow_state', 'published');
            article.addActiveQuery();
            article.addQuery('123TEXTQUERY321', words);
            return article;
        }, function (article) {
            return {
                sysId: article.getUniqueValue(),
                number: article.getValue('number'),
                title: self._plain(article.getValue('short_description')),
                excerpt: self._plain(article.getValue('text')).substring(0, 1200),
            };
        });
        return { articles: articles };
    },

    // Resolved incidents about the same thing and how they were fixed; numbers are not shown to
    // the employee because the incidents belong to other people
    similarIncidents: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var self = this;
        var incidents = this._search(query, function (words) {
            var incident = new GlideRecord('incident');
            incident.addQuery('state', 'IN', '6,7');
            incident.addQuery('close_notes', '!=', '');
            incident.addQuery('123TEXTQUERY321', words);
            return incident;
        }, function (incident) {
            return {
                problem: self._plain(incident.getValue('short_description')),
                category: incident.getValue('category'),
                fix: self._plain(incident.getValue('close_notes')).substring(0, 600),
            };
        });
        // Demo and cloned data repeat the same incident; one of each is enough
        var problems = {};
        return {
            incidents: incidents.filter(function (incident) {
                var key = incident.problem + '|' + incident.fix;
                if (problems[key]) return false;
                problems[key] = true;
                return true;
            }),
        };
    },

    // Catalog items (requests for hardware, software, access); orderableOnly keeps the ones that
    // can go in the cart, for the request planner
    searchCatalog: function (runId, query, orderableOnly) {
        if (!this._run(runId)) return { error: 'Unknown intake run' };
        var self = this;
        var items = this._search(query, function (words) {
            var item = new GlideRecord('sc_cat_item');
            item.addActiveQuery();
            item.addQuery('sys_class_name', 'IN', orderableOnly ? LuxEscIntake.ORDERABLE : LuxEscIntake.ORDERABLE + ',sc_cat_item_producer');
            item.addQuery('123TEXTQUERY321', words);
            return item;
        }, function (item) {
            return {
                sysId: item.getUniqueValue(),
                name: item.getValue('name'),
                description: self._plain(item.getValue('short_description')).substring(0, 300),
            };
        });
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
        // Only an issue that is still current, described by the platform rather than the agent
        var knownIssue = triage.knownIssue && new x_everi_luxesc.LuxEscOutages().find(triage.knownIssue.sysId);
        if (knownIssue) clean.knownIssue = knownIssue;
        clean.othersReporting = Math.min(LuxEscIntake.MAX_OTHERS, Math.max(0, parseInt(triage.othersReporting, 10) || 0));
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
        return run.get(runId) && LuxEscIntake.KINDS.indexOf(run.getValue('kind')) >= 0 ? run : null;
    },

    _cleanSelfHelp: function (selfHelp) {
        if (!selfHelp || !(selfHelp.steps instanceof Array) || !selfHelp.steps.length) return null;
        return {
            title: String(selfHelp.title || '').substring(0, 200),
            fixedIncidents: Math.min(LuxEscIntake.LIMIT, Math.max(0, parseInt(selfHelp.fixedIncidents, 10) || 0)),
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
        return String(query || '').replace(/[^\w\sÀ-ɏ-]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
    },

    // Text search matches every word, so a query with no hits is retried with its longest
    // words one at a time (the most distinctive ones), keeping results in order and unique
    _search: function (query, build, map) {
        var words = this._words(query);
        var singles = words.indexOf(' ') < 0 ? [] : words.split(' ').filter(function (word) {
            return word.length > 2;
        }).sort(function (a, b) {
            return b.length - a.length;
        }).slice(0, 3);
        var attempts = [words].concat(singles);
        var results = [];
        var seen = {};
        for (var i = 0; i < attempts.length && results.length < LuxEscIntake.LIMIT; i++) {
            if (!attempts[i]) continue;
            var gr = build(attempts[i]);
            gr.setLimit(LuxEscIntake.LIMIT);
            gr.query();
            while (gr.next() && results.length < LuxEscIntake.LIMIT) {
                if (seen[gr.getUniqueValue()]) continue;
                seen[gr.getUniqueValue()] = true;
                results.push(map(gr));
            }
            if (i === 0 && results.length) break;
        }
        return results;
    },

    _plain: function (html) {
        return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    },

    type: 'LuxEscIntake',
};
