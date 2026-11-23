---
description: 安装 vue-vrm，从本地文件显示 VRM 模型，并了解包导出的内容。
---

# 快速开始

## 安装

将组件与 peer dependencies 一起安装：

```sh
pnpm add vue-vrm three @pixiv/three-vrm @pixiv/three-vrm-animation
```

## 最小示例

把本地文件读取为 `ArrayBuffer`，传给 `model-data`：

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();

  async function onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) modelData.value = await file.arrayBuffer();
  }
</script>

<template>
  <input type="file" accept=".vrm" @change="onFile" />
  <VrmCanvas :model-data="modelData" show-grid />
</template>
```

模型会被放在地面（`y = 0`）上，相机会移动到能看到整个模型的位置。

:::tip
给 `model-data` 传入新的缓冲区会替换当前模型；传入 `undefined` 则卸载模型。
:::

## 从服务器加载

:::warning 注意素材的许可协议
除非你拥有模型及其全部素材（纹理等）的著作权，否则**请不要编写直接加载实体文件的代码**，例如从公开 URL 加载或把文件打包进应用。安全分发文件的方法请参阅[示例](../examples/)。
:::

获取字节数据，并把响应读取为 `ArrayBuffer`：

```ts
const response = await fetch('/api/vrm/my-avatar');
if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
modelData.value = await response.arrayBuffer();
```

不以公开 URL 暴露模型文件的服务端代码，请参阅[示例](../examples/)。

## 包导出

| 导出                                                     | 说明                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `VrmCanvas`                                              | Vue 组件。                                                                                       |
| `VrmCanvasExposed`                                       | 通过模板引用暴露的实例 API 的类型。                                                              |
| `useVrmCanvas`、`vrmCanvasProps`、`vrmCanvasEmits`       | 组件背后的 composable 以及 props／emits 定义，用于编写你自己的包装组件。                         |
| `loadVrm`、`loadVRMAnimation`、`createMixerWithClips` 等 | 辅助函数。请参阅[工具函数](../api/utilities)。                                                   |
| `Meta`                                                   | 包的版本和构建日期。                                                                             |
| `vue-vrm/wc`                                             | 用 `defineCustomElement` 包装的组件以及 `register()`。请参阅 [Web Component](./web-components)。 |
| `vue-vrm/wc-auto`                                        | 与 `vue-vrm/wc` 相同，但在导入时自动注册 `<vrm-canvas>`。                                        |
| `vue-vrm/umd`、`vue-vrm/wc/umd`、`vue-vrm/wc-auto/umd`   | 面向 CommonJS／AMD 加载器的 UMD 构建。                                                           |

## 下一步

- [用法](./usage) — 尺寸、背景、错误处理和截图。
- [动画](./animation) — 播放 VRMA 文件。
