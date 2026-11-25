// mobile layout (accordion columns) below this width
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the footer fragment. Metadata-independent: /content first (local preview),
 * then the site root (Document Authoring / Edge Delivery).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // fragment image paths are relative to the fragment itself, not to the current page
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

/** Links to other sites and file downloads open in a new tab, as on the source. */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    const external = url.origin !== window.location.origin && !/(^|\.)amd\.com$/.test(url.hostname);
    if (external || /\.pdf$/i.test(url.pathname)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

function closeMenus(root, except) {
  root.querySelectorAll('.footer-social-toggle[aria-expanded="true"]').forEach((btn) => {
    if (btn !== except) btn.setAttribute('aria-expanded', 'false');
  });
}

/** Top band: CTA link + social icons (icons with a nested list open an account menu). */
function buildTopBand(section) {
  section.className = 'footer-top';
  const cta = section.querySelector(':scope > p > a');
  if (cta) {
    cta.classList.add('footer-cta');
    cta.parentElement.classList.add('footer-cta-wrapper');
  }
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  list.className = 'footer-social';
  [...list.children].forEach((li, i) => {
    li.className = 'footer-social-item';
    const menu = li.querySelector(':scope > ul');
    const iconP = li.querySelector(':scope > p');
    if (!menu || !iconP) return;
    const img = iconP.querySelector('img');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'footer-social-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', img?.alt || `Social ${i + 1}`);
    const menuId = `footer-social-menu-${i}`;
    btn.setAttribute('aria-controls', menuId);
    if (img) btn.append(img);
    iconP.replaceWith(btn);
    menu.className = 'footer-social-menu';
    menu.id = menuId;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeMenus(list, btn);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  list.querySelectorAll(':scope > li > a').forEach((a) => {
    a.classList.add('footer-social-link');
    a.setAttribute('aria-label', a.querySelector('img')?.alt || a.textContent.trim());
  });
}

/** Link columns: each heading + following list becomes a column (accordion on mobile). */
function buildColumns(section) {
  section.className = 'footer-links';
  const grid = document.createElement('div');
  grid.className = 'footer-columns';
  [...section.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')].forEach((heading, i) => {
    const list = heading.nextElementSibling?.tagName === 'UL' ? heading.nextElementSibling : null;
    const col = document.createElement('div');
    col.className = 'footer-column';
    const title = document.createElement(heading.tagName);
    title.className = 'footer-column-title';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'footer-column-toggle';
    toggle.textContent = heading.textContent.trim();
    toggle.setAttribute('aria-expanded', 'false');
    if (list) {
      list.id = `footer-column-${i}`;
      list.className = 'footer-column-links';
      toggle.setAttribute('aria-controls', list.id);
    }
    toggle.addEventListener('click', () => {
      if (isDesktop.matches) return;
      toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
    });
    title.append(toggle);
    col.append(title);
    if (list) col.append(list);
    heading.remove();
    grid.append(col);
  });
  section.append(grid);
}

function buildLegal(section) {
  section.className = 'footer-legal';
  const list = section.querySelector(':scope > ul');
  if (list) list.className = 'footer-legal-links';
  const copy = section.querySelector(':scope > p');
  if (copy) copy.className = 'footer-copyright';
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  if (sections[0]) buildTopBand(sections[0]);
  if (sections[1]) buildColumns(sections[1]);
  if (sections[2]) buildLegal(sections[2]);
  sections.forEach((s) => footer.append(s));
  decorateExternalLinks(footer);

  document.addEventListener('click', (e) => {
    if (!footer.contains(e.target)) closeMenus(footer);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus(footer);
  });
  isDesktop.addEventListener('change', () => {
    closeMenus(footer);
    footer.querySelectorAll('.footer-column-toggle').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });

  block.append(footer);
}
