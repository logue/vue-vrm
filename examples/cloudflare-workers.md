# Host Model Files via Cloudflare R2 + Workers

This flow is simpler than the VRoid Hub OAuth setup, but the client side pattern is similar: the app fetches a file URL and reads the response as an `ArrayBuffer`.

You should not treat the asset endpoint as a page to open in the browser.
The Worker validates the request, streams the object from R2, and returns bytes to `fetch()`.

## Overview

1. Create an R2 bucket and upload VRM files.
2. Configure a Worker with an R2 binding.
3. Expose an internal asset route such as /assets/\*.
4. Fetch the asset URL from the app and read it as an `ArrayBuffer`.

## Required Environment Variables

- `VRM_BUCKET`

Optional:

- `ALLOWED_ORIGINS`

Notes:

- `VRM_BUCKET` is the R2 binding name used by the Worker.
- `ALLOWED_ORIGINS` is a comma-separated allowlist of exact origins.
- If `ALLOWED_ORIGINS` is omitted, same-origin requests are allowed.

## R2 Bucket Setup

Create a bucket, for example vrm-assets, then upload your VRM files.

Example object keys:

- avatars/AvatarSample_A.vrm
- characters/Hero.vrm

## Worker Settings

wrangler.toml:

```toml
name = "vrm-assets-worker"
main = "src/index.ts"
compatibility_date = "2026-05-22"

[[r2_buckets]]
binding = "VRM_BUCKET"
bucket_name = "vrm-assets"

[vars]
# Comma-separated exact origins.
# If omitted, only same-origin requests are allowed.
ALLOWED_ORIGINS = "http://localhost:5173,https://your-app.example"
```

Example addresses:

- R2 bucket: `vrm-assets`
- Local Worker URL: `http://127.0.0.1:8787/assets/avatars/AvatarSample_A.vrm`
- Production Worker URL: `https://your-worker.example/assets/avatars/AvatarSample_A.vrm`
- App-side fetch target: `fetch('https://your-worker.example/assets/avatars/AvatarSample_A.vrm')`

Official docs:

- Cloudflare R2: <https://developers.cloudflare.com/r2/>
- Cloudflare Workers: <https://developers.cloudflare.com/workers/>

## Worker Implementation

src/index.ts:

```ts
export interface Env {
  VRM_BUCKET: R2Bucket;
  ALLOWED_ORIGINS?: string;
}

const ALLOWED_FILE_RE = /^[\w()\s-][\w()\s/.-]*\.(vrm)$/i;

function resolveAllowedOrigin(
  requestOrigin: string | null,
  env: Env,
  pageOrigin: string
): string | null {
  if (!requestOrigin) return pageOrigin;

  const raw = env.ALLOWED_ORIGINS?.trim();
  if (raw) {
    const whitelist = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return whitelist.includes(requestOrigin) ? requestOrigin : null;
  }

  return requestOrigin === pageOrigin ? pageOrigin : null;
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin'
  };
}

function parseRange(rangeHeader: string): { offset: number; length?: number } | null {
  const match = /^bytes=(\d+)-(\d+)?$/i.exec(rangeHeader.trim());
  if (!match) return null;

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : undefined;
  if (!Number.isFinite(start) || start < 0) return null;
  if (end !== undefined && (!Number.isFinite(end) || end < start)) return null;

  return end !== undefined ? { offset: start, length: end - start + 1 } : { offset: start };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const allowed = resolveAllowedOrigin(request.headers.get('Origin'), env, url.origin);
      if (!allowed) return new Response(null, { status: 403 });

      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(allowed),
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const allowed = resolveAllowedOrigin(request.headers.get('Origin'), env, url.origin);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const key = decodeURIComponent(url.pathname.replace(/^\/assets\//, ''));

    if (!key || key.includes('..') || !ALLOWED_FILE_RE.test(key)) {
      return new Response(JSON.stringify({ error: 'Invalid file parameter', key }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(allowed) }
      });
    }

    const rangeHeader = request.headers.get('Range');
    const range = rangeHeader ? parseRange(rangeHeader) : null;
    if (rangeHeader && !range) {
      return new Response('Invalid Range', {
        status: 416,
        headers: { ...corsHeaders(allowed) }
      });
    }

    const object = await env.VRM_BUCKET.get(key, range ? { range } : undefined);
    if (!object) {
      return new Response('Not Found', {
        status: 404,
        headers: { ...corsHeaders(allowed) }
      });
    }

    const headers = new Headers({
      ...corsHeaders(allowed),
      'Content-Type': object.httpMetadata?.contentType ?? 'model/gltf-binary',
      'Cache-Control': 'public, max-age=86400',
      ETag: object.httpEtag
    });

    if (object.range) {
      headers.set(
        'Content-Range',
        `bytes ${object.range.offset}-${object.range.end}/${object.size}`
      );
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', String(object.range.end - object.range.offset + 1));
      return new Response(request.method === 'HEAD' ? null : object.body, {
        status: 206,
        headers
      });
    }

    headers.set('Content-Length', String(object.size));

    return new Response(request.method === 'HEAD' ? null : object.body, {
      status: 200,
      headers
    });
  }
};
```

## Route Example

The asset endpoint is an internal URL under /assets/\*.
The client calls `fetch()` and then reads the response as an `ArrayBuffer`.

Examples:

- <https://your-worker.example/assets/avatars/AvatarSample_A.vrm>
- <https://your-worker.example/assets/characters/Hero.vrm>

Client-side usage:

```ts
const response = await fetch('https://your-worker.example/assets/avatars/AvatarSample_A.vrm');
const arrayBuffer = await response.arrayBuffer();
```

## Local Development and Deploy

```bash
npx wrangler dev
npx wrangler deploy
```

## Typical Pitfalls

- Calling the asset URL from the browser as if it were a page instead of fetching it.
- Missing or mismatched `ALLOWED_ORIGINS` when the app runs on another origin.
- Uploading VRM files without a proper `Content-Type`.
- Using a path that does not match the allowlisted extension or includes traversal patterns.

## Quick Test Sequence

1. Create the R2 bucket and upload a VRM file.
2. Set `VRM_BUCKET` and `ALLOWED_ORIGINS`.
3. Start the Worker locally or deploy it.
4. Call the asset URL from the app with `fetch()`.
5. Confirm `response.arrayBuffer()` returns the VRM bytes.
