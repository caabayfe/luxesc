import {navLayoutContext} from '@servicenow/aiux/aiux-components-nav';
import {i18n} from '@servicenow/aiux/aiux-services';
import {AppTheme} from './theme.js';

export default {
  appTheme: AppTheme,
  applicationLayout: 'aiux-nav-layout',

  setup(ctx) {
    const items = [
      {
        icon: 'home',
        title: i18n.getMessage('Home'),
        action: {type: 'navigate', path: '/home'}
      },
      {
        icon: 'shopping-cart',
        title: i18n.getMessage('Request something'),
        action: {type: 'navigate', path: '/catalog'}
      },
      {
        icon: 'list',
        title: i18n.getMessage('My requests'),
        action: {type: 'navigate', path: '/requests'}
      }
    ];

    // Child routes (/catalog/<item>, /requests/<id>) keep their section highlighted
    const activeRoute = ctx.app?.routes?.find(r => r.active)?.route || '';
    const itemsWithActive = items.map(item => ({
      ...item,
      ...(activeRoute.startsWith(item.action.path) && {active: true})
    }));

    const current = navLayoutContext.get();
    navLayoutContext.set({
      ...current,
      appTitle: i18n.getMessage('Employee Center'),
      features: {
        menus: false,
        logo: true,
        userSession: false,
        notifications: true,
        announcements: true,
        themeToggle: true,
        densityPicker: false,
        unifiedExperience: false,
        profile: true,
        helpPanel: false,
        // Virtual Agent / Now Assist, when the instance has a chat deployment
        chat: ctx.chat?.enabled === true
      },
      items: itemsWithActive,
      defaultLogoFull: 'servicenow',
      defaultLogoIcon: 'servicenow'
    });
  },

  teardown() {
    navLayoutContext.set({
      items: [],
      defaultLogoFull: null,
      defaultLogoIcon: null
    });
  }
};
