import '@servicenow/sdk/global'
import { ChoiceColumn, DateTimeColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

// One row per agent run an employee starts (a concierge briefing, a problem intake or a request plan): links it
// to the agent execution plan and holds the result the agent saved
export const x_everi_luxesc_concierge_run = Table({
    name: 'x_everi_luxesc_concierge_run',
    label: 'Agent Run',
    display: 'user',
    schema: {
        user: ReferenceColumn({ label: 'User', referenceTable: 'sys_user', mandatory: true }),
        kind: ChoiceColumn({
            label: 'Kind',
            dropdown: 'dropdown_without_none',
            default: 'concierge',
            choices: {
                concierge: { label: 'Concierge briefing' },
                intake: { label: 'Problem intake' },
                plan: { label: 'Request plan' },
            },
        }),
        prompt: StringColumn({ label: 'What the employee asked', maxLength: 2000 }),
        state: ChoiceColumn({
            label: 'State',
            dropdown: 'dropdown_without_none',
            default: 'running',
            choices: {
                running: { label: 'Running' },
                completed: { label: 'Completed' },
                failed: { label: 'Failed' },
            },
        }),
        execution_plan: StringColumn({ label: 'Execution plan', maxLength: 32 }),
        conversation: StringColumn({ label: 'Conversation', maxLength: 32 }),
        plan_state: StringColumn({ label: 'Plan state', maxLength: 40 }),
        execution_ms: IntegerColumn({ label: 'Execution time (ms)' }),
        finished_on: DateTimeColumn({ label: 'Finished on' }),
        // Briefing (concierge), triage (intake) or plan (plan) JSON
        briefing: StringColumn({ label: 'Result', maxLength: 16000 }),
        output: StringColumn({ label: 'Output', maxLength: 4000 }),
        error: StringColumn({ label: 'Error', maxLength: 1000 }),
    },
})
