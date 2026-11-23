---
description: vue-vrm 是一个使用 three.js 显示 VRM 1.0 头像并播放 VRMA 动画的 Vue 3 组件，也可以作为 Web Component 使用。
pageType: home

hero:
  name: vue-vrm
  text: 在 Vue 中显示 VRM 头像
  tagline: 用一个组件完成 VRM 1.0 模型的显示和 VRMA 动画的播放。
  actions:
    - theme: brand
      text: 快速开始
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
  - title: 支持 MToon 的 VRM 1.0
    details: 从 ArrayBuffer 读取 VRM 1.0 模型，并使用 three-vrm 的 MToon 着色器渲染。
    icon: 🧍
    link: /guide/introduction
  - title: 播放 VRMA
    details: 按权重播放一个或多个 VRMA 片段，并可通过代码暂停、继续或停止。
    icon: 💃
    link: /guide/animation
  - title: 相机与灯光
    details: 自动调整相机以显示整个模型。相机和灯光可通过 props 调整，也支持轨道控制。
    icon: 🎥
    link: /guide/camera-and-lighting
  - title: ⚠️ 注意素材的许可协议
    details: 除非你拥有模型及其全部素材的著作权，否则请不要直接加载实体文件。安全的分发方式请参阅示例。
    icon: 🔒
    link: /examples/
  - title: Web Component
    details: 同一组件也以自定义元素的形式导出，可在 Vue 之外使用。
    icon: 🧩
    link: /guide/web-components
  - title: 直接访问 three.js
    details: 通过模板引用获取场景、相机、渲染器、混合器和 VRM 实例。
    icon: 🛠️
    link: /api/instance
---
