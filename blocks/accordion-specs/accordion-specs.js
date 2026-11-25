/*
 * Accordion Specs Block
 * Multi-open accordion of specification groups with an
 * "Expand All / Collapse All" toggle. Each item body is rich text whose
 * list items / paragraphs of the form "<strong>Label</strong> value" are
 * rendered as label/value rows.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const DEFAULT_LABELS = {
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
};

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function getLeadingLabel(el) {
  const first = [...el.childNodes].find(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim()),
  );
  if (first && first.nodeType === Node.ELEMENT_NODE && ['STRONG', 'B'].includes(first.tagName)) {
    return first;
  }
  return null;
}

function buildRow(source) {
  const row = document.createElement('div');
  row.className = 'accordion-specs-row';
  const labelEl = getLeadingLabel(source);
  if (labelEl) {
    const dt = document.createElement('dt');
    dt.textContent = labelEl.textContent.trim();
    labelEl.remove();
    while (source.firstChild
      && ((source.firstChild.nodeType === Node.TEXT_NODE && !source.firstChild.textContent.trim())
        || source.firstChild.nodeName === 'BR')) {
      source.firstChild.remove();
    }
    if (source.firstChild?.nodeType === Node.TEXT_NODE) {
      source.firstChild.textContent = source.firstChild.textContent.replace(/^\s+/, '');
    }
    row.append(dt);
  } else {
    row.classList.add('accordion-specs-row-text');
  }
  const dd = document.createElement('dd');
  dd.append(...source.childNodes);
  row.append(dd);
  return row;
}

/** Convert label/value list items or paragraphs into a <dl>. */
function decorateBody(content) {
  const sources = [];
  [...content.children].forEach((el) => {
    if (el.tagName === 'UL' || el.tagName === 'OL') sources.push(...el.querySelectorAll(':scope > li'));
    else if (el.tagName === 'P') sources.push(el);
    else sources.push(null); // unknown content: keep body as authored
  });
  if (!sources.length || sources.includes(null)) return;
  if (!sources.some((s) => getLeadingLabel(s))) return;

  const dl = document.createElement('dl');
  dl.className = 'accordion-specs-list';
  sources.forEach((s) => dl.append(buildRow(s)));
  content.replaceChildren(dl);
}

function setOpen(item, open) {
  const button = item.querySelector(':scope > .accordion-specs-item-header > button');
  const panel = item.querySelector(':scope > .accordion-specs-item-body');
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
  item.classList.toggle('is-open', open);
}

function isOpen(item) {
  return item.classList.contains('is-open');
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders().catch(() => ({}));
  const labels = {
    expandAll: placeholders?.expandAll || DEFAULT_LABELS.expandAll,
    collapseAll: placeholders?.collapseAll || DEFAULT_LABELS.collapseAll,
  };

  const list = document.createElement('div');
  list.className = 'accordion-specs-items';
  const items = [];

  const toggleAll = document.createElement('button');
  toggleAll.type = 'button';
  toggleAll.className = 'accordion-specs-toggle-all';

  const updateToggleAll = () => {
    const allOpen = items.length > 0 && items.every(isOpen);
    toggleAll.textContent = allOpen ? labels.collapseAll : labels.expandAll;
    toggleAll.setAttribute('aria-expanded', String(allOpen));
  };

  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;
    if (!labelCell) return;

    const item = document.createElement('div');
    item.className = 'accordion-specs-item';
    moveInstrumentation(row, item);

    const bodyId = nextId('accordion-specs-panel');
    const buttonId = `${bodyId}-button`;

    // group titles are headings on the source (h2.accordion-header)
    const header = document.createElement('h2');
    header.className = 'accordion-specs-item-header';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = buttonId;
    button.className = 'accordion-specs-item-button';
    button.setAttribute('aria-controls', bodyId);
    const title = document.createElement('span');
    title.className = 'accordion-specs-item-title';
    const only = labelCell.children.length === 1 ? labelCell.firstElementChild : null;
    if (only && only.tagName === 'P') {
      moveInstrumentation(only, title);
      title.append(...only.childNodes);
    } else {
      moveInstrumentation(labelCell, title);
      title.append(...labelCell.childNodes);
    }
    const icon = document.createElement('span');
    icon.className = 'accordion-specs-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(title, icon);
    header.append(button);

    const body = bodyCell || document.createElement('div');
    body.className = 'accordion-specs-item-body';
    body.id = bodyId;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-labelledby', buttonId);
    decorateBody(body);

    item.append(header, body);
    row.remove();
    list.append(item);
    setOpen(item, false);
    items.push(item);

    button.addEventListener('click', () => {
      setOpen(item, !isOpen(item));
      updateToggleAll();
    });
  });

  toggleAll.setAttribute('aria-controls', items.map((item) => item.querySelector('.accordion-specs-item-body').id).join(' '));
  toggleAll.addEventListener('click', () => {
    const open = !items.every(isOpen);
    items.forEach((item) => setOpen(item, open));
    updateToggleAll();
  });
  updateToggleAll();

  const controls = document.createElement('div');
  controls.className = 'accordion-specs-controls';
  controls.append(toggleAll);
  block.replaceChildren(controls, list);

  // keyboard: arrow / Home / End move between item headers
  const buttons = items.map((item) => item.querySelector('.accordion-specs-item-button'));
  list.addEventListener('keydown', (e) => {
    const index = buttons.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (e.key === 'ArrowDown') next = buttons[(index + 1) % buttons.length];
    if (e.key === 'ArrowUp') next = buttons[(index - 1 + buttons.length) % buttons.length];
    if (e.key === 'Home') [next] = buttons;
    if (e.key === 'End') next = buttons[buttons.length - 1];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  });

  // Universal Editor: open the item that holds the selected component
  block.closest('main')?.addEventListener('aue:ui-select', (e) => {
    const resource = e.detail?.resource;
    if (!resource) return;
    const item = block.querySelector(`[data-aue-resource="${resource}"]`)?.closest('.accordion-specs-item');
    if (!item) return;
    setOpen(item, true);
    updateToggleAll();
  });
}
