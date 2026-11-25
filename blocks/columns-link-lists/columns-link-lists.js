/**
 * Columns of link lists: one row, one cell per column (small heading + links).
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-link-lists-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-link-lists-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-link-lists-col');
      // paragraphs that contain only a link become list items
      const linkParas = [...col.children].filter((el) => {
        const a = el.tagName === 'P' && el.querySelector('a');
        return a && el.textContent.trim() === a.textContent.trim();
      });
      if (linkParas.length && !col.querySelector('ul, ol')) {
        const ul = document.createElement('ul');
        linkParas[0].before(ul);
        linkParas.forEach((p) => {
          const li = document.createElement('li');
          while (p.firstChild) li.append(p.firstChild);
          ul.append(li);
          p.remove();
        });
      }
      col.querySelectorAll('ul, ol').forEach((list) => list.classList.add('columns-link-lists-list'));
      col.querySelectorAll('a').forEach((a) => a.classList.remove('button'));
      col.querySelectorAll('.button-container').forEach((c) => c.classList.remove('button-container'));
      // inner wrapper carries the content padding (source: .col > .container-fluid)
      const inner = document.createElement('div');
      inner.className = 'columns-link-lists-col-inner';
      inner.append(...col.childNodes);
      col.append(inner);
    });
  });
}
