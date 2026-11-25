import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const INTERACTIVE = 'a, button, input, select, textarea, summary, [tabindex]';

/** amd.com (and subdomains) and the current host count as internal. */
function isExternal(a) {
  const { hostname } = a;
  if (!hostname || hostname === window.location.hostname) return false;
  return !(hostname === 'amd.com' || hostname.endsWith('.amd.com'));
}

/**
 * Whole-card click: a click anywhere on a card that is not on another
 * interactive element activates the card's primary link.
 */
function activateCard(e) {
  const li = e.target.closest('li.cards-bordered-linked');
  if (!li) return;
  const hit = e.target.closest(INTERACTIVE);
  if (hit && li.contains(hit)) return;
  if (e.type === 'click' && e.button !== 0) return;
  if (e.type === 'auxclick' && e.button !== 1) return;
  // don't hijack text selection
  if (window.getSelection()?.toString()) return;
  const link = li.querySelector('a.cards-bordered-primary');
  if (!link) return;
  if (e.type === 'auxclick' || e.ctrlKey || e.metaKey || e.shiftKey) {
    window.open(link.href, '_blank', 'noopener');
  } else {
    link.click();
  }
}

/**
 * Bordered cards: one row per card, [image (may be empty), text].
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && !div.textContent.trim()) {
        div.className = 'cards-bordered-card-image';
      } else if (!div.textContent.trim() && !div.querySelector('img')) {
        // empty image cell kept for text-only cards
        div.remove();
      } else {
        div.className = 'cards-bordered-card-body';
      }
    });
    if (!li.querySelector('.cards-bordered-card-image')) li.classList.add('cards-bordered-text-only');

    // trailing standalone link paragraphs are the card CTA links (stacked)
    const body = li.querySelector('.cards-bordered-card-body');
    if (body) {
      let el = body.lastElementChild;
      const ctas = [];
      while (el && el.tagName === 'P' && el.querySelectorAll('a').length === 1
        && el.textContent.trim() === el.querySelector('a').textContent.trim()) {
        ctas.unshift(el);
        el = el.previousElementSibling;
      }
      if (ctas.length && body.children.length > ctas.length) {
        ctas.forEach((p) => p.classList.add('cards-bordered-cta'));
        // heading + link list, no description paragraph
        if (!body.querySelector(':scope > p:not(.cards-bordered-cta)')) {
          li.classList.add('cards-bordered-links-only');
        }
      }
    }
    const ctaLinks = [...li.querySelectorAll('.cards-bordered-cta a[href]')];
    const singleCta = ctaLinks.length === 1 ? ctaLinks[0] : null;

    // as on source: only cards whose single CTA is external open in a new tab
    // (title + CTA); the external CTA gets the external-link icon.
    // Link-list cards (several CTAs) keep plain chevron links.
    if (singleCta && isExternal(singleCta)) {
      singleCta.classList.add('cards-bordered-external');
      li.querySelectorAll('a[href]').forEach((a) => {
        a.target = '_blank';
        a.rel = 'noopener';
      });
    }

    // primary link: title link, else the CTA link when it is the only one
    // (cards listing several links are not clickable as a whole on source)
    const primary = li.querySelector('h1 a[href], h2 a[href], h3 a[href], h4 a[href], h5 a[href], h6 a[href]')
      || singleCta;
    if (primary) {
      primary.classList.add('cards-bordered-primary');
      li.classList.add('cards-bordered-linked');
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  const count = ul.children.length;
  block.classList.add(`cards-bordered-${Math.min(Math.max(count, 1), 4)}-up`);
  if (count === 3 || count % 3 === 0) block.classList.add('cards-bordered-thirds');
  block.textContent = '';
  block.append(ul);
  block.addEventListener('click', activateCard);
  block.addEventListener('auxclick', activateCard);
}
