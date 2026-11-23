---
description: Server-side examples for delivering VRM files to vue-vrm without exposing them as public URLs.
---

# Examples

:::warning
Unless you hold the copyright to the model and all of its assets, do not load the actual file directly from a public URL or from files bundled with your app. Use one of the approaches below instead.
:::

vue-vrm only accepts `ArrayBuffer`s (see [Why ArrayBuffer only](../guide/introduction#why-arraybuffer-only)). These examples show how to deliver model files from a server so that they never appear as public URLs in your code. Both run on [Cloudflare Workers](https://developers.cloudflare.com/workers/).

| Example                                         | Source of the model                          | Difficulty |
| ----------------------------------------------- | -------------------------------------------- | ---------- |
| [Cloudflare R2 + Workers](./cloudflare-workers) | Your own files in an R2 bucket               | Easy       |
| [VRoid Hub API](./vroid-hub-api)                | Models published on VRoid Hub, through OAuth | Advanced   |

In both cases, the app side is the same: fetch the bytes and pass them to `model-data`.

```ts
const response = await fetch(endpoint);
modelData.value = await response.arrayBuffer();
```

The complete implementation is available in [logue/v.logue.dev](https://github.com/logue/v.logue.dev):

- [`functions/api/assets/[[path]].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/assets/%5B%5Bpath%5D%5D.ts) — serving VRM files from R2
- [`functions/api/vrm/[avatar_id].ts`](https://github.com/logue/v.logue.dev/blob/master/functions/api/vrm/%5Bavatar_id%5D.ts) — loading models from VRoid Hub
