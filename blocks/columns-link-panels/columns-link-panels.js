/**
 * Columns link panels: side-by-side flat panels, each a heading + stacked list of links.
 * One row, one cell per panel.
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-link-panels-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-link-panels-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-link-panels-col');
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
      col.querySelectorAll('ul, ol').forEach((list) => list.classList.add('columns-link-panels-list'));
      // plain text links, not buttons
      col.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
      col.querySelectorAll('.button-container').forEach((c) => c.classList.remove('button-container'));
    });
  });
}
