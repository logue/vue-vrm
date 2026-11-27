---
description: vue-vrm 组件触发的事件及其参数。
---

# 事件

## 模型

| 事件             | 参数    | 触发时机                                      |
| ---------------- | ------- | --------------------------------------------- |
| `model:loading`  | —       | 开始加载模型时。                              |
| `model:loaded`   | `VRM`   | 模型加载完成并添加到场景时。                  |
| `model:unloaded` | —       | 移除上一个模型时。                            |
| `model:error`    | `Error` | 缓冲区不是有效的 VRM 1.0 文件，或加载失败时。 |

## 动画

| 事件                | 参数                             | 触发时机                                                       |
| ------------------- | -------------------------------- | -------------------------------------------------------------- |
| `animation:loading` | —                                | 开始加载动画时。                                               |
| `animation:loaded`  | `VRMAnimation \| VRMAnimation[]` | 动画加载完成时。                                               |
| `animation:start`   | —                                | 开始播放时。                                                   |
| `animation:pause`   | —                                | 调用 `pauseAnimation()` 时。                                   |
| `animation:resume`  | —                                | 调用 `resumeAnimation()` 时。                                  |
| `animation:stop`    | —                                | 调用 `stopAnimation()` 时。                                    |
| `animation:end`     | —                                | 不循环的动画播放到结尾时。                                     |
| `animation:error`   | `Error`                          | 缓冲区不是有效的 VRMA 文件、权重总和超过 `1.0`，或加载失败时。 |

## 相机和灯光

| 事件                       | 参数                                                       | 触发时机                     |
| -------------------------- | ---------------------------------------------------------- | ---------------------------- |
| `camera:change`            | `{ position: Vector3; lookAt: Vector3; distance: number }` | 相机位置或目标点变化时。     |
| `camera:options-change`    | `Required<CameraOptions>`                                  | `camera-options` 变化时。    |
| `light:ambient-change`     | `LightOptions`                                             | `ambient-light` 变化时。     |
| `light:directional-change` | `LightOptions & { position: Vector3 }`                     | `directional-light` 变化时。 |

## 渲染 {#rendering}

| 事件               | 参数                                                    | 触发时机                                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `renderer:ready`   | `VrmRenderTargets`                                      | 挂载时，渲染器、场景和相机创建完成后。早于第一帧和第一次 `resize`。 |
| `resize`           | `{ width: number; height: number; pixelRatio: number }` | 渲染器和相机调整尺寸之后。挂载时也会触发一次。                      |
| `renderer:dispose` | —                                                       | 卸载时，释放渲染器之前。                                            |

与 [`render` prop](./props#rendering) 配合使用，管理自定义后期处理。WebGL 不可用时不会触发 `renderer:ready`，而是触发 `error` 事件。

## 其他

| 事件    | 参数    | 触发时机                                               |
| ------- | ------- | ------------------------------------------------------ |
| `error` | `Error` | 其他失败，例如背景图片无法加载，或浏览器不支持 WebGL。 |

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

作为 [Web Component](../guide/web-components) 使用时，这些事件会以同名的原生 `CustomEvent` 派发，参数可通过 `event.detail[0]` 获取。
