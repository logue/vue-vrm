---
description: 在 Vue 模板之外，把 vue-vrm 作为原生自定义元素使用。
---

# Web Component

同一组件也以原生自定义元素的形式提供，它通过 Vue 的 [`defineCustomElement`](https://cn.vuejs.org/api/custom-elements.html#definecustomelement) 包装。Vue 自定义元素的行为请参阅 Vue 文档中的 [Vue 与 Web Components](https://cn.vuejs.org/guide/extras/web-components.html)。

共有两个入口：

| 入口              | 注册的标签                     | `HTMLElementTagNameMap` 的类型定义 |
| ----------------- | ------------------------------ | ---------------------------------- |
| `vue-vrm/wc-auto` | `<vrm-canvas>`（自动）         | 包含                               |
| `vue-vrm/wc`      | 仅注册传给 `register()` 的标签 | 不包含                             |

## 自动注册

导入 `vue-vrm/wc-auto` 会注册 `<vrm-canvas>`：

```ts
import 'vue-vrm/wc-auto';
```

```html
<vrm-canvas show-grid></vrm-canvas>
```

## 使用自定义标签名注册

导入 `vue-vrm/wc`，并把想要的标签名传给 `register()`：

```ts
import { register } from 'vue-vrm/wc';

register('my-avatar');
```

也可以使用默认导出自行定义：

```ts
import VrmCanvasElement from 'vue-vrm/wc';

customElements.define('my-avatar', VrmCanvasElement);
```

:::warning 每个页面只注册一个标签名
同一个构造函数在一个自定义元素注册表中只能定义一次。请只注册一个标签名，并且不要在同一页面中同时使用 `vue-vrm/wc` 和 `vue-vrm/wc-auto`；定义第二个标签名会抛出 `NotSupportedError`。
:::

:::warning 类型定义
`vue-vrm/wc` 不会向 `HTMLElementTagNameMap` 添加任何内容，请自行声明标签的类型：

```ts
import type VrmCanvasElement from 'vue-vrm/wc';

declare global {
  interface HTMLElementTagNameMap {
    'my-avatar': InstanceType<typeof VrmCanvasElement>;
  }
}
```

:::

## 注意事项

- 在 Vue 模板中使用该元素时，请通过 `compilerOptions.isCustomElement` 将其标记为自定义元素（例如 `tag => tag === 'vrm-canvas'`）。
- 画布渲染在一个开放的 shadow root 中。
- 以下示例使用 `<vrm-canvas>`；使用 `vue-vrm/wc` 时请替换为你自己的标签名。

## 设置 props

- **基本类型的 props**（`string`、`boolean`、`number`）可以通过属性或 DOM 属性设置。属性名使用 kebab-case（`show-grid`、`aspect-ratio`）。
- **`ArrayBuffer`、对象和数组类型的 props**（`modelData`、`animationData`、`cameraInteraction`、`directionalLight` 等）只能通过 DOM 属性设置。

```ts
const element = document.createElement('vrm-canvas');
element.setAttribute('width', '640');
element.setAttribute('show-grid', '');
element.cameraInteraction = { enabled: true };
document.body.append(element);

const response = await fetch('/api/vrm/my-avatar');
element.modelData = await response.arrayBuffer();
```

:::info
props 的默认值在元素连接到文档时才会应用。在此之前读取 `element.width` 等属性会返回 `undefined`。
:::

## 事件

Vue 的 emit 会以同名（`model:loaded`、`animation:end` 等）的原生 `CustomEvent` 派发。emit 的参数以数组形式放在 `event.detail` 中。

```ts
element.addEventListener('model:loaded', event => {
  const [vrm] = (event as CustomEvent).detail;
  console.log(vrm.meta);
});

element.addEventListener('error', event => {
  const [error] = (event as CustomEvent<[Error]>).detail;
  console.error(error);
});
```

## 实例 API

[实例 API](../api/instance) 直接暴露在元素上：

```ts
import type { VrmCanvasExposed } from 'vue-vrm/wc';

const avatar = element as unknown as VrmCanvasExposed;
avatar.resetCamera();
const image = avatar.captureScreenshot();
```
