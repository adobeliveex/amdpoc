/**
 * Columns download: fixed side-by-side download panels.
 * One row, one cell per panel (heading, subheadline, description, download button).
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-download-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-download-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-download-col');

      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-download-img-col');
        }
      }

      // standalone link paragraphs (decorated as buttons) become the download action
      col.querySelectorAll('.button-container').forEach((container) => {
        container.classList.add('columns-download-action');
        const link = container.querySelector('a');
        if (link) {
          link.classList.add('columns-download-button');
          if (!link.querySelector('.columns-download-icon')) {
            const icon = document.createElement('span');
            icon.className = 'columns-download-icon';
            icon.setAttribute('aria-hidden', 'true');
            link.append(icon);
          }
        }
      });
    });
  });
}
