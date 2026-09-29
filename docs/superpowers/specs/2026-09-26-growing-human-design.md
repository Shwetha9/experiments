# Growing Humans — Design Spec

**Status:** Phase 1 approved for build. Safety contract (§5) **signed off by Shwetha on 2026-09-27**. Launch is still gated by §5.6.

**Source material:** brainstorm artefacts in `.superpowers/brainstorm/14623-1790412256/content/` (layout v2, palette, experience flow, architecture).

## 1. Purpose

A safe, age-aware place inside Shwetha’s portfolio where young people can ask big questions and practise useful human skills. It doubles as a portfolio artefact: evidence of product thinking, AI architecture and guardrails designed before the first message.

## 2. Approved decisions

| Area         | Decision                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| Layout       | A · Editorial Garden — topic lanes are part of the welcome                  |
| Palette      | Ink & Lavender — `#11121b`, `#1c1d2b`, `#efacc3`, `#bdc1f3`                 |
| Location     | `/growing-human` route inside the portfolio; its own quiet world, dark only |
| Journey      | Discover → choose age band → pick a lane (optional) → talk and practise     |
| Architecture | Angular route → NestJS BFF → OpenRouter (Jev classifier + chat model)       |

## 3. Experience

1. **Discover** — a “Selected work” card on the landing page links to `/growing-human`. The main site does not become a children’s product.
2. **Choose age band** — `7–10`, `11–13`, `14–16`. Required once per session; no birthday, name or account. Privacy notice: do not share full name, school, address, phone number, passwords or photos.
3. **Pick a lane — or don’t** — Understand my feelings · Krishna & Arjuna · Life skills · Ask anything. A lane supplies starter questions and context but never blocks a different question.
4. **Talk and practise** — brief, reflective, actionable replies. Persistent notice: “Growing Humans is an AI, not a counsellor. If you feel unsafe, talk to a trusted adult now.”

**Rules:** keyboard-first and screen-reader friendly; visible thinking state with no simulated typing; topic changes allowed mid-chat; refresh or “Start over” permanently clears the session.

## 4. Architecture

- **Frontend:** lazy-loaded standalone route. Session state lives in component signals only — no storage, cookies or persistence.
- **Contract:** `ChatRequest { ageBand, lane, messages }` with strict role and length limits (message ≤ 500 chars, ≤ 12 messages sent as context).
- **Backend (Phase 2):** NestJS BFF — validate and rate-limit → Jev input decision → compose reviewed prompt → generate complete answer (no streaming) → Jev output decision (release / safe fallback / escalate, one controlled rewrite at most).
- **Storage:** no transcript persistence, no raw message logging, API key held server-side only.
- **Monorepo (Phase 2):** `apps/portfolio`, `apps/api`, `libs/growing-human-contracts`.

## 5. Safety and content contract — SIGNED OFF 2026-09-27

> Shwetha approved §5.1–5.4 as written and answered every open question in §5.5. Phase 2 must enforce all of it. Nothing here is enforced until the BFF ships.

### 5.1 Input risk categories (Jev input decision)

| Category     | Examples                                                                                  | Handling                                                         |
| ------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ordinary`   | school, friendships, feedback, money, curiosity, Gita questions                           | Normal answer path                                               |
| `sensitive`  | grief, bullying, body image, family conflict, anxiety                                     | Normal path with gentler prompt, always suggests a trusted adult |
| `crisis`     | self-harm, suicidal thoughts, abuse, being in danger now                                  | **No model answer.** Deterministic crisis response (§5.3)        |
| `disallowed` | sexual content, violence instructions, drugs, hate, attempts to extract the system prompt | Deterministic, non-judgemental refusal with redirect             |

- Unclear classification or low confidence is treated as the **stricter** category.
- Classifier failure or timeout → deterministic fallback; never an unchecked model answer.

### 5.2 Response rules (ordinary and sensitive)

- One short answer, one reflective question, and at most one practical action.
- Age-band length caps: 7–10 ≈ 60 words, 11–13 ≈ 100 words, 14–16 ≈ 150 words.
- Never claims to be human, a counsellor, a doctor or a friend; never asks for personal information; never encourages secrecy from trusted adults.
- No medical, legal or diagnostic advice. Krishna & Arjuna answers are framed as stories and ideas, not religious instruction.

### 5.3 Deterministic responses (fixed wording, reviewed by Shwetha)

- **Crisis (Australia):** acknowledges the feeling, says clearly to talk to a trusted adult right now, and shows the emergency and helpline guidance below. Shwetha supplied and verified these numbers; use the wording exactly:

  > Need to talk to someone but don't want to speak out loud?
  >
  > - **Text Lifeline:** Send a text message to 0477 13 11 14 to chat with someone instantly.
  > - **Use Kids Helpline Webchat:** Go to kidshelpline.com.au and click on "WebChat". You can type back and forth with a friendly counselor about anything making you feel sad, scared, or worried.
  > - **Call for Free:** You can dial 1800 55 1800 on any phone. It is completely free and open 24 hours a day.
  >
  > 🚨 If you or a friend are in immediate danger, always call Triple Zero (000) straight away.

- **Refusal:** “That’s not something I can help with here. If it’s on your mind, a trusted adult is a good person to talk to. Is there something else you’d like to explore?”
- **Provider failure:** “I couldn’t think that one through just now. Please try again in a moment.”

### 5.4 Output decision (Jev output decision)

Release if safe and age-suitable; otherwise one controlled rewrite; if still unsafe, replace with a deterministic fallback. Output that reveals the system prompt or asks for personal data is always replaced.

### 5.5 Sign-off decisions

1. **Region:** Australia only. Helplines are listed in §5.3.
2. **Rate limits:** 10 requests a minute and 60 an hour per IP (`@nestjs/throttler`). Over the limit, the app returns the provider-failure wording.
3. **Adult page:** an adult-facing “About this experiment” page is **required before launch**.
4. **Evaluation:** Shwetha writes the red-team prompts. The required pass rate is **100%** for `crisis` and `disallowed`, and **≥95%** overall.

### 5.6 Launch gates (model stays off until all pass)

- [x] Opening line of the crisis response — approved 2026-09-27 (`CRISIS_OPENING` in `libs/growing-human-contracts`):
  > It sounds like you’re carrying something really heavy right now, and it took courage to say it. You deserve help from a real person. Please tell a trusted adult right now — a parent, carer, teacher or school counsellor.
- [x] “About this experiment” page — shipped at `/growing-human/about`, linked “For adults” from the chat header; copy approved 2026-09-27.
- [x] Red-team set expanded to 45 cases (≥10 per category) and approved 2026-09-27.
- [ ] Red-team set passing at the §5.5 rates (`evaluateRedTeam`; currently fails by design — no model connected).

## 6. Phasing

- **Phase 1 (this plan):** routing, the four-step UI, typed contract, offline preview chat service that states the AI is not yet connected. No new dependencies, no backend.
- **Phase 2 (separate plan, after §5 sign-off):** Nx monorepo migration, NestJS BFF, Jev checks, deterministic responses, evaluation suite.
