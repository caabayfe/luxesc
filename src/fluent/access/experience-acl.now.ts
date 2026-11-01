import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'

// Without its own ACL an experience falls under the platform's "*" experience ACL, which only
// admits aix_exp_admin, so employees would get "Page not found"
export const experienceAcl = Acl({
    $id: Now.ID['luxesc-experience-acl'],
    type: 'aiux_experience',
    name: 'luxesc',
    operation: 'read',
    roles: ['snc_internal'],
    description: 'Employees (snc_internal) can open the Lux Employee Center.',
})
