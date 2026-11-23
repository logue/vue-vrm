---
description: 不把 VRM 文件暴露为公开 URL、将其分发给 vue-vrm 的服务端示例。
---

# 示例

:::warning
除非你拥有模型及其全部素材的著作权，否则请不要从公开 URL 或打包进应用的文件中直接加载实体文件。请改用下面的某种方式。
:::

vue-vrm 只接受 `ArrayBuffer`（请参阅[为什么只接受 ArrayBuffer](../guide/introduction#why-arraybuffer-only)）。这些示例展示了如何从服务器分发模型文件，使其不会以公开 URL 的形式出现在代码中。两个示例都运行在 [Cloudflare Workers](https://developers.cloudflare.com/workers/) 上。

| 示例                                            | 模型来源                                | 难度 |
| ----------------------------------------------- | --------------------------------------- | ---- |
| [Cloudflare R2 + Workers](./cloudflare-workers) | 放在 R2 存储桶中的你自己的文件          | 简单 |
| [VRoid Hub API](./vroid-hub-api)                | 在 VRoid Hub 上公开的模型（通过 OAuth） | 进阶 |

两种情况下，应用端的处理都相同：获取字节数据并传给 `model-data`。

```ts
const response = await fetch(endpoint);
modelData.value = await response.arrayBuffer();
```

完整实现见 [logue/v.logue.dev](https://github.com/logue/v.logue.dev)：

- [`functions/api/assets/[[path]].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/assets/%5B%5Bpath%5D%5D.ts) — 从 R2 分发 VRM 文件
- [`functions/api/vrm/[avatar_id].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/vrm/%5Bavatar_id%5D.ts) — 从 VRoid Hub 加载模型
