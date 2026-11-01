import {i18n} from '@servicenow/aiux/aiux-services';
import {addComment, updateRecord} from './api.js';

// Kinds of item that wait on the employee: an approval, an answer, a fix to confirm
export const NEED_KINDS = ['approval', 'action', 'done'];
export const needsYou = item => NEED_KINDS.includes(item.kind);

export function kindLabel(kind) {
  return (
    {
      approval: i18n.getMessage('Needs your approval'),
      action: i18n.getMessage('Needs your action'),
      stale: i18n.getMessage('No recent update'),
      progress: i18n.getMessage('In progress'),
      done: i18n.getMessage('Ready to confirm')
    }[kind] || i18n.getMessage('For your information')
  );
}

// What the employee can do on one of their records, right from its row. Each one
// is confirmed in the card first and runs as the employee through the Table API.
export const ACTIONS = {
  approve: {
    commentRequired: false,
    run: (item, comment) => updateRecord('sysapproval_approver', item.approvalId, {state: 'approved', comments: comment}),
    done: () => i18n.getMessage('Approved.')
  },
  reject: {
    commentRequired: true,
    run: (item, comment) => updateRecord('sysapproval_approver', item.approvalId, {state: 'rejected', comments: comment}),
    done: () => i18n.getMessage('Rejected.')
  },
  comment: {
    commentRequired: true,
    run: (item, comment) => addComment('task', item.sysId, comment),
    done: () => i18n.getMessage('Comment posted. The people working on it will see it.')
  },
  // Accepting the resolution closes the incident
  close: {
    commentRequired: false,
    run: item => updateRecord('incident', item.sysId, {state: '7'}),
    done: () => i18n.getMessage('Closed. Thanks for confirming.')
  },
  // A caller's comment on a resolved incident reopens it (OOB)
  reopen: {
    commentRequired: true,
    run: (item, comment) => addComment('incident', item.sysId, comment),
    done: () => i18n.getMessage('Sent back to the service desk with your comment.')
  }
};

// Shown on the row; the others (Still not fixed) wait in the item's details
export const ROW_ACTIONS = ['approve', 'reject', 'close', 'comment'];

// Colour of the row's status dot
export const KIND_TONE = {approval: 'bg-warning', action: 'bg-error', done: 'bg-success', stale: 'bg-warning'};

export function actionLabel(action) {
  return {
    approve: i18n.getMessage('Approve'),
    reject: i18n.getMessage('Reject'),
    comment: i18n.getMessage('Post comment'),
    close: i18n.getMessage('Yes, it is fixed'),
    reopen: i18n.getMessage('Still not fixed')
  }[action];
}

export function actionsFor(item) {
  if (item.kind === 'approval' && item.approvalId) return ['approve', 'reject'];
  if (!item.sysId) return [];
  if (item.kind === 'done' && item.number?.startsWith('INC')) return ['close', 'reopen'];
  if (item.kind === 'stale' || item.kind === 'action') return ['comment'];
  return [];
}

export const itemKey = item => item.approvalId || item.sysId || item.title;
