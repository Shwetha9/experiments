import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const routes = readFileSync(new URL('../apps/shwetha-portfolio/src/app/app.routes.ts', import.meta.url), 'utf8');
const appConfig = readFileSync(new URL('../apps/shwetha-portfolio/src/app/app.config.ts', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../apps/shwetha-portfolio/src/app/landing/landing.html', import.meta.url), 'utf8');

test('registers a lazy quotes route with HTTP support', () => {
  assert.match(routes, /path: 'quotes'/);
  assert.match(routes, /quotes\/quotes/);
  assert.match(appConfig, /provideHttpClient/);
  assert.match(landing, /routerLink="\/quotes">Quotes<\/a>/);
});

test('defines all API Ninjas quote capabilities', () => {
  const serviceUrl = new URL('../apps/shwetha-portfolio/src/app/quotes/services/quote.service.ts', import.meta.url);
  assert.equal(existsSync(serviceUrl), true);

  const service = readFileSync(serviceUrl, 'utf8');
  assert.match(service, /quoteApiConfig\.proxyUrl/);
  assert.match(service, /quoteoftheday/);
  assert.match(service, /randomquotes/);
  assert.match(service, /'quotes'/);
  assert.match(service, /quoteauthors/);
  assert.doesNotMatch(service, /X-Api-Key/);
  assert.doesNotMatch(service, /safe:\s*'true'/);
  assert.match(service, /Observable/);
  assert.doesNotMatch(service, /\bany\b/);
});

test('renders the separate quotes experience with daily, categories, browse, and authors', () => {
  const pageUrl = new URL('../apps/shwetha-portfolio/src/app/quotes/quotes.html', import.meta.url);
  const contentUrl = new URL('../apps/shwetha-portfolio/src/app/quotes/content/quote-anchors.ts', import.meta.url);
  assert.equal(existsSync(pageUrl), true);
  assert.equal(existsSync(contentUrl), true);

  const page = readFileSync(pageUrl, 'utf8');
  const content = readFileSync(contentUrl, 'utf8');
  assert.match(page, /Quote of the day/);
  assert.match(page, /Browse by category/);
  assert.match(page, /Three ideas I return to/);
  assert.match(page, /Authors/);
  assert.match(page, /href="#authors">Authors<\/a>/);
  assert.match(page, /id="authors"/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /browseQuotes\(\)/);
  assert.match(page, /browseState\(\) === 'loading'/);
  assert.match(page, /Browse deterministic results/);
  assert.match(page, /aria-hidden="true">↓<\/span>/);
  assert.ok(page.indexOf('id="browse"') < page.indexOf('id="anchors"'));
  assert.match(page, /src\/app\/quotes\/config\.ts/);
  const styles = readFileSync(new URL('../apps/shwetha-portfolio/src/app/quotes/quotes.scss', import.meta.url), 'utf8');
  assert.match(styles, /\.anchor-row\s*{[\s\S]*?position:\s*relative;/);
  assert.match(styles, /\.anchor-row::before\s*{[\s\S]*?position:\s*absolute;/);
  assert.match(styles, /\.browse__loading\s*{[\s\S]*?display:\s*flex;/);
  assert.match(styles, /\.browse__results blockquote::before/);
  assert.match(content, /John Donne/);
  assert.match(content, /Nathaniel Hawthorne/);
  assert.match(content, /Leonard Cohen/);
});
