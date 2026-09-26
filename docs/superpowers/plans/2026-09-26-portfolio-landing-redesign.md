# Portfolio Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current long-form portfolio landing page with a focused Possibility → Practice → Person narrative that positions Shwetha as an AI engineer and technical leader.

**Architecture:** Keep the Angular app single-page and data-driven. Move editorial content and reusable interfaces out of the root component, render six semantic sections from typed content, and preserve archive material in a separate module for a future route without adding routing or a CMS now.

**Tech Stack:** Angular 20, TypeScript, Angular signals, SCSS, Node test runner, locally bundled Open Sans, Georgia.

**Spec:** `docs/superpowers/specs/2026-09-26-portfolio-landing-redesign-design.md`

## Global Constraints

- Do not launch a browser or development server; Shwetha performs visual review locally.
- Keep email as the only contact method.
- Keep theme state on `html[data-theme]` with the existing accessible icon control.
- Keep Georgia for editorial headings and Open Sans for body and interface text.
- Do not add dependencies, routing, a CMS, analytics, or a contact backend.
- Do not reproduce Leonard Cohen lyrics; paraphrase the influence only.
- Do not use “I’m Shwetha…” or biography-first copy.
- Do not delete archived teaching, Shwetha-isms, or additional poetry content.
- Leave `.vscode/settings.json` and `private/` untracked.

## Review Focus

- Navigation anchors must resolve to section IDs after the old sections are removed.
- Archived content must remain exported and complete even though it is no longer rendered.
- Theme-toggle `aria-label` and `aria-pressed` bindings must survive the template rewrite.
- The landing template must not reintroduce biography-first, résumé, or service-menu language.
- Mobile rules must neutralise decorative overlaps enough to avoid horizontal overflow.

---

### Task 1: Preserve the Current Visual Baseline

**Files:**
- Modify: `src/app/app.scss`
- Modify: `src/index.html`
- Create: `public/favicon.svg`
- Modify: `tests/portfolio-content.test.mjs`

**Interfaces:**
- Consumes: existing single-page app and `html[data-theme]` theme mechanism.
- Produces: full-width square section shells, subtle slanted layers, and branded SVG favicon as the baseline for the content redesign.

- [ ] **Step 1: Run the existing browser-free regression suite**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run test:content`

Expected: 11 passing tests, including full-width layout, slanted sections, and broken-circle favicon.

- [ ] **Step 2: Run the production build**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run build`

Expected: Angular build succeeds and writes `dist/shwetha-portfolio`.

- [ ] **Step 3: Commit only the visual baseline files**

```bash
git add src/app/app.scss src/index.html public/favicon.svg tests/portfolio-content.test.mjs
git commit -m "feat: refine full-width portfolio visuals"
```

### Task 2: Extract Typed Landing and Archive Content

**Files:**
- Create: `src/app/models/portfolio-content.ts`
- Create: `src/app/content/landing-content.ts`
- Create: `src/app/content/archive-content.ts`
- Modify: `tests/portfolio-content.test.mjs`

**Interfaces:**
- Consumes: current `Card`, `Poem`, `offerings`, `teachings`, `aphorisms`, and `poems` from `src/app/app.ts`.
- Produces: `LandingContent`, `PracticeItem`, `Poem`, `ArchiveContent`, `landingContent`, and `archiveContent`.

- [ ] **Step 1: Add failing content-architecture assertions**

Read the three new module paths in `tests/portfolio-content.test.mjs` and assert:

```js
assert.match(models, /export interface LandingContent/);
assert.match(landingContent, /Some ideas stopped being impossible/);
assert.match(landingContent, /The brief changed\. Engineering discipline did not\./);
assert.match(archiveContent, /A comma can change the entire mood/);
assert.match(archiveContent, /Full-stack development/);
assert.match(archiveContent, /Morning, unhurried/);
```

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run test:content`

Expected: FAIL because the content modules do not exist.

- [ ] **Step 2: Create reusable content interfaces**

Create `src/app/models/portfolio-content.ts` with:

```ts
export interface PracticeItem {
  readonly title: string;
  readonly body: string;
  readonly tone: 'sage' | 'peach' | 'lavender' | 'blush';
}

export interface Poem {
  readonly title: string;
  readonly lines: readonly string[];
}

export interface LandingContent {
  readonly hero: { readonly eyebrow: string; readonly title: string; readonly body: string };
  readonly possibility: { readonly eyebrow: string; readonly title: string; readonly paragraphs: readonly string[] };
  readonly practice: { readonly eyebrow: string; readonly title: string; readonly items: readonly PracticeItem[] };
  readonly leadership: { readonly eyebrow: string; readonly title: string; readonly paragraphs: readonly string[] };
  readonly beyond: { readonly eyebrow: string; readonly title: string; readonly body: string; readonly notes: readonly string[] };
  readonly contact: { readonly eyebrow: string; readonly title: string; readonly body: string; readonly email: string };
}

export interface ArchiveContent {
  readonly teachings: readonly PracticeItem[];
  readonly aphorisms: readonly string[];
  readonly poems: readonly Poem[];
}
```

- [ ] **Step 3: Create the landing content module**

Export `landingContent: LandingContent` from `src/app/content/landing-content.ts`. Use these exact section titles:

```ts
hero.title = 'Some ideas stopped being impossible while we were busy planning them.';
possibility.title = 'The brief changed. Engineering discipline did not.';
practice.title = 'Ambition needs an operating system.';
leadership.title = 'When it breaks, tell the truth.';
beyond.title = 'A life outside the stack changes how you see the system.';
contact.title = 'What became possible before your roadmap caught up?';
```

The practice items must be “Find the real product,” “Design the whole system,” “Build the guardrails early,” and “Lead through uncertainty.” The hero body must mention product thinking, AI architecture, guardrails, and engineering teams without using biography-first language. The beyond notes must mention wide-ranging music, literature, and NYFA/scriptwriting without including a poem.

- [ ] **Step 4: Create the archive module without deleting content**

Move the current teaching cards, aphorisms, and both current poems into `archiveContent: ArchiveContent` in `src/app/content/archive-content.ts`. Preserve their wording exactly so a future archive route can reuse them.

- [ ] **Step 5: Run tests and commit**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run test:content`

Expected: PASS.

```bash
git add src/app/models/portfolio-content.ts src/app/content/landing-content.ts src/app/content/archive-content.ts tests/portfolio-content.test.mjs
git commit -m "refactor: extract portfolio content models"
```

### Task 3: Rebuild the Landing Narrative

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`
- Modify: `tests/portfolio-content.test.mjs`

**Interfaces:**
- Consumes: `landingContent: LandingContent` from Task 2.
- Produces: `App.content`, semantic section IDs `possibility`, `practice`, `leadership`, `beyond`, and `contact`.

- [ ] **Step 1: Add failing structure and copy assertions**

Add assertions that require the new navigation labels and order:

```js
assert.match(template, /href="#possibility">Possibility/);
assert.match(template, /href="#practice">Practice/);
assert.match(template, /href="#leadership">Leadership/);
assert.match(template, /href="#beyond">Beyond/);
assert.ok(template.indexOf('id="possibility"') < template.indexOf('id="practice"'));
assert.ok(template.indexOf('id="practice"') < template.indexOf('id="leadership"'));
assert.ok(template.indexOf('id="leadership"') < template.indexOf('id="beyond"'));
assert.doesNotMatch(template, /What I can do for you|What I can teach you|What I cannot teach you|Shwetha-isms/);
assert.doesNotMatch(template, /I’m Shwetha|I'm Shwetha/);
assert.match(template, /\[attr\.aria-pressed\]="isDark\(\)"/);
```

Run the content suite and confirm it fails against the old template.

- [ ] **Step 2: Reduce the root component to content and theme state**

Replace the local card and poem data in `src/app/app.ts` with:

```ts
import { landingContent } from './content/landing-content';

protected readonly content = landingContent;
```

Keep `DOCUMENT`, `signal`, `isDark`, and `toggleTheme()` unchanged.

- [ ] **Step 3: Rewrite navigation and hero**

Use navigation anchors for Possibility, Practice, Leadership, Beyond, and Contact. Bind the hero eyebrow, title, and body from `content.hero`. Keep `/images/quiet-curiosity.png`, the existing accessible alt text, and a CTA to `#possibility` labelled “Start with what changed”.

- [ ] **Step 4: Render Possibility and Practice**

Render `#possibility` as a two-column editorial section using `/images/human-ai-adoption.png` and both `content.possibility.paragraphs`. Render `#practice` as a four-item `@for` sequence using `content.practice.items` and the existing tone classes.

- [ ] **Step 5: Render Leadership, Beyond, and Contact**

Render `#leadership` with `/images/building-systems.png`, both leadership paragraphs, and no song lyrics. Render `#beyond` with the approved cultural summary and three concise `content.beyond.notes`; do not render poems. Render `#contact` with the existing mailto-only button using `content.contact.email`.

- [ ] **Step 6: Run tests and commit**

Run the content suite and expect all assertions to pass.

```bash
git add src/app/app.ts src/app/app.html tests/portfolio-content.test.mjs
git commit -m "feat: reshape portfolio landing narrative"
```

### Task 4: Refine Editorial Layout for the New Sections

**Files:**
- Modify: `src/app/app.scss`
- Modify: `tests/portfolio-content.test.mjs`

**Interfaces:**
- Consumes: section classes `.hero`, `.possibility`, `.practice`, `.leadership`, `.beyond`, `.contact` from Task 3.
- Produces: responsive layouts with square full-width shells, level content, rounded internal panels, and subtle slanted transitions.

- [ ] **Step 1: Add failing style assertions**

Assert the new selectors exist, old removed-section selectors do not, and mobile slants are reduced:

```js
assert.match(styles, /\.possibility\s*{[\s\S]*?display:\s*grid;/);
assert.match(styles, /\.practice__items\s*{[\s\S]*?grid-template-columns:\s*repeat\(4, 1fr\);/);
assert.match(styles, /\.leadership\s*{[\s\S]*?background:\s*var\(--mint\);/);
assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?height:\s*14px;/);
assert.doesNotMatch(styles, /\.isms\s*,|\.cannot\s*\{/);
```

Run the content suite and confirm it fails.

- [ ] **Step 2: Remove obsolete landing selectors**

Delete styles used only by `.cannot`, `.isms`, `.principal`, `.about`, and multi-poem landing layouts. Keep reusable `.card`, `.editorial-visual`, `.button`, tone, typography, header, theme, and footer rules.

- [ ] **Step 3: Add section-specific editorial layouts**

Implement:

- `.possibility` as an asymmetric two-column grid;
- `.practice__items` as four columns on desktop, two on tablet, one on mobile;
- `.leadership` with mint background and image/copy split;
- `.beyond` with a cultural text column and three compact editorial notes;
- alternating `::before` slants on `.possibility`, `.leadership`, `.beyond`, and `.contact`;
- `border-radius: 0` on every full-width section shell.

- [ ] **Step 4: Add responsive safeguards**

At `max-width: 900px`, stack two-column layouts. At `max-width: 720px`, reduce slant pseudo-elements to `height: 14px`, hide desktop navigation, keep `width: 100%`, and ensure no section uses horizontal margins.

- [ ] **Step 5: Run tests, build, and commit**

Run:

```bash
PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run test:content
PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run build
```

Expected: all tests pass and the production build succeeds without warnings.

```bash
git add src/app/app.scss tests/portfolio-content.test.mjs
git commit -m "style: compose editorial landing sections"
```

### Task 5: Final Verification

**Files:**
- Verify: all files changed by Tasks 1–4.

**Interfaces:**
- Consumes: complete landing redesign.
- Produces: verified branch ready for Shwetha’s local visual review.

- [ ] **Step 1: Run the complete browser-free content suite**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run test:content`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run build`

Expected: build succeeds and reports the output path.

- [ ] **Step 3: Attempt the repository lint command**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.4/bin:$PATH" npm run lint`

Expected with the current package configuration: npm reports that no `lint` script exists. Record this limitation; do not add a linter as unrelated scope.

- [ ] **Step 4: Verify repository hygiene**

Run:

```bash
git diff --check
git status --short --branch
```

Expected: no whitespace errors; `.vscode/settings.json` and `private/` remain untracked and unstaged.
