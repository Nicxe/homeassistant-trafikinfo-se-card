/*
 * Trafikinfo SE Alert Card
 * @license MIT (c) 2026
 *
 * UI/UX intentionally aligned with:
 * - www/smhi-alert-card.js
 * - www/krisinformation-alert-card.js
 */
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

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
      display: block;
    }

    ha-card {
      padding: 8px 0;
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
      padding: 0 12px 12px 12px;
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
      padding: 8px 12px 12px 12px;
    }

    /* Editor-only controls */
    .meta-fields { margin: 12px 0; padding: 0 12px; }
    .meta-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 6px 0; }
    .order-actions { display: flex; gap: 6px; }
    .meta-divider-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 0; color: var(--secondary-text-color); }
    .meta-divider { border-top: 1px dashed var(--divider-color); height: 0; }

    a { color: var(--primary-color); text-decoration: none; }
    a:hover { text-decoration: underline; }
  `;

  setConfig(config) {
    if (!config?.entity) throw new Error('You must specify an entity.');
    const normalized = this._normalizeConfig(config);
    this.config = normalized;
    this._expanded = {};
  }

  getCardSize() {
    const events = this._visibleEvents();
    if (this.config?.hide_when_empty && (!events || events.length === 0)) return 0;
    const header = this._showHeader() ? 1 : 0;
    return header + (events ? events.length : 0);
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
    if (!stateObj) return html``;
    const t = this._t.bind(this);
    const events = this._visibleEvents();

    if (this.config.hide_when_empty && events.length === 0) return html``;

    const header = this._showHeader()
      ? (this.config.title || stateObj.attributes?.friendly_name || 'Trafikinfo')
      : undefined;

    const eventsTotal = Number(stateObj.attributes?.events_total || 0);
    const sensorMaxItems = Number(stateObj.attributes?.max_items ?? null);
    const hasMoreButCapped = events.length === 0 && eventsTotal > 0 && sensorMaxItems === 0;
    const emptyText = hasMoreButCapped
      ? t('max_items_zero')
      : t('no_alerts');

    return html`
      <ha-card .header=${header}>
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
        <div class="meta" style="margin: 0 12px;">${key}</div>
        ${groups[key].map((item, idx) => this._renderAlert(item, idx))}
      </div>
    `);
  }

  _renderAlert(item, idx) {
    const t = this._t.bind(this);
    const sevClass = this._severityClass(item);
    const sevBgClass = this.config?.severity_background ? 'bg-severity' : '';
    const showIcon = this.config.show_icon !== false;
    const preset = String(this.config?.preset || 'accident');

    const headline = this._headline(item);
    const detailsText = this._detailsText(item);

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
    };

    // Divider-driven meta layout
    const defaultOrder = ['road','location','severity','restriction','direction','period','divider','published','updated','link','text'];
    const rawOrder = Array.isArray(this.config.meta_order) && this.config.meta_order.length
      ? this.config.meta_order
      : defaultOrder;
    let order = rawOrder.filter((k, i) => rawOrder.indexOf(k) === i);
    // Keep divider+text enforced for backwards compatibility and consistent UX
    // (important preset uses divider to allow collapse/expand of details).
    if (!order.includes('divider')) order = [...order, 'divider'];
    if (!order.includes('text')) order = [...order, 'text'];
    // Remove deprecated/duplicate keys if they exist in saved configs.
    order = order.filter((k) => !['message', 'road_name', 'road_number'].includes(k));

    const dividerIndex = order.indexOf('divider');
    const inlineKeys = dividerIndex >= 0 ? order.slice(0, dividerIndex) : order.filter((k) => k !== 'divider');
    const detailsKeys = dividerIndex >= 0 ? order.slice(dividerIndex + 1) : [];

    const inlineParts = inlineKeys
      .filter((k) => k !== 'text')
      .map((key) => metaFields[key])
      .filter((node) => !!node);
    const inlineTextBlock = inlineKeys.includes('text') ? metaFields.text : null;

    const detailsParts = detailsKeys
      .filter((k) => k !== 'text')
      .map((key) => metaFields[key])
      .filter((node) => !!node);
    const detailsTextBlock = detailsKeys.includes('text') ? metaFields.text : null;

    const key = this._alertKey(item, idx);
    const hasStored = Object.prototype.hasOwnProperty.call(this._expanded || {}, key);
    const expanded = hasStored ? !!this._expanded[key] : false;

    const expandable = (detailsParts.length > 0 || !!detailsTextBlock);
    const isCompact = !expanded && inlineParts.length === 0 && !inlineTextBlock;

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
          ${inlineParts.length > 0 ? html`<div class="meta">${inlineParts}</div>` : html``}
          ${inlineTextBlock ? html`<div class="details">${inlineTextBlock}</div>` : html``}
          ${expandable
            ? html`
                <div class="details">
                  ${expanded ? html`
                    ${detailsParts.length > 0 ? html`<div class="meta">${detailsParts}</div>` : html``}
                    ${detailsTextBlock ? html`${detailsTextBlock}` : html``}
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

  _headline(item) {
    return String(
      item?.header
      || item?.location_descriptor
      || item?.positional_description
      || this._fmtRoad(item)
      || item?.message_type
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
    if (normalized.hide_when_empty === undefined) normalized.hide_when_empty = false;
    if (normalized.max_items === undefined) normalized.max_items = 0;
    if (normalized.sort_order === undefined) normalized.sort_order = 'severity_then_time';
    if (normalized.group_by === undefined) normalized.group_by = 'none';

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
      return normalized;
    }

    if (!Array.isArray(normalized.meta_order) || normalized.meta_order.length === 0) {
      normalized.meta_order = ['road','location','severity','restriction','direction','period','divider','published','updated','link','text'];
    } else {
      if (!normalized.meta_order.includes('text')) normalized.meta_order = [...normalized.meta_order, 'text'];
      if (!normalized.meta_order.includes('divider')) normalized.meta_order = [...normalized.meta_order, 'divider'];
      // If old configs had `message` in the order, remove it (it was duplicating `text`)
      normalized.meta_order = normalized.meta_order.filter((k) => !['message', 'road_name', 'road_number'].includes(k));
    }
    // Remove deprecated toggles if present
    if (Object.prototype.hasOwnProperty.call(normalized, 'show_road_name')) delete normalized.show_road_name;
    if (Object.prototype.hasOwnProperty.call(normalized, 'show_road_number')) delete normalized.show_road_number;
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
      hide_when_empty: true,
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
      meta_order: ['road','location','severity','restriction','direction','period','divider','published','updated','link','text'],
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
      hide_when_empty: true,
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
      { name: 'show_header', label: 'Show header', selector: { boolean: {} } },
      { name: 'show_icon', label: 'Show icon', selector: { boolean: {} } },
      { name: 'severity_background', label: 'Severity background', selector: { boolean: {} } },
      { name: 'hide_when_empty', label: 'Hide when empty', selector: { boolean: {} } },
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
      show_header: this._config.show_header !== undefined ? this._config.show_header : true,
      show_icon: this._config.show_icon !== undefined ? this._config.show_icon : true,
      severity_background: this._config.severity_background !== undefined ? this._config.severity_background : false,
      hide_when_empty: this._config.hide_when_empty !== undefined ? this._config.hide_when_empty : true,
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
      : ['road','location','severity','restriction','direction','period','published','updated','link'];
    const special = (preset === 'important')
      ? ['text']
      : ['divider','text'];
    const allowedWithSpecial = [...allowed, ...special];
    const currentOrderRaw = (this._config.meta_order && Array.isArray(this._config.meta_order) && this._config.meta_order.length)
      ? this._config.meta_order.filter((k) => allowedWithSpecial.includes(k))
      : ['road','location','severity','restriction','direction','period','divider','published','updated','link','text'];
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
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next } }));
  }

  _moveMeta(key, delta) {
    const preset = String(this._config?.preset || 'accident');
    const baseKeys = (preset === 'important')
      ? ['period']
      : ['road','location','severity','restriction','direction','period','published','updated','link'];
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
      show_header: 'Show header',
      show_icon: 'Show icon',
      severity_background: 'Severity background',
      hide_when_empty: 'Hide when empty',
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


