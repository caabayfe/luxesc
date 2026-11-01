import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-list';
import {imageUrl} from '../utils/api.js';

const GALLERY_CONFIG = {
  fields: {
    heading: {column: 'name'},
    tagline: {column: 'category'},
    metadata: {column: 'price'},
    bodyText: {column: 'short_description'},
    media: {column: 'picture', options: {fit: 'contain', aspectRatio: '1/1'}}
  },
  options: {cardType: 'thumbnail', cardSize: '18rem'}
};

function cell(value) {
  return {value, displayValue: value};
}

/**
 * Catalog items from the Service Catalog API rendered as OOB aiux-gallery-list
 * cards. Selecting a card opens the item's order form.
 */
@customElement('luxesc-item-gallery')
export class ItemGallery extends AIUXElement {
  @property({type: Array}) items = [];

  static styles = css`
    :host {
      display: block;
    }
  `;

  get _columns() {
    return [
      {key: 'name', type: 'string', label: i18n.getMessage('Item'), showLink: true},
      {key: 'category', type: 'string', label: i18n.getMessage('Category')},
      {key: 'price', type: 'string', label: i18n.getMessage('Price')},
      {key: 'short_description', type: 'string', label: i18n.getMessage('Description')},
      {key: 'picture', type: 'string', label: i18n.getMessage('Picture')}
    ];
  }

  get _rows() {
    return this.items.map(item => ({
      key: item.sys_id,
      cells: {
        name: cell(item.name || ''),
        category: cell(item.category?.title || ''),
        price: cell(item.show_price ? item.price || '' : ''),
        short_description: cell(item.short_description || ''),
        picture: cell(imageUrl(item.picture))
      }
    }));
  }

  _open(e) {
    const sysId = e.detail?.row?.key;
    if (sysId) navigate(`/catalog/${sysId}`);
  }

  render() {
    return html`<aiux-gallery-list
      .columnDefinitions=${this._columns}
      .rowDefinitions=${this._rows}
      .galleryConfig=${GALLERY_CONFIG}
      @aiux-gallery-list:card-selected=${this._open}
      @aiux-gallery-list:cell-link-clicked=${this._open}
    ></aiux-gallery-list>`;
  }
}
