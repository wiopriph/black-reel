import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { withBasicAuth } from '../cloudflare/auth.mjs';


const env = { AUTH_USERNAME: 'admin', AUTH_PASSWORD: 'test-password:with-colon' };

function request(path = '/', credentials, scheme = 'Basic') {
  const headers = credentials === undefined ? {} : {
    Authorization: `${scheme} ${Buffer.from(credentials).toString('base64')}`,
  };
  return new Request(`https://kino.example${path}`, { headers });
}

test('denies pages, API and static assets before calling the application', async () => {
  const worker = withBasicAuth({ fetch() { assert.fail('Unauthenticated request reached the app'); } });
  for (const path of ['/', '/movies/1', '/api/movies', '/api/filters', '/_nuxt/app.js', '/favicon.ico']) {
    for (const credentials of [undefined, 'admin:wrong', 'other:test-password:with-colon', 'admin:']) {
      const response = await worker.fetch(request(path, credentials), env, {});
      assert.equal(response.status, 401);
      assert.match(response.headers.get('WWW-Authenticate'), /^Basic /);
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    }
  }
});

test('missing password keeps the deployment closed', async () => {
  const worker = withBasicAuth({ fetch() { assert.fail('Unconfigured deployment reached the app'); } });
  for (const password of [undefined, '']) {
    const response = await worker.fetch(request('/', 'admin:'), { AUTH_PASSWORD: password }, {});
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
});

test('malformed headers do not throw or authorize a request', async () => {
  const worker = withBasicAuth({ fetch() { assert.fail('Malformed credentials reached the app'); } });
  for (const authorization of ['Bearer token', 'Basic', 'Basic !!!!', 'Basic YQ==', 'Basic Og==']) {
    const req = new Request('https://kino.example', { headers: { Authorization: authorization } });
    assert.equal((await worker.fetch(req, env, {})).status, 401);
  }
});

test('valid UTF-8 credentials pass through, preserving response and preventing shared caching', async () => {
  const unicodeEnv = { AUTH_USERNAME: 'зритель', AUTH_PASSWORD: 'пароль:🎬' };
  const req = request('/api/movies', 'зритель:пароль:🎬', 'basic');
  const context = {};
  const worker = withBasicAuth({
    fetch(actualRequest, actualEnv, actualContext) {
      assert.equal(actualRequest, req);
      assert.equal(actualEnv, unicodeEnv);
      assert.equal(actualContext, context);
      return new Response('private catalogue', {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=3600', Vary: 'Accept-Encoding', 'X-App': 'ok' },
      });
    },
  });
  const response = await worker.fetch(req, unicodeEnv, context);
  assert.equal(await response.text(), 'private catalogue');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('X-App'), 'ok');
  assert.match(response.headers.get('Vary'), /Accept-Encoding/);
  assert.match(response.headers.get('Vary'), /Authorization/);
});

test('password rotation rejects previously valid credentials', async () => {
  const worker = withBasicAuth({ fetch() { return new Response('ok'); } });
  const req = request('/', `admin:${env.AUTH_PASSWORD}`);
  assert.equal((await worker.fetch(req, env, {})).status, 200);
  assert.equal((await worker.fetch(req, { ...env, AUTH_PASSWORD: 'new-password' }, {})).status, 401);
});
