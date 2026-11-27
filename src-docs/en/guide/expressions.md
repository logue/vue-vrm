---
description: Set VRM facial expressions with vue-vrm — the expressions prop, custom expressions, and low-latency updates for lip sync.
---

# Expressions

VRM models define facial expressions: presets such as `happy` or `aa`, and custom expressions specific to each model. vue-vrm sets their weights (0 to 1) every frame.

## The `expressions` prop {#expressions-prop}

Pass an object of weights keyed by expression name. Preset names are auto-completed, and the preset list is exported as `VRMExpressionPresetName`.

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas, type VrmExpressions } from 'vue-vrm';

  const expressions = ref<VrmExpressions>({ happy: 1 });
</script>

<template>
  <VrmCanvas :model-data="modelData" :expressions="expressions" />
</template>
```

Weights are clamped to 0–1. Expressions not listed in the object are left untouched, so a VRMA animation can still control them. When a key is removed from the object, that expression returns to `0`. Names the model does not define are ignored with a warning in the console.

## Custom expressions {#custom-expressions}

Custom expressions defined in the VRM file are loaded automatically. Their names differ for each model, so get them with `getExpressionNames()` after `model:loaded`, then use them as keys like presets.

```ts
const canvas = ref<VrmCanvasExposed>();

function onLoaded(): void {
  const { preset, custom } = canvas.value!.getExpressionNames();
  console.log(preset); // ['happy', 'angry', ..., 'aa', 'ih', 'ou', 'ee', 'oh', 'blink', ...]
  console.log(custom); // ['wink', 'tongue'] — depends on the model
}
```

## Lip sync and per-frame updates {#lip-sync}

Analyzing audio is outside the scope of vue-vrm. To drive the mouth from your own analysis, call `setExpression(name, weight)` instead of replacing the prop every frame. It writes the value directly without Vue reactivity, and the value is applied right before the next frame is rendered.

```ts
// Your own audio analysis (not part of vue-vrm).
const analyser = createAnalyser(audio);

function tick(): void {
  const vowels = analyser.estimateVowels(); // { aa: 0.8, ih: 0, ou: 0.1, ee: 0, oh: 0.2 }
  for (const [name, weight] of Object.entries(vowels)) {
    canvas.value?.setExpression(name, weight);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Close the mouth when the audio stops.
function onAudioEnded(): void {
  canvas.value?.resetExpressions();
}
```

If the same key is also given in the `expressions` prop, the prop wins. Values set with `setExpression()` persist when the model is replaced.

## Order of updates {#order}

Each frame, the animation mixer runs first, then the expression weights are applied, and then `vrm.update()` runs. Expression weights therefore override the same expressions animated by a VRMA file.
