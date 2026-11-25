/* eslint-disable */
/* global WebImporter */

/**
 * AMD site cleanup transformer.
 * Removes non-authorable chrome (global header/footer, consent, widgets, modals)
 * captured from https://www.amd.com/en/developer.html.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

function isEmptyElement(el) {
  return !el.textContent.trim()
    && !el.querySelector('img, picture, video, iframe, a[href], table, hr');
}

// Heading id the importer generates (e.g. "AI & HPC Development" -> "ai--hpc-development")
function headingSlug(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// "On this page" links point at AMD container ids that do not survive the import:
// retarget them to the id of the first heading inside the target.
function retargetAnchorLinks(element) {
  const doc = element.ownerDocument;
  element.querySelectorAll('.anchorBar a[href^="#"]').forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = doc.getElementById(id);
    if (!target || /^H[1-6]$/.test(target.tagName)) return;
    const heading = target.querySelector('h1, h2, h3, h4, h5, h6');
    const slug = heading && headingSlug(heading.textContent);
    if (slug) a.setAttribute('href', `#${slug}`);
  });
}

// Default-content AMD button components -> opt-in EDS buttons:
// solid (btn-Solid-Black / btn-Primary-Black) => <strong><a>, other button styles => <em><a>.
// Buttons inside block instances are left to the block parsers.
function markDefaultContentButtons(element, payload) {
  const doc = element.ownerDocument;
  const instances = ((payload && payload.template && payload.template.blocks) || [])
    .flatMap((b) => b.instances || []);
  element.querySelectorAll('.button.btn a[href], .btn.button a[href]').forEach((a) => {
    if (a.closest('strong, em')) return;
    const inBlock = instances.some((sel) => { try { return !!a.closest(sel); } catch (e) { return false; } });
    if (inBlock) return;
    const wrapper = a.closest('.button.btn');
    const solid = /btn-(Solid|Primary)-Black/.test(wrapper.className);
    const mark = doc.createElement(solid ? 'strong' : 'em');
    a.replaceWith(mark);
    mark.append(a);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    retargetAnchorLinks(element);
    markDefaultContentButtons(element, payload);
    removeAll(element, [
      // Global header experience fragment (+ by structural selector from analysis)
      '#container-6d64022eea > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)',
      '.cmp-experiencefragment--header',
      // Global footer
      '#footer-8f9eca7dc1',
      '.cmp-experiencefragment--footer',
      // Empty hello bar + skip link
      '.helloBar',
      '#skipToMain',
      // OneTrust cookie banner / preference center
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '.onetrust-pc-dark-filter',
      // AI DevDay popup modal (experience fragment) + backdrop
      '.cmp-experiencefragment--ai-dev-day-world-tour-26',
      '#dev-day-26',
      '.customModal',
      '.modal-backdrop',
      // Video modal templates
      '#youtube-embed-modal',
      '#html5-video-embed-modal',
      // Feedback widget
      '.feedback.text',
      '#feedback-container',
      '.feedback-button-wrapper',
      'amd-modal.amd-modal-feedback',
      // UserWay accessibility widget, skip-links bar and reading guides
      '.uw-sl',
      '.uwy',
      '.userway_buttons_wrapper',
      '[class*="uw-s10-"]',
      '.uw-s12-tooltip',
      // Ask AMD chatbot widget
      '.chatbot',
      '.chatbot-container',
    ]);

    // Anchor bar: drop the "More" dropdown when its menu is empty
    // Product specs "Expand All / Collapse All" control — the accordion-specs block builds its own button
    element.querySelectorAll('.product-specifications > button.expansion-toggle').forEach((b) => b.remove());

    // Anchor bar: icon-only mobile menu toggle (no href, no text) — the EDS anchor bar builds its own toggle
    element.querySelectorAll('.anchorBar a.anchor-bar-toggle:not([href])').forEach((a) => a.remove());

    element.querySelectorAll('.anchorBar li.anchor-bar-more').forEach((li) => {
      const menu = li.querySelector('.anchor-bar-more-menu');
      if (!menu || !menu.querySelector('li, a')) li.remove();
    });

    // Decorative "weave" background behind the developer-tools band (styling, not content)
    element.querySelectorAll('.fixed-parallax > .cmp-container > .cmp-container__image').forEach((el) => el.remove());

    // Decorative gradient divider images (e.g. pearl-to-white / white-pearl strips between
    // sections). Matched by DAM path so real content images are never affected; the whole
    // AEM image component is removed so no empty wrapper is left behind.
    element.querySelectorAll('img, source').forEach((node) => {
      const urls = [node.getAttribute('src'), node.getAttribute('srcset'), node.getAttribute('data-src')]
        .filter(Boolean).join(' ');
      if (!/\/backgrounds\/dividers\/|gradient-divider\./i.test(urls)) return;
      const component = node.closest('.image.aem-GridColumn') || node.closest('.cmp-image') || node.closest('picture') || node;
      component.remove();
    });

    // Empty experience fragment wrappers (left after removals or empty on capture)
    element.querySelectorAll('.experiencefragment').forEach((xf) => {
      if (isEmptyElement(xf)) xf.remove();
    });

    // Hidden, empty runtime placeholder div appended to <body> (style="display: none")
    element.querySelectorAll(':scope > div[style*="display: none"]').forEach((el) => {
      if (isEmptyElement(el)) el.remove();
    });
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      'header',
      'footer',
      'noindex',
      'script',
      'style',
      'noscript',
      'link',
      'template',
      'iframe.uwif',
      'iframe.ot-text-resize',
      'iframe.amd-feedback-iframe',
    ]);

    // Empty spacer divider components (div.divider). Removed after parsing so that
    // nth-child-based section/block selectors still see the original sibling order.
    element.querySelectorAll('div.divider').forEach((el) => {
      if (el.isConnected && isEmptyElement(el)) el.remove();
    });

    // Empty page-level content-wrapper containers (e.g. the two empty parsys slots around
    // .support-details on product driver pages). Removed after parsing for the same
    // nth-child reason as dividers; non-empty wrappers (developer/download content) stay.
    element.querySelectorAll('.container-parsys.content-wrapper').forEach((el) => {
      if (el.isConnected && isEmptyElement(el)) el.remove();
    });

    // Strip tracking / runtime attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-cmp-') || n.startsWith('data-bs-') || n.startsWith('on')
          || n === 'data-and-label' || n === 'data-function') {
          el.removeAttribute(n);
        }
      });
    });
  }
}
