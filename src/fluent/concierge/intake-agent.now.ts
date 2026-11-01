import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Tools go through LuxEscIntake; each checks the run id so they only serve the portal's intake runs
const searchKnowledgeScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscIntake().searchKnowledge(inputs.run_id, inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not search the knowledge base: ' + e.message);
        return { error: 'The knowledge base could not be searched' };
    }
})(inputs);`

const similarIncidentsScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscIntake().similarIncidents(inputs.run_id, inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not search incidents: ' + e.message);
        return { error: 'Similar incidents could not be searched' };
    }
})(inputs);`

const searchCatalogScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscIntake().searchCatalog(inputs.run_id, inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not search the catalog: ' + e.message);
        return { error: 'The catalog could not be searched' };
    }
})(inputs);`

const saveTriageScript = `(function(inputs) {
    try {
        return { status: 'success', message: new x_everi_luxesc.LuxEscIntake().saveTriage(inputs.run_id, inputs.triage) };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const runIdInput = { name: 'run_id', description: 'Intake run id from the request', mandatory: true }
const queryInput = {
    name: 'query',
    description: 'A few keywords for the problem, e.g. "VPN connect home"',
    mandatory: true,
}

export const employeeIntake = AiAgent({
    $id: Now.ID['employee_intake_agent'],
    name: 'Employee Intake',
    description:
        "Turns an employee's description of a problem or need into self-help from the knowledge base and similar fixed incidents, and drafts the incident or catalog request to raise if self-help is not enough.",
    agentRole: 'You are a helpful service desk analyst who solves problems at first contact and writes clear tickets.',
    agentDescriptor: 'created_by_build_agent',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Looking into your problem...',
    postProcessingMessage: 'Your options are ready.',
    securityAcl: { $id: Now.ID['employee_intake_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Step 1: Understand.
- Extract the run id (32 hexadecimal characters) and the employee's words between triple quotes.
- Decide whether it is a problem (something broken or not working) or a need (hardware, software, access, information).

Step 2: Research. Always pass the run id.
- Use the Search knowledge tool with 2 to 5 keywords. The knowledge base has English and Spanish articles: if nothing relevant comes back, try once more in the other language.
- For a problem, use the Find similar fixed incidents tool with the same keywords.
- For a need, or a problem that needs new equipment or access, use the Search catalog tool.
- If a tool returns an error, continue without it.

Step 3: Decide.
- selfHelp: only if an article or a fixed incident clearly applies, up to 6 short steps the employee can follow, grounded in that content. List the articles you used and give fixedIncidents, how many of the similar fixed incidents the steps rely on (0 if none). Otherwise null.
- recommendation.type:
  - "catalog" when the employee needs something from the catalog and an item from the Search catalog tool fits.
  - "incident" when something is broken, even if there is self-help (it is raised only if self-help does not work).
  - "none" only for a how-to question fully answered by selfHelp.
- For "incident", write the ticket as the employee: shortDescription (max 100 characters, specific), description (what happens, since when, impact, what they tried, in the employee's language), category (one of: software, hardware, network, database, password_reset, inquiry), urgency ("1" whole team blocked, "2" employee blocked, "3" otherwise).

Step 4: Use the Save triage tool with the run id and triage as JSON:
{"summary": "<one sentence restating the problem>", "selfHelp": {"title": "<short>", "steps": ["..."], "articles": [{"sysId": "<from Search knowledge>", "number": "<KB number>", "title": "<title>"}], "fixedIncidents": 0} or null, "recommendation": {"type": "incident|catalog|none", "reason": "<one sentence for the employee>", "incident": {"shortDescription": "...", "description": "...", "category": "...", "urgency": "3"}, "catalogItem": {"sysId": "<from Search catalog>", "name": "<name>"}, "details": "<for catalog: what the employee asked for, to pre-fill the form>"}}
- Include only the field for the chosen type (incident or catalogItem and details).
- Never invent article or catalog sysIds. Never include other people's incident numbers or names.
- If the save fails, fix the JSON and try once more.

Step 5: Reply with one sentence saying the options are ready.`,
        },
    ],
    tools: [
        {
            name: 'Search knowledge',
            description: 'Searches published knowledge articles for an intake run (run_id) by keywords (query). Returns sysId, number, title and an excerpt.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Searching the knowledge base...',
            postMessage: 'Knowledge base searched.',
            inputs: [runIdInput, queryInput],
            script: searchKnowledgeScript,
        },
        {
            name: 'Find similar fixed incidents',
            description: 'Finds resolved incidents similar to the problem for an intake run (run_id) by keywords (query). Returns the problem, category and how it was fixed.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Looking for similar fixed incidents...',
            postMessage: 'Similar incidents checked.',
            inputs: [runIdInput, queryInput],
            script: similarIncidentsScript,
        },
        {
            name: 'Search catalog',
            description: 'Searches orderable catalog items for an intake run (run_id) by keywords (query). Returns sysId, name and description.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Searching the catalog...',
            postMessage: 'Catalog searched.',
            inputs: [runIdInput, queryInput],
            script: searchCatalogScript,
        },
        {
            // Writes only the triage of the intake's own run record; nothing is raised until the employee confirms
            name: 'Save triage',
            description: 'Saves the triage (triage, a JSON object with summary, selfHelp and recommendation) on the intake run (run_id). Returns status and message.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Preparing your options...',
            postMessage: 'Options ready.',
            inputs: [
                runIdInput,
                { name: 'triage', description: 'JSON object {"summary": "...", "selfHelp": {...} or null, "recommendation": {...}}', mandatory: true },
            ],
            script: saveTriageScript,
        },
    ],
})
