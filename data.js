/* ═══════════════════════════════════════════════════════════════
   SITE CONTENT & CONFIG — the only file you edit day to day.

   Everything below renders automatically. Add an entry, refresh.
   ═══════════════════════════════════════════════════════════════ */

const LAST_UPDATED = "June 2026";   // shown in the footer

/* ── SECTION TOGGLES ──────────────────────────────────────────
   Controls navigation links AND section visibility, site-wide.

     true    always show (empty sections display their
             "reserved with intent" placeholder text)
     false   hide everywhere — nav link disappears, and visiting
             the page directly shows a polite stub
     "auto"  hidden while empty; appears automatically the moment
             you add content below (a note, a course, a talk…)

   Pages:        research · publications · teaching · notes · misc
   Subsections:  courses · mentoring · talks · service (teaching page)
   The teaching page on "auto" shows if ANY of its subsections do.
──────────────────────────────────────────────────────────────── */
const SECTIONS = {
  research:     true,
  publications: true,
  teaching:     "auto",
  notes:        "auto",
  misc:         true,

  courses:      "auto",
  mentoring:    "auto",
  talks:        "auto",
  service:      "auto"
};

/* ── NOW ──────────────────────────────────────────────────────
   One mono line under the hero links. Simple HTML allowed.
   Set to "" to hide. Update it occasionally — it signals the
   site is alive. TODO: keep current.                          */
const NOW = "drafting the soft-label fallacy paper &nbsp;·&nbsp; bass :D...";

/* ── NEWS ─────────────────────────────────────────────────────
   Newest first. `html` may contain simple tags and links.
   Home shows the latest 5 with a "+ older" expander.

   TEMPLATE:
   { date: "2026-12", label: "Dec 2026",
     html: "Submitted <em>Paper title</em> to ACL 2027." },
──────────────────────────────────────────────────────────────── */
const NEWS = [
  // { date: "2026-06", label: "Jun 2026",
  //   html: "Spending the summer as an engineering intern at Universal Instruments in Binghamton, NY." },
  { date: "2025-11", label: "Nov 2025",
    html: "<span class=\"sc\">LRPlan</span> appears in Findings of EMNLP&nbsp;2025." },
  { date: "2025-08", label: "Aug 2025",
    html: "Started my MS in computer science at UNC Chapel Hill." },
  { date: "2025-07", label: "Jul 2025",
    html: "Attended ACL 2025 in Vienna." },
  { date: "2025-05", label: "May 2025",
    html: "Graduated with a B.Tech in computer science from IIT Delhi." }
];

/* ── PUBLICATIONS ─────────────────────────────────────────────
   Newest first.
     id        unique slug (anchors + BibTeX toggle)
     selected  true → also featured on the home page
     type      "conference" | "journal" | "workshop" | "preprint" | "thesis"
               (filter chips on the publications page build
                themselves from whatever types exist here)
     authors   me:true bolds you · equal:true adds *
     links     any of: paper, pdf, code, data, slides, poster, video
     bibtex    shown by the [bib] toggle (optional)

   TEMPLATE:
   { id: "shortname2027", selected: true, type: "conference",
     year: 2027,
     title: "Title of the Paper",
     authors: [
       { name: "Om Dehlan", me: true, equal: true },
       { name: "Coauthor Name", equal: true },
       { name: "Advisor Name" }
     ],
     venue: "ACL 2027",
     tldr: "One sentence on what it shows.",
     links: { paper: "https://…", pdf: "https://…", code: "https://…" },
     bibtex: `@inproceedings{...}` },
──────────────────────────────────────────────────────────────── */
const PUBLICATIONS = [
  {
    id: "lrplan2025",
    selected: true,
    type: "conference",
    year: 2025,
    title: "LRPlan: A Multi-Agent Collaboration of Large Language and Reasoning Models for Planning with Implicit & Explicit Constraints",
    authors: [
      { name: "T Karthikeyan", equal: true },
      { name: "Om Dehlan", me: true, equal: true },
      { name: "Mausam" },
      { name: "Manish Gupta" }
    ],
    venue: "Findings of EMNLP 2025",
    tldr: "LLM and LRM agents collaborate on constrained planning, reaching state of the art on TravelPlanner and TimeArena-Static with up to 12.7-point accuracy gains over the closest baselines, at lower cost.",
    links: {
      paper: "https://aclanthology.org/2025.findings-emnlp.440/",
      pdf:   "https://aclanthology.org/2025.findings-emnlp.440.pdf"
      // code: "https://github.com/…",   // TODO: add if/when public
    },
    // TODO: replace with the official entry from the ACL Anthology
    // "Cite" button (it includes page numbers).
    bibtex: `@inproceedings{karthikeyan-etal-2025-lrplan,
  title     = {{LRP}lan: A Multi-Agent Collaboration of Large Language and Reasoning Models for Planning with Implicit {\\&} Explicit Constraints},
  author    = {Karthikeyan, T and Dehlan, Om and Mausam and Gupta, Manish},
  booktitle = {Findings of the Association for Computational Linguistics: EMNLP 2025},
  year      = {2025},
  address   = {Suzhou, China},
  publisher = {Association for Computational Linguistics},
  url       = {https://aclanthology.org/2025.findings-emnlp.440/}
}`
  }
];

/* ── TEACHING PAGE ────────────────────────────────────────────
   Four arrays. Empty arrays + "auto" → the subsection (and, if
   all are empty, the whole page + nav link) stays hidden until
   you add your first entry. `meta` may contain simple HTML
   (e.g. a [slides] link); `desc` is plain text.

   TEMPLATES:
   courses:   { title: "COMP 590: Natural Language Processing",
                meta:  "teaching assistant · UNC Chapel Hill · Fall 2026",
                desc:  "Recitations, office hours, assignment design." },
   mentoring: { title: "Student Name",
                meta:  "undergraduate researcher · 2027 · now at …",
                desc:  "Project they worked on with you, one line." },
   talks:     { title: "LRPlan: LLM–LRM collaboration for planning",
                meta:  "poster · EMNLP 2025 · Suzhou · <a href=\"files/lrplan-poster.pdf\">[poster]</a>",
                desc:  "" },
──────────────────────────────────────────────────────────────── */
const TEACHING = {
  courses:   [],
  mentoring: [],
  talks:     [],
  service: [
    { title: "Diversity Representative",
      meta:  "Office of Diversity &amp; Inclusion · IIT Delhi",
      desc:  "Represented student concerns to the office and helped run inclusion programming across campus." },
    { title: "Lead organizer (logistics), IIT Delhi Pride Festival",
      meta:  "IIT Delhi",
      desc:  "Led logistics for the institute's Pride Festival." }
    // Peer review goes here when it starts:
    // { title: "Peer review", meta: "ACL Rolling Review · 2027–", desc: "" },
  ]
};

/* ── NOTES ────────────────────────────────────────────────────
   Occasional writing. The notes page and nav link appear
   automatically (SECTIONS.notes = "auto") once this has an entry.

   To publish:
     1. Copy notes/_template.html → notes/my-note.html
     2. Write in it (the .prose styles handle formatting)
     3. Add an entry here, newest first

   TEMPLATE:
   { date: "2026-09-01",
     title: "What should “diverse outputs” actually mean?",
     href: "notes/diverse-outputs.html",
     blurb: "Why embedding similarity undersells the question." },
──────────────────────────────────────────────────────────────── */
const NOTES = [];
