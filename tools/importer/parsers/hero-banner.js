/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner variant. Base: hero.
 * Source: https://www.amd.com/en/developer.html
 * Selector: .cmp-container:has(> .cmp-container__content.bkgGradient)
 * Model (xwalk): hero-banner -> image (reference, imageAlt collapsed), text (richtext)
 * Rows: [background image], [title + subtitle + optional CTA]
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image
  const img = element.querySelector(':scope > .cmp-container__image img')
    || element.querySelector('.cmp-container__image img');
  const imageFrag = document.createDocumentFragment();
  if (img) {
    imageFrag.appendChild(document.createComment(' field:image '));
    const picture = img.closest('picture');
    imageFrag.appendChild(picture || img);
  }
  cells.push([imageFrag]);

  // Row 2: text (heading, subtitle, CTAs)
  const content = element.querySelector('.hero-content-background')
    || element.querySelector('.cmp-container__content');
  const textFrag = document.createDocumentFragment();
  if (content) {
    const heading = content.querySelector('h1, h2');
    const subtitle = content.querySelector('p.sub-title, p.title, p');
    const ctas = Array.from(content.querySelectorAll('a[href]'));
    if (heading || subtitle || ctas.length) {
      textFrag.appendChild(document.createComment(' field:text '));
      if (heading) textFrag.appendChild(heading);
      if (subtitle) {
        const p = document.createElement('p');
        p.innerHTML = subtitle.innerHTML.trim();
        textFrag.appendChild(p);
      }
      ctas.forEach((a) => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        p.appendChild(link);
        textFrag.appendChild(p);
      });
    }
  }
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
