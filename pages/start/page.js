import {html, css, nothing, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  userContext,
  withWidgetContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {getUser} from '@servicenow/aiux/aiux-utils';
import {fetchCategories, fetchRecords} from '../../utils/api.js';
import {SERVICE_CATALOG_ID} from '../../constants/catalog.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import {chatContext} from '../../utils/chat.js';
import '../../components/luxesc-command-box.js';
import '../../components/luxesc-concierge.js';
import '../../components/luxesc-known-issues.js';
import {catalogTools} from '../../utils/catalog-tools.js';
import {callConcierge} from '../../utils/agent-runs.js';
import {exploreHref} from '../../utils/explore.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-home');

// Short lists on the home tiles; the full ones are one click away
const CATEGORY_COUNT = 6;

const REQUEST_FIELDS = 'sys_id,number,short_description,state,sys_class_name,sys_updated_on';
const MY_OPEN_REQUESTS =
  'active=true^opened_by=javascript:gs.getUserID()^sys_class_nameINsc_req_item,incident^ORDERBYDESCsys_updated_on';

@customElement('x-everi-luxesc-home-page')
@title('Home')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class HomePage extends withWidgetContext(AIUXElement) {
  static contexts = [userContext, chatContext];

  // Set after the first render: the server does not know the employee's time of day
  @state() _greeting = '';

  static aiContext = {
    description: "Employee Center home (For you): one box to ask for anything, what needs the employee, their requests on the way, known issues and popular answers",
    bestFor:
      'When the employee asks what they have open, wants to follow up a request, or needs something new. To order, use find_catalog_items, describe_catalog_item and open_catalog_item: they open a pre-filled form for the employee to submit.'
  };

  static client_tools = {
    open_request: {
      description: 'Open one of the employee\'s requests or incidents by its number (e.g. RITM0010054, INC0026088).',
      arguments: [
        {name: 'number', description: 'Request or incident number', type: 'string', required: true}
      ],
      definition: async function ({number} = {}) {
        const found = (this.loaderData?.openRequests || []).find(
          request => request.number.display_value === String(number).trim().toUpperCase()
        );
        const sysId = found?.sys_id.value ||
          (await fetchRecords('task', {
            encodedQuery: `number=${String(number).trim()}^opened_by=javascript:gs.getUserID()`,
            fields: 'sys_id',
            limit: 1
          }).catch(() => []))?.[0]?.sys_id?.value;
        if (!sysId) return {success: false, reason: `${number} is not one of your requests`};
        navigate(`/requests/${sysId}`);
        return {success: true};
      }
    },
    ...catalogTools
  };

  // No scroll anchoring: when the box's answer grows, the page stays on the answer
  // instead of scrolling to keep the tiles below in place
  static styles = css`
    :host {
      display: block;
      min-height: 100%;
      container-type: inline-size;
      overflow-anchor: none;
    }
  `;

  static async loader(ctx) {
    const [categories, trending, openRequests] = await Promise.allSettled([
      fetchCategories(SERVICE_CATALOG_ID),
      callConcierge('/knowledge/trending'),
      fetchRecords('task', {encodedQuery: MY_OPEN_REQUESTS, fields: REQUEST_FIELDS, limit: 10})
    ]);
    [categories, trending, openRequests]
      .filter(result => result.status === 'rejected')
      .forEach(result => log.warn({error: result.reason?.message}, 'Home data unavailable'));
    const value = result => (result.status === 'fulfilled' ? result.value || [] : []);
    return {
      basePath: ctx.basePath || '',
      categories: value(categories),
      trending: trending.status === 'fulfilled' ? trending.value?.articles || [] : [],
      openRequests: value(openRequests)
    };
  }

  get _basePath() {
    return this.loaderData?.basePath || '';
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Home'));
    const hour = new Date().getHours();
    this._greeting = hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening';
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    if (isServer || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    this.setAiContext({
      openRequests: (this.loaderData?.openRequests || []).map(request => ({
        number: request.number.display_value,
        summary: request.short_description.display_value,
        type: request.sys_class_name.display_value,
        state: request.state.display_value,
        updated: request.sys_updated_on.display_value
      }))
    });
  }


  // Landing on /start rather than /home: the shell treats /home as a page that
  // embeds its own chat, so the shared assistant would not open from here
  get _suggestions() {
    return [
      {label: i18n.getMessage('My laptop is slow'), question: i18n.getMessage('My laptop is very slow. Help me fix it or request what I need.')},
      {label: i18n.getMessage('I need software'), question: i18n.getMessage('I need new software installed. Help me find the right catalog item.')},
      {label: i18n.getMessage('Something is broken'), question: i18n.getMessage('Something is not working and I need to report it.')}
    ];
  }

  _renderGreeting() {
    // Service and integration accounts often have no first name, only a display name
    const user = getUser();
    const name = user?.firstName || user?.name;
    if (!name) return i18n.getMessage('Hello');
    return {
      morning: i18n.getMessage('Good morning, {0}', name),
      afternoon: i18n.getMessage('Good afternoon, {0}', name),
      evening: i18n.getMessage('Good evening, {0}', name)
    }[this._greeting] || i18n.getMessage('Hello, {0}', name);
  }

  // A tile of links: title, up to a handful of rows and a link to the full list
  _renderLinks({id, heading, rows, more}) {
    if (!rows.length) return nothing;
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby=${id}>
      <div class="aiux-card-body gap-2">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id=${id} class="aiux-card-title text-lg">${heading}</h2>
          <a class="aiux-link aiux-link-primary text-sm" href=${more.href}>${more.label}</a>
        </div>
        <ul class="flex flex-col">
          ${rows.map(
            row => html`<li>
              <a class="flex items-center justify-between gap-3 rounded-box px-2 py-2 hover:bg-base-200 focus-visible:bg-base-200" href=${row.href}>
                <span class="min-w-0 truncate" title=${row.title}>${row.title}</span>
                ${row.meta ? html`<span class="shrink-0 text-xs text-text-secondary">${row.meta}</span>` : nothing}
              </a>
            </li>`
          )}
        </ul>
      </div>
    </section>`;
  }

  // Categories as pills: a way in to the catalog that takes little room; the tile
  // stretches so both columns of the row end together
  _renderServices(categories) {
    if (!categories.length) return nothing;
    const base = this._basePath;
    return html`<section class="aiux-card flex-1 border border-base-300 bg-base-100 shadow-sm" aria-labelledby="services-title">
      <div class="aiux-card-body gap-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="services-title" class="aiux-card-title text-lg">${i18n.getMessage('Browse services')}</h2>
          <a class="aiux-link aiux-link-primary text-sm" href=${exploreHref(base, {tab: 'services'})}>${i18n.getMessage('Full catalog')}</a>
        </div>
        <ul class="flex flex-wrap gap-2">
          ${categories.slice(0, CATEGORY_COUNT).map(
            c => html`<li>
              <a class="aiux-btn aiux-btn-sm aiux-btn-outline h-auto min-h-8 max-w-full whitespace-normal py-1 text-start" href=${exploreHref(base, {tab: 'services', categoryId: c.sys_id})}>
                ${c.title}
              </a>
            </li>`
          )}
        </ul>
      </div>
    </section>`;
  }

  render() {
    const {categories = [], trending = []} = this.loaderData || {};
    const base = this._basePath;
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:p-8">
      <h1 class="break-words text-3xl font-bold">${this._renderGreeting()}</h1>
      <luxesc-known-issues></luxesc-known-issues>
      <luxesc-command-box .basePath=${base} .suggestions=${this._suggestions}></luxesc-command-box>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <luxesc-concierge class="min-w-0 lg:col-span-2" .basePath=${base}></luxesc-concierge>
        <div class="flex min-w-0 flex-col gap-6">
          ${this._renderLinks({
            id: 'trending-title',
            heading: i18n.getMessage('Trending'),
            rows: trending.map(a => ({
              href: `${base}/knowledge/${a.sysId}`,
              title: a.title,
              // Recent views only; articles that fill the list from all-time views show none
              meta: !a.recentViews
                ? ''
                : a.recentViews === 1
                  ? i18n.getMessage('1 view this month')
                  : i18n.getMessage('{0} views this month', a.recentViews)
            })),
            more: {href: exploreHref(base, {tab: 'answers'}), label: i18n.getMessage('All answers')}
          })}
          ${this._renderServices(categories)}
        </div>
      </div>
    </div>`;
  }
}
