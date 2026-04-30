# Vue VRM

## 1. 概要 / Goal

VRMアバター表示に加え、VRMA（VRM Animation）によるモーション再生、および多機能な背景制御（透過・グリッド・画像）を備えた汎用Vue 3コンポーネントライブラリの構築。  
npm パッケージ名は **`vue-vrm`**（スコープなし）。

参考ソースコード：

- <https://github.com/logue/v.logue.dev/blob/master/src/components/VrmCanvas.vue>
- <https://github.com/logue/v.logue.dev/blob/master/src/composables/useVrmLoader.ts>
- <https://github.com/logue/v.logue.dev/blob/master/src/composables/useThreeScene.ts>
- <https://github.com/logue/v.logue.dev/blob/master/src/composables/useDragRotation.ts>

## 2. 追加機能の設計方針

- **VRM バージョン**: VRM 1.0（`VRMC_vrm`）のみを対象とする。0.x は対象外。
- **Animation (VRMA)**: ArrayBuffer で受け取った VRMA データを `@pixiv/three-vrm-animation` でパースし、既存の VRM モデルに流し込む。
  - `ArrayBuffer` 単体: 単一クリップを再生。
  - `ArrayBuffer[]`: 複数クリップを `THREE.AnimationMixer` 上で `weight` ブレンドして同時再生。ウェイトは `animationWeights` prop で指定。省略または配列長不一致の場合は均等配分（`1 / N`）にフォールバック。合計が `1.0` 超の場合は `error` emit して処理を中断。
- **Background**:
  - 透過: `alpha: true` 設定と `setClearColor(0, 0)` による制御。
  - 座標 (Grid): `GridHelper` の動的な追加/削除。
  - 画像: `TextureLoader` を用いた `scene.background` への適用（URL 文字列で受け取る）。
- **ArrayBuffer 渡し**: ライセンス問題・VRoid Hub からの取得ユースケースを考慮し、VRM / VRMA ファイルは ArrayBuffer で受け渡す。背景画像は URL で受け渡す（ライセンス制約が緩いため）。

## 3. 技術仕様 (Technical Specs)

### A. Props (Input)

| Prop             | Type                                 | Default | Description                                                                                                                            |
| ---------------- | ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| modelData        | ArrayBuffer                          | null    | VRM 1.0 モデルバイナリ                                                                                                                 |
| animationData    | ArrayBuffer \| ArrayBuffer[] \| null | null    | VRMA アニメーションバイナリ。単体で単一再生、配列でブレンド再生。変更時に自動再生（watch）。                                           |
| animationWeights | number[] \| null                     | null    | `animationData` が配列の場合の各クリップのブレンドウェイト。省略時または長さ不一致時は均等配分。合計が `1.0` 超の場合は `error` emit。 |
| bgTransparent    | boolean                              | false   | キャンバス背景を透過させるか                                                                                                           |
| bgImage          | string \| null                       | null    | 背景画像の URL。`scene.background` に適用。                                                                                            |
| showGrid         | boolean                              | false   | 地面の座標グリッドを表示するか                                                                                                         |
| maxWidth         | number \| null                       | null    | キャンバスの最大幅（px）。null で制限なし。                                                                                            |
| maxHeight        | number \| null                       | null    | キャンバスの最大高さ（px）。null で制限なし。                                                                                          |
| aspectRatio      | number                               | 9/16    | キャンバスのアスペクト比（width / height）                                                                                             |
| cameraDistance   | number                               | auto    | カメラとモデルの距離（ズーム）                                                                                                         |
| cameraPitch      | number                               | 0       | カメラの上下角度（度）                                                                                                                 |
| cameraYaw        | number                               | 0       | カメラの左右角度（度）                                                                                                                 |
| cameraPanX       | number                               | 0       | カメラのパン（X軸オフセット）                                                                                                          |
| cameraPanY       | number                               | 0       | カメラのパン（Y軸オフセット）                                                                                                          |

> **注**: カメラの初期値は VRM モデル全身が中央に収まる位置を自動計算する。カメラリセットは `resetCamera()` を `defineExpose` で公開する。

### B. Emits (Output)

| Event             | Payload                        | Description                                                 |
| ----------------- | ------------------------------ | ----------------------------------------------------------- |
| model:loading     | –                              | VRM モデルの読み込み開始                                    |
| model:loaded      | VRM                            | VRM モデルの読み込み完了                                    |
| model:unloaded    | –                              | VRM モデルのアンロード                                      |
| animation:loading | –                              | VRMA アニメーションの読み込み開始                           |
| animation:loaded  | VRMAnimation \| VRMAnimation[] | VRMA アニメーションの読み込み完了（配列渡し時は配列で返す） |
| error             | Error                          | 読み込みエラー                                              |

> `isLoading` 状態は `model:loading` / `model:loaded` イベントで親が管理する。

### C. Exposed Methods (defineExpose)

| Method                                                               | Return            | Description                                                  |
| -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| playAnimation(buf: ArrayBuffer \| ArrayBuffer[], weights?: number[]) | Promise\<void\>   | 手動でアニメーションを差し替えて再生。配列時はブレンド再生。 |
| stopAnimation()                                                      | void              | アニメーションを停止しポーズをリセット                       |
| resetCamera()                                                        | void              | カメラを初期位置（全身表示）にリセット                       |
| captureScreenshot(format?)                                           | Promise\<string\> | 現在フレームを dataURL で返す                                |

> `captureScreenshot` は dataURL（デフォルト `image/png`）を返す。引数 `format` で MIME タイプを変更可能。

## 4. パッケージ設計 (Package Design)

- **エントリポイント**: メインコンポーネントは `VrmCanvas.vue`。パッケージからは `VrmCanvas` コンポーネントと各コンポーザブル（`useVrmLoader`, `useVrmAnimation`, `useThreeScene` 等）を named export する。
- **ビルド形式**: ESM（`.mjs`）と CJS（`.cjs`）の両方を出力。
- **型定義**: `tsc --declaration` で `.d.ts` を生成。
- **peerDependencies**: `three`, `@pixiv/three-vrm`, `@pixiv/three-vrm-animation`, `vue ^3.3`。バンドルには含めない。
- **exports フィールド**:

```jsonc
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts",
    },
  },
}
```

## 5. 実装のステップ (Implementation Roadmap)

### 0. 入力バリデーション (validateGlb)

VRM / VRMA の `ArrayBuffer` はいずれも GLB（glTF Binary）形式。ローダーに渡す前に純粋なバイト操作で検証する。

| チェック項目    | 詳細                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| サイズ最小値    | 20 バイト未満（GLB ヘッダー 12 byte + JSON チャンクヘッダー 8 byte）は即拒否                                              |
| マジックバイト  | 先頭 4 バイト（uint32 LE）が `0x46546C67`（`"glTF"`）であること                                                           |
| GLB バージョン  | bytes 4–7（uint32 LE）が `2` であること                                                                                   |
| JSON チャンク型 | bytes 16–19（uint32 LE）が `0x4E4F534A`（`"JSON"`）であること                                                             |
| VRM 1.0 確認    | JSON チャンクをパースし `extensions.VRMC_vrm` が存在すること。`extensions.VRM`（0.x）のみの場合は「VRM 0.x 非対応」エラー |
| VRMA 確認       | JSON チャンクをパースし `extensions.VRMC_vrm_animation` が存在すること                                                    |

- バリデーション関数は `src/utils/validateGlb.ts` に切り出し、`useVrmLoader` / `useVrmAnimation` から呼び出す。
- バリデーション失敗時は `Error` を throw し、呼び出し元で `error` emit に変換する。

### 1. キャンバスサイズ管理

- `ResizeObserver` でコンテナ要素を監視し、`maxWidth` / `maxHeight` / `aspectRatio` に従って `<canvas>` サイズを動的に更新。
- `renderer.setSize()` および `camera.aspect` を同期する。

### 2. Background Manager

- `watch` で `bgTransparent`, `bgImage`, `showGrid` を監視。
- `bgImage` 変更時は `TextureLoader` で読み込み `scene.background` にセット。古いテクスチャは `texture.dispose()` でメモリ解放。
- `showGrid` 変更時は `GridHelper` を `scene.add` / `scene.remove`。

### 3. VRM Loader (useVrmLoader)

- `modelData` の watch で `GLTFLoader` + `VRMLoaderPlugin` を用いてパース（VRM 1.0 のみ）。
- ロード前後に `model:loading` / `model:loaded` を emit。
- 既存モデルがある場合は `VRMUtils.deepDispose()` でリソース解放後に差し替え。
- ロード後、`autoPositionY()` でモデルの足元を `y=0` に揃える。

### 4. VRMA Loader (useVrmAnimation)

- `@pixiv/three-vrm-animation` を使用。
- `animationData` の watch、または `playAnimation()` 呼び出しで処理を実行。
- **単体（ArrayBuffer）**: `loadVRMAnimation(buffer)` → 単一 `clipAction` を `weight: 1` で再生。
- **配列（ArrayBuffer[]）**: 各バッファに対して `loadVRMAnimation` を並列実行（`Promise.all`）し、全クリップを同一 `AnimationMixer` に登録。各 `clipAction` の `weight` を `animationWeights` prop または均等配分で設定して再生。
- 既存の `AnimationMixer` は差し替え時に `mixer.stopAllAction()` → `mixer.uncacheRoot()` → 再生成の順で破棄。

### 5. カメラ制御 (useThreeCamera)

- 初期カメラ位置: VRM の `BoundingBox` から全身が収まる距離を自動計算。
- props（`cameraDistance`, `cameraPitch`, `cameraYaw`, `cameraPanX`, `cameraPanY`）の watch でカメラ位置を更新。
- `resetCamera()` で初期計算値に戻す（`defineExpose` で公開）。

### 6. Animation Loop

- `requestAnimationFrame` 内で `mixer.update(delta)` を実行。
- `onUnmounted` で `cancelAnimationFrame` し、renderer / scene リソースを一括 dispose。

## 6. 注意事項 (Constraints & Tips)

- **GLB バリデーション**: ローダーに渡す前にマジックバイト・バージョン・JSON チャンク型を検証する。不正なバッファはパーサーに渡さず即 `error` emit する。
- **VRM 1.0 限定**: `extensions.VRMC_vrm` が存在しないモデルはエラー emit して処理を中断する。`extensions.VRM`（VRM 0.x）のみの場合は専用メッセージで通知する。
- **Texture Memory**: 背景画像を頻繁に変更する場合、古いテクスチャを `texture.dispose()` しないとメモリリークの原因になる。
- **Grid とモデル位置**: グリッド表示時にアバターが地面（y=0）に埋まらないよう、ロード後に足元の Y 位置を自動補正する。
- **アニメーションミキシング**: `animationData: ArrayBuffer[]` ＋ `animationWeights: number[]` で対応。ウェイトの合計が `1.0` を超える場合は不正な入力として `error` を emit し、処理を中断する。

## 7. コード構造のイメージ

```ts
// src/utils/validateGlb.ts
const GLB_MAGIC = 0x46546c67; // "glTF" in little-endian
const GLB_VERSION = 2;
const CHUNK_TYPE_JSON = 0x4e4f534a; // "JSON"

/** GLB ヘッダーとバージョンを検証し、JSON チャンクの内容をパースして返す */
function parseGlbJson(buffer: ArrayBuffer): Record<string, unknown> {
  if (buffer.byteLength < 20) {
    throw new Error('Invalid GLB: buffer too small');
  }
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('Invalid GLB: wrong magic bytes (not a glTF binary)');
  }
  if (view.getUint32(4, true) !== GLB_VERSION) {
    throw new Error(
      `Invalid GLB: unsupported version ${view.getUint32(4, true)}`,
    );
  }
  const jsonChunkLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_TYPE_JSON) {
    throw new Error('Invalid GLB: first chunk is not JSON');
  }
  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);
  return JSON.parse(new TextDecoder().decode(jsonBytes));
}

/** VRM 1.0 として有効かを検証する */
export function validateVrm(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if ('VRM' in ext && !('VRMC_vrm' in ext)) {
    throw new Error('VRM 0.x is not supported. Please use a VRM 1.0 model.');
  }
  if (!('VRMC_vrm' in ext)) {
    throw new Error('Invalid VRM: VRMC_vrm extension not found.');
  }
}

/** VRMA として有効かを検証する */
export function validateVrma(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if (!('VRMC_vrm_animation' in ext)) {
    throw new Error('Invalid VRMA: VRMC_vrm_animation extension not found.');
  }
}
```

```ts
// useVrmAnimation.ts の責務イメージ
export function useVrmAnimation() {
  const mixer = shallowRef<THREE.AnimationMixer | null>(null);

  const loadVRMA = async (
    buffers: ArrayBuffer | ArrayBuffer[],
    vrm: VRM,
    weights?: number[],
  ) => {
    // 既存 mixer の破棄
    if (mixer.value) {
      mixer.value.stopAllAction();
      mixer.value.uncacheRoot(mixer.value.getRoot());
    }

    const arr = Array.isArray(buffers) ? buffers : [buffers];
    const anims = await Promise.all(arr.map((buf) => loadVRMAnimation(buf)));

    mixer.value = new THREE.AnimationMixer(vrm.scene);

    // ウェイト: 省略・長さ不一致時は均等配分、合計 1.0 超はエラー
    const n = anims.length;
    const w = arr.map((_, i) => weights?.[i] ?? 1 / n);
    const total = w.reduce((sum, v) => sum + v, 0);
    if (total > 1.0 + Number.EPSILON) {
      throw new Error(`animationWeights の合計が 1.0 を超えています: ${total}`);
    }

    anims.forEach((anim, i) => {
      const clip = createVRMAnimationClip(anim, vrm);
      const action = mixer.value!.clipAction(clip);
      action.weight = w[i];
      action.play();
    });
  };

  return { mixer, loadVRMA };
}
```
