/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-link-lists variant. Base: columns.
 * Source: https://www.amd.com/en/developer.html
 * Selector: .columns.parbase.amd-vertical-border-light
 * Structure: one row, one cell per column; each cell = small heading + list of links.
 * xwalk: Columns blocks take no field hints.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope > .row > div'));

  const row = columns.map((col) => {
    const cellContent = [];

    // Column heading (small heading inside .cmp-text)
    const heading = col.querySelector('.cmp-text h1, .cmp-text h2, .cmp-text h3, .cmp-text h4, .cmp-text h5, .cmp-text h6');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
      cellContent.push(h);
    }

    // Links from button components -> unordered list
    const links = Array.from(col.querySelectorAll('.button > a[href]'));
    if (links.length) {
      const ul = document.createElement('ul');
      links.forEach((link) => {
        const label = link.textContent.replace(/\s+/g, ' ').trim();
        if (!label) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = label;
        li.appendChild(a);
        ul.appendChild(li);
      });
      if (ul.children.length) cellContent.push(ul);
    }

    return cellContent.length ? cellContent : '';
  });

  const cells = row.length ? [row] : [];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-link-lists', cells });
  element.replaceWith(block);
}
