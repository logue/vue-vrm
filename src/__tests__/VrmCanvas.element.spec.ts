import { beforeAll, beforeEach, describe, expect, it, rs } from 'rstack/test';

import type { VrmCanvasExposed } from '@/index';

import VrmCanvasElement, { register } from '@/wc';

/**
 * Tests for the Web Component build produced by `defineCustomElement`.
 *
 * `<vrm-canvas>` is exercised as a plain custom element: props are set as DOM
 * properties, events arrive as native `CustomEvent`s, and the API returned by
 * `useVrmCanvas` is read back from the element instance.
 *
 * happy-dom has no WebGL, so the renderer cannot start. That path is asserted
 * explicitly (an `error` event, renderer getters returning `undefined`).
 */

/** Tag name used only by this spec, to avoid clashing with `wc-auto`. */
const TAG = 'vrm-canvas-test-element';

/** Writable props plus the exposed API, as seen on the element instance. */
type VrmCanvasNode = HTMLElement &
  VrmCanvasExposed & {
    width: number | string;
    maxWidth?: number;
    aspectRatio: number;
    showGrid: boolean;
  };

const createElement = (): VrmCanvasNode => document.createElement(TAG) as VrmCanvasNode;

/** Wait for Vue to mount the element's shadow tree. */
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('VrmCanvas Web Component', () => {
  beforeAll(() => {
    register(TAG);
  });

  beforeEach(() => {
    // three.js logs "Error creating WebGL context" on every mount (no WebGL in happy-dom).
    // Restored automatically via `restoreMocks`.
    rs.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('Registration', () => {
    it('should register the element under the given tag name', () => {
      expect(customElements.get(TAG)).toBe(VrmCanvasElement);
      expect(createElement()).toBeInstanceOf(VrmCanvasElement);
    });

    it('should not register <vrm-canvas> automatically', () => {
      expect(customElements.get('vrm-canvas')).toBeUndefined();
    });

    it('should ignore repeated registration of the same tag name', () => {
      expect(() => {
        register(TAG);
      }).not.toThrow();
    });
  });

  describe('Rendering', () => {
    it('should render a <figure> with a <canvas> inside an open shadow root', async () => {
      const element = createElement();
      document.body.append(element);
      await flush();

      const figure = element.shadowRoot?.querySelector('figure');
      expect(figure).toBeTruthy();
      expect(figure?.querySelector('canvas')).toBeTruthy();
    });

    it('should size the container from the width and aspectRatio props', async () => {
      const element = createElement();
      element.width = 300;
      element.aspectRatio = 3 / 4;
      document.body.append(element);
      await flush();

      const figure = element.shadowRoot?.querySelector('figure');
      expect(figure?.style.width).toBe('300px');
      expect(figure?.style.height).toBe('400px');
    });
  });

  describe('Props', () => {
    it('should expose prop defaults as element properties once connected', async () => {
      const element = createElement();
      document.body.append(element);
      await flush();

      expect(element.width).toBe(480);
      expect(element.aspectRatio).toBe(3 / 4);
      expect(element.showGrid).toBe(false);
    });

    it('should apply a numeric width attribute to the container in pixels', async () => {
      const element = createElement();
      element.setAttribute('width', '300');
      document.body.append(element);
      await flush();

      // `width` accepts CSS lengths too, so the attribute is kept as a string.
      expect(element.width).toBe('300');
      expect(element.shadowRoot?.querySelector('figure')?.style.width).toBe('300px');
    });

    it('should apply a CSS width attribute and keep the ratio with aspect-ratio', async () => {
      const element = createElement();
      element.setAttribute('width', '100%');
      document.body.append(element);
      await flush();

      const style = element.shadowRoot?.querySelector('figure')?.style;
      expect(style?.width).toBe('100%');
      expect(style?.aspectRatio).toMatch(/^0\.75/);
    });
  });

  describe('Exposed API', () => {
    it('should forward the exposed methods onto the element', async () => {
      const element = createElement();
      document.body.append(element);
      await flush();

      for (const name of [
        'playAnimation',
        'pauseAnimation',
        'resumeAnimation',
        'stopAnimation',
        'resetCamera',
        'captureScreenshot',
        'getScene',
        'getCamera',
        'getRenderer',
        'getMixer',
        'getVrm',
        'getCanvas'
      ] as const) {
        expect(typeof element[name]).toBe('function');
      }
    });

    it('should return the internal canvas from getCanvas()', async () => {
      const element = createElement();
      document.body.append(element);
      await flush();

      expect(element.getCanvas()).toBe(element.shadowRoot?.querySelector('canvas'));
    });

    it('should return undefined from getVrm() when no model is loaded', async () => {
      const element = createElement();
      document.body.append(element);
      await flush();

      expect(element.getVrm()).toBeUndefined();
    });
  });

  describe('Without WebGL', () => {
    it('should dispatch a native "error" CustomEvent when the renderer cannot start', async () => {
      const element = createElement();
      const errored: Promise<CustomEvent<[Error]>> = new Promise(resolve => {
        element.addEventListener(
          'error',
          event => {
            resolve(event as unknown as CustomEvent<[Error]>);
          },
          { once: true }
        );
      });
      document.body.append(element);

      const event = await errored;
      expect(event.detail[0]).toBeInstanceOf(Error);
    });

    it('should leave the renderer getters undefined', async () => {
      const element = createElement();
      element.addEventListener('error', () => {
        /* expected without WebGL */
      });
      document.body.append(element);
      await flush();

      expect(element.getRenderer()).toBeUndefined();
      expect(element.getScene()).toBeUndefined();
      expect(() => element.captureScreenshot()).toThrow(/not initialized/);
    });
  });

  describe('Lifecycle', () => {
    it('should unmount cleanly when removed from the DOM', async () => {
      const element = createElement();
      element.addEventListener('error', () => {
        /* expected without WebGL */
      });
      document.body.append(element);
      await flush();

      expect(() => {
        element.remove();
      }).not.toThrow();
      await flush();
      expect(element.shadowRoot?.querySelector('figure')).toBeFalsy();
    });
  });
});
