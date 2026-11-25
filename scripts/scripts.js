import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function a11yLinks(main) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    let label = link.textContent;
    if (!label && link.querySelector('span.icon')) {
      const icon = link.querySelector('span.icon');
      label = icon ? icon.classList[1]?.split('-')[1] : label;
    }
    link.setAttribute('aria-label', label);
  });
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
export function decorateButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      // Opt-in buttons in default content: only **bold** (primary) or _italic_ (secondary) lone
      // links become buttons there; plain lone links stay links. Inside blocks (main > div > div)
      // lone links are still decorated, as blocks rely on it.
      const inBlock = !!a.closest('main > div > div');
      if (!a.querySelector('img')) {
        if (inBlock && up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          a.className = 'button'; // default
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'STRONG'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          a.className = 'button primary';
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'EM'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

/**
 * "On this page" anchor bars (dark-gradient sections holding a list of #links):
 * the label paragraph becomes a toggle for the collapsed (< 1200px) menu, and the
 * link of the section currently in view is marked active while scrolling.
 * @param {Element} main The main element
 */
function decorateAnchorBars(main) {
  main.querySelectorAll('.section.dark-gradient').forEach((section, i) => {
    const wrapper = section.querySelector('.default-content-wrapper');
    const list = wrapper?.querySelector(':scope > ul');
    if (!list) return;
    const links = [...list.querySelectorAll('a[href^="#"]')];
    if (!links.length) return;

    list.id = list.id || `anchor-bar-${i}`;
    const label = wrapper.querySelector(':scope > p:first-child');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'anchor-bar-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', list.id);
    toggle.textContent = label?.textContent.trim() || 'On this page';
    if (label) label.replaceWith(toggle);
    else wrapper.prepend(toggle);

    const setOpen = (open) => toggle.setAttribute('aria-expanded', String(open));
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => { if (!section.contains(e.target)) setOpen(false); });

    const targets = links
      .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
      .filter((t) => t.el);
    let ticking = false;
    const update = () => {
      ticking = false;
      const offset = section.getBoundingClientRect().bottom + 40;
      let current = null;
      targets.forEach((t) => {
        // sections still loading are hidden (no layout box): ignore them
        if (t.el.getClientRects().length && t.el.getBoundingClientRect().top <= offset) current = t;
      });
      // a last target too close to the page end to reach the bar: active at the bottom
      const last = targets[targets.length - 1];
      const atBottom = window.scrollY > 0
        && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && last && last.el.getClientRects().length
        && last.el.getBoundingClientRect().top < window.innerHeight) current = last;
      // as on the source, nothing is highlighted before the page is scrolled
      if (window.scrollY <= 0) current = null;
      targets.forEach((t) => t.a.classList.toggle('active', t === current));
    };
    const schedule = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    // re-evaluate as sections load and the page layout settles
    new ResizeObserver(schedule).observe(main);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateAnchorBars(main);
  decorateBlocks(main);
  // add aria-label to links
  a11yLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
