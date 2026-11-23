import '@/helpers/vue-flags';
import VrmCanvasElement, { Meta, register } from '@/wc';

export type { VrmCanvasExposed } from '@/types/VrmCanvasExposed';

/** Tag name registered automatically on import. */
const DEFAULT_TAG_NAME = 'vrm-canvas';

// Auto-register `<vrm-canvas>` on import (skipped where `customElements` is unavailable, e.g. SSR).
if (typeof customElements !== 'undefined') {
  register(DEFAULT_TAG_NAME);
}

declare global {
  interface HTMLElementTagNameMap {
    'vrm-canvas': InstanceType<typeof VrmCanvasElement>;
  }
}

export { VrmCanvasElement as default, Meta };
