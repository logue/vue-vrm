---
description: vue-vrmの概要、対応環境、ArrayBufferしか受け付けない理由を説明します。
---

# 概要

**vue-vrm**は、[three.js](https://threejs.org/)で[VRM](https://vrm.dev/)アバターを表示するVue 3コンポーネントです。[three-vrm](https://github.com/pixiv/three-vrm)を使って[VRM 1.0](https://vrm.dev/vrm1/)モデルを読み込み、[VRMA](https://vrm.dev/vrma/)アニメーションを再生します。

レンダラー、シーン、ライト、カメラ、描画ループはコンポーネントが用意します。よく使う設定はpropsで指定でき、three.jsのオブジェクトにはテンプレート参照からアクセスできます。

:::warning アセットのライセンスに注意してください
モデルとそのアセット（テクスチャなど）をすべて含めて自分が著作権を持っている場合を除き、**実体ファイルを直接呼び出す実装はしないでください**。公開URLから読み込んだり、アプリにファイルを同梱したりする実装がこれにあたります。安全にファイルを届ける方法は[実装例](../examples/)を参照してください。
:::

## 特徴

- three-vrmのMToonシェーダーによる**VRM 1.0の描画**。
- 1つまたは複数のクリップを、ウェイトと再生制御付きで扱える**VRMAの再生**。
- **カメラとライトのprops**、モデルに合わせた自動フレーミング、ロール付きのオービット操作。
- **背景、グリッド、ポストプロセス**の設定。
- 読み込み、アニメーション、カメラ、ライトの変化を知らせる**イベント**。
- 再生の制御、スクリーンショット、three.jsオブジェクトの取得ができる**インスタンスAPI**。
- コンポーネントを使わずにVRM／VRMAを検証・読み込みできる**ヘルパー関数**。
- 同じコンポーネントの**Web Component版**。

## ArrayBufferしか受け付けない理由 {#why-arraybuffer-only}

モデルとアニメーションのデータは`ArrayBuffer`で渡します。ファイルパスやURLは受け付けません。

VRMモデルの多くは、再配布を禁止するライセンスで配布されています。URLで参照すると、ファイルはソースコード、ソースマップ、ブラウザの通信ログに現れ、誰でもダウンロードできてしまいます。`ArrayBuffer`で渡す形にしておけば、どこから読み込むかをアプリ側で決められます。ユーザーの手元のファイルを読むことも、相手を確認するAPIからバイト列を取得することもできます。

:::tip
モデルファイルは[Amazon S3](https://aws.amazon.com/jp/s3/)や[Cloudflare R2](https://www.cloudflare.com/ja-jp/developer-platform/products/r2/)などのオブジェクトストレージに置くか、[VRoid Hub API](https://developer.vroid.com/api/)から取得してください。動作するサーバー側のコードは[実装例](../examples/)にあります。
:::

## 対応環境

| 環境       | バージョン                                                 |
| ---------- | ---------------------------------------------------------- |
| Vue        | `>=3.5.0`                                                  |
| three.js   | `>=0.187.0`                                                |
| three-vrm  | `@pixiv/three-vrm`と`@pixiv/three-vrm-animation`の`^3.5.5` |
| モデル     | VRM 1.0のみ（VRM 0.xは読み込めません）                     |
| レンダラー | `WebGLRenderer`（WebGL 2）                                 |
| 出力形式   | ESM（既定）とUMD                                           |

`vue`、`three`、`@pixiv/three-vrm`、`@pixiv/three-vrm-animation`はpeer dependenciesです。

## 次のステップ

- [導入](./getting-started) — パッケージをインストールし、最初のモデルを表示します。
- [Playground](../playground) — ライブデモを試します。
- [Props](../api/props) — すべての設定項目の一覧です。
