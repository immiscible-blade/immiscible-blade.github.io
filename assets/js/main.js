/* ═══════════════════════════════════════════════════════════════
   Om Dehlan — site behavior.
   Content lives in data.js; this file just renders it.
   Everything degrades gracefully without JavaScript.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── helpers ─────────────────────────────────────────────── */
  var $  = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* unavailable */ } }
  };
  var media = function (q) {
    return (window.matchMedia && matchMedia(q).matches) || false;
  };

  // Root prefix ("" at site root, "../" inside notes/), derived
  // from the nav's own home link so it is always correct.
  var ROOT = (function () {
    var home = $('.site-nav a[href$="index.html"]');
    return home ? home.getAttribute("href").replace(/index\.html$/, "") : "";
  })();

  /* ── toast ───────────────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg) {
    var t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function copyText(text, label) {
    var done = function () { toast(label || "copied"); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
        return;
      }
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand && document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch (e) { /* clipboard unavailable */ }
  }

  /* ── theme ───────────────────────────────────────────────── */
  function effectiveTheme() {
    return document.documentElement.dataset.theme ||
           (media("(prefers-color-scheme: dark)") ? "dark" : "light");
  }
  function toggleTheme() {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
    syncThemeButton();
  }
  function syncThemeButton() {
    var btn = $(".theme-toggle");
    if (!btn) return;
    var dark = effectiveTheme() === "dark";
    btn.textContent = dark ? "\u25D1" : "\u25D0";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  function initTheme() {
    var btn = $(".theme-toggle");
    if (btn) btn.addEventListener("click", toggleTheme);
    syncThemeButton();
  }

  /* ── section visibility engine ───────────────────────────────
     Resolves SECTIONS (true | false | "auto") against the data
     in data.js, then prunes nav links and hides sections. Runs
     identically on every page, so the nav is always consistent. */
  function countFor(key) {
    switch (key) {
      case "notes":        return (typeof NOTES !== "undefined" ? NOTES.length : 0);
      case "publications": return (typeof PUBLICATIONS !== "undefined" ? PUBLICATIONS.length : 0);
      case "courses":
      case "mentoring":
      case "talks":
      case "service":
        return (typeof TEACHING !== "undefined" && TEACHING[key]) ? TEACHING[key].length : 0;
      default: return 1; // static pages (research, misc) count as content
    }
  }
  function resolveSections() {
    var defaults = {
      research: true, publications: true, teaching: "auto",
      notes: "auto", misc: true,
      courses: "auto", mentoring: "auto", talks: "auto", service: "auto"
    };
    var cfg = {};
    for (var k in defaults) {
      cfg[k] = (typeof SECTIONS !== "undefined" && k in SECTIONS) ? SECTIONS[k] : defaults[k];
    }
    var r = {};
    Object.keys(cfg).forEach(function (key) {
      if (key === "teaching") return; // resolved after subsections
      var v = cfg[key];
      r[key] = (v === true) ? true : (v === false) ? false : countFor(key) > 0;
    });
    r.teaching = (cfg.teaching === true) ? true
               : (cfg.teaching === false) ? false
               : (r.courses || r.mentoring || r.talks || r.service);
    return r;
  }
  function applyVisibility(r) {
    $$("[data-nav]").forEach(function (a) {
      var k = a.dataset.nav;
      if (k in r && !r[k]) a.parentNode && a.parentNode.removeChild(a);
    });
    $$("[data-section]").forEach(function (s) {
      var k = s.dataset.section;
      if (k in r && !r[k]) s.hidden = true;
    });
    var page = document.body.dataset.page;
    if (page && page in r && !r[page]) {
      var m = $("#main");
      if (m) {
        m.innerHTML = '<section class="first"><div class="empty">This page is tucked away for now \u2014 back soon.</div>' +
                      '<p class="section-foot"><a href="' + ROOT + 'index.html">\u2190 home</a></p></section>';
      }
    }
  }

  /* ── now line ────────────────────────────────────────────── */
  function renderNow() {
    var el = $("[data-now]");
    if (!el) return;
    if (typeof NOW !== "undefined" && NOW) {
      el.innerHTML = '<span class="now-label">now</span> ' + NOW;
      el.hidden = false;
    }
  }

  /* ── news ────────────────────────────────────────────────── */
  function newsRow(n) {
    return '<li><time datetime="' + esc(n.date) + '">' + esc(n.label) +
           '</time><span class="item">' + n.html + "</span></li>";
  }
  function renderNews() {
    var el = $("[data-news]");
    if (!el || typeof NEWS === "undefined") return;
    var limit = parseInt(el.dataset.news, 10) || NEWS.length;
    var recent = NEWS.slice(0, limit);
    var older  = NEWS.slice(limit);
    el.innerHTML = recent.map(newsRow).join("");
    if (older.length) {
      var btn = document.createElement("button");
      btn.className = "news-more";
      btn.type = "button";
      btn.textContent = "+ " + older.length + " older";
      btn.addEventListener("click", function () {
        el.insertAdjacentHTML("beforeend", older.map(newsRow).join(""));
        btn.parentNode.removeChild(btn);
      });
      el.after ? el.after(btn) : el.parentNode.appendChild(btn);
    }
  }

  /* ── publications ────────────────────────────────────────── */
  function authorsHTML(p) {
    return p.authors.map(function (a) {
      var name = esc(a.name) + (a.equal ? "*" : "");
      return a.me ? '<span class="me">' + name + "</span>" : name;
    }).join(", ");
  }
  function linksHTML(p) {
    var order = ["paper", "pdf", "code", "data", "slides", "poster", "video"];
    var out = order.filter(function (k) { return p.links && p.links[k]; })
      .map(function (k) {
        return '<a href="' + esc(p.links[k]) + '" target="_blank" rel="noopener">[' + k + "]</a>";
      });
    if (p.bibtex) out.push('<a href="#" role="button" data-bib="' + esc(p.id) + '" aria-expanded="false">[bib]</a>');
    return out.join(" ");
  }
  function pubHTML(p) {
    var title = (p.links && p.links.paper)
      ? '<a href="' + esc(p.links.paper) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
      : esc(p.title);
    return '<article class="pub" id="' + esc(p.id) + '">' +
      '<span class="venue">' + esc(p.venue) + "</span>" +
      "<h3>" + title + "</h3>" +
      '<p class="authors">' + authorsHTML(p) + "</p>" +
      (p.tldr ? '<p class="tldr"><strong>tl;dr</strong> \u2014 ' + esc(p.tldr) + "</p>" : "") +
      '<p class="pub-links">' + linksHTML(p) + "</p>" +
      (p.bibtex
        ? '<div class="bib" id="bib-' + esc(p.id) + '" hidden>' +
          '<button class="bib-copy" type="button">copy</button>' +
          "<pre>" + esc(p.bibtex) + "</pre></div>"
        : "") +
      "</article>";
  }
  function renderPubLists() {
    if (typeof PUBLICATIONS === "undefined") return;
    $$("[data-pubs]").forEach(function (el) {
      var mode = el.dataset.pubs;
      if (mode === "selected") {
        el.innerHTML = PUBLICATIONS.filter(function (p) { return p.selected; }).map(pubHTML).join("");
      } else if (mode === "full") {
        renderFull(el, PUBLICATIONS.slice());
      }
    });
  }
  function renderFull(el, pubs) {
    var bar = $("[data-pub-filters]");
    var types = pubs.map(function (p) { return p.type; })
      .filter(function (t, i, a) { return a.indexOf(t) === i; });
    var active = "all";

    var draw = function () {
      var list = active === "all" ? pubs : pubs.filter(function (p) { return p.type === active; });
      if (!list.length) {
        el.innerHTML = '<div class="empty">Nothing in this category yet.</div>';
        return;
      }
      var years = list.map(function (p) { return p.year; })
        .filter(function (y, i, a) { return a.indexOf(y) === i; })
        .sort(function (a, b) { return b - a; });
      el.innerHTML = years.map(function (y) {
        return '<h2 class="pub-year">' + y + "</h2>" +
          list.filter(function (p) { return p.year === y; }).map(pubHTML).join("");
      }).join("");
    };

    // Filter chips build themselves from the types present in the
    // data — they appear automatically once a second type exists.
    if (bar && types.length > 1) {
      var mk = function (val, label) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.dataset.val = val;
        b.textContent = label;
        return b;
      };
      bar.appendChild(mk("all", "all (" + pubs.length + ")"));
      types.forEach(function (t) {
        bar.appendChild(mk(t, t + " (" + pubs.filter(function (p) { return p.type === t; }).length + ")"));
      });
      bar.firstChild.classList.add("active");
      bar.addEventListener("click", function (e) {
        var b = e.target.closest(".chip");
        if (!b) return;
        active = b.dataset.val;
        $$(".chip", bar).forEach(function (c) { c.classList.toggle("active", c === b); });
        draw();
      });
    } else if (bar) {
      bar.parentNode.removeChild(bar);
    }
    draw();
  }

  // BibTeX toggle + copy (delegated; works for future entries)
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-bib]");
    if (toggle) {
      e.preventDefault();
      var box = $("#bib-" + toggle.dataset.bib);
      if (box) {
        box.hidden = !box.hidden;
        toggle.setAttribute("aria-expanded", String(!box.hidden));
      }
      return;
    }
    var copy = e.target.closest(".bib-copy");
    if (copy) {
      var pre = $("pre", copy.parentElement);
      if (pre) copyText(pre.textContent, "BibTeX copied");
    }
  });

  /* ── teaching entries ────────────────────────────────────── */
  function entryHTML(e) {
    return '<div class="entry">' +
      (e.title ? "<h3>" + esc(e.title) + "</h3>" : "") +
      (e.meta ? '<p class="meta">' + e.meta + "</p>" : "") +
      (e.desc ? "<p>" + esc(e.desc) + "</p>" : "") +
      "</div>";
  }
  function renderTeaching() {
    if (typeof TEACHING === "undefined") return;
    $$("[data-entries]").forEach(function (el) {
      var key = el.dataset.entries;
      var list = TEACHING[key];
      if (list && list.length) el.innerHTML = list.map(entryHTML).join("");
      // empty → the authored placeholder copy in the HTML stays
    });
  }

  /* ── notes ───────────────────────────────────────────────── */
  function renderNotes() {
    var el = $("[data-notes]");
    if (!el || typeof NOTES === "undefined") return;
    if (!NOTES.length) {
      el.innerHTML = '<div class="empty">No notes yet. First drafts in progress: ' +
        "on annotating fallacies, and on what \u201Cdiverse outputs\u201D should actually mean.</div>";
      return;
    }
    el.innerHTML = NOTES.map(function (n) {
      return '<article class="note-item"><time datetime="' + esc(n.date) + '">' + esc(n.date) + "</time>" +
        '<h3><a href="' + ROOT + esc(n.href) + '">' + esc(n.title) + "</a></h3>" +
        (n.blurb ? "<p>" + esc(n.blurb) + "</p>" : "") +
        "</article>";
    }).join("");
  }

  /* ── scroll reveal ───────────────────────────────────────── */
  function initReveal() {
    if (media("(prefers-reduced-motion: reduce)")) return;
    if (!("IntersectionObserver" in window)) return;
    var targets = $$("main section, .pub, .thread, .project, .note-item, .entry");
    targets.forEach(function (t) { t.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ── command palette (press / or ⌘K) ─────────────────────── */
  var pal = { el: null, input: null, list: null, items: [], filtered: [], active: 0, lastFocus: null };

  function collectItems() {
    var items = [];
    $$(".site-nav a[href]").forEach(function (a) {
      var label = a.textContent.replace(/\s+/g, " ").trim();
      if (!label) return;
      items.push({ label: label, hint: "page", href: a.getAttribute("href") });
    });
    if (typeof PUBLICATIONS !== "undefined") {
      PUBLICATIONS.forEach(function (p) {
        items.push({ label: p.title, hint: p.venue, href: ROOT + "publications.html#" + p.id });
      });
    }
    items.push({ label: "Toggle dark mode", hint: "action", run: toggleTheme });
    var mail = $('a[href^="mailto:"]');
    if (mail) {
      var addr = mail.getAttribute("href").replace(/^mailto:/, "");
      items.push({ label: "Copy email address", hint: "action", run: function () { copyText(addr, "email copied"); } });
    }
    return items;
  }

  function paletteRender(q) {
    q = (q || "").toLowerCase();
    pal.filtered = pal.items.filter(function (i) {
      return i.label.toLowerCase().indexOf(q) !== -1 ||
             (i.hint && i.hint.toLowerCase().indexOf(q) !== -1);
    });
    if (pal.active >= pal.filtered.length) pal.active = 0;
    if (!pal.filtered.length) {
      pal.list.innerHTML = '<li class="palette-none">no matches \u2014 p(result) = 0.00</li>';
      pal.input.removeAttribute("aria-activedescendant");
      return;
    }
    pal.list.innerHTML = pal.filtered.map(function (i, idx) {
      return '<li id="pal-opt-' + idx + '" role="option" data-i="' + idx + '"' +
        (idx === pal.active ? ' class="active" aria-selected="true"' : ' aria-selected="false"') +
        ">" + esc(i.label) + "<span>" + esc(i.hint || "") + "</span></li>";
    }).join("");
    pal.input.setAttribute("aria-activedescendant", "pal-opt-" + pal.active);
    var activeEl = $("#pal-opt-" + pal.active);
    if (activeEl && activeEl.scrollIntoView) activeEl.scrollIntoView({ block: "nearest" });
  }

  function paletteRun(idx) {
    var item = pal.filtered[idx];
    if (!item) return;
    paletteClose();
    if (item.run) item.run();
    else if (item.href) window.location.href = item.href;
  }

  function paletteBuild() {
    pal.el = document.createElement("div");
    pal.el.className = "palette";
    pal.el.innerHTML =
      '<div class="palette-backdrop"></div>' +
      '<div class="palette-box" role="dialog" aria-modal="true" aria-label="Quick navigation">' +
        '<input type="text" placeholder="Jump to a page, paper, or action\u2026" ' +
               'role="combobox" aria-expanded="true" aria-label="Search pages and papers" autocomplete="off" spellcheck="false">' +
        '<ul role="listbox" aria-label="Results"></ul>' +
        '<p class="palette-hint"><kbd>\u2191\u2193</kbd> navigate \u00B7 <kbd>\u21B5</kbd> open \u00B7 <kbd>esc</kbd> close</p>' +
      "</div>";
    document.body.appendChild(pal.el);
    pal.input = $("input", pal.el);
    pal.list  = $("ul", pal.el);

    $(".palette-backdrop", pal.el).addEventListener("click", paletteClose);
    pal.input.addEventListener("input", function () { pal.active = 0; paletteRender(pal.input.value); });
    pal.input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (pal.filtered.length) { pal.active = (pal.active + 1) % pal.filtered.length; paletteRender(pal.input.value); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (pal.filtered.length) { pal.active = (pal.active - 1 + pal.filtered.length) % pal.filtered.length; paletteRender(pal.input.value); } }
      else if (e.key === "Enter") { e.preventDefault(); paletteRun(pal.active); }
      else if (e.key === "Escape") { e.preventDefault(); paletteClose(); }
    });
    pal.list.addEventListener("click", function (e) {
      var li = e.target.closest("li[data-i]");
      if (li) paletteRun(parseInt(li.dataset.i, 10));
    });
  }

  function paletteOpen() {
    if (!pal.el) paletteBuild();
    pal.items = collectItems();
    pal.lastFocus = document.activeElement;
    pal.active = 0;
    pal.input.value = "";
    paletteRender("");
    pal.el.classList.add("open");
    document.documentElement.classList.add("palette-lock");
    pal.input.focus();
  }
  function paletteClose() {
    if (!pal.el) return;
    pal.el.classList.remove("open");
    document.documentElement.classList.remove("palette-lock");
    if (pal.lastFocus && pal.lastFocus.focus) pal.lastFocus.focus();
  }
  function paletteIsOpen() {
    return !!(pal.el && pal.el.classList.contains("open"));
  }

  function initPalette() {
    document.addEventListener("keydown", function (e) {
      var typing = e.target && e.target.matches &&
                   e.target.matches("input, textarea, select, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        paletteIsOpen() ? paletteClose() : paletteOpen();
      } else if (e.key === "/" && !typing && !paletteIsOpen()) {
        e.preventDefault();
        paletteOpen();
      } else if (e.key === "Escape" && paletteIsOpen()) {
        paletteClose();
      }
    });
    $$("[data-palette-open]").forEach(function (b) {
      b.addEventListener("click", paletteOpen);
    });
  }

  /* ── footer metadata ─────────────────────────────────────── */
  /* ── hero photo rotator ──────────────────────────────────
     Activates automatically once PHOTOS has 2+ entries:
     order shuffled per visit, gentle auto-advance, click/tap
     steps through one by one (and takes over from the timer). */
  function initPhotos() {
    var box = $("[data-photos]");
    if (!box || typeof PHOTOS === "undefined" || !PHOTOS || PHOTOS.length < 2) return;

    var order = PHOTOS.slice();
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }

    var idx = 0;
    var busy = false;
    var stopped = media("(prefers-reduced-motion: reduce)");
    var timer = null;

    box.innerHTML =
      '<button type="button" class="photo-rotor" aria-label="Show next photo">' +
        '<img src="' + esc(order[0].src) + '" alt="' + esc(order[0].alt || "") + '">' +
      "</button>" +
      '<div class="photo-dots" aria-hidden="true">' +
        order.map(function (_, k) { return "<span" + (k === 0 ? ' class="active"' : "") + "></span>"; }).join("") +
      "</div>" +
      '<span class="visually-hidden" aria-live="polite"></span>';

    var img  = $(".photo-rotor img", box);
    var dots = $$(".photo-dots span", box);
    var live = $(".visually-hidden", box);

    function paint() {
      dots.forEach(function (d, k) { d.classList.toggle("active", k === idx); });
      live.textContent = "Photo " + (idx + 1) + " of " + order.length;
    }

    function advance() {
      if (busy) return;
      busy = true;
      var nextIdx = (idx + 1) % order.length;
      var pre = new Image();
      pre.onload = function () {
        img.style.opacity = "0";
        setTimeout(function () {
          idx = nextIdx;
          img.src = order[idx].src;
          img.alt = order[idx].alt || "";
          img.style.opacity = "1";
          paint();
          busy = false;
        }, 200);
      };
      pre.onerror = function () { busy = false; };
      pre.src = order[nextIdx].src;
    }

    function play() {
      if (stopped || timer) return;
      timer = setInterval(advance, 6000);
    }
    function pause() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    $(".photo-rotor", box).addEventListener("click", function () {
      stopped = true;   // manual control wins; auto-advance retires
      pause();
      advance();
    });
    box.addEventListener("mouseenter", pause);
    box.addEventListener("mouseleave", play);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { pause(); } else { play(); }
    });

    paint();
    play();
  }

  /* ── annotation field (generative backdrop) ─────────────────
     Each particle is an "annotator" softly assigned to one of the
     four thread attractors via softmax over distance — p(k) ∝
     exp(−d_k/T) — periodically resampled, so allegiances drift.
     Links are drawn only between nearby particles that DISAGREE.
     Theme-aware, cursor-reactive, fades out on scroll, pauses
     when hidden, and renders a single static frame under
     prefers-reduced-motion. Config: BACKDROP in data.js. */
  function initField() {
    if (typeof BACKDROP !== "undefined" && BACKDROP && BACKDROP.enabled === false) return;
    var cv = document.createElement("canvas");
    if (!cv.getContext) return;
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.className = "field";
    cv.setAttribute("aria-hidden", "true");
    document.body.insertBefore(cv, document.body.firstChild);

    var reduced = media("(prefers-reduced-motion: reduce)");
    var density = (typeof BACKDROP !== "undefined" && BACKDROP && BACKDROP.density) || 1;
    var W, H, parts = [], attractors = [], pal = { segs: [] };
    var mouse = { x: -1e4, y: -1e4 };
    var running = false, rafId = null;

    function readPalette() {
      var cs = getComputedStyle(document.documentElement);
      pal.paper = cs.getPropertyValue("--paper").trim() || "#FDFDFB";
      pal.hair = cs.getPropertyValue("--hairline").trim() || "#E4E7E9";
      pal.segs = [1, 2, 3, 4].map(function (n) {
        return cs.getPropertyValue("--seg" + n).trim() || "#4B9CD3";
      });
    }
    function hardClear() {
      ctx.fillStyle = pal.paper;
      ctx.fillRect(0, 0, W, H);
    }
    function placeAttractors() {
      attractors = [
        { x: W * 0.20, y: H * 0.28 },
        { x: W * 0.46, y: H * 0.55 },
        { x: W * 0.70, y: H * 0.26 },
        { x: W * 0.86, y: H * 0.60 }
      ];
    }
    function softmaxPick(px, py) {
      var T = Math.max(W, H) * 0.18;
      var ws = attractors.map(function (a) {
        var dx = a.x - px, dy = a.y - py;
        return Math.exp(-Math.sqrt(dx * dx + dy * dy) / T);
      });
      var sum = 0, k;
      for (k = 0; k < ws.length; k++) sum += ws[k];
      var r = Math.random() * sum;
      for (k = 0; k < ws.length; k++) { r -= ws[k]; if (r <= 0) return k; }
      return ws.length - 1;
    }
    function spawn() {
      var n = Math.round((W < 640 ? 45 : 80) * density);
      parts = [];
      for (var i = 0; i < n; i++) {
        var x = Math.random() * W, y = Math.random() * H;
        parts.push({
          x: x, y: y,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          k: softmaxPick(x, y),
          r: 1.2 + Math.random() * 1.6,
          pulse: 0,
          resample: 240 + Math.random() * 600
        });
      }
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      placeAttractors();
      spawn();
      hardClear();
      if (reduced) staticFrame();
    }

    function step() {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], a = attractors[p.k];
        p.vx += (a.x - p.x) * 0.00012 + (Math.random() - 0.5) * 0.05;
        p.vy += (a.y - p.y) * 0.00012 + (Math.random() - 0.5) * 0.05;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16900 && d2 > 1) {           // cursor perturbs within 130px
          var f = 0.6 / Math.sqrt(d2);
          p.vx += dx * f * 0.12; p.vy += dy * f * 0.12;
          if (Math.random() < 0.02) { p.k = softmaxPick(p.x, p.y); p.pulse = 1; }
        }
        p.vx *= 0.965; p.vy *= 0.965;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        if (--p.resample <= 0) {
          var nk = softmaxPick(p.x, p.y);
          if (nk !== p.k) p.pulse = 1;
          p.k = nk;
          p.resample = 240 + Math.random() * 600;
        }
        if (p.pulse > 0) p.pulse -= 0.04;
      }
    }
    function drawLinks() {
      ctx.strokeStyle = pal.hair;
      for (var i = 0; i < parts.length; i++) {
        for (var j = i + 1; j < parts.length; j++) {
          var p = parts[i], q = parts[j];
          if (p.k === q.k) continue;          // only disagreement connects
          var dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 > 4900) continue;            // within 70px
          ctx.globalAlpha = 0.35 * (1 - d2 / 4900);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    function drawParts() {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        ctx.fillStyle = pal.segs[p.k];
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        if (p.pulse > 0) {                    // ring marks a re-label
          ctx.globalAlpha = 0.3 * p.pulse;
          ctx.strokeStyle = pal.segs[p.k];
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (1 - p.pulse) * 9, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    function scrollFade() {
      return Math.max(0, Math.min(1, 1 - (window.scrollY || 0) / (H * 1.15)));
    }
    function frame() {
      rafId = null;
      var fade = scrollFade();
      cv.style.opacity = fade;
      if (fade <= 0 || document.hidden) { running = false; return; }
      ctx.globalAlpha = 0.08;                 // trail decay
      ctx.fillStyle = pal.paper;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      step();
      drawLinks();
      drawParts();
      rafId = requestAnimationFrame(frame);
    }
    function ensureRunning() {
      if (running || reduced) return;
      if (scrollFade() <= 0 || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function staticFrame() {                  // reduced motion: settle, draw once
      for (var t = 0; t < 260; t++) step();
      hardClear();
      drawLinks();
      drawParts();
      cv.style.opacity = scrollFade();
    }

    readPalette();
    resize();
    if (!window.requestAnimationFrame || reduced) {
      if (reduced) staticFrame();
      window.addEventListener("resize", debounce(resize, 200));
      return;
    }
    ensureRunning();

    window.addEventListener("scroll", function () {
      if (reduced) { cv.style.opacity = scrollFade(); return; }
      ensureRunning();
    }, { passive: true });
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    }, { passive: true });
    window.addEventListener("resize", debounce(resize, 200));
    document.addEventListener("visibilitychange", ensureRunning);

    // theme changes: re-read palette, wipe trails
    var sync = function () { readPalette(); hardClear(); if (reduced) staticFrame(); };
    if (window.MutationObserver) {
      new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    if (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").addEventListener) {
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
    }
  }
  function debounce(fn, ms) {
    var t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function metaFill() {
    var y = $("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
    var u = $("[data-updated]");
    if (u && typeof LAST_UPDATED !== "undefined") u.textContent = LAST_UPDATED;
  }

  /* ── init (order matters) ────────────────────────────────── */
  initTheme();
  initField();
  applyVisibility(resolveSections());
  renderNow();
  initPhotos();
  renderNews();
  renderPubLists();
  renderTeaching();
  renderNotes();
  metaFill();
  initReveal();
  initPalette();
})();
