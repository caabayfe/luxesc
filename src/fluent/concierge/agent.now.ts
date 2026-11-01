import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Tools go through LuxEscConcierge so the agent, the REST API and the portal share one run record
const openRequestsScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscConcierge().openRequests(inputs.run_id);
    } catch (e) {
        gs.error('Employee Concierge could not read the requests: ' + e.message);
        return { error: 'Your requests could not be read' };
    }
})(inputs);`

const pendingApprovalsScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscConcierge().pendingApprovals(inputs.run_id);
    } catch (e) {
        gs.error('Employee Concierge could not read the approvals: ' + e.message);
        return { error: 'Your approvals could not be read' };
    }
})(inputs);`

export const employeeConcierge = AiAgent({
    $id: Now.ID['employee_concierge_agent'],
    name: 'Employee Concierge',
    description:
        "Reviews an employee's open requests, incidents and pending approvals and saves a short, prioritised briefing of what needs their attention, with a suggested next step for each item.",
    agentRole: 'You are a friendly, concise employee concierge who keeps people on top of their IT and service requests.',
    agentDescriptor: 'created_by_build_agent',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Reviewing your requests...',
    postProcessingMessage: 'Your briefing is ready.',
    securityAcl: { $id: Now.ID['employee_concierge_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Step 1: Gather.
- Extract the run id (32 hexadecimal characters) from the request.
- Use the Get my open requests tool with the run id, then the Get my pending approvals tool with the run id.
- If a tool returns an error, explain it in one sentence and stop. DO NOT PROCEED.

Step 2: Decide what deserves attention, most urgent first, at most 6 items:
- "approval": an approval waiting on the employee. Older is more urgent.
- "action": the employee must act, e.g. the last comment asks them a question or the state says it is awaiting the caller or user.
- "stale": open with no update for 5 or more days. Suggest chasing it up.
- "progress": moving normally; include only the most important one or two.
- "done": resolved and waiting for the employee to confirm, if any.
If there is nothing open, save a single "progress" item saying everything is up to date.

Step 3: Use the Save briefing tool with the run id and briefing as JSON:
{"headline": "<one friendly sentence summarising the day>", "items": [{"kind": "approval|action|stale|progress|done", "number": "<record number>", "sysId": "<sysId from the tool output, empty for approvals>", "title": "<max 80 characters>", "detail": "<one or two sentences grounded in the tool output: state, days, last comment>", "question": "<a question the employee could ask the assistant next, e.g. Chase up RITM0010054 for me>"}]}
- Use only facts from the tool outputs. Never invent numbers, dates or people.
- If the save fails, fix the JSON and try once more.

Step 4: Reply with one sentence saying the briefing is ready and how many items need attention.`,
        },
    ],
    tools: [
        {
            name: 'Get my open requests',
            description:
                "Returns the employee's open requested items and incidents for a concierge run (run_id): number, sysId, summary, state, approval, assigned group, days since update and last comment.",
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Reading your requests...',
            postMessage: 'Requests read.',
            inputs: [{ name: 'run_id', description: 'Concierge run id from the request', mandatory: true }],
            script: openRequestsScript,
        },
        {
            name: 'Get my pending approvals',
            description: 'Returns the approvals waiting on the employee for a concierge run (run_id): the record to approve and days waiting.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Checking your approvals...',
            postMessage: 'Approvals checked.',
            inputs: [{ name: 'run_id', description: 'Concierge run id from the request', mandatory: true }],
            script: pendingApprovalsScript,
        },
        {
            // Writes only the briefing of the concierge's own run record
            name: 'Save briefing',
            description: 'Saves the briefing (briefing, a JSON object with headline and items) on the concierge run (run_id). Returns status and message.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Saving your briefing...',
            postMessage: 'Briefing saved.',
            inputs: [
                { name: 'run_id', description: 'Concierge run id from the request', mandatory: true },
                { name: 'briefing', description: 'JSON object {"headline": "...", "items": [...]}', mandatory: true },
            ],
            script: `(function(inputs) {
    try {
        return { status: 'success', message: new x_everi_luxesc.LuxEscConcierge().saveBriefing(inputs.run_id, inputs.briefing) };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`,
        },
    ],
})
