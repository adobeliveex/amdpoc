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

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
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
