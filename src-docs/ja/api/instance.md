---
description: vue-vrmコンポーネントのインスタンスから呼べるメソッドです。再生の制御、スクリーンショット、three.jsオブジェクトの取得ができます。
---

# インスタンスAPI

インスタンスにはテンプレート参照からアクセスします。型チェックには`VrmCanvasExposed`型を使います。

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas, type VrmCanvasExposed } from 'vue-vrm';

  const canvas = ref<VrmCanvasExposed>();

  function logBones(): void {
    const humanoid = canvas.value?.getVrm()?.humanoid;
    console.log(humanoid?.getNormalizedBoneNode('head'));
  }
</script>

<template>
  <VrmCanvas ref="canvas" :model-data="modelData" />
  <button type="button" @click="logBones">Log head bone</button>
</template>
```

:::info
レンダラーはマウント後に、モデルは読み込みが終わった後に作られます。それまでは、取得系のメソッドは`undefined`を返します。
:::

## 再生

| メソッド                        | 戻り値          | 説明                                                               |
| ------------------------------- | --------------- | ------------------------------------------------------------------ |
| `playAnimation(data, weights?)` | `Promise<void>` | アニメーションを読み込んで再生します。再生中のものは置き換えます。 |
| `pauseAnimation()`              | `void`          | 現在のフレームで一時停止します。                                   |
| `resumeAnimation()`             | `void`          | 一時停止したアニメーションを再開します。                           |
| `stopAnimation()`               | `void`          | 停止して先頭に戻します。                                           |

## カメラと出力

| メソッド                     | 戻り値   | 説明                                                                                                                         |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `resetCamera()`              | `void`   | モデル全体が収まる位置にカメラを戻します。                                                                                   |
| `captureScreenshot(format?)` | `string` | 現在のフレームを描画し、データURLで返します。`format`の既定値は`'image/png'`です。レンダラーの準備前に呼ぶと例外を投げます。 |

## three.jsのオブジェクト

| メソッド        | 戻り値                           | 説明                                             |
| --------------- | -------------------------------- | ------------------------------------------------ |
| `getVrm()`      | `VRM \| undefined`               | 読み込んだVRMです。                              |
| `getScene()`    | `Scene \| undefined`             | シーンです。                                     |
| `getCamera()`   | `PerspectiveCamera \| undefined` | カメラです。                                     |
| `getRenderer()` | `WebGLRenderer \| undefined`     | レンダラーです。                                 |
| `getMixer()`    | `AnimationMixer \| undefined`    | アニメーションを読み込んでいる間のミキサーです。 |
| `getCanvas()`   | `HTMLCanvasElement \| undefined` | `<canvas>`要素です。                             |

:::warning
これらのメソッドが返すオブジェクトはコンポーネントが管理しています。モデルの差し替えやアンマウントのときに破棄されるので、参照を保持し続けないでください。
:::

## 非推奨

| メソッド            | 代わりに使うもの |
| ------------------- | ---------------- |
| `resetCameraPose()` | `resetCamera()`  |
