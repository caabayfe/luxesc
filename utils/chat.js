import {deploymentDetailsContext} from '@servicenow/aiux/aiux-controllers';

/**
 * The framework resolves the experience's Now Assist deployment once per
 * request and seeds it for hydration. Pages list `chatContext` in their
 * static contexts so AI affordances appear only when the assistant can open.
 */
export const chatContext = deploymentDetailsContext;

export function isChatEnabled() {
  return deploymentDetailsContext.get()?.enabled === true;
}
