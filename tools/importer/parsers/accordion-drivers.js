/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-drivers variant. Base: accordion.
 * Source: https://www.amd.com/en/support/downloads/drivers.html/graphics/radeon-ai-pro/radeon-ai-pro-r9000-series/amd-radeon-ai-pro-r9600d.html
 * Selector: #amd_support_driver_list .download-accordion > .accordion
 * Model (xwalk): accordion-drivers (container) -> accordion-drivers-item: summary (text), text (richtext)
 * Rows: one per OS accordion item -> [OS label | rich text body]
 * Body structure (blocks/accordion-drivers README / model description):
 *   H3 category, H4 driver name, <p><strong>Label</strong> value</p> meta lines,
 *   <p> holding only the Download link, then the Driver Details content.
 */
const ZW = /[​‌‍﻿]/g;
const clean = (s) => (s || '').replace(ZW, '').replace(/\s+/g, ' ').trim();

const INLINE = new Set(['A', 'STRONG', 'B', 'EM', 'I', 'SPAN', 'SUP', 'SUB', 'U', 'CODE', 'SMALL', 'ABBR']);
const BLOCK_KEEP = new Set(['P', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'H5', 'H6', 'PRE']);

/** Strip zero-width characters and non-content attributes under el. */
function tidy(el) {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, 4 /* SHOW_TEXT */);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => { t.textContent = t.textContent.replace(ZW, ''); });
  [el, ...el.querySelectorAll('*')].forEach((n) => {
    [...n.attributes].forEach((attr) => {
      if (!['href', 'title', 'src', 'alt'].includes(attr.name)) n.removeAttribute(attr.name);
    });
  });
}

/**
 * Normalize the Driver Details card body into a flat list of block elements:
 * wrapper divs are flattened, loose inline runs become paragraphs, empty
 * paragraphs and <br> separators are dropped.
 */
function normalizeDetails(container, document) {
  const out = [];
  let run = null;
  const flushRun = () => {
    if (run && clean(run.textContent)) out.push(run);
    run = null;
  };
  const walk = (parent) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (!clean(node.textContent)) return;
        if (!run) run = document.createElement('p');
        run.appendChild(document.createTextNode(node.textContent));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === 'BR') { flushRun(); return; }
      if (INLINE.has(tag)) {
        if (!clean(node.textContent)) return;
        if (!run) run = document.createElement('p');
        run.appendChild(node.cloneNode(true));
        return;
      }
      if (BLOCK_KEEP.has(tag)) {
        flushRun();
        if (!clean(node.textContent)) return;
        out.push(node.cloneNode(true));
        return;
      }
      // DIV and other wrappers: flatten
      flushRun();
      walk(node);
      flushRun();
    });
  };
  walk(container);
  flushRun();
  out.forEach(tidy);
  return out;
}

function labelParagraph(document, label, value) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = label;
  p.appendChild(strong);
  if (value) p.appendChild(document.createTextNode(` ${value}`));
  return p;
}

function buildDriver(article, document, nodes) {
  const name = article.querySelector('h4');
  if (name) {
    const h4 = document.createElement('h4');
    h4.textContent = clean(name.textContent);
    nodes.push(h4);
  }

  // label/value columns (Revision Number, File Size, Release Date)
  article.querySelectorAll(':scope > .row > div').forEach((col) => {
    const strong = col.querySelector(':scope > strong');
    if (!strong) return;
    const label = clean(strong.textContent);
    const value = clean([...col.childNodes]
      .filter((n) => n !== strong)
      .map((n) => n.textContent)
      .join(' '));
    if (label) nodes.push(labelParagraph(document, label, value));
  });

  // Download link (alone in its paragraph)
  const dl = article.querySelector('.button a[href], .btn a[href]');
  if (dl) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = dl.getAttribute('href');
    const visible = dl.querySelector(':scope > span') || dl;
    let text = '';
    visible.childNodes.forEach((n) => { if (n.nodeType === 3) text += n.textContent; });
    // In the rendered import DOM the visible "Download" text can be rewritten to the hidden
    // driver name (a11y remediation script); the accessible name "Download <driver>" is stable.
    const aria = clean(dl.getAttribute('aria-label') || '');
    const ariaVerb = /^download\b/i.test(aria) ? aria.split(/\s+/)[0] : '';
    a.textContent = ariaVerb || clean(text) || 'Download';
    const sup = visible.querySelector(':scope > sup');
    // the source marks the button with an asterisk pointing to the "*By clicking the Download button" EULA note
    const scope = article.closest('#amd_support_driver_list');
    const eulaNote = /\*\s*By clicking/i.test(scope ? scope.textContent : '');
    const supText = (sup && clean(sup.textContent)) || (eulaNote ? '*' : '');
    if (supText) {
      const s = document.createElement('sup');
      s.textContent = supText;
      a.appendChild(s);
    }
    p.appendChild(a);
    nodes.push(p);
  }

  // Driver Details (collapsed panel content)
  const details = article.querySelector('.collapse .card-body') || article.querySelector('.collapse');
  if (details) nodes.push(...normalizeDetails(details, document));
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll(':scope > .accordion-item').forEach((item) => {
    const button = item.querySelector(':scope > .accordion-header button');
    const label = clean(button ? button.textContent : '');
    if (!label) return;

    const summaryFrag = document.createDocumentFragment();
    summaryFrag.appendChild(document.createComment(' field:summary '));
    summaryFrag.appendChild(document.createTextNode(label));

    const nodes = [];
    const body = item.querySelector('.accordion-body') || item;
    body.querySelectorAll('.category').forEach((category) => {
      const title = category.querySelector('.category-title, h3');
      if (title && clean(title.textContent)) {
        const h3 = document.createElement('h3');
        h3.textContent = clean(title.textContent);
        nodes.push(h3);
      }
      category.querySelectorAll('article.driver-download-details').forEach((article) => {
        buildDriver(article, document, nodes);
      });
    });

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    nodes.forEach((n) => textFrag.appendChild(n));

    cells.push([summaryFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-drivers', cells });
  element.replaceWith(block);
}
