# vue-vrm

<div align="center">
  <img width="256" height="256" alt="vue-vrm" src="https://github.com/user-attachments/assets/8257613a-bd29-48b7-ad0c-3625431599bc" />
</div>

[![npm version](https://img.shields.io/npm/v/vue-vrm.svg)](https://www.npmjs.com/package/vue-vrm)
[![NPM Downloads](https://img.shields.io/npm/dm/vue-vrm.svg?style=flat)](https://www.npmjs.com/package/vue-vrm)
[![jsdelivr CDN](https://data.jsdelivr.com/v1/package/npm/vue-vrm/badge)](https://www.jsdelivr.com/package/npm/vue-vrm)
[![Open in unpkg](https://img.shields.io/badge/Open%20in-unpkg-blue)](https://uiwjs.github.io/npm-unpkg/#/pkg/vue-vrm/file/README.md)
[![Open in Gitpod](https://shields.io/badge/Open%20in-Gitpod-green?logo=Gitpod)](https://gitpod.io/#https://github.com/logue/vue-vrm)
[![X Follow](https://img.shields.io/twitter/follow/logue256?style=plastic)](https://x.com/logue256)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/logue?label=Sponsor&logo=github&color=ea4aaa)](https://github.com/sponsors/logue)

**[English](https://logue.dev/vue-vrm/) | [日本語](https://logue.dev/vue-vrm/ja/) | [简体中文](https://logue.dev/vue-vrm/zh/)**

A Vue 3 component for rendering [VRM](https://vrm.dev/en/) avatars and playing VRMA animations with [three.js](https://threejs.org/).

**📖 Documentation: <https://logue.dev/vue-vrm/>**

> [!WARNING]
> **Mind the asset licenses.** Unless you hold the copyright to the model and all of its assets (textures and so on), **do not implement code that loads the actual file directly** (for example from a public URL or a file bundled with your app).
> This library accepts only `ArrayBuffer`s so that VRM / VRMA files never appear in your source code, source maps, or network logs. See [Examples](https://logue.dev/vue-vrm/examples/) for how to deliver files safely.

## Installation

```sh
pnpm add vue-vrm three @pixiv/three-vrm @pixiv/three-vrm-animation
```

See [Getting Started](https://logue.dev/vue-vrm/guide/getting-started) for a first example.

## Documentation

- [Introduction](https://logue.dev/vue-vrm/guide/introduction) — features, requirements, and why only `ArrayBuffer` is accepted
- [Guide](https://logue.dev/vue-vrm/guide/usage) — usage, animation, camera and lighting
- [Web Component](https://logue.dev/vue-vrm/guide/web-components) — using `<vrm-canvas>` outside Vue
- [API](https://logue.dev/vue-vrm/api/) — props, events, instance API, and utilities
- [Examples](https://logue.dev/vue-vrm/examples/) — serving VRM files from Cloudflare R2 or the VRoid Hub API
- [Playground](https://logue.dev/vue-vrm/playground) — live demo

## Links

- [CHANGELOG](./CHANGELOG.md)

## License

©2026 by Logue.
Licensed under the [MIT License](LICENSE).
