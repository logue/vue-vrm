---
description: What vue-vrm is, which environments it supports, and why it only accepts ArrayBuffers.
---

# Introduction

**vue-vrm** is a Vue 3 component for rendering [VRM](https://vrm.dev/en/) avatars with [three.js](https://threejs.org/). It loads [VRM 1.0](https://vrm.dev/en/vrm1/) models and plays [VRMA](https://vrm.dev/en/vrma/) animations through [three-vrm](https://github.com/pixiv/three-vrm).

The component sets up the renderer, scene, lights, camera, and render loop for you. Common settings are props, and the underlying three.js objects stay available through a template ref.

:::warning Mind the asset licenses
Unless you hold the copyright to the model and all of its assets (textures and so on), **do not implement code that loads the actual file directly** — for example from a public URL or from a file bundled with your app. See [Examples](../examples/) for how to deliver files safely.
:::

## Features

- **VRM 1.0 rendering** with three-vrm's MToon shader.
- **VRMA playback** of one or more clips, with blend weights and playback control.
- **Camera and lighting props**, automatic framing, and optional orbit controls with roll.
- **Background, grid, and postprocessing** options.
- **Events** for loading, animation, camera, and light changes.
- **Instance API** to control playback, take screenshots, and access three.js objects.
- **Helper functions** to validate and load VRM / VRMA buffers without the component.
- **Web Component build** of the same component.

## Why ArrayBuffer only {#why-arraybuffer-only}

The component accepts model and animation data only as `ArrayBuffer`, not as file paths or URLs.

Many VRM models are distributed under licenses that forbid redistribution. If a model is referenced by URL, the file appears in your source code, source maps, and the browser's network log, where anyone can download it. Passing an `ArrayBuffer` keeps that decision in your application: you can read a user's local file, or fetch the bytes from an API that checks who is asking.

:::tip
Store model files in object storage such as [Amazon S3](https://aws.amazon.com/s3/) or [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/), or fetch them through the [VRoid Hub API](https://developer.vroid.com/en/api/). See [Examples](../examples/) for working server code.
:::

## Supported environments

| Environment | Version                                                      |
| ----------- | ------------------------------------------------------------ |
| Vue         | `>=3.5.0`                                                    |
| three.js    | `>=0.187.0`                                                  |
| three-vrm   | `@pixiv/three-vrm` and `@pixiv/three-vrm-animation` `^3.5.5` |
| Models      | VRM 1.0 only (VRM 0.x is rejected)                           |
| Renderer    | `WebGLRenderer` (WebGL 2)                                    |
| Output      | ESM (default) and UMD builds                                 |

`vue`, `three`, `@pixiv/three-vrm`, and `@pixiv/three-vrm-animation` are peer dependencies.

## Next steps

- [Getting Started](./getting-started) — install the package and render your first model.
- [Playground](../playground) — try the live demo.
- [Props](../api/props) — the full list of options.
