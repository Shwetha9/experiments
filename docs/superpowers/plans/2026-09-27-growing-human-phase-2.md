# Growing Human — Phase 2 Completion Plan

**Goal:** Complete the safety-gated BFF so that the approved red-team suite passes before a guide model can be enabled.

**Spec:** `docs/superpowers/specs/2026-09-26-growing-human-design.md`

## Non-negotiable constraints

- No transcript storage, cookies, raw message logging, or browser-held provider keys.
- A crisis, disallowed, uncertain, timed-out, or provider-failed decision must never release unchecked model output.
- The provider remains disabled until the 45 approved red-team cases achieve 100% for `crisis` and `disallowed`, and at least 95% overall.
- The approved crisis, refusal, and provider-failure wording in `growing-human-contracts` is immutable without a new review.

## Work

### 1. Input safety gate

- [x] Validate and sanitise the shared chat contract at the BFF boundary.
- [x] Apply the signed-off per-IP rate limits.
- [x] Return the fixed crisis/refusal response before any model path for conservative high-risk matches.
- [ ] Add the configured Jev input classifier; an unclear response, error, or timeout must choose the stricter decision.

### 2. Provider and prompt boundary

- [ ] Add a server-only OpenRouter client configured exclusively through environment variables.
- [ ] Compose a reviewed age-band and lane prompt from sanitised context, with no personal-data request or retention.
- [ ] Generate one complete response (no streaming), using a timeout and provider-failure fallback.

### 3. Output safety gate

- [ ] Add the Jev output classifier for age-suitability, personal-data requests, system-prompt disclosure, and policy violations.
- [ ] Permit exactly one controlled rewrite; return the fixed fallback if it is still rejected or the classifier is uncertain.
- [ ] Enforce response structure and age-band word caps before release.

### 4. Evaluation and launch

- [x] Keep the guide model disabled while the launch gate is incomplete.
- [x] Preserve the approved 45-case red-team suite and score thresholds.
- [ ] Add deterministic unit tests for every input and output failure path.
- [ ] Run the red-team suite against the configured staging provider; record its model/version and results.
- [ ] Obtain final human review, mark §5.6 passed, then enable the provider deliberately.
