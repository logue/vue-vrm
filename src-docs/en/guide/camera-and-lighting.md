---
description: Configure the vue-vrm camera and lights — automatic framing, camera props, orbit controls with roll, and ambient / directional lights.
---

# Camera & Lighting

## Automatic framing

When a model is loaded, the camera distance is chosen so the whole model fits in the view. Call `resetCamera()` to return to this position after the user has moved the camera.

## Camera props

| Prop              | Default                            | Effect                                                                              |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `camera-options`  | `{ fov: 30, near: 0.1, far: 100 }` | Field of view (degrees) and clipping planes. Omitted fields use the defaults.       |
| `camera-look-at`  | `[0, 0.9, 0]`                      | The point the camera looks at, in meters. Ignored while orbit controls are enabled. |
| `camera-distance` | fitted to the model                | Distance from the target. Overrides automatic framing.                              |
| `camera-euler`    | `[0, 0, 0]`                        | Rotation around the target as Euler angles (X, Y, Z) in radians.                    |
| `camera-offset`   | `[0, 0, 0]`                        | Moves the target (the center of the model) that the camera is placed around.        |

The camera is placed at `camera-distance` from the target, rotated by `camera-euler`. The target is the center of the model plus `camera-offset`. For example, to look at the face from slightly to the left:

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :camera-offset="[0, 0.6, 0]"
    :camera-look-at="[0, 1.4, 0]"
    :camera-distance="1.2"
    :camera-euler="[0, -0.4, 0]"
  />
</template>
```

`camera:change` is emitted whenever the camera position or target changes, and `camera:options-change` when `camera-options` changes.

## Orbit controls

Set `camera-interaction` to let users move the camera with the mouse or touch. It is off by default.

```vue
<script setup lang="ts">
  import { VrmCanvas, type CameraInteractionOptions } from 'vue-vrm';

  const interaction: CameraInteractionOptions = {
    enabled: true,
    roll: true,
    minDistance: 0.5,
    maxDistance: 20
  };
</script>

<template>
  <VrmCanvas :model-data="modelData" :camera-interaction="interaction" />
</template>
```

| Option          | Default    | Effect                                                          |
| --------------- | ---------- | --------------------------------------------------------------- |
| `enabled`       | —          | Turns the controls on. Required.                                |
| `rotate`        | `true`     | Rotate around the target by dragging.                           |
| `pan`           | `true`     | Pan with the right mouse button or Ctrl + drag.                 |
| `zoom`          | `true`     | Zoom with the mouse wheel or a pinch gesture.                   |
| `roll`          | `false`    | Roll the camera with the Q / E keys while the canvas has focus. |
| `rotateSpeed`   | `1`        | Rotation speed.                                                 |
| `panSpeed`      | `1`        | Pan speed.                                                      |
| `zoomSpeed`     | `1`        | Zoom speed.                                                     |
| `damping`       | `true`     | Smooths the movement after the pointer is released.             |
| `dampingFactor` | `0.08`     | Strength of the damping.                                        |
| `minDistance`   | `0.1`      | Closest allowed distance to the target.                         |
| `maxDistance`   | `Infinity` | Farthest allowed distance from the target.                      |
| `rollSpeed`     | `0.03`     | Roll per key press, in radians.                                 |

:::tip
When `roll` is enabled, the canvas becomes focusable. Users click the canvas (or move focus to it with Tab) before pressing Q / E.
:::

## Lights

The scene has an ambient light and a directional light.

| Prop                | Default                                                   | Effect                                    |
| ------------------- | --------------------------------------------------------- | ----------------------------------------- |
| `ambient-light`     | `{ color: '#ffffff', intensity: 0.5 }`                    | Light that reaches every surface equally. |
| `directional-light` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | Light from one direction, like sunlight.  |

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :ambient-light="{ color: '#ffe8d0', intensity: 0.6 }"
    :directional-light="{ color: '#ffffff', intensity: 1.2, position: [-1, 2, 1] }"
  />
</template>
```

Changes are applied immediately and reported through `light:ambient-change` and `light:directional-change`.
