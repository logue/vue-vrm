---
description: Cloudflare R2に置いたVRMファイルを、オリジンの確認とRange対応付きのWorkerで配信し、ArrayBufferとしてvue-vrmに読み込む方法です。
---

# Cloudflare R2 + Workers

この方法はVRoid HubのOAuth設定より簡単ですが、クライアント側の流れは同じです。アプリはファイルのURLを取得し、レスポンスを`ArrayBuffer`として読みます。

アセットのエンドポイントは、ブラウザーで開くページとして扱わないでください。
Workerはリクエストを検証し、R2のオブジェクトをストリーミングして、`fetch()`にバイト列を返します。

## 概要

1. R2バケットを作成し、VRMファイルをアップロードします。
2. R2バインディング付きのWorkerを設定します。
3. `/assets/*`のような内部用のアセットルートを公開します。
4. アプリからアセットのURLを取得し、`ArrayBuffer`として読みます。

## 必要な環境変数

- `VRM_BUCKET`

任意：

- `ALLOWED_ORIGINS`

補足：

- `VRM_BUCKET`は、Workerが使うR2バインディングの名前です。
- `ALLOWED_ORIGINS`は、許可するオリジンをカンマ区切りで完全一致で指定するリストです。
- `ALLOWED_ORIGINS`を省略すると、同一オリジンからのリクエストだけを許可します。

## R2バケットの設定

`vrm-assets`などのバケットを作成し、VRMファイルをアップロードします。

オブジェクトキーの例：

- `avatars/AvatarSample_A.vrm`
- `characters/Hero.vrm`

## Workerの設定

`wrangler.toml`:

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

アドレスの例：

- R2バケット：`vrm-assets`
- ローカルのWorkerのURL：`http://127.0.0.1:8787/assets/avatars/AvatarSample_A.vrm`
- 本番のWorkerのURL：`https://your-worker.example/assets/avatars/AvatarSample_A.vrm`
- アプリ側で取得する先：`fetch('https://your-worker.example/assets/avatars/AvatarSample_A.vrm')`

公式ドキュメント：

- Cloudflare R2: <https://developers.cloudflare.com/r2/>
- Cloudflare Workers: <https://developers.cloudflare.com/workers/>

## Workerの実装

`src/index.ts`:

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

## ルートの例

アセットのエンドポイントは、`/assets/*`以下の内部用のURLです。
クライアントは`fetch()`を呼び、レスポンスを`ArrayBuffer`として読みます。

例：

- `https://your-worker.example/assets/avatars/AvatarSample_A.vrm`
- `https://your-worker.example/assets/characters/Hero.vrm`

クライアント側での使い方：

```vue
<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();

  onMounted(async () => {
    const response = await fetch('https://your-worker.example/assets/avatars/AvatarSample_A.vrm');
    modelData.value = await response.arrayBuffer();
  });
</script>

<template>
  <VrmCanvas :model-data="modelData" />
</template>
```

## ローカル開発とデプロイ

```bash
npx wrangler dev
npx wrangler deploy
```

## よくある失敗

- アセットのURLを`fetch()`で取得せず、ページとしてブラウザーで開こうとする。
- アプリが別のオリジンで動いているのに、`ALLOWED_ORIGINS`がない、または一致していない。
- 適切な`Content-Type`を付けずにVRMファイルをアップロードしている。
- 許可した拡張子に合わないパスや、ディレクトリをさかのぼるパターンを含むパスを使っている。

## 動作確認の手順

1. R2バケットを作成し、VRMファイルをアップロードします。
2. `VRM_BUCKET`と`ALLOWED_ORIGINS`を設定します。
3. Workerをローカルで起動するか、デプロイします。
4. アプリから`fetch()`でアセットのURLを呼びます。
5. `response.arrayBuffer()`がVRMのバイト列を返すことを確認します。
