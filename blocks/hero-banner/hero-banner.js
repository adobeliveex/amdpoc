import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * A list placed before the H1 whose items are links, except optionally the
 * last one (the current page), is rendered as a breadcrumb trail.
 * @param {Element} contentRow
 */
function decorateBreadcrumb(contentRow) {
  const h1 = contentRow.querySelector('h1');
  if (!h1) return;
  const list = [...contentRow.querySelectorAll('ul, ol')].find((el) => {
    // eslint-disable-next-line no-bitwise
    if (!(el.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
    const items = [...el.children];
    if (items.length < 2) return false;
    return items.every((li, i) => {
      const links = li.querySelectorAll('a');
      if (i === items.length - 1 && !links.length) return li.textContent.trim() !== '';
      return links.length === 1 && li.textContent.trim() === links[0].textContent.trim();
    });
  });
  if (!list) return;

  const nav = document.createElement('nav');
  nav.className = 'hero-banner-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  list.replaceWith(nav);
  nav.append(list);

  const items = [...list.children];
  const last = items[items.length - 1];
  if (!last.querySelector('a')) last.setAttribute('aria-current', 'page');

  // first crumb shows a home icon; its text stays available to assistive tech
  const home = items[0].querySelector('a');
  home.classList.add('hero-banner-breadcrumb-home');
  const label = document.createElement('span');
  label.className = 'hero-banner-sr-only';
  label.append(...home.childNodes);
  home.append(label);
}

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
    decorateBreadcrumb(contentRow);
    // a title-only text cell (optionally led by a breadcrumb trail) renders the
    // compact banner; any supporting copy or CTA keeps the tall expressive look
    const hasCopy = [...contentRow.querySelectorAll('p, ul, ol')]
      .some((el) => !el.closest('.hero-banner-breadcrumb') && el.textContent.trim());
    if (!hasCopy) block.classList.add('hero-banner-compact');
    contentRow.querySelectorAll('a').forEach((a) => {
      const p = a.closest('p');
      if (p && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('button-container');
      }
    });
  }
}
