---
description: vue-vrmコンポーネントが発生させるイベントと、その引数の一覧です。
---

# イベント

## モデル

| イベント         | 引数    | 発生するタイミング                                                          |
| ---------------- | ------- | --------------------------------------------------------------------------- |
| `model:loading`  | —       | モデルの読み込みを始めたとき。                                              |
| `model:loaded`   | `VRM`   | モデルを読み込み、シーンに追加したとき。                                    |
| `model:unloaded` | —       | 前のモデルを外したとき。                                                    |
| `model:error`    | `Error` | バッファーが正しいVRM 1.0ファイルでないとき、または読み込みに失敗したとき。 |

## アニメーション

| イベント            | 引数                             | 発生するタイミング                                                                                      |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `animation:loading` | —                                | アニメーションの読み込みを始めたとき。                                                                  |
| `animation:loaded`  | `VRMAnimation \| VRMAnimation[]` | アニメーションを読み込んだとき。                                                                        |
| `animation:start`   | —                                | 再生を始めたとき。                                                                                      |
| `animation:pause`   | —                                | `pauseAnimation()`を呼んだとき。                                                                        |
| `animation:resume`  | —                                | `resumeAnimation()`を呼んだとき。                                                                       |
| `animation:stop`    | —                                | `stopAnimation()`を呼んだとき。                                                                         |
| `animation:end`     | —                                | ループしないアニメーションが最後まで再生されたとき。                                                    |
| `animation:error`   | `Error`                          | バッファーが正しいVRMAファイルでないとき、重みの合計が`1.0`を超えたとき、または読み込みに失敗したとき。 |

## カメラとライト

| イベント                   | 引数                                                       | 発生するタイミング                   |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `camera:change`            | `{ position: Vector3; lookAt: Vector3; distance: number }` | カメラの位置や注視点が変わったとき。 |
| `camera:options-change`    | `Required<CameraOptions>`                                  | `camera-options`が変わったとき。     |
| `light:ambient-change`     | `LightOptions`                                             | `ambient-light`が変わったとき。      |
| `light:directional-change` | `LightOptions & { position: Vector3 }`                     | `directional-light`が変わったとき。  |

## その他

| イベント | 引数    | 発生するタイミング                                                                            |
| -------- | ------- | --------------------------------------------------------------------------------------------- |
| `error`  | `Error` | それ以外の失敗。背景画像を読み込めなかったときや、ブラウザーがWebGLに対応していないときなど。 |

```vue
<script setup lang="ts">
  import type { VRM } from '@pixiv/three-vrm';
  import { VrmCanvas } from 'vue-vrm';

  function onLoaded(vrm: VRM): void {
    console.log(vrm.meta.name);
  }
</script>

<template>
  <VrmCanvas :model-data="modelData" @model:loaded="onLoaded" @error="console.error" />
</template>
```

[Web Component](../guide/web-components)として使う場合、これらは同じ名前のネイティブな`CustomEvent`として発火し、引数は`event.detail[0]`で取得できます。
