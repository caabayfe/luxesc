import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'aiux-acl|experience:luxesc|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: '3e0702de8a9e4937a45d9084e6bc989e'
                    }
                    'aiux-acl|x-everi-luxesc-catalog-item-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: '0885f9a3db624977a13dfa5aa9962267'
                    }
                    'aiux-acl|x-everi-luxesc-catalog-item-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: 'd9b2d6ba7011405eaa32a3430661244b'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-catalog-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: 'dc1feefb65884a8e9b64adca8c4833fd'
                    }
                    'aiux-acl|x-everi-luxesc-catalog-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '030c44589be145d094803e1d235a077c'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-chat-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: '776bb575875a49cd8ec088acc162353d'
                    }
                    'aiux-acl|x-everi-luxesc-chat-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '154fbde66a8143139e43093d1692bdf5'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-home-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: '92d57c604e6242b1b4091617b811a5e6'
                    }
                    'aiux-acl|x-everi-luxesc-home-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: 'c74eb087e75f45ad8f18f3954da628ee'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-knowledge-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: '5b84725019ea47c3aa20637c252b49d8'
                    }
                    'aiux-acl|x-everi-luxesc-knowledge-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '3cae36b33ca94e9786dc5585b56f6ca7'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-requests-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: 'bfd976cb67ee40caa99d7487083108fb'
                    }
                    'aiux-acl|x-everi-luxesc-requests-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '61ce522479054b659098c6c37de6660d'
                        deleted: true
                    }
                    'aiux-acl|x-everi-luxesc-ticket-page|read|allow_if||user_is_authenticated': {
                        table: 'sys_security_acl'
                        id: 'e2c5175c66564576afed11f425829867'
                    }
                    'aiux-acl|x-everi-luxesc-ticket-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '753cb490ffd14f538b9191801234930a'
                        deleted: true
                    }
                    'aiux-color-swatch|luxesc': {
                        table: 'sys_aix_color_swatch'
                        id: 'c94512c432999eff4e3c790c21f02a2b'
                        deleted: true
                    }
                    'aiux-dependency|ai-handoff.js': {
                        table: 'sys_aix_dependency'
                        id: 'da5488ce4170b7e6bd0c2017b49fb967'
                        deleted: true
                    }
                    'aiux-dependency|api.js': {
                        table: 'sys_aix_dependency'
                        id: 'ccba77defd8861d7586a3ad54a52f1e6'
                        deleted: false
                    }
                    'aiux-dependency|catalog-tools.js': {
                        table: 'sys_aix_dependency'
                        id: '7fe205a96e63e3dc1e30a991d55bba32'
                    }
                    'aiux-dependency|catalog.js': {
                        table: 'sys_aix_dependency'
                        id: 'a21f70009eff8ada224f6da431bf928d'
                    }
                    'aiux-dependency|chat.js': {
                        table: 'sys_aix_dependency'
                        id: 'd355d2f13fd7b08e739d7b33b3190b73'
                        deleted: true
                    }
                    'aiux-dependency|document-title.js': {
                        table: 'sys_aix_dependency'
                        id: 'e2684a37134e76a5269abc1587ad23a5'
                    }
                    'aiux-dependency|luxesc-ask.js': {
                        table: 'sys_aix_dependency'
                        id: '3520170c63aeeefe961f684f9c1837a8'
                    }
                    'aiux-dependency|luxesc-item-gallery.js': {
                        table: 'sys_aix_dependency'
                        id: 'ec5442b8e7031e6ebe0e5440461dc70f'
                        deleted: true
                    }
                    'aiux-dependency|luxesc-rich-text.js': {
                        table: 'sys_aix_dependency'
                        id: '31ab2bc23cf9c982809061bc555b8415'
                    }
                    'aiux-dependency|variables.js': {
                        table: 'sys_aix_dependency'
                        id: '04832da606fae78803fae89370a82a74'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-catalog-item-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '1a0b648b950c61e33ca3e0ed15a9cdb7'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-catalog-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '59c6f055219ffd078b524f292e0eed92'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-chat-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: 'f70af99f5d9364612ffd7ca97780511d'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-home-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '085dc380109a39f6efd20f0707e90b24'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-knowledge-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '9f4ca197c1f47c6db4d67ec424cf9232'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-requests-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: 'c1a22eb1815357e827af8c2033b03a32'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-ticket-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '4a51b21a5304c12a7d8d174bc5c96f6f'
                    }
                    'aiux-experience-prop|appHeadCss': {
                        table: 'sys_aix_experience_properties'
                        id: 'b4626e1078c74421c313f263eb6aeb51'
                    }
                    'aiux-experience-prop|appTailwindCss': {
                        table: 'sys_aix_experience_properties'
                        id: '3e6532b77b73eceb9c89452d656948f0'
                    }
                    'aiux-experience|luxesc': {
                        table: 'sys_aix_experience'
                        id: 'a55c774787b5138cb51a3acc933a65c9'
                    }
                    'aiux-layout-widget|lifecycle': {
                        table: 'sys_aix_widget'
                        id: '61bac87ffdca4ebcbf242d5ff8986dc1'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|ai-handoff.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'e3e9ad37f3f3d649c01371100d83d485'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '93e36e980f8320a0bde13280351256c6'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '98eed63af2d22190508556ed10d04007'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|chat.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'b547f7eb5895fd470765d3d33b90d981'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '756b940bb994aeb137f72cbd6be485ec'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|luxesc-ask.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '2e6fe8b515a923e3d6f09f34936915e5'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|luxesc-rich-text.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '7ca6f9aba3bf0078e08bcde6eeafdede'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|variables.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '2eb3f60efce38a7003ca6d95dd5f2f51'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|ai-handoff.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '169d840078b7ba5a4546544f186cfee3'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '39ef6f437f0850abf852c78d8b0a7392'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|catalog-tools.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '1f4ed12a3e624d6dcff518f41c2d93b4'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'f21fe15511ad6d9d6290175d8fd7c741'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'e21f5ab19f6f52c344d89d4492dbe9fc'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|luxesc-item-gallery.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'e65fdeb13c4da837a934fe18e69a81e0'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|variables.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '58ab9b106ab61594f38efc5e13f94347'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-chat-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '207dd8d537750ab3c6e029c127c36bda'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '5b817763ca15a7826b56a20f79d95df3'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|catalog-tools.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'c11525911d92fdbcfb36f6052be1b05f'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '388cb0a5cf53615e39434553442f126b'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|chat.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '2dd20d23624da847ca99802b7f263e38'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '0eacd9baa912488ba4758e96c866175c'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|luxesc-ask.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '3cacc63416e3ac907d6ebe50389b395c'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|luxesc-item-gallery.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'baaf11f214322c221364dc1edd0391f4'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|variables.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '67b9a8614e2c4d6a3f6377e6d79f187f'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-knowledge-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '2b51bfd6610f496450a9e89da737a1f8'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-knowledge-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '04d0aac285ed9f330e3ba6eebd7086b2'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-knowledge-page|luxesc-ask.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '84167dfc6fff40ebbf56d0a593804d2d'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-knowledge-page|luxesc-rich-text.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'ba7bbee3127d471b7f265bf50d3d3d14'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-requests-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '64a423ca05c09d2d4adc6a0478278fb9'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-requests-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '5fe0ecfcae58996dbbb9e9aecfea664c'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-requests-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '5f5eabf6419ca7d9f75c7b9fa9961ee6'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-ticket-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '5c0d3b7bcbdb5667097ca74561d17ea6'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-ticket-page|chat.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '78348e243f5ab1e2e53ce084c8026297'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-ticket-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '73163e89850d6b955414e37c531394cb'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-ticket-page|luxesc-ask.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'ccded8cef75e85ae5f937f2b8c8784d1'
                    }
                    'aiux-page-widget|x-everi-luxesc-catalog-item-page': {
                        table: 'sys_aix_widget'
                        id: '6c89f454bc5fc1a90b9f9b36e7e4702d'
                    }
                    'aiux-page-widget|x-everi-luxesc-catalog-page': {
                        table: 'sys_aix_widget'
                        id: 'e29aa4a3da8c2432cd8733a30511234e'
                    }
                    'aiux-page-widget|x-everi-luxesc-chat-page': {
                        table: 'sys_aix_widget'
                        id: 'f93d2e50e6c009fb6acb190c40731e45'
                    }
                    'aiux-page-widget|x-everi-luxesc-home-page': {
                        table: 'sys_aix_widget'
                        id: '65b2c9e7016a3b8bc9db2f58def72a63'
                    }
                    'aiux-page-widget|x-everi-luxesc-knowledge-page': {
                        table: 'sys_aix_widget'
                        id: '77722aaad1dd2540f814ef4fcff96690'
                    }
                    'aiux-page-widget|x-everi-luxesc-requests-page': {
                        table: 'sys_aix_widget'
                        id: 'ba887ed608e9428307c6a731d6993bc2'
                    }
                    'aiux-page-widget|x-everi-luxesc-ticket-page': {
                        table: 'sys_aix_widget'
                        id: 'e4acbdfccbea634bef5f50a653d27387'
                    }
                    'aiux-page|x-everi-luxesc-catalog-item-page': {
                        table: 'sys_aix_page'
                        id: '8652d9d2b686c979e5bf08d0068ca787'
                    }
                    'aiux-page|x-everi-luxesc-catalog-page': {
                        table: 'sys_aix_page'
                        id: '711800e3c0d43577eb5b2e6bca284565'
                    }
                    'aiux-page|x-everi-luxesc-chat-page': {
                        table: 'sys_aix_page'
                        id: '477657fcf8c2f054ec130c9704ee428c'
                    }
                    'aiux-page|x-everi-luxesc-home-page': {
                        table: 'sys_aix_page'
                        id: '85150eb1ff9760ab28e5d188567c38ca'
                    }
                    'aiux-page|x-everi-luxesc-knowledge-page': {
                        table: 'sys_aix_page'
                        id: '324ea4ee68b3c83c8036f85187fc0ddd'
                    }
                    'aiux-page|x-everi-luxesc-requests-page': {
                        table: 'sys_aix_page'
                        id: 'a329a2b6cf73b88de4133bd8e85c56f6'
                    }
                    'aiux-page|x-everi-luxesc-ticket-page': {
                        table: 'sys_aix_page'
                        id: '7b370a1394cce9346f7b546eeefd671c'
                    }
                    'aiux-project|x_everi_luxesc': {
                        table: 'sys_aix_project'
                        id: '9055528cad75ebc638ff199e9a9048b2'
                    }
                    'aiux-theme|luxesc': {
                        table: 'sys_aix_theme'
                        id: 'ab1eaef46d169c32f464ae25ce553210'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'ddce630627624da395aa549152ec092c'
                    }
                    'concierge-api': {
                        table: 'sys_ws_definition'
                        id: '0edc9578931343e89f8a19b0d98d5115'
                    }
                    'concierge-api-acl': {
                        table: 'sys_security_acl'
                        id: 'ef2df0dd73d948acb2c104e076a4577d'
                    }
                    'concierge-api-fixed': {
                        table: 'sys_ws_operation'
                        id: '3a095839a98b4e4599d688a66e445833'
                    }
                    'concierge-api-follow': {
                        table: 'sys_ws_operation'
                        id: 'a1d55c51d75c422ba92c0058550476e0'
                    }
                    'concierge-api-intake': {
                        table: 'sys_ws_operation'
                        id: 'de93038ddc3c45eea9d5ef012dc7bb69'
                    }
                    'concierge-api-known-issues': {
                        table: 'sys_ws_operation'
                        id: '27720df8c8ea4a64a513dcdaeadad800'
                    }
                    'concierge-api-latest': {
                        table: 'sys_ws_operation'
                        id: 'e8c520a5a7d6401e94a3aa853748e8f1'
                    }
                    'concierge-api-outcome': {
                        table: 'sys_ws_operation'
                        id: 'a9ea854a5b5940d29834ae2fe706ff3c'
                    }
                    'concierge-api-plan': {
                        table: 'sys_ws_operation'
                        id: '49ea806a24004416bfb144c87f2193af'
                    }
                    'concierge-api-start': {
                        table: 'sys_ws_operation'
                        id: '4173ce8e7bba40ea999bb0ace5371403'
                    }
                    'concierge-api-trace': {
                        table: 'sys_ws_operation'
                        id: '5c2fefb4e62a45e99476e9da9a8898c5'
                    }
                    'concierge-api-v1': {
                        table: 'sys_ws_version'
                        id: '5052a559e8fc4b049018d94c4dad8cf0'
                    }
                    employee_concierge_agent: {
                        table: 'sn_aia_agent'
                        id: '3780b12426954c8f8d21c23671523963'
                    }
                    employee_concierge_agent_acl: {
                        table: 'sys_security_acl'
                        id: '1a6d02e9286644e3bdd7800dbd19b04d'
                    }
                    employee_intake_agent: {
                        table: 'sn_aia_agent'
                        id: '5a0ab0bdc3824a20bd9f374cda865286'
                    }
                    employee_intake_agent_acl: {
                        table: 'sys_security_acl'
                        id: '35274e5f3c0c4ba9aa00d31008e78796'
                    }
                    'kb-draft-on-resolve': {
                        table: 'sys_script'
                        id: 'db49ea6fd0cb41f29806c30c9e46d9ed'
                    }
                    'kb-drafts-from-incidents': {
                        table: 'sys_properties'
                        id: '2b54e6e5b50c4292acfe6c1809d788f3'
                    }
                    'kb-drafts-knowledge-base': {
                        table: 'sys_properties'
                        id: '1b7d4572b6694523b857a4988f9e4294'
                        deleted: true
                    }
                    knowledge_drafter_agent: {
                        table: 'sn_aia_agent'
                        id: '1cfc1562dc9c4e29bcf918f36014bb74'
                    }
                    knowledge_drafter_agent_acl: {
                        table: 'sys_security_acl'
                        id: '995ded8e8c0e4c9e83d687cf93dfbc87'
                    }
                    'known-issues-max-age': {
                        table: 'sys_properties'
                        id: 'e11fa5723e9440069ffc98403dfd98dc'
                    }
                    'luxesc-chat-deployment-channel': {
                        table: 'sys_aix_experience_properties'
                        id: '618bcdbb0a6041fa9a1dea85666ec2c7'
                    }
                    'luxesc-concierge-si': {
                        table: 'sys_script_include'
                        id: 'e0c1ab8f88784a1cb96cae722072753b'
                    }
                    'luxesc-es-01d26411d0ea': {
                        table: 'sys_ui_message'
                        id: '7b370435801e42018333155ba140832c'
                    }
                    'luxesc-es-02334cd8f361': {
                        table: 'sys_ui_message'
                        id: 'eaab27a3eeaa4dd3a00886310c69ae65'
                    }
                    'luxesc-es-03dab8d30026': {
                        table: 'sys_ui_message'
                        id: 'c4ffbdd4da574b6aaa8cc3abddcff20e'
                    }
                    'luxesc-es-04b888cc5dd8': {
                        table: 'sys_ui_message'
                        id: '9cd39da36f17472f9da048ae187e1436'
                    }
                    'luxesc-es-066c3bcf4edc': {
                        table: 'sys_ui_message'
                        id: '9214d2c15674487487ca3866aaaee974'
                    }
                    'luxesc-es-06b8c728d6df': {
                        table: 'sys_ui_message'
                        id: 'accc2577d73b467b92e18c4fb8c63e84'
                    }
                    'luxesc-es-0a0292d0097f': {
                        table: 'sys_ui_message'
                        id: 'e6351ad783f44ce4823fe423f645bee5'
                    }
                    'luxesc-es-0a378a053080': {
                        table: 'sys_ui_message'
                        id: '1bd3b2627d974c99ac2cf752e286e29d'
                    }
                    'luxesc-es-0baa5dc0b3a7': {
                        table: 'sys_ui_message'
                        id: 'cc8ba071729d41d2879c622b257c8a41'
                    }
                    'luxesc-es-0c7d6f7493ea': {
                        table: 'sys_ui_message'
                        id: '3fe72c6fff1449c2a5e117ff202343c9'
                    }
                    'luxesc-es-0cedd961b7d0': {
                        table: 'sys_ui_message'
                        id: 'be972696600349f28c3601b9e2fbea6e'
                    }
                    'luxesc-es-0d6764493ac2': {
                        table: 'sys_ui_message'
                        id: '7b3b9f8998d244fc91c0d5457fc779b4'
                    }
                    'luxesc-es-0d8fb35ec479': {
                        table: 'sys_ui_message'
                        id: '82b56e26166744d1bb264f47f7a8e15d'
                    }
                    'luxesc-es-10d7e23f84e5': {
                        table: 'sys_ui_message'
                        id: '0d1a740acef6423aab33231185485d0f'
                    }
                    'luxesc-es-110763227ca2': {
                        table: 'sys_ui_message'
                        id: '1dd4303edd0342d3a5e03be514eb54a5'
                    }
                    'luxesc-es-132d13a13ebb': {
                        table: 'sys_ui_message'
                        id: '9b735b6f37b24fdda22cc092908c56b8'
                    }
                    'luxesc-es-155a03dab471': {
                        table: 'sys_ui_message'
                        id: 'cdedf6822dfb44d08cfac5b75891c666'
                    }
                    'luxesc-es-15a5d4b5d045': {
                        table: 'sys_ui_message'
                        id: '877405da18ee4345a0c8b99d858fbc84'
                    }
                    'luxesc-es-1642323d23fb': {
                        table: 'sys_ui_message'
                        id: 'd73c74657df9412bb4b6f6a21ff2edaf'
                    }
                    'luxesc-es-1e5ff9e500c2': {
                        table: 'sys_ui_message'
                        id: '655f9b394f2b45d39ce0ffb70609d8fe'
                    }
                    'luxesc-es-1f545d7d437b': {
                        table: 'sys_ui_message'
                        id: '4d9d57bffc22453b914d576c34088c2e'
                    }
                    'luxesc-es-26eb89fb7b06': {
                        table: 'sys_ui_message'
                        id: 'c4899741a075441095a1cb5bc0b558ec'
                    }
                    'luxesc-es-2d76cae58185': {
                        table: 'sys_ui_message'
                        id: '4d74b64fa2684108a17469434960a3ac'
                    }
                    'luxesc-es-334e47713eee': {
                        table: 'sys_ui_message'
                        id: 'b91a89a0c73e4f3798d86f2dc40a1e45'
                    }
                    'luxesc-es-35b681a90767': {
                        table: 'sys_ui_message'
                        id: '10e10165e7274b468ca4f9fcfc93a00f'
                    }
                    'luxesc-es-3663caec7bf0': {
                        table: 'sys_ui_message'
                        id: 'e3058088398a419c93cb2b3814b8477c'
                    }
                    'luxesc-es-367746f788e8': {
                        table: 'sys_ui_message'
                        id: '5a6fd5aed59d4512a442a44c4c7b5ebb'
                    }
                    'luxesc-es-39ebe4ee1197': {
                        table: 'sys_ui_message'
                        id: 'd0b6b063f45b4967b3547db232fc9039'
                    }
                    'luxesc-es-3a4694be22a9': {
                        table: 'sys_ui_message'
                        id: '0891778da68043f1986aa21c918b5db9'
                    }
                    'luxesc-es-3d2fd182aefb': {
                        table: 'sys_ui_message'
                        id: '80df9929f86742c9b4924b1cba7ed412'
                    }
                    'luxesc-es-3dc0fe587be3': {
                        table: 'sys_ui_message'
                        id: 'c0a58ee5aaf8486b83a218058fdc45b4'
                    }
                    'luxesc-es-416e449df56e': {
                        table: 'sys_ui_message'
                        id: '7c2fce3b116247ed8e650374fb30a1b9'
                    }
                    'luxesc-es-435e423ae5d9': {
                        table: 'sys_ui_message'
                        id: '55e93d9c2f98481b885d55bc161b3656'
                    }
                    'luxesc-es-4360c2dcd4af': {
                        table: 'sys_ui_message'
                        id: 'e4a52089b2064fac8b4b40a791881c96'
                    }
                    'luxesc-es-43d1352a402f': {
                        table: 'sys_ui_message'
                        id: '703c6a5905fa420a8e318e0c6ee2a2c0'
                    }
                    'luxesc-es-475634ddb3bb': {
                        table: 'sys_ui_message'
                        id: '32a5312e09f0456098c6cd0fda6d3832'
                    }
                    'luxesc-es-497ccf613e34': {
                        table: 'sys_ui_message'
                        id: '3255ce0391e547b2a74787b63b6004c1'
                    }
                    'luxesc-es-4ca4b11b32c1': {
                        table: 'sys_ui_message'
                        id: '3c51e995cdb4414f80cfe584adccd912'
                    }
                    'luxesc-es-4d66c1793252': {
                        table: 'sys_ui_message'
                        id: 'd85e922a4e0f466aaff28e30418e2a10'
                    }
                    'luxesc-es-4f2ef8052a94': {
                        table: 'sys_ui_message'
                        id: '85418ad452d249bc8b08505ba3f281fc'
                    }
                    'luxesc-es-506461e97c28': {
                        table: 'sys_ui_message'
                        id: '81503e3110e647b295b9ce9e9b39ff7e'
                    }
                    'luxesc-es-516c18d85e41': {
                        table: 'sys_ui_message'
                        id: '2e73499f218348a9b8463b5fe8b97135'
                    }
                    'luxesc-es-54d4a3404420': {
                        table: 'sys_ui_message'
                        id: 'b9632f87dac849eab40396de1a3bbc10'
                    }
                    'luxesc-es-5529f49254a6': {
                        table: 'sys_ui_message'
                        id: 'd736109c17df4b4a964974400c0cd265'
                    }
                    'luxesc-es-5782ca61c395': {
                        table: 'sys_ui_message'
                        id: '97a59c22ed3a446e825a8d216b5d5233'
                    }
                    'luxesc-es-5899c6a0e942': {
                        table: 'sys_ui_message'
                        id: '63a18b7a1b7747daac17be422e336faf'
                    }
                    'luxesc-es-5de77552730c': {
                        table: 'sys_ui_message'
                        id: 'a7ff25e4a3ae44d4ba759d3214189c7f'
                    }
                    'luxesc-es-5f0500ccf919': {
                        table: 'sys_ui_message'
                        id: '0d68e4652ae24f76ab0e11980c6743d6'
                    }
                    'luxesc-es-61852524b8f8': {
                        table: 'sys_ui_message'
                        id: '817dae234abe4cba845ff42491457639'
                    }
                    'luxesc-es-6197b73f8ec0': {
                        table: 'sys_ui_message'
                        id: 'e3aba66222ed4c3a9b4e22b4bf8692ea'
                    }
                    'luxesc-es-62bbea2a98a1': {
                        table: 'sys_ui_message'
                        id: '75d3e7918170406a9242dcaef237acad'
                    }
                    'luxesc-es-6557047df5bd': {
                        table: 'sys_ui_message'
                        id: '5d6733d986294a5a98d5a85657b2669c'
                    }
                    'luxesc-es-65ca2e1e8982': {
                        table: 'sys_ui_message'
                        id: '6029c900858249368baea25bf831920b'
                    }
                    'luxesc-es-68511032243f': {
                        table: 'sys_ui_message'
                        id: '56c77289c4fd4157b6ca31910a197212'
                    }
                    'luxesc-es-6a446ef4725e': {
                        table: 'sys_ui_message'
                        id: '0b0ce28573b0467ab6c2fbf9c3825cde'
                    }
                    'luxesc-es-6adc6cef07e3': {
                        table: 'sys_ui_message'
                        id: '17c1d43ec5764b39922ddf09d1feaa7d'
                    }
                    'luxesc-es-6b687dce88a6': {
                        table: 'sys_ui_message'
                        id: 'febbc3d4d6064f2ea5734e2d78fa687c'
                    }
                    'luxesc-es-6d58768e1347': {
                        table: 'sys_ui_message'
                        id: '0ecd37684f62408c9cb4e81b2ed5d72f'
                    }
                    'luxesc-es-6e8c67fac7d8': {
                        table: 'sys_ui_message'
                        id: '42a41ede882d485c885972ee51d83093'
                    }
                    'luxesc-es-6e9ffd08947d': {
                        table: 'sys_ui_message'
                        id: 'f916d9dde0794510b81e6a61cfe67b06'
                    }
                    'luxesc-es-71b1d1abc5e7': {
                        table: 'sys_ui_message'
                        id: '1de304775fbb47c79d8854ae8b944ac1'
                    }
                    'luxesc-es-71dbe0935f7e': {
                        table: 'sys_ui_message'
                        id: '356f2d1de9c944709cc0804267836cc6'
                    }
                    'luxesc-es-71e58e5f9bfd': {
                        table: 'sys_ui_message'
                        id: 'eed78665930849e6a8f665f8affda1a5'
                    }
                    'luxesc-es-743076460f20': {
                        table: 'sys_ui_message'
                        id: 'f7657321aa664d4bad3ccf8344f35b46'
                    }
                    'luxesc-es-74f9ff67bac5': {
                        table: 'sys_ui_message'
                        id: '74be5a37444e4cceafd0d93614785ba2'
                    }
                    'luxesc-es-75c153bdd622': {
                        table: 'sys_ui_message'
                        id: '59226183f0e246f5bc252e4403bf2e54'
                    }
                    'luxesc-es-77a311e6227b': {
                        table: 'sys_ui_message'
                        id: '2b954dffd2ea416bab4a8975f0347064'
                    }
                    'luxesc-es-77fdd384f5d0': {
                        table: 'sys_ui_message'
                        id: '41adb6cc67a24d819b1f3c9f807ee660'
                    }
                    'luxesc-es-785474873496': {
                        table: 'sys_ui_message'
                        id: '6e8c6f7170ad4bb18978da2ecc757f18'
                    }
                    'luxesc-es-788664686711': {
                        table: 'sys_ui_message'
                        id: 'fc78fc85960d40fd9df19732d2a4d593'
                    }
                    'luxesc-es-7b842a5746a4': {
                        table: 'sys_ui_message'
                        id: '3ae66542a1bf4a3ba1b4151f46cb5e2a'
                    }
                    'luxesc-es-7d1f81782b65': {
                        table: 'sys_ui_message'
                        id: 'def7996061b64e3cab21fd44a7e15d12'
                    }
                    'luxesc-es-7dc17c27e08e': {
                        table: 'sys_ui_message'
                        id: '729c7f71a7d447ec88b15f2ea64a630d'
                    }
                    'luxesc-es-7e1eb36e516f': {
                        table: 'sys_ui_message'
                        id: '259ca6a9e172437cb19ff8f44a3d63fb'
                    }
                    'luxesc-es-80128dc282c6': {
                        table: 'sys_ui_message'
                        id: '3f8147c8d8e044e0b161ca8a309d5daa'
                    }
                    'luxesc-es-840dedfe783e': {
                        table: 'sys_ui_message'
                        id: 'cb681429c5a645c0a5ebae3e859aa02d'
                    }
                    'luxesc-es-84a92bbe58ac': {
                        table: 'sys_ui_message'
                        id: 'd920e74ef6f048638bdf241347f31ad8'
                    }
                    'luxesc-es-887b47591534': {
                        table: 'sys_ui_message'
                        id: '6e14a2cbbcf741bf9a41d272c469e2c7'
                    }
                    'luxesc-es-8a6ff50e5e46': {
                        table: 'sys_ui_message'
                        id: '301a1144d25e475b913e687742486840'
                    }
                    'luxesc-es-8bb0d48793af': {
                        table: 'sys_ui_message'
                        id: '67361f119247486399627f6b7638365f'
                    }
                    'luxesc-es-8d4fdf225672': {
                        table: 'sys_ui_message'
                        id: 'd2ad578234a046aba13eb6aa143a81dd'
                    }
                    'luxesc-es-8e505d0fdbdd': {
                        table: 'sys_ui_message'
                        id: '1b044e3cb0d2473fbc02617fe2f7419f'
                    }
                    'luxesc-es-8e781e873679': {
                        table: 'sys_ui_message'
                        id: '74c0600a6e734f1eb29be9b03e78870c'
                    }
                    'luxesc-es-91d0eb96f66c': {
                        table: 'sys_ui_message'
                        id: '941bdd4b803740bcb1beb9a6e6c6a09f'
                    }
                    'luxesc-es-91f1f2d2fca9': {
                        table: 'sys_ui_message'
                        id: '746f19c22e5441d485fd9617bbabd9f1'
                    }
                    'luxesc-es-92a88e0e91e0': {
                        table: 'sys_ui_message'
                        id: '852624e6f62e4683992d874822bfdac1'
                    }
                    'luxesc-es-9441edec7142': {
                        table: 'sys_ui_message'
                        id: 'fe8c4c9e7dba40ae82809ce149d599dc'
                    }
                    'luxesc-es-9486b0155005': {
                        table: 'sys_ui_message'
                        id: 'cca4c8555d6744cfb57dbbcb39ea8347'
                    }
                    'luxesc-es-96192c9774a3': {
                        table: 'sys_ui_message'
                        id: '3a8c82e298694c5280df1219a8f01ebd'
                    }
                    'luxesc-es-967f91808aef': {
                        table: 'sys_ui_message'
                        id: '8b192da5eb464f669bfc5d03b2ca0486'
                    }
                    'luxesc-es-9a71b747297f': {
                        table: 'sys_ui_message'
                        id: 'f1fc724319894ce8bfbbe135e03711e1'
                    }
                    'luxesc-es-9e364458b646': {
                        table: 'sys_ui_message'
                        id: 'c28bc652e71a4676ae3b971369e3618c'
                    }
                    'luxesc-es-9fb134d358bc': {
                        table: 'sys_ui_message'
                        id: 'd401d9c292444a08b2c99f5d5e1c9492'
                    }
                    'luxesc-es-9fe520d8c094': {
                        table: 'sys_ui_message'
                        id: '883d7e9045db4c43add947458fd05626'
                    }
                    'luxesc-es-a09c60fa784c': {
                        table: 'sys_ui_message'
                        id: 'a9eceb3e9dee416ca356d542d0596ae2'
                    }
                    'luxesc-es-a146fdfcf35b': {
                        table: 'sys_ui_message'
                        id: '369cbf652a4847a38748645fb80a13e7'
                    }
                    'luxesc-es-a1c2d4890cbd': {
                        table: 'sys_ui_message'
                        id: 'c65b4a8f1aa74645a8aa65c507926026'
                    }
                    'luxesc-es-a3a7f4f7afc3': {
                        table: 'sys_ui_message'
                        id: '6253b62342224e5baac1f911839c1484'
                    }
                    'luxesc-es-a609ba107479': {
                        table: 'sys_ui_message'
                        id: '0e6389f6c265479687980dc536e02670'
                    }
                    'luxesc-es-a610798604b5': {
                        table: 'sys_ui_message'
                        id: '8a6ef2ee90dd45e1bd30657c051a02db'
                    }
                    'luxesc-es-a734de00cca2': {
                        table: 'sys_ui_message'
                        id: 'ba7caec1c41e4367bc71fcc726789d0b'
                    }
                    'luxesc-es-a87c8bf7d562': {
                        table: 'sys_ui_message'
                        id: '4b4b66d96133446e87dcf285efac0d38'
                    }
                    'luxesc-es-a95df16310eb': {
                        table: 'sys_ui_message'
                        id: 'b4aeb3832daf4580843124b0254a6e22'
                    }
                    'luxesc-es-ab4eef003af3': {
                        table: 'sys_ui_message'
                        id: '8371bd9a4e034e038ffe6c389456fcd0'
                    }
                    'luxesc-es-ac1da7a07eba': {
                        table: 'sys_ui_message'
                        id: '9095ff2898064f5dba205e33f1c8289d'
                    }
                    'luxesc-es-ac4b7012ef9c': {
                        table: 'sys_ui_message'
                        id: '64634e1d0ff947d6b5bcff5e18dbbc01'
                    }
                    'luxesc-es-acc45881a73e': {
                        table: 'sys_ui_message'
                        id: '57f5e8c9420747d48bcbc3d1ec14ef1d'
                    }
                    'luxesc-es-acd6cc30176d': {
                        table: 'sys_ui_message'
                        id: '78709559040e4af7ab31818361942501'
                    }
                    'luxesc-es-ad323ab6b470': {
                        table: 'sys_ui_message'
                        id: '9ce33df018a645ec895834bdb71d336a'
                    }
                    'luxesc-es-ada32ec43806': {
                        table: 'sys_ui_message'
                        id: 'a870d989e0ce412f8bc67cb2c6ac415a'
                    }
                    'luxesc-es-ada55cf69059': {
                        table: 'sys_ui_message'
                        id: 'a1a8f8a2624840eabba137427a2d2c78'
                    }
                    'luxesc-es-ae3e3ca45632': {
                        table: 'sys_ui_message'
                        id: '99133eebc24c4026a4fa1703850c716c'
                    }
                    'luxesc-es-af7dcab0314c': {
                        table: 'sys_ui_message'
                        id: '494cb205128f4c78ae410e867ea7d8f2'
                    }
                    'luxesc-es-af9d8d1aeb21': {
                        table: 'sys_ui_message'
                        id: '80b009f94daf49e29b74da8e01472d43'
                    }
                    'luxesc-es-b080b8c8dc1d': {
                        table: 'sys_ui_message'
                        id: 'c62fd7e2b65c4ab5a31dec89e7b1680c'
                    }
                    'luxesc-es-b0829f956d43': {
                        table: 'sys_ui_message'
                        id: '2f2eead696944f21bf9115a033f612d0'
                    }
                    'luxesc-es-b215d3661cac': {
                        table: 'sys_ui_message'
                        id: '0d5e1e5678b547ae8f4997ef135e6a39'
                    }
                    'luxesc-es-b27a8ccae7ec': {
                        table: 'sys_ui_message'
                        id: 'c9d0cb3537f14294bda0b2fabd196696'
                    }
                    'luxesc-es-b4a583e31d67': {
                        table: 'sys_ui_message'
                        id: '16e65811d1fa4165baef6c305b6b028a'
                    }
                    'luxesc-es-b4e7a8896eb9': {
                        table: 'sys_ui_message'
                        id: '664ec2714da548cd9871c3cfda53966f'
                    }
                    'luxesc-es-b54e35b43e9a': {
                        table: 'sys_ui_message'
                        id: '4297501b6e114b279a9ae7d24c376883'
                    }
                    'luxesc-es-b5c793c7bd1e': {
                        table: 'sys_ui_message'
                        id: '84fbbc349b5f40baa702c4dffcd8e2f0'
                    }
                    'luxesc-es-b6e370fd9a7a': {
                        table: 'sys_ui_message'
                        id: '17cda59729c94ff28a03592688a458e3'
                    }
                    'luxesc-es-b6f7a73fd1b7': {
                        table: 'sys_ui_message'
                        id: '0b3318307b6649e09f50892772a9cb55'
                    }
                    'luxesc-es-bba0686f8a64': {
                        table: 'sys_ui_message'
                        id: '8324247242564ae6b30b18d66c3b6236'
                    }
                    'luxesc-es-bd7444d92bca': {
                        table: 'sys_ui_message'
                        id: '199e1d1cbdd646e984e9d2ad350140c2'
                    }
                    'luxesc-es-c0020aebcfdd': {
                        table: 'sys_ui_message'
                        id: '1090a2a6b2dd4c739ede68eb1cd4b66b'
                    }
                    'luxesc-es-c1296eaa4968': {
                        table: 'sys_ui_message'
                        id: 'd345d5bf900b4ce783e1f27866501355'
                    }
                    'luxesc-es-c1c35664d415': {
                        table: 'sys_ui_message'
                        id: '0785815efb994d17aae6defcb6f59855'
                    }
                    'luxesc-es-c2c82bfb70eb': {
                        table: 'sys_ui_message'
                        id: '657d6ba81dd8410fa2c5b5ec458bc5a2'
                    }
                    'luxesc-es-c5573c053079': {
                        table: 'sys_ui_message'
                        id: '3e9fadead49c4aa291ba17bd1b8b4abb'
                    }
                    'luxesc-es-c5fec0d3a8d6': {
                        table: 'sys_ui_message'
                        id: '3bbfac5d6e794b24b0e02778a09c7fe6'
                    }
                    'luxesc-es-c79ed44eee74': {
                        table: 'sys_ui_message'
                        id: 'a6f6c3778cff43a99c8e36c06afcad64'
                    }
                    'luxesc-es-c7c771566158': {
                        table: 'sys_ui_message'
                        id: 'b52c9c2d86ad41b38e9ad6c9dcce84f9'
                    }
                    'luxesc-es-c94981fe7503': {
                        table: 'sys_ui_message'
                        id: '0bfbd8ad144045dc85c2c2e7ad5b326d'
                    }
                    'luxesc-es-cd994a9a04cf': {
                        table: 'sys_ui_message'
                        id: 'e0ca90d2a5ff4927bdadad69fb730366'
                    }
                    'luxesc-es-d0355776d3e3': {
                        table: 'sys_ui_message'
                        id: '7c026e7f55c14039a9d9f7620ebc98ac'
                    }
                    'luxesc-es-d1db79923714': {
                        table: 'sys_ui_message'
                        id: '446e2ba7b44f46f2a19da08be8a400b4'
                    }
                    'luxesc-es-d1ff1767df8d': {
                        table: 'sys_ui_message'
                        id: 'b0a22918cb7b472d9b8d630550183134'
                    }
                    'luxesc-es-d2104735906e': {
                        table: 'sys_ui_message'
                        id: '5841d2fd74d2486f9d8e08c77f0b678d'
                    }
                    'luxesc-es-d3714ed9cb02': {
                        table: 'sys_ui_message'
                        id: '01221fcfc78b44e494c5711a6068056d'
                    }
                    'luxesc-es-d7ca0b8cda88': {
                        table: 'sys_ui_message'
                        id: '11cdc6b2874e4c2aa0f632d1001a611b'
                    }
                    'luxesc-es-d853c413dd96': {
                        table: 'sys_ui_message'
                        id: 'df650a7398064fa9bf6f4117af17191e'
                    }
                    'luxesc-es-db14f4987e96': {
                        table: 'sys_ui_message'
                        id: '4469a7701fa34e2d9d846815a98923c5'
                    }
                    'luxesc-es-ddc04e083593': {
                        table: 'sys_ui_message'
                        id: '7d6cfa01321a4a9db16e7c13ddbf1700'
                    }
                    'luxesc-es-ddd3996ad2dd': {
                        table: 'sys_ui_message'
                        id: '08c74e28fa6a490abee0e091ae921279'
                    }
                    'luxesc-es-deba442c1cda': {
                        table: 'sys_ui_message'
                        id: '62514ea062504a6dbe5b3d93a0e2d6e1'
                    }
                    'luxesc-es-e097019b3d3b': {
                        table: 'sys_ui_message'
                        id: '664e4232b8c24bf1a7da4d92bde424f0'
                    }
                    'luxesc-es-e0d98314050d': {
                        table: 'sys_ui_message'
                        id: '1325530168b745a580217cd94c2064f1'
                    }
                    'luxesc-es-e184898c8493': {
                        table: 'sys_ui_message'
                        id: '4a4e39928bab47b88b9adc1bca82be76'
                    }
                    'luxesc-es-e204686e5e41': {
                        table: 'sys_ui_message'
                        id: '6a008505132344caa7f44e95367e6b4b'
                    }
                    'luxesc-es-e40bf1316dc3': {
                        table: 'sys_ui_message'
                        id: '98b99b110c7b44cd8307bf63ab4ab646'
                    }
                    'luxesc-es-e691cca2260e': {
                        table: 'sys_ui_message'
                        id: 'b7a34942a70f43128a78ef51151b8892'
                    }
                    'luxesc-es-e6e43f624a2a': {
                        table: 'sys_ui_message'
                        id: '4505d873e4174f62a4199ef3cedcc2e0'
                    }
                    'luxesc-es-e75831415277': {
                        table: 'sys_ui_message'
                        id: '6e3732e444174285b896461e8255cdb6'
                    }
                    'luxesc-es-e93ce4148ddc': {
                        table: 'sys_ui_message'
                        id: '6c1d3daa07b14f92ac727536b0a71b8b'
                    }
                    'luxesc-es-ed9c5ef53d6e': {
                        table: 'sys_ui_message'
                        id: 'd554d3452d3f43a3941919060f577f59'
                    }
                    'luxesc-es-f14e8f550946': {
                        table: 'sys_ui_message'
                        id: 'e412208415ce4bdfb36ed864cc4f5dbb'
                    }
                    'luxesc-es-f28415962b3b': {
                        table: 'sys_ui_message'
                        id: '57038a02b60740eba1b0ba185ac647d0'
                    }
                    'luxesc-es-f422a546a65c': {
                        table: 'sys_ui_message'
                        id: '3453dfa54db84194ba5c0340b3a0788a'
                    }
                    'luxesc-es-fc282f63f06a': {
                        table: 'sys_ui_message'
                        id: 'f1467ec63018482e8218e79db7289cea'
                    }
                    'luxesc-es-fe2a73c98eb2': {
                        table: 'sys_ui_message'
                        id: '8cec850cf75d4e21adf0a20cec3d9f8a'
                    }
                    'luxesc-es-ff231b5724d2': {
                        table: 'sys_ui_message'
                        id: '830c14b44eb94f9e9cd329972b7f8815'
                    }
                    'luxesc-es-ff33c9d4e363': {
                        table: 'sys_ui_message'
                        id: '0392d935376341089a9662d159d472b8'
                    }
                    'luxesc-experience-acl': {
                        table: 'sys_security_acl'
                        id: '7b8f4034f01e47ebb0aaa51fc6913b6d'
                        deleted: true
                    }
                    'luxesc-intake-si': {
                        table: 'sys_script_include'
                        id: '6af0ead2b4c74c229abb0deccb44da99'
                    }
                    'luxesc-knowledge-si': {
                        table: 'sys_script_include'
                        id: 'b1f64466d9f6424dabdeb3ed44b5a1ae'
                    }
                    'luxesc-outages-si': {
                        table: 'sys_script_include'
                        id: '62eac2ef3668444fa2fb1f7252163d33'
                    }
                    'luxesc-planner-si': {
                        table: 'sys_script_include'
                        id: 'fba41166858647f9b22545f63581f8ee'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'd8fb701e0f3541edacf6885ba5463327'
                    }
                    request_planner_agent: {
                        table: 'sn_aia_agent'
                        id: '6074037cbc8f4a66bcd639e6d2681530'
                    }
                    request_planner_agent_acl: {
                        table: 'sys_security_acl'
                        id: '75e60069bda8412b9527f6c3dbac9cfa'
                    }
                    'src_server_script-includes_LuxEscConcierge_js': {
                        table: 'sys_module'
                        id: '7a0d5f52a17747c9ab4762559298e0f8'
                    }
                    'src_server_script-includes_LuxEscIntake_js': {
                        table: 'sys_module'
                        id: 'b214be9a63734091b91b962c8168f2d8'
                    }
                    'src_server_script-includes_LuxEscKnowledge_js': {
                        table: 'sys_module'
                        id: '04e36f4c083a476c9dd7b92e60c58dd9'
                    }
                    'src_server_script-includes_LuxEscOutages_js': {
                        table: 'sys_module'
                        id: '33a2c22e1fa348d9a8e668048195eace'
                    }
                    'src_server_script-includes_LuxEscPlanner_js': {
                        table: 'sys_module'
                        id: '05daa101b67442f897f5a3a9e1e08405'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice'
                        id: '056c2228264a4482b0424fe58fb20084'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                            value: 'plan'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0978ebe52e7b4437a1dd7c407c2543f7'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0a4645bd664e40c59009883c13a32bde'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'conversation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0c1896d7074941e792721a5382c94c7a'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                        }
                    },
                    {
                        table: 'sn_aia_version'
                        id: '0f8d2fa61aaa4528b7b72e062e281edb'
                        key: {
                            target_id: '1cfc1562dc9c4e29bcf918f36014bb74'
                            version_name: 'V1'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '0fd90d4905d64865a74d0012531b9ae5'
                        key: {
                            agent: '6074037cbc8f4a66bcd639e6d2681530'
                            tool: 'a13ed92fa60c43529231f39c98701942'
                            name: 'Describe catalog item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '10517f46823d4bffabb9d4aff8bcf7d6'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'execution_ms'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '111a8f1a93a444b1853d7cc5c5234570'
                        deleted: true
                        key: {
                            sys_security_acl: '154fbde66a8143139e43093d1692bdf5'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '11aa44b68ae44b8fb2b9dc4ef0b104f6'
                        deleted: true
                        key: {
                            sys_security_acl: '7b8f4034f01e47ebb0aaa51fc6913b6d'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_agent_config'
                        id: '12a47c9b156f49c889e20cb89caff36a'
                        key: {
                            agent: '3780b12426954c8f8d21c23671523963'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '13c360e8ffe644a0ade459e0a067db3b'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'prompt'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '1702d74a23814804a66c43ff6a7b3595'
                        key: {
                            agent: '3780b12426954c8f8d21c23671523963'
                            tool: 'ac381a922d1c41e6aba924d0719d160b'
                            name: 'Save briefing'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '1963ab60d7a844beac8238789b48ce48'
                        key: {
                            agent: '6074037cbc8f4a66bcd639e6d2681530'
                            tool: '2be2500a85e84e2389a9bf13a3bd67fc'
                            name: 'Search orderable items'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '19efe9fa4ec541a9905eb8799d076ab7'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '216fe0ebbfc2427b9b55116793ea8f42'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '270490ec29284057b8985f2a8af52679'
                        key: {
                            name: 'Get my pending approvals'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '2a4d20e3b04942e5b56ed41a0153d3da'
                        key: {
                            agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                            tool: 'ae91ac25473c48fbb503170310f91c7d'
                            name: 'Save article draft'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '2be2500a85e84e2389a9bf13a3bd67fc'
                        key: {
                            name: 'Search orderable items'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '2dce7658432447679cbad1250f019a12'
                        key: {
                            name: 'Save plan'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2dd877d432144661919237eb8e2d474d'
                        key: {
                            application_file: '9055528cad75ebc638ff199e9a9048b2'
                            source_artifact: '384c7427c4524a8c83442eaea8b0cc6a'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2e98cb69a93b4de29ab8c414b73a1c3e'
                        deleted: true
                        key: {
                            sys_security_acl: 'd9b2d6ba7011405eaa32a3430661244b'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: '2f0700d98e0440a8b5093718e5a547df'
                        key: {
                            agent_access_config: {
                                id: 'b5d53d4ed36841d6acd287601b1973b9'
                                key: {
                                    agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                                }
                            }
                            role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '30a012da117f4d9eb8696362c559be0e'
                        key: {
                            name: 'Read the confirmed fix'
                        }
                    },
                    {
                        table: 'sn_aia_version'
                        id: '30cfac94ddc0417e81b6347f9e398197'
                        key: {
                            target_id: '6074037cbc8f4a66bcd639e6d2681530'
                            version_name: 'V1'
                        }
                    },
                    {
                        table: 'sn_aia_agent_config'
                        id: '3704d28e5b2f49459248a45a01390625'
                        key: {
                            agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '384c7427c4524a8c83442eaea8b0cc6a'
                        key: {
                            name: 'aiux-source 9055528cad75ebc638ff199e9a9048b2'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '3bd35b69389d44d8baa275138e69ac0a'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                            tool: '5032e0d3dd4d4e06bc34a3996645d5ca'
                            name: 'Find similar fixed incidents'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '3d79d413e8374c25bd403ad85a140509'
                        key: {
                            name: 'Save triage'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3e5a1dfe70ef47a78269b10e059b4f3e'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '41ddd264ff8a4b4c971bbe4cc2829e4f'
                        deleted: true
                        key: {
                            sys_security_acl: '030c44589be145d094803e1d235a077c'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '4668a14946374d108f1488e9bdd35dee'
                        key: {
                            name: 'Get my open requests'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_configuration'
                        id: '469531a15f6742ff9beb48824d5251f4'
                        key: {
                            agent: '3780b12426954c8f8d21c23671523963'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '486d70b1826e4f7aba529f1ecfdb16d0'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'finished_on'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4af9405d5b1942b18ac39d12733c4f62'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'briefing'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: '5000792a61ec417db9c0b52037284731'
                        key: {
                            agent_access_config: {
                                id: '469531a15f6742ff9beb48824d5251f4'
                                key: {
                                    agent: '3780b12426954c8f8d21c23671523963'
                                }
                            }
                            role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '5032e0d3dd4d4e06bc34a3996645d5ca'
                        key: {
                            name: 'Find similar fixed incidents'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '55631cbdd456464a8aff172840fcb48c'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'briefing'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '59a436dc93c54d118b6f6c11b9e616b9'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'error'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a5d55a7b80e4baeaa5fb11d7f723bf6'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '6bf7c54039d143598a6b5781e1c15f8c'
                        key: {
                            agent: '3780b12426954c8f8d21c23671523963'
                            tool: '4668a14946374d108f1488e9bdd35dee'
                            name: 'Get my open requests'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70b4633abcfd477a854d8f4e9ac0412e'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                            value: 'running'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7536d0c9729f4c2b99dddd373d121d74'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'execution_plan'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: '77eb85f6d10f4ba5a70b20b6f04066da'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                            tool: 'e8211aa0ee81464c84640e16af911efb'
                            name: 'Search catalog'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '782a4deb45cc456a8afd130e2c46aaab'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'finished_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7961f2f08590461083d56c6a6e8205c0'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '81a82eec2f2a480ea16f38dfbf4247fe'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                            value: 'concierge'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '8728f10904ff45a3992599d5a8c54b7e'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '881067388d254bebbf463ae0ed27e7f9'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'conversation'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_configuration'
                        id: '89ebb9775dd840f3a36c42d0f0d35c96'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: '8a22906bc59c409b83574dc881af3a7c'
                        key: {
                            name: 'Check known issues'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '98185b5865a240c3978dab1cd89b2c30'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'plan_state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9988ab9d929b4690b9b380579970d68b'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                            value: 'completed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9c8073d2d0f7498a9cdc97bfc083a5f6'
                        deleted: true
                        key: {
                            sys_security_acl: '753cb490ffd14f538b9191801234930a'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9d6fddbab06d49acaa370d32a1d3d31a'
                        deleted: true
                        key: {
                            sys_security_acl: '3cae36b33ca94e9786dc5585b56f6ca7'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: 'a05980ef86c44805b1a0991093fbbfb2'
                        key: {
                            agent_access_config: {
                                id: 'cf4d9bc31d8a48eba8b13efa8e0705f4'
                                key: {
                                    agent: '6074037cbc8f4a66bcd639e6d2681530'
                                }
                            }
                            role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'a13ed92fa60c43529231f39c98701942'
                        key: {
                            name: 'Describe catalog item'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a3714be39e664c60a0ef0a70864383ef'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a75334e37b3a47f4ad1e53e9bfde1f02'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'state'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a8b5673e18074b10bf1ee7049d15dd81'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'prompt'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'a910d200bcf3490ea238b40317656180'
                        key: {
                            agent: '6074037cbc8f4a66bcd639e6d2681530'
                            tool: '2dce7658432447679cbad1250f019a12'
                            name: 'Save plan'
                        }
                    },
                    {
                        table: 'sn_aia_version'
                        id: 'abfa7419f39a4feaa02b17ddc8ce46c7'
                        key: {
                            target_id: '3780b12426954c8f8d21c23671523963'
                            version_name: 'V1'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'ac381a922d1c41e6aba924d0719d160b'
                        key: {
                            name: 'Save briefing'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'ae91ac25473c48fbb503170310f91c7d'
                        key: {
                            name: 'Save article draft'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b22939bcc6df4161b3d0212cf66502ea'
                        deleted: true
                        key: {
                            sys_security_acl: 'c74eb087e75f45ad8f18f3954da628ee'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_agent_access_role_configuration'
                        id: 'b5d53d4ed36841d6acd287601b1973b9'
                        key: {
                            agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                        }
                    },
                    {
                        table: 'sn_aia_version'
                        id: 'b6ed4c91bb544b759626ba6c28b09e01'
                        key: {
                            target_id: '5a0ab0bdc3824a20bd9f374cda865286'
                            version_name: 'V1'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b717c4ac3f50471a9f80b84938dcbb33'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'plan_state'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bbe882b7789b477f9a1981f70a6b7c88'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                            value: 'intake'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'bdb8ab98fd334c36a81750630afce5a9'
                        key: {
                            name: 'Search existing articles'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'c0ad1eda763b40438a8b1581517756ce'
                        key: {
                            agent: '3780b12426954c8f8d21c23671523963'
                            tool: '270490ec29284057b8985f2a8af52679'
                            name: 'Get my pending approvals'
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'c3de64c88cb844dcb88c703bf21baeb4'
                        key: {
                            name: 'Search knowledge'
                        }
                    },
                    {
                        table: 'sn_aia_agent_config'
                        id: 'c7e0f7504d734d64844e4f0ab008808f'
                        key: {
                            agent: '6074037cbc8f4a66bcd639e6d2681530'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'cb06f42be59f4edeabb0d387a57724a5'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'cd3f0072aab74d19a023b3d4608922f4'
                        key: {
                            agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                            tool: '30a012da117f4d9eb8696362c559be0e'
                            name: 'Read the confirmed fix'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_configuration'
                        id: 'cf4d9bc31d8a48eba8b13efa8e0705f4'
                        key: {
                            agent: '6074037cbc8f4a66bcd639e6d2681530'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd8d0b706d6cb45d5a7136dfb036dac72'
                        deleted: true
                        key: {
                            sys_security_acl: '61ce522479054b659098c6c37de6660d'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'da9050f3d72c4a5ead8219291c36143a'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'dad4c6330217463181d6951186c3354f'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                            tool: '3d79d413e8374c25bd403ad85a140509'
                            name: 'Save triage'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'dc21d8af3d024988b8dd1e542d288d59'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                            tool: 'c3de64c88cb844dcb88c703bf21baeb4'
                            name: 'Search knowledge'
                        }
                    },
                    {
                        table: 'sn_aia_agent_config'
                        id: 'dd79fb7f03ef4442a2a96a1b0da473cd'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: 'de54700d5eb44653a7e71ac57466042f'
                        key: {
                            agent_access_config: {
                                id: '89ebb9775dd840f3a36c42d0f0d35c96'
                                key: {
                                    agent: '5a0ab0bdc3824a20bd9f374cda865286'
                                }
                            }
                            role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e259f6e97e9243889f3d7ddef6ba7aa6'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'output'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'e3506b7310984778abcb6780f12c926a'
                        key: {
                            agent: '5a0ab0bdc3824a20bd9f374cda865286'
                            tool: '8a22906bc59c409b83574dc881af3a7c'
                            name: 'Check known issues'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e62f106153fa4d44abddcf64b7717ff3'
                        key: {
                            sys_security_acl: 'ef2df0dd73d948acb2c104e076a4577d'
                            sys_user_role: {
                                id: '52aca163b1ad45a0909d246eafc036da'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_aia_tool'
                        id: 'e8211aa0ee81464c84640e16af911efb'
                        key: {
                            name: 'Search catalog'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ea69f6c37d1f4f8d9f10e8bafd947b5b'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'output'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ec570e0d9fce43f6948a7dd9f031ebbc'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ef815b8d4d47441297ba460090d061eb'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'execution_plan'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f3e7c8cd634c44889f649bcad1dcaedb'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'kind'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sn_aia_agent_tool_m2m'
                        id: 'f4eb71ce356f4c70bd294ca476a1dfc0'
                        key: {
                            agent: '1cfc1562dc9c4e29bcf918f36014bb74'
                            tool: 'bdb8ab98fd334c36a81750630afce5a9'
                            name: 'Search existing articles'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f94f25f54ee942858d2059051eb7e989'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                            element: 'execution_ms'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
