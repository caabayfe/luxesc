import {navLayoutContext} from '@servicenow/aiux/aiux-components-nav';
import {i18n} from '@servicenow/aiux/aiux-services';
import {AppTheme} from './theme.js';
import './components/luxesc-command-palette.js';

// ⌘K / Ctrl+K opens the one box from any page. The palette is imported up front: a chunk
// imported only from here is linked to the layout widget, and the instance does not serve it.
function installCommandPalette(basePath) {
  if (typeof window === 'undefined' || window.__luxescPalette) return;
  window.__luxescPalette = true;
  window.addEventListener('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return;
    e.preventDefault();
    let palette = document.querySelector('luxesc-command-palette');
    if (!palette) {
      palette = document.createElement('luxesc-command-palette');
      palette.basePath = basePath;
      document.body.append(palette);
    }
    palette.show();
  });
}

// Catalog items and articles open from Explore and keep it highlighted
const EXPLORE_SECTIONS = ['/explore', '/catalog', '/knowledge'];

// Three destinations named after what people want, not after the tables behind
// them. The nav highlights the item whose activePath prefixes the URL, so
// Explore's follows the section the employee is in.
function navItems(path) {
  return [
    {
      icon: 'home',
      title: i18n.getMessage('For you'),
      action: {type: 'navigate', path: '/start'}
    },
    {
      icon: 'inbox',
      title: i18n.getMessage('My stuff'),
      action: {type: 'navigate', path: '/requests'}
    },
    {
      icon: 'compass',
      title: i18n.getMessage('Explore'),
      action: {type: 'navigate', path: '/explore'},
      activePath: EXPLORE_SECTIONS.find(section => path === section || path.startsWith(`${section}/`)) || '/explore'
    }
  ];
}

export default {
  appTheme: AppTheme,
  applicationLayout: 'aiux-nav-layout',

  setup(ctx) {
    installCommandPalette(ctx.basePath || '/aiux/luxesc');
    const activeRoute = ctx.app?.routes?.find(r => r.active)?.route || '';

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
      items: navItems(activeRoute),
      defaultLogoFull: 'servicenow',
      defaultLogoIcon: 'servicenow'
    });
  },

  // Before each navigation: keep Explore highlighted on catalog items and articles
  navigate({toAppPath}) {
    navLayoutContext.set({...navLayoutContext.get(), items: navItems((toAppPath || '').split('?')[0])});
  },

  teardown() {
    navLayoutContext.set({
      items: [],
      defaultLogoFull: null,
      defaultLogoIcon: null
    });
  }
};
