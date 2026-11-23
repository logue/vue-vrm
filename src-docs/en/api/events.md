---
description: Events emitted by the vue-vrm component and their payloads.
---

# Events

## Model

| Event            | Payload | Emitted when                                               |
| ---------------- | ------- | ---------------------------------------------------------- |
| `model:loading`  | —       | A model starts loading.                                    |
| `model:loaded`   | `VRM`   | The model has been loaded and added to the scene.          |
| `model:unloaded` | —       | The previous model has been removed.                       |
| `model:error`    | `Error` | The buffer is not a valid VRM 1.0 file, or loading failed. |

## Animation

| Event               | Payload                          | Emitted when                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `animation:loading` | —                                | Animation data starts loading.                                                              |
| `animation:loaded`  | `VRMAnimation \| VRMAnimation[]` | The animation has been loaded.                                                              |
| `animation:start`   | —                                | Playback started.                                                                           |
| `animation:pause`   | —                                | `pauseAnimation()` was called.                                                              |
| `animation:resume`  | —                                | `resumeAnimation()` was called.                                                             |
| `animation:stop`    | —                                | `stopAnimation()` was called.                                                               |
| `animation:end`     | —                                | A non-looping animation reached its end.                                                    |
| `animation:error`   | `Error`                          | The buffer is not a valid VRMA file, the weights sum to more than `1.0`, or loading failed. |

## Camera and lights

| Event                      | Payload                                                    | Emitted when                           |
| -------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `camera:change`            | `{ position: Vector3; lookAt: Vector3; distance: number }` | The camera position or target changed. |
| `camera:options-change`    | `Required<CameraOptions>`                                  | `camera-options` changed.              |
| `light:ambient-change`     | `LightOptions`                                             | `ambient-light` changed.               |
| `light:directional-change` | `LightOptions & { position: Vector3 }`                     | `directional-light` changed.           |

## Other

| Event   | Payload | Emitted when                                                                                    |
| ------- | ------- | ----------------------------------------------------------------------------------------------- |
| `error` | `Error` | Any other failure, such as a background image that cannot be loaded or a browser without WebGL. |

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

When the component is used as a [Web Component](../guide/web-components), these are dispatched as native `CustomEvent`s with the same names, and the payload is available as `event.detail[0]`.
