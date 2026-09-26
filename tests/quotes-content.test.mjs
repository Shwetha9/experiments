import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const routes = readFileSync(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
const appConfig = readFileSync(new URL('../src/app/app.config.ts', import.meta.url), 'utf8');

test('registers a lazy quotes route with HTTP support', () => {
  assert.match(routes, /path: 'quotes'/);
  assert.match(routes, /quotes\/quotes/);
  assert.match(appConfig, /provideHttpClient/);
});

test('defines all API Ninjas quote capabilities', () => {
  const serviceUrl = new URL('../src/app/quotes/services/quote.service.ts', import.meta.url);
  assert.equal(existsSync(serviceUrl), true);

  const service = readFileSync(serviceUrl, 'utf8');
  assert.match(service, /quoteoftheday/);
  assert.match(service, /randomquotes/);
  assert.match(service, /'quotes'/);
  assert.match(service, /quoteauthors/);
  assert.match(service, /X-Api-Key/);
  assert.match(service, /Observable/);
  assert.doesNotMatch(service, /\bany\b/);
});

test('renders the separate quotes experience with daily, categories, browse, and authors', () => {
  const pageUrl = new URL('../src/app/quotes/quotes.html', import.meta.url);
  const contentUrl = new URL('../src/app/quotes/content/quote-anchors.ts', import.meta.url);
  assert.equal(existsSync(pageUrl), true);
  assert.equal(existsSync(contentUrl), true);

  const page = readFileSync(pageUrl, 'utf8');
  const content = readFileSync(contentUrl, 'utf8');
  assert.match(page, /Quote of the day/);
  assert.match(page, /Browse by category/);
  assert.match(page, /Three ideas I return to/);
  assert.match(page, /Authors/);
  assert.match(page, /aria-pressed/);
  assert.match(content, /John Donne/);
  assert.match(content, /Nathaniel Hawthorne/);
  assert.match(content, /Leonard Cohen/);
});
