import '@servicenow/sdk/global'
import { AiAgent, BusinessRule, Property } from '@servicenow/sdk/core'

// Tools go through LuxEscKnowledge; each checks the run id so they only serve the portal's article runs
const readFixScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscKnowledge().readFix(inputs.run_id);
    } catch (e) {
        gs.error('Knowledge Drafter could not read the fix: ' + e.message);
        return { error: 'The confirmed fix could not be read' };
    }
})(inputs);`

const searchArticlesScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscKnowledge().searchArticles(inputs.run_id, inputs.query);
    } catch (e) {
        gs.error('Knowledge Drafter could not search the knowledge base: ' + e.message);
        return { error: 'The knowledge base could not be searched' };
    }
})(inputs);`

const saveDraftScript = `(function(inputs) {
    try {
        return { status: 'success', message: new x_everi_luxesc.LuxEscKnowledge().saveDraft(inputs.run_id, inputs.draft) };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const runIdInput = { name: 'run_id', description: 'Article run id from the request', mandatory: true }

export const knowledgeDrafter = AiAgent({
    $id: Now.ID['knowledge_drafter_agent'],
    name: 'Knowledge Drafter',
    description:
        'Turns a confirmed fix (self-help an employee said worked, or a resolved incident) into a knowledge article submitted for review, unless an existing article already covers it.',
    agentRole: 'You are a knowledge manager who writes short, generic, reusable how-to articles for employees.',
    agentDescriptor: 'created_by_build_agent',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Drafting a knowledge article...',
    postProcessingMessage: 'The draft is ready for review.',
    securityAcl: { $id: Now.ID['knowledge_drafter_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Step 1: Use the Read the confirmed fix tool with the run id (32 hexadecimal characters in the request).
- If it returns an error, reply that there was nothing to draft and stop.

Step 2: Use the Search existing articles tool with 2 to 5 keywords for the problem. The knowledge base has English and Spanish articles: if nothing relevant comes back, try once more in the other language.
- Results include drafts and articles in review (state). An article is a duplicate only if it describes the same problem and the same fix.

Step 3: Use the Save article draft tool with the run id and draft as JSON:
- Duplicate: {"duplicateOf": "<sysId from Search existing articles>", "reason": "<one sentence>"}
- Otherwise: {"title": "<problem as employees describe it, max 100 characters>", "symptoms": "<what the employee sees>", "cause": "<most likely cause, or empty if unknown>", "steps": ["<one action per step, max 8>"], "appliesTo": "<devices, apps or services>", "keywords": "<comma-separated words employees would search for>", "language": "en|es"}
- Write in the language of the problem description. Write for any employee, not for the person who had the problem: no names, ticket numbers, dates, hostnames or personal data.
- Only include steps that the confirmed fix supports. Do not invent extra fixes. Leave out steps about raising a ticket in a portal; the last step can be: contact the service desk if the problem continues.
- If the save fails, fix the JSON and try once more.

Step 4: Reply with one sentence: the submission number, or the article that already covers it.`,
        },
    ],
    tools: [
        {
            name: 'Read the confirmed fix',
            description: 'Returns the problem and the fix that was confirmed to work for an article run (run_id).',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Reading the confirmed fix...',
            postMessage: 'Fix read.',
            inputs: [runIdInput],
            script: readFixScript,
        },
        {
            name: 'Search existing articles',
            description: 'Searches knowledge articles, published or being written, for an article run (run_id) by keywords (query). Returns sysId, number, state, title and an excerpt.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Checking existing articles...',
            postMessage: 'Existing articles checked.',
            inputs: [
                runIdInput,
                { name: 'query', description: 'A few keywords for the problem, e.g. "second monitor not detected"', mandatory: true },
            ],
            script: searchArticlesScript,
        },
        {
            // Creates a knowledge submission only; the knowledge team reviews it and creates the article
            name: 'Save article draft',
            description: 'Submits the article (draft, a JSON object) for review for an article run (run_id), or records the existing article that covers it. Returns status and message.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Saving the draft...',
            postMessage: 'Draft saved.',
            inputs: [
                runIdInput,
                { name: 'draft', description: 'JSON object {"title", "symptoms", "cause", "steps", "appliesTo", "keywords", "language"} or {"duplicateOf", "reason"}', mandatory: true },
            ],
            script: saveDraftScript,
        },
    ],
})

export const kbDraftsFromIncidents = Property({
    $id: Now.ID['kb-drafts-from-incidents'],
    name: 'x_everi_luxesc.kb_drafts.from_incidents',
    type: 'boolean',
    value: true,
    description: 'Draft a knowledge article when an incident is resolved with close notes of at least 60 characters.',
})

// Async so resolving the incident never waits for the agent
export const draftArticleOnResolve = BusinessRule({
    $id: Now.ID['kb-draft-on-resolve'],
    name: 'Lux Employee Center: draft article on resolve',
    table: 'incident',
    when: 'async',
    action: ['update'],
    order: 200,
    condition: "current.state.changesTo(6) && gs.getProperty('x_everi_luxesc.kb_drafts.from_incidents', 'true') == 'true'",
    script: `(function executeRule(current) {
    new x_everi_luxesc.LuxEscKnowledge().fromIncident(current.getUniqueValue());
})(current);`,
    description: 'Starts the Knowledge Drafter agent on incidents resolved with a reusable fix (see LuxEscKnowledge.fromIncident).',
})

export const knownIssuesMaxAge = Property({
    $id: Now.ID['known-issues-max-age'],
    name: 'x_everi_luxesc.known_issues.max_age_days',
    type: 'integer',
    value: 14,
    description: 'Active major incidents opened within this many days are shown to employees as known issues.',
})
