# Fetch Model via VRoid Hub API

This flow is more complex than static hosting because VRoid Hub requires OAuth.

> [!WARNING]
> You cannot call `/api/vrm/:avatar_id` first.
> You must complete OAuth once in a browser and get a refresh token.

## Overview

1. Get a client ID and client secret from the [VRoid Hub API](https://developer.vroid.com/api/).
2. Write the obtained client ID and client secret to `VROID_APP_ID` and `VROID_CLIENT_SECRET`.
3. Open `/api/auth` in your browser.
4. Sign in to VRoid Hub and approve access.
5. VRoid Hub redirects to `/api/auth/callback`.
6. The callback exchanges the authorization code for tokens.
7. Save the returned refresh token to environment variables or KV.
8. Now `/api/vrm/:avatar_id` can fetch JSON that contains a temporary download URL.

## Code Example

The following examples are based on the Worker code used by the referenced repository.

### `/api/auth`

```ts
interface Env {
  VROID_APP_ID: string;
  VROID_REFRESH_TOKEN?: string;
}

const USER_AGENT = 'Vroid Fetcher/1.0 (https://v.logue.dev)';

async function sha256Base64Url(plain: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function randomUrlSafe(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

export const onRequestGet: PagesFunction<Env> = async context => {
  const { env, request } = context;

  if (env.VROID_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: 'already_configured' }), { status: 409 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;
  const codeVerifier = randomUrlSafe(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomUrlSafe(32);

  const params = new URLSearchParams({
    client_id: env.VROID_APP_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'default',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const headers = new Headers({
    Location: `https://hub.vroid.com/oauth/authorize?${params.toString()}`,
    'X-Api-Version': '11',
    'User-Agent': USER_AGENT
  });

  headers.append(
    'Set-Cookie',
    `vroid_cv=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
  headers.append('Set-Cookie', `vroid_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  return new Response(null, { status: 302, headers });
};
```

### `/api/auth/callback`

```ts
interface Env {
  VROID_APP_ID: string;
  VROID_CLIENT_SECRET: string;
  TOKEN_STORE?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async context => {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code.', { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie') ?? '';
  const codeVerifier = cookieHeader.match(/(?:^|;\s*)vroid_cv=([^;]+)/)?.[1];
  const savedState = cookieHeader.match(/(?:^|;\s*)vroid_state=([^;]+)/)?.[1];

  if (!codeVerifier || savedState !== url.searchParams.get('state')) {
    return new Response('State mismatch or missing code_verifier.', { status: 400 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;

  const tokenRes = await fetch('https://hub.vroid.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'X-Api-Version': '11'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.VROID_APP_ID,
      client_secret: env.VROID_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  });

  const tokenData = (await tokenRes.json()) as { refresh_token?: string };
  if (!tokenRes.ok || !tokenData.refresh_token) {
    return new Response('Token exchange failed.', { status: 400 });
  }

  if (env.TOKEN_STORE) {
    await env.TOKEN_STORE.put('vroid_refresh_token', tokenData.refresh_token);
  }

  return new Response(`VROID_REFRESH_TOKEN=${tokenData.refresh_token}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
```

### `/api/vrm/:avatar_id`

```ts
interface Env {
  VROID_APP_ID: string;
  VROID_CLIENT_SECRET: string;
  VROID_REFRESH_TOKEN: string;
  TOKEN_STORE?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async context => {
  const { env } = context;
  const avatarId = context.params.avatar_id as string;
  const storedRefreshToken = await env.TOKEN_STORE?.get('vroid_refresh_token');
  const refreshToken = storedRefreshToken ?? env.VROID_REFRESH_TOKEN;

  const tokenRes = await fetch('https://hub.vroid.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'X-Api-Version': '11'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.VROID_APP_ID,
      client_secret: env.VROID_CLIENT_SECRET,
      refresh_token: refreshToken
    })
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; refresh_token?: string };
  if (tokenData.refresh_token && env.TOKEN_STORE) {
    await env.TOKEN_STORE.put('vroid_refresh_token', tokenData.refresh_token);
  }

  const accountModelsRes = await fetch('https://hub.vroid.com/api/account/character_models', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': USER_AGENT,
      'X-Api-Version': '11'
    }
  });

  const accountModelsData = (await accountModelsRes.json()) as {
    data?: Array<{ id?: string; character?: { id?: string } }>;
  };
  const matchedModel =
    accountModelsData.data?.find(model => model.character?.id === avatarId) ??
    accountModelsData.data?.[0];

  const licenseRes = await fetch('https://hub.vroid.com/api/download_licenses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'X-Api-Version': '11'
    },
    body: JSON.stringify({ character_model_id: matchedModel?.id })
  });

  const licenseData = (await licenseRes.json()) as { data?: { id?: string } };
  const downloadRes = await fetch(
    `https://hub.vroid.com/api/download_licenses/${licenseData.data?.id}/download`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': USER_AGENT,
        'X-Api-Version': '11'
      },
      redirect: 'manual'
    }
  );

  return Response.json({ url: downloadRes.headers.get('Location') });
};
```

## Required Environment Variables

- `VROID_APP_ID`
- `VROID_CLIENT_SECRET`

Optional:

- `VROID_REFRESH_TOKEN`
- `TOKEN_STORE` (Cloudflare KV binding for token rotation)

Notes:

- In VRoid terms, the application key corresponds to `VROID_APP_ID` (client ID).
- In VRoid terms, the secret key corresponds to `VROID_CLIENT_SECRET` (client secret).
- Write the obtained client ID and client secret to `VROID_APP_ID` and `VROID_CLIENT_SECRET`.
- `VROID_CLIENT_SECRET` is required for token exchange in callback and refresh flow.
- If TOKEN_STORE is configured, the latest refresh token is stored there and used first.

## VRoid Hub App Settings

Create an OAuth app in VRoid Hub developer settings and configure callback URL:

- Local: <http://127.0.0.1:8788/api/auth/callback> (or your local Worker URL)
- Production: <https://your-domain.example/api/auth/callback>

The callback URL must exactly match the URL used by the Worker.

## Browser Step (Mandatory)

Open this URL in your browser:

- `/api/auth`

What it does:

- Generates PKCE code_verifier / code_challenge.
- Generates state for CSRF protection.
- Stores both values in HttpOnly cookies.
- Redirects to VRoid Hub OAuth authorize endpoint.

After approval, VRoid Hub redirects to:

- `/api/auth/callback?code=...&state=...`

The callback endpoint validates state and code_verifier, then exchanges code for tokens.

## How to Get the Refresh Token

When callback succeeds, the response includes a line like:

- `VROID_REFRESH_TOKEN=xxxxxxxx`

Use this value as your initial refresh token.

If `TOKEN_STORE` is configured, the callback also stores the refresh token in KV.

## Call the Avatar Endpoint

After OAuth setup, call:

- `/api/vrm/{avatar_id}`

Example:

- `/api/vrm/your_avatar_id`

The endpoint flow is:

1. Load refresh token from KV (fallback to `VROID_REFRESH_TOKEN`).
2. Exchange refresh token for access token (and rotated refresh token).
3. Query account character models and find the model by `avatar_id`.
4. Issue a download license.
5. Get JSON from VRoid Hub that includes a temporary URL.
6. Return JSON: `{ "url": "..." }` to the client.

The client then calls `fetch(url)` and reads the VRM data as an `ArrayBuffer`.

## Typical Pitfalls

- Callback URL mismatch in VRoid Hub app settings.
- Calling `/api/vrm/:avatar_id` before completing `/api/auth` browser flow.
- Trying to open the temporary VRM URL directly in a browser instead of fetching it from the app.
- Missing `VROID_CLIENT_SECRET`.
- No `TOKEN_STORE` binding when relying on automatic refresh token rotation.

## Quick Test Sequence

1. Set `VROID_APP_ID` and `VROID_CLIENT_SECRET`.
2. Open `/api/auth` in browser and complete consent.
3. Confirm callback success and copy `VROID_REFRESH_TOKEN`.
4. Save token to env (or confirm KV write).
5. Call `/api/vrm/{avatar_id}`.
