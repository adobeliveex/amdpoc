/* eslint-disable */
/* global WebImporter */

/**
 * Parser for note variant (shared fragment).
 * Source: https://www.amd.com/en/support/downloads/drivers.html/graphics/radeon-ai-pro/radeon-ai-pro-r9000-series/amd-radeon-ai-pro-r9600d.html
 * Selector: #amd_support_driver_list .drivers .cmp-toast
 *
 * The OS-update info note is shared across driver product pages, so it is
 * authored once as a fragment:
 *   1. a `note (information)` block (model: note -> text richtext; classes = information)
 *      is built in a new fragment element and pushed onto params.fragments
 *      with path FRAGMENT_PATH (the import script returns params.fragments after the page);
 *   2. the source element is replaced in the page by a Fragment block
 *      (model: fragment -> reference) linking to FRAGMENT_PATH.
 */
const FRAGMENT_PATH = '/en/support/downloads/drivers/fragments/os-update-note';

const clean = (s) => (s || '').replace(/[​‌‍﻿]/g, '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document, params }) {
  // note type from the source modifier class (toast-information -> information)
  const container = element.querySelector('.cmp-toast--container') || element;
  const typeClass = [...container.classList].find((c) => c.startsWith('toast-'));
  const type = (typeClass && typeClass.replace(/^toast-/, '')) || 'information';
  const variant = ['information'].includes(type) ? type : 'information';

  // note text: paragraphs of the toast text area
  const textSource = element.querySelector('.cmp-toast--text') || element;
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  const paragraphs = [...textSource.querySelectorAll('p')].filter((p) => clean(p.textContent));
  if (paragraphs.length) {
    paragraphs.forEach((p) => {
      const np = document.createElement('p');
      np.innerHTML = p.innerHTML.trim();
      textFrag.appendChild(np);
    });
  } else if (clean(textSource.textContent)) {
    const np = document.createElement('p');
    np.textContent = clean(textSource.textContent);
    textFrag.appendChild(np);
  }

  // 1. fragment document holding the note block
  const noteBlock = WebImporter.Blocks.createBlock(document, {
    name: `note (${variant})`,
    cells: [[textFrag]],
  });
  const fragmentMain = document.createElement('div');
  fragmentMain.appendChild(noteBlock);
  if (params && Array.isArray(params.fragments)) {
    if (!params.fragments.some((f) => f.path === FRAGMENT_PATH)) {
      params.fragments.push({ element: fragmentMain, path: FRAGMENT_PATH });
    }
  }

  // 2. page: Fragment block referencing the shared fragment
  const refFrag = document.createDocumentFragment();
  refFrag.appendChild(document.createComment(' field:reference '));
  const link = document.createElement('a');
  link.href = FRAGMENT_PATH;
  link.textContent = FRAGMENT_PATH;
  refFrag.appendChild(link);
  const block = WebImporter.Blocks.createBlock(document, { name: 'fragment', cells: [[refFrag]] });
  element.replaceWith(block);
}
