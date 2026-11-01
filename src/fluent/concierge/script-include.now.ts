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
