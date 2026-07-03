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
