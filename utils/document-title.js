import {isServer} from 'lit';
import {i18n} from '@servicenow/aiux/aiux-services';

// WCAG 2.4.2: every page names itself in the browser tab
export function setDocumentTitle(title) {
  if (isServer) return;
  document.title = i18n.getMessage('{0} - Employee Center', title);
}
