import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'aiux-acl|x-everi-luxesc-catalog-item-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: 'd9b2d6ba7011405eaa32a3430661244b'
                    }
                    'aiux-acl|x-everi-luxesc-catalog-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '030c44589be145d094803e1d235a077c'
                    }
                    'aiux-acl|x-everi-luxesc-chat-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '154fbde66a8143139e43093d1692bdf5'
                    }
                    'aiux-acl|x-everi-luxesc-home-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: 'c74eb087e75f45ad8f18f3954da628ee'
                    }
                    'aiux-acl|x-everi-luxesc-knowledge-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '3cae36b33ca94e9786dc5585b56f6ca7'
                    }
                    'aiux-acl|x-everi-luxesc-requests-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '61ce522479054b659098c6c37de6660d'
                    }
                    'aiux-acl|x-everi-luxesc-ticket-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: '753cb490ffd14f538b9191801234930a'
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
                    'concierge-api-intake': {
                        table: 'sys_ws_operation'
                        id: 'de93038ddc3c45eea9d5ef012dc7bb69'
                    }
                    'concierge-api-latest': {
                        table: 'sys_ws_operation'
                        id: 'e8c520a5a7d6401e94a3aa853748e8f1'
                    }
                    'concierge-api-outcome': {
                        table: 'sys_ws_operation'
                        id: 'a9ea854a5b5940d29834ae2fe706ff3c'
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
                    'luxesc-chat-deployment-channel': {
                        table: 'sys_aix_experience_properties'
                        id: '618bcdbb0a6041fa9a1dea85666ec2c7'
                    }
                    'luxesc-concierge-si': {
                        table: 'sys_script_include'
                        id: 'e0c1ab8f88784a1cb96cae722072753b'
                    }
                    'luxesc-intake-si': {
                        table: 'sys_script_include'
                        id: '6af0ead2b4c74c229abb0deccb44da99'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'd8fb701e0f3541edacf6885ba5463327'
                    }
                    'src_server_script-includes_LuxEscConcierge_js': {
                        table: 'sys_module'
                        id: '7a0d5f52a17747c9ab4762559298e0f8'
                    }
                    'src_server_script-includes_LuxEscIntake_js': {
                        table: 'sys_module'
                        id: 'b214be9a63734091b91b962c8168f2d8'
                    }
                }
                composite: [
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
                        table: 'sys_security_acl_role'
                        id: 'b22939bcc6df4161b3d0212cf66502ea'
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
                        table: 'sys_db_object'
                        id: 'cb06f42be59f4edeabb0d387a57724a5'
                        key: {
                            name: 'x_everi_luxesc_concierge_run'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd8d0b706d6cb45d5a7136dfb036dac72'
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
