import {html, css, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const DONE = ['completed', 'success'];

/**
 * What an AI agent is doing, step by step: the tools it calls and its
 * reasoning, from the run trace (LuxEscConcierge._steps).
 */
@customElement('luxesc-agent-steps')
export class AgentSteps extends AIUXElement {
  @property({type: Array}) steps = [];
  @property({type: Boolean}) running = false;
  @property({type: String}) label = '';

  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    const steps = this.steps.filter(step => step.thought || step.actions?.length || step.type !== 'gen_ai');
    return html`<ol class="flex flex-col gap-2" aria-label=${this.label || i18n.getMessage('What the agent is doing')}>
      ${steps.map(
        step => html`<li class="flex gap-2 text-sm">
          <span
            class=${classMap({
              'aiux-badge aiux-badge-sm aiux-badge-soft shrink-0': true,
              'aiux-badge-success': DONE.includes(step.status),
              'aiux-badge-info': !DONE.includes(step.status)
            })}
          >
            ${step.actions?.length ? step.actions.join(', ') : step.name}
          </span>
          ${step.thought
            ? html`<span class="min-w-0 break-words text-text-secondary">${step.thought}</span>`
            : nothing}
        </li>`
      )}
      ${this.running
        ? html`<li class="flex flex-col gap-2" aria-hidden="true">
            <div class="aiux-skeleton h-4 w-3/4"></div>
            <div class="aiux-skeleton h-4 w-1/2"></div>
          </li>`
        : nothing}
    </ol>`;
  }
}
