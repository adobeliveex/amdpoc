// breakpoint where the full horizontal header is shown (source collapses below 1200px)
const isDesktop = window.matchMedia('(width >= 1200px)');

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Fetches the nav fragment. Metadata-independent: /content first (local preview),
 * then the site root (Document Authoring / Edge Delivery).
 * @returns {Promise<HTMLElement|null>} wrapper holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // fragment image paths are relative to the fragment itself, not to the current page
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

/** Text of the first <p> (or the node itself) of a list item, ignoring nested lists. */
function labelOf(li) {
  const p = li.querySelector(':scope > p');
  return (p ? p.textContent : li.firstChild?.textContent || '').trim();
}

function closeAll(nav, except) {
  nav.querySelectorAll('[aria-expanded="true"]').forEach((btn) => {
    if (btn === except || btn.closest('.nav-hamburger')) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.closest('.nav-item, .nav-tool')?.classList.remove('is-open');
  });
  if (!nav.querySelector('.is-open')) nav.classList.remove('has-open-panel');
}

function setMenuOpen(nav, open) {
  nav.setAttribute('aria-expanded', String(open));
  const burger = nav.querySelector('.nav-hamburger button');
  if (burger) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.classList.toggle('nav-menu-open', open && !isDesktop.matches);
}

function toggleItem(nav, btn) {
  const open = btn.getAttribute('aria-expanded') !== 'true';
  // on mobile, opening an icon dropdown (account, language, search, cart) closes the menu
  if (open && btn.classList.contains('nav-tool-trigger') && !isDesktop.matches) setMenuOpen(nav, false);
  closeAll(nav, btn);
  btn.setAttribute('aria-expanded', String(open));
  btn.closest('.nav-item, .nav-tool')?.classList.toggle('is-open', open);
  nav.classList.toggle('has-open-panel', open);
}

/** Builds one megamenu column (one or more heading + link-list groups). */
function buildColumn(colLi, prevHeadingRef) {
  const col = document.createElement('div');
  col.className = 'nav-col';
  [...colLi.children].forEach((child) => {
    if (child.tagName === 'P') {
      const heading = document.createElement('h6');
      heading.className = 'nav-group-heading';
      heading.textContent = child.textContent.trim();
      // repeated identical headings (e.g. "Industries" split across columns) show once on desktop
      if (prevHeadingRef.value === heading.textContent) heading.classList.add('is-repeat');
      prevHeadingRef.value = heading.textContent;
      col.append(heading);
    } else if (child.tagName === 'UL') {
      child.className = 'nav-group-links';
      col.append(child);
    }
  });
  return col;
}

/** Builds the sidebar-tabs + column-grid megamenu panel from a top-level nav <li>. */
function buildMegamenu(itemLi) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'nav-panel-tabs';
  tabsWrap.setAttribute('role', 'tablist');
  tabsWrap.setAttribute('aria-orientation', 'vertical');
  const content = document.createElement('div');
  content.className = 'nav-panel-content';

  const tabLis = [...(itemLi.querySelector(':scope > ul')?.children || [])];
  tabLis.forEach((tabLi, i) => {
    const tabId = nextId('nav-tab');
    const panelId = `${tabId}-panel`;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'nav-tab';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', String(i === 0));
    tab.textContent = labelOf(tabLi);
    tabsWrap.append(tab);

    const tabPanel = document.createElement('div');
    tabPanel.className = 'nav-tabpanel';
    tabPanel.id = panelId;
    tabPanel.setAttribute('role', 'tabpanel');
    tabPanel.setAttribute('aria-labelledby', tabId);
    tabPanel.hidden = i !== 0;

    const mobileHeading = document.createElement('button');
    mobileHeading.type = 'button';
    mobileHeading.className = 'nav-tabpanel-toggle';
    mobileHeading.textContent = tab.textContent;
    mobileHeading.setAttribute('aria-expanded', 'false');
    tabPanel.append(mobileHeading);

    const grid = document.createElement('div');
    grid.className = 'nav-cols';
    const prevHeading = { value: '' };
    const colLis = [...(tabLi.querySelector(':scope > ul')?.children || [])];
    colLis.forEach((colLi) => grid.append(buildColumn(colLi, prevHeading)));
    // a single long list flows into columns (source "Workloads" layout)
    if (colLis.length === 1 && grid.querySelectorAll('li').length > 6) grid.classList.add('is-flow');
    tabPanel.append(grid);
    content.append(tabPanel);

    tab.addEventListener('click', () => {
      tabsWrap.querySelectorAll('.nav-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      content.querySelectorAll('.nav-tabpanel').forEach((p) => { p.hidden = p !== tabPanel; });
    });
    mobileHeading.addEventListener('click', () => {
      const open = mobileHeading.getAttribute('aria-expanded') !== 'true';
      mobileHeading.setAttribute('aria-expanded', String(open));
    });
  });

  panel.append(tabsWrap, content);
  return panel;
}

function buildSections(section, nav) {
  const wrap = document.createElement('div');
  wrap.className = 'nav-sections';
  const list = document.createElement('ul');
  list.className = 'nav-menu';
  const topLis = [...(section.querySelector('ul')?.children || [])];
  topLis.forEach((li) => {
    const item = document.createElement('li');
    item.className = 'nav-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-trigger';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<span>${labelOf(li)}</span>`;
    btn.addEventListener('click', () => toggleItem(nav, btn));
    item.append(btn, buildMegamenu(li));
    list.append(item);
  });
  wrap.append(list);
  return wrap;
}

function buildSearchPanel(li) {
  const link = li.querySelector('a');
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  const label = document.createElement('label');
  const inputId = nextId('nav-search');
  label.setAttribute('for', inputId);
  label.className = 'nav-visually-hidden';
  label.textContent = link?.textContent.trim() || 'Search';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.name = 'q';
  input.placeholder = label.textContent;
  input.autocomplete = 'off';
  form.append(label, input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || !link) return;
    window.location.href = `${link.href}#q=${encodeURIComponent(q)}`;
  });
  const panel = document.createElement('div');
  panel.className = 'nav-tool-panel nav-search-panel';
  panel.append(form);
  return panel;
}

function buildCartPanel(li, nav, btn) {
  const panel = document.createElement('div');
  panel.className = 'nav-tool-panel nav-cart-panel';
  const head = document.createElement('div');
  head.className = 'nav-cart-head';
  const ps = [...li.querySelectorAll(':scope > p')];
  const title = ps[1];
  if (title) {
    const t = document.createElement('p');
    t.className = 'nav-cart-title';
    t.textContent = title.textContent.trim();
    head.append(t);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-cart-close';
  close.setAttribute('aria-label', 'Close');
  close.addEventListener('click', () => toggleItem(nav, btn));
  head.append(close);
  const body = document.createElement('div');
  body.className = 'nav-cart-body';
  ps.slice(2).forEach((p) => body.append(p));
  li.querySelectorAll(':scope > h3').forEach((h) => body.insertBefore(h, body.children[1] || null));
  panel.append(head, body);
  return panel;
}

function buildTools(section, nav) {
  const wrap = document.createElement('div');
  wrap.className = 'nav-tools';
  const list = document.createElement('ul');
  const toolLis = [...(section.querySelector('ul')?.children || [])];
  toolLis.forEach((li, i) => {
    const tool = document.createElement('li');
    tool.className = 'nav-tool';
    const iconP = li.querySelector(':scope > p');
    const img = iconP?.querySelector('img');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-tool-trigger';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', img?.alt || `Tool ${i + 1}`);
    if (img) btn.append(img);
    const badge = iconP?.textContent.trim();
    if (badge) {
      const span = document.createElement('span');
      span.className = 'nav-tool-badge';
      span.textContent = badge;
      btn.append(span);
    }
    btn.addEventListener('click', () => toggleItem(nav, btn));
    tool.append(btn);

    const links = li.querySelector(':scope > ul');
    if (links) {
      const panel = document.createElement('div');
      panel.className = 'nav-tool-panel nav-dropdown';
      links.className = 'nav-dropdown-list';
      panel.append(links);
      tool.append(panel);
    } else if (li.querySelector('h3')) {
      tool.classList.add('nav-tool-cart');
      tool.append(buildCartPanel(li, nav, btn));
    } else if (li.querySelector(':scope > p > a')) {
      tool.classList.add('nav-tool-search');
      tool.append(buildSearchPanel(li));
      btn.addEventListener('click', () => {
        if (btn.getAttribute('aria-expanded') === 'true') tool.querySelector('input')?.focus();
      });
    }
    list.append(tool);
  });
  wrap.append(list);
  return wrap;
}

function resetForViewport(nav) {
  closeAll(nav);
  setMenuOpen(nav, false);
  nav.querySelectorAll('.nav-tabpanel-toggle').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-label', 'Main');

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => {
    const open = nav.getAttribute('aria-expanded') !== 'true';
    closeAll(nav);
    setMenuOpen(nav, open);
  });

  const brand = sections[0] || document.createElement('div');
  brand.className = 'nav-brand';
  brand.querySelectorAll('a').forEach((a) => a.setAttribute('aria-label', a.querySelector('img')?.alt || 'Home'));

  nav.append(hamburger, brand);
  if (sections[1]) nav.append(buildSections(sections[1], nav));
  if (sections[2]) nav.append(buildTools(sections[2], nav));

  // close on outside click and Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('[aria-expanded="true"].nav-trigger, [aria-expanded="true"].nav-tool-trigger');
    closeAll(nav);
    open?.focus();
  });

  // crossing the desktop breakpoint resets menus, drawers and accordions
  isDesktop.addEventListener('change', () => resetForViewport(nav));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
