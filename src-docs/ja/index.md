---
description: vue-vrmは、three.jsでVRM 1.0アバターを表示し、VRMAアニメーションを再生するVue 3コンポーネントです。Web Componentとしても使えます。
pageType: home

hero:
  name: vue-vrm
  text: VueでVRMアバターを
  tagline: VRM 1.0モデルの表示とVRMAアニメーションの再生を、1つのコンポーネントで。
  actions:
    - theme: brand
      text: はじめる
      link: /guide/getting-started
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: GitHub
      link: https://github.com/logue/vue-vrm
  image:
    src: https://github.com/user-attachments/assets/8257613a-bd29-48b7-ad0c-3625431599bc
    alt: vue-vrm logo
features:
  - title: MToon対応のVRM 1.0
    details: ArrayBufferからVRM 1.0モデルを読み込み、three-vrmのMToonシェーダーで描画します。
    icon: 🧍
    link: /guide/introduction
  - title: VRMAの再生
    details: 1つまたは複数のVRMAクリップをウェイト付きで再生し、コードから一時停止・再開・停止できます。
    icon: 💃
    link: /guide/animation
  - title: カメラとライト
    details: モデル全体が収まるようにカメラを自動で合わせます。カメラやライトはpropsで調整でき、オービット操作も使えます。
    icon: 🎥
    link: /guide/camera-and-lighting
  - title: ⚠️ アセットのライセンスに注意
    details: アセットを含めて自分に著作権がある場合を除き、実体ファイルを直接呼び出す実装はしないでください。安全な配信方法は実装例を参照してください。
    icon: 🔒
    link: /examples/
  - title: Web Component
    details: 同じコンポーネントをカスタム要素としても提供しているので、Vueの外でも使えます。
    icon: 🧩
    link: /guide/web-components
  - title: three.jsに直接アクセス
    details: テンプレート参照から、シーン・カメラ・レンダラー・ミキサー・VRMインスタンスを取得できます。
    icon: 🛠️
    link: /api/instance
---
