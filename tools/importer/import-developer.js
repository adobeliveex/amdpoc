/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import cardsBorderedParser from './parsers/cards-bordered.js';
import columnsLinkListsParser from './parsers/columns-link-lists.js';
import cleanupTransformer from './transformers/amd-cleanup.js';
import sectionsTransformer from './transformers/amd-sections.js';

const PAGE_TEMPLATE = {
  "name": "developer",
  "urls": [
    "https://www.amd.com/en/developer.html"
  ],
  "representativeUrl": "https://www.amd.com/en/developer.html",
  "description": "AMD Developer Central landing page: hero banner, anchor bar, card grids of developer tools, documentation link lists, educational resources and sign-up CTA.",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".cmp-container:has(> .cmp-container__content.bkgGradient)"
      ]
    },
    {
      "name": "cards-bordered",
      "instances": [
        ".columns.parbase.amd-flex-align-stretch"
      ]
    },
    {
      "name": "columns-link-lists",
      "instances": [
        ".columns.parbase.amd-vertical-border-light"
      ]
    }
  ],
  "urlPattern": "/en/*",
  "sections": [
    {
      "id": "s1",
      "name": "hero",
      "selector": [
        ".cmp-container:has(> .cmp-container__content.bkgGradient)",
        "#container-af58655440"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "s2",
      "name": "anchor-bar",
      "selector": [
        ".anchorBar"
      ],
      "style": "dark-gradient",
      "blocks": [],
      "defaultContent": [
        ".anchorBar nav.navbar"
      ]
    },
    {
      "id": "s3",
      "name": "developer-tools-intro",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(1)",
        "#container-405663470e"
      ],
      "style": "centered, weave",
      "blocks": [],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(1) .cmp-text"
      ]
    },
    {
      "id": "s4",
      "name": "ai-hpc-development",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(-n+3)"
      ],
      "style": "weave",
      "blocks": [
        "cards-bordered"
      ],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(1) h3"
      ]
    },
    {
      "id": "s5",
      "name": "gaming-graphics",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(5)"
      ],
      "style": "split, weave",
      "blocks": [
        "cards-bordered"
      ],
      "defaultContent": [
        "#container-628a75a922 .cmp-text h3",
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(5) .order-first.col-md-4"
      ]
    },
    {
      "id": "s6",
      "name": "adaptive-soc-fpga",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(7)"
      ],
      "style": "split-reverse, weave",
      "blocks": [
        "cards-bordered"
      ],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(2) .container-padding-none .container-lg > .aem-Grid > div:nth-child(7) .col-md-5",
        "#container-6d9f81bf77 .cmp-text h3"
      ]
    },
    {
      "id": "s7",
      "name": "technical-documentation",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(3)",
        "#container-0c8cad2443"
      ],
      "style": "weave",
      "blocks": [
        "columns-link-lists"
      ],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(3) .col-md-8 .cmp-text"
      ]
    },
    {
      "id": "s8",
      "name": "educational-resources",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(4)",
        "#container-81e8bc4012"
      ],
      "style": "weave",
      "blocks": [
        "cards-bordered"
      ],
      "defaultContent": [
        "#educational-resources"
      ]
    },
    {
      "id": "s9",
      "name": "developer-social-channels",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(5)",
        "#container-049bc227c1"
      ],
      "style": "centered, weave",
      "blocks": [],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(5) > .cmp-container > .cmp-container__content"
      ]
    },
    {
      "id": "s10",
      "name": "developer-news",
      "selector": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(6)",
        "#container-b54a7fd261"
      ],
      "style": "centered, weave",
      "blocks": [],
      "defaultContent": [
        ".fixed-parallax > .cmp-container > .cmp-container__content > .aem-Grid > .container-parsys:nth-child(6) > .cmp-container > .cmp-container__content"
      ]
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'cards-bordered': cardsBorderedParser,
  'columns-link-lists': columnsLinkListsParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [];
const transformers = [cleanupTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
