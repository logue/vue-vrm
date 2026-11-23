---
description: vue-vrm 导出的辅助函数，用于校验和加载 VRM 与 VRMA 缓冲区，以及编写自己的包装组件。
---

# 工具函数

这些函数无需 `VrmCanvas` 组件即可使用。可以用它们在上传前检查文件，或构建你自己的 three.js 场景。

## 校验

| 函数                   | 说明                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| `validateVrm(buffer)`  | 如果缓冲区不是带有 VRM 1.0 扩展的 GLB 文件，则抛出异常。会拒绝 VRM 0.x。 |
| `validateVrma(buffer)` | 如果缓冲区不是带有 VRMA 扩展的 GLB 文件，则抛出异常。                    |

这两个函数只读取文件头和 JSON 块，因此速度足以在上传前运行：

```ts
import { validateVrm } from 'vue-vrm';

async function check(file: File): Promise<string | undefined> {
  try {
    validateVrm(await file.arrayBuffer());
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}
```

## 加载

| 函数                                                        | 返回值                  | 说明                                                           |
| ----------------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `loadVrm(buffer)`                                           | `Promise<VRM>`          | 校验并加载 VRM 1.0 模型。                                      |
| `autoPositionY(vrm)`                                        | `void`                  | 移动模型，使其最低点位于 `y = 0`。                             |
| `disposeVrm(vrm)`                                           | `void`                  | 释放模型的 GPU 资源。                                          |
| `loadVRMAnimation(buffer)`                                  | `Promise<VRMAnimation>` | 校验并加载 VRMA 动画。                                         |
| `createMixerWithClips(vrm, animations, weights?, options?)` | `AnimationMixer`        | 创建按指定权重播放动画的混合器。`options.loop` 默认为 `true`。 |
| `disposeMixer(mixer)`                                       | `void`                  | 停止混合器并释放其缓存的片段。                                 |

```ts
import { createMixerWithClips, loadVRMAnimation, loadVrm } from 'vue-vrm';
import { Scene, Timer } from 'three';

const scene = new Scene();
const vrm = await loadVrm(modelBuffer);
scene.add(vrm.scene);

const animation = await loadVRMAnimation(animationBuffer);
const mixer = createMixerWithClips(vrm, [animation]);

const timer = new Timer();
renderer.setAnimationLoop(timestamp => {
  timer.update(timestamp);
  const delta = timer.getDelta();
  mixer.update(delta);
  vrm.update(delta);
  renderer.render(scene, camera);
});
```

## 编写自己的组件

`useVrmCanvas` 是 `VrmCanvas` 背后的 composable。结合 `vrmCanvasProps` 和 `vrmCanvasEmits`，可以用你自己的标记渲染画布：

```ts
import { defineComponent, h } from 'vue';
import { useVrmCanvas, vrmCanvasEmits, vrmCanvasProps } from 'vue-vrm';

export default defineComponent({
  props: vrmCanvasProps,
  emits: vrmCanvasEmits,
  setup(props, { emit, expose }) {
    const api = useVrmCanvas(props, emit);
    expose(api.exposed);
    return () =>
      h('div', { ref: api.container, style: api.containerStyle.value, class: 'my-avatar' }, [
        h('canvas', { ref: api.canvas, onKeydown: api.handleCanvasKeydown })
      ]);
  }
});
```

## Meta

`Meta` 包含包的版本和构建日期：

```ts
import { Meta } from 'vue-vrm';

console.log(Meta.version, Meta.date);
```

## 已弃用

| 函数                             | 替代方法                 |
| -------------------------------- | ------------------------ |
| `resetVrmCanvasCamera(instance)` | `instance.resetCamera()` |
