/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-specs variant. Base: accordion.
 * Source: https://www.amd.com/en/support/downloads/drivers.html/graphics/radeon-ai-pro/radeon-ai-pro-r9000-series/amd-radeon-ai-pro-r9600d.html
 * Selector: #amd_support_product_spec ul.product-specs-categories
 * Model (xwalk): accordion-specs (container) -> accordion-specs-item: summary (text), text (richtext)
 * Rows: one per spec group -> [group title | <ul><li><strong>Label</strong> value</li>...</ul>]
 */
const clean = (s) => (s || '').replace(/[​‌‍﻿]/g, '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll(':scope > li > .accordion-item').forEach((item) => {
    const button = item.querySelector(':scope > .accordion-header button');
    const title = clean(button ? button.textContent : '');
    if (!title) return;

    const summaryFrag = document.createDocumentFragment();
    summaryFrag.appendChild(document.createComment(' field:summary '));
    summaryFrag.appendChild(document.createTextNode(title));

    const list = document.createElement('ul');
    item.querySelectorAll('.accordion-body dl dt').forEach((dt) => {
      const label = clean(dt.textContent);
      if (!label) return;
      let dd = dt.nextElementSibling;
      while (dd && dd.tagName !== 'DD' && dd.tagName !== 'DT') dd = dd.nextElementSibling;
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = label;
      li.appendChild(strong);
      if (dd && dd.tagName === 'DD') {
        const links = dd.querySelectorAll('a[href]');
        if (links.length) {
          // keep links inside the value
          li.appendChild(document.createTextNode(' '));
          const span = document.createElement('span');
          span.innerHTML = dd.innerHTML;
          [...span.childNodes].forEach((n) => {
            if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, ' ');
            li.appendChild(n);
          });
        } else {
          // multi-value lists render as "A , B" in source: tighten the separators
          const value = clean(dd.textContent).replace(/\s+,/g, ',');
          if (value) li.appendChild(document.createTextNode(` ${value}`));
        }
      }
      list.appendChild(li);
    });

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (list.children.length) textFrag.appendChild(list);

    cells.push([summaryFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-specs', cells });
  element.replaceWith(block);
}
