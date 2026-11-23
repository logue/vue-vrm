---
description: 介绍 vue-vrm 是什么、支持哪些环境，以及为什么只接受 ArrayBuffer。
---

# 简介

**vue-vrm** 是一个使用 [three.js](https://threejs.org/) 显示 [VRM](https://vrm.dev/en/) 头像的 Vue 3 组件。它通过 [three-vrm](https://github.com/pixiv/three-vrm) 加载 [VRM 1.0](https://vrm.dev/en/vrm1/) 模型并播放 [VRMA](https://vrm.dev/en/vrma/) 动画。

渲染器、场景、灯光、相机和渲染循环都由组件准备好。常用设置可以通过 props 指定，底层的 three.js 对象可以通过模板引用访问。

:::warning 注意素材的许可协议
除非你拥有模型及其全部素材（纹理等）的著作权，否则**请不要编写直接加载实体文件的代码**，例如从公开 URL 加载或把文件打包进应用。安全分发文件的方法请参阅[示例](../examples/)。
:::

## 功能

- 使用 three-vrm 的 MToon 着色器进行 **VRM 1.0 渲染**。
- 支持一个或多个片段、带权重和播放控制的 **VRMA 播放**。
- **相机和灯光 props**、根据模型自动取景，以及支持翻滚的轨道控制。
- **背景、网格和后期处理**设置。
- 通知加载、动画、相机和灯光变化的**事件**。
- 可控制播放、截图并获取 three.js 对象的**实例 API**。
- 无需组件即可校验和加载 VRM／VRMA 的**辅助函数**。
- 同一组件的 **Web Component 版本**。

## 为什么只接受 ArrayBuffer {#why-arraybuffer-only}

模型和动画数据只能以 `ArrayBuffer` 传入，不接受文件路径或 URL。

许多 VRM 模型的许可协议禁止二次分发。如果通过 URL 引用模型，文件会出现在源代码、source map 和浏览器的网络日志中，任何人都可以下载。改为传入 `ArrayBuffer` 后，从哪里加载由应用自己决定：既可以读取用户本地的文件，也可以从会校验请求方身份的 API 获取字节数据。

:::tip
请把模型文件放在 [Amazon S3](https://aws.amazon.com/s3/) 或 [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) 等对象存储中，或通过 [VRoid Hub API](https://developer.vroid.com/en/api/) 获取。可运行的服务端代码请参阅[示例](../examples/)。
:::

## 支持的环境

| 环境      | 版本                                                        |
| --------- | ----------------------------------------------------------- |
| Vue       | `>=3.5.0`                                                   |
| three.js  | `>=0.187.0`                                                 |
| three-vrm | `@pixiv/three-vrm` 和 `@pixiv/three-vrm-animation` `^3.5.5` |
| 模型      | 仅支持 VRM 1.0（不支持 VRM 0.x）                            |
| 渲染器    | `WebGLRenderer`（WebGL 2）                                  |
| 输出格式  | ESM（默认）和 UMD                                           |

`vue`、`three`、`@pixiv/three-vrm` 和 `@pixiv/three-vrm-animation` 是 peer dependencies。

## 下一步

- [快速开始](./getting-started) — 安装包并显示第一个模型。
- [Playground](../playground) — 体验在线演示。
- [Props](../api/props) — 全部设置项一览。
