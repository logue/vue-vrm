---
description: vue-vrmコンポーネントが受け付けるpropsの一覧です。型と既定値を記載しています。
---

# Props

propsは、テンプレートではケバブケース（`model-data`）、JavaScriptではキャメルケース（`modelData`）で書きます。設定値の型（`CameraOptions`、`LightOptions`、`DirectionalLightOptions`、`CameraInteractionOptions`、`Vec3`、`AnimationData`）は`vue-vrm`からエクスポートしています。

## モデルとアニメーション

| Prop                | 型                               | 既定値      | 説明                                                                                                             |
| ------------------- | -------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `model-data`        | `ArrayBuffer`                    | `undefined` | VRM 1.0ファイルです。新しい値を渡すとモデルが差し替わり、`undefined`でモデルを外します。                         |
| `animation-data`    | `ArrayBuffer \| ArrayBuffer[]`   | `undefined` | VRMAファイル、またはブレンドする複数のファイルです。[アニメーション](../guide/animation)を参照してください。     |
| `animation-weights` | `number[]`                       | `undefined` | 各クリップの重みです。省略時や要素数が合わないときは均等になります。合計は`1.0`以下にしてください。              |
| `loop`              | `boolean`                        | `true`      | アニメーションを繰り返します。`false`のときは1回再生して最後のフレームで止まります。                             |
| `expressions`       | `VrmExpressions`                 | `undefined` | プリセット名またはカスタム名をキーにした表情の重み（0〜1）です。[表情](../guide/expressions)を参照してください。 |
| `auto-blink`        | `boolean \| VrmAutoBlinkOptions` | `false`     | ランダムな間隔で自動的にまばたきします。[表情](../guide/expressions#auto-blink)を参照してください。              |

## キャンバス

| Prop             | 型                 | 既定値      | 説明                                                                          |
| ---------------- | ------------------ | ----------- | ----------------------------------------------------------------------------- |
| `width`          | `number \| string` | `480`       | 幅（ピクセル）です。`'100%'`のようなCSSの長さを指定すると親要素に追従します。 |
| `max-width`      | `number`           | `undefined` | 幅の上限です。                                                                |
| `aspect-ratio`   | `number`           | `3 / 4`     | 幅÷高さです。                                                                 |
| `bg-transparent` | `boolean`          | `false`     | 背景を透明にします。                                                          |
| `bg-image`       | `string`           | `undefined` | 背景画像のURLです。`bg-transparent`を指定しているときは無視されます。         |
| `show-grid`      | `boolean`          | `false`     | 床にグリッドを表示します。                                                    |
| `shader-pass`    | `ShaderPass`       | `undefined` | 描画後に適用するthree.jsの`ShaderPass`です。                                  |

## 描画 {#rendering}

| Prop     | 型                  | 既定値      | 説明                                                                                           |
| -------- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `render` | `VrmRenderFunction` | `undefined` | 既定の`renderer.render(scene, camera)`の代わりに毎フレーム呼ばれます。下記を参照してください。 |

`render`を指定しても、アニメーションのミキサーと`vrm.update()`はコンポーネント側で同じ`delta`を使って先に更新されます。既定の描画と組み込みの`shader-pass`のコンポーザーは置き換えられ、`captureScreenshot()`でも使われます。関数を差し替えると、次のフレームから新しい関数が使われます。

次の例では、自作のグリッチパスを含む`EffectComposer`を適用します。コンポーザーは`renderer:ready`で作成し、`resize`でサイズを更新し、`renderer:dispose`で破棄します（[イベント](./events#rendering)を参照）。モデルを差し替えてもレンダラー・シーン・カメラは変わらないため、`model:loaded`でコンポーザーを作り直す必要はありません。

```vue
<script setup lang="ts">
  import type { VrmRenderContext, VrmRenderTargets, VrmResizePayload } from 'vue-vrm';
  import { VrmCanvas } from 'vue-vrm';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

  import { GlitchShader } from './GlitchShader'; // 自作のShaderMaterialパラメーター

  let composer: EffectComposer | undefined;
  let glitchPass: ShaderPass | undefined;

  function onReady({ renderer, scene, camera }: VrmRenderTargets): void {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    glitchPass = new ShaderPass(GlitchShader);
    composer.addPass(glitchPass);
    composer.addPass(new OutputPass());
  }

  function onResize({ width, height, pixelRatio }: VrmResizePayload): void {
    composer?.setPixelRatio(pixelRatio);
    composer?.setSize(width, height);
    glitchPass?.uniforms.uResolution?.value.set(width * pixelRatio, height * pixelRatio);
  }

  function onRender({ delta, elapsed }: VrmRenderContext): void {
    if (!(composer && glitchPass)) return;
    glitchPass.uniforms.uIntensity.value = getBeatIntensity(); // 0〜1。音声解析などから取得
    glitchPass.uniforms.uTime.value = elapsed;
    composer.render(delta);
  }

  function onDispose(): void {
    composer?.dispose();
    composer = undefined;
    glitchPass = undefined;
  }
</script>

<template>
  <VrmCanvas
    :model-data="modelData"
    :render="onRender"
    @renderer:ready="onReady"
    @resize="onResize"
    @renderer:dispose="onDispose"
  />
</template>
```

## カメラ

| Prop                 | 型                         | 既定値                             | 説明                                                                                                  |
| -------------------- | -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `camera-options`     | `CameraOptions`            | `{ fov: 30, near: 0.1, far: 100 }` | 視野角（度）とクリッピング面です。                                                                    |
| `camera-distance`    | `number`                   | モデルに合わせた距離               | 注視点からの距離です。                                                                                |
| `camera-euler`       | `Vec3`                     | `[0, 0, 0]`                        | 注視点を中心にした回転（ラジアン）です。                                                              |
| `camera-offset`      | `Vec3`                     | `[0, 0, 0]`                        | カメラを置く基準点をずらします。                                                                      |
| `camera-look-at`     | `Vec3`                     | `[0, 0.9, 0]`                      | カメラが向く点です。オービット操作が有効な間は無視されます。                                          |
| `camera-interaction` | `CameraInteractionOptions` | `undefined`                        | オービット操作です。[カメラとライト](../guide/camera-and-lighting#orbit-controls)を参照してください。 |

## ライト

| Prop                | 型                        | 既定値                                                    | 説明           |
| ------------------- | ------------------------- | --------------------------------------------------------- | -------------- |
| `ambient-light`     | `LightOptions`            | `{ color: '#ffffff', intensity: 0.5 }`                    | 環境光です。   |
| `directional-light` | `DirectionalLightOptions` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 平行光源です。 |

## 型

```ts
type Vec3 = [number, number, number];

type AnimationData = ArrayBuffer | ArrayBuffer[];

type CameraOptions = { fov?: number; near?: number; far?: number };

type LightOptions = { color: string; intensity: number };

type DirectionalLightOptions = LightOptions & { position: Vec3 };

type CameraInteractionOptions = {
  enabled: boolean;
  rotate?: boolean;
  pan?: boolean;
  zoom?: boolean;
  roll?: boolean;
  rotateSpeed?: number;
  panSpeed?: number;
  zoomSpeed?: number;
  damping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  rollSpeed?: number;
};

type VrmRenderTargets = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera };

type VrmRenderContext = VrmRenderTargets & { delta: number; elapsed: number };

type VrmRenderFunction = (context: VrmRenderContext) => void;

type VrmExpressions = Partial<Record<VRMExpressionPresetName, number>> & Record<string, number>;

type VrmExpressionNames = { preset: VRMExpressionPresetName[]; custom: string[] };

type VrmAutoBlinkOptions = { interval?: [number, number]; duration?: number };
```
