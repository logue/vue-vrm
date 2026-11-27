---
description: vue-vrmでVRMの表情を設定する方法です。expressions prop、カスタム表情、リップシンク向けの遅延の少ない更新を説明します。
---

# 表情

VRMモデルには表情が定義されています。`happy`や`aa`などのプリセットと、モデルごとのカスタム表情です。vue-vrmは毎フレームその重み（0〜1）を設定します。

## `expressions` prop {#expressions-prop}

表情名をキーにした重みのオブジェクトを渡します。プリセット名は補完が効き、プリセットの一覧は`VRMExpressionPresetName`としてexportされています。

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

重みは0〜1に丸められます。オブジェクトに書かれていない表情には手を触れないため、VRMAアニメーションが引き続き制御できます。キーをオブジェクトから外すと、その表情は`0`に戻ります。モデルに存在しない名前は、コンソールに警告を出して無視します。

## カスタム表情 {#custom-expressions}

VRMファイルに定義されたカスタム表情は自動で読み込まれます。名前はモデルごとに異なるため、`model:loaded`の後に`getExpressionNames()`で取得し、プリセットと同じようにキーとして使います。

```ts
const canvas = ref<VrmCanvasExposed>();

function onLoaded(): void {
  const { preset, custom } = canvas.value!.getExpressionNames();
  console.log(preset); // ['happy', 'angry', ..., 'aa', 'ih', 'ou', 'ee', 'oh', 'blink', ...]
  console.log(custom); // ['wink', 'tongue'] — モデルによって異なる
}
```

## リップシンクと毎フレームの更新 {#lip-sync}

音声の解析はvue-vrmの範囲外です。独自の解析結果で口を動かすときは、propを毎フレーム差し替えるのではなく`setExpression(name, weight)`を呼びます。Vueのリアクティブ機構を通さずに値を直接書き込み、次のフレームの描画直前に反映します。

```ts
// 独自の音声解析（vue-vrmには含まれません）
const analyser = createAnalyser(audio);

function tick(): void {
  const vowels = analyser.estimateVowels(); // { aa: 0.8, ih: 0, ou: 0.1, ee: 0, oh: 0.2 }
  for (const [name, weight] of Object.entries(vowels)) {
    canvas.value?.setExpression(name, weight);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// 音声が止まったら口を閉じる
function onAudioEnded(): void {
  canvas.value?.resetExpressions();
}
```

同じキーが`expressions` propにもある場合はpropが優先されます。`setExpression()`で設定した値は、モデルを差し替えても保持されます。

## 更新の順序 {#order}

毎フレーム、まずアニメーションのミキサーが更新され、次に表情の重みが適用され、最後に`vrm.update()`が実行されます。そのため、VRMAファイルが動かす表情よりも、ここで指定した重みが優先されます。
