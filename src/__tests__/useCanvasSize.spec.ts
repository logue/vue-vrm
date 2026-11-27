import { afterEach, beforeEach, describe, expect, it, rs } from 'rstack/test';

import { nextTick, ref } from 'vue';

import { useCanvasSize } from '@/composables/useCanvasSize';

/**
 * Tests for container sizing: fixed pixel widths and fluid CSS widths (`'100%'`).
 *
 * happy-dom does no layout, so `clientWidth` is stubbed and `ResizeObserver` is
 * replaced with a fake whose callback the test triggers by hand.
 */

let observerCallback: (() => void) | undefined;

class FakeResizeObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }

  observe(): void {
    // The test triggers the callback directly.
  }

  disconnect(): void {
    observerCallback = undefined;
  }
}

/** Create a container element whose `clientWidth` can be changed by the test. */
function createContainer(initialWidth: number) {
  const element = document.createElement('div');
  let width = initialWidth;
  Object.defineProperty(element, 'clientWidth', { get: () => width });
  return {
    container: ref<HTMLElement | undefined>(element),
    resize: (next: number) => {
      width = next;
      observerCallback?.();
    }
  };
}

describe('useCanvasSize', () => {
  beforeEach(() => {
    rs.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    rs.unstubAllGlobals();
    observerCallback = undefined;
  });

  describe('fixed width (number)', () => {
    it('should size the container in pixels from width and aspectRatio', () => {
      const { container } = createContainer(300);
      const { containerStyle, size, init } = useCanvasSize(container, {
        width: () => 300,
        maxWidth: () => undefined,
        aspectRatio: () => 3 / 4
      });
      init();

      expect(containerStyle.value).toEqual({ width: '300px', height: '400px' });
      expect(size.value).toEqual({ width: 300, height: 400 });
    });

    it('should treat numeric strings as pixels', () => {
      const { container } = createContainer(0);
      const { containerStyle } = useCanvasSize(container, {
        width: () => '320',
        maxWidth: () => undefined,
        aspectRatio: () => 2
      });

      expect(containerStyle.value).toEqual({ width: '320px', height: '160px' });
    });

    it('should accept a px suffix', () => {
      const { container } = createContainer(0);
      const { containerStyle } = useCanvasSize(container, {
        width: () => '320px',
        maxWidth: () => undefined,
        aspectRatio: () => 2
      });

      expect(containerStyle.value.width).toBe('320px');
    });
  });

  describe('fluid width (CSS length)', () => {
    it('should apply the CSS width and keep the ratio with aspect-ratio', () => {
      const { container } = createContainer(0);
      const { containerStyle } = useCanvasSize(container, {
        width: () => '100%',
        maxWidth: () => 640,
        aspectRatio: () => 3 / 4
      });

      expect(containerStyle.value).toEqual({
        width: '100%',
        aspectRatio: String(3 / 4),
        maxWidth: '640px'
      });
    });

    it('should size the renderer from the measured width and follow resizes', async () => {
      const { container, resize } = createContainer(600);
      const { size, init } = useCanvasSize(container, {
        width: () => '100%',
        maxWidth: () => undefined,
        aspectRatio: () => 2
      });
      init();
      expect(size.value).toEqual({ width: 600, height: 300 });

      resize(250);
      await nextTick();
      expect(size.value).toEqual({ width: 250, height: 125 });
    });

    it('should cap the measured width with maxWidth', () => {
      const { container } = createContainer(1000);
      const { size, init } = useCanvasSize(container, {
        width: () => '100%',
        maxWidth: () => 640,
        aspectRatio: () => 2
      });
      init();

      expect(size.value).toEqual({ width: 640, height: 320 });
    });

    it('should fall back to 480px before the container is measured', () => {
      const { container } = createContainer(0);
      const { size } = useCanvasSize(container, {
        width: () => '100%',
        maxWidth: () => undefined,
        aspectRatio: () => 2
      });

      expect(size.value).toEqual({ width: 480, height: 240 });
    });
  });

  it('should stop observing after dispose', () => {
    const { container } = createContainer(300);
    const { init, dispose } = useCanvasSize(container, {
      width: () => '100%',
      maxWidth: () => undefined,
      aspectRatio: () => 1
    });
    init();
    dispose();

    expect(observerCallback).toBeUndefined();
  });
});
