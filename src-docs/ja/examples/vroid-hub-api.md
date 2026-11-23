---
description: Cloudflare Pages FunctionsでOAuth（PKCE）を使ってVRoid HubからVRMモデルを取得し、ArrayBufferとしてvue-vrmに読み込む方法です。
---

# VRoid Hub API

VRoid HubはOAuthが必要なので、静的ホスティングより手順が複雑です。

:::warning
最初に`/api/vrm/:avatar_id`を呼ぶことはできません。一度ブラウザーでOAuthを完了し、リフレッシュトークンを取得する必要があります。
:::

## 概要

1. [VRoid Hub API](https://developer.vroid.com/api/)でクライアントIDとクライアントシークレットを取得します。
2. 取得したクライアントIDとクライアントシークレットを、`VROID_APP_ID`と`VROID_CLIENT_SECRET`に設定します。
3. ブラウザーで`/api/auth`を開きます。
4. VRoid Hubにサインインし、アクセスを許可します。
5. VRoid Hubが`/api/auth/callback`にリダイレクトします。
6. コールバックが認可コードをトークンに交換します。
7. 返ってきたリフレッシュトークンを、環境変数かKVに保存します。
8. これで`/api/vrm/:avatar_id`から、一時的なダウンロードURLを含むJSONを取得できるようになります。

## コード例

以下の例は、[v.logue.dev](https://github.com/logue/v.logue.dev)で使っているコードをもとにしています。`USER_AGENT`は最初のコードで定義している定数です。

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

## 必要な環境変数

- `VROID_APP_ID`
- `VROID_CLIENT_SECRET`

任意：

- `VROID_REFRESH_TOKEN`
- `TOKEN_STORE`（トークンを更新し続けるためのCloudflare KVバインディング）

補足：

- VRoidの用語では、アプリケーションキーが`VROID_APP_ID`（クライアントID）にあたります。
- VRoidの用語では、シークレットキーが`VROID_CLIENT_SECRET`（クライアントシークレット）にあたります。
- 取得したクライアントIDとクライアントシークレットを、`VROID_APP_ID`と`VROID_CLIENT_SECRET`に設定します。
- `VROID_CLIENT_SECRET`は、コールバックとリフレッシュでのトークン交換に必要です。
- `TOKEN_STORE`を設定すると、最新のリフレッシュトークンがそこに保存され、優先して使われます。

## VRoid Hubアプリの設定

VRoid Hubの開発者設定でOAuthアプリを作成し、コールバックURLを設定します。

- ローカル：`http://127.0.0.1:8788/api/auth/callback`（またはローカルのWorkerのURL）
- 本番：`https://your-domain.example/api/auth/callback`

コールバックURLは、Workerが使うURLと完全に一致させてください。

## ブラウザーでの手順（必須）

ブラウザーで次のURLを開きます。

- `/api/auth`

このURLで行うこと：

- PKCEの`code_verifier`／`code_challenge`を生成します。
- CSRF対策の`state`を生成します。
- 両方の値をHttpOnlyのCookieに保存します。
- VRoid HubのOAuth認可エンドポイントにリダイレクトします。

許可すると、VRoid Hubが次のURLにリダイレクトします。

- `/api/auth/callback?code=...&state=...`

コールバックのエンドポイントは`state`と`code_verifier`を検証し、コードをトークンに交換します。

## リフレッシュトークンの取得

コールバックが成功すると、レスポンスに次のような行が含まれます。

- `VROID_REFRESH_TOKEN=xxxxxxxx`

この値を最初のリフレッシュトークンとして使います。

`TOKEN_STORE`を設定している場合は、コールバックがリフレッシュトークンをKVにも保存します。

## アバターのエンドポイントを呼ぶ

OAuthの設定が終わったら、次のURLを呼びます。

- `/api/vrm/{avatar_id}`

例：

- `/api/vrm/your_avatar_id`

エンドポイントの処理の流れは次のとおりです。

1. KVからリフレッシュトークンを読みます（なければ`VROID_REFRESH_TOKEN`を使います）。
2. リフレッシュトークンを、アクセストークン（と更新されたリフレッシュトークン）に交換します。
3. アカウントのキャラクターモデルを取得し、`avatar_id`でモデルを探します。
4. ダウンロードライセンスを発行します。
5. VRoid Hubから、一時的なURLを含むJSONを取得します。
6. クライアントにJSON（`{ "url": "..." }`）を返します。

クライアントは`fetch(url)`を呼び、VRMのデータを`ArrayBuffer`として読みます。

```ts
const { url } = (await (await fetch(`/api/vrm/${avatarId}`)).json()) as { url: string };
modelData.value = await (await fetch(url)).arrayBuffer();
```

## よくある失敗

- VRoid HubアプリのコールバックURLが一致していない。
- ブラウザーで`/api/auth`の手順を終える前に、`/api/vrm/:avatar_id`を呼んでいる。
- 一時的なVRMのURLを、アプリから取得せずにブラウザーで直接開こうとする。
- `VROID_CLIENT_SECRET`が設定されていない。
- リフレッシュトークンの自動更新に頼っているのに、`TOKEN_STORE`のバインディングがない。

## 動作確認の手順

1. `VROID_APP_ID`と`VROID_CLIENT_SECRET`を設定します。
2. ブラウザーで`/api/auth`を開き、同意を完了します。
3. コールバックが成功したことを確認し、`VROID_REFRESH_TOKEN`をコピーします。
4. トークンを環境変数に保存します（またはKVへの書き込みを確認します）。
5. `/api/vrm/{avatar_id}`を呼びます。
