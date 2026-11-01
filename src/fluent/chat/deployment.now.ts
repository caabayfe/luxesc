import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

// Binds the Lux experience to the Employee Center portal's Now Assist channel,
// so employees get the same assistant (and its agents) as on /esc. The AIUX
// build does not emit aiux.json's chatDeploymentChannelSysId, and the runtime
// reads it from this experience property instead.
const LUXESC_EXPERIENCE = 'a55c774787b5138cb51a3acc933a65c9'
const ESC_CHAT_CHANNEL = 'd92d891233045f50e4525e1ace5c7b64'

Record({
    $id: Now.ID['luxesc-chat-deployment-channel'],
    table: 'sys_aix_experience_properties',
    data: {
        experience: LUXESC_EXPERIENCE,
        name: 'chatDeploymentChannelSysId',
        type: 'string',
        value: ESC_CHAT_CHANNEL,
    },
})
