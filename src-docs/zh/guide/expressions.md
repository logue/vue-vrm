---
description: 使用 vue-vrm 设置 VRM 表情：expressions prop、自定义表情，以及适用于口型同步的低延迟更新。
---

# 表情

VRM 模型定义了表情：`happy`、`aa` 等预设表情，以及每个模型特有的自定义表情。vue-vrm 每帧设置它们的权重（0 到 1）。

## `expressions` prop {#expressions-prop}

传入以表情名为键的权重对象。预设名称支持自动补全，预设列表以 `VRMExpressionPresetName` 导出。

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

权重会被限制在 0–1 之间。对象中未列出的表情不会被修改，因此 VRMA 动画仍可控制它们。从对象中移除某个键后，该表情会恢复为 `0`。模型中不存在的名称会在控制台输出警告并被忽略。

## 自定义表情 {#custom-expressions}

VRM 文件中定义的自定义表情会被自动加载。其名称因模型而异，因此请在 `model:loaded` 之后通过 `getExpressionNames()` 获取，然后像预设一样作为键使用。

```ts
const canvas = ref<VrmCanvasExposed>();

function onLoaded(): void {
  const { preset, custom } = canvas.value!.getExpressionNames();
  console.log(preset); // ['happy', 'angry', ..., 'aa', 'ih', 'ou', 'ee', 'oh', 'blink', ...]
  console.log(custom); // ['wink', 'tongue'] — 取决于模型
}
```

## 口型同步与逐帧更新 {#lip-sync}

音频分析不在 vue-vrm 的职责范围内。要根据自己的分析结果驱动嘴部，请调用 `setExpression(name, weight)`，而不是每帧替换 prop。它不经过 Vue 的响应式系统，直接写入值，并在下一帧渲染之前应用。

```ts
// 自己的音频分析（不包含在 vue-vrm 中）
const analyser = createAnalyser(audio);

function tick(): void {
  const vowels = analyser.estimateVowels(); // { aa: 0.8, ih: 0, ou: 0.1, ee: 0, oh: 0.2 }
  for (const [name, weight] of Object.entries(vowels)) {
    canvas.value?.setExpression(name, weight);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// 音频停止时闭上嘴
function onAudioEnded(): void {
  canvas.value?.resetExpressions();
}
```

如果同一个键也出现在 `expressions` prop 中，则以 prop 为准。通过 `setExpression()` 设置的值在更换模型后仍会保留。

## 更新顺序 {#order}

每一帧先更新动画混合器，然后应用表情权重，最后执行 `vrm.update()`。因此，这里指定的权重会覆盖 VRMA 文件中驱动的同名表情。
