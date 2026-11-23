import { type ComputedRef, computed, type Ref, ref } from 'vue';

import type { CanvasSize, CanvasSizeOptions } from '@/types/CanvasSizeTypes';

const DEFAULT_ASPECT_RATIO = 9 / 16;

/**
 * Manage DOM sizing for VrmCanvas: derives the renderer's pixel size from the
 * container's measured width (via ResizeObserver) and exposes the CSS style
 * used to size the container element.
 *
 * @param container The container element to observe and size.
 * @param options Reactive getters for width / maxWidth / aspectRatio props.
 * @returns Reactive `size`, `containerStyle`, and `init` / `dispose` lifecycle functions.
 */
export function useCanvasSize(
  container: Readonly<Ref<HTMLElement | undefined>>,
  options: CanvasSizeOptions
): {
  size: ComputedRef<CanvasSize>;
  containerStyle: ComputedRef<Record<string, string>>;
  init: () => void;
  dispose: () => void;
} {
  const containerWidth = ref(0);
  let resizeObserver: ResizeObserver | undefined;

  const ratio = (): number =>
    options.aspectRatio() > 0 ? options.aspectRatio() : DEFAULT_ASPECT_RATIO;

  const size = computed<CanvasSize>(() => {
    let width = containerWidth.value > 0 ? containerWidth.value : options.width();
    const maxWidth = options.maxWidth();
    if (maxWidth !== undefined) width = Math.min(width, maxWidth);

    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(width / ratio()))
    };
  });

  const containerStyle = computed<Record<string, string>>(() => {
    const width = options.width();
    const style: Record<string, string> = {
      width: `${String(width)}px`,
      height: `${String(width / ratio())}px`
    };
    const maxWidth = options.maxWidth();
    if (maxWidth !== undefined) style.maxWidth = `${String(maxWidth)}px`;
    return style;
  });

  function measure(): void {
    containerWidth.value = container.value?.clientWidth ?? 0;
  }

  function init(): void {
    measure();
    resizeObserver = new ResizeObserver(measure);
    if (container.value) resizeObserver.observe(container.value);
  }

  function dispose(): void {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
  }

  return { size, containerStyle, init, dispose };
}
