import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Otto calls this agent in the chat when an employee needs several catalog items at once. Tools go
// through LuxEscPlanner and run as that employee; items go in their own cart.
const searchCatalogScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscPlanner().searchCatalog(inputs.query);
    } catch (e) {
        gs.error('Request Planner could not search the catalog: ' + e.message);
        return { error: 'The catalog could not be searched' };
    }
})(inputs);`

const describeItemScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscPlanner().describeItem(inputs.item_sys_id);
    } catch (e) {
        gs.error('Request Planner could not read the item: ' + e.message);
        return { error: 'The item could not be read' };
    }
})(inputs);`

const addToCartScript = `(function(inputs) {
    try {
        var result = new x_everi_luxesc.LuxEscPlanner().addToCart(inputs.item_sys_id, inputs.quantity, inputs.values);
        result.status = result.added ? 'success' : 'incomplete';
        return result;
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const submitOrderScript = `(function(inputs) {
    try {
        var order = new x_everi_luxesc.LuxEscPlanner().submitOrder();
        return { status: 'success', requestNumber: order.requestNumber, items: order.items };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

export const requestPlanner = AiAgent({
    $id: Now.ID['request_planner_agent'],
    name: 'Request Planner',
    description:
        'Orders several catalog items at once from one description (for example "onboard 3 new hires in Madrid next Monday"): finds the items, asks the missing answers, adds them to the cart and submits the order once the employee confirms.',
    agentRole: 'You are a meticulous service catalog expert who plans complete, correct requests.',
    recordType: 'custom',
    channel: 'nap_and_va',
    processingMessage: 'Planning your request...',
    postProcessingMessage: 'Your request is planned.',
    securityAcl: { $id: Now.ID['request_planner_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Write every message in the language the employee writes in, even when the catalog or articles are in another language.

Step 1: Understand.
- List the separate things needed (for example a laptop, software, access), how many of each, for whom, where and by when.

Step 2: Find items.
- Use the Search orderable items tool once per thing with 1 to 3 keywords; try a synonym if nothing fits.
- Pick the single best item per thing. If nothing fits, say so later.

Step 3: Read questions.
- Use the Describe catalog item tool for each picked item. Work out dates such as "next Monday" from its today value, as YYYY-MM-DD.
- Answer what you can from the employee's words: for choices use a listed choice, for people and locations the name, for yes/no yes or no. Never invent facts.
- If mandatory questions are unanswered, use collect_input_from_user to ask them all in one message.

Step 4: Confirm the plan.
- Use collect_input_from_user to show a short numbered list (item, quantity and the main answers, plus anything you could not plan) and ask whether to add it to the cart. Apply any change the employee asks for. Add nothing before they agree.

Step 5: Add to cart.
- Use the Add to cart tool once per item, with values as a JSON object keyed by question name.
- If it reports missing or unusable answers, fix the obvious ones (a listed choice, a date format) and retry once; otherwise ask the employee.

Step 6: Submit.
- Use collect_input_from_user to show what is in the cart now, including items that were already there, and ask whether to submit the order. This is the only confirmation: do not ask again.
- If yes, use the Submit order tool once.

Step 7: Finish.
- Use show_output_to_user exactly once, in the employee's language: one sentence saying the order was placed with its request number, then a bullet per requested item as a Markdown link [number · item](link), and one sentence saying they can follow each item and add comments there. If they did not submit, say the items stay in their cart.
- Then end right away with finish. Never show the result a second time.
- Never show sysIds, JSON or field names.`,
        },
    ],
    tools: [
        {
            name: 'Search orderable items',
            description: 'Searches catalog items that can be added to the cart, by keywords (query). Returns sysId, name and description.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Searching the catalog...',
            postMessage: 'Catalog searched.',
            inputs: [{ name: 'query', description: 'A few keywords, e.g. "laptop"', mandatory: true }],
            script: searchCatalogScript,
        },
        {
            name: 'Describe catalog item',
            description: "Returns today's date and the questions (variables) of a catalog item (item_sys_id): name, label, type, mandatory, choices and whether it allows a quantity.",
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Reading the item questions...',
            postMessage: 'Item questions read.',
            inputs: [{ name: 'item_sys_id', description: 'sysId of the catalog item from Search orderable items', mandatory: true }],
            script: describeItemScript,
        },
        {
            // Changes the employee's cart: the instructions have them agree to the plan first
            name: 'Add to cart',
            description: "Adds a catalog item (item_sys_id) with a quantity and answers (values) to the employee's cart. Returns status, missing or unusable answers, and the cart contents.",
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Adding to your cart...',
            postMessage: 'Cart updated.',
            inputs: [
                { name: 'item_sys_id', description: 'sysId of the catalog item from Search orderable items', mandatory: true },
                { name: 'quantity', description: 'How many, 1 to 20', mandatory: true },
                { name: 'values', description: 'JSON object of answers keyed by question name, e.g. {"location": "Madrid"}', mandatory: false },
            ],
            script: addToCartScript,
        },
        {
            // Places the order: the instructions have them agree to the cart first
            name: 'Submit order',
            description: "Submits everything in the employee's cart as one request. Returns status, the request number and its requested items (number, item and the link where the employee follows each).",
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Submitting your order...',
            postMessage: 'Order submitted.',
            inputs: [],
            script: submitOrderScript,
        },
    ],
})
