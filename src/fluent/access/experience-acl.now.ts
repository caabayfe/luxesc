import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'

// Without its own ACL an experience falls under the platform's "*" experience ACL, which only
// admits aix_exp_admin, so employees would get "Page not found". Same rule as the platform's own
// "ui" experience: any signed-in user. Data stays protected by the record and REST ACLs.
export const experienceAcl = Acl({
    $id: Now.ID['luxesc-experience-acl'],
    type: 'aiux_experience',
    name: 'luxesc',
    operation: 'read',
    securityAttribute: 'user_is_authenticated',
    description: 'Any signed-in user can open the Lux Employee Center.',
})
