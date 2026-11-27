---
description: vue-vrm 的日常用法：画布尺寸、背景和网格、加载状态与错误、截图。
---

# 用法

## 画布尺寸

画布保持固定的宽高比，高度由宽度计算得出。

| Prop           | 默认值  | 作用                                      |
| -------------- | ------- | ----------------------------------------- |
| `width`        | `480`   | 画布宽度（像素），或 `100%` 等 CSS 长度。 |
| `max-width`    | —       | 宽度上限（像素）。                        |
| `aspect-ratio` | `3 / 4` | 宽度除以高度。默认是竖向画布。            |

```vue
<template>
  <VrmCanvas :model-data="modelData" :width="640" :max-width="640" :aspect-ratio="16 / 9" />
</template>
```

要让画布适应父元素的宽度，请将 `width` 设置为 `100%` 等 CSS 长度。高度通过 CSS `aspect-ratio` 跟随，元素尺寸变化时渲染器会重新调整尺寸，并触发 `resize` 事件。数字或 `"480"` 这样的纯数字字符串仍按像素处理。

```vue
<template>
  <VrmCanvas :model-data="modelData" width="100%" :max-width="640" />
</template>
```

绘制缓冲区会跟随元素的实际尺寸变化，因此即使用 CSS 缩小，图像也不会模糊。设备像素比最高限制为 2。

## 背景和网格

| Prop             | 默认值  | 作用                                               |
| ---------------- | ------- | -------------------------------------------------- |
| `bg-transparent` | `false` | 使用透明背景，让页面透出来。                       |
| `bg-image`       | —       | 背景图片的 URL。设置 `bg-transparent` 时会被忽略。 |
| `show-grid`      | `false` | 在地面上显示网格。                                 |

```vue
<template>
  <VrmCanvas :model-data="modelData" bg-transparent show-grid />
</template>
```

## 加载状态与错误

使用事件显示加载提示并报告错误：

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

当缓冲区不是有效的 VRM 1.0 文件时会触发 `model:error`。VRM 0.x 模型会被拒绝，并附带相应的提示信息。`error` 用于其他失败，例如背景图片无法加载，或浏览器不支持 WebGL。

## 截图

`captureScreenshot()` 会渲染当前帧并以 data URL 返回：

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
将 `captureScreenshot()` 与 `bg-transparent` 结合使用，可以得到透明背景的图片。
:::

## 后期处理

把 three.js 的 `ShaderPass` 传给 `shader-pass`。它会在场景渲染之后通过 `EffectComposer` 应用。

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
