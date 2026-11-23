---
description: Complete list of props accepted by the vue-vrm component, with types and defaults.
---

# Props

Props are written in kebab-case in templates (`model-data`) and camelCase in JavaScript (`modelData`). The option types (`CameraOptions`, `LightOptions`, `DirectionalLightOptions`, `CameraInteractionOptions`, `Vec3`, `AnimationData`) are exported from `vue-vrm`.

## Model and animation

| Prop                | Type                           | Default     | Description                                                                                                         |
| ------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `model-data`        | `ArrayBuffer`                  | `undefined` | VRM 1.0 file. A new value replaces the model; `undefined` unloads it.                                               |
| `animation-data`    | `ArrayBuffer \| ArrayBuffer[]` | `undefined` | VRMA file, or several files to blend. See [Animation](../guide/animation).                                          |
| `animation-weights` | `number[]`                     | `undefined` | Weight of each clip. Equal weights when omitted or when the length does not match. Must not sum to more than `1.0`. |
| `loop`              | `boolean`                      | `true`      | Repeats the animation. When `false`, it plays once and keeps the last frame.                                        |

## Canvas

| Prop             | Type         | Default     | Description                                                 |
| ---------------- | ------------ | ----------- | ----------------------------------------------------------- |
| `width`          | `number`     | `480`       | Width in pixels.                                            |
| `max-width`      | `number`     | `undefined` | Upper limit for the width.                                  |
| `aspect-ratio`   | `number`     | `3 / 4`     | Width divided by height.                                    |
| `bg-transparent` | `boolean`    | `false`     | Transparent background.                                     |
| `bg-image`       | `string`     | `undefined` | Background image URL. Ignored when `bg-transparent` is set. |
| `show-grid`      | `boolean`    | `false`     | Shows a grid on the floor.                                  |
| `shader-pass`    | `ShaderPass` | `undefined` | A three.js `ShaderPass` applied after rendering.            |

## Camera

| Prop                 | Type                       | Default                            | Description                                                                           |
| -------------------- | -------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `camera-options`     | `CameraOptions`            | `{ fov: 30, near: 0.1, far: 100 }` | Field of view (degrees) and clipping planes.                                          |
| `camera-distance`    | `number`                   | fitted to the model                | Distance from the target.                                                             |
| `camera-euler`       | `Vec3`                     | `[0, 0, 0]`                        | Rotation around the target, in radians.                                               |
| `camera-offset`      | `Vec3`                     | `[0, 0, 0]`                        | Moves the target that the camera is placed around.                                    |
| `camera-look-at`     | `Vec3`                     | `[0, 0.9, 0]`                      | The point the camera looks at. Ignored while orbit controls are enabled.              |
| `camera-interaction` | `CameraInteractionOptions` | `undefined`                        | Orbit controls. See [Camera & Lighting](../guide/camera-and-lighting#orbit-controls). |

## Lights

| Prop                | Type                      | Default                                                   | Description        |
| ------------------- | ------------------------- | --------------------------------------------------------- | ------------------ |
| `ambient-light`     | `LightOptions`            | `{ color: '#ffffff', intensity: 0.5 }`                    | Ambient light.     |
| `directional-light` | `DirectionalLightOptions` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | Directional light. |

## Types

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
```
