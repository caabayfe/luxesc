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
                    'aiux-acl|x-everi-luxesc-home-page|read|allow_if|snc_internal': {
                        table: 'sys_security_acl'
                        id: 'c74eb087e75f45ad8f18f3954da628ee'
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
                    'aiux-dependency|api.js': {
                        table: 'sys_aix_dependency'
                        id: 'ccba77defd8861d7586a3ad54a52f1e6'
                    }
                    'aiux-dependency|catalog.js': {
                        table: 'sys_aix_dependency'
                        id: 'a21f70009eff8ada224f6da431bf928d'
                    }
                    'aiux-dependency|document-title.js': {
                        table: 'sys_aix_dependency'
                        id: 'e2684a37134e76a5269abc1587ad23a5'
                    }
                    'aiux-dependency|luxesc-item-gallery.js': {
                        table: 'sys_aix_dependency'
                        id: 'ec5442b8e7031e6ebe0e5440461dc70f'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-catalog-item-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '1a0b648b950c61e33ca3e0ed15a9cdb7'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-catalog-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '59c6f055219ffd078b524f292e0eed92'
                    }
                    'aiux-experience-page-rel|x-everi-luxesc-home-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '085dc380109a39f6efd20f0707e90b24'
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
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '93e36e980f8320a0bde13280351256c6'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '98eed63af2d22190508556ed10d04007'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-item-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '756b940bb994aeb137f72cbd6be485ec'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-catalog-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '39ef6f437f0850abf852c78d8b0a7392'
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
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|api.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '5b817763ca15a7826b56a20f79d95df3'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|catalog.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '388cb0a5cf53615e39434553442f126b'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '0eacd9baa912488ba4758e96c866175c'
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-home-page|luxesc-item-gallery.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'baaf11f214322c221364dc1edd0391f4'
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
                    }
                    'aiux-m2m-widget-dep|x-everi-luxesc-ticket-page|document-title.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '73163e89850d6b955414e37c531394cb'
                    }
                    'aiux-page-widget|x-everi-luxesc-catalog-item-page': {
                        table: 'sys_aix_widget'
                        id: '6c89f454bc5fc1a90b9f9b36e7e4702d'
                    }
                    'aiux-page-widget|x-everi-luxesc-catalog-page': {
                        table: 'sys_aix_widget'
                        id: 'e29aa4a3da8c2432cd8733a30511234e'
                    }
                    'aiux-page-widget|x-everi-luxesc-home-page': {
                        table: 'sys_aix_widget'
                        id: '65b2c9e7016a3b8bc9db2f58def72a63'
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
                    'aiux-page|x-everi-luxesc-home-page': {
                        table: 'sys_aix_page'
                        id: '85150eb1ff9760ab28e5d188567c38ca'
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
                    package_json: {
                        table: 'sys_module'
                        id: 'd8fb701e0f3541edacf6885ba5463327'
                    }
                }
                composite: [
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
                ]
            }
        }
    }
}
