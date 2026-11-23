---
description: vue-vrmをネイティブのカスタム要素として、Vueのテンプレート以外で使う方法を説明します。
---

# Web Component

同じコンポーネントを、Vueの[`defineCustomElement`](https://ja.vuejs.org/api/custom-elements.html#definecustomelement)で包んだネイティブのカスタム要素としても提供しています。Vueのカスタム要素の挙動については、Vueドキュメントの[VueとWeb Components](https://ja.vuejs.org/guide/extras/web-components.html)を参照してください。

エントリポイントは2つあります。

| エントリポイント  | 登録されるタグ               | `HTMLElementTagNameMap`への型定義 |
| ----------------- | ---------------------------- | --------------------------------- |
| `vue-vrm/wc-auto` | `<vrm-canvas>`（自動）       | あり                              |
| `vue-vrm/wc`      | `register()`に渡したタグのみ | なし                              |

## 自動登録

`vue-vrm/wc-auto`をimportすると`<vrm-canvas>`が登録されます。

```ts
import 'vue-vrm/wc-auto';
```

```html
<vrm-canvas show-grid></vrm-canvas>
```

## 独自のタグ名で登録する

`vue-vrm/wc`をimportし、使いたいタグ名を`register()`に渡します。

```ts
import { register } from 'vue-vrm/wc';

register('my-avatar');
```

デフォルトエクスポートを使って自分で定義することもできます。

```ts
import VrmCanvasElement from 'vue-vrm/wc';

customElements.define('my-avatar', VrmCanvasElement);
```

:::warning 1ページにつきタグ名は1つ
1つのコンストラクターは、カスタム要素のレジストリに1回しか定義できません。登録するタグ名は1つにし、同じページで`vue-vrm/wc`と`vue-vrm/wc-auto`を併用しないでください。2つ目のタグ名を定義すると`NotSupportedError`が発生します。
:::

:::warning 型定義
`vue-vrm/wc`は`HTMLElementTagNameMap`に何も追加しないので、タグの型は自分で宣言してください。

```ts
import type VrmCanvasElement from 'vue-vrm/wc';

declare global {
  interface HTMLElementTagNameMap {
    'my-avatar': InstanceType<typeof VrmCanvasElement>;
  }
}
```

:::

## 注意事項

- Vueのテンプレート内でこの要素を使う場合は、`compilerOptions.isCustomElement`でカスタム要素として扱うよう指定してください（例：`tag => tag === 'vrm-canvas'`）。
- キャンバスはオープンなシャドウルートの中に描画されます。
- 以下の例では`<vrm-canvas>`を使っています。`vue-vrm/wc`を使う場合は、独自のタグ名に置き換えてください。

## propsの指定

- **プリミティブなprops**（`string`、`boolean`、`number`）は、属性でもDOMプロパティでも指定できます。属性名はケバブケース（`show-grid`、`aspect-ratio`）です。
- **`ArrayBuffer`、オブジェクト、配列のprops**（`modelData`、`animationData`、`cameraInteraction`、`directionalLight`など）は、DOMプロパティでしか指定できません。

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
propsの既定値は、要素がドキュメントに追加されたときに適用されます。それまでは`element.width`などのプロパティを読むと`undefined`が返ります。
:::

## イベント

Vueのemitは、同じ名前（`model:loaded`、`animation:end`など）のネイティブな`CustomEvent`として発火します。emitの引数は、配列として`event.detail`に入ります。

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

## インスタンスAPI

[インスタンスAPI](../api/instance)は要素から直接呼べます。

```ts
import type { VrmCanvasExposed } from 'vue-vrm/wc';

const avatar = element as unknown as VrmCanvasExposed;
avatar.resetCamera();
const image = avatar.captureScreenshot();
```
