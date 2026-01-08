/*
 * Trafikinfo SE Alert Card
 * @license MIT (c) 2026
 *
 * UI/UX intentionally aligned with:
 * - www/smhi-alert-card.js
 * - www/krisinformation-alert-card.js
 */
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_SRC = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_ESM_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js';

class TrafikinfoSeAlertCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _expanded: {},
  };

  static styles = css`
    :host {
      /* Strength of the severity-tinted background when enabled (used in color-mix) */
      --trafikinfo-alert-bg-strong: 22%;
      --trafikinfo-alert-bg-soft: 12%;
      /* Optical vertical adjustment for the title in compact (1-row) mode */
      --trafikinfo-alert-compact-title-offset: 2px;
      /* Outer horizontal padding for the list (set to 0 to align with other cards) */
      --trafikinfo-alert-outer-padding: 0px;
      display: block;
    }

    ha-card {
      /* Keep the container tight so stacking multiple transparent cards doesn't show "gaps" */
      padding: 0;
      background: transparent;
      box-shadow: none;
      border: none;
      --ha-card-background: transparent;
      --ha-card-border-width: 0;
      --ha-card-border-color: transparent;
    }
    .alerts {
      display: flex;
      flex-direction: column;
      gap: 8px;
      /* No vertical padding: otherwise it becomes visible whitespace between stacked cards */
      padding: 0 var(--trafikinfo-alert-outer-padding, 0px);
    }
    .area-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .alert {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 12px;
      border-radius: var(--trafikinfo-alert-border-radius, 8px);
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      position: relative;
    }
    /* Compact (single-line) layout: vertically center the whole row */
    .alert.compact {
      align-items: center;
    }

    /* Optional severity-tinted background (keeps normal card background as base) */
    .alert.bg-severity {
      background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--trafikinfo-accent) var(--trafikinfo-alert-bg-strong, 22%), var(--card-background-color)) 0%,
          color-mix(in srgb, var(--trafikinfo-accent) var(--trafikinfo-alert-bg-soft, 12%), var(--card-background-color)) 55%,
          var(--card-background-color) 100%
        );
    }
    .alert::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-top-left-radius: inherit;
      border-bottom-left-radius: inherit;
      background: var(--trafikinfo-accent, var(--primary-color));
    }
    /* Align severity accents with existing cards */
    .alert.sev-yellow { --trafikinfo-accent: var(--trafikinfo-alert-yellow, #f1c40f); }
    .alert.sev-orange { --trafikinfo-accent: var(--trafikinfo-alert-orange, #e67e22); }
    .alert.sev-red { --trafikinfo-accent: var(--trafikinfo-alert-red, var(--error-color, #e74c3c)); }
    .alert.sev-message { --trafikinfo-accent: var(--trafikinfo-alert-message, var(--primary-color)); }

    .icon {
      width: 32px;
      height: 32px;
      margin-inline-start: 4px;
      margin-top: 2px;
    }
    .icon-col {
      display: flex;
      align-items: flex-start;
    }
    .icon-col.compact {
      align-items: center;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      align-self: stretch;
    }
    /* In compact layout, don't stretch the content; let the grid center it precisely */
    .content.compact {
      align-self: center;
    }
    .title {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }
    .headline {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* In compact mode, apply a tiny optical offset so the text looks centered */
    .headline.compact {
      transform: translateY(var(--trafikinfo-alert-compact-title-offset, 2px));
      line-height: 1;
    }
    .meta {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
    }
    .details { margin-top: 6px; }
    .md-text {
      white-space: pre-wrap;
      line-height: 1.5;
      font-family: inherit;
      font-size: 0.95em;
      color: var(--primary-text-color);
      overflow-wrap: anywhere;
    }
    .details-toggle {
      color: var(--primary-color);
      cursor: pointer;
      user-select: none;
      font-size: 0.95em;
      margin-bottom: 6px;
    }
    .toggle-col {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      padding-top: 2px;
      padding-right: 2px;
    }
    .toggle-col.compact {
      align-items: center;
      padding-top: 0;
    }
    /* Compact toggle when placed in the right column (prevents it from consuming an extra line) */
    .details-toggle.compact {
      margin: 0;
      font-size: 0.9em;
      white-space: nowrap;
    }
    /* Ensure consistent spacing when details are expanded */
    .details .meta + .md-text { margin-top: 6px; }
    .empty {
      color: var(--secondary-text-color);
      padding: 8px var(--trafikinfo-alert-outer-padding, 0px);
    }

    /* Optional minimap (Leaflet) */
    .map-wrap {
      margin-top: 10px;
      border-radius: var(--trafikinfo-alert-border-radius, 8px);
      overflow: hidden;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      position: relative;
      /* Prevent Leaflet's high z-index panes/controls from escaping above HA dialogs/menus */
      z-index: 0;
      isolation: isolate;
    }
    .geo-map {
      width: 100%;
      height: var(--trafikinfo-alert-map-height, 170px);
      /* Leaflet attaches panes/controls with high z-index; lock them into this local stacking context */
      position: relative;
      z-index: 0 !important;
    }
    .geo-map.leaflet-container { z-index: 0 !important; }
    /* Keep Leaflet controls above map tiles (but still inside the local stacking context) */
    .geo-map .leaflet-top,
    .geo-map .leaflet-bottom { z-index: 1000 !important; }
    .geo-map .leaflet-control { z-index: 1000 !important; }
    .map-status {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9em;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, var(--card-background-color) 85%, transparent);
      pointer-events: none;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    .map-status.show { opacity: 1; }
    /* Leaflet controls: allow zoom buttons, hide attribution to keep the card clean */
    .geo-map .leaflet-control-attribution { display: none; }
    .geo-map .leaflet-control-zoom {
      box-shadow: none;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      overflow: hidden;
      margin: 8px;
    }
    .geo-map .leaflet-control-zoom a {
      background: color-mix(in srgb, var(--card-background-color) 92%, transparent);
      color: var(--primary-text-color);
      border-bottom: 1px solid var(--divider-color);
    }
    .geo-map .leaflet-control-zoom a:last-child { border-bottom: none; }

    /* Editor-only controls */
    .meta-fields { margin: 12px 0; padding: 0 12px; }
    .meta-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 6px 0; }
    .order-actions { display: flex; gap: 6px; }
    .meta-divider-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 0; color: var(--secondary-text-color); }
    .meta-divider { border-top: 1px dashed var(--divider-color); height: 0; }

    a { color: var(--primary-color); text-decoration: none; }
    a:hover { text-decoration: underline; }
  `;

  constructor() {
    super();
    this._maps = new Map();
  }

  setConfig(config) {
    if (!config?.entity) throw new Error('You must specify an entity.');
    const normalized = this._normalizeConfig(config);
    this.config = normalized;
    this._expanded = {};
  }

  getCardSize() {
    const header = this._showHeader() ? 1 : 0;

    // Important: HA may call getCardSize() before hass is injected.
    // If we return 0 here, Lovelace can drop the card entirely from the editor UI.
    if (!this.hass) return header + 1;

    const events = this._visibleEvents();
    const count = Array.isArray(events) ? events.length : 0;

    // When empty (including in editor), reserve at least one row for the empty state.
    return header + (count > 0 ? count : 1);
  }

  /**
   * Sections (grid) view support.
   * Home Assistant uses this to determine the default/min size and to enable the UI "Layout" tab resizing.
   * Each section is 12 columns wide.
   */
  getGridOptions() {
    // Provide only column sizing. Avoid returning `rows` here so Sections can auto-size height
    // based on content (prevents fixed-height behavior and overlap issues when expanding).
    return {
      columns: 12,
      min_columns: 1,
      max_columns: 12,
      // In edit mode + empty state, HA Sections can collapse cards to 0 height unless a min is provided.
      // This keeps the card selectable/movable even when there is no data.
      min_rows: 1,
    };
  }

  _stateObj() {
    if (!this.hass || !this.config) return null;
    return this.hass.states?.[this.config.entity] || null;
  }

  _events() {
    const stateObj = this._stateObj();
    const raw = stateObj ? stateObj.attributes?.events || [] : [];
    return Array.isArray(raw) ? raw : [];
  }

  _visibleEvents() {
    const events = this._events();
    const cfg = this.config || {};
    const preset = String(cfg.preset || 'accident');
    const filterSev = (cfg.filter_severities || []).map((s) => String(s).toUpperCase());
    const filterRoadsRaw = cfg.filter_roads;
    const filterRoadsList = Array.isArray(filterRoadsRaw)
      ? filterRoadsRaw
      : (typeof filterRoadsRaw === 'string' ? filterRoadsRaw.split(/[;,]/g) : []);
    const filterRoads = filterRoadsList
      .map((s) => this._normalizeRoadFilterToken(s))
      .filter(Boolean);

    const filtered = events.filter((e) => {
      const sev = this._severityBucket(e);
      // Important traffic info typically has no severity; ignore severity filter there
      const sevOk = preset === 'important' || filterSev.length === 0 || filterSev.includes(sev);
      const roadText = `${e.road_name || ''} ${e.road_number || ''}`.toLowerCase();
      const roadNo = String(e.road_number || '').trim().toLowerCase();
      const roadOk = filterRoads.length === 0 || filterRoads.some((x) => (roadText.includes(x) || (roadNo && x === roadNo)));
      return sevOk && roadOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const order = cfg.sort_order || 'severity_then_time';
      const at = this._eventTime(a);
      const bt = this._eventTime(b);
      if (order === 'time_desc') return bt - at;
      // severity_then_time
      const as = this._severityRank(a);
      const bs = this._severityRank(b);
      if (as !== bs) return bs - as; // higher first
      return bt - at;
    });

    const max = Number(cfg.max_items || 0);
    return max > 0 ? sorted.slice(0, max) : sorted;
  }

  _eventTime(item) {
    const candidates = [
      item?.start_time,
      item?.publication_time,
      item?.modified_time,
      item?.version_time,
      item?.end_time,
    ];
    for (const v of candidates) {
      const ts = new Date(v || 0).getTime();
      if (!Number.isNaN(ts) && ts > 0) return ts;
    }
    return 0;
  }

  _severityBucket(item) {
    const code = Number(item?.severity_code);
    if (!Number.isNaN(code) && Number.isFinite(code)) {
      if (code >= 4) return 'HIGH';
      if (code >= 3) return 'MEDIUM';
      if (code >= 1) return 'LOW';
      return 'UNKNOWN';
    }
    const txt = String(item?.severity_text || '').trim().toLowerCase();
    if (!txt) return 'UNKNOWN';
    // Swedish/English heuristics
    if (txt.includes('extreme') || txt.includes('severe') || txt.includes('mycket stor') || txt.includes('very high') || txt.includes('hög')) return 'HIGH';
    if (txt.includes('high') || txt.includes('stor')) return 'MEDIUM';
    if (txt.includes('moderate') || txt.includes('måttlig') || txt.includes('medium') || txt.includes('låg') || txt.includes('liten') || txt.includes('low')) return 'LOW';
    return 'UNKNOWN';
  }

  _normalizeRoadFilterToken(value) {
    if (value === null || value === undefined) return '';
    let s = String(value).toLowerCase().trim();
    if (!s) return '';
    // Allow user-friendly inputs like "Väg 163" / "Road 163" by stripping the prefix.
    s = s.replace(/^(väg|vag|road)\s+/i, '');
    // Normalize whitespace
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  _severityRank(item) {
    const bucket = this._severityBucket(item);
    switch (bucket) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  _severityClass(item) {
    const bucket = this._severityBucket(item);
    if (bucket === 'HIGH') return 'sev-red';
    if (bucket === 'MEDIUM') return 'sev-orange';
    if (bucket === 'LOW') return 'sev-yellow';
    return 'sev-message';
  }

  _iconTemplate(item) {
    if (this.config.show_icon === false) return html``;
    const url = String(item?.icon_url || '').trim();
    if (url) {
      return html`<img class="icon" src="${url}" alt="icon" onerror="this.onerror=null;this.remove();" />`;
    }
    return html`<ha-icon class="icon" icon="mdi:alert" aria-hidden="true"></ha-icon>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const stateObj = this._stateObj();
    const t = this._t.bind(this);
    const events = this._visibleEvents();

    const header = this._showHeader()
      ? (this.config.title || stateObj?.attributes?.friendly_name || 'Trafikinfo')
      : undefined;

    const mapHeight = Number(this.config?.map_height || 170);
    const mapStyle = this.config?.show_map ? `--trafikinfo-alert-map-height: ${mapHeight}px;` : '';

    const eventsTotal = Number(stateObj?.attributes?.events_total || 0);
    const sensorMaxItems = Number(stateObj?.attributes?.max_items ?? null);
    const hasMoreButCapped = events.length === 0 && eventsTotal > 0 && sensorMaxItems === 0;
    const emptyText = hasMoreButCapped
      ? t('max_items_zero')
      : t('no_alerts');

    return html`
      <ha-card .header=${header} style=${mapStyle}>
        ${events.length === 0
          ? html`<div class="empty">${emptyText}</div>`
          : html`<div class="alerts">${this._renderGrouped(events)}</div>`}
      </ha-card>
    `;
  }

  _renderGrouped(events) {
    const groupBy = this.config?.group_by || 'none';
    if (groupBy === 'none') {
      return events.map((item, idx) => this._renderAlert(item, idx));
    }
    const groups = {};
    const getKey = (e) => {
      if (groupBy === 'road') return (e.road_name || e.road_number || '—');
      if (groupBy === 'severity') return this._severityBucket(e);
      return '—';
    };
    for (const e of events) {
      const key = getKey(e);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    let keys = Object.keys(groups);
    if (groupBy === 'severity') {
      const rankBucket = (bucket) => {
        const b = String(bucket || '').toUpperCase();
        if (b === 'HIGH') return 3;
        if (b === 'MEDIUM') return 2;
        if (b === 'LOW') return 1;
        return 0;
      };
      keys.sort((a, b) => rankBucket(b) - rankBucket(a));
    } else {
      keys.sort((a, b) => String(a).localeCompare(String(b)));
    }
    return keys.map((key) => html`
      <div class="area-group">
        <div class="meta" style="margin: 0;">${key}</div>
        ${groups[key].map((item, idx) => this._renderAlert(item, idx))}
      </div>
    `);
  }

  _renderAlert(item, idx) {
    const t = this._t.bind(this);
    const sevClass = this._severityClass(item);
    const sevBgClass = this.config?.severity_background ? 'bg-severity' : '';
    const showIcon = this.config.show_icon !== false;

    const headline = this._headline(item);
    const detailsText = this._detailsText(item);

    const mkMapBlock = () => {
      if (!this.config?.show_map) return null;
      const wkt = String(item?.geometry_wgs84 || '').trim();
      if (!wkt) return null;
      const key = this._alertKey(item, idx);
      const mapId = `trafikinfo-alert-map-${this._sanitizeDomId(key)}`;
      const statusId = `trafikinfo-alert-map-status-${this._sanitizeDomId(key)}`;
      return html`
        <div
          class="map-wrap"
          @pointerdown=${(e) => e.stopPropagation()}
          @pointerup=${(e) => e.stopPropagation()}
          @click=${(e) => e.stopPropagation()}
        >
          <div id=${statusId} class="map-status show">${t('map_loading')}</div>
          <div
            id=${mapId}
            class="geo-map"
            data-map-key=${key}
          ></div>
        </div>
      `;
    };

    const metaFields = {
      // Single road field (most information): combines RoadName + RoadNumber when available
      road: (this.config.show_road !== false && (item.road_name || item.road_number))
        ? html`<span><b>${t('road')}:</b> ${this._fmtRoad(item)}</span>`
        : null,
      location: (this.config.show_location !== false && (item.location_descriptor || item.positional_description))
        ? html`<span><b>${t('location')}:</b> ${item.location_descriptor || item.positional_description}</span>`
        : null,
      severity: (this.config.show_severity !== false && (item.severity_text || item.severity_code !== null && item.severity_code !== undefined))
        ? html`<span><b>${t('severity')}:</b> ${item.severity_text || item.severity_code}</span>`
        : null,
      restriction: (this.config.show_restriction !== false && item.traffic_restriction_type)
        ? html`<span><b>${t('restriction')}:</b> ${item.traffic_restriction_type}</span>`
        : null,
      direction: (this.config.show_direction !== false && (item.affected_direction || item.affected_direction_value))
        ? html`<span><b>${t('direction')}:</b> ${item.affected_direction || item.affected_direction_value}</span>`
        : null,
      period: (this.config.show_period !== false && (item.start_time || item.end_time || item.valid_until_further_notice))
        ? html`<span><b>${t('period')}:</b> ${this._fmtPeriod(item)}</span>`
        : null,
      published: (this.config.show_published !== false && item.publication_time)
        ? html`<span><b>${t('published')}:</b> ${this._fmtTs(item.publication_time)}</span>`
        : null,
      updated: (this.config.show_updated !== false && (item.modified_time || item.version_time))
        ? html`<span><b>${t('updated')}:</b> ${this._fmtTs(item.modified_time || item.version_time)}</span>`
        : null,
      link: (this.config.show_link !== false && item.weblink)
        ? html`<span><b>${t('link')}:</b> <a href="${item.weblink}" target="_blank" rel="noopener">${t('open_link')}</a></span>`
        : null,
      subtype: (this.config.show_subtype !== false && item.message_type_value)
        ? html`<span><b>${t('subtype')}:</b> ${item.message_type_value}</span>`
        : null,
      temporary_limit: (this.config.show_temporary_limit !== false && item.temporary_limit)
        ? html`<span><b>${t('temporary_limit')}:</b> ${item.temporary_limit}</span>`
        : null,
      lanes_restricted: (this.config.show_lanes_restricted !== false && (item.number_of_lanes_restricted !== null && item.number_of_lanes_restricted !== undefined))
        ? html`<span><b>${t('lanes_restricted')}:</b> ${item.number_of_lanes_restricted}</span>`
        : null,
      safety_related: (this.config.show_safety_related !== false && (item.safety_related_message === true || item.safety_related_message === false))
        ? html`<span><b>${t('safety_related')}:</b> ${item.safety_related_message ? t('yes') : t('no')}</span>`
        : null,
      suspended: (this.config.show_suspended !== false && (item.suspended === true || item.suspended === false))
        ? html`<span><b>${t('suspended')}:</b> ${item.suspended ? t('yes') : t('no')}</span>`
        : null,
      text: (this.config.show_text !== false && detailsText)
        ? (() => {
            const textContent = this._normalizeMultiline(detailsText);
            return html`<div class="md-text">${textContent}</div>`;
          })()
        : null,
      map: mkMapBlock(),
    };

    // Divider-driven meta layout
    const defaultOrder = ['road','location','severity','restriction','direction','period','divider','published','updated','link','text','map'];
    const rawOrder = Array.isArray(this.config.meta_order) && this.config.meta_order.length
      ? this.config.meta_order
      : defaultOrder;
    let order = rawOrder.filter((k, i) => rawOrder.indexOf(k) === i);
    // Keep divider+text enforced for backwards compatibility and consistent UX
    // (important preset uses divider to allow collapse/expand of details).
    if (!order.includes('divider')) order = [...order, 'divider'];
    if (!order.includes('text')) order = [...order, 'text'];
    if (!order.includes('map')) order = [...order, 'map'];
    // Remove deprecated/duplicate keys if they exist in saved configs.
    order = order.filter((k) => !['message', 'road_name', 'road_number'].includes(k));

    const dividerIndex = order.indexOf('divider');
    const inlineKeys = dividerIndex >= 0 ? order.slice(0, dividerIndex) : order.filter((k) => k !== 'divider');
    const detailsKeys = dividerIndex >= 0 ? order.slice(dividerIndex + 1) : [];

    const key = this._alertKey(item, idx);
    const hasStored = Object.prototype.hasOwnProperty.call(this._expanded || {}, key);
    const expanded = hasStored ? !!this._expanded[key] : false;

    const buildSectionBlocks = (keys, section) => {
      // Build blocks in order, but group consecutive meta spans into <div class="meta">...</div>
      const blocks = [];
      let metaGroup = [];
      const flushMeta = () => {
        if (metaGroup.length > 0) {
          blocks.push(html`<div class="meta">${metaGroup}</div>`);
          metaGroup = [];
        }
      };

      for (const k of keys) {
        if (k === 'divider') continue;
        if (k === 'text') {
          flushMeta();
          const node = metaFields.text;
          if (node) blocks.push(section === 'inline' ? html`<div class="details">${node}</div>` : node);
          continue;
        }
        if (k === 'map') {
          // In details section, only render map when expanded.
          if (section === 'details' && !expanded) {
            flushMeta();
            continue;
          }
          flushMeta();
          const node = metaFields.map;
          if (node) blocks.push(section === 'inline' ? html`<div class="details">${node}</div>` : node);
          continue;
        }
        const span = metaFields[k];
        if (span) metaGroup.push(span);
      }

      flushMeta();
      return blocks;
    };

    const sectionHasPotentialContent = (keys) => {
      for (const k of keys) {
        if (k === 'divider') continue;
        if (k === 'text') {
          if (this.config.show_text !== false && !!detailsText) return true;
          continue;
        }
        if (k === 'map') {
          if (this.config?.show_map && !!String(item?.geometry_wgs84 || '').trim()) return true;
          continue;
        }
        if (metaFields[k]) return true;
      }
      return false;
    };

    const inlineBlocks = buildSectionBlocks(inlineKeys, 'inline');
    const detailsBlocks = buildSectionBlocks(detailsKeys, 'details');
    const expandable = sectionHasPotentialContent(detailsKeys);
    const isCompact = !expanded && inlineBlocks.length === 0;

    return html`
      <div
        class="alert ${sevClass} ${sevBgClass} ${isCompact ? 'compact' : ''}"
        role="button"
        tabindex="0"
        aria-label="${headline}"
        @pointerdown=${(e) => this._onPointerDown(e)}
        @pointerup=${(e) => this._onPointerUp(e, item)}
        @keydown=${(e) => this._onKeydown(e, item)}
      >
        ${showIcon ? html`<div class="icon-col ${isCompact ? 'compact' : ''}">${this._iconTemplate(item)}</div>` : html``}
        <div class="content ${isCompact ? 'compact' : ''}">
          <div class="title">
            <div class="headline ${isCompact ? 'compact' : ''}">${headline}</div>
          </div>
          ${inlineBlocks.length > 0 ? html`${inlineBlocks}` : html``}
          ${expandable
            ? html`
                <div class="details">
                  ${expanded ? html`
                    ${detailsBlocks.length > 0 ? html`${detailsBlocks}` : html``}
                  ` : html``}
                </div>
              `
            : html``}
        </div>
        ${expandable ? html`
          <div class="toggle-col ${isCompact ? 'compact' : ''}">
            <div
              class="details-toggle compact"
              role="button"
              tabindex="0"
              title="${expanded ? t('hide_details') : t('show_details')}"
              @click=${(e) => this._toggleDetails(e, item, idx)}
              @pointerdown=${(e) => e.stopPropagation()}
              @pointerup=${(e) => e.stopPropagation()}
              @keydown=${(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this._toggleDetails(e, item, idx);
                }
                e.stopPropagation();
              }}
            >
              ${expanded ? t('hide_details') : t('show_details')}
            </div>
          </div>
        ` : html`<div></div>`}
      </div>`;
  }

  _headlineFromConfigFields(item) {
    const fields = Array.isArray(this.config?.headline_fields)
      ? this.config.headline_fields.map((x) => String(x)).filter(Boolean)
      : [];
    if (fields.length === 0) return '';

    const sepRaw = (this.config?.headline_separator !== undefined)
      ? String(this.config.headline_separator)
      : ' ';
    const sep = sepRaw.length > 0 ? sepRaw : ' ';

    const get = (key) => {
      switch (String(key)) {
        case 'header':
          return String(item?.header || '').trim();
        case 'message_type':
          return String(item?.message_type || item?.message_type_value || '').trim();
        case 'message_type_value':
          return String(item?.message_type_value || '').trim();
        case 'road_number':
          return String(item?.road_number || '').trim();
        case 'road_name':
          return String(item?.road_name || '').trim();
        case 'road':
          return String(this._fmtRoad(item) || '').trim();
        case 'location_descriptor':
          return String(item?.location_descriptor || '').trim();
        case 'positional_description':
          return String(item?.positional_description || '').trim();
        case 'location':
          return String(item?.location_descriptor || item?.positional_description || '').trim();
        case 'traffic_restriction_type':
          return String(item?.traffic_restriction_type || '').trim();
        case 'restriction':
          return String(item?.traffic_restriction_type || '').trim();
        case 'severity_text':
          return String(item?.severity_text || '').trim();
        case 'severity':
          return String(item?.severity_text || (item?.severity_code !== null && item?.severity_code !== undefined ? item?.severity_code : '') || '').trim();
        case 'direction':
          return String(item?.affected_direction || item?.affected_direction_value || '').trim();
        case 'temporary_limit':
          return String(item?.temporary_limit || '').trim();
        default:
          return '';
      }
    };

    const parts = fields.map((k) => get(k)).filter((s) => s && s.length > 0);
    return parts.join(sep).trim();
  }

  _headline(item) {
    const configured = this._headlineFromConfigFields(item);
    if (configured) return configured;

    // Default (backwards compatible) behavior:
    // prefer header/location, fall back to road/type.
    return String(
      item?.header
      || item?.location_descriptor
      || item?.positional_description
      || this._fmtRoad(item)
      || item?.message_type
      || item?.message_type_value
      || 'Olycka'
    );
  }

  _detailsText(item) {
    const primary = item?.message;
    const fallback = item?.header;
    const text = (primary && String(primary).trim().length > 0)
      ? String(primary)
      : (fallback && String(fallback).trim().length > 0)
        ? String(fallback)
        : '';
    return text || '';
  }

  _fmtRoad(item) {
    const rn = String(item?.road_number || '').trim();
    const name = String(item?.road_name || '').trim();
    if (rn && name) return `${name} (${rn})`;
    return name || rn || '';
  }

  _fmtPeriod(item) {
    const start = item?.start_time ? this._fmtTs(item.start_time) : this._t('unknown');
    const end = (item?.valid_until_further_notice === true)
      ? this._t('until_further_notice')
      : (item?.end_time ? this._fmtTs(item.end_time) : this._t('unknown'));
    return `${start} – ${end}`;
  }

  _normalizeMultiline(value) {
    if (!value) return '';
    let text = String(value).replace(/\r\n?/g, '\n');
    // Trim leading/trailing empty lines
    text = text.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
    const lines = text.split('\n');
    // Determine common leading indent among non-empty lines, preferring positive indents.
    const indents = lines
      .filter((ln) => ln.trim().length > 0)
      .map((ln) => {
        const m = ln.match(/^(\s*)/);
        return m ? m[1].length : 0;
      });
    const positive = indents.filter((n) => n > 0);
    const minIndent = positive.length > 0 ? Math.min(...positive) : (indents.length > 0 ? Math.min(...indents) : 0);
    const deindented = lines.map((ln) => (minIndent > 0 && ln.startsWith(' '.repeat(minIndent)) ? ln.slice(minIndent) : ln));
    return deindented.join('\n');
  }

  _toggleDetails(e, item, idx) {
    e.stopPropagation();
    const key = this._alertKey(item, idx);
    this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
  }

  _onPointerDown(e) {
    if (e.button !== 0) return; // left click only
    clearTimeout(this._holdTimer);
    this._holdFired = false;
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
    }, 500);
  }

  _onPointerUp(e, item) {
    if (e.button !== 0) return;
    clearTimeout(this._holdTimer);
    if (this._holdFired) {
      this._runAction(this.config?.hold_action || this.config?.tap_action || { action: 'more-info' }, item);
      return;
    }
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 250) {
      this._lastTap = 0;
      this._runAction(this.config?.double_tap_action || this.config?.tap_action || { action: 'more-info' }, item);
    } else {
      this._lastTap = now;
      clearTimeout(this._tapTimer);
      this._tapTimer = setTimeout(() => {
        if (this._lastTap && Date.now() - this._lastTap >= 250) {
          this._lastTap = 0;
          this._runAction(this.config?.tap_action || { action: 'more-info' }, item);
        }
      }, 260);
    }
  }

  _onKeydown(e, item) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._runAction(this.config?.tap_action || { action: 'more-info' }, item);
    }
  }

  _alertKey(item, idx) {
    const sid = String(item?.situation_id || '');
    const did = String(item?.deviation_id || '');
    const t = String(item?.start_time || item?.publication_time || item?.modified_time || idx);
    return `${sid}-${did}-${t}`;
  }

  _fmtTs(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      return d.toLocaleString();
    } catch (e) {
      return String(value);
    }
  }

  _showHeader() {
    return this.config?.show_header !== false;
  }

  updated() {
    this._maybeInitMaps();
  }

  _maybeInitMaps() {
    if (!this.config?.show_map) return;
    if (!this.renderRoot) return;

    const events = this._visibleEvents();
    const rawOrder = Array.isArray(this.config.meta_order) && this.config.meta_order.length
      ? this.config.meta_order
      : ['road','location','severity','restriction','direction','period','divider','published','updated','link','text','map'];
    let order = rawOrder.filter((k, i) => rawOrder.indexOf(k) === i);
    if (!order.includes('divider')) order = [...order, 'divider'];
    if (!order.includes('text')) order = [...order, 'text'];
    if (!order.includes('map')) order = [...order, 'map'];
    const dividerIndex = order.indexOf('divider');
    const inlineKeys = dividerIndex >= 0 ? order.slice(0, dividerIndex) : order.filter((k) => k !== 'divider');
    const detailsKeys = dividerIndex >= 0 ? order.slice(dividerIndex + 1) : [];
    const mapInInline = inlineKeys.includes('map');
    const mapInDetails = detailsKeys.includes('map');

    const activeKeys = new Set();
    for (let i = 0; i < events.length; i++) {
      const item = events[i];
      const key = this._alertKey(item, i);
      const expanded = !!this._expanded?.[key];
      const mapVisible = (mapInInline || (mapInDetails && expanded));
      if (!mapVisible) continue;
      const wkt = String(item?.geometry_wgs84 || '').trim();
      if (!wkt) continue;

      const mapId = `trafikinfo-alert-map-${this._sanitizeDomId(key)}`;
      const el = this.renderRoot.querySelector(`#${mapId}`);
      if (!el) continue;
      activeKeys.add(key);
      this._ensureLeafletAndRenderMap(key, el, wkt, item).catch(() => {
        const statusEl = this.renderRoot?.querySelector?.(`#trafikinfo-alert-map-status-${this._sanitizeDomId(key)}`);
        if (statusEl) {
          statusEl.textContent = this._t('map_failed');
          statusEl.classList.add('show');
        }
      });
    }

    // Cleanup maps that are no longer rendered (collapsed/filtered away)
    for (const [key, entry] of this._maps.entries()) {
      if (activeKeys.has(key)) continue;
      try { entry?.map?.remove?.(); } catch (e) {}
      this._maps.delete(key);
    }
  }

  _sanitizeDomId(value) {
    return String(value || '').replace(/[^a-zA-Z0-9\-_]/g, '_');
  }

  _severityStyle(item) {
    // Align with the card severity colors used for the left stripe.
    const bucket = this._severityBucket(item);
    const accentVar =
      bucket === 'HIGH' ? 'var(--trafikinfo-alert-red, var(--error-color, #e74c3c))'
      : bucket === 'MEDIUM' ? 'var(--trafikinfo-alert-orange, #e67e22)'
      : bucket === 'LOW' ? 'var(--trafikinfo-alert-yellow, #f1c40f)'
      : 'var(--trafikinfo-alert-message, var(--primary-color))';
    return {
      color: accentVar,
      fillColor: accentVar,
      weight: 3,
      opacity: 0.95,
      fillOpacity: 0.22,
    };
  }

  _wktLonLatPoints(wkt) {
    // WKT in Trafikverket WGS84 comes as lon/lat pairs (e.g. "POINT (11.97 57.70)").
    // We extract all numbers and treat them as lon/lat(/z) sequences.
    try {
      const s = String(wkt || '').trim();
      if (!s) return [];
      const header = s.split('(')[0].toUpperCase();
      const dim = (header.includes(' Z') || header.endsWith('Z')) ? 3 : 2;
      const nums = s.match(/[-+]?\d+(?:\.\d+)?/g) || [];
      const floats = nums.map((n) => Number(n)).filter((n) => Number.isFinite(n));
      if (floats.length < 2) return [];
      const step = dim === 3 ? 3 : 2;
      const pts = [];
      for (let i = 0; i + 1 < floats.length; i += step) {
        const lon = floats[i];
        const lat = floats[i + 1];
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        pts.push([lat, lon]); // Leaflet wants [lat, lon]
      }
      return pts;
    } catch (e) {
      return [];
    }
  }

  async _ensureLeafletAndRenderMap(key, containerEl, wkt, item) {
    this._ensureLeafletCssInShadowRoot();
    const statusEl = this.renderRoot?.querySelector?.(`#trafikinfo-alert-map-status-${this._sanitizeDomId(key)}`);
    if (statusEl) {
      statusEl.textContent = this._t('map_loading_leaflet');
      statusEl.classList.add('show');
    }
    const L = await this._ensureLeaflet();
    if (!L) return;

    const pts = this._wktLonLatPoints(wkt);
    if (!pts.length) {
      if (statusEl) {
        statusEl.textContent = this._t('map_failed');
        statusEl.classList.add('show');
      }
      return;
    }
    const sig = `${pts.length}|${String(pts[0]?.[0] || '')},${String(pts[0]?.[1] || '')}|${this._severityBucket(item)}`;
    const existing = this._maps.get(key);
    const containerChanged = existing?.container && existing.container !== containerEl;
    if (existing && containerChanged) {
      try { existing.map.remove(); } catch (e) {}
      this._maps.delete(key);
    }

    let entry = this._maps.get(key);
    if (!entry) {
      const map = L.map(containerEl, {
        zoomControl: this.config?.map_zoom_controls !== false,
        attributionControl: false,
        scrollWheelZoom: this.config?.map_scroll_wheel === true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        touchZoom: true,
        tap: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      entry = { map, layer: null, sig: '', container: containerEl };
      this._maps.set(key, entry);
    }

    if (entry.sig !== sig) {
      if (statusEl) {
        statusEl.textContent = this._t('map_rendering');
        statusEl.classList.add('show');
      }
      try { entry.layer?.remove?.(); } catch (e) {}

      const style = this._severityStyle(item);
      const zoomOutSteps = 2; // default: zoom out a bit for better overview
      if (pts.length === 1) {
        entry.layer = L.circleMarker(pts[0], { ...style, radius: 8 }).addTo(entry.map);
        entry.map.setView(pts[0], 14);
        try { entry.map.zoomOut(zoomOutSteps); } catch (e) {}
      } else {
        // If multiple points, draw a polyline and fit bounds.
        entry.layer = L.polyline(pts, style).addTo(entry.map);
        try {
          const bounds = entry.layer.getBounds?.();
          if (bounds && bounds.isValid && bounds.isValid()) {
            entry.map.fitBounds(bounds, { padding: [12, 12] });
            try { entry.map.zoomOut(zoomOutSteps); } catch (e) {}
          }
        } catch (e) {}
      }
      entry.sig = sig;
    }

    requestAnimationFrame(() => {
      try { entry.map.invalidateSize(); } catch (e) {}
    });

    if (statusEl) {
      statusEl.classList.remove('show');
      statusEl.textContent = '';
    }
  }

  _ensureLeaflet() {
    window.__trafikinfoSeLeafletPromise = window.__trafikinfoSeLeafletPromise || null;
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (window.__trafikinfoSeLeafletPromise) return window.__trafikinfoSeLeafletPromise;

    window.__trafikinfoSeLeafletPromise = (async () => {
      try {
        const mod = await this._withTimeout(import(LEAFLET_ESM_URL), 12000, 'Leaflet ESM import timed out');
        const L = mod?.default || mod?.L || mod;
        if (L && L.map) {
          window.L = window.L || L;
          return L;
        }
        throw new Error('Leaflet ESM loaded but did not expose L.map');
      } catch (err) {
        const jsId = 'trafikinfo-se-leaflet-js';
        return await new Promise((resolve, reject) => {
          try {
            if (window.L && window.L.map) {
              resolve(window.L);
              return;
            }
            let script = document.getElementById(jsId);
            if (!script) {
              script = document.createElement('script');
              script.id = jsId;
              script.src = LEAFLET_JS_SRC;
              script.async = true;
              document.head.appendChild(script);
            }
            script.addEventListener('load', () => resolve(window.L));
            script.addEventListener('error', () => reject(err || new Error('Failed to load Leaflet')));
          } catch (e) {
            reject(err || e);
          }
        });
      }
    })();

    return window.__trafikinfoSeLeafletPromise;
  }

  _withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(message || 'Timed out')), ms);
      promise.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
    });
  }

  _ensureLeafletCssInShadowRoot() {
    const id = 'trafikinfo-se-leaflet-css-shadow';
    try {
      if (!this.renderRoot) return;
      if (this.renderRoot.querySelector(`#${id}`)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS_HREF;
      this.renderRoot.appendChild(link);
    } catch (e) {
      // ignore
    }
  }

  shouldUpdate(changed) {
    if (changed.has('config')) return true;
    if (changed.has('hass')) {
      const stateObj = this._stateObj();
      const events = stateObj?.attributes?.events || [];
      const msgKey = JSON.stringify(
        (Array.isArray(events) ? events : []).map((m) => [
          m.situation_id,
          m.deviation_id,
          m.severity_code,
          m.severity_text,
          m.message_type_value,
          m.header,
          m.message,
          m.road_name,
          m.road_number,
          m.location_descriptor,
          m.positional_description,
          m.temporary_limit,
          m.number_of_lanes_restricted,
          m.safety_related_message,
          m.suspended,
          m.start_time,
          m.end_time,
          m.publication_time,
          m.modified_time,
          m.version_time,
          m.weblink,
        ])
      );
      const combinedKey = `${String(stateObj?.attributes?.last_modified || '')}|${String(stateObj?.attributes?.last_change_id || '')}|${msgKey}`;
      if (this._lastKey !== combinedKey) {
        this._lastKey = combinedKey;
        return true;
      }
      return false;
    }
    return true;
  }

  _t(key) {
    const lang = (this.hass?.language || this.hass?.locale?.language || 'en').toLowerCase();
    const dict = {
      en: {
        no_alerts: 'No incidents',
        max_items_zero: 'Incidents exist but are not exposed to the UI. Increase max_items in the Trafikinfo SE integration options.',
        road: 'Road',
        location: 'Location',
        severity: 'Severity',
        restriction: 'Restriction',
        direction: 'Direction',
        period: 'Period',
        published: 'Published',
        updated: 'Updated',
        subtype: 'Type',
        temporary_limit: 'Temporary speed limit',
        lanes_restricted: 'Lanes restricted',
        safety_related: 'Safety related',
        suspended: 'Suspended',
        yes: 'Yes',
        no: 'No',
        link: 'Link',
        open_link: 'Open',
        show_details: 'Show details',
        hide_details: 'Hide details',
        unknown: 'Unknown',
        until_further_notice: 'Until further notice',
        map_loading: 'Loading map…',
        map_loading_leaflet: 'Loading map (Leaflet)…',
        map_rendering: 'Rendering location…',
        map_failed: 'Map failed to load (blocked by browser/HA CSP)',
      },
      sv: {
        no_alerts: 'Inga olyckor',
        max_items_zero: 'Olyckor finns men listas inte i sensorn. Höj max_items i Trafikinfo SE-integrationens inställningar.',
        road: 'Väg',
        location: 'Plats',
        severity: 'Allvarlighetsgrad',
        restriction: 'Restriktion',
        direction: 'Riktning',
        period: 'Period',
        published: 'Publicerad',
        updated: 'Uppdaterad',
        subtype: 'Typ',
        temporary_limit: 'Tillfällig hastighet',
        lanes_restricted: 'Avstängda körfält',
        safety_related: 'Säkerhetsrelaterat',
        suspended: 'Avstängd',
        yes: 'Ja',
        no: 'Nej',
        link: 'Länk',
        open_link: 'Öppna',
        show_details: 'Visa detaljer',
        hide_details: 'Dölj detaljer',
        unknown: 'Okänt',
        until_further_notice: 'Tills vidare',
        map_loading: 'Laddar karta…',
        map_loading_leaflet: 'Laddar karta (Leaflet)…',
        map_rendering: 'Ritar plats…',
        map_failed: 'Kartan kunde inte laddas (blockerad av webbläsare/HA CSP)',
      },
    };
    return (dict[lang] || dict.en)[key] || key;
  }

  _normalizeConfig(config) {
    const normalized = { ...config };

    // Backwards compatibility mappings (message removed; keep any existing configs stable)

    if (normalized.preset === undefined) normalized.preset = 'accident';

    // Defaults
    if (normalized.show_header === undefined) normalized.show_header = true;
    if (normalized.show_icon === undefined) normalized.show_icon = true;
    if (normalized.severity_background === undefined) normalized.severity_background = false;
    if (normalized.show_map === undefined) normalized.show_map = false;
    if (normalized.map_height === undefined) normalized.map_height = 170;
    if (normalized.map_zoom_controls === undefined) normalized.map_zoom_controls = true;
    if (normalized.map_scroll_wheel === undefined) normalized.map_scroll_wheel = false;
    if (normalized.max_items === undefined) normalized.max_items = 0;
    if (normalized.sort_order === undefined) normalized.sort_order = 'severity_then_time';
    if (normalized.group_by === undefined) normalized.group_by = 'none';

    // Headline customization (optional). When empty/not set: keep old auto headline behavior.
    if (!Array.isArray(normalized.headline_fields)) normalized.headline_fields = [];
    if (normalized.headline_separator === undefined) normalized.headline_separator = ' ';

    // Per-meta toggles
    if (normalized.show_road === undefined) normalized.show_road = true;
    if (normalized.show_location === undefined) normalized.show_location = true;
    if (normalized.show_severity === undefined) normalized.show_severity = true;
    if (normalized.show_restriction === undefined) normalized.show_restriction = true;
    if (normalized.show_direction === undefined) normalized.show_direction = true;
    if (normalized.show_period === undefined) normalized.show_period = true;
    if (normalized.show_published === undefined) normalized.show_published = true;
    if (normalized.show_updated === undefined) normalized.show_updated = true;
    if (normalized.show_link === undefined) normalized.show_link = true;
    if (normalized.show_text === undefined) normalized.show_text = true;
    if (normalized.show_subtype === undefined) normalized.show_subtype = false;
    if (normalized.show_temporary_limit === undefined) normalized.show_temporary_limit = false;
    if (normalized.show_lanes_restricted === undefined) normalized.show_lanes_restricted = false;
    if (normalized.show_safety_related === undefined) normalized.show_safety_related = false;
    if (normalized.show_suspended === undefined) normalized.show_suspended = false;

    if (!Array.isArray(normalized.filter_severities)) normalized.filter_severities = [];
    // `filter_roads` is edited as a string for better UX; normalize to array here.
    if (typeof normalized.filter_roads === 'string') {
      normalized.filter_roads = normalized.filter_roads
        .split(/[;,]/g)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(normalized.filter_roads)) {
      normalized.filter_roads = [];
    }
    // "Viktig trafikinformation" has no severity fields; avoid configs accidentally filtering everything.
    if (String(normalized.preset) === 'important') normalized.filter_severities = [];

    // Enforce a minimal, consistent layout for the important preset:
    // put period + message behind the details toggle.
    if (String(normalized.preset) === 'important') {
      if (normalized.use_details === undefined) normalized.use_details = true;
      normalized.meta_order = normalized.use_details ? ['divider', 'period', 'text'] : ['period', 'text'];
      // Keep map off by default for important preset (often national/unlocated).
      if (normalized.show_map === undefined) normalized.show_map = false;
      if (Object.prototype.hasOwnProperty.call(normalized, 'hide_when_empty')) delete normalized.hide_when_empty;
      return normalized;
    }

    if (!Array.isArray(normalized.meta_order) || normalized.meta_order.length === 0) {
      // Default: keep map in the details section (after divider) so the list stays compact.
      normalized.meta_order = ['road','location','severity','restriction','direction','period','divider','published','updated','link','text','map'];
    } else {
      if (!normalized.meta_order.includes('text')) normalized.meta_order = [...normalized.meta_order, 'text'];
      if (!normalized.meta_order.includes('divider')) normalized.meta_order = [...normalized.meta_order, 'divider'];
      if (!normalized.meta_order.includes('map')) normalized.meta_order = [...normalized.meta_order, 'map'];
      // If old configs had `message` in the order, remove it (it was duplicating `text`)
      normalized.meta_order = normalized.meta_order.filter((k) => !['message', 'road_name', 'road_number'].includes(k));
    }
    // Remove deprecated toggles if present
    if (Object.prototype.hasOwnProperty.call(normalized, 'show_road_name')) delete normalized.show_road_name;
    if (Object.prototype.hasOwnProperty.call(normalized, 'show_road_number')) delete normalized.show_road_number;
    if (Object.prototype.hasOwnProperty.call(normalized, 'hide_when_empty')) delete normalized.hide_when_empty;
    // Ensure numeric
    normalized.map_height = Number(normalized.map_height || 170);
    return normalized;
  }

  static getConfigElement() {
    return document.createElement('trafikinfo-se-alert-card-editor');
  }

  static getStubConfig(hass, entities) {
    const suggested = (entities || []).find((e) => e === 'sensor.trafikinfo_se_olycka')
      || (entities || []).find((e) => e && e.startsWith('sensor.trafikinfo_se_'))
      || (entities || []).find((e) => e && e.startsWith('sensor.'))
      || '';
    return {
      preset: 'accident',
      entity: suggested,
      title: '',
      show_header: true,
      show_icon: true,
      severity_background: false,
      show_map: false,
      map_height: 170,
      map_zoom_controls: true,
      map_scroll_wheel: false,
      max_items: 0,
      sort_order: 'severity_then_time',
      group_by: 'none',
      filter_severities: [],
      filter_roads: [],
      show_road: true,
      show_location: true,
      show_severity: true,
      show_restriction: true,
      show_direction: true,
      show_period: true,
      show_published: true,
      show_updated: true,
      show_link: true,
      show_text: true,
      // Headline: empty means "auto" (backwards compatible default)
      headline_fields: [],
      headline_separator: ' ',
      meta_order: ['road','location','severity','restriction','direction','period','divider','published','updated','link','text','map'],
      tap_action: {},
      double_tap_action: {},
      hold_action: {},
    };
  }
}

/**
 * Preset card: Viktig trafikinformation
 * Same UI/behavior as TrafikinfoSeAlertCard but with different defaults.
 */
class TrafikinfoSeViktigTrafikinformationCard extends TrafikinfoSeAlertCard {
  setConfig(config) {
    // Force preset to keep defaults stable and avoid accidental cross-preset configs.
    super.setConfig({ ...config, preset: 'important' });
  }

  static getConfigElement() {
    return document.createElement('trafikinfo-se-alert-card-editor');
  }

  static getStubConfig(hass, entities) {
    const suggested = (entities || []).find((e) => e === 'sensor.trafikinfo_se_viktig_trafikinformation')
      || (entities || []).find((e) => e && e.includes('viktig_trafikinformation'))
      || (entities || []).find((e) => e && e.startsWith('sensor.trafikinfo_se_'))
      || (entities || []).find((e) => e && e.startsWith('sensor.'))
      || '';
    return {
      preset: 'important',
      entity: suggested,
      title: '',
      show_header: true,
      show_icon: true,
      severity_background: false,
      // Headline: empty means "auto" (backwards compatible default)
      headline_fields: [],
      headline_separator: ' ',
      // If true: period+text are hidden behind the details toggle by default.
      // If false: show everything directly (no details toggle).
      use_details: true,
      // Keep it simple for important messages:
      // - show period + message behind the details toggle
      meta_order: ['divider', 'period', 'text'],
      tap_action: {},
      double_tap_action: {},
      hold_action: {},
    };
  }
}

if (!customElements.get('trafikinfo-se-alert-card')) {
  customElements.define('trafikinfo-se-alert-card', TrafikinfoSeAlertCard);
}

if (!customElements.get('trafikinfo-se-viktig-trafikinformation-card')) {
  customElements.define('trafikinfo-se-viktig-trafikinformation-card', TrafikinfoSeViktigTrafikinformationCard);
}

class TrafikinfoSeAlertCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: {},
  };

  static styles = css`
    .container { padding: 8px 0 0 0; }
    .meta-fields { margin: 12px 0; padding: 8px 12px; }
    .meta-fields-title { color: var(--secondary-text-color); margin-bottom: 6px; }
    .meta-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 6px 0; }
    .order-actions { display: flex; gap: 6px; }
    .meta-divider-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 0; color: var(--secondary-text-color); }
    .meta-divider { border-top: 1px dashed var(--divider-color); height: 0; }
  `;

  setConfig(config) {
    this._config = config;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const preset = String(this._config.preset || 'accident');
    const schema = [
      { name: 'entity', label: 'Entity', required: true, selector: { entity: { domain: 'sensor' } } },
      { name: 'title', label: 'Title', selector: { text: {} } },
      {
        name: 'headline_fields',
        label: 'Incident headline fields (bold title)',
        selector: { select: { multiple: true, options: [
          { value: 'message_type', label: 'Type (message_type)' },
          { value: 'road_number', label: 'Road number (road_number)' },
          { value: 'road_name', label: 'Road name (road_name)' },
          { value: 'road', label: 'Road (combined)' },
          { value: 'location_descriptor', label: 'Location descriptor (location_descriptor)' },
          { value: 'positional_description', label: 'Positional description (positional_description)' },
          { value: 'location', label: 'Location (descriptor or positional)' },
          { value: 'traffic_restriction_type', label: 'Restriction (traffic_restriction_type)' },
          { value: 'severity', label: 'Severity (text/code)' },
          { value: 'direction', label: 'Direction (affected_direction)' },
          { value: 'temporary_limit', label: 'Temporary speed limit (temporary_limit)' },
          { value: 'header', label: 'Header (header)' },
        ] } },
      },
      { name: 'headline_separator', label: 'Headline separator', selector: { text: {} } },
      { name: 'show_header', label: 'Show header', selector: { boolean: {} } },
      { name: 'show_icon', label: 'Show icon', selector: { boolean: {} } },
      { name: 'severity_background', label: 'Severity background', selector: { boolean: {} } },
      // actions
      { name: 'tap_action', label: 'Tap action', selector: { ui_action: {} } },
      { name: 'double_tap_action', label: 'Double tap action', selector: { ui_action: {} } },
      { name: 'hold_action', label: 'Hold action', selector: { ui_action: {} } },
    ];
    if (preset === 'important') {
      schema.splice(6, 0, { name: 'use_details', label: 'Use details (collapse/expand)', selector: { boolean: {} } });
    }
    if (preset !== 'important') {
      schema.splice(6, 0,
        { name: 'show_map', label: 'Show map (location)', selector: { boolean: {} } },
        { name: 'map_height', label: 'Map height (px)', selector: { number: { min: 90, max: 420, mode: 'box' } } },
        { name: 'map_zoom_controls', label: 'Map zoom controls (+/−)', selector: { boolean: {} } },
        { name: 'map_scroll_wheel', label: 'Map scroll wheel zoom', selector: { boolean: {} } },
        { name: 'max_items', label: 'Max items', selector: { number: { min: 0, mode: 'box' } } },
        {
          name: 'sort_order', label: 'Sort order',
          selector: { select: { mode: 'dropdown', options: [
            { value: 'severity_then_time', label: 'Severity then time' },
            { value: 'time_desc', label: 'Time (newest first)' },
          ] } },
        },
        { name: 'group_by', label: 'Group by', selector: { select: { mode: 'dropdown', options: [
          { value: 'none', label: 'No grouping' },
          { value: 'road', label: 'By road' },
          { value: 'severity', label: 'By severity' },
        ] } } },
        { name: 'filter_roads', label: 'Filter roads (comma/semicolon-separated)', selector: { text: {} } },
      );
    }
    if (preset !== 'important') {
      schema.splice(10, 0, { name: 'filter_severities', label: 'Filter severities', selector: { select: { multiple: true, options: [
        { value: 'HIGH', label: 'High' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'LOW', label: 'Low' },
        { value: 'UNKNOWN', label: 'Unknown' },
      ] } } });
    }

    const data = {
      entity: this._config.entity || '',
      title: this._config.title || '',
      headline_fields: Array.isArray(this._config.headline_fields) ? this._config.headline_fields : [],
      headline_separator: this._config.headline_separator !== undefined ? String(this._config.headline_separator) : ' ',
      show_header: this._config.show_header !== undefined ? this._config.show_header : true,
      show_icon: this._config.show_icon !== undefined ? this._config.show_icon : true,
      severity_background: this._config.severity_background !== undefined ? this._config.severity_background : false,
      show_map: this._config.show_map !== undefined ? this._config.show_map : false,
      map_height: this._config.map_height !== undefined ? this._config.map_height : 170,
      map_zoom_controls: this._config.map_zoom_controls !== undefined ? this._config.map_zoom_controls : true,
      map_scroll_wheel: this._config.map_scroll_wheel !== undefined ? this._config.map_scroll_wheel : false,
      use_details: this._config.use_details !== undefined ? this._config.use_details : true,
      max_items: this._config.max_items ?? 0,
      sort_order: this._config.sort_order || 'severity_then_time',
      group_by: this._config.group_by || 'none',
      filter_severities: this._config.filter_severities || [],
      filter_roads: Array.isArray(this._config.filter_roads)
        ? (this._config.filter_roads || []).join(', ')
        : (this._config.filter_roads || ''),
      // meta toggles (rendered below)
      show_road: this._config.show_road !== undefined ? this._config.show_road : true,
      show_location: this._config.show_location !== undefined ? this._config.show_location : true,
      show_severity: this._config.show_severity !== undefined ? this._config.show_severity : true,
      show_restriction: this._config.show_restriction !== undefined ? this._config.show_restriction : true,
      show_direction: this._config.show_direction !== undefined ? this._config.show_direction : true,
      show_period: this._config.show_period !== undefined ? this._config.show_period : true,
      show_published: this._config.show_published !== undefined ? this._config.show_published : true,
      show_updated: this._config.show_updated !== undefined ? this._config.show_updated : true,
      show_link: this._config.show_link !== undefined ? this._config.show_link : true,
      show_text: this._config.show_text !== undefined ? this._config.show_text : true,
      tap_action: this._config.tap_action || {},
      double_tap_action: this._config.double_tap_action || {},
      hold_action: this._config.hold_action || {},
    };

    // Keep "important" preset editor minimal (message + period). Accident preset keeps the full set.
    const allowed = (preset === 'important')
      ? ['period']
      : ['road','location','severity','restriction','direction','period','published','updated','link','map'];
    const special = (preset === 'important')
      ? ['text']
      : ['divider','text'];
    const allowedWithSpecial = [...allowed, ...special];
    const currentOrderRaw = (this._config.meta_order && Array.isArray(this._config.meta_order) && this._config.meta_order.length)
      ? this._config.meta_order.filter((k) => allowedWithSpecial.includes(k))
      : ['road','location','severity','restriction','direction','period','divider','published','updated','link','text','map'];
    let currentOrder = [...currentOrderRaw];
    if (!currentOrder.includes('text')) currentOrder.push('text');
    if (preset !== 'important') {
      if (!currentOrder.includes('divider')) currentOrder.push('divider');
    }
    const filledOrder = [...currentOrder, ...allowedWithSpecial.filter((k) => !currentOrder.includes(k))];

    const schemaTop = schema.filter((s) => !['tap_action','double_tap_action','hold_action'].includes(s.name));
    const schemaActions = schema.filter((s) => ['tap_action','double_tap_action','hold_action'].includes(s.name));

    return html`
      <div class="container">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schemaTop}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
        ${preset === 'important' ? html`` : html`
          <div class="meta-fields">
            ${filledOrder.map((key, index) => {
              if (key === 'divider') {
                return html`
                  <ha-settings-row class="meta-divider-row">
                    <span slot="heading">Details divider</span>
                    <div class="order-actions">
                      <mwc-icon-button @click=${() => this._moveMeta(key, -1)} .disabled=${index === 0} aria-label="Move up">
                        <ha-icon icon="mdi:chevron-up"></ha-icon>
                      </mwc-icon-button>
                      <mwc-icon-button @click=${() => this._moveMeta(key, 1)} .disabled=${index === filledOrder.length - 1} aria-label="Move down">
                        <ha-icon icon="mdi:chevron-down"></ha-icon>
                      </mwc-icon-button>
                    </div>
                    <div class="meta-divider"></div>
                  </ha-settings-row>
                `;
              }
              return html`
                <ha-settings-row class="meta-row">
                  <span slot="heading">${this._labelForMeta(key)}</span>
                  <span slot="description"></span>
                  <div class="order-actions">
                    <mwc-icon-button @click=${() => this._moveMeta(key, -1)} .disabled=${index === 0} aria-label="Move up">
                      <ha-icon icon="mdi:chevron-up"></ha-icon>
                    </mwc-icon-button>
                    <mwc-icon-button @click=${() => this._moveMeta(key, 1)} .disabled=${index === filledOrder.length - 1} aria-label="Move down">
                      <ha-icon icon="mdi:chevron-down"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-switch
                    .checked=${this._isMetaShown(key)}
                    @change=${(e) => this._toggleMeta(key, e)}
                  ></ha-switch>
                </ha-settings-row>`;
            })}
          </div>
        `}
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schemaActions}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  _valueChanged = (ev) => {
    if (!this._config || !this.hass) return;
    const value = ev.detail?.value || {};
    const next = { ...this._config, ...value };
    // Keep `filter_roads` as a raw string while editing. The card normalizes it in `_normalizeConfig`.
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next } }));
  };

  _isMetaShown(key) {
    if (key === 'road') return this._config.show_road !== false;
    if (key === 'location') return this._config.show_location !== false;
    if (key === 'severity') return this._config.show_severity !== false;
    if (key === 'restriction') return this._config.show_restriction !== false;
    if (key === 'direction') return this._config.show_direction !== false;
    if (key === 'period') return this._config.show_period !== false;
    if (key === 'published') return this._config.show_published !== false;
    if (key === 'updated') return this._config.show_updated !== false;
    if (key === 'link') return this._config.show_link !== false;
    if (key === 'text') return this._config.show_text !== false;
    if (key === 'map') return this._config.show_map === true;
    if (key === 'divider') return true;
    return true;
  }

  _toggleMeta(key, ev) {
    const on = ev?.target?.checked ?? true;
    let next = { ...this._config };
    if (key === 'road') next.show_road = on;
    else if (key === 'location') next.show_location = on;
    else if (key === 'severity') next.show_severity = on;
    else if (key === 'restriction') next.show_restriction = on;
    else if (key === 'direction') next.show_direction = on;
    else if (key === 'period') next.show_period = on;
    else if (key === 'published') next.show_published = on;
    else if (key === 'updated') next.show_updated = on;
    else if (key === 'link') next.show_link = on;
    else if (key === 'text') next.show_text = on;
    else if (key === 'map') next.show_map = on;
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next } }));
  }

  _moveMeta(key, delta) {
    const preset = String(this._config?.preset || 'accident');
    const baseKeys = (preset === 'important')
      ? ['period']
      : ['road','location','severity','restriction','direction','period','published','updated','link','map'];
    const specialKeys = (preset === 'important')
      ? ['text']
      : ['divider','text'];
    const allKeys = [...baseKeys, ...specialKeys];
    const raw = (this._config.meta_order && Array.isArray(this._config.meta_order) && this._config.meta_order.length)
      ? this._config.meta_order.filter((k) => allKeys.includes(k))
      : [...allKeys];
    let current = raw.filter((k, i) => raw.indexOf(k) === i);
    if (!current.includes('text')) current.push('text');
    if (preset !== 'important') {
      if (!current.includes('divider')) current.push('divider');
    }
    const filled = [...current, ...allKeys.filter((k) => !current.includes(k))];

    const idx = filled.indexOf(key);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(filled.length - 1, idx + delta));
    if (newIdx === idx) return;
    const next = [...filled];
    next.splice(idx, 1);
    next.splice(newIdx, 0, key);
    this._config = { ...this._config, meta_order: next };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _labelForMeta(key) {
    const map = {
      road: 'Road',
      location: 'Location',
      severity: 'Severity',
      restriction: 'Restriction',
      direction: 'Direction',
      period: 'Period',
      published: 'Published',
      updated: 'Updated',
      link: 'Link',
      map: 'Map',
      subtype: 'Type',
      temporary_limit: 'Temporary speed limit',
      lanes_restricted: 'Lanes restricted',
      safety_related: 'Safety related',
      suspended: 'Suspended',
      text: 'Text',
      divider: '— Details —',
    };
    return map[key] || key;
  }

  _computeLabel = (schema) => {
    const labels = {
      entity: 'Entity',
      title: 'Title',
      headline_fields: 'Incident headline fields (bold title)',
      headline_separator: 'Headline separator',
      show_header: 'Show header',
      show_icon: 'Show icon',
      severity_background: 'Severity background',
      show_map: 'Show map (location)',
      map_height: 'Map height (px)',
      map_zoom_controls: 'Map zoom controls (+/−)',
      map_scroll_wheel: 'Map scroll wheel zoom',
      use_details: 'Use details (collapse/expand)',
      max_items: 'Max items',
      sort_order: 'Sort order',
      group_by: 'Group by',
      filter_severities: 'Filter severities',
      filter_roads: 'Filter roads (comma/semicolon-separated)',
      tap_action: 'Tap action',
      double_tap_action: 'Double tap action',
      hold_action: 'Hold action',
    };
    return labels[schema.name] || schema.name;
  };
}

if (!customElements.get('trafikinfo-se-alert-card-editor')) {
  customElements.define('trafikinfo-se-alert-card-editor', TrafikinfoSeAlertCardEditor);
}

// Register the card so it appears in the "Add card" dialog
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'trafikinfo-se-alert-card',
  name: 'Trafikinfo SE – Olyckor',
  description: 'Displays Trafikinfo SE incidents (default: accidents) using the Trafikinfo SE integration sensors',
  preview: true,
});

window.customCards.push({
  type: 'trafikinfo-se-viktig-trafikinformation-card',
  name: 'Trafikinfo SE – Viktig trafikinformation',
  description: 'Displays Trafikinfo SE important traffic information incidents using the Trafikinfo SE integration sensors',
  preview: true,
});

// Actions support (same behavior as SMHI/Krisinformation cards)
TrafikinfoSeAlertCard.prototype._runAction = function (action, item) {
  const a = action?.action || 'more-info';
  if (a === 'none') return;
  if (a === 'more-info') {
    const ev = new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: this.config.entity } });
    this.dispatchEvent(ev);
    return;
  }
  if (a === 'navigate' && action.navigation_path) {
    history.pushState(null, '', action.navigation_path);
    const ev = new Event('location-changed', { bubbles: true, composed: true });
    this.dispatchEvent(ev);
    return;
  }
  if (a === 'url' && action.url_path) {
    window.open(action.url_path, '_blank');
    return;
  }
  if (a === 'call-service' && action.service) {
    const [domain, service] = action.service.split('.');
    this.hass.callService(domain, service, action.service_data || {});
  }
};


