/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-download variant. Base: columns.
 * Source: https://www.amd.com/en/support/download/drivers.html
 * Selector: .columns.parbase.amd-flex-align-stretch:has(> .row > .col-md-6 + .col-md-5)
 * Structure: one row, one cell per panel. Each cell = H2, subheadline paragraph,
 * description paragraph (with inline "Learn more" link), download button link (own paragraph).
 * xwalk: Columns blocks take no field hints.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const columns = Array.from(element.querySelectorAll(':scope > .row > div'));

  const row = columns.map((col) => {
    const cellContent = [];

    // Text component: heading, subheadline, description (inline links preserved)
    const text = col.querySelector('.cmp-text');
    if (text) {
      Array.from(text.children).forEach((child) => {
        const tag = child.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          const h = document.createElement(tag);
          h.textContent = clean(child.textContent);
          if (h.textContent) cellContent.push(h);
        } else if (tag === 'p' || tag === 'ul' || tag === 'ol') {
          if (!clean(child.textContent)) return;
          const subheadline = tag === 'p' && child.querySelector(':scope > .subheadline');
          if (subheadline) {
            const p = document.createElement('p');
            p.textContent = clean(subheadline.textContent);
            cellContent.push(p);
          } else {
            cellContent.push(child);
          }
        }
      });
    }

    // Download button(s): standalone link paragraph -> decorated as button
    col.querySelectorAll('.button > a[href]').forEach((link) => {
      const label = clean(link.textContent);
      if (!label) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = label;
      p.appendChild(a);
      cellContent.push(p);
    });

    return cellContent.length ? cellContent : '';
  });

  const cells = row.length ? [row] : [];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-download', cells });
  element.replaceWith(block);
}
