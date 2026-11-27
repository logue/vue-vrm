---
description: vue-vrm 组件接受的全部 props，包括类型和默认值。
---

# Props

在模板中使用 kebab-case（`model-data`），在 JavaScript 中使用 camelCase（`modelData`）。选项类型（`CameraOptions`、`LightOptions`、`DirectionalLightOptions`、`CameraInteractionOptions`、`Vec3`、`AnimationData`）都从 `vue-vrm` 导出。

## 模型和动画

| Prop                | 类型                             | 默认值      | 说明                                                                        |
| ------------------- | -------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `model-data`        | `ArrayBuffer`                    | `undefined` | VRM 1.0 文件。传入新值会替换模型；传入 `undefined` 会卸载模型。             |
| `animation-data`    | `ArrayBuffer \| ArrayBuffer[]`   | `undefined` | VRMA 文件，或要混合的多个文件。请参阅[动画](../guide/animation)。           |
| `animation-weights` | `number[]`                       | `undefined` | 每个片段的权重。省略或长度不一致时使用相同权重。总和不得超过 `1.0`。        |
| `loop`              | `boolean`                        | `true`      | 循环播放动画。为 `false` 时只播放一次并停在最后一帧。                       |
| `expressions`       | `VrmExpressions`                 | `undefined` | 以预设名或自定义名为键的表情权重（0–1）。参见[表情](../guide/expressions)。 |
| `auto-blink`        | `boolean \| VrmAutoBlinkOptions` | `false`     | 以随机间隔自动眨眼。参见[表情](../guide/expressions#auto-blink)。           |

## 画布

| Prop             | 类型         | 默认值      | 说明                                             |
| ---------------- | ------------ | ----------- | ------------------------------------------------ |
| `width`          | `number`     | `480`       | 宽度（像素）。                                   |
| `max-width`      | `number`     | `undefined` | 宽度上限。                                       |
| `aspect-ratio`   | `number`     | `3 / 4`     | 宽度除以高度。                                   |
| `bg-transparent` | `boolean`    | `false`     | 透明背景。                                       |
| `bg-image`       | `string`     | `undefined` | 背景图片 URL。设置 `bg-transparent` 时会被忽略。 |
| `show-grid`      | `boolean`    | `false`     | 在地面上显示网格。                               |
| `shader-pass`    | `ShaderPass` | `undefined` | 渲染后应用的 three.js `ShaderPass`。             |

## 渲染 {#rendering}

| Prop     | 类型                | 默认值      | 说明                                                            |
| -------- | ------------------- | ----------- | --------------------------------------------------------------- |
| `render` | `VrmRenderFunction` | `undefined` | 每帧调用，替代默认的 `renderer.render(scene, camera)`。见下文。 |

设置 `render` 后，组件仍会在调用它之前使用相同的 `delta` 更新动画混合器和 `vrm.update()`。它会替代默认渲染和内置的 `shader-pass` 合成器，`captureScreenshot()` 也会使用它。更换函数后，从下一帧开始生效。

下面的示例应用了带有自定义故障（glitch）通道的 `EffectComposer`。合成器在 `renderer:ready` 时创建，在 `resize` 时调整尺寸，在 `renderer:dispose` 时释放（参见[事件](./events#rendering)）。更换模型时渲染器、场景和相机保持不变，因此无需在 `model:loaded` 时重建合成器。

```vue
<script setup lang="ts">
  import type { VrmRenderContext, VrmRenderTargets, VrmResizePayload } from 'vue-vrm';
  import { VrmCanvas } from 'vue-vrm';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

  import { GlitchShader } from './GlitchShader'; // 自定义 ShaderMaterial 参数

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
    glitchPass.uniforms.uIntensity.value = getBeatIntensity(); // 0–1，例如来自音频分析
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

## 相机

| Prop                 | 类型                       | 默认值                             | 说明                                                                        |
| -------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `camera-options`     | `CameraOptions`            | `{ fov: 30, near: 0.1, far: 100 }` | 视野角（度）和裁剪面。                                                      |
| `camera-distance`    | `number`                   | 根据模型计算                       | 到目标点的距离。                                                            |
| `camera-euler`       | `Vec3`                     | `[0, 0, 0]`                        | 绕目标点的旋转（弧度）。                                                    |
| `camera-offset`      | `Vec3`                     | `[0, 0, 0]`                        | 移动相机所围绕的目标点。                                                    |
| `camera-look-at`     | `Vec3`                     | `[0, 0.9, 0]`                      | 相机朝向的点。启用轨道控制时会被忽略。                                      |
| `camera-interaction` | `CameraInteractionOptions` | `undefined`                        | 轨道控制。请参阅[相机与灯光](../guide/camera-and-lighting#orbit-controls)。 |

## 灯光

| Prop                | 类型                      | 默认值                                                    | 说明     |
| ------------------- | ------------------------- | --------------------------------------------------------- | -------- |
| `ambient-light`     | `LightOptions`            | `{ color: '#ffffff', intensity: 0.5 }`                    | 环境光。 |
| `directional-light` | `DirectionalLightOptions` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 平行光。 |

## 类型

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
