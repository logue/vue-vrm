import '@/helpers/vue-flags';
import { defineCustomElement } from 'vue';

import { useVrmCanvas, vrmCanvasEmits, vrmCanvasProps } from '@/composables/useVrmCanvas';
import { renderVrmCanvas } from '@/helpers/renderVrmCanvas';

export { Meta } from '@/types/Meta';
export type { VrmCanvasExposed } from '@/types/VrmCanvasExposed';
export type {
  VrmAutoBlinkOptions,
  VrmExpressionNames,
  VrmExpressions
} from '@/types/VrmExpressionTypes';
export type {
  VrmRenderContext,
  VrmRenderFunction,
  VrmRenderTargets,
  VrmResizePayload
} from '@/types/VrmRenderTypes';

// Wrap the same composable for use as a Web Component.
// Events are dispatched as `CustomEvent`s whose `detail` is the argument array.
// @see {@link https://vuejs.org/guide/extras/web-components.html#definecustomelement}
const VrmCanvasElement = defineCustomElement({
  name: 'VrmCanvas',
  props: vrmCanvasProps,
  emits: vrmCanvasEmits,
  setup(props, { emit, expose }) {
    const api = useVrmCanvas(props, emit);
    expose(api.exposed);
    return () => renderVrmCanvas(api);
  }
});

/**
 * Register the element as a custom element under the given tag name.
 *
 * Does nothing if the tag name is already defined. A constructor can only be defined once per
 * custom element registry, so register a single tag name per page and do not combine this with
 * `vue-vrm/wc-auto` (which registers `<vrm-canvas>`).
 *
 * @param tagName - Custom element tag name (must contain a hyphen)
 */
export function register(tagName: string): void {
  if (customElements.get(tagName)) return;
  customElements.define(tagName, VrmCanvasElement);
}

export { VrmCanvasElement as default };
