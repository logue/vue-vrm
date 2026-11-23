---
description: vue-vrmが公開しているヘルパー関数です。VRM／VRMAの検証と読み込み、独自のラッパーコンポーネントの作成に使えます。
---

# ユーティリティ

これらの関数は`VrmCanvas`コンポーネントなしで使えます。アップロード前のファイルチェックや、独自のthree.jsシーンの構築に使ってください。

## 検証

| 関数                   | 説明                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `validateVrm(buffer)`  | バッファーがVRM 1.0拡張を持つGLBファイルでなければ例外を投げます。VRM 0.xは拒否します。 |
| `validateVrma(buffer)` | バッファーがVRMA拡張を持つGLBファイルでなければ例外を投げます。                         |

どちらの関数もファイルのヘッダーとJSONチャンクしか読まないので、アップロード前に実行しても十分に高速です。

```ts
import { validateVrm } from 'vue-vrm';

async function check(file: File): Promise<string | undefined> {
  try {
    validateVrm(await file.arrayBuffer());
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}
```

## 読み込み

| 関数                                                        | 戻り値                  | 説明                                                                                           |
| ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `loadVrm(buffer)`                                           | `Promise<VRM>`          | VRM 1.0モデルを検証して読み込みます。                                                          |
| `autoPositionY(vrm)`                                        | `void`                  | モデルの一番低い点が`y = 0`に来るように動かします。                                            |
| `disposeVrm(vrm)`                                           | `void`                  | モデルのGPUリソースを解放します。                                                              |
| `loadVRMAnimation(buffer)`                                  | `Promise<VRMAnimation>` | VRMAアニメーションを検証して読み込みます。                                                     |
| `createMixerWithClips(vrm, animations, weights?, options?)` | `AnimationMixer`        | 指定した重みでアニメーションを再生するミキサーを作ります。`options.loop`の既定値は`true`です。 |
| `disposeMixer(mixer)`                                       | `void`                  | ミキサーを停止し、キャッシュしたクリップを解放します。                                         |

```ts
import { createMixerWithClips, loadVRMAnimation, loadVrm } from 'vue-vrm';
import { Scene, Timer } from 'three';

const scene = new Scene();
const vrm = await loadVrm(modelBuffer);
scene.add(vrm.scene);

const animation = await loadVRMAnimation(animationBuffer);
const mixer = createMixerWithClips(vrm, [animation]);

const timer = new Timer();
renderer.setAnimationLoop(timestamp => {
  timer.update(timestamp);
  const delta = timer.getDelta();
  mixer.update(delta);
  vrm.update(delta);
  renderer.render(scene, camera);
});
```

## 独自のコンポーネントを作る

`useVrmCanvas`は`VrmCanvas`の中身にあたるcomposableです。`vrmCanvasProps`、`vrmCanvasEmits`と組み合わせると、独自のマークアップでキャンバスを描画できます。

```ts
import { defineComponent, h } from 'vue';
import { useVrmCanvas, vrmCanvasEmits, vrmCanvasProps } from 'vue-vrm';

export default defineComponent({
  props: vrmCanvasProps,
  emits: vrmCanvasEmits,
  setup(props, { emit, expose }) {
    const api = useVrmCanvas(props, emit);
    expose(api.exposed);
    return () =>
      h('div', { ref: api.container, style: api.containerStyle.value, class: 'my-avatar' }, [
        h('canvas', { ref: api.canvas, onKeydown: api.handleCanvasKeydown })
      ]);
  }
});
```

## Meta

`Meta`にはパッケージのバージョンとビルド日時が入っています。

```ts
import { Meta } from 'vue-vrm';

console.log(Meta.version, Meta.date);
```

## 非推奨

| 関数                             | 代わりに使うもの         |
| -------------------------------- | ------------------------ |
| `resetVrmCanvasCamera(instance)` | `instance.resetCamera()` |
