import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';


function digest(value) {
  return createHash('sha256').update(value).digest();
}

function privateResponse(response) {
  const result = new Response(response.body, response);
  result.headers.set('Cache-Control', 'private, no-store');
  result.headers.append('Vary', 'Authorization');
  return result;
}

export function withBasicAuth(app) {
  return {
    ...app,
    async fetch(request, env, context) {
      const username = env.AUTH_USERNAME ?? 'admin';
      const password = env.AUTH_PASSWORD;

      // Fail closed until the deployment's password has been configured.
      if (typeof password !== 'string' || !password || typeof username !== 'string' || !username || username.includes(':')) {
        return privateResponse(new Response('Site access is not configured.', { status: 503 }));
      }

      const authorization = request.headers.get('Authorization') ?? '';
      const match = /^Basic +([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
      const provided = Buffer.from(match?.[1] ?? '', 'base64');
      const expected = Buffer.from(`${username}:${password}`, 'utf8');

      // Hash both inputs so the timing-safe comparison always has equal lengths.
      if (!timingSafeEqual(digest(provided), digest(expected))) {
        return privateResponse(new Response('Authentication required.', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Black Reel", charset="UTF-8"',
          },
        }));
      }

      return privateResponse(await app.fetch(request, env, context));
    },
  };
}
