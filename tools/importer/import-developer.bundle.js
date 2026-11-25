/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-developer.js
  var import_developer_exports = {};
  __export(import_developer_exports, {
    default: () => import_developer_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const cells = [];
    const img = element.querySelector(":scope > .cmp-container__image img") || element.querySelector(".cmp-container__image img");
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(" field:image "));
      const picture = img.closest("picture");
      imageFrag.appendChild(picture || img);
    }
    cells.push([imageFrag]);
    const content = element.querySelector(".hero-content-background") || element.querySelector(".cmp-container__content");
    const textFrag = document.createDocumentFragment();
    if (content) {
      const breadcrumb = content.querySelector('.cmp-breadcrumb, nav[class*="breadcrumb"]');
      let breadcrumbList = null;
      if (breadcrumb) {
        breadcrumbList = document.createElement("ul");
        breadcrumb.querySelectorAll("a[href]").forEach((link) => {
          let label = link.textContent.replace(/\s+/g, " ").trim();
          if (!label) {
            const titled = link.querySelector("[title]");
            label = titled && titled.getAttribute("title") || link.getAttribute("aria-label") || link.getAttribute("title") || "";
          }
          if (!label) return;
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = label;
          li.appendChild(a);
          breadcrumbList.appendChild(li);
        });
        const active = breadcrumb.querySelector('.cmp-breadcrumb__item--active, [aria-current="page"]');
        const activeText = active ? active.textContent.replace(/\s+/g, " ").trim() : "";
        if (activeText && !active.querySelector("a[href]")) {
          const li = document.createElement("li");
          li.textContent = activeText;
          breadcrumbList.appendChild(li);
        }
        if (!breadcrumbList.children.length) breadcrumbList = null;
      }
      const isInBreadcrumb = (node) => !!(breadcrumb && breadcrumb.contains(node));
      const heading = content.querySelector("h1, h2");
      const subtitle = Array.from(content.querySelectorAll("p.sub-title, p.title, p")).find((p) => !isInBreadcrumb(p)) || null;
      const ctas = Array.from(content.querySelectorAll("a[href]")).filter((a) => !isInBreadcrumb(a));
      if (breadcrumbList || heading || subtitle || ctas.length) {
        textFrag.appendChild(document.createComment(" field:text "));
        if (breadcrumbList) textFrag.appendChild(breadcrumbList);
        if (heading) textFrag.appendChild(heading);
        if (subtitle) {
          const p = document.createElement("p");
          p.innerHTML = subtitle.innerHTML.trim();
          textFrag.appendChild(p);
        }
        ctas.forEach((a) => {
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = a.textContent.trim();
          p.appendChild(link);
          textFrag.appendChild(p);
        });
      }
    }
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-bordered.js
  function parse2(element, { document }) {
    const cells = [];
    const cards = Array.from(element.querySelectorAll("article.card"));
    cards.forEach((card) => {
      const imageFrag = document.createDocumentFragment();
      const img = card.querySelector(".horzimage img, .card-img-top img");
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        const picture = img.closest("picture");
        imageFrag.appendChild(picture || img);
      }
      const textFrag = document.createDocumentFragment();
      const titleEl = card.querySelector(".card-title");
      const titleLink = titleEl ? titleEl.querySelector("a.card-heading-link, a[href]") : null;
      const imageLink = card.querySelector("a.card-image-link");
      const href = titleLink && titleLink.getAttribute("href") || imageLink && imageLink.getAttribute("href") || null;
      const titleText = titleLink ? titleLink.textContent.replace(/\s+/g, " ").trim() : titleEl ? titleEl.textContent.replace(/Empty heading/g, "").replace(/\s+/g, " ").trim() : "";
      const descEl = card.querySelector(".card-text");
      const ctaLinks = Array.from(card.querySelectorAll(".card-links a[href]"));
      const textNodes = [];
      if (titleText) {
        const h = document.createElement(titleEl && /^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : "h3");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = titleText;
          h.appendChild(a);
        } else {
          h.textContent = titleText;
        }
        textNodes.push(h);
      }
      if (descEl) {
        const paras = Array.from(descEl.querySelectorAll(":scope > p, :scope > ul, :scope > ol"));
        if (paras.length) {
          paras.forEach((p) => {
            if (p.textContent.trim()) textNodes.push(p);
          });
        } else if (descEl.textContent.trim()) {
          const p = document.createElement("p");
          p.innerHTML = descEl.innerHTML.trim();
          textNodes.push(p);
        }
      }
      ctaLinks.forEach((cta) => {
        const label = cta.textContent.replace(/\s+/g, " ").trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        textNodes.push(p);
      });
      if (textNodes.length) {
        textFrag.appendChild(document.createComment(" field:text "));
        textNodes.forEach((n) => textFrag.appendChild(n));
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-bordered", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-link-lists.js
  function parse3(element, { document }) {
    const columns = Array.from(element.querySelectorAll(":scope > .row > div"));
    const row = columns.map((col) => {
      const cellContent = [];
      const heading = col.querySelector(".cmp-text h1, .cmp-text h2, .cmp-text h3, .cmp-text h4, .cmp-text h5, .cmp-text h6");
      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
        cellContent.push(h);
      }
      const links = Array.from(col.querySelectorAll(".button > a[href]"));
      if (links.length) {
        const ul = document.createElement("ul");
        links.forEach((link) => {
          const label = link.textContent.replace(/\s+/g, " ").trim();
          if (!label) return;
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = label;
          li.appendChild(a);
          ul.appendChild(li);
        });
        if (ul.children.length) cellContent.push(ul);
      }
      return cellContent.length ? cellContent : "";
    });
    const cells = row.length ? [row] : [];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-link-lists", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/amd-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function isEmptyElement(el) {
    return !el.textContent.trim() && !el.querySelector("img, picture, video, iframe, a[href], table, hr");
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, [
        // Global header experience fragment (+ by structural selector from analysis)
        "#container-6d64022eea > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)",
        ".cmp-experiencefragment--header",
        // Global footer
        "#footer-8f9eca7dc1",
        ".cmp-experiencefragment--footer",
        // Empty hello bar + skip link
        ".helloBar",
        "#skipToMain",
        // OneTrust cookie banner / preference center
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        ".onetrust-pc-dark-filter",
        // AI DevDay popup modal (experience fragment) + backdrop
        ".cmp-experiencefragment--ai-dev-day-world-tour-26",
        "#dev-day-26",
        ".customModal",
        ".modal-backdrop",
        // Video modal templates
        "#youtube-embed-modal",
        "#html5-video-embed-modal",
        // Feedback widget
        ".feedback.text",
        "#feedback-container",
        ".feedback-button-wrapper",
        "amd-modal.amd-modal-feedback",
        // UserWay accessibility widget, skip-links bar and reading guides
        ".uw-sl",
        ".uwy",
        ".userway_buttons_wrapper",
        '[class*="uw-s10-"]',
        ".uw-s12-tooltip",
        // Ask AMD chatbot widget
        ".chatbot",
        ".chatbot-container"
      ]);
      element.querySelectorAll(".anchorBar li.anchor-bar-more").forEach((li) => {
        const menu = li.querySelector(".anchor-bar-more-menu");
        if (!menu || !menu.querySelector("li, a")) li.remove();
      });
      element.querySelectorAll(".fixed-parallax > .cmp-container > .cmp-container__image").forEach((el) => el.remove());
      element.querySelectorAll("img, source").forEach((node) => {
        const urls = [node.getAttribute("src"), node.getAttribute("srcset"), node.getAttribute("data-src")].filter(Boolean).join(" ");
        if (!/\/backgrounds\/dividers\/|gradient-divider\./i.test(urls)) return;
        const component = node.closest(".image.aem-GridColumn") || node.closest(".cmp-image") || node.closest("picture") || node;
        component.remove();
      });
      element.querySelectorAll(".experiencefragment").forEach((xf) => {
        if (isEmptyElement(xf)) xf.remove();
      });
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header",
        "footer",
        "noindex",
        "script",
        "style",
        "noscript",
        "link",
        "template",
        "iframe.uwif",
        "iframe.ot-text-resize",
        "iframe.amd-feedback-iframe"
      ]);
      element.querySelectorAll("div.divider").forEach((el) => {
        if (el.isConnected && isEmptyElement(el)) el.remove();
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-cmp-") || n.startsWith("data-bs-") || n.startsWith("on") || n === "data-and-label" || n === "data-function") {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/amd-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (!el || !el.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (section.style) {
          const metadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (marker) {
            marker.after(metadata);
          } else {
            const el = findSectionElement(element, section);
            if (el) el.after(metadata);
          }
        }
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        }
      }
    }
  }

  // tools/importer/import-developer.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-banner": parse,
    "cards-bordered": parse2,
    "columns-link-lists": parse3
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [];
  var transformers = [transform, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_developer_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_developer_exports);
})();
