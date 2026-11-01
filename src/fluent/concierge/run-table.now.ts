import '@servicenow/sdk/global'
import { ChoiceColumn, DateTimeColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

// One row per concierge briefing an employee asks for: links it to the agent execution plan
// and holds the briefing the agent saved
export const x_everi_luxesc_concierge_run = Table({
    name: 'x_everi_luxesc_concierge_run',
    label: 'Concierge Run',
    display: 'user',
    schema: {
        user: ReferenceColumn({ label: 'User', referenceTable: 'sys_user', mandatory: true }),
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
        briefing: StringColumn({ label: 'Briefing', maxLength: 16000 }),
        output: StringColumn({ label: 'Output', maxLength: 4000 }),
        error: StringColumn({ label: 'Error', maxLength: 1000 }),
    },
})
