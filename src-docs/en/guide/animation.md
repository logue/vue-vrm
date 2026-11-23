---
description: Play VRMA animations with vue-vrm — single clips, blending several clips with weights, looping, and playback control.
---

# Animation

vue-vrm plays [VRMA](https://vrm.dev/en/vrma/) files, the animation format for VRM. Like models, animations are passed as `ArrayBuffer`.

## Playing a VRMA file

Set `animation-data` after (or together with) `model-data`:

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

The animation starts as soon as it is loaded. When the model changes, the current animation is applied to the new model.

:::info
Free VRMA files are available from [VRoid Project on BOOTH](https://vroid.booth.pm/items/5512385). Check the license of each file before distributing it.
:::

## Blending several clips

Pass an array of buffers to play several clips at once. `animation-weights` sets the weight of each clip:

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :animation-data="[idle, wave]"
    :animation-weights="[0.7, 0.3]"
  />
</template>
```

- When `animation-weights` is omitted, or its length does not match the number of clips, every clip gets the same weight.
- The weights must not add up to more than `1.0`. Otherwise `animation:error` is emitted.

## Looping

Animations loop by default. Set `loop` to `false` to play once. The last frame is kept, and `animation:end` is emitted when the clip finishes.

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

## Playback control

Control playback through the [instance API](../api/instance):

| Method                          | Effect                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| `playAnimation(data, weights?)` | Loads and plays new animation data, replacing the current one. |
| `pauseAnimation()`              | Pauses the animation at the current frame.                     |
| `resumeAnimation()`             | Resumes a paused animation.                                    |
| `stopAnimation()`               | Stops the animation and rewinds it to the start.               |

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

Each method emits the matching event: `animation:pause`, `animation:resume`, and `animation:stop`.
