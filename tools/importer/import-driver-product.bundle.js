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

  // tools/importer/import-driver-product.js
  var import_driver_product_exports = {};
  __export(import_driver_product_exports, {
    default: () => import_driver_product_default
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

  // tools/importer/parsers/note.js
  var FRAGMENT_PATH = "/en/support/downloads/drivers/fragments/os-update-note";
  var clean = (s) => (s || "").replace(/[​‌‍﻿]/g, "").replace(/\s+/g, " ").trim();
  function parse2(element, { document, params }) {
    const container = element.querySelector(".cmp-toast--container") || element;
    const typeClass = [...container.classList].find((c) => c.startsWith("toast-"));
    const type = typeClass && typeClass.replace(/^toast-/, "") || "information";
    const variant = ["information"].includes(type) ? type : "information";
    const textSource = element.querySelector(".cmp-toast--text") || element;
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(" field:text "));
    const paragraphs = [...textSource.querySelectorAll("p")].filter((p) => clean(p.textContent));
    if (paragraphs.length) {
      paragraphs.forEach((p) => {
        const np = document.createElement("p");
        np.innerHTML = p.innerHTML.trim();
        textFrag.appendChild(np);
      });
    } else if (clean(textSource.textContent)) {
      const np = document.createElement("p");
      np.textContent = clean(textSource.textContent);
      textFrag.appendChild(np);
    }
    const noteBlock = WebImporter.Blocks.createBlock(document, {
      name: `note (${variant})`,
      cells: [[textFrag]]
    });
    const fragmentMain = document.createElement("div");
    fragmentMain.appendChild(noteBlock);
    if (params && Array.isArray(params.fragments)) {
      if (!params.fragments.some((f) => f.path === FRAGMENT_PATH)) {
        params.fragments.push({ element: fragmentMain, path: FRAGMENT_PATH });
      }
    }
    const refFrag = document.createDocumentFragment();
    refFrag.appendChild(document.createComment(" field:reference "));
    const link = document.createElement("a");
    link.href = FRAGMENT_PATH;
    link.textContent = FRAGMENT_PATH;
    refFrag.appendChild(link);
    const block = WebImporter.Blocks.createBlock(document, { name: "fragment", cells: [[refFrag]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-drivers.js
  var ZW = /[​‌‍﻿]/g;
  var clean2 = (s) => (s || "").replace(ZW, "").replace(/\s+/g, " ").trim();
  var INLINE = /* @__PURE__ */ new Set(["A", "STRONG", "B", "EM", "I", "SPAN", "SUP", "SUB", "U", "CODE", "SMALL", "ABBR"]);
  var BLOCK_KEEP = /* @__PURE__ */ new Set(["P", "UL", "OL", "TABLE", "BLOCKQUOTE", "H5", "H6", "PRE"]);
  function tidy(el) {
    const doc = el.ownerDocument;
    const walker = doc.createTreeWalker(
      el,
      4
      /* SHOW_TEXT */
    );
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      t.textContent = t.textContent.replace(ZW, "");
    });
    [el, ...el.querySelectorAll("*")].forEach((n) => {
      [...n.attributes].forEach((attr) => {
        if (!["href", "title", "src", "alt"].includes(attr.name)) n.removeAttribute(attr.name);
      });
    });
  }
  function normalizeDetails(container, document) {
    const out = [];
    let run = null;
    const flushRun = () => {
      if (run && clean2(run.textContent)) out.push(run);
      run = null;
    };
    const walk = (parent) => {
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === 3) {
          if (!clean2(node.textContent)) return;
          if (!run) run = document.createElement("p");
          run.appendChild(document.createTextNode(node.textContent));
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (tag === "BR") {
          flushRun();
          return;
        }
        if (INLINE.has(tag)) {
          if (!clean2(node.textContent)) return;
          if (!run) run = document.createElement("p");
          run.appendChild(node.cloneNode(true));
          return;
        }
        if (BLOCK_KEEP.has(tag)) {
          flushRun();
          if (!clean2(node.textContent)) return;
          out.push(node.cloneNode(true));
          return;
        }
        flushRun();
        walk(node);
        flushRun();
      });
    };
    walk(container);
    flushRun();
    out.forEach(tidy);
    return out;
  }
  function labelParagraph(document, label, value) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label;
    p.appendChild(strong);
    if (value) p.appendChild(document.createTextNode(` ${value}`));
    return p;
  }
  function buildDriver(article, document, nodes) {
    const name = article.querySelector("h4");
    if (name) {
      const h4 = document.createElement("h4");
      h4.textContent = clean2(name.textContent);
      nodes.push(h4);
    }
    article.querySelectorAll(":scope > .row > div").forEach((col) => {
      const strong = col.querySelector(":scope > strong");
      if (!strong) return;
      const label = clean2(strong.textContent);
      const value = clean2([...col.childNodes].filter((n) => n !== strong).map((n) => n.textContent).join(" "));
      if (label) nodes.push(labelParagraph(document, label, value));
    });
    const dl = article.querySelector(".button a[href], .btn a[href]");
    if (dl) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = dl.getAttribute("href");
      const visible = dl.querySelector(":scope > span") || dl;
      let text = "";
      visible.childNodes.forEach((n) => {
        if (n.nodeType === 3) text += n.textContent;
      });
      const aria = clean2(dl.getAttribute("aria-label") || "");
      const ariaVerb = /^download\b/i.test(aria) ? aria.split(/\s+/)[0] : "";
      a.textContent = ariaVerb || clean2(text) || "Download";
      const sup = visible.querySelector(":scope > sup");
      const scope = article.closest("#amd_support_driver_list");
      const eulaNote = /\*\s*By clicking/i.test(scope ? scope.textContent : "");
      const supText = sup && clean2(sup.textContent) || (eulaNote ? "*" : "");
      if (supText) {
        const s = document.createElement("sup");
        s.textContent = supText;
        a.appendChild(s);
      }
      p.appendChild(a);
      nodes.push(p);
    }
    const details = article.querySelector(".collapse .card-body") || article.querySelector(".collapse");
    if (details) nodes.push(...normalizeDetails(details, document));
  }
  function parse3(element, { document }) {
    const cells = [];
    element.querySelectorAll(":scope > .accordion-item").forEach((item) => {
      const button = item.querySelector(":scope > .accordion-header button");
      const label = clean2(button ? button.textContent : "");
      if (!label) return;
      const summaryFrag = document.createDocumentFragment();
      summaryFrag.appendChild(document.createComment(" field:summary "));
      summaryFrag.appendChild(document.createTextNode(label));
      const nodes = [];
      const body = item.querySelector(".accordion-body") || item;
      body.querySelectorAll(".category").forEach((category) => {
        const title = category.querySelector(".category-title, h3");
        if (title && clean2(title.textContent)) {
          const h3 = document.createElement("h3");
          h3.textContent = clean2(title.textContent);
          nodes.push(h3);
        }
        category.querySelectorAll("article.driver-download-details").forEach((article) => {
          buildDriver(article, document, nodes);
        });
      });
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      nodes.forEach((n) => textFrag.appendChild(n));
      cells.push([summaryFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-drivers", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-specs.js
  var clean3 = (s) => (s || "").replace(/[​‌‍﻿]/g, "").replace(/\s+/g, " ").trim();
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll(":scope > li > .accordion-item").forEach((item) => {
      const button = item.querySelector(":scope > .accordion-header button");
      const title = clean3(button ? button.textContent : "");
      if (!title) return;
      const summaryFrag = document.createDocumentFragment();
      summaryFrag.appendChild(document.createComment(" field:summary "));
      summaryFrag.appendChild(document.createTextNode(title));
      const list = document.createElement("ul");
      item.querySelectorAll(".accordion-body dl dt").forEach((dt) => {
        const label = clean3(dt.textContent);
        if (!label) return;
        let dd = dt.nextElementSibling;
        while (dd && dd.tagName !== "DD" && dd.tagName !== "DT") dd = dd.nextElementSibling;
        const li = document.createElement("li");
        const strong = document.createElement("strong");
        strong.textContent = label;
        li.appendChild(strong);
        if (dd && dd.tagName === "DD") {
          const links = dd.querySelectorAll("a[href]");
          if (links.length) {
            li.appendChild(document.createTextNode(" "));
            const span = document.createElement("span");
            span.innerHTML = dd.innerHTML;
            [...span.childNodes].forEach((n) => {
              if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, " ");
              li.appendChild(n);
            });
          } else {
            const value = clean3(dd.textContent).replace(/\s+,/g, ",");
            if (value) li.appendChild(document.createTextNode(` ${value}`));
          }
        }
        list.appendChild(li);
      });
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      if (list.children.length) textFrag.appendChild(list);
      cells.push([summaryFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-specs", cells });
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
  function headingSlug(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  function retargetAnchorLinks(element) {
    const doc = element.ownerDocument;
    element.querySelectorAll('.anchorBar a[href^="#"]').forEach((a) => {
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      if (!id) return;
      const target = doc.getElementById(id);
      if (!target || /^H[1-6]$/.test(target.tagName)) return;
      const heading = target.querySelector("h1, h2, h3, h4, h5, h6");
      const slug = heading && headingSlug(heading.textContent);
      if (slug) a.setAttribute("href", `#${slug}`);
    });
  }
  function markDefaultContentButtons(element, payload) {
    const doc = element.ownerDocument;
    const instances = (payload && payload.template && payload.template.blocks || []).flatMap((b) => b.instances || []);
    element.querySelectorAll(".button.btn a[href], .btn.button a[href]").forEach((a) => {
      if (a.closest("strong, em")) return;
      const inBlock = instances.some((sel) => {
        try {
          return !!a.closest(sel);
        } catch (e) {
          return false;
        }
      });
      if (inBlock) return;
      const wrapper = a.closest(".button.btn");
      const solid = /btn-(Solid|Primary)-Black/.test(wrapper.className);
      const mark = doc.createElement(solid ? "strong" : "em");
      a.replaceWith(mark);
      mark.append(a);
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      retargetAnchorLinks(element);
      markDefaultContentButtons(element, payload);
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
      element.querySelectorAll(".product-specifications > button.expansion-toggle").forEach((b) => b.remove());
      element.querySelectorAll(".anchorBar a.anchor-bar-toggle:not([href])").forEach((a) => a.remove());
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
      element.querySelectorAll(':scope > div[style*="display: none"]').forEach((el) => {
        if (isEmptyElement(el)) el.remove();
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
      element.querySelectorAll(".container-parsys.content-wrapper").forEach((el) => {
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

  // tools/importer/import-driver-product.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-banner": parse,
    note: parse2,
    "accordion-drivers": parse3,
    "accordion-specs": parse4
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
  var import_driver_product_default = {
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
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\/drivers\.html\//, "/drivers/").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_driver_product_exports);
})();
