import '@servicenow/sdk/global'
import { Acl, RestApi } from '@servicenow/sdk/core'

export const conciergeApiAcl = Acl({
    $id: Now.ID['concierge-api-acl'],
    type: 'rest_endpoint',
    name: 'Lux Employee Center Concierge API',
    operation: 'execute',
    roles: ['snc_internal'],
    description: 'Employees can run and follow their own concierge briefing, problem intake and request plans.',
})

// Handlers only delegate: the logic lives in LuxEscConcierge, which the agent's tools share
const startScript = `(function process(request, response) {
    var run = new x_everi_luxesc.LuxEscConcierge().start();
    if (run === null) {
        response.setStatus(404);
        response.setBody({ error: { message: 'Concierge run not found' } });
        return;
    }
    response.setBody({ run: run });
})(request, response);`

const intakeScript = `(function process(request, response) {
    var body = request.body && request.body.data || {};
    try {
        response.setBody({ run: new x_everi_luxesc.LuxEscConcierge().start('intake', body.text) });
    } catch (e) {
        response.setStatus(400);
        response.setBody({ error: { message: e.message } });
    }
})(request, response);`

const planScript = `(function process(request, response) {
    var body = request.body && request.body.data || {};
    try {
        response.setBody({ run: new x_everi_luxesc.LuxEscConcierge().start('plan', body.text) });
    } catch (e) {
        response.setStatus(400);
        response.setBody({ error: { message: e.message } });
    }
})(request, response);`

const outcomeScript = `(function process(request, response) {
    var body = request.body && request.body.data || {};
    try {
        var run = new x_everi_luxesc.LuxEscConcierge().recordOutcome(request.pathParams.run, body.key, body.action);
        if (run === null) {
            response.setStatus(404);
            response.setBody({ error: { message: 'Briefing item not found' } });
            return;
        }
        response.setBody({ run: run });
    } catch (e) {
        response.setStatus(400);
        response.setBody({ error: { message: e.message } });
    }
})(request, response);`

const latestScript = `(function process(request, response) {
    var run = new x_everi_luxesc.LuxEscConcierge().latest() || {};
    if (run === null) {
        response.setStatus(404);
        response.setBody({ error: { message: 'Concierge run not found' } });
        return;
    }
    response.setBody({ run: run });
})(request, response);`

const traceScript = `(function process(request, response) {
    var run = new x_everi_luxesc.LuxEscConcierge().trace(request.pathParams.run);
    if (run === null) {
        response.setStatus(404);
        response.setBody({ error: { message: 'Concierge run not found' } });
        return;
    }
    response.setBody({ run: run });
})(request, response);`

// URIs: /api/x_everi_luxesc/v1/concierge/runs, /runs/latest, /runs/{run}, /runs/{run}/outcomes, /intake, /plans
export const conciergeApi = RestApi({
    $id: Now.ID['concierge-api'],
    name: 'Lux Employee Center Concierge',
    serviceId: 'concierge',
    shortDescription: 'Run the Employee Concierge agent and follow its steps',
    consumes: 'application/json',
    produces: 'application/json',
    enforceAcl: [conciergeApiAcl],
    versions: [{ $id: Now.ID['concierge-api-v1'], version: 1, isDefault: true }],
    routes: [
        {
            $id: Now.ID['concierge-api-start'],
            name: 'start run',
            method: 'POST',
            path: '/runs',
            script: startScript,
            version: 1,
            shortDescription: 'Start a concierge briefing for the signed-in employee',
        },
        {
            $id: Now.ID['concierge-api-intake'],
            name: 'start intake',
            method: 'POST',
            path: '/intake',
            script: intakeScript,
            version: 1,
            shortDescription: "Start the intake agent on the employee's description of a problem ({text})",
        },
        {
            $id: Now.ID['concierge-api-plan'],
            name: 'start plan',
            method: 'POST',
            path: '/plans',
            script: planScript,
            version: 1,
            shortDescription: "Start the request planner on the employee's description of what they need ({text})",
        },
        {
            $id: Now.ID['concierge-api-outcome'],
            name: 'record outcome',
            method: 'POST',
            path: '/runs/{run}/outcomes',
            script: outcomeScript,
            version: 1,
            shortDescription: 'Record what the employee did on a briefing item ({key, action})',
        },
        {
            $id: Now.ID['concierge-api-latest'],
            name: 'latest run',
            method: 'GET',
            path: '/runs/latest',
            script: latestScript,
            version: 1,
            shortDescription: "The employee's latest briefing of today",
        },
        {
            $id: Now.ID['concierge-api-trace'],
            name: 'run trace',
            method: 'GET',
            path: '/runs/{run}',
            script: traceScript,
            version: 1,
            shortDescription: 'Progress, steps and briefing of a concierge run',
        },
    ],
})
