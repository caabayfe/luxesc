// Employee Intake: the tools of the intake AI agent, which Otto calls when an employee reports
// that something is broken: self-help from the knowledge base and similar fixed incidents, and
// the incident it raises once the employee confirms. Tools run as the employee in the chat.
// Classic script, like LuxEscConcierge, because the sn_aia runtime rejects module code.
var LuxEscIntake = Class.create();

LuxEscIntake.LIMIT = 5;
// Items that go in the cart (no record producers, order guides or content items)
LuxEscIntake.ORDERABLE = 'sc_cat_item,pc_hardware_cat_item,pc_software_cat_item,sc_cat_item_service';
LuxEscIntake.URGENCIES = ['1', '2', '3'];
// Where an employee follows one of their incidents or requested items in the portal
LuxEscIntake.REQUEST_PAGE = '/aiux/luxesc/requests/';

LuxEscIntake.prototype = {
    initialize: function () {},

    // Published articles matching the words, best match first (platform text search)
    searchKnowledge: function (query) {
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
    similarIncidents: function (query) {
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
    searchCatalog: function (query, orderableOnly) {
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

    // The employee confirmed the draft in the chat. With a known issue, the incident is raised
    // under it (LuxEscOutages.follow) so it is updated and closed with the major incident.
    raiseIncident: function (shortDescription, description, category, urgency, knownIssueId) {
        shortDescription = String(shortDescription || '').trim().substring(0, 160);
        if (!shortDescription) throw new Error('A short description is needed');
        description = String(description || '').substring(0, 4000);
        if (/^[0-9a-f]{32}$/.test(String(knownIssueId || ''))) {
            var linked = new x_everi_luxesc.LuxEscOutages().follow(knownIssueId, shortDescription, description);
            return { number: linked.number, sysId: linked.sysId, link: LuxEscIntake.REQUEST_PAGE + linked.sysId, linkedToKnownIssue: true };
        }
        var incident = new GlideRecordSecure('incident');
        incident.initialize();
        incident.setValue('caller_id', gs.getUserID());
        incident.setValue('short_description', shortDescription);
        incident.setValue('description', description);
        incident.setValue('category', this._isChoice('incident', 'category', category) ? category : 'inquiry');
        incident.setValue('urgency', LuxEscIntake.URGENCIES.indexOf(String(urgency)) >= 0 ? String(urgency) : '3');
        incident.setValue('contact_type', 'self-service');
        if (!incident.insert()) throw new Error('The incident could not be raised');
        return { number: incident.getValue('number'), sysId: incident.getUniqueValue(), link: LuxEscIntake.REQUEST_PAGE + incident.getUniqueValue(), linkedToKnownIssue: false };
    },

    // ---- Internals ------------------------------------------------------------------------

    // Self-help as the knowledge drafter reads it: at most 6 steps and the articles they came from
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
