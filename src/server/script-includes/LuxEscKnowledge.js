// Knowledge drafts: when a fix is confirmed (the employee says self-help fixed it, or an incident
// is resolved with useful close notes), the Knowledge Drafter agent writes the article and sends
// it to the knowledge team as a knowledge submission, unless an existing article already covers
// it. Submissions are the platform's route for people who cannot contribute to a knowledge base:
// the team reviews them and turns them into articles (Create Article), so nothing publishes itself.
// Classic script, like LuxEscConcierge, because the sn_aia runtime rejects module code.
var LuxEscKnowledge = Class.create();

LuxEscKnowledge.RUN = 'x_everi_luxesc_concierge_run';
LuxEscKnowledge.INCIDENTS_PROPERTY = 'x_everi_luxesc.kb_drafts.from_incidents';
// Close notes shorter than this ("Fixed", "Done") hold no reusable fix
LuxEscKnowledge.MIN_NOTES = 60;
LuxEscKnowledge.STATES = 'published,draft,review';
// Trending: views (kb_use) in the last days; topped up with the most viewed of all time
LuxEscKnowledge.TRENDING_DAYS = 30;
LuxEscKnowledge.TRENDING_LIMIT = 5;
LuxEscKnowledge.HEADINGS = {
    en: { symptoms: 'Symptoms', cause: 'Cause', steps: 'Steps', appliesTo: 'Applies to' },
    es: { symptoms: 'Síntoma', cause: 'Causa', steps: 'Pasos', appliesTo: 'Aplica a' },
};

LuxEscKnowledge.prototype = {
    initialize: function () {},

    // ---- Triggers -------------------------------------------------------------------------

    // The employee confirmed the intake's self-help fixed the problem
    fromIntake: function (intakeRunId) {
        var intake = new GlideRecord(LuxEscKnowledge.RUN);
        if (!intake.get(intakeRunId) || intake.getValue('user') !== gs.getUserID() || intake.getValue('kind') !== 'intake') {
            return null;
        }
        var triage = this._parse(intake.getValue('briefing'));
        if (!triage || !triage.selfHelp) throw new Error('There were no self-help steps to confirm');
        if (triage.fixed && triage.articleRun) return this._concierge().trace(triage.articleRun);
        var run = this._start('intake:' + intakeRunId);
        triage.fixed = true;
        triage.articleRun = run.id;
        intake.setValue('briefing', JSON.stringify(triage));
        intake.update();
        return run;
    },

    // The employee told the intake agent in the chat that its self-help fixed the problem. The fix
    // is kept as a completed intake run, so the drafter reads it like a portal one and it still
    // counts as a problem solved without a ticket.
    fromChat: function (problem, summary, steps, articleIds) {
        var intakeTools = new x_everi_luxesc.LuxEscIntake();
        var selfHelp = intakeTools._cleanSelfHelp({ steps: this._list(steps), articles: this._articles(articleIds) });
        if (!selfHelp) throw new Error('The steps that fixed the problem are needed');
        var intake = new GlideRecord(LuxEscKnowledge.RUN);
        intake.initialize();
        intake.setValue('user', gs.getUserID());
        intake.setValue('kind', 'intake');
        intake.setValue('prompt', String(problem || summary || '').substring(0, 2000));
        intake.setValue('state', 'completed');
        intake.setValue('finished_on', new GlideDateTime());
        intake.setValue('briefing', JSON.stringify({
            summary: String(summary || problem || '').substring(0, 300),
            selfHelp: selfHelp,
            recommendation: { type: 'none', reason: 'Fixed with self-help in the chat' },
        }));
        return this.fromIntake(intake.insert());
    },

    // An incident was resolved (business rule); skipped when off, when the notes are too thin,
    // when the resolver asked for the platform's own knowledge article, or when already drafted
    fromIncident: function (incidentId) {
        if (gs.getProperty(LuxEscKnowledge.INCIDENTS_PROPERTY, 'true') !== 'true') return null;
        var incident = new GlideRecord('incident');
        if (!incident.get(incidentId)) return null;
        if (String(incident.getValue('close_notes') || '').trim().length < LuxEscKnowledge.MIN_NOTES) return null;
        if (incident.getValue('knowledge') === '1') return null;
        var source = 'incident:' + incidentId;
        var earlier = new GlideRecord(LuxEscKnowledge.RUN);
        earlier.addQuery('kind', 'article');
        earlier.addQuery('prompt', source);
        earlier.setLimit(1);
        earlier.query();
        if (earlier.hasNext()) return null;
        return this._start(source);
    },

    // ---- Portal ---------------------------------------------------------------------------

    // The articles employees read most lately, among those the signed-in employee can read.
    // While recent views are few, the most viewed of all time fill the list (recentViews 0).
    trending: function () {
        var limit = LuxEscKnowledge.TRENDING_LIMIT;
        var use = new GlideAggregate('kb_use');
        use.addQuery('viewed', true);
        use.addQuery('sys_created_on', '>=', gs.daysAgoStart(LuxEscKnowledge.TRENDING_DAYS));
        use.addAggregate('COUNT');
        use.groupBy('article');
        use.query();
        var recent = [];
        while (use.next()) recent.push({ sysId: use.getValue('article'), views: parseInt(use.getAggregate('COUNT'), 10) || 0 });
        recent.sort(function (a, b) {
            return b.views - a.views;
        });
        var articles = [];
        var seen = {};
        for (var i = 0; i < recent.length && articles.length < limit; i++) {
            var article = new GlideRecordSecure('kb_knowledge');
            if (article.get(recent[i].sysId) && this._published(article)) {
                articles.push(this._summary(article, recent[i].views));
                seen[article.getUniqueValue()] = true;
            }
        }
        if (articles.length < limit) {
            var popular = new GlideRecordSecure('kb_knowledge');
            popular.addQuery('workflow_state', 'published');
            popular.addActiveQuery();
            popular.orderByDesc('sys_view_count');
            popular.setLimit(limit * 2);
            popular.query();
            while (popular.next() && articles.length < limit) {
                if (!seen[popular.getUniqueValue()]) articles.push(this._summary(popular, 0));
            }
        }
        return articles;
    },

    // Records that the employee opened an article, as the platform's article viewer does, so
    // portal reads count as views. The viewer fires kb.view and the OOB "Knowledge View" script
    // action writes kb_use; a scoped app may not queue that global event, so this writes the
    // same kb_use record directly.
    recordView: function (articleId) {
        var article = new GlideRecordSecure('kb_knowledge');
        if (!article.get(articleId) || !this._published(article)) return false;
        var view = new GlideRecord('kb_use');
        view.initialize();
        view.setValue('viewed', true);
        view.setValue('user', gs.getUserID());
        view.setValue('article', article.getUniqueValue());
        view.setValue('session_id', gs.getSessionID());
        return !!view.insert();
    },

    _published: function (article) {
        return article.getValue('workflow_state') === 'published' && article.getValue('active') === '1';
    },

    _summary: function (article, recentViews) {
        return {
            sysId: article.getUniqueValue(),
            number: article.getValue('number'),
            title: article.getValue('short_description'),
            recentViews: recentViews,
        };
    },

    // ---- Agent tools ----------------------------------------------------------------------

    // The problem and the fix that worked, without names: the article is for everyone
    readFix: function (runId) {
        var run = this._run(runId);
        if (!run) return { error: 'Unknown article run' };
        var source = this._source(run);
        if (source.type === 'intake') {
            var intake = new GlideRecord(LuxEscKnowledge.RUN);
            var triage = intake.get(source.id) ? this._parse(intake.getValue('briefing')) : null;
            if (!triage || !triage.selfHelp) return { error: 'The confirmed fix is no longer available' };
            return {
                confirmedBy: 'The employee confirmed that these steps fixed the problem',
                problem: intake.getValue('prompt'),
                summary: triage.summary,
                steps: triage.selfHelp.steps,
                basedOnArticles: triage.selfHelp.articles,
                basedOnFixedIncidents: triage.selfHelp.fixedIncidents || 0,
            };
        }
        var incident = new GlideRecord('incident');
        if (source.type !== 'incident' || !incident.get(source.id)) return { error: 'The resolved incident is not available' };
        return {
            confirmedBy: 'The service desk resolved this incident with the fix below',
            problem: incident.getValue('short_description'),
            details: String(incident.getValue('description') || '').substring(0, 1500),
            fix: String(incident.getValue('close_notes') || '').substring(0, 2000),
            category: incident.getDisplayValue('category'),
            service: incident.getDisplayValue('business_service') || incident.getDisplayValue('cmdb_ci'),
        };
    },

    // Published articles and the ones still being written, so one fix is not drafted twice
    searchArticles: function (runId, query) {
        if (!this._run(runId)) return { error: 'Unknown article run' };
        var intake = new x_everi_luxesc.LuxEscIntake();
        var articles = intake._search(query, function (words) {
            var article = new GlideRecord('kb_knowledge');
            article.addQuery('workflow_state', 'IN', LuxEscKnowledge.STATES);
            article.addActiveQuery();
            article.addQuery('123TEXTQUERY321', words);
            return article;
        }, function (article) {
            return {
                sysId: article.getUniqueValue(),
                number: article.getValue('number'),
                state: article.getValue('workflow_state'),
                title: intake._plain(article.getValue('short_description')),
                excerpt: intake._plain(article.getValue('text')).substring(0, 1200),
            };
        });
        return { articles: articles };
    },

    // {duplicateOf} when an article already covers the fix, otherwise the draft's content
    saveDraft: function (runId, draftJson) {
        var run = this._run(runId);
        if (!run) throw new Error('Unknown article run ' + runId);
        var draft = typeof draftJson === 'string' ? JSON.parse(draftJson) : draftJson;
        if (!draft) throw new Error('The draft must be a JSON object');
        if (draft.duplicateOf) {
            var existing = new GlideRecord('kb_knowledge');
            if (!/^[0-9a-f]{32}$/.test(draft.duplicateOf) || !existing.get(draft.duplicateOf)) {
                throw new Error('duplicateOf must be a sysId returned by the Search existing articles tool');
            }
            return this._save(run, {
                duplicateOf: {
                    sysId: existing.getUniqueValue(),
                    number: existing.getValue('number'),
                    title: existing.getValue('short_description'),
                    state: existing.getValue('workflow_state'),
                },
                reason: String(draft.reason || '').substring(0, 300),
            }, 'Already covered by ' + existing.getValue('number') + '; no draft created');
        }
        if (typeof draft.title !== 'string' || !draft.title.trim() || !(draft.steps instanceof Array) || !draft.steps.length) {
            throw new Error('The draft must have a title and steps');
        }
        var language = draft.language === 'es' ? 'es' : 'en';
        var source = this._source(run);
        var submission = new GlideRecord('kb_submission');
        submission.initialize();
        submission.setValue('short_description', draft.title.trim().substring(0, 160));
        submission.setValue('text', this._html(draft, LuxEscKnowledge.HEADINGS[language]));
        submission.setValue('description', 'Drafted by the Knowledge Drafter AI agent from ' +
            (source.type === 'incident' ? 'a resolved incident' : 'self-help an employee confirmed fixed their problem') +
            '. Keywords: ' + String(draft.keywords || '').substring(0, 400));
        submission.setValue('submitted_by', run.getValue('user'));
        submission.setValue('status', 'submitted');
        if (source.type === 'incident') submission.setValue('parent', source.id);
        if (!submission.insert()) throw new Error('The article could not be submitted');
        return this._save(run, {
            submission: { sysId: submission.getUniqueValue(), number: submission.getValue('number'), title: submission.getValue('short_description') },
        }, 'Article submitted for review as ' + submission.getValue('number'));
    },

    // ---- Internals ------------------------------------------------------------------------

    _concierge: function () {
        return new x_everi_luxesc.LuxEscConcierge();
    },

    _start: function (source) {
        return this._concierge().start('article', source);
    },

    _run: function (runId) {
        var run = new GlideRecord(LuxEscKnowledge.RUN);
        return run.get(runId) && run.getValue('kind') === 'article' ? run : null;
    },

    // The run's prompt names its source: "intake:<run sys_id>" or "incident:<sys_id>"
    _source: function (run) {
        var parts = String(run.getValue('prompt') || '').split(':');
        return { type: parts[0], id: /^[0-9a-f]{32}$/.test(parts[1]) ? parts[1] : '' };
    },

    _save: function (run, result, message) {
        run.setValue('briefing', JSON.stringify(result));
        run.update();
        return message;
    },

    _html: function (draft, headings) {
        var escape = function (text) {
            return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };
        var section = function (heading, body) {
            return body ? '<h3>' + heading + '</h3>' + body : '';
        };
        var paragraph = function (text) {
            return text ? '<p>' + escape(String(text).substring(0, 1500)) + '</p>' : '';
        };
        var steps = '<ol>' + draft.steps.slice(0, 10).map(function (step) {
            return '<li>' + escape(String(step).substring(0, 500)) + '</li>';
        }).join('') + '</ol>';
        return section(headings.symptoms, paragraph(draft.symptoms)) +
            section(headings.cause, paragraph(draft.cause)) +
            section(headings.steps, steps) +
            section(headings.appliesTo, paragraph(draft.appliesTo));
    },

    // Tool inputs arrive as strings: a JSON array, or one item per line
    _list: function (value) {
        if (value instanceof Array) return value;
        var parsed = this._parse(value);
        if (parsed instanceof Array) return parsed;
        return String(value || '').split(/\n+/).map(function (line) {
            return line.replace(/^\s*\d+[.)]\s*/, '').trim();
        }).filter(Boolean);
    },

    // The published articles the steps came from, as the drafter cites them
    _articles: function (articleIds) {
        var parsed = this._parse(articleIds);
        var ids = parsed instanceof Array ? parsed : String(articleIds || '').split(/[\s,]+/);
        return ids.map(function (id) {
            var article = new GlideRecordSecure('kb_knowledge');
            return /^[0-9a-f]{32}$/.test(String(id).trim()) && article.get(String(id).trim()) ?
                { sysId: article.getUniqueValue(), number: article.getValue('number'), title: article.getValue('short_description') } : null;
        }).filter(Boolean);
    },

    _parse: function (text) {
        try {
            return JSON.parse(text || '');
        } catch (e) {
            return null;
        }
    },

    type: 'LuxEscKnowledge',
};
