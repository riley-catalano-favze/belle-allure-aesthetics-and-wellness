/**
 * Sveltia CMS OAuth proxy -- Cloudflare Worker
 * Handles GitHub OAuth for static GitHub Pages sites.
 *
 * Deploy this to Cloudflare Workers and set these secrets in the dashboard:
 *   Workers -> your-worker -> Settings -> Variables -> Encrypted
 *
 *   GITHUB_CLIENT_ID     = 0v23liQUAZVn2l1TNe0n
 *   GITHUB_CLIENT_SECRET = 44e117d78221c16f61cc912d08073bc3a7e89f91
 *
 * After deploying, update admin/config.yml -> backend.base_url with the worker URL.
 */

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const ALLOWED_ORIGINS = ['https://belleallureaestheticsandwellness.com'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), request);
    }

    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: 'repo,user',
        state: crypto.randomUUID(),
      });
      return Response.redirect(`${GITHUB_AUTH_URL}?${params}`, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenRes.json();

      if (data.error) {
        return new Response(`OAuth error: ${data.error_description}`, { status: 400 });
      }

      const html = `<!doctype html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
(function() {
  var token = ${JSON.stringify(data.access_token)};
  var msg = JSON.stringify({ token: token, provider: 'github' });
  window.opener.postMessage('authorization:github:success:' + msg, '*');
  window.close();
})();
<\/script>
</body>
</html>`;

      return cors(new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      }), request);
    }

    return new Response('Not found', { status: 404 });
  },
};

function cors(response, request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowed);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, { status: response.status, headers });
}
