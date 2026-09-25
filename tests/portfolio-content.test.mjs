import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const template = readFileSync(new URL('../src/app/app.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/app/app.scss', import.meta.url), 'utf8');
const globalStyles = readFileSync(new URL('../src/styles.scss', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

test('presents Shwetha as an ambitious principal engineer with a full creative life', () => {
  assert.match(template, /I build ambitious web systems/);
  assert.match(template, /Pink Floyd/);
  assert.match(template, /Madonna/);
  assert.match(template, /Carnatic music/);
  assert.match(template, /Chopin/);
  assert.match(template, /John Donne/);
  assert.match(template, /Charlotte Brontë/);
  assert.match(template, /NYFA/);
  assert.match(template, /poems and scripts/);
});

test('leads with engineering and removes the overly sentimental phrases', () => {
  const engineeringIndex = template.indexOf('id="engineering"');
  const servicesIndex = template.indexOf('id="notes"');

  assert.ok(engineeringIndex > -1);
  assert.ok(engineeringIndex < servicesIndex);
  assert.doesNotMatch(template, /For the softly curious/i);
  assert.doesNotMatch(template, /Come in gently/i);
  assert.doesNotMatch(template, /Made slowly, with feeling/i);
});

test('uses a sticky rounded header with safe anchor offsets', () => {
  assert.match(styles, /header\s*{[\s\S]*?position:\s*sticky;/);
  assert.match(styles, /header\s*{[\s\S]*?top:\s*0;/);
  assert.match(styles, /header\s*{[\s\S]*?backdrop-filter:\s*blur\(/);
  assert.match(styles, /section\[id\]\s*{[\s\S]*?scroll-margin-top:\s*110px;/);
});

test('keeps pastel cards luminous in dark mode and softens panel edges', () => {
  assert.match(styles, /--mint:\s*#bfe3dc;/);
  assert.match(styles, /--butter:\s*#f3d7a1;/);
  assert.match(styles, /--sky:\s*#cddbf0;/);
  assert.match(styles, /--blush:\s*#efc4c8;/);
  assert.doesNotMatch(styles, /--mint:\s*#1b4540;/);
  assert.match(styles, /\.card\s*{[\s\S]*?border-radius:\s*20px;/);
  assert.match(styles, /\.contact\s*{[\s\S]*?border-radius:\s*24px;/);
});

test('uses locally bundled Open Sans for the site interface', () => {
  assert.equal(typeof packageJson.dependencies['@fontsource/open-sans'], 'string');
  assert.match(globalStyles, /@fontsource\/open-sans\/400\.css/);
  assert.match(globalStyles, /@fontsource\/open-sans\/600\.css/);
  assert.match(globalStyles, /@fontsource\/open-sans\/700\.css/);
  assert.match(globalStyles, /font-family:\s*'Open Sans', sans-serif;/);
  assert.doesNotMatch(globalStyles, /Arial|Helvetica/);
  assert.doesNotMatch(styles, /Arial|Helvetica/);
});
