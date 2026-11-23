---
description: Use vue-vrm as a native custom element outside of Vue templates.
---

# Web Component

The same component is also available as a native custom element, wrapped with Vue's [`defineCustomElement`](https://vuejs.org/api/custom-elements.html#definecustomelement). See [Vue and Web Components](https://vuejs.org/guide/extras/web-components.html) in the Vue documentation for how Vue custom elements behave.

There are two entry points:

| Entry point       | Registers a tag                       | Element type for `HTMLElementTagNameMap` |
| ----------------- | ------------------------------------- | ---------------------------------------- |
| `vue-vrm/wc-auto` | `<vrm-canvas>`, automatically         | Included                                 |
| `vue-vrm/wc`      | Only the tag you pass to `register()` | Not included                             |

## Automatic registration

Importing `vue-vrm/wc-auto` registers `<vrm-canvas>`:

```ts
import 'vue-vrm/wc-auto';
```

```html
<vrm-canvas show-grid></vrm-canvas>
```

## Registering your own tag name

Import `vue-vrm/wc` and call `register()` with the tag name you want:

```ts
import { register } from 'vue-vrm/wc';

register('my-avatar');
```

You can also define it yourself with the default export:

```ts
import VrmCanvasElement from 'vue-vrm/wc';

customElements.define('my-avatar', VrmCanvasElement);
```

:::warning One tag name per page
A constructor can only be defined once per custom element registry. Register a single tag name, and do not combine `vue-vrm/wc` with `vue-vrm/wc-auto` on the same page; defining a second tag name throws `NotSupportedError`.
:::

:::warning Type definitions
`vue-vrm/wc` does not add anything to `HTMLElementTagNameMap`, so declare the type of your tag yourself:

```ts
import type VrmCanvasElement from 'vue-vrm/wc';

declare global {
  interface HTMLElementTagNameMap {
    'my-avatar': InstanceType<typeof VrmCanvasElement>;
  }
}
```

:::

## Notes

- When using the element inside Vue templates, mark it as a custom element with `compilerOptions.isCustomElement` (e.g. `tag => tag === 'vrm-canvas'`).
- The canvas is rendered inside an open shadow root.
- The examples below use `<vrm-canvas>`; replace it with your own tag name when using `vue-vrm/wc`.

## Setting props

- **Primitive props** (`string`, `boolean`, `number`) can be set as attributes or as DOM properties. Attribute names are kebab-case (`show-grid`, `aspect-ratio`).
- **`ArrayBuffer`, object, and array props** (`modelData`, `animationData`, `cameraInteraction`, `directionalLight`, …) can only be set as DOM properties.

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
Prop defaults are applied when the element is connected to the document. Before that, reading a property such as `element.width` returns `undefined`.
:::

## Events

Vue emits are dispatched as native `CustomEvent`s with the same names (`model:loaded`, `animation:end`, …). The emitted arguments are available as an array in `event.detail`.

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

## Instance API

The [instance API](../api/instance) is exposed directly on the element:

```ts
import type { VrmCanvasExposed } from 'vue-vrm/wc';

const avatar = element as unknown as VrmCanvasExposed;
avatar.resetCamera();
const image = avatar.captureScreenshot();
```
