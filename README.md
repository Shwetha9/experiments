# ShwethaPortfolio

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.0.

## Growing Humans guide API

The Nest API owns the guide model and its safety checks. It is deliberately disabled by default; with no configuration, `/api/growing-human/chat` returns the reviewed preview reply. Copy `.env.example` to `.env` on the server and set the three `OPENROUTER_*` values only for an approved staging evaluation. The key must never be placed in the Angular app or committed.

Before setting `GROWING_HUMAN_ENABLE_GUIDE=true`, run and document the approved red-team evaluation, obtain the required human review, and complete the launch gates in [the Growing Humans design spec](docs/superpowers/specs/2026-09-26-growing-human-design.md). The flag is an operational release control, not approval to bypass those gates.

The Discover activity uses NASA's [EPIC natural-colour API](https://epic.gsfc.nasa.gov/about/api) for the latest available Earth image. The browser requests public NASA metadata directly; EPIC supports cross-origin requests and needs no API key. The app validates the image name and date before constructing the image URL. If NASA is unavailable, the activity shows a fallback and the reviewed space facts and quizzes continue to work.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Quotes API

The Angular app calls the same-origin `/api/quotes/*` proxy. Add
`API_NINJAS_API_KEY` to Vercel (and to `.env` for local API use); the Nest API
passes it to API Ninjas and the browser never receives it. Re-deploy after
changing the Vercel environment variable. The live daily and category requests
use API Ninjas' free-tier-compatible parameters; its author catalogue and
pagination are premium API features.

## Growing Humans Knowledge Explorer

The same `API_NINJAS_API_KEY` is used by `/api/growing-human/knowledge`. The
server requests random Facts for “Surprise me” and category-specific Trivia for
the other topics. It always asks API Ninjas for `safe=true`. API Ninjas marks
both the safety filter and Trivia category filter as premium features, so a free
key returns reviewed in-app picks instead. The browser never sees the key.
There are several reviewed picks per category so “Scout another” still works
when the premium filters or API are unavailable. Notes and the discovery trail
stay in memory for the current visit only.

## Growing Humans STEAM Lab

The third activity tab is a NASA image investigation. The API fetches curated topic searches
from the public [NASA Image and Video Library](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf),
validates image metadata and caches each page briefly. Kids choose an image, what they notice,
and a science, technology, engineering, art or maths lens. They can make and remix a mission,
mark it tried, and save up to eight missions in memory for the visit. The old `/growing-human/lab`
URL still opens the same experience.

The browser sends only an age band and fixed selection IDs to `/api/growing-human/steam/mission`.
No child-authored text, names or location are sent to OpenRouter. OpenRouter returns a short
structured activity. The server validates the JSON and Jev must choose release with a strong
release probability and low block probability. It tries one new idea if the first fails review;
otherwise it returns a clearly labelled starter mission. AI requires the server-only
`OPENROUTER_API_KEY`, `OPENROUTER_CHAT_MODEL` and `OPENROUTER_JEV_MODEL`. Set
`GROWING_HUMAN_ENABLE_STEAM_AI=false` to disable it independently of the guide.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
