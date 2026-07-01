/* Site test suite — run with:  npm install && npm test
   Loads the real pages + real data.js/main.js in jsdom and asserts
   behavior. Content-tolerant where content changes (news counts etc).
   Exits non-zero on any failure. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const SITE = path.resolve(__dirname, "..");
const dataJS = fs.readFileSync(path.join(SITE, "assets/js/data.js"), "utf8");
const mainJS = fs.readFileSync(path.join(SITE, "assets/js/main.js"), "utf8");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  \u2713", label); }
  else { fail++; console.log("  \u2717 FAIL:", label); }
}

function loadPage(file, { mutate = "" } = {}) {
  const html = fs.readFileSync(path.join(SITE, file), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.test/" + file });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  w.scrollTo = () => {};
  // Single eval: top-level `const` in indirect eval lives per-eval,
  // so separate evals wouldn't share bindings like <script> tags do.
  w.eval(dataJS + "\n;" + (mutate || "") + "\n;" + mainJS);
  return dom;
}

/* ─────────────────────────── index.html ─────────────────────────── */
console.log("\nindex.html");
{
  const dom = loadPage("index.html");
  const d = dom.window.document;

  const n = d.querySelectorAll("[data-news] li").length;
  ok(n >= 1 && n <= 5, "news renders within display limit (" + n + " items)");

  const pub = d.querySelector('[data-pubs="selected"] .pub');
  ok(!!pub, "selected publication renders on home");
  ok(pub && pub.querySelector(".me").textContent === "Om Dehlan*", "author bolded with equal-contribution star");
  ok(pub && /Findings of EMNLP 2025/i.test(pub.querySelector(".venue").textContent), "venue tag correct");

  ok(!d.querySelector('[data-nav="notes"]'), "notes nav link auto-hidden (no notes yet)");
  ok(!!d.querySelector('[data-nav="teaching"]'), "teaching nav link visible (service has entries)");
  ok(!!d.querySelector('[data-nav="misc"]'), "misc nav link visible");

  const now = d.querySelector("[data-now]");
  ok(now && now.hidden === false && now.textContent.length > 5, "now line renders");

  const bibLink = d.querySelector("[data-bib]");
  bibLink.dispatchEvent(new dom.window.Event("click", { bubbles: true, cancelable: true }));
  ok(d.querySelector("#bib-lrplan2025").hidden === false, "[bib] click reveals BibTeX");
  ok(bibLink.getAttribute("aria-expanded") === "true", "aria-expanded syncs on toggle");

  d.querySelector(".theme-toggle").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  ok(dom.window.document.documentElement.dataset.theme === "dark", "theme toggle flips to dark");
  ok(dom.window.localStorage.getItem("theme") === "dark", "theme persisted to storage");

  d.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }));
  ok(!!d.querySelector(".palette.open"), "palette opens on /");
  const input = d.querySelector(".palette input");
  input.value = "lrplan";
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  const opts = d.querySelectorAll(".palette li[role=option]");
  ok(opts.length === 1 && /LRPlan/i.test(opts[0].textContent), "palette filters to the paper");
  d.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  ok(!d.querySelector(".palette.open"), "palette closes on Escape");
}

/* news expander (content-tolerant: pushes enough to exceed the limit) */
{
  const dom = loadPage("index.html", { mutate:
    "NEWS.push({date:'2024-01',label:'a',html:'x'},{date:'2024-02',label:'b',html:'y'},{date:'2024-03',label:'c',html:'z'},{date:'2024-04',label:'d',html:'w'},{date:'2024-05',label:'e',html:'v'});" });
  const d = dom.window.document;
  const before = d.querySelectorAll("[data-news] li").length;
  const btn = d.querySelector(".news-more");
  ok(!!btn, "expander appears for older news");
  if (btn) {
    const extra = parseInt(btn.textContent.match(/\d+/)[0], 10);
    btn.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    ok(d.querySelectorAll("[data-news] li").length === before + extra, "expander reveals older items");
  } else { fail++; console.log("  \u2717 FAIL: expander click unreachable"); }
}

/* config overrides */
{
  const dom = loadPage("index.html", { mutate: "SECTIONS.notes = true; SECTIONS.teaching = false;" });
  const d = dom.window.document;
  ok(!!d.querySelector('[data-nav="notes"]'), "notes nav appears when forced true while empty");
  ok(!d.querySelector('[data-nav="teaching"]'), "teaching nav removed when forced false");
}

/* ─────────────────────────── teaching.html ─────────────────────── */
console.log("\nteaching.html");
{
  const dom = loadPage("teaching.html");
  const d = dom.window.document;
  ok(d.querySelectorAll('[data-entries="service"] .entry').length === 2, "service renders 2 entries from data");
  ok(d.querySelector('[data-section="courses"]').hidden === true, "empty courses subsection auto-hidden");
  ok(d.querySelector('[data-section="service"]').hidden === false, "service subsection visible");
}

/* whole hidden page visited directly -> stub */
{
  const dom = loadPage("notes.html");
  ok(/tucked away/.test(dom.window.document.querySelector("#main").textContent), "hidden page shows polite stub on direct visit");
}

/* ───────────────────────── publications.html ───────────────────── */
console.log("\npublications.html");
{
  const dom = loadPage("publications.html");
  const d = dom.window.document;
  ok(d.querySelectorAll('[data-pubs="full"] .pub').length === 1, "full list renders the paper");
  ok(/^2025$/.test(d.querySelector(".pub-year").textContent), "year grouping header present");
  ok(!d.querySelector("[data-pub-filters]"), "filter bar removed with a single type");
}
{
  const dom = loadPage("publications.html", {
    mutate: "PUBLICATIONS.push({id:'x2026',type:'preprint',year:2026,title:'Fake Preprint',authors:[{name:'Om Dehlan',me:true}],venue:'arXiv',links:{}});"
  });
  const d = dom.window.document;
  const chips = d.querySelectorAll(".chip");
  ok(chips.length === 3, "chips self-build with a second type");
  const pre = Array.from(chips).find(c => /preprint/.test(c.textContent));
  pre.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  ok(d.querySelectorAll('[data-pubs="full"] .pub').length === 1 &&
     /Fake Preprint/.test(d.querySelector('[data-pubs="full"]').textContent), "type filter narrows the list");
}

/* ─────────────────────────── photo rotator ─────────────────────── */
console.log("\nphoto rotator");
{
  const dom = loadPage("index.html");
  const d = dom.window.document;
  ok(!d.querySelector(".photo-rotor"), "single photo stays static (no rotor)");
  ok(!!d.querySelector("[data-photos] img"), "static headshot still present");
}
{
  const dom = loadPage("index.html", { mutate: "PHOTOS.push({src:'assets/img/a.jpg',alt:'a'},{src:'assets/img/b.jpg',alt:'b'});" });
  const d = dom.window.document;
  ok(!!d.querySelector(".photo-rotor"), "rotor builds with 2+ photos");
  ok(d.querySelectorAll(".photo-dots span").length === 3, "one dot per photo");
  ok(/Photo 1 of 3/.test(d.querySelector("[data-photos] .visually-hidden").textContent), "aria-live announces position");
  const srcs = ["assets/img/headshot.jpg", "assets/img/a.jpg", "assets/img/b.jpg"];
  ok(srcs.indexOf(d.querySelector(".photo-rotor img").getAttribute("src")) !== -1, "initial photo drawn from shuffled set");
  ok(d.querySelectorAll(".photo-dots span.active").length === 1, "exactly one active dot");
}

/* ─────────────────────────── aurora backdrop ───────────────────── */
console.log("\naurora backdrop");
{
  const dom = loadPage("index.html");
  const d = dom.window.document;
  const au = d.querySelector(".aurora");
  ok(!!au, "aurora injected");
  ok(au && au.getAttribute("aria-hidden") === "true", "aurora is decorative");
  ok(au && au.querySelectorAll("span").length === 4, "four color fields");
}
{
  const dom = loadPage("index.html", { mutate: "BACKDROP.enabled = false;" });
  ok(!dom.window.document.querySelector(".aurora"), "enabled=false removes aurora");
}
{
  const dom = loadPage("index.html", { mutate: "BACKDROP.density = 0.4;" });
  const au = dom.window.document.querySelector(".aurora");
  ok(au && au.style.opacity === "0.4", "density dials intensity");
}

/* ─────────────────────────── summary ────────────────────────────── */
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
