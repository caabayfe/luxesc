// Request Planner: the tools of the planner AI agent, which Otto calls when an employee needs
// several catalog items at once ("onboard 3 new hires in Madrid next Monday"). Values the agent
// proposes as names are resolved here to what the catalog takes (sys_ids, choice values) before
// an item goes in the employee's cart; the order is submitted only after they confirm in the chat.
// Tools run as the employee. Classic script, like LuxEscConcierge, because the sn_aia runtime
// rejects module code.
var LuxEscPlanner = Class.create();

LuxEscPlanner.MAX_QUANTITY = 20;
// item_option_new types that hold no answer (labels, containers, macros, UI pages, breaks)
LuxEscPlanner.LAYOUT_TYPES = ['11', '12', '14', '15', '17', '19', '20', '24', '25', '32'];
LuxEscPlanner.TYPE_NAMES = {
    '1': 'yes_no', '2': 'multi_line_text', '3': 'multiple_choice', '4': 'numeric_scale', '5': 'select_box',
    '6': 'single_line_text', '7': 'checkbox', '8': 'reference', '9': 'date', '10': 'date_time',
    '16': 'wide_single_line_text', '18': 'lookup_select_box', '21': 'list_collector', '22': 'lookup_multiple_choice',
    '26': 'email', '27': 'url', '28': 'ip_address', '29': 'duration', '31': 'requested_for',
};
LuxEscPlanner.BOOLEAN_TYPES = ['1', '7'];
LuxEscPlanner.CHOICE_TYPES = ['3', '5'];
LuxEscPlanner.REFERENCE_TYPES = ['8', '31'];
LuxEscPlanner.UNSUPPORTED_TYPES = ['21', '18', '22'];
LuxEscPlanner.TRUE_WORDS = ['true', 'yes', 'y', '1', 'on', 'si', 'sí'];

LuxEscPlanner.prototype = {
    initialize: function () {},

    searchCatalog: function (query) {
        return new x_everi_luxesc.LuxEscIntake().searchCatalog(query, true);
    },

    // The questions of an item, so the agent can propose answers; today's date resolves "next Monday"
    describeItem: function (itemId) {
        var item = this._item(itemId);
        if (!item) return { error: 'No orderable catalog item with sysId ' + itemId };
        return {
            today: new GlideDate().getValue(),
            sysId: item.getUniqueValue(),
            name: item.getValue('name'),
            description: String(item.getValue('short_description') || '').substring(0, 300),
            allowsQuantity: item.getValue('no_quantity') !== '1',
            variables: this._variables(itemId).map(function (variable) {
                var described = {
                    name: variable.name,
                    label: variable.label,
                    type: LuxEscPlanner.TYPE_NAMES[variable.type] || 'text',
                    mandatory: variable.mandatory,
                };
                if (variable.choices.length) described.choices = variable.choices.map(function (choice) {
                    return choice.text;
                });
                if (variable.reference) described.references = variable.reference;
                return described;
            }),
        };
    },

    // Adds one item with its answers to the employee's cart, unless mandatory questions are still
    // unanswered; returns what is in the cart now, including items that were already there
    addToCart: function (itemId, quantity, valuesJson) {
        var values = typeof valuesJson === 'string' ? (valuesJson.trim() ? JSON.parse(valuesJson) : {}) : valuesJson;
        var step = this._resolveStep({ itemSysId: itemId, quantity: quantity, values: values || {} }, 0);
        if (step.missing.length || step.unresolved.length) {
            return { added: false, item: step.itemName, missing: step.missing, unresolved: step.unresolved };
        }
        var cart = new sn_sc.CartJS();
        cart.addToCart({ sysparm_id: step.itemSysId, sysparm_quantity: String(step.quantity), variables: step.values });
        return { added: true, item: step.itemName, quantity: step.quantity, answers: step.display, cart: this._cartItems(cart) };
    },

    // Orders everything in the employee's cart
    submitOrder: function () {
        var cart = new sn_sc.CartJS();
        if (!this._cartItems(cart).length) throw new Error('The cart is empty');
        var result = cart.checkoutCart();
        var order = typeof result === 'string' ? JSON.parse(result) : result;
        if (!order || !order.request_number) throw new Error('The order could not be submitted');
        // The employee follows each requested item, not the request that groups them
        var items = [];
        var line = new GlideRecord('sc_req_item');
        line.addQuery('request', order.request_id);
        line.orderBy('number');
        line.query();
        while (line.next()) {
            items.push({ number: line.getValue('number'), item: line.getDisplayValue('cat_item'), link: x_everi_luxesc.LuxEscIntake.REQUEST_PAGE + line.getUniqueValue() });
        }
        return { requestNumber: order.request_number, requestSysId: order.request_id, items: items };
    },

    // ---- Internals ------------------------------------------------------------------------

    _cartItems: function (cart) {
        var line = cart.getCartItems();
        var items = [];
        while (line.next()) items.push({ item: line.getDisplayValue('cat_item'), quantity: parseInt(line.getValue('quantity'), 10) || 1 });
        return items;
    },

    _item: function (itemId) {
        if (!/^[0-9a-f]{32}$/.test(String(itemId))) return null;
        var item = new GlideRecord('sc_cat_item');
        item.addActiveQuery();
        item.addQuery('sys_id', itemId);
        item.addQuery('sys_class_name', 'IN', x_everi_luxesc.LuxEscIntake.ORDERABLE);
        item.query();
        return item.next() ? item : null;
    },

    // The item's own variables and those of its variable sets, in form order
    _variables: function (itemId) {
        var sets = [];
        var link = new GlideRecord('io_set_item');
        link.addQuery('sc_cat_item', itemId);
        link.query();
        while (link.next()) sets.push(link.getValue('variable_set'));

        var variable = new GlideRecord('item_option_new');
        variable.addActiveQuery();
        var owner = variable.addQuery('cat_item', itemId);
        if (sets.length) owner.addOrCondition('variable_set', 'IN', sets.join(','));
        variable.addQuery('type', 'NOT IN', LuxEscPlanner.LAYOUT_TYPES.join(','));
        variable.orderBy('order');
        variable.query();
        var variables = [];
        while (variable.next()) {
            var type = variable.getValue('type');
            variables.push({
                name: variable.getValue('name'),
                label: variable.getValue('question_text') || variable.getValue('name'),
                type: type,
                mandatory: variable.getValue('mandatory') === '1',
                hasDefault: !!variable.getValue('default_value'),
                reference: LuxEscPlanner.REFERENCE_TYPES.indexOf(type) >= 0 ? (variable.getValue('reference') || 'sys_user') : '',
                choices: LuxEscPlanner.CHOICE_TYPES.indexOf(type) >= 0 ? this._choices(variable.getUniqueValue()) : [],
            });
        }
        return variables;
    },

    _choices: function (variableId) {
        var choice = new GlideRecord('question_choice');
        choice.addQuery('question', variableId);
        // Inactive is often left empty rather than false
        choice.addNullQuery('inactive').addOrCondition('inactive', false);
        choice.orderBy('order');
        choice.query();
        var choices = [];
        while (choice.next()) choices.push({ value: choice.getValue('value'), text: choice.getValue('text') });
        return choices;
    },

    _resolveStep: function (step, index) {
        var item = this._item(step && step.itemSysId);
        if (!item) throw new Error('item_sys_id must be a sysId from the Search orderable items tool');
        var variables = this._variables(item.getUniqueValue());
        var values = {};
        var display = [];
        var unresolved = [];
        var given = step.values && typeof step.values === 'object' ? step.values : {};
        for (var key in given) {
            if (!given.hasOwnProperty(key) || given[key] === null || given[key] === '') continue;
            var variable = this._findVariable(variables, key);
            if (!variable) {
                unresolved.push({ field: key, reason: 'not a question on this item' });
                continue;
            }
            var resolved = this._resolveValue(variable, given[key]);
            if (resolved.error) {
                unresolved.push({ field: variable.label, reason: resolved.error });
                continue;
            }
            values[variable.name] = resolved.value;
            display.push({ name: variable.name, label: variable.label, value: resolved.display });
        }
        var missing = variables.filter(function (variable) {
            return variable.mandatory && !variable.hasDefault && !values.hasOwnProperty(variable.name);
        }).map(function (variable) {
            return variable.label;
        });
        var allowsQuantity = item.getValue('no_quantity') !== '1';
        var quantity = Math.min(LuxEscPlanner.MAX_QUANTITY, Math.max(1, parseInt(step.quantity, 10) || 1));
        return {
            itemSysId: item.getUniqueValue(),
            itemName: item.getValue('name'),
            quantity: allowsQuantity ? quantity : 1,
            allowsQuantity: allowsQuantity,
            why: String(step.why || '').substring(0, 300),
            values: values,
            display: display,
            unresolved: unresolved,
            missing: missing,
        };
    },

    _findVariable: function (variables, key) {
        var wanted = String(key).trim().toLowerCase();
        for (var i = 0; i < variables.length; i++) {
            if (variables[i].name.toLowerCase() === wanted || variables[i].label.toLowerCase() === wanted) return variables[i];
        }
        return null;
    },

    _resolveValue: function (variable, raw) {
        var text = String(raw).trim();
        var type = variable.type;
        if (LuxEscPlanner.UNSUPPORTED_TYPES.indexOf(type) >= 0) return { error: 'fill this one in the form' };
        if (LuxEscPlanner.BOOLEAN_TYPES.indexOf(type) >= 0) {
            var yes = LuxEscPlanner.TRUE_WORDS.indexOf(text.toLowerCase()) >= 0;
            return { value: String(yes), display: yes ? 'Yes' : 'No' };
        }
        if (variable.choices.length) {
            for (var i = 0; i < variable.choices.length; i++) {
                var choice = variable.choices[i];
                if (choice.value.toLowerCase() === text.toLowerCase() || choice.text.toLowerCase() === text.toLowerCase()) {
                    return { value: choice.value, display: choice.text };
                }
            }
            return { error: 'not one of: ' + variable.choices.map(function (option) { return option.text; }).join(', ') };
        }
        if (variable.reference) return this._resolveReference(variable.reference, text);
        if (type === '9' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: 'dates must be YYYY-MM-DD' };
        return { value: text.substring(0, 4000), display: text.substring(0, 200) };
    },

    // A sys_id as is, otherwise the one record whose display value matches: exactly, then starting
    // with, then containing the text ("Building 4" finds "Madrid - Building 4")
    _resolveReference: function (table, text) {
        var record = new GlideRecordSecure(table);
        if (!record.isValid()) return { error: 'unknown table ' + table };
        if (/^[0-9a-f]{32}$/.test(text)) {
            return record.get(text) ? { value: text, display: record.getDisplayValue() } : { error: 'no record ' + text };
        }
        var field = record.getDisplayName();
        var operators = ['=', 'STARTSWITH', 'LIKE'];
        for (var i = 0; i < operators.length; i++) {
            record = new GlideRecordSecure(table);
            record.addQuery(field, operators[i], text);
            if (record.isValidField('active')) record.addActiveQuery();
            record.setLimit(2);
            record.query();
            if (record.getRowCount() === 1 && record.next()) {
                return { value: record.getUniqueValue(), display: record.getDisplayValue() };
            }
            if (record.getRowCount() > 1) return { error: 'several records match "' + text + '"' };
        }
        return { error: 'no ' + table + ' record matches "' + text + '"' };
    },

    type: 'LuxEscPlanner',
};
