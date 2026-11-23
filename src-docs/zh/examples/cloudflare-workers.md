---
description: 通过带来源校验和 Range 支持的 Worker 分发存放在 Cloudflare R2 中的 VRM 文件，并以 ArrayBuffer 形式加载到 vue-vrm。
---

# Cloudflare R2 + Workers

这种方式比 VRoid Hub 的 OAuth 配置简单，但客户端的流程相同：应用请求文件 URL，并把响应读取为 `ArrayBuffer`。

不要把素材端点当作在浏览器中打开的页面。
Worker 校验请求，从 R2 流式读取对象，并把字节数据返回给 `fetch()`。

## 概述

1. 创建 R2 存储桶并上传 VRM 文件。
2. 配置带有 R2 绑定的 Worker。
3. 公开 `/assets/*` 这样的内部素材路由。
4. 在应用中请求素材 URL，并读取为 `ArrayBuffer`。

## 必需的环境变量

- `VRM_BUCKET`

可选：

- `ALLOWED_ORIGINS`

说明：

- `VRM_BUCKET` 是 Worker 使用的 R2 绑定名称。
- `ALLOWED_ORIGINS` 是以逗号分隔、需要完全匹配的来源允许列表。
- 省略 `ALLOWED_ORIGINS` 时，只允许同源请求。

## R2 存储桶设置

创建一个存储桶（例如 `vrm-assets`），然后上传你的 VRM 文件。

对象键示例：

- `avatars/AvatarSample_A.vrm`
- `characters/Hero.vrm`

## Worker 设置

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

地址示例：

- R2 存储桶：`vrm-assets`
- 本地 Worker URL：`http://127.0.0.1:8787/assets/avatars/AvatarSample_A.vrm`
- 生产环境 Worker URL：`https://your-worker.example/assets/avatars/AvatarSample_A.vrm`
- 应用端请求目标：`fetch('https://your-worker.example/assets/avatars/AvatarSample_A.vrm')`

官方文档：

- Cloudflare R2: <https://developers.cloudflare.com/r2/>
- Cloudflare Workers: <https://developers.cloudflare.com/workers/>

## Worker 实现

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

## 路由示例

素材端点是 `/assets/*` 下的内部 URL。
客户端调用 `fetch()`，然后把响应读取为 `ArrayBuffer`。

示例：

- `https://your-worker.example/assets/avatars/AvatarSample_A.vrm`
- `https://your-worker.example/assets/characters/Hero.vrm`

客户端用法：

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

## 本地开发与部署

```bash
npx wrangler dev
npx wrangler deploy
```

## 常见问题

- 没有用 `fetch()` 请求素材 URL，而是像页面一样在浏览器中打开。
- 应用运行在其他来源上，但 `ALLOWED_ORIGINS` 缺失或不匹配。
- 上传 VRM 文件时没有设置正确的 `Content-Type`。
- 使用的路径与允许的扩展名不符，或包含目录穿越模式。

## 快速测试步骤

1. 创建 R2 存储桶并上传 VRM 文件。
2. 设置 `VRM_BUCKET` 和 `ALLOWED_ORIGINS`。
3. 在本地启动 Worker，或部署它。
4. 在应用中用 `fetch()` 调用素材 URL。
5. 确认 `response.arrayBuffer()` 返回 VRM 的字节数据。
