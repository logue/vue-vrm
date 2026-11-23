---
description: 在 Cloudflare Pages Functions 上通过 OAuth（PKCE）从 VRoid Hub 获取 VRM 模型，并以 ArrayBuffer 形式加载到 vue-vrm。
---

# VRoid Hub API

由于 VRoid Hub 需要 OAuth，这种方式比静态托管更复杂。

:::warning
不能一开始就调用 `/api/vrm/:avatar_id`。必须先在浏览器中完成一次 OAuth，并获取刷新令牌。
:::

## 概述

1. 在 [VRoid Hub API](https://developer.vroid.com/api/) 获取客户端 ID 和客户端密钥。
2. 把获取的客户端 ID 和客户端密钥写入 `VROID_APP_ID` 和 `VROID_CLIENT_SECRET`。
3. 在浏览器中打开 `/api/auth`。
4. 登录 VRoid Hub 并批准访问。
5. VRoid Hub 重定向到 `/api/auth/callback`。
6. 回调用授权码换取令牌。
7. 把返回的刷新令牌保存到环境变量或 KV。
8. 现在 `/api/vrm/:avatar_id` 可以获取包含临时下载 URL 的 JSON。

## 代码示例

以下示例基于 [v.logue.dev](https://github.com/logue/v.logue.dev) 使用的代码。`USER_AGENT` 是第一段代码中定义的常量。

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

## 必需的环境变量

- `VROID_APP_ID`
- `VROID_CLIENT_SECRET`

可选：

- `VROID_REFRESH_TOKEN`
- `TOKEN_STORE`（用于轮换令牌的 Cloudflare KV 绑定）

说明：

- 在 VRoid 的术语中，应用密钥对应 `VROID_APP_ID`（客户端 ID）。
- 在 VRoid 的术语中，秘密密钥对应 `VROID_CLIENT_SECRET`（客户端密钥）。
- 把获取的客户端 ID 和客户端密钥写入 `VROID_APP_ID` 和 `VROID_CLIENT_SECRET`。
- 回调和刷新流程中交换令牌时需要 `VROID_CLIENT_SECRET`。
- 配置了 `TOKEN_STORE` 时，最新的刷新令牌会保存在其中并优先使用。

## VRoid Hub 应用设置

在 VRoid Hub 的开发者设置中创建 OAuth 应用，并配置回调 URL：

- 本地：`http://127.0.0.1:8788/api/auth/callback`（或你的本地 Worker URL）
- 生产环境：`https://your-domain.example/api/auth/callback`

回调 URL 必须与 Worker 使用的 URL 完全一致。

## 浏览器步骤（必需）

在浏览器中打开以下 URL：

- `/api/auth`

它会执行以下操作：

- 生成 PKCE 的 `code_verifier`／`code_challenge`。
- 生成用于防御 CSRF 的 `state`。
- 把这两个值保存到 HttpOnly Cookie 中。
- 重定向到 VRoid Hub 的 OAuth 授权端点。

批准后，VRoid Hub 会重定向到：

- `/api/auth/callback?code=...&state=...`

回调端点校验 `state` 和 `code_verifier`，然后用授权码换取令牌。

## 如何获取刷新令牌

回调成功时，响应中会包含类似下面的一行：

- `VROID_REFRESH_TOKEN=xxxxxxxx`

把这个值用作初始的刷新令牌。

如果配置了 `TOKEN_STORE`，回调也会把刷新令牌保存到 KV。

## 调用头像端点

完成 OAuth 设置后，调用：

- `/api/vrm/{avatar_id}`

示例：

- `/api/vrm/your_avatar_id`

端点的处理流程如下：

1. 从 KV 读取刷新令牌（没有时使用 `VROID_REFRESH_TOKEN`）。
2. 用刷新令牌换取访问令牌（以及轮换后的刷新令牌）。
3. 查询账户的角色模型，并按 `avatar_id` 查找模型。
4. 签发下载许可。
5. 从 VRoid Hub 获取包含临时 URL 的 JSON。
6. 向客户端返回 JSON：`{ "url": "..." }`。

然后客户端调用 `fetch(url)`，并把 VRM 数据读取为 `ArrayBuffer`：

```ts
const { url } = (await (await fetch(`/api/vrm/${avatarId}`)).json()) as { url: string };
modelData.value = await (await fetch(url)).arrayBuffer();
```

## 常见问题

- VRoid Hub 应用设置中的回调 URL 不一致。
- 在浏览器中完成 `/api/auth` 流程之前就调用 `/api/vrm/:avatar_id`。
- 没有在应用中请求临时 VRM URL，而是直接在浏览器中打开。
- 缺少 `VROID_CLIENT_SECRET`。
- 依赖刷新令牌自动轮换，却没有 `TOKEN_STORE` 绑定。

## 快速测试步骤

1. 设置 `VROID_APP_ID` 和 `VROID_CLIENT_SECRET`。
2. 在浏览器中打开 `/api/auth` 并完成授权同意。
3. 确认回调成功，并复制 `VROID_REFRESH_TOKEN`。
4. 把令牌保存到环境变量（或确认已写入 KV）。
5. 调用 `/api/vrm/{avatar_id}`。
