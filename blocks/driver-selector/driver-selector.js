/**
 * Driver selector: product search with autocomplete plus a cascading
 * "browse products" selector driven by a JSON product tree.
 *
 * Authored content (cells read in document order, so it works both as one
 * field per row (Universal Editor) and as grouped multi-cell rows):
 *  1 data source link   (default /data/amd-driver-products.json)
 *  2 search placeholder
 *  3 search button label
 *  4-7 level labels      (Browse Products, Product Family, Product Line, Product Model)
 *  8 submit label
 *  9 validation message
 *
 * Data schema: { categories: [{ title, url?, items: [...] }], products: [{ title, url }] }
 * @param {Element} block
 */

const DEFAULTS = {
  dataSource: '/data/amd-driver-products.json',
  searchPlaceholder: 'Search for your AMD product',
  searchLabel: 'Search',
  levelLabels: ['Browse Products', 'Product Family', 'Product Line', 'Product Model'],
  submitLabel: 'Submit',
  validationMessage: 'Please select a valid product from the list',
  loadError: 'The product list could not be loaded. Please try again later.',
  placeholderOption: '-- Please Select --',
};

const LISTBOX_SIZE = 8;
const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];

const dataCache = new Map();
let instanceCount = 0;

function loadData(url) {
  if (!dataCache.has(url)) {
    const promise = fetch(url)
      .then((resp) => {
        if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
        return resp.json();
      })
      .then((json) => ({
        categories: Array.isArray(json?.categories) ? json.categories : [],
        products: Array.isArray(json?.products) ? json.products : [],
      }))
      .catch((err) => {
        dataCache.delete(url); // allow a retry on the next interaction
        throw err;
      });
    dataCache.set(url, promise);
  }
  return dataCache.get(url);
}

function normalize(text) {
  return (text || '')
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function readCell(cell) {
  const link = cell.querySelector('a[href]');
  if (link) return { text: link.textContent.trim(), href: link.getAttribute('href') };
  return { text: cell.textContent.trim(), href: '' };
}

function readConfig(block) {
  const cells = [...block.children].flatMap((row) => {
    const cols = [...row.children];
    return cols.length ? cols : [row];
  });
  const values = cells.map(readCell);
  const text = (i, fallback) => values[i]?.text || fallback;

  const source = values[0];
  let dataSource = source?.href || source?.text || DEFAULTS.dataSource;
  if (!/^(https?:)?\/|^\.{0,2}\//.test(dataSource)) dataSource = DEFAULTS.dataSource;

  return {
    dataSource,
    searchPlaceholder: text(1, DEFAULTS.searchPlaceholder),
    searchLabel: text(2, DEFAULTS.searchLabel),
    levelLabels: DEFAULTS.levelLabels.map((label, i) => text(3 + i, label)),
    submitLabel: text(7, DEFAULTS.submitLabel),
    validationMessage: text(8, DEFAULTS.validationMessage),
  };
}

function isLeaf(node) {
  return !!node?.url && !(Array.isArray(node.items) && node.items.length);
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  });
  node.append(...children);
  return node;
}

function navigate(url) {
  if (url) window.location.assign(url);
}

export default function decorate(block) {
  instanceCount += 1;
  const uid = `driver-selector-${instanceCount}`;
  const config = readConfig(block);

  // alert
  const alertText = el('span', { class: 'driver-selector-alert-text' });
  const alert = el(
    'div',
    { class: 'driver-selector-alert', role: 'alert', hidden: true },
    el('span', { class: 'driver-selector-alert-icon', 'aria-hidden': 'true' }),
    alertText,
  );
  const showAlert = (message) => {
    alertText.textContent = message;
    alert.hidden = false;
  };
  const hideAlert = () => { alert.hidden = true; };

  // search row
  const listId = `${uid}-products`;
  const input = el('input', {
    type: 'text',
    id: `${uid}-search`,
    class: 'driver-selector-search-input',
    placeholder: config.searchPlaceholder,
    'aria-label': config.searchPlaceholder,
    list: listId,
    autocomplete: 'off',
  });
  const datalist = el('datalist', { id: listId });
  const searchButton = el('button', { type: 'submit', class: 'driver-selector-search-button' }, config.searchLabel);
  const searchForm = el(
    'form',
    { class: 'driver-selector-search', role: 'search' },
    el(
      'div',
      { class: 'driver-selector-search-field' },
      el('span', { class: 'driver-selector-search-icon', 'aria-hidden': 'true' }),
      input,
      datalist,
    ),
    searchButton,
  );

  // browse
  const levels = el('div', { class: 'driver-selector-levels' });
  const submitButton = el('button', { type: 'button', class: 'driver-selector-submit', hidden: true }, config.submitLabel);
  const browse = el('div', { class: 'driver-selector-browse' }, levels, submitButton);

  block.replaceChildren(alert, searchForm, browse);

  let data = null;
  let selectedLeaf = null;

  const ensureData = () => loadData(config.dataSource).then((loaded) => {
    if (!data) {
      data = loaded;
      // eslint-disable-next-line no-use-before-define
      populateLevel(levels.firstElementChild, data.categories);
      const frag = document.createDocumentFragment();
      data.products.forEach((p) => { if (p?.title) frag.append(el('option', { value: p.title })); });
      datalist.replaceChildren(frag);
    }
    if (block.classList.contains('driver-selector-error')) {
      block.classList.remove('driver-selector-error');
      hideAlert();
    }
    return data;
  }).catch((err) => {
    block.classList.add('driver-selector-error');
    showAlert(DEFAULTS.loadError);
    // eslint-disable-next-line no-console
    console.error(err);
    return null;
  });

  function populateLevel(level, items) {
    if (!level) return;
    const select = level.querySelector('select');
    level.items = items;
    select.replaceChildren(
      el('option', { value: '' }, DEFAULTS.placeholderOption),
      ...items.map((item, i) => el('option', { value: String(i) }, item.title || '')),
    );
    select.disabled = false;
    level.classList.remove('driver-selector-loading');
  }

  function removeLevelsAfter(level) {
    while (level.nextElementSibling) level.nextElementSibling.remove();
    selectedLeaf = null;
    submitButton.hidden = true;
  }

  function expand(select) {
    select.size = LISTBOX_SIZE;
    select.closest('.driver-selector-level').classList.remove('driver-selector-collapsed');
  }

  function collapse(select) {
    select.removeAttribute('size');
    select.closest('.driver-selector-level').classList.add('driver-selector-collapsed');
  }

  function commit(level, moveFocus) {
    const select = level.querySelector('select');
    select.dataset.pending = '';
    removeLevelsAfter(level);
    const node = select.value === '' ? null : level.items?.[Number(select.value)];
    if (!node) {
      expand(select);
      return;
    }
    collapse(select);
    if (isLeaf(node)) {
      selectedLeaf = node;
      submitButton.hidden = false;
      if (moveFocus) submitButton.focus();
      return;
    }
    if (Array.isArray(node.items) && node.items.length) {
      // eslint-disable-next-line no-use-before-define
      const next = buildLevel(Number(level.dataset.depth) + 1, node.items);
      levels.append(next);
      if (moveFocus) next.querySelector('select').focus();
    }
  }

  function buildLevel(depth, items) {
    const id = `${uid}-level-${depth}`;
    const label = config.levelLabels[Math.min(depth, config.levelLabels.length - 1)];
    const select = el('select', { id, class: 'driver-selector-select', size: LISTBOX_SIZE });
    const level = el(
      'div',
      { class: 'driver-selector-level', 'data-depth': String(depth) },
      el('label', { for: id, class: 'driver-selector-label' }, label),
      select,
    );

    if (items) {
      populateLevel(level, items);
    } else {
      select.append(el('option', { value: '' }, DEFAULTS.placeholderOption));
      level.classList.add('driver-selector-loading');
    }

    // pointer picks commit immediately; keyboard browsing commits on Enter or blur
    let keyNav = false;
    select.addEventListener('keydown', (e) => {
      if (NAV_KEYS.includes(e.key)) {
        keyNav = true;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        keyNav = false;
        commit(level, true);
      } else if (e.key === 'Escape' && select.dataset.pending) {
        keyNav = false;
        select.dataset.pending = '';
      }
    });
    select.addEventListener('change', () => {
      hideAlert();
      if (keyNav) {
        select.dataset.pending = 'true';
        keyNav = false;
        return;
      }
      commit(level, false);
    });
    select.addEventListener('blur', () => {
      if (select.dataset.pending) commit(level, false);
    });
    return level;
  }

  levels.append(buildLevel(0, null));

  // back to the initial state: top-level listbox with nothing picked, deeper levels removed
  function resetBrowse() {
    const first = levels.firstElementChild;
    if (!first) return;
    removeLevelsAfter(first);
    const select = first.querySelector('select');
    select.dataset.pending = '';
    select.selectedIndex = -1;
    expand(select);
  }

  submitButton.addEventListener('click', () => {
    if (selectedLeaf?.url) navigate(selectedLeaf.url);
  });

  input.addEventListener('input', hideAlert);
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loaded = await ensureData();
    if (!loaded) return;
    const term = normalize(input.value);
    const match = term && loaded.products.find((p) => normalize(p?.title) === term);
    if (match?.url) {
      hideAlert();
      navigate(match.url);
    } else {
      // source behaviour: keep focus where it is (the Search button) and reset the browse levels
      resetBrowse();
      showAlert(config.validationMessage);
    }
  });

  // lazy data load: when the block nears the viewport or on first interaction
  const trigger = () => { ensureData(); };
  ['focusin', 'pointerdown', 'mouseover', 'touchstart'].forEach((type) => {
    block.addEventListener(type, trigger, { once: true, passive: true });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        trigger();
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(block);
  } else {
    trigger();
  }
}
