import { type ComputedRef, computed, type Ref, ref } from 'vue';

/**
 * Reactive getters for the size-related props of VrmCanvas.
 */
export type CanvasSizeOptions = {
  /** The requested width of the canvas in pixels. */
  width: () => number;
  /** The maximum width of the canvas in pixels. */
  maxWidth: () => number | null;
  /** The aspect ratio (width / height) to maintain. */
  aspectRatio: () => number;
};

/**
 * Computed pixel size of the canvas.
 */
export type CanvasSize = {
  width: number;
  height: number;
};

/**
 * Manage DOM sizing for VrmCanvas: derives the renderer's pixel size from the
 * container's measured width (via ResizeObserver) and exposes the CSS style
 * used to size the container element.
 *
 * @param containerRef The container element to observe and size.
 * @param options Reactive getters for width / maxWidth / aspectRatio props.
 * @returns Reactive `size`, `containerStyle`, and `init` / `dispose` lifecycle functions.
 */
export function useCanvasSize(
  containerRef: Ref<HTMLElement | null>,
  options: CanvasSizeOptions,
): {
  size: ComputedRef<CanvasSize>;
  containerStyle: ComputedRef<Record<string, string>>;
  init: () => void;
  dispose: () => void;
} {
  const containerWidth = ref(0);
  let resizeObserver: ResizeObserver | null = null;

  const size = computed<CanvasSize>(() => {
    let width = containerWidth.value;
    if (width <= 0) {
      width = options.width();
    }
    const maxWidth = options.maxWidth();
    if (maxWidth != null) width = Math.min(width, maxWidth);

    const ratio = options.aspectRatio() > 0 ? options.aspectRatio() : 9 / 16;
    const height = width / ratio;

    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    };
  });

  const containerStyle = computed<Record<string, string>>(() => {
    const style: Record<string, string> = {};
    const width = options.width();
    const ratio = options.aspectRatio() > 0 ? options.aspectRatio() : 9 / 16;
    const height = width / ratio;
    style.width = `${width}px`;
    style.height = `${height}px`;
    const maxWidth = options.maxWidth();
    if (maxWidth != null) style.maxWidth = `${maxWidth}px`;
    return style;
  });

  function init(): void {
    containerWidth.value = containerRef.value?.clientWidth ?? 0;
    resizeObserver = new ResizeObserver(() => {
      containerWidth.value = containerRef.value?.clientWidth ?? 0;
    });
    if (containerRef.value) resizeObserver.observe(containerRef.value);
  }

  function dispose(): void {
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  return { size, containerStyle, init, dispose };
}
