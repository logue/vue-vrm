---
description: Methods exposed by the vue-vrm component instance, for playback control, screenshots, and access to three.js objects.
---

# Instance API

Access the instance through a template ref. Use the `VrmCanvasExposed` type for type checking.

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
The renderer is created after mount, and the model after it has loaded. Until then, the getters return `undefined`.
:::

## Playback

| Method                          | Returns         | Description                                                |
| ------------------------------- | --------------- | ---------------------------------------------------------- |
| `playAnimation(data, weights?)` | `Promise<void>` | Loads and plays animation data, replacing the current one. |
| `pauseAnimation()`              | `void`          | Pauses at the current frame.                               |
| `resumeAnimation()`             | `void`          | Resumes a paused animation.                                |
| `stopAnimation()`               | `void`          | Stops and rewinds to the start.                            |

## Expressions

| Method                        | Returns              | Description                                                                             |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `getExpressionNames()`        | `VrmExpressionNames` | Preset and custom expression names defined by the model. Empty when no model is loaded. |
| `setExpression(name, weight)` | `void`               | Sets a weight without Vue reactivity. Applied on the next frame. Suited to lip sync.    |
| `resetExpressions()`          | `void`               | Clears values set with `setExpression()`. Those expressions return to `0`.              |

## Camera and output

| Method                       | Returns  | Description                                                                                                                |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `resetCamera()`              | `void`   | Returns the camera to the position that frames the model.                                                                  |
| `captureScreenshot(format?)` | `string` | Renders the current frame and returns a data URL. `format` defaults to `'image/png'`. Throws before the renderer is ready. |

## three.js objects

| Method          | Returns                          | Description                                        |
| --------------- | -------------------------------- | -------------------------------------------------- |
| `getVrm()`      | `VRM \| undefined`               | The loaded VRM.                                    |
| `getScene()`    | `Scene \| undefined`             | The scene.                                         |
| `getCamera()`   | `PerspectiveCamera \| undefined` | The camera.                                        |
| `getRenderer()` | `WebGLRenderer \| undefined`     | The renderer.                                      |
| `getMixer()`    | `AnimationMixer \| undefined`    | The animation mixer, while an animation is loaded. |
| `getCanvas()`   | `HTMLCanvasElement \| undefined` | The `<canvas>` element.                            |

:::warning
Objects returned by these methods are owned by the component. They are disposed when the model changes or the component is unmounted, so do not keep references to them.
:::

## Deprecated

| Method              | Replacement     |
| ------------------- | --------------- |
| `resetCameraPose()` | `resetCamera()` |
