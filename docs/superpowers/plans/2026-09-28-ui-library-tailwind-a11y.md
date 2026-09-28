# UI Library, Tailwind Utilities & Accessibility — Plan

**Goal:** Rebuild the Studio and Growing Human front ends from one shared Angular UI library (`@studio/ui`) that uses Tailwind for every utility. Keep the current visual design and make every page semantic and accessible.

**Scope:** `apps/studio` (landing, quotes), `apps/growing-human` (guide, about), `libs/design-tokens`, the new `libs/ui`, and `tailwind.config.cjs`. `apps/api` and the non-UI libraries (`quote-data`, `editorial-content`, `growing-human-contracts`, `theme`) keep their behaviour. The only change to them is that their consumers move to the new components.

## Requirements (acceptance criteria)

| #   | Requirement                                                                                                                                                                                                                                                                         | Measured by                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| R1  | Tailwind handles every utility concern: spacing, margin, padding, gap, display, flex, grid, sizing, position, font size, weight, line height, letter spacing, radius and border width. It is used either as classes in the template or through `@apply` inside a custom SCSS class. | Stylelint (Phase 9): simple utility declarations in SCSS must use `@apply`; only complex values may be written as raw CSS |
| R2  | Common UI elements live in an Angular library, organised as atoms, molecules and organisms.                                                                                                                                                                                         | `libs/ui` exists; apps contain no duplicate primitives                                                                    |
| R3  | No HTML element has more than 5 classes (Tailwind and custom combined). If an element needs more, it gets a custom class in SCSS.                                                                                                                                                   | Template class-count lint rule based on the AST (Phase 9)                                                                 |
| R4  | Every element is semantic and accessible (WCAG 2.2 AA).                                                                                                                                                                                                                             | angular-eslint template a11y rules, axe-core specs and a manual checklist                                                 |

---

## 1. Current-state audit

### 1.1 Inventory

| Area           | Files                                                    | Notes                                                                                                                                                                                                                                                                                                                                         |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio landing | `landing.html` (~215 lines), `landing.scss` (~660 lines) | Header and nav styles are in the global `apps/studio/src/styles.scss`, scoped by the `app-landing` selector. Quote-dialog styles are also global.                                                                                                                                                                                             |
| Studio quotes  | `quotes.html` (~250 lines), `quotes.scss` (~600 lines)   | Duplicates the landing header, eyebrow, button, dialog, numbered row and footer with different CSS.                                                                                                                                                                                                                                           |
| GH guide       | `growing-human.html`, `growing-human.scss` (~390 lines)  | Uses BEM `growing-human__*` classes and a custom `__visually-hidden` class.                                                                                                                                                                                                                                                                   |
| GH about       | `about.html`, `about.scss` (~140 lines)                  | Repeats the GH bar, brand, nav, kicker and notice.                                                                                                                                                                                                                                                                                            |
| Tailwind       | `tailwind.config.cjs`                                    | Preflight is off. Only `fontFamily` is extended. No colours, spacing, type scale or screens are defined. Utilities are almost unused: only `@apply` in `_base.scss`.                                                                                                                                                                          |
| Tokens         | `libs/design-tokens/_palettes.scss`                      | Studio uses `--surface`, `--text`, `--coral` and similar. GH uses `--ink`, `--rose`, `--lavender` and similar, so there is no shared semantic vocabulary. Many hex values are hard-coded outside the palettes (`#8eae9b`, `#c4a674`, `#587565`, `#92703b`, `#b45f62`, `#302331`, `#222334`, `#d1c4ef`, `#4b4a60`, `#aaa8b4`, `#8f90a0`, ...). |
| Breakpoints    | Four ad-hoc breakpoints: 620, 720, 760 and 1000 px       | These should be consolidated into Tailwind `screens`.                                                                                                                                                                                                                                                                                         |

### 1.2 Duplicated primitives (these become library components)

| Pattern                      | Occurrences                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow / kicker label       | `.eyebrow` (landing), `.eyebrow` (quotes, different styling), `.growing-human__kicker`, `.about__kicker`                                            |
| Display and section headings | `h1`/`h2` rules in landing, quotes, GH and about, each with its own `clamp()`                                                                       |
| Pill button / text link      | `.button` (landing), `.button` + `.text-link` (quotes), `.influence__link`, `.work__link`, `.growing-human__reset`                                  |
| Chip / tag                   | `.quote-tags span`, `.author-list span`, `.growing-human__age`, `.growing-human__starter`, the compact lane, `.category-controls button`            |
| Brand mark                   | `.brand` + `.brand__mark`, `.quotes-header__brand`, `.growing-human__brand` + `__leaf`, `.about__brand`                                             |
| Site header and nav          | Landing (global SCSS), quotes, GH guide, GH about                                                                                                   |
| Theme toggle                 | Landing and quotes (identical markup, different CSS)                                                                                                |
| Numbered entry row           | `.practice-card`, `.influence`, `.anchor-row` + `.section-label`                                                                                    |
| Quote figure                 | `ng-template #quoteFigure` (quotes), `.influence__quote`, the dialog blockquote                                                                     |
| Dialog                       | Landing and quotes: the same `<dialog>` pattern, with styles split between global and component SCSS                                                |
| Notice / status / spinner    | `.quote-status`, `.quote-loading`, `.quote-spinner`, `.hero__visual-status`, `.growing-human__notice`, `.about__status`, `.growing-human__thinking` |
| Option card                  | `.growing-human__option`, `.growing-human__lane`                                                                                                    |
| Decorative motif             | 25+ `motif motif--sprig motif--<section>-<position>` spans                                                                                          |
| Page section shell           | Studio `section { padding: clamp(...) max(5%, calc((100% - 1280px)/2)) }`, repeated in quotes                                                       |
| Footer                       | Landing, quotes                                                                                                                                     |

### 1.3 Class-count risk (R3)

No element exceeds 5 classes today. That will change once the BEM classes are replaced with raw Tailwind. For example, the pill button needs about 12 utilities, and the hero grid needs about 8 plus responsive variants.

**Rule (decision 1):** an element that needs more than 5 utilities gets a custom class in its SCSS. The class is built with `@apply` for utility concerns and raw CSS for complex values. Current elements that will need a custom class:

- `.button`, `.theme-toggle`, `.growing-human__option`/`__lane`, `.growing-human__composer`, `.growing-human__send`, `.category-controls button`
- Hero, possibility, leadership and beyond grids (`grid-template-columns` with `minmax()`, gap `clamp()`, alignment, responsive collapse)
- Every `h1`/`h2` (font, size clamp, line height, letter spacing, margin, text-wrap)
- Motif spans (mask, size, opacity, absolute position, rotation and scale per instance). The base look becomes a custom class such as `ui-motif--sprig`. The 25+ one-off positions and transforms become data passed as inline style, not classes.

### 1.4 Accessibility and semantics findings (R4)

**Global**

- There is no skip link on any page.
- Focus rings are inconsistent: `#e35b33` 4 px offset (studio global), `var(--rose)` 3 px (GH). The quotes `.button:focus-visible` swaps colours only.
- The `prefers-reduced-motion` block is duplicated in `_base.scss` and `landing.scss`. The spinner animation (`quote-spin`) and the hero-image fade are not covered.
- Nav is set to `display: none` at ≤720 px on both studio pages. Mobile users lose all section navigation, and no menu replaces it.

**Studio landing**

- The decorative arrows in `.button` links (`<span>↘</span>`, `<span>↗</span>` in the hero and contact sections) are not `aria-hidden`, so screen readers announce "south east arrow".
- The theme toggle uses `aria-pressed` and also changes `aria-label` with the state. Use one pattern: a fixed label, "Dark mode", with `aria-pressed`.
- The hero, possibility, practice, leadership, beyond and contact `<section>`s have no accessible name (`aria-labelledby`), so they are not exposed as regions.
- Heading order inside `.influence`: source `p` → `blockquote` → `h3`. The heading should come first so that navigating by heading reaches the whole entry. Also, the `blockquote` has no `cite`/`figcaption`.
- The practice-card index `0{{index+1}}` is correctly hidden, but the list of cards is `div`s instead of a list (`ul`/`li`).
- The loading `role="status"` span inside `<figure>` is inserted conditionally. Live regions must exist before their content changes.
- The dialog uses `aria-labelledby="quote-dialog-title"`, but that id only exists while `selectedInfluence()` is set. Focus return to the trigger is not explicit.
- The footer text is two bare `span`s. That works, but `<p>` or `<small>` would be more meaningful.

**Studio quotes**

- `.category-controls` has `aria-label` on a plain `div` with no role, so the label is ignored. It needs `role="group"`. Alternatively, because only one option can be active, use a radio group, which gives better semantics than `aria-pressed` buttons.
- `.quote-tags` and `.author-list` are lists of `span`s. Use `ul`/`li`.
- The `aria-live` status paragraphs are created inside `@if`/`@else` branches, so they are not announced reliably. Use one persistent live region per async area.
- `.section-label > span` ("01") is not `aria-hidden`, while the matching numbers on the landing page are hidden. This is inconsistent.
- The anchor-row heading order has the same problem as `.influence`.
- The footer link "Back to the portfolio ↗" has an arrow that is not hidden.
- The error message shows users a developer path: "Edit `src/app/quotes/config.ts`". That path is also stale; config now lives in `libs/quote-data/src/lib/config.ts`.
- The hero `<section>` has no accessible name.

**Growing Human guide**

- `<nav>` contains the age badge and the "Start over" button. Nav landmarks should contain only navigation links, so these belong in a separate status or toolbar area.
- Age choice and lane choice are both single-select, but they are built from `button`s inside `fieldset`/`legend` (age) or with `aria-pressed` (lane). Use native `input type="radio"` styled as cards. This gives correct roles, arrow-key behaviour and a `fieldset`/`legend` that makes sense.
- `<ol role="log">` replaces the list semantics. Wrap the `ol` in a `div role="log" aria-live="polite"` and keep the `ol` as a list.
- In the chat step, the `h1` is styled as a kicker. That is visual only, but the page loses a visible title. Confirm this is intended.
- The custom `.growing-human__visually-hidden` class should be replaced by Tailwind's `sr-only`.
- `:focus { outline: none }` on the step headings is acceptable (`tabindex="-1"` programmatic focus). Keep it, but document why.
- Check the colour contrast of the placeholder `#8f90a0` on `#1c1d2b` and of the notice text `#aaa8b4` inside the dashed-border box at 13 px.

**Growing Human about**

- Mostly sound: correct `article`, `aside`, `dl` and heading structure. It still needs the shared header, skip link and focus ring.

---

## 2. Decisions (confirmed 2026-09-28)

1. **An element that needs more than 5 utilities gets a custom class, and its styling moves to SCSS.**
   - Give the element a semantic custom class (for example `ui-button--pill` or `landing__hero-grid`) and define it in the component's `.scss`.
   - Inside that class, write utility concerns with `@apply`, for example `@apply inline-flex items-center gap-5 rounded-full border px-5 py-3.5 text-sm font-semibold;`. Add raw CSS only for complex values (see decision 3).
   - Keep the element's total at 5 classes or fewer. A custom class may sit alongside a few Tailwind classes. Prefer moving all of an element's styling into the custom class rather than splitting it between the class and the template.
   - Do not create a custom class for elements that fit in 5 or fewer Tailwind classes. Those stay as plain utilities in the template.
2. **What counts toward the 5: Tailwind classes and custom classes combined.** Count:
   - static `class` tokens
   - `[class.x]` bindings
   - `[ngClass]` keys
   - each interpolated `class="{{…}}"` segment
   - host classes set through `host: { class }`, counted on the host element

   Responsive and state variants (`md:grid-cols-2`, `hover:bg-text`) each count as one class.

3. **SCSS holds the complex CSS that would be verbose as Tailwind.** Examples:
   - multi-stop gradients, and `mask` / `radial-gradient` motifs
   - `grid-template-columns` with `minmax()`, and fluid `clamp()` / `max(calc())` values
   - multi-property transitions and `@keyframes`
   - pseudo-elements (`::before` accent tabs, `::backdrop`, `::marker`, `::placeholder`)
   - `:host-context` theme switches, and palette mixins

   Simple utility values always go through Tailwind, either as template classes or through `@apply`. Examples: `padding: 16px`, `display: flex`, `font-weight: 600`.

4. **Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` replace 620/720/760/1000. A few px of layout drift at the edges is accepted.
5. **Library shape:** one `libs/ui` library with folder tiers (`atoms/`, `molecules/`, `organisms/`) and a **single** `@studio/ui` entry point.
6. **Brand theming:** each palette mixin (studio, studio-dark, growing-human) sets the same shared semantic CSS variables (`--color-surface`, `--color-text`, `--color-accent`, ...). Components read only those variables, so they work with either brand.

---

## 3. Target architecture

### 3.1 Library layout

```
libs/ui/
  project.json            # name: ui, tags: type:lib, scope:shared; test target (Karma)
  src/index.ts            # single public API (@studio/ui)
  src/lib/
    atoms/
      button/             # ui-button: variant pill|text|icon|solid; renders <button> or <a> (attribute selector)
      eyebrow/            # ui-eyebrow: tone default|accent|muted
      heading/            # ui-heading: level 1–4 (real h1–h4), size display|title|section|card|dialog
      text/               # ui-text: variant lede|body|muted|small
      chip/               # ui-chip: static <li> or toggle; size sm|md; outline|dashed
      icon/               # ui-icon: decorative glyph (↗ ↘ ↻ ↓ ↑ ☀ ☾ ×), always aria-hidden
      spinner/            # ui-spinner: animate-spin, motion-safe only
      brand/              # ui-brand: wordmark + mark variant dot|leaf
      motif/              # ui-motif: kind sprig|dots|rings, with position/rotation/scale inputs → inline style
      divider/            # ui-divider: top rule with accent tab (practice, influence, anchor)
      skip-link/          # ui-skip-link
    molecules/
      section-heading/    # eyebrow + heading + optional body (content projection)
      quote-figure/       # figure > blockquote + figcaption(author, cite); compact|feature
      numbered-entry/     # decorative number + projected content; tone input (replaces practice-card, influence, anchor-row)
      option-card/        # radio input styled as a card: label + hint (age, lane)
      choice-group/       # fieldset + legend + radio chips/cards (category controls, lanes, compact lanes)
      chip-list/          # ul of ui-chip (tags, authors, starters)
      status-message/     # persistent live region + optional spinner; state input
      notice/             # dashed info box (privacy, not-counsellor, about status)
      theme-toggle/       # ui-button icon + aria-pressed, fixed label
      nav-links/          # list of links inside <nav>, current-page handling (aria-current)
      chat-message/       # li with role-aware styling, sr-only speaker prefix, optional action
      composer/           # form + label + textarea + send button
    organisms/
      site-header/        # brand + nav + actions slot + mobile disclosure menu (button aria-expanded / aria-controls)
      site-footer/
      page-section/       # <section aria-labelledby> shell: tone/background, section padding, motif slot
      media-split/        # 2-col copy/figure grid, reversible, collapses under lg
      dialog/             # native <dialog> wrapper: showModal, labelledby wiring, backdrop close, focus return, Esc
      chat-thread/        # role="log" wrapper + ol of chat-message
```

Conventions:

- Standalone components, `ChangeDetectionStrategy.OnPush`, signal `input()`s, prefix `ui`.
- Prefer attribute selectors for native elements so the semantics are preserved: `button[ui-button]`, `a[ui-button]`, `h2[ui-heading]`. Use element selectors only when the component owns its markup.
- **Styling pattern:**
  - Elements that need 5 or fewer utilities use Tailwind classes directly in the template.
  - Elements that need more get a custom class, defined in the component SCSS with `@apply` plus any complex CSS (decision 1).
  - Variants map to one modifier class each (for example `ui-button ui-button--pill`), never to a long utility string.
- Custom class naming: `ui-<component>` and `ui-<component>--<variant>` in the library; `<page>__<element>` in apps.
- The library contains no copy and no app content. Content stays in `editorial-content` or the app content files.
- Each component has a spec that includes an axe-core check and a check that no rendered element has more than 5 classes.

Example of the pattern:

```scss
// libs/ui/src/lib/atoms/button/button.scss
.ui-button {
  @apply inline-flex items-center gap-5 font-sans text-sm font-semibold focus-ring;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease; // complex → raw CSS
}
.ui-button--pill {
  @apply rounded-full border border-current px-5 py-3.5 hover:-translate-y-0.5 hover:bg-text hover:text-surface;
}
.ui-button--text {
  @apply border-0 border-b border-current bg-transparent pb-1;
}
```

### 3.2 Tailwind foundation (`tailwind.config.cjs`)

- **Colours** mapped to the shared semantic CSS variables (decision 6): `canvas`, `surface`, `surface-soft`, `raised`, `text`, `muted`, `line`, `accent`, `accent-2`, `on-accent`, `focus`, `tone-sage`, `tone-butter`, `tone-coral`. Use the `rgb(var(--color-x) / <alpha-value>)` form so that opacity modifiers work.
- **Fluid spacing tokens**, so that the repeated `clamp()` and `max()` values can be used through `@apply` or in templates: `section` (`clamp(82px,10vw,150px)`), `section-sm`, `page` (`max(5%, calc((100% - 1280px)/2))`), `split` (`clamp(45px,7vw,110px)`).
- **Type scale** with bundled line height and letter spacing: `display`, `title`, `section`, `card`, `quote`, `quote-sm`, `lede`, `eyebrow`.
- **Screens:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` (decision 4).
- **Plugin utility:** `focus-ring`, one consistent `:focus-visible` outline used everywhere. Complex CSS such as the `minmax()` grid templates and the sprig mask stays in SCSS (decision 3).
- **`@apply` in component SCSS:** confirm in Phase 1 that `@angular/build` runs the root Tailwind config over component styles, and that `@apply` resolves with custom tokens there.
- Keep `preflight: false` for now, and add targeted resets (`ul`/`ol` list reset, `fieldset` reset, `button` font inherit) in `_base.scss` under `@layer base`. Revisit enabling preflight after migration.
- Content globs already cover `./libs/**`. Verify that `libs/ui` is picked up.

### 3.3 Tokens (`libs/design-tokens`)

- Add the shared semantic `--color-*` layer, set by every palette mixin: studio, studio-dark and growing-human. For example, GH `--ink-raised` → `--color-raised` and `--rose` → `--color-accent`; Studio `--coral` → `--color-accent`. Keep the existing names as aliases during migration, then remove them.
- Move every stray hex value from §1.1 into a palette. Document a contrast pair for each foreground/background combination and verify it meets AA.
- Keep landing-specific gradients (`--hero-bg`, `--practice-bg`, ...) as palette values. Components get them through a `tone` input on `page-section`.

---

## 4. Work

Each phase leaves the apps building and all tests green. Migrate one page per PR.

### Phase 0 — Guardrails first (warn mode)

- [ ] Add `@angular-eslint` with the template accessibility rules: `alt-text`, `elements-content`, `label-has-associated-control`, `interactive-supports-focus`, `click-events-have-key-events`, `mouse-events-have-key-events`, `role-has-required-aria`, `valid-aria`, `table-scope`, `no-autofocus`, `no-distracting-elements`, `button-has-type`, `prefer-control-flow`.
- [ ] Add a template rule, `max-classes-per-element`: at most 5 classes, Tailwind and custom combined, counted as described in decision 2. Implement it as a small custom angular-eslint rule that walks the template AST, not a regex source test.
- [ ] Add Stylelint (`stylelint-config-standard-scss`) with these rules:
  - `color-no-hex` outside `libs/design-tokens`.
  - For spacing, layout and typography properties, allow raw CSS only when the value is complex: `clamp(`, `calc(`, `max(`, `min(`, `minmax(`, `repeat(`, `var(`, gradients or masks. Anything simpler must be written with `@apply`.
- [ ] Add an `nx lint` target to `studio`, `growing-human` and `ui`. Run both linters in **warn** mode and save a baseline report.
- [ ] Add `axe-core` as a dev dependency and a shared `expectNoAxeViolations(fixture)` spec helper.

### Phase 1 — Tailwind and token foundation

- [ ] Extend `tailwind.config.cjs` as described in §3.2 (colours, spacing, type scale, screens, `focus-ring`).
- [ ] Add the semantic `--color-*` layer to all three palette mixins and move the stray hex values into them.
- [ ] Add global `@layer base` resets, the single focus ring, and one complete `prefers-reduced-motion` block (transitions, animations and smooth scroll) in `_base.scss`. Remove the duplicate from `landing.scss`.
- [ ] Spike: add one custom class in a component SCSS file that uses `@apply` with a custom token (for example `@apply py-section px-page text-display;`). Confirm it compiles in both apps and in Karma.
- [ ] Verify with `npm run build`: bundle and CSS budgets pass, and the current pages have no visual changes yet.

### Phase 2 — Library scaffold

- [ ] Create `libs/ui` (Nx Angular library, prefix `ui`), add the single `@studio/ui` path to `tsconfig.base.json`, and add the tags `type:lib`/`scope:shared`.
- [ ] Add `libs/ui/src/**/*.spec.ts` to the `test.include` of both apps, or give `ui` its own Karma `test` target and add it to `npm test`. Add `libs/design-tokens/src` to the `ui` style include paths.
- [ ] Add a `README.md` covering tiers, the component API rules, the 5-class rule and the custom-class + `@apply` pattern.

### Phase 3 — Atoms

- [ ] `button` (pill, text, icon, solid). Supports `<a>` and `<button>`, the disabled and busy states, and a trailing decorative icon slot.
- [ ] `eyebrow`, `heading` (real heading level separate from visual size), `text`.
- [ ] `chip`, `icon` (always `aria-hidden="true"`), `spinner` (`motion-safe:animate-spin`), `divider`.
- [ ] `brand` (dot and leaf marks), `motif` (kind modifier class + data-driven position via inline style; always `aria-hidden`, `pointer-events-none`).
- [ ] `skip-link` (`sr-only focus:not-sr-only`, targets `#main`).
- [ ] Specs: inputs map to the right modifier class, no rendered element has more than 5 classes, axe passes.

### Phase 4 — Molecules

- [ ] `section-heading`, `quote-figure` (feature and compact; `figcaption` with author and `cite`), `numbered-entry` (tone input; heading slot rendered before the quote).
- [ ] `option-card` and `choice-group` (native radios, `fieldset`/`legend`, visible focus, `:checked` styling through `peer-checked:`).
- [ ] `chip-list` (`ul`/`li`), `status-message` (persistent `role="status"` region whose content changes, never the region itself), `notice`.
- [ ] `theme-toggle` (fixed accessible name, `aria-pressed`), `nav-links` (`aria-current="page"` or `"location"`).
- [ ] `chat-message`, `composer` (visible or `sr-only` label, `maxlength` + character count announced near the limit, send button disabled state).

### Phase 5 — Organisms

- [ ] `site-header`: brand, `nav-links`, actions slot (theme toggle, age badge, reset). Below `md` the nav collapses into a disclosure button (`aria-expanded`, `aria-controls`) instead of `display: none`.
- [ ] `site-footer`, `page-section` (requires a `labelledBy` or `heading` input so that every section is a named region; tone/background; motifs projected behind the content), `media-split`.
- [ ] `dialog`: native `showModal()`, a stable title id, focus moved into the dialog on open and returned to the trigger on close, Esc and backdrop close, and `aria-modal` implied by the native element.
- [ ] `chat-thread`: a `div role="log" aria-live="polite" aria-relevant="additions"` around an `ol`.

### Phase 6 — Migrate Growing Human (pilot: smaller and self-contained)

- [ ] **About page:** `site-header`, `skip-link`, `heading`, `section-heading`, `notice`. Convert the helplines `dl` layout to Tailwind grid. Reduce `about.scss` to the palette `:host` plus any custom classes the page still needs.
- [ ] **Guide page:**
  - Move the age badge and "Start over" out of `<nav>` into the header actions slot.
  - Replace the age buttons and lane buttons with `choice-group` + `option-card` radios. Use a compact chip variant for the chat step.
  - Starters use `chip-list` with buttons.
  - Use `chat-thread`, `chat-message`, `composer`, `status-message` ("Thinking…") and `notice`.
  - Replace `growing-human__visually-hidden` with `sr-only`.
- [ ] Update `growing-human.spec.ts` for the radio semantics (select with `click` on the label or input and check `checked`, not `aria-pressed`). Add axe checks for the age, lane and chat steps.
- [ ] Reduce `growing-human.scss` to the palette, the background gradient, `::placeholder`, and custom classes for elements that need more than 5 utilities.

### Phase 7 — Migrate Studio

- [ ] **Quotes page:**
  - `site-header`, and `page-section` for each section (the hero gets `aria-labelledby`).
  - `quote-figure` replaces `ng-template #quoteFigure`.
  - `choice-group` (chip radios) for categories, and `chip-list` for tags and authors.
  - `status-message` as one persistent region per async area (daily, category, archive, authors).
  - `numbered-entry` for anchors (heading before quote), then `dialog` and `site-footer`.
  - Replace the developer-facing config message with user copy, and log the config hint to the console in dev mode only.
- [ ] **Landing page:**
  - `site-header`: move all `app-landing header/nav/brand/theme-toggle` rules out of the global `styles.scss`.
  - `page-section` + `media-split` for the hero, possibility and leadership sections.
  - `ui-motif` driven by a motif config array per section. This removes 25+ one-off classes.
  - `numbered-entry` in a `ul` for practice and influences.
  - `button` with `icon` for every arrow, and `dialog`.
  - Contact and work sections built from atoms.
- [ ] Move the `--hero-bg`, `--practice-bg`, ... gradients into `palettes.studio` / `studio-dark`. Keep only the `:host-context(html[data-theme='dark'])` switch in SCSS.
- [ ] Update `landing.spec.ts` and `quotes.spec.ts` for the new DOM, and add axe checks in light and dark themes.

### Phase 8 — Clean-up

- [ ] Delete the dead BEM classes and the global `quote-dialog`/`app-landing` styles from `apps/studio/src/styles.scss`. Global styles should import only `base` + `palettes`.
- [ ] Remove the legacy palette variable aliases.
- [ ] Remove unused images, if any were replaced by CSS motifs.
- [ ] Update `/memories/repo/conventions.md` and the READMEs with the UI library rules.

### Phase 9 — Enforce

- [ ] Switch `max-classes-per-element`, the angular-eslint a11y rules and the Stylelint rules (simple values must use `@apply`, and `color-no-hex`) from warn to **error**.
- [ ] Add `lint` to the `npm test` flow (or a `npm run verify` script that runs lint, test and build) so the rules cannot drift.
- [ ] Optional: add Nx module-boundary rules (`scope:studio` and `scope:growing-human` may depend on `scope:shared`; `ui` must not depend on apps or content libraries).

### Phase 10 — Verification

- [ ] `npm run build` and `npm test` are green, with no new budget warnings. Component SCSS must stay under the 10 kB `anyComponentStyle` budget; `@apply` output counts toward it.
- [ ] Lint is clean at error level: 0 elements over 5 classes, 0 simple utility values written as raw CSS, 0 template a11y errors.
- [ ] axe-core finds 0 violations on every page and state (landing light/dark, quotes loading/success/error, GH age/lane/chat, about, open dialogs).
- [ ] Manual checklist:
  - Keyboard-only walkthrough of every page: skip link, focus order, visible focus, dialog trap and return, radio arrow keys, mobile menu.
  - VoiceOver (Safari) and NVDA (Firefox) pass: landmarks, headings outline, live-region announcements, chat log.
  - Readable at 200% and 400% zoom / 320 px width without horizontal scroll.
  - `prefers-reduced-motion` removes the spinner rotation, image fade and smooth scroll.
  - Contrast of every token pair meets AA (4.5:1 text, 3:1 UI and focus indicators).
  - Windows High Contrast / forced-colors mode: borders and focus remain visible.
- [ ] Visual comparison before and after at `sm`, `md`, `lg` and `xl` for each page. Only the accepted breakpoint drift (decision 4) is allowed.

---

## 5. Risks and mitigations

| Risk                                                                        | Mitigation                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Custom classes grow into a second, hand-written design system               | Utility values inside them must use `@apply`, which Stylelint enforces, and raw CSS is allowed only for complex values. Library custom classes live next to their component. Review flags app-level custom classes that duplicate a library component. |
| `@apply` output inflates component CSS toward the 10 kB budget              | Shared primitives live in the library, so each rule is emitted once per component rather than once per page. Check the budgets on every PR.                                                                                                            |
| `@apply` does not resolve in component SCSS under `@angular/build` / Karma  | Phase 1 spike before any migration. Fallback: put the custom classes in a `@layer components` block of a shared global stylesheet in `libs/ui`.                                                                                                        |
| Modifier classes plus utilities exceed 5 on one element                     | Specs assert the rendered class count, and the lint rule checks `[class]` bindings where it can resolve them statically.                                                                                                                               |
| Changing to radios alters behaviour and tests for the GH age and lane steps | Migrate in the pilot phase, update the specs first, and keep the same signals (`selectAge`, `selectLane`).                                                                                                                                             |
| Visual regressions from converting `clamp()` values to tokens               | Tokens reuse the exact current values. Visual diff in Phase 10.                                                                                                                                                                                        |
| Preflight stays off, so native defaults leak into components                | Targeted `@layer base` resets. Revisit enabling preflight after migration.                                                                                                                                                                             |
