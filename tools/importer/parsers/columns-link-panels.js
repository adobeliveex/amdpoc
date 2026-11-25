/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-link-panels variant. Base: columns.
 * Source: https://www.amd.com/en/support/download/drivers.html
 * Selector: .columns.parbase.amd-flex-align-stretch-bg
 * Structure: one row, one cell per panel; each cell = heading + list of links.
 * xwalk: Columns blocks take no field hints.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const columns = Array.from(element.querySelectorAll(':scope > .row > div'));

  const row = columns.map((col) => {
    const cellContent = [];

    // Panel heading (keep source heading level)
    const heading = col.querySelector('.cmp-text h1, .cmp-text h2, .cmp-text h3, .cmp-text h4, .cmp-text h5, .cmp-text h6');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = clean(heading.textContent);
      if (h.textContent) cellContent.push(h);
    }

    // Links (one per paragraph in source; empty duplicate anchors skipped) -> list
    const links = Array.from(col.querySelectorAll('.cmp-text a[href]'))
      .filter((a) => !(heading && heading.contains(a)));
    const ul = document.createElement('ul');
    links.forEach((link) => {
      const label = clean(link.textContent);
      if (!label) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = label;
      li.appendChild(a);
      ul.appendChild(li);
    });
    if (ul.children.length) cellContent.push(ul);

    return cellContent.length ? cellContent : '';
  });

  const cells = row.length ? [row] : [];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-link-panels', cells });
  element.replaceWith(block);
}
