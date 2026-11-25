/* eslint-disable */
/* global WebImporter */

/**
 * Parser for driver-selector (custom block).
 * Source: https://www.amd.com/en/support/download/drivers.html
 * Selector: .driverSelector.parbase
 * Model (xwalk): driver-selector -> dataSource, searchPlaceholder, searchLabel,
 *   browseLabel, familyLabel, lineLabel, modelLabel, submitLabel, validationMessage (all text)
 * One row per field, in model order (the block reads cells in document order).
 *
 * Only the configurable labels are authored. The product tree (data-json) and the
 * 1352-option search datalist are NOT copied; the data lives in /data/amd-driver-products.json.
 * Level 2-4 labels and the Submit label are rendered by the source Vue component only after
 * user interaction, so they are absent from the markup and fall back to the observed live labels.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const DATA_SOURCE = '/data/amd-driver-products.json';

  // Search row
  const search = element.querySelector('.product-search');
  const input = search ? search.querySelector('input') : element.querySelector('input');
  const searchPlaceholder = clean(input && (input.getAttribute('placeholder') || input.getAttribute('aria-label')))
    || 'Search for your AMD product';
  const searchButton = search ? search.querySelector('button') : null;
  const searchLabel = clean(searchButton && searchButton.textContent) || 'Search';

  // Level labels: first is in the markup, deeper ones only appear after interaction
  const markupLabels = Array.from(element.querySelectorAll('.selector-row label'))
    .map((l) => clean(l.textContent))
    .filter(Boolean);
  const defaultLevels = ['Browse Products', 'Product Family', 'Product Line', 'Product Model'];
  const levels = defaultLevels.map((label, i) => markupLabels[i] || label);

  // Submit button (rendered only once the last level is chosen)
  const submitButton = Array.from(element.querySelectorAll('.selector-row button'))
    .find((b) => !(search && search.contains(b))) || null;
  const submitLabel = clean(submitButton && submitButton.textContent) || 'Submit';

  // Validation alert
  const alert = element.querySelector('.alert');
  const validationMessage = clean(alert && alert.textContent) || 'Please select a valid product from the list';

  const fields = [
    ['dataSource', DATA_SOURCE],
    ['searchPlaceholder', searchPlaceholder],
    ['searchLabel', searchLabel],
    ['browseLabel', levels[0]],
    ['familyLabel', levels[1]],
    ['lineLabel', levels[2]],
    ['modelLabel', levels[3]],
    ['submitLabel', submitLabel],
    ['validationMessage', validationMessage],
  ];

  const cells = fields.map(([name, value]) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${name} `));
    const p = document.createElement('p');
    p.textContent = value;
    frag.appendChild(p);
    return [frag];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'driver-selector', cells });
  element.replaceWith(block);
}
