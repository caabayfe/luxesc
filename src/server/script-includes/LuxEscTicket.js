// The employee's view of one of their requests or incidents (GET /tickets/{task}): what it is,
// where it is, the few facts that matter to them, the answers they gave when ordering, the files
// and the conversation with the people working on it. Only customer-visible comments are read,
// never work notes, whatever roles the viewer has. The record is read with the employee's access.
var LuxEscTicket = Class.create();

// Question types that hold no answer (labels, containers, macros, UI pages) or must stay hidden (masked)
LuxEscTicket.NO_ANSWER_TYPES = ['11', '12', '14', '15', '17', '19', '20', '24', '25'];
LuxEscTicket.MAX_COMMENTS = 50;
LuxEscTicket.MAX_FILES = 25;

LuxEscTicket.prototype = {
    initialize: function () {},

    get: function (taskId) {
        var task = new GlideRecordSecure('task');
        if (!/^[0-9a-f]{32}$/.test(String(taskId)) || !task.get(taskId)) return null;
        var table = task.getRecordClassName();
        var record = new GlideRecordSecure(table);
        if (!record.get(taskId)) return null;
        var isItem = table === 'sc_req_item';
        var journey = new x_everi_luxesc.LuxEscConcierge()._journeyOf(record);
        var files = this._files(record);
        return {
            sysId: taskId,
            table: table,
            number: record.getValue('number'),
            type: isItem ? gs.getMessage('Request') : gs.getMessage('Incident'),
            title: (isItem && record.getDisplayValue('cat_item')) || record.getValue('short_description') || record.getValue('number'),
            summary: record.getValue('short_description') || '',
            description: isItem ? '' : this._plain(record.getValue('description')).substring(0, 2000),
            state: record.getDisplayValue('state'),
            stage: isItem ? record.getDisplayValue('stage') : '',
            open: record.getValue('active') === '1',
            // A resolved incident waits for the employee to confirm the fix
            resolved: table === 'incident' && record.getValue('state') === '6',
            openedAt: record.getDisplayValue('opened_at'),
            updatedAt: record.getDisplayValue('sys_updated_on'),
            journey: journey,
            facts: isItem ? this._itemFacts(record) : this._incidentFacts(record),
            answers: isItem ? this._answers(record) : [],
            files: files,
            thread: this._thread(record, files),
            canComment: record.isValidField('comments') && record.comments.canWrite(),
        };
    },

    // ---- Facts -------------------------------------------------------------------------------

    _itemFacts: function (item) {
        var facts = [
            this._fact(gs.getMessage('Handled by'), item.getDisplayValue('assignment_group')),
            this._fact(gs.getMessage('Expected'), item.getDisplayValue('due_date').split(' ')[0]),
            this._fact(gs.getMessage('Quantity'), item.getValue('quantity')),
            this._fact(gs.getMessage('Part of'), item.getDisplayValue('request')),
        ];
        var requestedFor = item.request.requested_for;
        if (requestedFor && String(requestedFor) !== gs.getUserID()) {
            facts.push(this._fact(gs.getMessage('Requested for'), item.request.requested_for.getDisplayValue()));
        }
        return facts.filter(Boolean);
    },

    _incidentFacts: function (incident) {
        return [
            this._fact(gs.getMessage('Handled by'), incident.getDisplayValue('assignment_group')),
            this._fact(gs.getMessage('Assigned to'), incident.getDisplayValue('assigned_to')),
            this._fact(gs.getMessage('Urgency'), incident.getDisplayValue('urgency')),
            this._fact(gs.getMessage('Category'), incident.getDisplayValue('category')),
        ].filter(Boolean);
    },

    _fact: function (label, value) {
        return value ? { label: label, value: String(value) } : null;
    },

    // ---- Answers -----------------------------------------------------------------------------

    // What the employee answered when ordering, as question and answer (choices by their label)
    _answers: function (item) {
        var answers = [];
        var option = new GlideRecord('sc_item_option_mtom');
        option.addQuery('request_item', item.getUniqueValue());
        option.orderBy('sc_item_option.order');
        option.query();
        while (option.next()) {
            var question = option.sc_item_option.item_option_new;
            var name = question.name.toString();
            if (!name || LuxEscTicket.NO_ANSWER_TYPES.indexOf(question.type.toString()) >= 0) continue;
            var variable = item.variables[name];
            var answer = variable ? String(variable.getDisplayValue() || '') : '';
            if (question.type.toString() === '7') answer = answer === 'true' ? gs.getMessage('Yes') : '';
            if (!answer) continue;
            answers.push({ question: question.question_text.toString() || name, answer: answer.substring(0, 500) });
        }
        return answers;
    },

    // ---- Files and conversation --------------------------------------------------------------

    _files: function (record) {
        var files = [];
        var attachment = new GlideRecordSecure('sys_attachment');
        attachment.addQuery('table_name', record.getRecordClassName());
        attachment.addQuery('table_sys_id', record.getUniqueValue());
        attachment.orderByDesc('sys_created_on');
        attachment.setLimit(LuxEscTicket.MAX_FILES);
        attachment.query();
        while (attachment.next()) {
            files.push({
                sysId: attachment.getUniqueValue(),
                name: attachment.getValue('file_name'),
                size: parseInt(attachment.getValue('size_bytes'), 10) || 0,
                contentType: attachment.getValue('content_type'),
                by: attachment.getValue('sys_created_by'),
                at: attachment.getDisplayValue('sys_created_on'),
                when: new GlideDateTime(attachment.getValue('sys_created_on')).getNumericValue(),
            });
        }
        return files;
    },

    // Customer-visible comments and added files, newest first. Work notes are never read.
    _thread: function (record, files) {
        var entries = [];
        if (record.isValidField('comments') && record.comments.canRead()) {
            var journal = new GlideRecord('sys_journal_field');
            journal.addQuery('element_id', record.getUniqueValue());
            journal.addQuery('element', 'comments');
            journal.orderByDesc('sys_created_on');
            journal.setLimit(LuxEscTicket.MAX_COMMENTS);
            journal.query();
            while (journal.next()) {
                entries.push({
                    kind: 'comment',
                    by: journal.getValue('sys_created_by'),
                    at: journal.getDisplayValue('sys_created_on'),
                    when: new GlideDateTime(journal.getValue('sys_created_on')).getNumericValue(),
                    text: this._plain(journal.getValue('value')),
                });
            }
        }
        files.forEach(function (file) {
            entries.push({ kind: 'file', by: file.by, at: file.at, when: file.when, file: file.sysId, text: file.name });
        });
        entries.sort(function (a, b) {
            return b.when - a.when;
        });
        var names = this._names(entries);
        var me = gs.getUserName();
        entries.forEach(function (entry) {
            entry.you = entry.by === me;
            entry.author = names[entry.by] || entry.by;
            delete entry.by;
        });
        files.forEach(function (file) {
            file.by = names[file.by] || file.by;
        });
        return entries;
    },

    // Journal entries and attachments name their author by user name
    _names: function (entries) {
        var names = {};
        var userNames = entries.map(function (entry) {
            return entry.by;
        });
        if (!userNames.length) return names;
        var user = new GlideRecord('sys_user');
        user.addQuery('user_name', 'IN', userNames.join(','));
        user.query();
        while (user.next()) names[user.getValue('user_name')] = user.getValue('name');
        return names;
    },

    // Journal values carry [code] markup and some HTML; the page shows plain text
    _plain: function (value) {
        return String(value || '')
            .replace(/\[\/?code\]/g, '')
            .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/div>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    },

    type: 'LuxEscTicket',
};
