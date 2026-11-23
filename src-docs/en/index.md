---
description: vue-vrm is a Vue 3 component that renders VRM 1.0 avatars and plays VRMA animations with three.js, also available as a Web Component.
pageType: home

hero:
  name: vue-vrm
  text: VRM avatars for Vue
  tagline: Render VRM 1.0 models and play VRMA animations with three.js, from a single component.
  actions:
    - theme: brand
      text: Get Started
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
  - title: VRM 1.0 with MToon
    details: Loads VRM 1.0 models from an ArrayBuffer and renders them with three-vrm's MToon shader.
    icon: 🧍
    link: /guide/introduction
  - title: VRMA playback
    details: Play one or several VRMA clips with blend weights, and pause, resume, or stop them from code.
    icon: 💃
    link: /guide/animation
  - title: Camera and lighting
    details: Frame the model automatically, adjust the camera and lights through props, and enable orbit controls.
    icon: 🎥
    link: /guide/camera-and-lighting
  - title: ⚠️ Mind the asset licenses
    details: Unless you own the copyright to the model and all its assets, don't load the actual file directly. Accepts only ArrayBuffers — see Examples for safe delivery.
    icon: 🔒
    link: /examples/
  - title: Web Component
    details: The same component is also exported as a custom element for use outside Vue.
    icon: 🧩
    link: /guide/web-components
  - title: Full three.js access
    details: Reach the scene, camera, renderer, mixer, and VRM instance through a template ref.
    icon: 🛠️
    link: /api/instance
---
