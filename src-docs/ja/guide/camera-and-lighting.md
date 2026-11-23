---
description: vue-vrmのカメラとライトの設定です。自動フレーミング、カメラのprops、ロール付きのオービット操作、環境光と平行光源を説明します。
---

# カメラとライト

## 自動フレーミング

モデルを読み込むと、全身が画面に収まるようにカメラの距離が決まります。ユーザーがカメラを動かした後は、`resetCamera()`でこの位置に戻せます。

## カメラのprops

| Prop              | 既定値                             | 効果                                                                      |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `camera-options`  | `{ fov: 30, near: 0.1, far: 100 }` | 視野角（度）とクリッピング面です。省略した項目は既定値になります。        |
| `camera-look-at`  | `[0, 0.9, 0]`                      | カメラが向く点（メートル）です。オービット操作が有効な間は無視されます。  |
| `camera-distance` | モデルに合わせた距離               | 注視点からの距離です。自動フレーミングより優先されます。                  |
| `camera-euler`    | `[0, 0, 0]`                        | 注視点を中心にした回転です。オイラー角（X、Y、Z）をラジアンで指定します。 |
| `camera-offset`   | `[0, 0, 0]`                        | カメラを置く基準点（モデルの中心）をずらします。                          |

カメラは、基準点から`camera-distance`だけ離れた位置を`camera-euler`で回転させた場所に置かれます。基準点はモデルの中心に`camera-offset`を足した位置です。たとえば、少し左から顔を映すには次のようにします。

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

カメラの位置や注視点が変わると`camera:change`が、`camera-options`が変わると`camera:options-change`が発生します。

## オービット操作 {#orbit-controls}

`camera-interaction`を指定すると、マウスやタッチでカメラを動かせるようになります。既定では無効です。

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

| オプション      | 既定値     | 効果                                                         |
| --------------- | ---------- | ------------------------------------------------------------ |
| `enabled`       | —          | 操作を有効にします。必須です。                               |
| `rotate`        | `true`     | ドラッグで注視点の周りを回転します。                         |
| `pan`           | `true`     | 右ドラッグまたはCtrl＋ドラッグで平行移動します。             |
| `zoom`          | `true`     | マウスホイールまたはピンチ操作でズームします。               |
| `roll`          | `false`    | キャンバスにフォーカスがある間、Q／Eキーでカメラを傾けます。 |
| `rotateSpeed`   | `1`        | 回転の速さです。                                             |
| `panSpeed`      | `1`        | 平行移動の速さです。                                         |
| `zoomSpeed`     | `1`        | ズームの速さです。                                           |
| `damping`       | `true`     | ポインターを離した後の動きを滑らかにします。                 |
| `dampingFactor` | `0.08`     | 減衰の強さです。                                             |
| `minDistance`   | `0.1`      | 注視点に近づける最短距離です。                               |
| `maxDistance`   | `Infinity` | 注視点から離れられる最長距離です。                           |
| `rollSpeed`     | `0.03`     | キーを1回押したときに傾く角度（ラジアン）です。              |

:::tip
`roll`を有効にすると、キャンバスにフォーカスできるようになります。Q／Eキーを押す前に、キャンバスをクリックするか、Tabキーでフォーカスを移してください。
:::

## ライト

シーンには環境光と平行光源が1つずつあります。

| Prop                | 既定値                                                    | 効果                                   |
| ------------------- | --------------------------------------------------------- | -------------------------------------- |
| `ambient-light`     | `{ color: '#ffffff', intensity: 0.5 }`                    | すべての面を均等に照らす光です。       |
| `directional-light` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 太陽光のように一方向から当たる光です。 |

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :ambient-light="{ color: '#ffe8d0', intensity: 0.6 }"
    :directional-light="{ color: '#ffffff', intensity: 1.2, position: [-1, 2, 1] }"
  />
</template>
```

変更はすぐに反映され、`light:ambient-change`と`light:directional-change`で通知されます。
