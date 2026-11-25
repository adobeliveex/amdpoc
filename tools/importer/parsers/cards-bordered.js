/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-bordered variant. Base: cards.
 * Source: https://www.amd.com/en/developer.html
 * Selector: .columns.parbase.amd-flex-align-stretch
 * Model (xwalk): container "cards-bordered" with item "cards-bordered-card"
 *   -> image (reference, imageAlt collapsed), text (richtext)
 * Each card row: [image | text]. Image cell is left empty for text-only cards.
 * Variations handled: image cards, text cards with linked titles, text cards with CTA.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each column of the bootstrap row holds one teaser article (card)
  const cards = Array.from(element.querySelectorAll('article.card'));

  cards.forEach((card) => {
    // Column 1: image
    const imageFrag = document.createDocumentFragment();
    const img = card.querySelector('.horzimage img, .card-img-top img');
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      const picture = img.closest('picture');
      imageFrag.appendChild(picture || img);
    }

    // Column 2: text (linked title, description, CTA)
    const textFrag = document.createDocumentFragment();
    const titleEl = card.querySelector('.card-title');
    const titleLink = titleEl ? titleEl.querySelector('a.card-heading-link, a[href]') : null;
    const imageLink = card.querySelector('a.card-image-link');
    const href = (titleLink && titleLink.getAttribute('href'))
      || (imageLink && imageLink.getAttribute('href'))
      || null;
    const titleText = titleLink
      ? titleLink.textContent.replace(/\s+/g, ' ').trim()
      : (titleEl ? titleEl.textContent.replace(/Empty heading/g, '').replace(/\s+/g, ' ').trim() : '');

    const descEl = card.querySelector('.card-text');
    const ctaLinks = Array.from(card.querySelectorAll('.card-links a[href]'));

    const textNodes = [];
    if (titleText) {
      const h = document.createElement(titleEl && /^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : 'h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h.appendChild(a);
      } else {
        h.textContent = titleText;
      }
      textNodes.push(h);
    }
    if (descEl) {
      const paras = Array.from(descEl.querySelectorAll(':scope > p, :scope > ul, :scope > ol'));
      if (paras.length) {
        paras.forEach((p) => { if (p.textContent.trim()) textNodes.push(p); });
      } else if (descEl.textContent.trim()) {
        const p = document.createElement('p');
        p.innerHTML = descEl.innerHTML.trim();
        textNodes.push(p);
      }
    }
    ctaLinks.forEach((cta) => {
      const label = cta.textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = label;
      p.appendChild(a);
      textNodes.push(p);
    });

    if (textNodes.length) {
      textFrag.appendChild(document.createComment(' field:text '));
      textNodes.forEach((n) => textFrag.appendChild(n));
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-bordered', cells });
  element.replaceWith(block);
}
