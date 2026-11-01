import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Tools go through LuxEscPlanner; each checks the run id so they only serve the portal's plan runs
const searchCatalogScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscPlanner().searchCatalog(inputs.run_id, inputs.query);
    } catch (e) {
        gs.error('Request Planner could not search the catalog: ' + e.message);
        return { error: 'The catalog could not be searched' };
    }
})(inputs);`

const describeItemScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscPlanner().describeItem(inputs.run_id, inputs.item_sys_id);
    } catch (e) {
        gs.error('Request Planner could not read the item: ' + e.message);
        return { error: 'The item could not be read' };
    }
})(inputs);`

const savePlanScript = `(function(inputs) {
    try {
        return { status: 'success', message: new x_everi_luxesc.LuxEscPlanner().savePlan(inputs.run_id, inputs.plan) };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const runIdInput = { name: 'run_id', description: 'Plan run id from the request', mandatory: true }

export const requestPlanner = AiAgent({
    $id: Now.ID['request_planner_agent'],
    name: 'Request Planner',
    description:
        'Turns one description of everything an employee needs (for example onboarding new hires) into a plan of catalog items with quantities and answers, ready to add to the cart.',
    agentRole: 'You are a meticulous service catalog expert who plans complete, correct requests.',
    agentDescriptor: 'created_by_build_agent',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Planning your request...',
    postProcessingMessage: 'Your plan is ready.',
    securityAcl: { $id: Now.ID['request_planner_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Step 1: Understand.
- Extract the run id (32 hexadecimal characters), today's date and the employee's words between triple quotes.
- List the separate things needed (for example a laptop, software, access), how many of each, for whom, where and by when. Work out dates such as "next Monday" from today's date as YYYY-MM-DD.

Step 2: Find items. Always pass the run id.
- Use the Search orderable items tool once per thing with 1 to 3 keywords (try a synonym if nothing fits).
- Pick the single best item per thing; skip a thing if nothing fits and say so in notes.

Step 3: Read questions.
- Use the Describe catalog item tool for each picked item.
- Answer the questions you can from the employee's words: use variable names as keys; for choices use one of the listed choices; for references (people, locations, groups) give the name; for yes/no give yes or no; for dates YYYY-MM-DD.
- Never invent facts the employee did not give. Leave unknown questions out.

Step 4: Use the Save plan tool with the run id and plan as JSON:
{"summary": "<one sentence describing the whole request>", "steps": [{"itemSysId": "<from Search orderable items>", "quantity": 1, "why": "<one short sentence: what this covers>", "values": {"<variable name>": "<answer>"}}], "notes": ["<anything you could not plan, or that the employee must check>"]}
- At most 8 steps.
- The tool replies with answers it could not use. If a fix is obvious (a listed choice, a date format), correct it and save again once; otherwise add a note.

Step 5: Reply with one sentence saying the plan is ready and how many items it has.`,
        },
    ],
    tools: [
        {
            name: 'Search orderable items',
            description: 'Searches catalog items that can be added to the cart, for a plan run (run_id) by keywords (query). Returns sysId, name and description.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Searching the catalog...',
            postMessage: 'Catalog searched.',
            inputs: [runIdInput, { name: 'query', description: 'A few keywords, e.g. "laptop"', mandatory: true }],
            script: searchCatalogScript,
        },
        {
            name: 'Describe catalog item',
            description: 'Returns the questions (variables) of a catalog item for a plan run (run_id) and item (item_sys_id): name, label, type, mandatory, choices and whether it allows a quantity.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Reading the item questions...',
            postMessage: 'Item questions read.',
            inputs: [runIdInput, { name: 'item_sys_id', description: 'sysId of the catalog item', mandatory: true }],
            script: describeItemScript,
        },
        {
            // Writes only the plan of the planner's own run record; nothing is ordered until the employee submits the cart
            name: 'Save plan',
            description: 'Saves the plan (plan, a JSON object with summary, steps and notes) on the plan run (run_id). Returns status, and answers that could not be used.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Saving your plan...',
            postMessage: 'Plan saved.',
            inputs: [
                runIdInput,
                { name: 'plan', description: 'JSON object {"summary": "...", "steps": [...], "notes": [...]}', mandatory: true },
            ],
            script: savePlanScript,
        },
    ],
})
