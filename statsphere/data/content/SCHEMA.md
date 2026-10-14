# Curated content schema

All public website content lives in this folder as JSON. The backend seeds its
database from these files (`python -m app.cli seed`), and the admin interface
can then change publication status, availability and other fields.

**Source of truth for subject matter:** `data/source/bsc-hons-statistics-data-science-syllabus.pdf`
(B.Sc. (Hons) Statistics & Data Science syllabus, 114 pages). Every record carries
`source_pages` (1-based PDF page numbers) so claims can be traced back.

## Integrity rules (apply to every file)

- Do not invent prices, instructor names, credentials, accreditation, client names,
  testimonials, enrolment numbers, completion rates or outcomes.
- Durations are **proposals**. Always phrase them as proposals (the UI adds a
  "Proposed" badge too).
- Certificates are **certificates of completion issued by the business**. Never
  describe them as accredited, government-recognised, university-approved or
  industry-certified.
- `availability` is `"proposed"` for every course and service until the owner
  confirms otherwise. Allowed values: `proposed`, `enquiries_open`, `enrolling`, `closed`.
- `status` controls publication: `published`, `draft`, `archived`.
- Topics must come from the PDF. Practical framing (audience, applications,
  deliverables) may be written by us, but must stay faithful to the PDF's methods.
- Write summaries in our own words. Do not copy long passages of the syllabus verbatim.
- British/Indian English spelling is fine; be consistent within a record.
- Inline math in any text field: wrap TeX in single dollars, e.g. `$\bar{x}$`.
  Escape backslashes for JSON (`"$\\bar{x}$"`).

## Shared slug registry

Cross-references must use these slugs exactly.

**Services** (`/services/:slug`)
`statistical-analysis`, `regression-predictive-modelling`, `machine-learning-consulting`,
`time-series-forecasting`, `research-methodology-support`, `survey-sampling-experimental-design`,
`multivariate-analysis-segmentation`, `survival-reliability-analysis`, `statistical-quality-control`,
`data-visualization-reporting`, `business-analytics-data-mining`, `operations-research-optimisation`,
`mathematical-modelling-numerical-computation`, `big-data-analytics`

**Courses** (`/courses/:slug`)
`statistics-for-data-analysis`, `statistical-inference-hypothesis-testing`, `excel-for-data-analytics`,
`r-programming-for-statistics`, `python-programming-for-data-science`, `sql-databases-for-data-science`,
`data-visualization`, `regression-predictive-modelling`, `time-series-analysis-forecasting`,
`machine-learning-fundamentals`, `deep-learning-advanced-ml`, `multivariate-statistical-analysis`,
`survival-reliability-analysis`, `experimental-design-sampling`, `statistical-quality-control`,
`big-data-analytics-hadoop-spark`, `business-analytics-data-mining`, `operations-research-decision-modelling`,
`mathematics-for-data-science`, `mathematical-modelling-differential-equations`, `research-methodology-latex`,
`financial-mathematics-economics`

**Articles** (`/knowledge/:slug`)
`central-tendency-and-dispersion`, `correlation-and-regression`, `probability-and-bayes-theorem`,
`probability-distributions-and-clt`, `estimation-and-maximum-likelihood`, `hypothesis-testing-essentials`,
`analysis-of-variance`, `time-series-components-and-forecasting`, `index-numbers`,
`control-charts-for-quality`, `sampling-designs`, `design-of-experiments`,
`principal-components-and-factor-analysis`, `survival-analysis-kaplan-meier`,
`bias-variance-and-regularisation`, `gradient-descent`, `linear-programming-and-simplex`,
`decision-analysis-under-risk`, `matrix-decompositions-for-data-science`, `numerical-root-finding`,
`time-value-of-money`

**Workshops** (corporate training)
`quantitative-reasoning-for-decision-makers`, `excel-analytics-for-teams`, `python-r-for-data-analysis`,
`applied-machine-learning`, `statistical-modelling-workshop`, `data-visualization-workshop`,
`research-and-analytical-methods`, `quality-control-for-operations`, `big-data-foundations`

**Projects** (`/projects/:slug`, synthetic demonstrations)
`demand-forecasting-decomposition`, `process-control-xbar-r`, `survival-kaplan-meier-comparison`,
`regression-marketing-response`, `pca-customer-segmentation`, `anova-treatment-comparison`,
`lp-product-mix-optimisation`

## Category vocabulary

`Statistics`, `Mathematics`, `Data Science`, `Machine Learning`, `Analytics`, `Programming`, `Research`

## services.json — array of

```jsonc
{
  "slug": "statistical-analysis",
  "title": "Statistical Analysis & Interpretation",
  "category": "Statistics",
  "icon": "Sigma",                     // lucide-react icon name
  "summary": "One or two sentences for cards.",
  "overview": "One paragraph: what the service is.",
  "problems": ["Problem this solves", "..."],          // 4-6
  "audience": ["Who should use it", "..."],            // 3-5
  "client_inputs": ["What the client provides", "..."],// 3-6
  "process": [{ "step": "Discovery call", "detail": "..." }], // 4-6 steps
  "deliverables": ["..."],                             // 4-6
  "applications": ["..."],                             // 3-6, grounded in PDF domains
  "methods": ["Method named in the PDF", "..."],       // 5-10
  "tools": ["R", "Python", "..."],                     // only tools named in the PDF
  "related_courses": ["course-slug"],
  "related_articles": ["article-slug"],
  "source_pages": [2, 3],
  "featured": true,
  "order": 1,
  "status": "published",
  "availability": "proposed",
  "approval_note": "Optional: why the owner should confirm this service before launch, else null"
}
```

## courses.json — array of

```jsonc
{
  "slug": "statistics-for-data-analysis",
  "title": "Statistics for Data Analysis",
  "category": "Statistics",
  "level": "Beginner",                 // Beginner | Intermediate | Advanced
  "format": "extended",                // short-course | workshop | extended
  "summary": "Card text, 1-2 sentences.",
  "description": "1-2 paragraphs.",
  "learning_objectives": ["..."],      // 4-6, start with a verb
  "modules": [{ "title": "Module title", "topics": ["topic", "..."] }], // 3-6 modules
  "prerequisites": ["..."],            // may be ["None — ..."]
  "audience": ["..."],
  "projects": ["Practical exercise or mini-project", "..."], // 3-5
  "tools": ["..."],                    // tools named in the PDF
  "teaching_format": "Sentence describing the proposed format (lectures + lab sessions etc.).",
  "delivery_modes": [],                // leave EMPTY until confirmed (online / in-person / hybrid)
  "proposed_duration": "6 weeks · about 36 hours",
  "proposed_hours": 36,
  "assessment": ["..."],
  "certificate": {
    "type": "completion",
    "eligibility": ["Proposed eligibility criterion", "..."]
  },
  "fee": null,
  "availability": "proposed",
  "related_services": ["service-slug"],
  "related_articles": ["article-slug"],
  "source_modules": [{ "name": "Descriptive Statistics", "code": "17200102", "pages": [2, 3] }],
  "source_pages": [2, 3],
  "featured": false,
  "order": 1,
  "status": "published"
}
```

## articles.json — array of

```jsonc
{
  "slug": "central-tendency-and-dispersion",
  "title": "...",
  "category": "Statistics",
  "summary": "2 sentences.",
  "tags": ["descriptive statistics", "..."],
  "reading_minutes": 6,
  "body": [
    { "type": "paragraph", "text": "Text with inline math like $\\bar{x}$." },
    { "type": "heading", "text": "Section heading" },
    { "type": "formula", "tex": "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i", "caption": "Arithmetic mean" },
    { "type": "list", "items": ["...", "..."] },
    { "type": "table", "columns": ["Measure", "Use when"], "rows": [["Median", "Skewed data"]] },
    { "type": "callout", "title": "In practice", "text": "..." },
    { "type": "example", "title": "Worked example", "text": "...", "steps": ["...", "..."] }
  ],
  "source_pages": [2, 3],
  "related_services": ["service-slug"],
  "related_courses": ["course-slug"],
  "order": 1,
  "status": "published"
}
```

## workshops.json — array of

```jsonc
{
  "slug": "...",
  "title": "...",
  "summary": "...",
  "participants": ["..."],
  "objectives": ["..."],
  "topics": ["..."],
  "formats": ["Half-day", "1 day", "2 days", "Multi-week cohort"],
  "example_agenda": [{ "session": "Session 1 · Title", "detail": "..." }],
  "customisation": ["..."],
  "related_courses": ["course-slug"],
  "source_pages": [10, 11],
  "order": 1,
  "status": "published"
}
```

## topics.json — the internal content catalogue (array of)

```jsonc
{
  "id": "descriptive-statistics",
  "name": "Descriptive Statistics",
  "syllabus_code": "17200102",
  "semester": 1,
  "description": "Short description.",
  "source_pages": [2, 3],
  "opportunity_types": ["consulting", "course", "workshop", "project", "research-support", "article", "demo"],
  "related_services": ["..."],
  "related_courses": ["..."],
  "related_articles": ["..."],
  "audience": ["..."],
  "prerequisites": ["..."],
  "applications": ["..."],
  "tools": ["..."],
  "website_section": "Courses / Services / Knowledge Hub ...",
  "status": "approved",                // approved | pending_review | excluded
  "review_note": "Why excluded or what needs review, else null"
}
```

`projects.json` and `site.json` are generated or hand-written separately
(`data/scripts/build_projects.py` produces `projects.json`).
