import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import {callConcierge} from '../utils/agent-runs.js';

const log = getLogger('luxesc-journey');

// Journeys already read in this page session, by record; opening a row again is instant
const cache = new Map();

/**
 * A request's or incident's journey (GET /journey/{task}): only the milestones
 * it really went through, with their dates, where it is now and what comes next
 * (the expected date, and how late it is), plus the latest update the employee
 * can see. Rendered with the OOB aiux-timeline.
 */
@customElement('luxesc-journey')
export class Journey extends AIUXElement {
  @property({type: String, attribute: 'task-id'}) taskId = '';
  // What the record is, for the timeline's accessible name
  @property({type: String}) label = '';
  @property({type: Boolean, attribute: 'hide-update'}) hideUpdate = false;

  // The journey, 'loading' or 'error'
  @state() _journey = 'loading';

  static styles = css`
    :host {
      display: block;
    }
  `;

  willUpdate(changed) {
    if (changed.has('taskId') && !isServer) this._load();
  }

  // Read it again, after an action changed the record
  refresh() {
    cache.delete(this.taskId);
    this._load();
  }

  async _load() {
    const taskId = this.taskId;
    if (!taskId) return;
    if (cache.has(taskId)) {
      this._journey = cache.get(taskId);
      return;
    }
    this._journey = 'loading';
    try {
      const journey = (await callConcierge(`/journey/${taskId}`))?.journey || 'error';
      if (journey !== 'error') cache.set(taskId, journey);
      if (taskId === this.taskId) this._journey = journey;
    } catch (error) {
      log.warn({error: error.message}, 'Journey unavailable');
      if (taskId === this.taskId) this._journey = 'error';
    }
  }

  _renderMarker(step) {
    if (step.state === 'done') return html`<span class="text-success">${icon({name: 'circle-check', size: 'sm'})}</span>`;
    if (step.state === 'current') {
      return html`<span class=${step.tone === 'warning' ? 'text-warning' : step.tone === 'error' ? 'text-error' : 'text-info'}>
        ${icon({name: 'circle-half', size: 'sm'})}
      </span>`;
    }
    return step.tone === 'warning'
      ? html`<span class="text-warning">${icon({name: 'calendar-triangle-exclamation', size: 'sm'})}</span>`
      : html`<span class="text-text-secondary">${icon({name: 'circle-dashed', size: 'sm'})}</span>`;
  }

  _renderSteps(steps) {
    const stateLabel = {done: i18n.getMessage('Done'), current: i18n.getMessage('Now'), next: i18n.getMessage('Next')};
    // A connector is filled when the step it leads to has been reached; the theme's
    // connector is taller and has margins, which split the line on a compact list
    const line = step => html`<hr class="m-0! h-auto! min-h-2! self-stretch ${step.state === 'next' ? 'bg-base-300' : 'bg-success'}" />`;
    return html`<ol class="aiux-timeline aiux-timeline-vertical aiux-timeline-compact" aria-label=${i18n.getMessage('Progress of {0}', this.label)}>
      ${steps.map(
        (step, index) => html`<li aria-current=${step.state === 'current' ? 'step' : 'false'}>
          ${index ? line(step) : nothing}
          <div class="aiux-timeline-middle">${this._renderMarker(step)}</div>
          <div class="aiux-timeline-end flex flex-col pb-3 ps-1">
            <span class="sr-only">${stateLabel[step.state]}:</span>
            <span class="text-sm ${step.state === 'current' ? 'font-semibold' : step.state === 'next' ? 'text-text-secondary' : ''}">${step.label}</span>
            ${step.at || step.short
              ? html`<span class="text-xs ${step.tone === 'warning' ? 'font-medium' : 'text-text-secondary'}">
                  ${[step.at, step.short].filter(Boolean).join(' · ')}
                </span>`
              : nothing}
          </div>
          ${index < steps.length - 1 ? line(steps[index + 1]) : nothing}
        </li>`
      )}
    </ol>`;
  }

  render() {
    const journey = this._journey;
    if (journey === 'loading') {
      return html`<div class="flex flex-col gap-2 py-1" aria-hidden="true">
        <div class="aiux-skeleton h-4 w-1/2"></div>
        <div class="aiux-skeleton h-4 w-1/3"></div>
        <div class="aiux-skeleton h-4 w-2/5"></div>
      </div>`;
    }
    if (journey === 'error') {
      return html`<p class="text-sm text-text-secondary">${i18n.getMessage('The progress of this record could not be loaded.')}</p>`;
    }
    return html`<div class="flex flex-col items-start gap-3">
      ${this._renderSteps(journey.steps || [])}
      ${journey.update && !this.hideUpdate
        ? html`<figure class="m-0 flex max-w-full flex-col items-start gap-1 border-s-2 border-base-300 ps-3">
            <figcaption class="text-xs text-text-secondary">${i18n.getMessage('Latest update · {0}', journey.update.at)}</figcaption>
            <blockquote class="m-0 line-clamp-3 break-words text-sm">${journey.update.text}</blockquote>
          </figure>`
        : nothing}
    </div>`;
  }
}
