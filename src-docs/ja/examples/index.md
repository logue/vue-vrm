---
description: VRMファイルを公開URLにせずにvue-vrmへ届ける、サーバー側の実装例です。
---

# 実装例

:::warning
モデルとそのアセットをすべて含めて自分が著作権を持っている場合を除き、公開URLやアプリに同梱したファイルから実体ファイルを直接読み込まないでください。代わりに、以下のいずれかの方法を使ってください。
:::

vue-vrmは`ArrayBuffer`しか受け付けません（[ArrayBufferしか受け付けない理由](../guide/introduction#why-arraybuffer-only)を参照）。ここでは、モデルファイルがコード上の公開URLとして現れないように、サーバーから配信する方法を紹介します。どちらも[Cloudflare Workers](https://developers.cloudflare.com/workers/)で動きます。

| 実装例                                          | モデルの取得元                               | 難易度 |
| ----------------------------------------------- | -------------------------------------------- | ------ |
| [Cloudflare R2 + Workers](./cloudflare-workers) | R2バケットに置いた自分のファイル             | 易しい |
| [VRoid Hub API](./vroid-hub-api)                | VRoid Hubで公開されているモデル（OAuth経由） | 上級   |

どちらの場合も、アプリ側の処理は同じです。バイト列を取得して`model-data`に渡します。

```ts
const response = await fetch(endpoint);
modelData.value = await response.arrayBuffer();
```

完全な実装は[logue/v.logue.dev](https://github.com/logue/v.logue.dev)にあります。

- [`functions/api/assets/[[path]].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/assets/%5B%5Bpath%5D%5D.ts) — R2からVRMファイルを配信します
- [`functions/api/vrm/[avatar_id].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/vrm/%5Bavatar_id%5D.ts) — VRoid Hubからモデルを読み込みます
