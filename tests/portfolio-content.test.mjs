import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const template = readFileSync(new URL('../src/app/landing/landing.html', import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/app/landing/landing.ts', import.meta.url), 'utf8');
const documentTemplate = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/app/landing/landing.scss', import.meta.url), 'utf8');
const globalStyles = readFileSync(new URL('../src/styles.scss', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const modelsUrl = new URL('../src/app/models/portfolio-content.ts', import.meta.url);
const landingContentUrl = new URL('../src/app/content/landing-content.ts', import.meta.url);
const archiveContentUrl = new URL('../src/app/content/archive-content.ts', import.meta.url);
const themeServiceUrl = new URL('../src/app/services/theme.service.ts', import.meta.url);

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

test('uses a warm restrained dark palette', () => {
  assert.match(styles, /--canvas:\s*#171816;/);
  assert.match(styles, /--surface:\s*#20211e;/);
  assert.match(styles, /--text:\s*#f3efe5;/);
  assert.match(styles, /--mint:\s*#b8d3c5;/);
  assert.match(styles, /--butter:\s*#ddc79b;/);
  assert.match(styles, /--coral:\s*#dc8067;/);
  assert.doesNotMatch(styles, /#cddbf0|#efc4c8/);
});

test('keeps theme switching accessible through html data-theme', () => {
  assert.match(template, /\[attr\.aria-pressed\]="isDark\(\)"/);
  assert.match(readFileSync(themeServiceUrl, 'utf8'), /documentElement\.dataset\['theme'\]/);
  assert.match(styles, /:host-context\(html\[data-theme='dark'\]\)/);
});

test('uses locally bundled Open Sans with editorial serif headings', () => {
  assert.equal(typeof packageJson.dependencies['@fontsource/open-sans'], 'string');
  assert.match(globalStyles, /@fontsource\/open-sans\/400\.css/);
  assert.match(globalStyles, /font-family:\s*'Open Sans', sans-serif;/);
  assert.match(styles, /\.brand\s*{[\s\S]*?Georgia,\s*serif;/);
  assert.match(styles, /h1,\s*h2\s*{[\s\S]*?Georgia,\s*serif;/);
  assert.doesNotMatch(globalStyles, /Arial|Helvetica/);
});

test('keeps the full-width sticky header and broken-circle identity', () => {
  assert.match(styles, /header\s*{[\s\S]*?position:\s*sticky;/);
  assert.match(styles, /header,\s*main,\s*footer\s*{[\s\S]*?width:\s*100%;/);
  assert.match(template, /<span class="brand__mark" aria-hidden="true"><\/span>/);
  assert.match(styles, /\.brand__mark\s*{[\s\S]*?border:\s*1px dashed/);
});

test('keeps editorial visuals below their source resolution', () => {
  assert.match(styles, /\.possibility \.editorial-visual\s*{[\s\S]*?max-width:\s*560px;/);
  assert.match(styles, /\.possibility h2\s*{[\s\S]*?font-size:\s*clamp\(38px, 3\.2vw, 58px\)/);
  assert.match(styles, /\.hero__visual\s*{[\s\S]*?max-width:\s*700px;/);
  assert.match(styles, /\.leadership \.editorial-visual\s*{[\s\S]*?max-width:\s*560px;/);
});

test('routes to a privacy-first Growing Human preview that never fakes an AI answer', () => {
  const routes = readFileSync(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
  const page = readFileSync(
    new URL('../src/app/growing-human/growing-human.ts', import.meta.url),
    'utf8',
  );
  const service = readFileSync(
    new URL('../src/app/growing-human/services/growing-human-chat.service.ts', import.meta.url),
    'utf8',
  );
  const content = readFileSync(
    new URL('../src/app/growing-human/content/growing-human-content.ts', import.meta.url),
    'utf8',
  );

  assert.match(routes, /path: 'growing-human'[\s\S]*?loadComponent/);
  assert.match(template, /routerLink="\/growing-human"/);
  assert.match(content, /Please don’t share your full name, school, address/);
  assert.match(content, /an AI, not a counsellor/);
  assert.match(service, /kind: 'preview'/);
  assert.doesNotMatch(service, /HttpClient|fetch\(|localStorage|sessionStorage/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|document\.cookie/);
});

test('uses the coral broken-circle brand mark as the favicon', () => {
  const faviconUrl = new URL('../public/favicon.svg', import.meta.url);

  assert.match(documentTemplate, /type="image\/svg\+xml" href="favicon\.svg"/);
  assert.equal(existsSync(faviconUrl), true);

  const favicon = readFileSync(faviconUrl, 'utf8');
  assert.match(favicon, /stroke="#df6f52"/);
  assert.match(favicon, /stroke-dasharray=/);
  assert.doesNotMatch(favicon, /<text|Angular/i);
});
