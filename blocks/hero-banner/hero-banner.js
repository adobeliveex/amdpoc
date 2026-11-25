import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero banner: background image row + text row (H1, subheading, optional CTA).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  let mediaRow = null;
  let contentRow = null;

  rows.forEach((row) => {
    const onlyPicture = row.querySelector('picture')
      && !row.textContent.trim();
    if (onlyPicture && !mediaRow) mediaRow = row;
    else if (!contentRow && row.textContent.trim()) contentRow = row;
  });

  if (mediaRow) {
    mediaRow.classList.add('hero-banner-media');
    const img = mediaRow.querySelector('picture > img');
    if (img) {
      const url = new URL(img.src, window.location.href);
      if (url.origin === window.location.origin && !/\.svg$/i.test(url.pathname)) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        img.closest('picture').replaceWith(optimized);
      } else {
        img.loading = 'eager';
      }
    }
  } else {
    block.classList.add('hero-banner-no-image');
  }

  if (contentRow) {
    contentRow.classList.add('hero-banner-content');
    contentRow.querySelectorAll('a').forEach((a) => {
      const p = a.closest('p');
      if (p && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('button-container');
      }
    });
  }
}
