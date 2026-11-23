---
description: vue-vrm 组件实例暴露的方法，用于播放控制、截图和访问 three.js 对象。
---

# 实例 API

通过模板引用访问实例。类型检查请使用 `VrmCanvasExposed` 类型。

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
渲染器在挂载后创建，模型在加载完成后创建。在此之前，获取类方法会返回 `undefined`。
:::

## 播放

| 方法                            | 返回值          | 说明                           |
| ------------------------------- | --------------- | ------------------------------ |
| `playAnimation(data, weights?)` | `Promise<void>` | 加载并播放动画，替换当前动画。 |
| `pauseAnimation()`              | `void`          | 在当前帧暂停。                 |
| `resumeAnimation()`             | `void`          | 继续播放已暂停的动画。         |
| `stopAnimation()`               | `void`          | 停止并回到开头。               |

## 相机和输出

| 方法                         | 返回值   | 说明                                                                                   |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `resetCamera()`              | `void`   | 把相机恢复到能完整显示模型的位置。                                                     |
| `captureScreenshot(format?)` | `string` | 渲染当前帧并返回 data URL。`format` 默认为 `'image/png'`。渲染器就绪前调用会抛出异常。 |

## three.js 对象

| 方法            | 返回值                           | 说明                       |
| --------------- | -------------------------------- | -------------------------- |
| `getVrm()`      | `VRM \| undefined`               | 已加载的 VRM。             |
| `getScene()`    | `Scene \| undefined`             | 场景。                     |
| `getCamera()`   | `PerspectiveCamera \| undefined` | 相机。                     |
| `getRenderer()` | `WebGLRenderer \| undefined`     | 渲染器。                   |
| `getMixer()`    | `AnimationMixer \| undefined`    | 加载动画期间的动画混合器。 |
| `getCanvas()`   | `HTMLCanvasElement \| undefined` | `<canvas>` 元素。          |

:::warning
这些方法返回的对象由组件管理。更换模型或组件卸载时它们会被释放，因此请不要长期持有其引用。
:::

## 已弃用

| 方法                | 替代方法        |
| ------------------- | --------------- |
| `resetCameraPose()` | `resetCamera()` |
