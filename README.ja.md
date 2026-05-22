# vue-vrm

<div align="center">
  <img width="256" height="256" alt="vue-vrm" src="https://github.com/user-attachments/assets/8257613a-bd29-48b7-ad0c-3625431599bc" />
</div>

[![jsdelivr CDN](https://data.jsdelivr.com/v1/package/npm/vue-vrm/badge)](https://www.jsdelivr.com/package/npm/vue-vrm)
[![NPM Downloads](https://img.shields.io/npm/dm/vue-vrm.svg?style=flat)](https://www.npmjs.com/package/vue-vrm)
[![npm version](https://img.shields.io/npm/v/vue-vrm.svg)](https://www.npmjs.com/package/vue-vrm)
[![Open in unpkg](https://img.shields.io/badge/Open%20in-unpkg-blue)](https://uiwjs.github.io/npm-unpkg/#/pkg/vue-vrm/file/README.md)

[three.js](https://threejs.org/) を使用して [VRM アバター](https://vrm.dev/ja/)をレンダリングするための Vue 3 コンポーネントライブラリです。[VRM 1.0](https://vrm.dev/vrm1/) の読み込み、[VRMA](https://vrm.dev/vrma/) の再生、カメラ操作、スクリーンショット、および VRM / VRMA バッファを操作するための低レベルなユーティリティをサポートしています。

## 機能

- `ArrayBuffer` から VRM 1.0 モデルをレンダリングする Vue 3 コンポーネント
- 単一または複数のアニメーションクリップでの VRMA 再生
- カメラ、ライト、背景、グリッド、およびオプションのシェーダーパスを設定可能
- 回転、パン、ズーム、ロールを含むオプションの追尾カメラインタラクション
- 再生制御、カメラリセット、およびスクリーンショットの公開メソッド
- コンポーネント外での VRM / VRMA アセット検証と読み込みのためのユーティリティエクスポート

> [!IMPORTANT]
> 本ライブラリは、VRM/VRMA ファイルがソースコード、ソースマップ、またはブラウザのネットワークログに表示され**ライセンス制限**に抵触することを防ぐため、ファイルパスの代わりに `ArrayBuffer` のみを受け取る実装になっています。
>
> 安全のためファイルは（[Amazon S3](https://aws.amazon.com/jp/s3/)、[Cloudflare R2](https://www.cloudflare.com/ja-jp/developer-platform/products/r2/) など）のようなオブジェクトストレージに保存した上で、API（[VRoid Hub API](https://developer.vroid.com/api/) など）経由で動的に取得するようにしてください。

## 要件

- Node.js `>=24`
- Vue `>=3.5`
- three `>=0.184`
- `@pixiv/three-vrm` `>=3.5`
- `@pixiv/three-vrm-animation` `>=3.5`

## インストール

```sh
pnpm add vue-vrm vue three @pixiv/three-vrm @pixiv/three-vrm-animation
```

## クイックスタート

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VrmCanvas } from 'vue-vrm';

const modelData = ref<ArrayBuffer | null>(null);

async function onModelFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  modelData.value = await file.arrayBuffer();
}
</script>

<template>
  <div>
    <input type="file" accept=".vrm,.glb" @change="onModelFile" />
    <VrmCanvas :model-data="modelData" :show-grid="true" />
  </div>
</template>
```

## コンポーネント例

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { resetVrmCanvasCamera, type VrmCanvasExposed, VrmCanvas } from 'vue-vrm';

const modelData = ref<ArrayBuffer | null>(null);
const animationData = ref<ArrayBuffer | null>(null);
const canvasRef = ref<VrmCanvasExposed | null>(null);

const cameraInteraction = computed(() => ({
  enabled: true,
  rotate: true,
  pan: true,
  zoom: true,
  roll: true,
  damping: true
}));

async function loadFile(event: Event, target: 'model' | 'animation'): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();

  if (target === 'model') {
    modelData.value = buffer;
    return;
  }

  animationData.value = buffer;
}

function resetCamera(): void {
  resetVrmCanvasCamera(canvasRef.value);
}
</script>

<template>
  <fieldset>
    <legend>VRMデモ</legend>
    <input type="file" accept=".vrm,.glb" @change="event => loadFile(event, 'model')" />
    <input type="file" accept=".vrma,.glb" @change="event => loadFile(event, 'animation')" />

    <button type="button" @click="resetCamera">カメラをリセット</button>

    <VrmCanvas
      ref="canvasRef"
      :model-data="modelData"
      :animation-data="animationData"
      :show-grid="true"
      :camera-interaction="cameraInteraction"
      :directional-light="{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }"
      @model:loaded="() => console.log('model loaded')"
      @animation:start="() => console.log('animation started')"
      @error="error => console.error(error)"
    />
  </fieldset>
</template>
```

## 実装例

実際の使用パターンについては、以下の例を参照してください（いずれも[Cloudflare Workers](https://developers.cloudflare.com/workers/)を使用）：

- [VRoid Hub API 連携](https://github.com/logue/v.logue.dev/blob/master/functions/api/vrm/%5Bavatar_id%5D.ts) — VRoid Hub API を使用して VRM アバターを読み込む
- [Cloudflare Workers 例](https://github.com/logue/v.logue.dev/blob/master/functions/api/assets/%5B%5Bpath%5D%5D.ts) — Cloudflare Workers を介して VRM アセットを取得する

## Props

| Props               | Type                                                                                                                                                                                                                                                                     | デフォルト                                                | 説明                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelData`         | `ArrayBuffer \| null`                                                                                                                                                                                                                                                    | `null`                                                    | VRM 1.0 モデルバッファ。新しい値を設定すると、現在のモデルがアンロードされ、新しいモデルが読み込まれます。                                        |
| `animationData`     | `ArrayBuffer \| ArrayBuffer[] \| null`                                                                                                                                                                                                                                   | `null`                                                    | VRMA バッファまたは読み込まれたモデルで再生する複数の VRMA バッファ。                                                                             |
| `animationWeights`  | `number[] \| null`                                                                                                                                                                                                                                                       | `null`                                                    | 複数のアニメーションのブレンド重み。省略または無効な場合は、各アニメーションの重みが均等に分割されます。                                          |
| `loop`              | `boolean`                                                                                                                                                                                                                                                                | `true`                                                    | アニメーション再生がループするかどうか。                                                                                                          |
| `bgTransparent`     | `boolean`                                                                                                                                                                                                                                                                | `false`                                                   | 透明な背景でレンダリングされます。                                                                                                                |
| `bgImage`           | `string \| null`                                                                                                                                                                                                                                                         | `null`                                                    | 背景テクスチャ URL。`bgTransparent` が `true` の場合は無視されます。                                                                              |
| `showGrid`          | `boolean`                                                                                                                                                                                                                                                                | `false`                                                   | `THREE.GridHelper` を表示します。                                                                                                                 |
| `width`             | `number`                                                                                                                                                                                                                                                                 | `480`                                                     | VRM表示領域の基本幅（ピクセル単位）。                                                                                                             |
| `maxWidth`          | `number \| null`                                                                                                                                                                                                                                                         | `null`                                                    | コンテナがより広い場合、レンダリング幅をキャップします。                                                                                          |
| `aspectRatio`       | `number`                                                                                                                                                                                                                                                                 | `3 / 4`                                                   | VRM表示領域のアスペクト比（幅 / 高さ）。                                                                                                          |
| `cameraOptions`     | `{ fov?: number; near?: number; far?: number }`                                                                                                                                                                                                                          | `{ fov: 30, near: 0.1, far: 100 }`                        | 視点カメラの設定。                                                                                                                                |
| `cameraDistance`    | `number \| null`                                                                                                                                                                                                                                                         | `null`                                                    | 自動計算されたカメラの距離をオーバーライドします。                                                                                                |
| `cameraEuler`       | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0, 0]`                                               | ラジアン単位のカメラ回転（Euler 角）。                                                                                                            |
| `cameraOffset`      | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0, 0]`                                               | カメラ対象に適用されるオフセット。                                                                                                                |
| `cameraLookAt`      | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0.9, 0]`                                             | カメラが注視する初期点。                                                                                                                          |
| `ambientLight`      | `{ color: string; intensity: number }`                                                                                                                                                                                                                                   | `{ color: '#ffffff', intensity: 0.5 }`                    | 周辺ライトの構成。                                                                                                                                |
| `directionalLight`  | `{ color: string; intensity: number; position: [number, number, number] }`                                                                                                                                                                                               | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 指向性ライトの構成。                                                                                                                              |
| `shaderPass`        | `ShaderPass \| null`                                                                                                                                                                                                                                                     | `null`                                                    | `EffectComposer` に追加されるオプションのポストプロセッシングシェーダーパス。                                                                     |
| `cameraInteraction` | `{ enabled?: boolean; rotate?: boolean; pan?: boolean; zoom?: boolean; roll?: boolean; rotateSpeed?: number; panSpeed?: number; zoomSpeed?: number; damping?: boolean; dampingFactor?: number; minDistance?: number; maxDistance?: number; rollSpeed?: number } \| null` | `null`                                                    | オービットスタイルのカメラインタラクションを有効にします。ロールはVRMの表示されている部分にフォーカスされている場合、`Q` / `E` キーを使用します。 |

## イベント

| イベント                   | ペイロード                                                             | 説明                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `model:loading`            | なし                                                                   | モデルの読み込みが開始される前に発火します。                                                         |
| `model:loaded`             | `VRM`                                                                  | モデルが読み込まれてシーンに追加された後に発火します。                                               |
| `model:unloaded`           | なし                                                                   | 前のモデルが削除された後に発火します。                                                               |
| `model:error`              | `Error`                                                                | モデルの検証または読み込みに失敗したときに発火します。                                               |
| `animation:loading`        | なし                                                                   | アニメーション読み込みが開始される前に発火します。                                                   |
| `animation:loaded`         | `VRMAnimation \| VRMAnimation[]`                                       | アニメーションデータが解析されてミキサーに接続された後に発火します。                                 |
| `animation:start`          | なし                                                                   | 再生が開始された後に発火します。                                                                     |
| `animation:pause`          | なし                                                                   | 公開 API を介して再生が一時停止されたときに発火します。                                              |
| `animation:resume`         | なし                                                                   | 公開 API を介して再生が再開されたときに発火します。                                                  |
| `animation:stop`           | なし                                                                   | 公開 API を介して再生が停止されたときに発火します。                                                  |
| `animation:end`            | なし                                                                   | ループしないアニメーションが終了したときに発火します。                                               |
| `animation:error`          | `Error`                                                                | アニメーション検証または読み込みに失敗したときに発火します。                                         |
| `camera:change`            | `{ position: THREE.Vector3; lookAt: THREE.Vector3; distance: number }` | アクティブなカメラ変換が変更されたときに発火します。                                                 |
| `camera:options-change`    | `{ fov?: number; near?: number; far?: number }`                        | `cameraOptions` が変更されたときに発火します。                                                       |
| `light:ambient-change`     | `{ color: string; intensity: number }`                                 | 周辺ライト props が変更されたときに発火します。                                                      |
| `light:directional-change` | `{ color: string; intensity: number; position: THREE.Vector3 }`        | 指向性ライト props が変更されたときに発火します。                                                    |
| `error`                    | `Error`                                                                | 背景テクスチャ読み込みエラーなどのコンポーネントレベルのランタイムエラーが発火したときに発火します。 |

## 公開コンポーネントメソッド

テンプレート参照を使用してコンポーネントインスタンスにアクセスします。

| メソッド                             | 戻り値                            | 説明                                         |
| ------------------------------------ | --------------------------------- | -------------------------------------------- |
| `playAnimation()`                    | `void`                            | アニメーション再生を開始または再開します。   |
| `pauseAnimation()`                   | `void`                            | アクティブなアニメーションを一時停止します。 |
| `resumeAnimation()`                  | `void`                            | 一時停止されたアニメーションを再開します。   |
| `stopAnimation()`                    | `void`                            | 再生を停止して最初に巻き戻します。           |
| `resetCamera()`                      | `void`                            | カメラを初期フィットポーズにリセットします。 |
| `resetCameraPose()`                  | `void`                            | `resetCamera()` のエイリアス。互換性のため。 |
| `captureScreenshot(format?: string)` | `Promise<string>`                 | 現在のフレームのデータ URL を返します。      |
| `getScene()`                         | `THREE.Scene \| null`             | 内部のシーンインスタンスを返します。         |
| `getCamera()`                        | `THREE.PerspectiveCamera \| null` | 内部のカメラインスタンスを返します。         |
| `getRenderer()`                      | `THREE.WebGLRenderer \| null`     | 内部のレンダラーインスタンスを返します。     |
| `getMixer()`                         | `THREE.AnimationMixer \| null`    | 現在のミキサー（存在する場合）を返します。   |
| `getVrm()`                           | `VRM \| null`                     | 読み込まれた VRM インスタンスを返します。    |
| `getCanvas()`                        | `HTMLCanvasElement \| null`       | 内部のVRM表示領域要素を返します。            |

## ユーティリティエクスポート

パッケージは、コンポーネント以外の使用例のための低レベルなヘルパーもエクスポートします。

```ts
import {
  autoPositionY,
  createMixerWithClips,
  disposeMixer,
  disposeVrm,
  loadVRMAnimation,
  loadVrm,
  meta,
  resetVrmCanvasCamera,
  validateVrm,
  validateVrma
} from 'vue-vrm';
```

| エクスポート                                      | 説明                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `resetVrmCanvasCamera(instance)`                  | `VrmCanvas` テンプレート参照を安全にリセットします。`resetCamera()` と `resetCameraPose()` の両方の互換性があります。 |
| `loadVrm(buffer)`                                 | VRM 1.0 モデルを `ArrayBuffer` から検証して読み込みます。                                                             |
| `autoPositionY(vrm)`                              | 読み込まれた VRM を移動して、足が `y = 0` に座るようにします。                                                        |
| `disposeVrm(vrm)`                                 | VRM シーンと GPU リソースを破棄します。                                                                               |
| `loadVRMAnimation(buffer)`                        | VRMA クリップを `ArrayBuffer` から検証して読み込みます。                                                              |
| `createMixerWithClips(vrm, animations, weights?)` | オプションのブレンド重みを使用して `THREE.AnimationMixer` を作成します。                                              |
| `disposeMixer(mixer)`                             | ミキサーのアクションを停止してルートをキャッシュから削除します。                                                      |
| `validateVrm(buffer)`                             | バッファがサポートされている VRM 1.0 GLB でない場合、スローします。                                                   |
| `validateVrma(buffer)`                            | バッファが VRMA GLB でない場合、スローします。                                                                        |
| `meta`                                            | ライブラリバージョンとビルド日を含むメタデータを構築します。                                                          |

## 注意

- VRM 1.0 のみがサポートされています。[VRM 0.x](https://vrm.dev/univrm/ja/) バッファは検証中に拒否されます。
- `animationWeights` の合計は `1.0` を超えてはいけません。
- `cameraInteraction.roll` はVRM表示領域がフォーカスされているときに `Q` と `E` キーで機能します。
- `modelData` に `null` を渡すと、現在のモデルがアンロードされます。

## コード分割の推奨事項

Vite または別の Rollup ベースのツールでバンドルする場合、`three` と VRM パッケージを別のチャンクに分割すると、キャッシュ可能性と初期バンドル読み込み動作が向上します。

```ts
import type { UserConfig } from 'vite';

const config: UserConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/node_modules/three/')) {
            return 'three';
          }

          if (
            id.includes('/node_modules/@pixiv/three-vrm') ||
            id.includes('/node_modules/@pixiv/three-vrm-animation')
          ) {
            return 'three-vrm';
          }

          return 'vendor';
        }
      }
    }
  }
};

export default config;
```

## 開発

このプロジェクトは [Vite](https://vite.dev/) ではなく [Rspack](https://rspack.rs/) スタックを使用しています。

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
```

デモアプリの場合：

```sh
pnpm dev
pnpm preview
```

## ライセンス

© 2026 Logue. [MIT License](LICENSE) の下でライセンスされています。

## 🎨 開発者向けに作成

このテンプレートは、**UI/UX の卓越性**と**最新の開発者体験**に焦点を当てて構築されています。これを保守することは、すべてがシームレスに機能することを確認するための継続的なテストと更新を伴います。

このプロジェクトの細部への注意を高く評価していただけるのであれば、小額のスポンサーシップはVue.js とメタバース エコシステム全体での私の仕事をサポートするために大いに役に立つでしょう。

[![GitHub Sponsors](https://img.shields.io/github/sponsors/logue?label=Sponsor&logo=github&color=ea4aaa)](https://github.com/sponsors/logue)
