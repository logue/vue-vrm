---
description: vue-vrmコンポーネントが受け付けるpropsの一覧です。型と既定値を記載しています。
---

# Props

propsは、テンプレートではケバブケース（`model-data`）、JavaScriptではキャメルケース（`modelData`）で書きます。設定値の型（`CameraOptions`、`LightOptions`、`DirectionalLightOptions`、`CameraInteractionOptions`、`Vec3`、`AnimationData`）は`vue-vrm`からエクスポートしています。

## モデルとアニメーション

| Prop                | 型                             | 既定値      | 説明                                                                                                         |
| ------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `model-data`        | `ArrayBuffer`                  | `undefined` | VRM 1.0ファイルです。新しい値を渡すとモデルが差し替わり、`undefined`でモデルを外します。                     |
| `animation-data`    | `ArrayBuffer \| ArrayBuffer[]` | `undefined` | VRMAファイル、またはブレンドする複数のファイルです。[アニメーション](../guide/animation)を参照してください。 |
| `animation-weights` | `number[]`                     | `undefined` | 各クリップの重みです。省略時や要素数が合わないときは均等になります。合計は`1.0`以下にしてください。          |
| `loop`              | `boolean`                      | `true`      | アニメーションを繰り返します。`false`のときは1回再生して最後のフレームで止まります。                         |

## キャンバス

| Prop             | 型           | 既定値      | 説明                                                                  |
| ---------------- | ------------ | ----------- | --------------------------------------------------------------------- |
| `width`          | `number`     | `480`       | 幅（ピクセル）です。                                                  |
| `max-width`      | `number`     | `undefined` | 幅の上限です。                                                        |
| `aspect-ratio`   | `number`     | `3 / 4`     | 幅÷高さです。                                                         |
| `bg-transparent` | `boolean`    | `false`     | 背景を透明にします。                                                  |
| `bg-image`       | `string`     | `undefined` | 背景画像のURLです。`bg-transparent`を指定しているときは無視されます。 |
| `show-grid`      | `boolean`    | `false`     | 床にグリッドを表示します。                                            |
| `shader-pass`    | `ShaderPass` | `undefined` | 描画後に適用するthree.jsの`ShaderPass`です。                          |

## カメラ

| Prop                 | 型                         | 既定値                             | 説明                                                                                                  |
| -------------------- | -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `camera-options`     | `CameraOptions`            | `{ fov: 30, near: 0.1, far: 100 }` | 視野角（度）とクリッピング面です。                                                                    |
| `camera-distance`    | `number`                   | モデルに合わせた距離               | 注視点からの距離です。                                                                                |
| `camera-euler`       | `Vec3`                     | `[0, 0, 0]`                        | 注視点を中心にした回転（ラジアン）です。                                                              |
| `camera-offset`      | `Vec3`                     | `[0, 0, 0]`                        | カメラを置く基準点をずらします。                                                                      |
| `camera-look-at`     | `Vec3`                     | `[0, 0.9, 0]`                      | カメラが向く点です。オービット操作が有効な間は無視されます。                                          |
| `camera-interaction` | `CameraInteractionOptions` | `undefined`                        | オービット操作です。[カメラとライト](../guide/camera-and-lighting#orbit-controls)を参照してください。 |

## ライト

| Prop                | 型                        | 既定値                                                    | 説明           |
| ------------------- | ------------------------- | --------------------------------------------------------- | -------------- |
| `ambient-light`     | `LightOptions`            | `{ color: '#ffffff', intensity: 0.5 }`                    | 環境光です。   |
| `directional-light` | `DirectionalLightOptions` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 平行光源です。 |

## 型

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
