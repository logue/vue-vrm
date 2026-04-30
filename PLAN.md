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
  - `ArrayBuffer[]`: 複数クリップを `THREE.AnimationMixer` 上で `weight` ブレンドして同時再生。ウェイトは `animationWeights` prop で指定。省略または配列長不一致の場合は均等配分（`1 / N`）にフォールバック。合計が `1.0` 超の場合は `animation:error` emit して処理を中断。
- **Background**:
  - 透過: `alpha: true` 設定と `setClearColor(0, 0)` による制御。
  - 座標 (Grid): `GridHelper` の動的な追加/削除。
  - 画像: `TextureLoader` を用いた `scene.background` への適用（URL 文字列で受け取る）。
- **ArrayBuffer 渡し**: ライセンス問題・VRoid Hub からの取得ユースケースを考慮し、VRM / VRMA ファイルは ArrayBuffer で受け渡す。背景画像は URL で受け渡す（ライセンス制約が緩いため）。

## 3. 技術仕様 (Technical Specs)

### A. Props (Input)

| Prop                      | Type                                 | Default     | Description                                                                                                                                      |
| ------------------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| modelData                 | ArrayBuffer                          | null        | VRM 1.0 モデルバイナリ                                                                                                                           |
| animationData             | ArrayBuffer \| ArrayBuffer[] \| null | null        | VRMA アニメーションバイナリ。単体で単一再生、配列でブレンド再生。変更時に自動再生（watch）。                                                     |
| animationWeights          | number[] \| null                     | null        | `animationData` が配列の場合の各クリップのブレンドウェイト。省略時または長さ不一致時は均等配分。合計が `1.0` 超の場合は `animation:error` emit。 |
| bgTransparent             | boolean                              | false       | キャンバス背景を透過させるか                                                                                                                     |
| bgImage                   | string \| null                       | null        | 背景画像の URL。`scene.background` に適用。                                                                                                      |
| showGrid                  | boolean                              | false       | 地面の座標グリッドを表示するか                                                                                                                   |
| maxWidth                  | number \| null                       | null        | キャンバスの最大幅（px）。null で制限なし。                                                                                                      |
| maxHeight                 | number \| null                       | null        | キャンバスの最大高さ（px）。null で制限なし。                                                                                                    |
| aspectRatio               | number                               | 9/16        | キャンバスのアスペクト比（width / height）                                                                                                       |
| cameraDistance            | number                               | auto        | カメラとモデルの距離（ズーム）                                                                                                                   |
| cameraEuler               | [number, number, number]             | [0, 0, 0]   | カメラの回転（ラジアン）。`[x, y, z]` = `[pitch, yaw, roll]` の順。`THREE.Euler` にそのまま渡す。                                                |
| cameraOffset              | [number, number, number]             | [0, 0, 0]   | カメラのオフセット（パン）。`[x, y, z]` の順。`THREE.Vector3` にそのまま渡す。                                                                   |
| cameraLookAt              | [number, number, number]             | [0, 0.9, 0] | カメラの注視点。`[x, y, z]` の順。`camera.lookAt()` に渡す。デフォルト `y=0.9` は VRM キャラクターの概ね首元の高さ。                             |
| ambientLightColor         | string                               | `'#ffffff'` | 環境光の色。CSS カラー文字列または16進数文字列。`THREE.AmbientLight` の `color` に渡す。                                                         |
| ambientLightIntensity     | number                               | 0.5         | 環境光の強度。                                                                                                                                   |
| directionalLightColor     | string                               | `'#ffffff'` | 平行光源の色。CSS カラー文字列または16進数文字列。`THREE.DirectionalLight` の `color` に渡す。                                                   |
| directionalLightIntensity | number                               | 1.0         | 平行光源の強度。                                                                                                                                 |
| directionalLightPosition  | [number, number, number]             | [1, 1, 1]   | 平行光源の位置。`[x, y, z]` の順。`THREE.DirectionalLight.position.set(x, y, z)` に渡す。                                                        |

> [!WARNING]
> カメラの初期値は VRM モデル全身が中央に収まる位置を自動計算する。
> カメラリセットは `resetCamera()` を `defineExpose` で公開する。
> `cameraEuler` は `new THREE.Euler(x, y, z)` に直接渡すラジアン値（`[pitch, yaw, roll]` 順）。
> `cameraOffset` は `new THREE.Vector3(x, y, z)` に直接渡すワールド座標オフセット。
> `cameraLookAt` は `camera.lookAt(x, y, z)` に渡す注視点（デフォルト `y=0.9` で首元を向く）。
> `cameraOptions` 変更時は `THREE.PerspectiveCamera` を再生成した後、`resetCamera()` で初期位置を再計算する。

### B. Emits (Output)

| Event                    | Payload                                                                | Description                                                    |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| model:loading            | –                                                                      | VRM モデルの読み込み開始                                       |
| model:loaded             | VRM                                                                    | VRM モデルの読み込み完了                                       |
| model:unloaded           | –                                                                      | VRM モデルのアンロード                                         |
| model:error              | Error                                                                  | VRM モデルの読み込み・バリデーションエラー                     |
| animation:loading        | –                                                                      | VRMA アニメーションの読み込み開始                              |
| animation:loaded         | VRMAnimation \| VRMAnimation[]                                         | VRMA アニメーションの読み込み完了（配列渡し時は配列で返す）    |
| animation:start          | –                                                                      | アニメーション再生開始（`playAnimation()` 実行時）             |
| animation:pause          | –                                                                      | アニメーション一時停止（`pauseAnimation()` 実行時）            |
| animation:resume         | –                                                                      | アニメーション再開（`resumeAnimation()` 実行時）               |
| animation:stop           | –                                                                      | アニメーション停止＆ポーズリセット（`stopAnimation()` 実行時） |
| animation:end            | –                                                                      | アニメーションクリップが終端に達した時（ループオフ時のみ）     |
| animation:error          | Error                                                                  | VRMA 読み込み・バリデーション・ウェイトエラー                  |
| camera:change            | `{ position: THREE.Vector3; lookAt: THREE.Vector3; distance: number }` | カメラの position / lookAt / distance のいずれかが変わった時   |
| camera:options-change    | `{ fov: number; near: number; far: number }`                           | `cameraOptions` prop が変わりカメラを再生成した時              |
| light:ambient-change     | `{ color: string; intensity: number }`                                 | 環境光の color または intensity が変わった時                   |
| light:directional-change | `{ color: string; intensity: number; position: THREE.Vector3 }`        | 平行光源の color / intensity / position のいずれかが変わった時 |
| error                    | Error                                                                  | Three.js レンダラー・シーン等のシステムレベルエラー            |

> [!NOTE]
> `isLoading` 状態は `model:loading` / `model:loaded` イベントで親が管理する。
> emit ペイロードの型（`VRM`, `VRMAnimation`）は `@pixiv/three-vrm` / `@pixiv/three-vrm-animation` の型をそのまま使用する。

### C. Exposed Methods (defineExpose)

#### アニメーション・カメラ操作

| Method                                                               | Return            | Description                                                       |
| -------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| playAnimation(buf: ArrayBuffer \| ArrayBuffer[], weights?: number[]) | Promise\<void\>   | 手動でアニメーションを差し替えて再生。配列時はブレンド再生。      |
| pauseAnimation()                                                     | void              | アニメーションを一時停止（`mixer.timeScale = 0`）。ポーズは維持。 |
| resumeAnimation()                                                    | void              | 一時停止中のアニメーションを再開（`mixer.timeScale = 1`）。       |
| stopAnimation()                                                      | void              | アニメーションを停止しポーズをリセット                            |
| resetCamera()                                                        | void              | カメラを初期位置（全身表示）にリセット                            |
| captureScreenshot(format?)                                           | Promise\<string\> | 現在フレームを dataURL で返す                                     |

#### Three.js インスタンスへの直接アクセス

コンポーネントを経由せず Three.js を直接操作するためのゲッター。いずれも `null`（未初期化時）を返す可能性があるため、呼び出し元で null チェックが必要。

| Getter        | Return                          | Description                          |
| ------------- | ------------------------------- | ------------------------------------ |
| getScene()    | THREE.Scene \| null             | シーンインスタンス                   |
| getCamera()   | THREE.PerspectiveCamera \| null | カメラインスタンス                   |
| getRenderer() | THREE.WebGLRenderer \| null     | レンダラーインスタンス               |
| getMixer()    | THREE.AnimationMixer \| null    | アニメーションミキサーインスタンス   |
| getVrm()      | VRM \| null                     | 現在ロード済みの VRM インスタンス    |
| getCanvas()   | HTMLCanvasElement \| null       | コンポーネント内部の `<canvas>` 要素 |

> [!NOTE]
> `captureScreenshot` は dataURL（デフォルト `image/png`）を返す。
> 引数 `format` で MIME タイプを変更可能。

## 4. パッケージ設計 (Package Design)

- **エントリポイント**: メインコンポーネントは `VrmCanvas.vue`。パッケージからは `VrmCanvas` コンポーネントと各コンポーザブル（`useVrmLoader`, `useVrmAnimation`, `useThreeScene` 等）を named export する。
- **ビルド形式**: ESM（`.mjs`）と CJS（`.cjs`）の両方を出力。
- **型定義**: `tsc --declaration` で `.d.ts` を生成。公開 API（emits のペイロード・`defineExpose` の戻り値）には Three.js / `@pixiv/three-vrm` の型をそのまま使用する（`VRM`, `VRMAnimation`, `THREE.AnimationMixer` 等を独自ラップしない）。利用者は `@types/three` を別途インストールする必要がある。
- **peerDependencies**: `three`, `@pixiv/three-vrm`, `@pixiv/three-vrm-animation`, `vue >=3.5`。バンドルには含めない。
- **peerDevDependencies**: `@types/three`（型定義の参照に必要）。
- **exports フィールド**:

```jsonc
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
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
- バリデーション失敗時は `Error` を throw し、呼び出し元で VRM 系は `model:error`、VRMA 系は `animation:error` emit に変換する。GLB 形式自体の破損（マジックバイト不正等）も同様。

### 1. キャンバスサイズ管理

- `ResizeObserver` でコンテナ要素を監視し、`maxWidth` / `maxHeight` / `aspectRatio` に従って `<canvas>` サイズを動的に更新。
- `ResizeObserver` が返すコンテナサイズが `0×0`（コンテナに CSS サイズ未指定）の場合は `width` / `height` prop のフォールバック値を使用する。
- `renderer.setSize()` および `camera.aspect` を同期する。

### 2. Background Manager

- `watch` で `bgTransparent`, `bgImage`, `showGrid` を監視。
- `bgImage` 変更時は `TextureLoader` で読み込み `scene.background` にセット。古いテクスチャは `texture.dispose()` でメモリ解放。
- `showGrid` 変更時は `GridHelper` を `scene.add` / `scene.remove`。

### 3. Lighting Manager

- `watch` で `ambientLightColor`, `ambientLightIntensity`, `directionalLightColor`, `directionalLightIntensity`, `directionalLightPosition` を監視。
- `AmbientLight` と `DirectionalLight` は `onMounted` 時に生成し `scene.add`。
- 各 prop 変更時は `.color.set()` / `.intensity` / `.position.set()` で差分更新（ライトの再生成は不要）。
- `DirectionalLight` のデフォルト位置 `[1, 1, 1]` はモデル斜め上前方を照らす一般的な初期値。

### 4. VRM Loader (useVrmLoader)

- `modelData` の watch で `GLTFLoader` + `VRMLoaderPlugin` を用いてパース（VRM 1.0 のみ）。
- ロード前後に `model:loading` / `model:loaded` を emit。
- 既存モデルがある場合は `VRMUtils.deepDispose()` でリソース解放後に差し替え。
- ロード後、`autoPositionY()` でモデルの足元を `y=0` に揃える。

### 5. VRMA Loader (useVrmAnimation)

- `@pixiv/three-vrm-animation` を使用。
- `animationData` の watch、または `playAnimation()` 呼び出しで処理を実行。
- **単体（ArrayBuffer）**: `loadVRMAnimation(buffer)` → 単一 `clipAction` を `weight: 1` で再生。
- **配列（ArrayBuffer[]）**: 各バッファに対して `loadVRMAnimation` を並列実行（`Promise.all`）し、全クリップを同一 `AnimationMixer` に登録。各 `clipAction` の `weight` を `animationWeights` prop または均等配分で設定して再生。
- 既存の `AnimationMixer` は差し替え時に `mixer.stopAllAction()` → `mixer.uncacheRoot()` → 再生成の順で破棄。

### 6. カメラ制御 (useThreeCamera)

- `onMounted` 時に `cameraOptions`（`fov`, `near`, `far`）と canvas の `aspect` で `THREE.PerspectiveCamera` を生成。
- `cameraOptions` の watch: カメラを再生成し、`resetCamera()` で初期位置を再計算。
- 初期カメラ位置: VRM の `BoundingBox` から全身が収まる距離を自動計算。
- props（`cameraDistance`, `cameraEuler`, `cameraOffset`, `cameraLookAt`）の watch でカメラ位置を更新。`cameraLookAt` 変更時は `camera.lookAt(...cameraLookAt)` を呼び出す。
- `resetCamera()` で初期計算値に戻す（`defineExpose` で公開）。

### 7. Post-processing (useThreeComposer)

- `shaderPass` prop が `null` の場合は `EffectComposer` を生成せず、通常の `renderer.render(scene, camera)` で描画。
- `shaderPass` prop に `ShaderPass` インスタンスが渡された場合:
  - `EffectComposer` を生成し `RenderPass(scene, camera)` を先頭に追加。
  - `shaderPass` を追加し、最後に `OutputPass` を追加。
  - アニメーションループの `renderer.render()` を `composer.render()` に切り替える。
- `shaderPass` watch で `null` に戻った場合は `composer.dispose()` し、通常描画に戻す。
- `ResizeObserver` によるサイズ変更時は `composer.setSize()` も同期する。
- **将来構想**: 複数 `ShaderPass` の配列対応（`shaderPasses: ShaderPass[]`）は現段階では未実装。

### 8. Animation Loop

- `requestAnimationFrame` 内で `mixer.update(delta)` を実行。ポストプロセス有効時は `composer.render()`、無効時は `renderer.render(scene, camera)` で描画。
- `onUnmounted` で `cancelAnimationFrame` し、renderer / composer / scene リソースを一括 dispose。

## 6. 注意事項 (Constraints & Tips)

- **ShaderPass / EffectComposer**: `shaderPass` prop を渡すと内部で `EffectComposer` を生成し、`renderer.render()` の代わりに `composer.render()` を屋内ループで呼び出す。コンポーザーの対象レンダラーには `preserveDrawingBuffer: true` が必要な場合があるため `captureScreenshot()` の動作を要検証。`shaderPass` に `null` を渡せば通常描画に戻る。
- **ShaderPass / EffectComposer**: `shaderPass` prop を渡すと内部で `EffectComposer` を生成し、`renderer.render()` の代わりに `composer.render()` を屋内ループで呼び出す。コンポーザーの対象レンダラーには `preserveDrawingBuffer: true` が必要な場合があるため `captureScreenshot()` の動作を要検証。`shaderPass` に `null` を渡せば通常描画に戻る。
- **キャンバスサイズのフォールバック**: HTML 仕様上 `<canvas>` のデフォルトサイズは `300×150px` だが、`ResizeObserver` がコンテナサイズを `0×0` と返す場合（親要素に CSS サイズ未指定）、`renderer.setSize(0, 0)` となりキャンバスが非表示になる。`width` / `height` prop のフォールバック値（デフォルト `300×533`）で回避する。利用者側で親要素に `width: 100%; height: 100%` 等を設定すればフォールバックは使用されない。
- **ライト色フォーマット**: `ambientLightColor` / `directionalLightColor` は `THREE.Color.set()` に渡すため、CSS カラー文字列（`'#ff0000'`, `'red'`）・16進数文字列（`'0xff0000'`）がすべて有効。不正な値は Three.js が無視するため、prop レベルでのバリデーションは行わない。
- **GLB バリデーション**: ローダーに渡す前にマジックバイト・バージョン・JSON チャンク型を検証する。VRM バッファ不正は `model:error`、VRMA バッファ不正は `animation:error` を emit し、パーサーには渡さない。
- **VRM 1.0 限定**: `extensions.VRMC_vrm` が存在しないモデルは `model:error` emit して処理を中断する。`extensions.VRM`（VRM 0.x）のみの場合は専用メッセージで通知する。
- **Texture Memory**: 背景画像を頻繁に変更する場合、古いテクスチャを `texture.dispose()` しないとメモリリークの原因になる。
- **Grid とモデル位置**: グリッド表示時にアバターが地面（y=0）に埋まらないよう、ロード後に足元の Y 位置を自動補正する。
- **アニメーションミキシング**: `animationData: ArrayBuffer[]` ＋ `animationWeights: number[]` で対応。ウェイトの合計が `1.0` を超える場合は不正な入力として `animation:error` を emit し、処理を中断する。

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
    throw new Error(`Invalid GLB: unsupported version ${view.getUint32(4, true)}`);
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

  const loadVRMA = async (buffers: ArrayBuffer | ArrayBuffer[], vrm: VRM, weights?: number[]) => {
    // 既存 mixer の破棄
    if (mixer.value) {
      mixer.value.stopAllAction();
      mixer.value.uncacheRoot(mixer.value.getRoot());
    }

    const arr = Array.isArray(buffers) ? buffers : [buffers];
    const anims = await Promise.all(arr.map(buf => loadVRMAnimation(buf)));

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
