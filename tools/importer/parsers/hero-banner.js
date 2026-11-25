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
    // Optional breadcrumb trail above the H1 (download/support pages)
    const breadcrumb = content.querySelector('.cmp-breadcrumb, nav[class*="breadcrumb"]');
    let breadcrumbList = null;
    if (breadcrumb) {
      breadcrumbList = document.createElement('ul');
      breadcrumb.querySelectorAll('a[href]').forEach((link) => {
        let label = link.textContent.replace(/\s+/g, ' ').trim();
        if (!label) {
          // icon-only link (e.g. Home): use the icon title / aria-label
          const titled = link.querySelector('[title]');
          label = (titled && titled.getAttribute('title'))
            || link.getAttribute('aria-label')
            || link.getAttribute('title')
            || '';
        }
        if (!label) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = label;
        li.appendChild(a);
        breadcrumbList.appendChild(li);
      });
      // current page (unlinked last crumb)
      const active = breadcrumb.querySelector('.cmp-breadcrumb__item--active, [aria-current="page"]');
      const activeText = active ? active.textContent.replace(/\s+/g, ' ').trim() : '';
      if (activeText && !(active.querySelector('a[href]'))) {
        const li = document.createElement('li');
        li.textContent = activeText;
        breadcrumbList.appendChild(li);
      }
      if (!breadcrumbList.children.length) breadcrumbList = null;
    }

    const isInBreadcrumb = (node) => !!(breadcrumb && breadcrumb.contains(node));
    const heading = content.querySelector('h1, h2');
    const subtitle = Array.from(content.querySelectorAll('p.sub-title, p.title, p'))
      .find((p) => !isInBreadcrumb(p)) || null;
    const ctas = Array.from(content.querySelectorAll('a[href]')).filter((a) => !isInBreadcrumb(a));
    if (breadcrumbList || heading || subtitle || ctas.length) {
      textFrag.appendChild(document.createComment(' field:text '));
      if (breadcrumbList) textFrag.appendChild(breadcrumbList);
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
