import { h, type VNode } from 'vue';

import type { useVrmCanvas } from '@/composables/useVrmCanvas';

/**
 * Render the `VrmCanvas` markup. Shared by the Vue component and the Web Component.
 *
 * ```html
 * <figure ref="container" :style="containerStyle">
 *   <canvas ref="canvas" @keydown="handleCanvasKeydown" @pointerdown="canvas.focus()" />
 * </figure>
 * ```
 *
 * @param api - The object returned by `useVrmCanvas`.
 */
export function renderVrmCanvas(api: ReturnType<typeof useVrmCanvas>): VNode {
  return h(
    'figure',
    {
      ref: api.container,
      style: [{ position: 'relative', margin: '0', overflow: 'hidden' }, api.containerStyle.value]
    },
    [
      h('canvas', {
        ref: api.canvas,
        style: { display: 'block', width: '100%', height: '100%' },
        onKeydown: api.handleCanvasKeydown,
        onPointerdown: () => api.canvas.value?.focus()
      })
    ]
  );
}
