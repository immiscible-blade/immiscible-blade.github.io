# omdehlan.github.io

Personal academic website for Om Dehlan. Plain HTML/CSS/JS — no build step,
no framework, no dependencies. Push to GitHub, and GitHub Pages serves it as-is.

## Structure

```
.
├── index.html              home — hero, about, selected pubs, news
├── research.html           agenda, four threads, projects
├── publications.html       full list (rendered from data.js)
├── teaching.html           teaching, mentoring, talks, service
├── notes.html              occasional writing (rendered from data.js)
├── misc.html               bass, games, food
├── 404.html                served automatically by GitHub Pages
├── notes/
│   └── _template.html      copy this to write a new note
├── assets/
│   ├── css/styles.css      all styling; design tokens at the top
│   ├── js/data.js          ★ ALL CONTENT + CONFIG LIVES HERE ★
│   ├── js/main.js          rendering + behavior (rarely touch)
│   └── img/favicon.svg     (add headshot.jpg here too)
├── files/                  cv.pdf, slides, posters, paper PDFs
├── site.webmanifest        PWA metadata
├── robots.txt, sitemap.xml (set your domain after publishing)
└── .nojekyll               tells GitHub Pages to serve files verbatim
```

## Section toggles

`SECTIONS` at the top of `assets/js/data.js` controls navigation links and
section visibility everywhere, with three states per section:

| value    | behavior                                                        |
|----------|-----------------------------------------------------------------|
| `"auto"` | hidden while empty; **appears automatically** once content exists |
| `true`   | always shown — empty sections display their placeholder copy    |
| `false`  | hidden everywhere; visiting the page directly shows a polite stub |

Pages: `research` · `publications` · `teaching` · `notes` · `misc`.
Teaching-page subsections: `courses` · `mentoring` · `talks` · `service`.
On `"auto"`, the teaching page (and its nav link) shows if *any* subsection
has content. Right now that means: service has two entries → teaching is
live; notes has none → the notes link doesn't exist yet. Add your first
note and it materializes. No HTML edits, ever.

## Editing content — the 95% case

Open `assets/js/data.js`. Every array has a copy-paste TEMPLATE in the
comments directly above it:

- **News** → prepend to `NEWS`. Home shows the latest 5 with a "+ older"
  expander.
- **Publication** → prepend to `PUBLICATIONS`. Grouped by year on the
  publications page; `selected: true` also features it on the home page.
  Filter chips (conference / workshop / preprint / …) build themselves
  from whatever `type` values exist and appear once there's a second type.
- **Teaching / mentoring / talks / service** → add to the matching array
  in `TEACHING`. The subsection un-hides itself.
- **Note** → copy `notes/_template.html` to `notes/your-slug.html`, write,
  add an entry to `NOTES`.
- **Backdrop** → `BACKDROP` in `data.js`: `enabled` toggles the ambient
  aurora; `density` (0–1) dials its intensity.
- **Photos** → drop files in `assets/img/` and list them in `PHOTOS`.
  One entry = static headshot; two or more = a shuffled rotator that
  auto-advances and steps photo-by-photo on click.
- **Now line** → edit `NOW` (one mono line under the hero links; keep it
  fresh, it signals the site is alive). `LAST_UPDATED` feeds the footer.

## Features

Cross-page View Transitions (Chrome/Edge; graceful elsewhere) · command
palette on `/` or `Ctrl/⌘K` (pages, papers, theme, copy-email) · dark mode
following the OS with a ◐ override · sticky blur header · fluid `clamp()`
type scale from phone to desktop · scroll-reveal animations · interactive
hero strip (each segment links to its research thread) · hero photo rotator · ambient aurora backdrop · BibTeX toggle +
copy with toast · JSON-LD Person markup · PWA manifest · sitemap/robots ·
`prefers-reduced-motion` respected throughout · print stylesheet.

## Tested

`npm install` once, then `npm test`. The jsdom suite in `tests/` covers
the visibility engine, all renderers, config overrides, filter chips,
BibTeX toggle, palette, photo rotator, and aurora backdrop. The site
itself stays dependency-free — `node_modules` exists only for tests and
is gitignored.

## Before going live (TODO checklist)

- [ ] Replace `mailto:you@cs.unc.edu` and the `#` links (scholar, github,
      linkedin, x) in `index.html`, and the Scholar/Semantic Scholar links
      in `publications.html`
- [ ] Add `assets/img/headshot.jpg` and swap in the commented `<img>` in
      `index.html`
- [ ] Add `files/cv.pdf`
- [ ] Replace the LRPlan BibTeX in `data.js` with the official ACL
      Anthology entry (includes page numbers)
- [ ] Set the real domain in `sitemap.xml`, `robots.txt`, and the JSON-LD
      block in `index.html` (search for `YOUR-USERNAME`)

## Preview locally

```
python -m http.server          # from the repo root
# → http://localhost:8000
```

## Publish on GitHub Pages

**Option A — user site (recommended):** name the repo
`<username>.github.io`, push to `main`, live at
`https://<username>.github.io` within a minute or two.

**Option B — project site:** any repo name, then *Settings → Pages →
Deploy from branch → main /(root)*. All internal paths are relative so
both options work; only `404.html` uses absolute paths (see the comment
in it if you deploy as a project site).

```
git init && git add -A && git commit -m "Initial site"
git remote add origin git@github.com:<username>/<username>.github.io.git
git push -u origin main
```

## Design notes

Palette, segment colors, and the fluid type scale are CSS variables at the
top of `styles.css` — the whole site reskins from there. The bar under the
name is the site's signature: research interests rendered as a soft label
distribution, segment colors keyed to the four threads on the research
page. To add a fifth thread: a `--seg5` token, a strip segment in
`index.html`, and a thread block in `research.html`. `.nojekyll` matters —
without it, GitHub Pages runs Jekyll and silently drops `_`-prefixed files
like `notes/_template.html`.
