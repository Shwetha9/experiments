import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const template = readFileSync(
  new URL('../apps/shwetha-portfolio/src/app/landing/landing.html', import.meta.url),
  'utf8',
);
const component = readFileSync(
  new URL('../apps/shwetha-portfolio/src/app/landing/landing.ts', import.meta.url),
  'utf8',
);
const documentTemplate = readFileSync(
  new URL('../apps/shwetha-portfolio/src/index.html', import.meta.url),
  'utf8',
);
const styles = readFileSync(
  new URL('../apps/shwetha-portfolio/src/app/landing/landing.scss', import.meta.url),
  'utf8',
);
const globalStyles = readFileSync(
  new URL('../apps/shwetha-portfolio/src/styles.scss', import.meta.url),
  'utf8',
);
const paletteStyles = `${globalStyles}\n${styles}`;
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const modelsUrl = new URL(
  '../apps/shwetha-portfolio/src/app/models/portfolio-content.ts',
  import.meta.url,
);
const landingContentUrl = new URL(
  '../apps/shwetha-portfolio/src/app/content/landing-content.ts',
  import.meta.url,
);
const archiveContentUrl = new URL(
  '../apps/shwetha-portfolio/src/app/content/archive-content.ts',
  import.meta.url,
);
const themeServiceUrl = new URL(
  '../apps/shwetha-portfolio/src/app/services/theme.service.ts',
  import.meta.url,
);

test('separates focused landing content from the writing archive', () => {
  assert.equal(existsSync(modelsUrl), true);
  assert.equal(existsSync(landingContentUrl), true);
  assert.equal(existsSync(archiveContentUrl), true);

  const models = readFileSync(modelsUrl, 'utf8');
  const landingContent = readFileSync(landingContentUrl, 'utf8');
  const archiveContent = readFileSync(archiveContentUrl, 'utf8');

  assert.match(models, /export interface LandingContent/);
  assert.match(
    landingContent,
    /title: 'I build ambitious web systems—and help teams grow into them\.'/,
  );
  assert.match(
    landingContent,
    /possibility:[\s\S]*?title: 'Some ideas stopped being impossible while we were busy planning them\.'/,
  );
  assert.match(landingContent, /The brief changed\. Engineering discipline did not\./);
  assert.doesNotMatch(landingContent, /poem|poetry|Shwetha-isms/i);
  assert.match(archiveContent, /A comma can change the entire mood/);
  assert.match(archiveContent, /Full-stack development/);
  assert.match(archiveContent, /Morning, unhurried/);
});

test('renders the focused possibility practice person narrative', () => {
  assert.match(component, /landingContent/);
  assert.match(template, /href="#possibility">Possibility/);
  assert.match(template, /routerLink="\/growing-human">Explore ambitions/);
  assert.match(template, /href="#practice">Practice/);
  assert.match(template, /href="#leadership">Leadership/);
  assert.match(template, /href="#beyond">Beyond/);
  assert.ok(template.indexOf('id="possibility"') < template.indexOf('id="practice"'));
  assert.ok(template.indexOf('id="practice"') < template.indexOf('id="leadership"'));
  assert.ok(template.indexOf('id="leadership"') < template.indexOf('id="beyond"'));
  assert.ok(template.indexOf('</section>') < template.indexOf('id="possibility"'));
});

test('keeps archive material off the landing page', () => {
  assert.doesNotMatch(template, /Shwetha-isms|A few poems|Morning, unhurried|Small instruction/);
  assert.doesNotMatch(
    template,
    /What I can do for you|What I can teach you|What I cannot teach you/,
  );
  assert.doesNotMatch(template, /I(?:’|')m Shwetha|I am Shwetha/i);
});

test('uses an editorial beyond section rather than three boxed columns', () => {
  const models = readFileSync(modelsUrl, 'utf8');
  const landingContent = readFileSync(landingContentUrl, 'utf8');

  assert.match(models, /export interface Influence/);
  assert.match(models, /readonly fullQuote: string;/);
  assert.match(landingContent, /John Donne · Meditation XVII/);
  assert.match(landingContent, /Nathaniel Hawthorne · The Custom-House/);
  assert.match(landingContent, /Leonard Cohen · Anthem/);
  assert.match(landingContent, /No man is an island, entire of itself/);
  assert.match(landingContent, /Human nature will not flourish/);
  assert.match(landingContent, /There is a crack in everything\./);
  assert.match(landingContent, /No one works alone\./);
  assert.match(landingContent, /Growth needs unfamiliar ground\./);
  assert.match(landingContent, /Imperfection lets possibility in\./);
  assert.match(landingContent, /extraordinary time to build software/);
  assert.match(landingContent, /be more ambitious together/);
  assert.doesNotMatch(landingContent, /That's how the light gets in/);
  assert.match(template, /class="beyond__influences"/);
  assert.match(template, /class="influence influence--\{\{ influence\.tone \}\}"/);
  assert.match(template, /<blockquote class="influence__quote">/);
  assert.match(template, /class="influence__link"[\s\S]*?\(click\)="openQuote\(influence\)"/);
  assert.match(template, /<dialog[\s\S]*?#quoteDialog[\s\S]*?class="quote-dialog"/);
  assert.match(template, /\(cancel\)="closeQuote\(\)"/);
  assert.match(component, /viewChild<ElementRef<HTMLDialogElement>>/);
  assert.match(component, /showModal\(\)/);
  assert.match(component, /\.close\(\)/);
  assert.match(globalStyles, /\.quote-dialog::backdrop/);
  assert.doesNotMatch(template, /beyond__coda/);
  assert.doesNotMatch(landingContent, /The rest of the shelf/);
  assert.match(styles, /\.beyond__influences\s*{[\s\S]*?display:\s*grid;/);
  assert.match(styles, /\.influence\s*{[\s\S]*?grid-template-columns:\s*70px minmax\(0, 1fr\);/);
  assert.doesNotMatch(styles, /\.influence:nth-child/);
  assert.match(styles, /\.influence__number/);
  assert.doesNotMatch(styles, /\.about__grid/);
});

test('uses the original theme-aware pastel palette with direct section boundaries', () => {
  assert.match(paletteStyles, /--surface:\s*#fffdfa;/);
  assert.match(paletteStyles, /--surface-soft:\s*#e8efea;/);
  assert.match(paletteStyles, /--mint:\s*#d5e9df;/);
  assert.match(paletteStyles, /--butter:\s*#f4e4ba;/);
  assert.match(paletteStyles, /html\[data-theme='dark'\] app-landing \.site\s*{[\s\S]*?--surface:\s*#20211e;/);
  assert.match(paletteStyles, /--hero-bg:\s*linear-gradient\(to bottom, var\(--surface\), var\(--surface-soft\)\)/);
  assert.match(paletteStyles, /--possibility-bg:\s*linear-gradient\(to bottom, var\(--surface-soft\), var\(--canvas\)\)/);
  assert.match(paletteStyles, /--leadership-bg:\s*linear-gradient\(to bottom, var\(--mint\), var\(--surface\)\)/);
  assert.match(paletteStyles, /--beyond-bg:\s*linear-gradient\(to bottom, var\(--surface\), var\(--surface-soft\)\)/);
  assert.match(paletteStyles, /--work-bg:\s*linear-gradient\(to bottom, var\(--surface-soft\), #e1ece5\)/);
  assert.match(paletteStyles, /--contact-bg:\s*linear-gradient\(to bottom, #e1ece5, var\(--surface-soft\)\)/);
  assert.doesNotMatch(styles, /\.beyond::after/);
  assert.match(styles, /\.practice-card\s*{[\s\S]*?border-left/);
  assert.doesNotMatch(styles, /border-radius:\s*18px/);
});

test('keeps theme switching accessible through html data-theme', () => {
  assert.match(template, /\[attr\.aria-pressed\]="isDark\(\)"/);
  assert.match(readFileSync(themeServiceUrl, 'utf8'), /documentElement\.dataset\['theme'\]/);
  assert.match(globalStyles, /html\[data-theme='dark'\] app-landing \.site/);
});

test('uses locally bundled Open Sans with editorial serif headings', () => {
  assert.equal(typeof packageJson.dependencies['@fontsource/open-sans'], 'string');
  assert.match(globalStyles, /@fontsource\/open-sans\/400\.css/);
  assert.match(globalStyles, /font-family:\s*'Open Sans', sans-serif;/);
  assert.match(globalStyles, /app-landing \.brand\s*{[\s\S]*?Georgia,\s*serif;/);
  assert.match(styles, /h1,\s*h2\s*{[\s\S]*?Georgia,\s*serif;/);
  assert.doesNotMatch(globalStyles, /Arial|Helvetica/);
});

test('keeps the full-width sticky header and broken-circle identity', () => {
  assert.match(globalStyles, /app-landing header\s*{[\s\S]*?position:\s*sticky;/);
  assert.match(globalStyles, /app-landing :is\(header, main, footer\)\s*{[\s\S]*?width:\s*100%;/);
  assert.doesNotMatch(globalStyles, /app-landing \.site\s*{[\s\S]*?overflow:\s*hidden/);
  assert.match(template, /<span class="brand__mark" aria-hidden="true"><\/span>/);
  assert.match(globalStyles, /app-landing \.brand__mark\s*{[\s\S]*?border:\s*1px dashed/);
});

test('keeps page content centered within a 1280px reading width', () => {
  assert.match(styles, /padding:\s*clamp\(82px, 10vw, 150px\) max\(5%, calc\(\(100% - 1280px\) \/ 2\)\)/);
  assert.match(globalStyles, /padding:\s*16px max\(5%, calc\(\(100% - 1280px\) \/ 2\)\)/);
  assert.match(globalStyles, /app-landing header\s*{[\s\S]*?1280px/);
});

test('keeps text readable over the pastel sections in either theme', () => {
  assert.match(styles, /\.practice\s*{[\s\S]*?color:\s*var\(--text\);/);
  assert.match(styles, /\.work\s*{[\s\S]*?color:\s*var\(--text\);/);
  assert.match(styles, /\.contact\s*{[\s\S]*?color:\s*var\(--text\);/);
  assert.match(styles, /\.leadership \.section-copy > p:not\(\.eyebrow\),[\s\S]*?\.leadership \.eyebrow\s*{[\s\S]*?color:\s*var\(--card-muted\);[\s\S]*?opacity:\s*1;/);
});

test('keeps editorial visuals below their source resolution', () => {
  assert.match(styles, /\.possibility \.editorial-visual\s*{[\s\S]*?max-width:\s*560px;/);
  assert.match(styles, /\.possibility h2\s*{[\s\S]*?font-size:\s*clamp\(38px, 3\.2vw, 58px\)/);
  assert.match(styles, /\.hero__visual\s*{[\s\S]*?max-width:\s*700px;/);
  assert.match(styles, /\.leadership \.editorial-visual\s*{[\s\S]*?max-width:\s*560px;/);
  assert.match(template, /src="\/images\/leadership-illustration\.svg"/);
});

test('uses the supplied hero illustration with an accessible loading state', () => {
  assert.match(template, /src="\/images\/hero-illustration\.png"/);
  assert.match(template, /\[attr\.aria-busy\]="!heroImageReady\(\)"/);
  assert.match(template, /\(load\)="markHeroImageReady\(\)"/);
  assert.match(component, /heroImageReady = signal\(false\)/);
  assert.match(component, /markHeroImageReady\(\)/);
  assert.match(styles, /\.hero__visual--loading/);
});

test('uses the supplied illustration for the What changed section', () => {
  assert.match(template, /src="\/images\/possibility-illustration\.png"/);
  assert.match(template, /alt="A woman arranging bright geometric building blocks beside a plant\."/);
});

test('routes to a privacy-first Growing Human preview that never fakes an AI answer', () => {
  const routes = readFileSync(
    new URL('../apps/shwetha-portfolio/src/app/app.routes.ts', import.meta.url),
    'utf8',
  );
  const page = readFileSync(
    new URL('../apps/shwetha-portfolio/src/app/growing-human/growing-human.ts', import.meta.url),
    'utf8',
  );
  const service = readFileSync(
    new URL(
      '../apps/shwetha-portfolio/src/app/growing-human/services/growing-human-chat.service.ts',
      import.meta.url,
    ),
    'utf8',
  );
  const content = readFileSync(
    new URL(
      '../apps/shwetha-portfolio/src/app/growing-human/content/growing-human-content.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(routes, /path: 'growing-human'[\s\S]*?loadComponent/);
  assert.match(routes, /path: 'growing-human\/about'[\s\S]*?GrowingHumanAboutPage/);
  assert.match(template, /routerLink="\/growing-human"/);
  assert.match(content, /Please don’t share your full name, school, address/);
  assert.match(content, /an AI, not a counsellor/);
  const bff = readFileSync(
    new URL('../apps/api/src/app/growing-human/growing-human.service.ts', import.meta.url),
    'utf8',
  );
  assert.match(bff, /return PREVIEW_REPLY;/);
  assert.match(service, /catchError\(\(\) => of\(PROVIDER_FAILURE_REPLY\)\)/);
  assert.doesNotMatch(service, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|document\.cookie/);
});

test('uses the coral broken-circle brand mark as the favicon', () => {
  const faviconUrl = new URL('../apps/shwetha-portfolio/public/favicon.svg', import.meta.url);

  assert.match(documentTemplate, /type="image\/svg\+xml" href="favicon\.svg"/);
  assert.equal(existsSync(faviconUrl), true);

  const favicon = readFileSync(faviconUrl, 'utf8');
  assert.match(favicon, /stroke="#df6f52"/);
  assert.match(favicon, /stroke-dasharray=/);
  assert.doesNotMatch(favicon, /<text|Angular/i);
});
