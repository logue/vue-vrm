import { type ComputedRef, computed, type Ref, ref } from 'vue';

import type { CanvasSize, CanvasSizeOptions } from '@/types/CanvasSizeTypes';

const DEFAULT_ASPECT_RATIO = 9 / 16;
/** Pixel width used for a fluid canvas before the container has been measured. */
const FALLBACK_WIDTH = 480;

/**
 * Interpret the `width` prop: a number or numeric string is a fixed pixel width;
 * any other string is a CSS length (e.g. `'100%'`) applied to the container.
 */
function parseWidth(width: number | string): { px: number } | { css: string } {
  if (typeof width === 'number') return { px: width };
  const trimmed = width.trim();
  const px = Number(trimmed.replace(/px$/u, ''));
  return trimmed !== '' && Number.isFinite(px) ? { px } : { css: trimmed };
}

/**
 * Manage DOM sizing for VrmCanvas: derives the renderer's pixel size from the
 * container's measured width (via ResizeObserver) and exposes the CSS style
 * used to size the container element.
 *
 * - Fixed (`width` is a number): the container is `width` px wide, height derived from the ratio.
 * - Fluid (`width` is a CSS length such as `'100%'`): the container takes that width,
 *   the height follows through CSS `aspect-ratio`, and the renderer is sized from
 *   the measured width.
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
    const parsed = parseWidth(options.width());
    const requested = 'px' in parsed ? parsed.px : FALLBACK_WIDTH;
    let width = containerWidth.value > 0 ? containerWidth.value : requested;
    const maxWidth = options.maxWidth();
    if (maxWidth !== undefined) width = Math.min(width, maxWidth);

    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(width / ratio()))
    };
  });

  const containerStyle = computed<Record<string, string>>(() => {
    const parsed = parseWidth(options.width());
    const style: Record<string, string> =
      'px' in parsed
        ? { width: `${String(parsed.px)}px`, height: `${String(parsed.px / ratio())}px` }
        : { width: parsed.css, aspectRatio: String(ratio()) };
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
