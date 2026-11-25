/*
 * Accordion Drivers Block
 * Single-open accordion of OS releases. Each item body is rich text that is
 * turned into driver cards:
 *   H3            -> category heading ("Driver", "Pro Driver")
 *   H4            -> driver card (name)
 *   <strong>Label</strong> value paragraphs -> label/value meta lines
 *   paragraph holding only a link          -> Download button
 *   everything after the download link (until next H3/H4) -> "Driver Details"
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const DEFAULT_LABELS = {
  driverDetails: 'Driver Details',
};

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** True when the element is a paragraph whose only content is one link. */
function getLoneLink(el) {
  if (!el || !['P', 'DIV'].includes(el.tagName)) return null;
  const links = el.querySelectorAll('a');
  if (links.length !== 1) return null;
  return el.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

/** Returns the leading <strong>/<b> of a paragraph if it starts the paragraph. */
function getLeadingLabel(el) {
  if (!el || el.tagName !== 'P') return null;
  const first = [...el.childNodes].find(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim()),
  );
  if (first && first.nodeType === Node.ELEMENT_NODE && ['STRONG', 'B'].includes(first.tagName)) {
    return first;
  }
  return null;
}

function buildMeta(paragraph, labelEl) {
  const item = document.createElement('div');
  item.className = 'accordion-drivers-meta-item';
  const label = document.createElement('span');
  label.className = 'accordion-drivers-meta-label';
  label.textContent = labelEl.textContent.trim();
  labelEl.remove();
  const value = document.createElement('span');
  value.className = 'accordion-drivers-meta-value';
  // drop leading <br> / whitespace between label and value
  const isGap = (n) => n && ((n.nodeType === Node.TEXT_NODE && !n.textContent.trim())
    || n.nodeName === 'BR');
  while (isGap(paragraph.firstChild)) paragraph.firstChild.remove();
  if (paragraph.firstChild?.nodeType === Node.TEXT_NODE) {
    paragraph.firstChild.textContent = paragraph.firstChild.textContent.replace(/^\s+/, '');
  }
  value.append(...paragraph.childNodes);
  item.append(label, value);
  return item;
}

function buildDownload(paragraph, link, driverName) {
  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-drivers-download';
  link.classList.add('button', 'accordion-drivers-download-button');
  link.classList.remove('primary', 'secondary');
  link.setAttribute('role', 'button');
  // accessible name "Download <driver name>"; visible text stays "Download*"
  const visible = link.textContent.trim();
  const action = visible.replace(/[*\s]+$/, '') || visible;
  if (driverName) link.setAttribute('aria-label', `${action} ${driverName}`);
  if (link.title === visible) link.removeAttribute('title');
  wrapper.append(link);
  paragraph.remove();
  return wrapper;
}

function buildDetails(nodes, labels) {
  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-drivers-details';

  const panelId = nextId('accordion-drivers-details');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'accordion-drivers-details-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panelId);
  toggle.innerHTML = '<span class="accordion-drivers-details-label"></span><span class="accordion-drivers-details-icon" aria-hidden="true"></span>';
  toggle.querySelector('.accordion-drivers-details-label').textContent = labels.driverDetails;

  const panel = document.createElement('div');
  panel.className = 'accordion-drivers-details-panel';
  panel.id = panelId;
  panel.hidden = true;
  panel.append(...nodes);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

/** Turn one H4 and its following siblings (up to next H3/H4) into a card. */
function buildCard(heading, siblings, labels) {
  const card = document.createElement('article');
  card.className = 'accordion-drivers-card';

  const name = heading;
  name.classList.add('accordion-drivers-card-name');

  const meta = document.createElement('div');
  meta.className = 'accordion-drivers-meta';
  let download = null;
  const detailNodes = [];

  siblings.forEach((el) => {
    if (!download) {
      const link = getLoneLink(el);
      if (link) {
        download = buildDownload(el, link, name.textContent.trim());
        return;
      }
      const label = getLeadingLabel(el);
      if (label) {
        meta.append(buildMeta(el, label));
        el.remove();
        return;
      }
    }
    detailNodes.push(el);
  });

  const summary = document.createElement('div');
  summary.className = 'accordion-drivers-card-summary';
  summary.append(name);
  if (meta.children.length) summary.append(meta);
  if (download) summary.append(download);
  card.append(summary);

  if (detailNodes.length) card.append(buildDetails(detailNodes, labels));
  return card;
}

/** Restructure the rich text body into category groups of driver cards. */
function decorateBody(content, labels) {
  const nodes = [...content.children];
  if (!nodes.some((n) => n.tagName === 'H4')) return; // nothing card-like, leave as authored

  const frag = document.createDocumentFragment();
  let category = null;
  let i = 0;

  const target = () => {
    if (category) return category.querySelector('.accordion-drivers-cards') || category;
    return frag;
  };

  while (i < nodes.length) {
    const el = nodes[i];
    if (el.tagName === 'H3') {
      category = document.createElement('div');
      category.className = 'accordion-drivers-category';
      el.classList.add('accordion-drivers-category-title');
      const cards = document.createElement('div');
      cards.className = 'accordion-drivers-cards';
      category.append(el, cards);
      frag.append(category);
      i += 1;
    } else if (el.tagName === 'H4') {
      const siblings = [];
      i += 1;
      while (i < nodes.length && !['H3', 'H4'].includes(nodes[i].tagName)) {
        siblings.push(nodes[i]);
        i += 1;
      }
      target().append(buildCard(el, siblings, labels));
    } else {
      // intro content before the first card of a category (or of the body)
      if (category) category.insertBefore(el, category.querySelector('.accordion-drivers-cards'));
      else frag.append(el);
      i += 1;
    }
  }
  content.replaceChildren(frag);
}

function setOpen(item, open) {
  const button = item.querySelector(':scope > .accordion-drivers-item-header > button');
  const panel = item.querySelector(':scope > .accordion-drivers-item-body');
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
  item.classList.toggle('is-open', open);
}

function bindKeyboard(block, buttons) {
  block.addEventListener('keydown', (e) => {
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
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders().catch(() => ({}));
  const labels = {
    driverDetails: placeholders?.driverDetails || DEFAULT_LABELS.driverDetails,
  };

  const items = [];
  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;
    if (!labelCell) return;

    const item = document.createElement('div');
    item.className = 'accordion-drivers-item';
    moveInstrumentation(row, item);

    const bodyId = nextId('accordion-drivers-panel');
    const buttonId = `${bodyId}-button`;

    // OS title is a heading (source: h2.accordion-header); the button stays interactive
    const header = document.createElement('h2');
    header.className = 'accordion-drivers-item-header';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = buttonId;
    button.className = 'accordion-drivers-item-button';
    button.setAttribute('aria-controls', bodyId);
    const title = document.createElement('span');
    title.className = 'accordion-drivers-item-title';
    // unwrap a single paragraph so the button holds phrasing content only
    const only = labelCell.children.length === 1 ? labelCell.firstElementChild : null;
    if (only && only.tagName === 'P') {
      moveInstrumentation(only, title);
      title.append(...only.childNodes);
    } else {
      moveInstrumentation(labelCell, title);
      title.append(...labelCell.childNodes);
    }
    const icon = document.createElement('span');
    icon.className = 'accordion-drivers-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(title, icon);
    header.append(button);

    const body = bodyCell || document.createElement('div');
    body.className = 'accordion-drivers-item-body';
    body.id = bodyId;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-labelledby', buttonId);
    decorateBody(body, labels);

    item.append(header, body);
    row.replaceWith(item);
    setOpen(item, false);
    items.push(item);

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      // single-open: close the others first
      if (open) items.forEach((other) => other !== item && setOpen(other, false));
      setOpen(item, open);
    });
  });

  bindKeyboard(block, items.map((item) => item.querySelector('.accordion-drivers-item-button')));

  // Universal Editor: open the item that holds the selected component
  block.closest('main')?.addEventListener('aue:ui-select', (e) => {
    const resource = e.detail?.resource;
    if (!resource) return;
    const selected = block.querySelector(`[data-aue-resource="${resource}"]`);
    const item = selected?.closest('.accordion-drivers-item');
    if (!item) return;
    items.forEach((other) => setOpen(other, other === item));
  });
}
