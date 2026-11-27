/**
 * Reactive getters for the size-related props of VrmCanvas.
 */
export type CanvasSizeOptions = {
  /**
   * The requested width: a number (or numeric string) in pixels, or any other CSS length
   * such as `'100%'` to follow the parent's width.
   */
  width: () => number | string;
  /** The maximum width of the canvas in pixels. */
  maxWidth: () => number | undefined;
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
