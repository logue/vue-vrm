import { describe, expect, it } from 'rstack/test';

import VrmCanvasElement from '@/wc';
import AutoVrmCanvasElement from '@/wc-auto';

/**
 * Tests for the `vue-vrm/wc-auto` entry, which registers `<vrm-canvas>` on import.
 */
describe('VrmCanvas Web Component (auto registration)', () => {
  it('should register <vrm-canvas> on import', () => {
    expect(customElements.get('vrm-canvas')).toBe(VrmCanvasElement);
    expect(document.createElement('vrm-canvas')).toBeInstanceOf(VrmCanvasElement);
  });

  it('should re-export the same element constructor as the wc entry', () => {
    expect(AutoVrmCanvasElement).toBe(VrmCanvasElement);
  });
});
