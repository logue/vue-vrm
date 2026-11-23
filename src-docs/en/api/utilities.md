---
description: Helper functions exported by vue-vrm for validating and loading VRM and VRMA buffers, and for building your own wrapper component.
---

# Utilities

These functions work without the `VrmCanvas` component. Use them to check files before uploading, or to build your own three.js scene.

## Validation

| Function               | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `validateVrm(buffer)`  | Throws if the buffer is not a GLB file with a VRM 1.0 extension. VRM 0.x is rejected. |
| `validateVrma(buffer)` | Throws if the buffer is not a GLB file with a VRMA extension.                         |

Both functions only read the file header and the JSON chunk, so they are fast enough to run before uploading:

```ts
import { validateVrm } from 'vue-vrm';

async function check(file: File): Promise<string | undefined> {
  try {
    validateVrm(await file.arrayBuffer());
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}
```

## Loading

| Function                                                    | Returns                 | Description                                                                                          |
| ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `loadVrm(buffer)`                                           | `Promise<VRM>`          | Validates and loads a VRM 1.0 model.                                                                 |
| `autoPositionY(vrm)`                                        | `void`                  | Moves the model so its lowest point is at `y = 0`.                                                   |
| `disposeVrm(vrm)`                                           | `void`                  | Frees the model's GPU resources.                                                                     |
| `loadVRMAnimation(buffer)`                                  | `Promise<VRMAnimation>` | Validates and loads a VRMA animation.                                                                |
| `createMixerWithClips(vrm, animations, weights?, options?)` | `AnimationMixer`        | Creates a mixer that plays the animations with the given weights. `options.loop` defaults to `true`. |
| `disposeMixer(mixer)`                                       | `void`                  | Stops the mixer and releases its cached clips.                                                       |

```ts
import { createMixerWithClips, loadVRMAnimation, loadVrm } from 'vue-vrm';
import { Scene, Timer } from 'three';

const scene = new Scene();
const vrm = await loadVrm(modelBuffer);
scene.add(vrm.scene);

const animation = await loadVRMAnimation(animationBuffer);
const mixer = createMixerWithClips(vrm, [animation]);

const timer = new Timer();
renderer.setAnimationLoop(timestamp => {
  timer.update(timestamp);
  const delta = timer.getDelta();
  mixer.update(delta);
  vrm.update(delta);
  renderer.render(scene, camera);
});
```

## Building your own component

`useVrmCanvas` is the composable behind `VrmCanvas`. Together with `vrmCanvasProps` and `vrmCanvasEmits`, it lets you render the canvas with your own markup:

```ts
import { defineComponent, h } from 'vue';
import { useVrmCanvas, vrmCanvasEmits, vrmCanvasProps } from 'vue-vrm';

export default defineComponent({
  props: vrmCanvasProps,
  emits: vrmCanvasEmits,
  setup(props, { emit, expose }) {
    const api = useVrmCanvas(props, emit);
    expose(api.exposed);
    return () =>
      h('div', { ref: api.container, style: api.containerStyle.value, class: 'my-avatar' }, [
        h('canvas', { ref: api.canvas, onKeydown: api.handleCanvasKeydown })
      ]);
  }
});
```

## Meta

`Meta` contains the package version and build date:

```ts
import { Meta } from 'vue-vrm';

console.log(Meta.version, Meta.date);
```

## Deprecated

| Function                         | Replacement              |
| -------------------------------- | ------------------------ |
| `resetVrmCanvasCamera(instance)` | `instance.resetCamera()` |
