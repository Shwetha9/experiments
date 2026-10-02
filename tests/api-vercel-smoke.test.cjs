const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const test = require('node:test');

// Exercise the compiled entry point Vercel imports, not just Nest source modules.
test('built Vercel handler serves chat, quotes, and STEAM routes', { timeout: 10000 }, async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.API_NINJAS_API_KEY;
  const originalSteamFlag = process.env.GROWING_HUMAN_ENABLE_STEAM_AI;
  process.env.API_NINJAS_API_KEY = 'artifact-test-key';
  process.env.GROWING_HUMAN_ENABLE_STEAM_AI = 'false';
  const fixture = [{ quote: 'A test quote.', author: 'Test author', categories: ['wisdom'] }];
  let providerCalls = 0;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('https://images-api.nasa.gov/search?')) {
      return new Response(JSON.stringify({ collection: { items: [{
        data: [{ nasa_id: 'PIA08712', title: 'Rover Tracks on Mars', date_created: '2007-01-01' }],
        links: [{ render: 'image', href: 'https://images-assets.nasa.gov/image/PIA08712/PIA08712~thumb.jpg' }],
      }] } }), { headers: { 'content-type': 'application/json' } });
    }
    assert.equal(String(url), 'https://api.api-ninjas.com/v2/randomquotes?categories=wisdom');
    assert.equal(options.headers['X-Api-Key'], 'artifact-test-key');
    providerCalls++;
    return new Response(JSON.stringify(fixture), {
      headers: { 'content-type': 'application/json' },
    });
  };

  let server;
  try {
    const handler = require('../api/index.js');
    assert.equal(typeof handler, 'function', 'Vercel must receive a callable handler');
    server = http.createServer((req, res) => {
      Promise.resolve(handler(req, res)).catch((error) => {
        res.statusCode = 500;
        res.end(String(error));
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Cold start reaches Nest validation without making a live AI request.
    const chat = await originalFetch(`${baseUrl}/api/growing-human/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(chat.status, 400);
    assert.equal((await chat.json()).message, 'Invalid chat request');

    // A warm invocation reaches the Quotes provider boundary. Vercel's
    // `/api/:path*` rewrite appends `path=` to the query, so mimic that here.
    const quotes = await originalFetch(
      `${baseUrl}/api/quotes/randomquotes?categories=wisdom&path=quotes%2Frandomquotes`,
    );
    assert.equal(quotes.status, 200);
    assert.deepEqual(await quotes.json(), fixture);
    assert.equal(providerCalls, 1);

    const gallery = await originalFetch(
      `${baseUrl}/api/growing-human/steam/gallery?theme=mars&page=1&path=growing-human%2Fsteam%2Fgallery`,
    );
    assert.equal(gallery.status, 200);
    assert.equal((await gallery.json()).images[0].id, 'PIA08712');

    const mission = await originalFetch(`${baseUrl}/api/growing-human/steam/mission`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ageBand: '11-13', theme: 'mars', page: 1, imageId: 'PIA08712',
        lens: 'engineering', notice: 'pattern', remix: 0,
      }),
    });
    assert.equal(mission.status, 200);
    assert.equal((await mission.json()).source, 'starter');
  } finally {
    if (server?.listening) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.API_NINJAS_API_KEY;
    else process.env.API_NINJAS_API_KEY = originalKey;
    if (originalSteamFlag === undefined) delete process.env.GROWING_HUMAN_ENABLE_STEAM_AI;
    else process.env.GROWING_HUMAN_ENABLE_STEAM_AI = originalSteamFlag;
  }
});
