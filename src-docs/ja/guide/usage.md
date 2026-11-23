---
description: vue-vrmの基本的な使い方です。キャンバスのサイズ、背景とグリッド、読み込み状態とエラー、スクリーンショットを説明します。
---

# 使い方

## キャンバスのサイズ

キャンバスは縦横比を保ちます。高さは幅から決まります。

| Prop           | 既定値  | 効果                                                       |
| -------------- | ------- | ---------------------------------------------------------- |
| `width`        | `480`   | キャンバスの幅（ピクセル）です。                           |
| `max-width`    | —       | 幅の上限です。親要素が狭いときは、それに合わせて縮みます。 |
| `aspect-ratio` | `3 / 4` | 幅÷高さです。既定値は縦長のキャンバスになります。          |

```vue
<template>
  <VrmCanvas :model-data="modelData" :width="640" :max-width="640" :aspect-ratio="16 / 9" />
</template>
```

描画バッファーは要素の実際の大きさに合わせて変わるので、CSSで縮めても画像はぼやけません。デバイスピクセル比は2までに抑えています。

## 背景とグリッド

| Prop             | 既定値  | 効果                                                                  |
| ---------------- | ------- | --------------------------------------------------------------------- |
| `bg-transparent` | `false` | 背景を透明にして、ページが透けて見えるようにします。                  |
| `bg-image`       | —       | 背景画像のURLです。`bg-transparent`を指定しているときは無視されます。 |
| `show-grid`      | `false` | 床にグリッドを表示します。                                            |

```vue
<template>
  <VrmCanvas :model-data="modelData" bg-transparent show-grid />
</template>
```

## 読み込み状態とエラー

イベントを使って、読み込み中の表示やエラーの通知を行います。

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();
  const loading = ref(false);
  const message = ref<string>();

  function onError(error: Error): void {
    loading.value = false;
    message.value = error.message;
  }
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-if="message" role="alert">{{ message }}</p>
  <VrmCanvas
    :model-data="modelData"
    @model:loading="loading = true"
    @model:loaded="loading = false"
    @model:error="onError"
    @animation:error="onError"
    @error="onError"
  />
</template>
```

`model:error`は、バッファーが正しいVRM 1.0ファイルでないときに発生します。VRM 0.xのモデルは、その旨のメッセージ付きで拒否されます。`error`はそれ以外の失敗で、背景画像を読み込めなかったときや、ブラウザーがWebGLに対応していないときに発生します。

## スクリーンショット

`captureScreenshot()`は現在のフレームを描画し、データURLとして返します。

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas, type VrmCanvasExposed } from 'vue-vrm';

  const canvas = ref<VrmCanvasExposed>();

  function download(): void {
    const link = document.createElement('a');
    link.href = canvas.value?.captureScreenshot('image/png') ?? '';
    link.download = 'avatar.png';
    link.click();
  }
</script>

<template>
  <VrmCanvas ref="canvas" :model-data="modelData" />
  <button type="button" @click="download">Save image</button>
</template>
```

:::tip
`captureScreenshot()`と`bg-transparent`を組み合わせると、背景が透明な画像を作れます。
:::

## ポストプロセス

three.jsの`ShaderPass`を`shader-pass`に渡します。シーンを描画した後に、`EffectComposer`で適用されます。

```vue
<script setup lang="ts">
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { SepiaShader } from 'three/addons/shaders/SepiaShader.js';
  import { VrmCanvas } from 'vue-vrm';

  const sepia = new ShaderPass(SepiaShader);
</script>

<template>
  <VrmCanvas :model-data="modelData" :shader-pass="sepia" />
</template>
```
