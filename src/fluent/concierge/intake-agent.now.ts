import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Otto calls this agent in the chat when an employee reports that something is broken. Tools go
// through LuxEscIntake, LuxEscOutages and LuxEscKnowledge and run as that employee.
const knownIssuesScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscOutages().knownIssues(inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not check known issues: ' + e.message);
        return { error: 'Known issues could not be checked' };
    }
})(inputs);`

const searchKnowledgeScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscIntake().searchKnowledge(inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not search the knowledge base: ' + e.message);
        return { error: 'The knowledge base could not be searched' };
    }
})(inputs);`

const similarIncidentsScript = `(function(inputs) {
    try {
        return new x_everi_luxesc.LuxEscIntake().similarIncidents(inputs.query);
    } catch (e) {
        gs.error('Employee Intake could not search incidents: ' + e.message);
        return { error: 'Similar incidents could not be searched' };
    }
})(inputs);`

const raiseIncidentScript = `(function(inputs) {
    try {
        var incident = new x_everi_luxesc.LuxEscIntake().raiseIncident(inputs.short_description, inputs.description,
            inputs.category, inputs.urgency, inputs.known_issue_sys_id);
        return { status: 'success', number: incident.number, link: incident.link, linkedToKnownIssue: incident.linkedToKnownIssue };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const confirmFixScript = `(function(inputs) {
    try {
        var run = new x_everi_luxesc.LuxEscKnowledge().fromChat(inputs.problem, inputs.summary, inputs.steps, inputs.article_sys_ids);
        return { status: 'success', message: run && run.state !== 'failed' ? 'The fix was sent to the knowledge drafter' : 'The knowledge drafter could not start' };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
})(inputs);`

const queryInput = {
    name: 'query',
    description: 'A few keywords for the problem, e.g. "VPN connect home"',
    mandatory: true,
}

export const employeeIntake = AiAgent({
    $id: Now.ID['employee_intake_agent'],
    name: 'Employee Intake',
    description:
        'Helps an employee when something is broken or not working (VPN, email, laptop, an application): checks known outages, gives self-help from the knowledge base and similar fixed incidents, raises an incident when self-help is not enough, and sends fixes that worked to the knowledge team.',
    agentRole: 'You are a helpful service desk analyst who solves problems at first contact and writes clear tickets.',
    recordType: 'custom',
    channel: 'nap_and_va',
    processingMessage: 'Looking into your problem...',
    postProcessingMessage: 'Here is what I found.',
    securityAcl: { $id: Now.ID['employee_intake_agent_acl'], type: 'Any authenticated user' },
    dataAccess: { roleMap: ['snc_internal'] },
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Write every message in the language the employee writes in, even when the catalog or articles are in another language.

Step 1: Understand.
- Find what is broken. Only if you cannot tell, use collect_input_from_user to ask one short question. Do not ask since when or what they tried yet: research first, and ask that only when you draft an incident.
- Requests for something new (hardware, software, access) are not yours: say so in one sentence and stop.

Step 2: Research, with 2 to 5 keywords.
- Use the Check known issues tool. An issue matches when it is about the same service, application or symptom.
- Use the Search knowledge tool. Articles are in English and Spanish: if nothing relevant comes back, search once more in the other language.
- Use the Find similar fixed incidents tool.
- If a tool returns an error, continue without it.

Step 3: Answer.
- Known issue: say it is known, since when and the latest update, and offer to raise their incident linked to it so they are kept up to date.
- Self-help, only when an article or fixed incident clearly applies: up to 6 short numbered steps grounded in that content, then the number and title of the articles used. Never mention other people's incidents, numbers or names. Then use collect_input_from_user to ask whether that fixed it.

Step 4: Follow up.
- Fixed: use the Confirm fix tool with the problem, a one-sentence summary, the steps and the article sysIds you used, then go to Step 5.
- Not fixed, or no self-help: if you do not know since when it happens and what they tried, ask both in one message. Then draft the incident as the employee. Summary: specific, at most 100 characters. Details: what happens, since when, the impact and what they tried, including the steps that did not work. Category: software, hardware, network, database, password_reset or inquiry. Urgency: 1 when the whole team is blocked, 2 when the employee is blocked, 3 otherwise. Use collect_input_from_user to show the draft, with the urgency in words, and ask whether to raise it; apply any change they ask for. This is the only confirmation: do not ask again.
- Once they agree, use the Raise incident tool, with the known issue's sysId when they are affected by one. Call it once.

Step 5: Finish.
- Use show_output_to_user exactly once, in the employee's language: the incident number you raised as a Markdown link [number](link), where they can follow it and add comments, and that the service desk will be in touch (or that it is linked to the known issue), or, after Confirm fix, that the fix goes to the knowledge team and no ticket is needed.
- Then end right away with finish. Never show the result a second time.
- Never show sysIds, JSON or field names.`,
        },
    ],
    tools: [
        {
            name: 'Check known issues',
            description: 'Lists current known issues (major incidents and outages) and how many colleagues reported something similar lately, by keywords (query).',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Checking known issues...',
            postMessage: 'Known issues checked.',
            inputs: [queryInput],
            script: knownIssuesScript,
        },
        {
            name: 'Search knowledge',
            description: 'Searches published knowledge articles by keywords (query). Returns sysId, number, title and an excerpt.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Searching the knowledge base...',
            postMessage: 'Knowledge base searched.',
            inputs: [queryInput],
            script: searchKnowledgeScript,
        },
        {
            name: 'Find similar fixed incidents',
            description: 'Finds resolved incidents similar to the problem by keywords (query). Returns the problem, category and how it was fixed.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Looking for similar fixed incidents...',
            postMessage: 'Similar incidents checked.',
            inputs: [queryInput],
            script: similarIncidentsScript,
        },
        {
            // Raises a ticket in the employee's name: the instructions have them agree to the draft first (no second confirmation)
            name: 'Raise incident',
            description: "Raises the employee's incident from the agreed draft (short_description, description, category, urgency), linked to a known issue when known_issue_sys_id is given. Returns the incident number and the link where the employee follows it.",
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Raising your incident...',
            postMessage: 'Incident raised.',
            inputs: [
                { name: 'short_description', description: 'Specific summary, at most 100 characters', mandatory: true },
                { name: 'description', description: 'What happens, since when, impact and what the employee tried', mandatory: true },
                { name: 'category', description: 'software, hardware, network, database, password_reset or inquiry', mandatory: true },
                { name: 'urgency', description: '1 whole team blocked, 2 employee blocked, 3 can keep working', mandatory: true },
                { name: 'known_issue_sys_id', description: 'sysId of the matching known issue from Check known issues, if any', mandatory: false },
            ],
            script: raiseIncidentScript,
        },
        {
            // Sends a draft for the knowledge team's review with the employee as submitter, once they said the steps fixed it
            name: 'Confirm fix',
            description: 'After the employee says the self-help fixed the problem, sends the problem, summary, steps and article_sys_ids to the Knowledge Drafter, which drafts an article for review. Returns status and message.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            outputTransformationStrategy: 'none',
            preMessage: 'Sending your fix to the knowledge team...',
            postMessage: 'Fix sent.',
            inputs: [
                { name: 'problem', description: "The problem in the employee's words", mandatory: true },
                { name: 'summary', description: 'One sentence restating the problem', mandatory: true },
                { name: 'steps', description: 'JSON array of the steps that fixed it', mandatory: true },
                { name: 'article_sys_ids', description: 'JSON array of the sysIds of the articles the steps came from (may be empty)', mandatory: false },
            ],
            script: confirmFixScript,
        },
    ],
})
