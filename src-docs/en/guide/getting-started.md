---
description: Install vue-vrm, render a VRM model from a local file, and see what the package exports.
---

# Getting Started

## Installation

Install the component together with its peer dependencies:

```sh
pnpm add vue-vrm three @pixiv/three-vrm @pixiv/three-vrm-animation
```

## Minimal example

Read a local file as an `ArrayBuffer` and pass it to `model-data`:

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();

  async function onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) modelData.value = await file.arrayBuffer();
  }
</script>

<template>
  <input type="file" accept=".vrm" @change="onFile" />
  <VrmCanvas :model-data="modelData" show-grid />
</template>
```

The model is placed on the floor (`y = 0`) and the camera is moved so the whole model is in view.

:::tip
Setting `model-data` to a new buffer replaces the current model. Setting it to `undefined` unloads it.
:::

## Loading from a server

:::warning Mind the asset licenses
Unless you hold the copyright to the model and all of its assets (textures and so on), **do not implement code that loads the actual file directly** — for example from a public URL or from a file bundled with your app. See [Examples](../examples/) for how to deliver files safely.
:::

Fetch the bytes and read the response as an `ArrayBuffer`:

```ts
const response = await fetch('/api/vrm/my-avatar');
if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
modelData.value = await response.arrayBuffer();
```

See [Examples](../examples/) for server code that serves model files without exposing them as public URLs.

## Package exports

| Export                                                   | Description                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VrmCanvas`                                              | The Vue component.                                                                                          |
| `VrmCanvasExposed`                                       | Type of the instance API exposed through a template ref.                                                    |
| `useVrmCanvas`, `vrmCanvasProps`, `vrmCanvasEmits`       | The composable and the prop / emit definitions behind the component, for building your own wrapper.         |
| `loadVrm`, `loadVRMAnimation`, `createMixerWithClips`, … | Helper functions. See [Utilities](../api/utilities).                                                        |
| `Meta`                                                   | Package version and build date.                                                                             |
| `vue-vrm/wc`                                             | The component wrapped with `defineCustomElement`, plus `register()`. See [Web Component](./web-components). |
| `vue-vrm/wc-auto`                                        | Same as `vue-vrm/wc`, but registers `<vrm-canvas>` on import.                                               |
| `vue-vrm/umd`, `vue-vrm/wc/umd`, `vue-vrm/wc-auto/umd`   | UMD builds for CommonJS / AMD loaders.                                                                      |

## Next steps

- [Usage](./usage) — sizing, background, errors, and screenshots.
- [Animation](./animation) — play VRMA files.
