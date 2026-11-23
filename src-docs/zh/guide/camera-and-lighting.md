---
description: 配置 vue-vrm 的相机和灯光：自动取景、相机 props、支持翻滚的轨道控制，以及环境光和平行光。
---

# 相机与灯光

## 自动取景

加载模型后，相机距离会被调整到能完整显示模型的位置。用户移动相机之后，可以调用 `resetCamera()` 回到这个位置。

## 相机 props

| Prop              | 默认值                             | 作用                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| `camera-options`  | `{ fov: 30, near: 0.1, far: 100 }` | 视野角（度）和裁剪面。省略的字段使用默认值。    |
| `camera-look-at`  | `[0, 0.9, 0]`                      | 相机朝向的点（米）。启用轨道控制时会被忽略。    |
| `camera-distance` | 根据模型计算                       | 到目标点的距离。优先于自动取景。                |
| `camera-euler`    | `[0, 0, 0]`                        | 绕目标点的旋转，以弧度表示的欧拉角（X、Y、Z）。 |
| `camera-offset`   | `[0, 0, 0]`                        | 移动相机所围绕的目标点（模型中心）。            |

相机位于距目标点 `camera-distance` 的位置，并按 `camera-euler` 旋转。目标点是模型中心加上 `camera-offset`。例如，要从稍偏左的位置拍摄面部：

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :camera-offset="[0, 0.6, 0]"
    :camera-look-at="[0, 1.4, 0]"
    :camera-distance="1.2"
    :camera-euler="[0, -0.4, 0]"
  />
</template>
```

相机位置或目标点变化时会触发 `camera:change`，`camera-options` 变化时会触发 `camera:options-change`。

## 轨道控制 {#orbit-controls}

设置 `camera-interaction` 后，用户可以用鼠标或触摸移动相机。默认关闭。

```vue
<script setup lang="ts">
  import { VrmCanvas, type CameraInteractionOptions } from 'vue-vrm';

  const interaction: CameraInteractionOptions = {
    enabled: true,
    roll: true,
    minDistance: 0.5,
    maxDistance: 20
  };
</script>

<template>
  <VrmCanvas :model-data="modelData" :camera-interaction="interaction" />
</template>
```

| 选项            | 默认值     | 作用                                   |
| --------------- | ---------- | -------------------------------------- |
| `enabled`       | —          | 启用控制。必填。                       |
| `rotate`        | `true`     | 拖动以绕目标点旋转。                   |
| `pan`           | `true`     | 右键拖动或 Ctrl + 拖动以平移。         |
| `zoom`          | `true`     | 使用鼠标滚轮或双指缩放。               |
| `roll`          | `false`    | 画布获得焦点时，用 Q／E 键使相机翻滚。 |
| `rotateSpeed`   | `1`        | 旋转速度。                             |
| `panSpeed`      | `1`        | 平移速度。                             |
| `zoomSpeed`     | `1`        | 缩放速度。                             |
| `damping`       | `true`     | 松开指针后让运动平滑减速。             |
| `dampingFactor` | `0.08`     | 阻尼强度。                             |
| `minDistance`   | `0.1`      | 到目标点的最近距离。                   |
| `maxDistance`   | `Infinity` | 到目标点的最远距离。                   |
| `rollSpeed`     | `0.03`     | 每次按键翻滚的角度（弧度）。           |

:::tip
启用 `roll` 后，画布可以获得焦点。按 Q／E 之前，请先点击画布，或用 Tab 键把焦点移到画布上。
:::

## 灯光

场景中有一个环境光和一个平行光。

| Prop                | 默认值                                                    | 作用                           |
| ------------------- | --------------------------------------------------------- | ------------------------------ |
| `ambient-light`     | `{ color: '#ffffff', intensity: 0.5 }`                    | 均匀照亮所有表面的光。         |
| `directional-light` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | 像阳光一样从一个方向照射的光。 |

```vue
<template>
  <VrmCanvas
    :model-data="modelData"
    :ambient-light="{ color: '#ffe8d0', intensity: 0.6 }"
    :directional-light="{ color: '#ffffff', intensity: 1.2, position: [-1, 2, 1] }"
  />
</template>
```

更改会立即生效，并通过 `light:ambient-change` 和 `light:directional-change` 通知。
