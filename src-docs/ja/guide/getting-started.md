---
description: vue-vrmをインストールし、手元のファイルからVRMモデルを表示する手順と、パッケージの公開内容を説明します。
---

# 導入

## インストール

コンポーネントとpeer dependenciesを一緒にインストールします。

```sh
pnpm add vue-vrm three @pixiv/three-vrm @pixiv/three-vrm-animation
```

## 最小構成の例

手元のファイルを`ArrayBuffer`として読み、`model-data`に渡します。

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();

  async function onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) modelData.value = await file.arrayBuffer();
  }
</script>

<template>
  <input type="file" accept=".vrm" @change="onFile" />
  <VrmCanvas :model-data="modelData" show-grid />
</template>
```

モデルは床（`y = 0`）に立つ位置に置かれ、全身が収まるようにカメラが動きます。

:::tip
`model-data`に新しいバッファーを渡すとモデルが差し替わります。`undefined`を渡すとモデルを外します。
:::

## サーバーから読み込む

:::warning アセットのライセンスに注意してください
モデルとそのアセット（テクスチャなど）をすべて含めて自分が著作権を持っている場合を除き、**実体ファイルを直接呼び出す実装はしないでください**。公開URLから読み込んだり、アプリにファイルを同梱したりする実装がこれにあたります。安全にファイルを届ける方法は[実装例](../examples/)を参照してください。
:::

バイト列を取得し、レスポンスを`ArrayBuffer`として読みます。

```ts
const response = await fetch('/api/vrm/my-avatar');
if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
modelData.value = await response.arrayBuffer();
```

モデルファイルを公開URLにせずに配信するサーバー側のコードは、[実装例](../examples/)を参照してください。

## パッケージの公開内容

| エクスポート                                              | 説明                                                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `VrmCanvas`                                               | Vueコンポーネントです。                                                                                              |
| `VrmCanvasExposed`                                        | テンプレート参照から使えるインスタンスAPIの型です。                                                                  |
| `useVrmCanvas`、`vrmCanvasProps`、`vrmCanvasEmits`        | コンポーネントの中身であるcomposableと、propsとemitsの定義です。独自のラッパーを作るときに使います。                 |
| `loadVrm`、`loadVRMAnimation`、`createMixerWithClips`など | ヘルパー関数です。[ユーティリティ](../api/utilities)を参照してください。                                             |
| `Meta`                                                    | パッケージのバージョンとビルド日時です。                                                                             |
| `vue-vrm/wc`                                              | `defineCustomElement`で包んだコンポーネントと`register()`です。[Web Component](./web-components)を参照してください。 |
| `vue-vrm/wc-auto`                                         | `vue-vrm/wc`と同じですが、importするだけで`<vrm-canvas>`を登録します。                                               |
| `vue-vrm/umd`、`vue-vrm/wc/umd`、`vue-vrm/wc-auto/umd`    | CommonJS／AMDローダー向けのUMDビルドです。                                                                           |

## 次のステップ

- [使い方](./usage) — サイズ、背景、エラー処理、スクリーンショット。
- [アニメーション](./animation) — VRMAファイルを再生します。
