---
description: 使用 vue-vrm 播放 VRMA 动画：单个片段、按权重混合多个片段、循环和播放控制。
---

# 动画

vue-vrm 可以播放 VRM 的动画格式 [VRMA](https://vrm.dev/en/vrma/) 文件。与模型一样，动画也以 `ArrayBuffer` 传入。

## 播放 VRMA 文件

在 `model-data` 之后（或同时）设置 `animation-data`：

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();
  const animationData = ref<ArrayBuffer>();

  async function onAnimationFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) animationData.value = await file.arrayBuffer();
  }
</script>

<template>
  <input type="file" accept=".vrma" @change="onAnimationFile" />
  <VrmCanvas :model-data="modelData" :animation-data="animationData" />
</template>
```

动画加载完成后会立即开始播放。更换模型时，当前的动画也会应用到新模型上。

:::info
免费的 VRMA 文件可以在 [BOOTH 上的 VRoid Project](https://vroid.booth.pm/items/5512385) 获取。二次分发前请确认每个文件的许可协议。
:::

## 混合多个片段

传入缓冲区数组即可同时播放多个片段。`animation-weights` 指定每个片段的权重：

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :animation-data="[idle, wave]"
    :animation-weights="[0.7, 0.3]"
  />
</template>
```

- 省略 `animation-weights`，或其长度与片段数量不一致时，所有片段使用相同的权重。
- 权重之和不得超过 `1.0`，否则会触发 `animation:error`。

## 循环

动画默认循环播放。将 `loop` 设为 `false` 则只播放一次，并停在最后一帧；播放结束时会触发 `animation:end`。

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :animation-data="animationData"
    :loop="false"
    @animation:end="onEnd"
  />
</template>
```

## 播放控制

通过[实例 API](../api/instance) 控制播放：

| 方法                            | 作用                               |
| ------------------------------- | ---------------------------------- |
| `playAnimation(data, weights?)` | 加载并播放新的动画，替换当前动画。 |
| `pauseAnimation()`              | 在当前帧暂停动画。                 |
| `resumeAnimation()`             | 继续播放已暂停的动画。             |
| `stopAnimation()`               | 停止动画并回到开头。               |

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas, type VrmCanvasExposed } from 'vue-vrm';

  const canvas = ref<VrmCanvasExposed>();
</script>

<template>
  <VrmCanvas ref="canvas" :model-data="modelData" :animation-data="animationData" />
  <button type="button" @click="canvas?.pauseAnimation()">Pause</button>
  <button type="button" @click="canvas?.resumeAnimation()">Resume</button>
  <button type="button" @click="canvas?.stopAnimation()">Stop</button>
</template>
```

每个方法都会触发对应的事件：`animation:pause`、`animation:resume` 和 `animation:stop`。
