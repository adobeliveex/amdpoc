/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import noteParser from './parsers/note.js';
import accordionDriversParser from './parsers/accordion-drivers.js';
import accordionSpecsParser from './parsers/accordion-specs.js';
import cleanupTransformer from './transformers/amd-cleanup.js';
import sectionsTransformer from './transformers/amd-sections.js';

const PAGE_TEMPLATE = {
  "name": "driver-product",
  "urls": [
    "https://www.amd.com/en/support/downloads/drivers.html/graphics/radeon-ai-pro/radeon-ai-pro-r9000-series/amd-radeon-ai-pro-r9600d.html"
  ],
  "representativeUrl": "https://www.amd.com/en/support/downloads/drivers.html/graphics/radeon-ai-pro/radeon-ai-pro-r9000-series/amd-radeon-ai-pro-r9600d.html",
  "description": "AMD per-product driver download page (one per product model)",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".support-details > .container-parsys > .cmp-container:has(.heroExpressive)"
      ]
    },
    {
      "name": "note",
      "instances": [
        "#amd_support_driver_list .drivers .cmp-toast"
      ]
    },
    {
      "name": "accordion-drivers",
      "instances": [
        "#amd_support_driver_list .download-accordion > .accordion"
      ]
    },
    {
      "name": "accordion-specs",
      "instances": [
        "#amd_support_product_spec ul.product-specs-categories"
      ]
    }
  ],
  "urlPattern": "/en/support/downloads/drivers.html/*",
  "sections": [
    {
      "id": "s1",
      "name": "hero",
      "selector": [
        ".support-details > .container-parsys:has(.heroExpressive)"
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
        ".support-details > .anchorBar"
      ],
      "style": "dark-gradient",
      "blocks": [],
      "defaultContent": [
        ".support-details > .anchorBar nav.navbar"
      ]
    },
    {
      "id": "s3",
      "name": "drivers",
      "selector": [
        "#amd_support_driver_list"
      ],
      "style": "compact",
      "blocks": [
        "note",
        "accordion-drivers"
      ],
      "defaultContent": [
        "#drivers-heading",
        "#amd_support_driver_list .drivers > div:has(> p, > .cmp-text):not(:has(.cmp-toast))",
        "#amd_support_driver_list .drivers > div.button"
      ]
    },
    {
      "id": "s4",
      "name": "specifications",
      "selector": [
        "#amd_support_product_spec"
      ],
      "style": "compact",
      "blocks": [
        "accordion-specs"
      ],
      "defaultContent": [
        "#specifications-heading"
      ]
    },
    {
      "id": "s5",
      "name": "contact",
      "selector": [
        "#amd_support_contact"
      ],
      "style": "compact",
      "blocks": [],
      "defaultContent": [
        "#contact-heading",
        "#amd_support_contact a"
      ]
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  note: noteParser,
  'accordion-drivers': accordionDriversParser,
  'accordion-specs': accordionSpecsParser,
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

    // AMD product driver pages live under /drivers.html/<category>/...; on EDS they become
    // /drivers/<category>/... (e.g. /en/support/downloads/drivers/graphics/.../amd-radeon-ai-pro-r9600d)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\/drivers\.html\//, '/drivers/')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
