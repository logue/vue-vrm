---
description: vue-vrmでVRMAアニメーションを再生する方法です。単体のクリップ、ウェイトによる複数クリップのブレンド、ループ、再生制御を説明します。
---

# アニメーション

vue-vrmは、VRM用のアニメーション形式である[VRMA](https://vrm.dev/vrma/)ファイルを再生できます。モデルと同じく、アニメーションも`ArrayBuffer`で渡します。

## VRMAファイルを再生する

`model-data`の後に（または同時に）`animation-data`を指定します。

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

アニメーションは読み込みが終わるとすぐに再生されます。モデルを差し替えた場合は、再生中のアニメーションが新しいモデルにも適用されます。

:::info
無料のVRMAファイルは[BOOTHのVRoidプロジェクト](https://vroid.booth.pm/items/5512385)で配布されています。再配布する場合は、ファイルごとのライセンスを確認してください。
:::

## 複数のクリップをブレンドする

バッファーの配列を渡すと、複数のクリップを同時に再生します。各クリップの重みは`animation-weights`で指定します。

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :animation-data="[idle, wave]"
    :animation-weights="[0.7, 0.3]"
  />
</template>
```

- `animation-weights`を省略した場合や、要素数がクリップの数と合わない場合は、すべてのクリップが同じ重みになります。
- 重みの合計は`1.0`以下にしてください。超えると`animation:error`が発生します。

## ループ

アニメーションは既定でループします。1回だけ再生するには`loop`を`false`にします。最後のフレームで止まり、再生が終わると`animation:end`が発生します。

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

## 再生の制御

再生は[インスタンスAPI](../api/instance)で制御します。

| メソッド                        | 効果                                                                     |
| ------------------------------- | ------------------------------------------------------------------------ |
| `playAnimation(data, weights?)` | 新しいアニメーションを読み込んで再生します。再生中のものは置き換えます。 |
| `pauseAnimation()`              | 現在のフレームで一時停止します。                                         |
| `resumeAnimation()`             | 一時停止したアニメーションを再開します。                                 |
| `stopAnimation()`               | アニメーションを止め、先頭に戻します。                                   |

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

それぞれのメソッドは、対応するイベント（`animation:pause`、`animation:resume`、`animation:stop`）を発生させます。
