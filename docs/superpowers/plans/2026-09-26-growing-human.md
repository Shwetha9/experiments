# Growing Human — Phase 1 Implementation Plan

**Status:** Complete. Phase 2 is tracked in `2026-09-27-growing-human-phase-2.md`.

**Goal:** Ship the `/growing-human` route with the complete four-step child journey, running on an offline preview chat service. No model calls.

**Spec:** `docs/superpowers/specs/2026-09-26-growing-human-design.md`

## Global Constraints

- No new dependencies, no backend, no persistence (no storage, cookies or logging of messages).
- The preview service must say plainly that the AI is not yet connected — never fake an AI answer.
- Ink & Lavender palette, Georgia headings, Open Sans body.
- Semantic HTML, keyboard-first, `aria-live` thinking state, no simulated typing.
- Existing landing tests must keep passing.

### Task 1: Introduce routing without changing the landing page

- [x] Move the landing component from `src/app/app.*` to `src/app/landing/landing.*` (`LandingPage`).
- [x] Reduce `App` to a `<router-outlet />` shell; add `src/app/app.routes.ts` with lazy routes `''` → `LandingPage`, `growing-human` → `GrowingHumanPage`, `**` → redirect to `''`.
- [x] Register `provideRouter(routes)` in `app.config.ts`.
- [x] Update the paths in `tests/portfolio-content.test.mjs` and move `app.spec.ts` to `landing/landing.spec.ts`.

### Task 2: Typed contract and content

- [x] `src/app/growing-human/models/growing-human.ts`: `AgeBand`, `TopicLane`, `ChatMessage`, `ChatRequest`, `ChatReply`.
- [x] `src/app/growing-human/content/growing-human-content.ts`: age bands, lanes with starter questions, notices, limits.

### Task 3: Preview chat service

- [x] `src/app/growing-human/services/growing-human-chat.service.ts`: `reply(request): Observable<ChatReply>`, an offline preview that returns the fixed “not connected yet” message.

### Task 4: Growing Human page

- [x] `growing-human.ts/.html/.scss`: steps are derived from signals (`ageBand`, `messages`); the lane is changeable mid-chat; “Start over” clears everything.
- [x] Chat log `role="log"`, thinking state announced with `aria-live="polite"`, message `maxlength` enforced.

### Task 5: Discover card on the landing page

- [x] Add a “Selected work” section before `#contact` that links to `/growing-human`.

### Task 6: Verify

- [x] One content test covering the route, privacy notice and preview-only service.
- [x] Run `npm run test:content` and `npm run build`. The repo has no `lint` script, so record that.
