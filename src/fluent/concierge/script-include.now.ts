import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

export const LuxEscConcierge = ScriptInclude({
    $id: Now.ID['luxesc-concierge-si'],
    name: 'LuxEscConcierge',
    apiName: 'x_everi_luxesc.LuxEscConcierge',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscConcierge.js'),
    description: 'Starts the Employee Concierge agent, serves its tools and reports its progress.',
})

export const LuxEscIntake = ScriptInclude({
    $id: Now.ID['luxesc-intake-si'],
    name: 'LuxEscIntake',
    apiName: 'x_everi_luxesc.LuxEscIntake',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscIntake.js'),
    description: 'Tools of the Employee Intake agent: knowledge, similar incidents and catalog search, and saving the triage.',
})

export const LuxEscPlanner = ScriptInclude({
    $id: Now.ID['luxesc-planner-si'],
    name: 'LuxEscPlanner',
    apiName: 'x_everi_luxesc.LuxEscPlanner',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscPlanner.js'),
    description: 'Tools of the Request Planner agent: catalog search, item questions, and saving a plan with resolved values.',
})

export const LuxEscOutages = ScriptInclude({
    $id: Now.ID['luxesc-outages-si'],
    name: 'LuxEscOutages',
    apiName: 'x_everi_luxesc.LuxEscOutages',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscOutages.js'),
    description: 'Known issues: active major incidents, recent outages and colleagues reporting the same problem; follow a major incident.',
})

export const LuxEscKnowledge = ScriptInclude({
    $id: Now.ID['luxesc-knowledge-si'],
    name: 'LuxEscKnowledge',
    apiName: 'x_everi_luxesc.LuxEscKnowledge',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscKnowledge.js'),
    description: 'Starts the Knowledge Drafter agent on confirmed fixes and serves its tools: read the fix, search articles, save the draft.',
})

export const LuxEscTicket = ScriptInclude({
    $id: Now.ID['luxesc-ticket-si'],
    name: 'LuxEscTicket',
    apiName: 'x_everi_luxesc.LuxEscTicket',
    accessibleFrom: 'package_private',
    script: Now.include('../../server/script-includes/LuxEscTicket.js'),
    description: "The employee's view of a request or incident: facts, answers, files and customer-visible comments (never work notes).",
})
