import type { AnimationData } from '@/types/VrmModelTypes';
import type { VRM } from '@pixiv/three-vrm';
import type { AnimationMixer, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/** Public API exposed from a `VrmCanvas` instance (template ref or custom element). */
export type VrmCanvasExposed = {
  /**
   * Load and play a VRMA animation, replacing any active animation.
   * When an array is provided, all clips are blended simultaneously using the
   * supplied `weights` (or equal weights when omitted / length-mismatched).
   * @param data - A single VRMA `ArrayBuffer` or an array of them.
   * @param weights - Optional per-clip blend weights. Must sum to ≤ 1.0.
   */
  playAnimation: (data: AnimationData, weights?: number[]) => Promise<void>;
  /** Pause the active animation. */
  pauseAnimation: () => void;
  /** Resume a paused animation. */
  resumeAnimation: () => void;
  /** Stop the active animation. */
  stopAnimation: () => void;
  /** Reset camera position and orientation to frame the model. */
  resetCamera: () => void;
  /**
   * Capture the current frame as a data URL.
   * @param format - MIME type of the output image (default: `'image/png'`).
   */
  captureScreenshot: (format?: string) => string;
  /** The Three.js `Scene`, or `undefined` before mount. */
  getScene: () => Scene | undefined;
  /** The `PerspectiveCamera`, or `undefined` before mount. */
  getCamera: () => PerspectiveCamera | undefined;
  /** The `WebGLRenderer`, or `undefined` before mount. */
  getRenderer: () => WebGLRenderer | undefined;
  /** The `AnimationMixer`, or `undefined` when no animation is active. */
  getMixer: () => AnimationMixer | undefined;
  /** The loaded `VRM`, or `undefined` when no model is loaded. */
  getVrm: () => VRM | undefined;
  /** The internal `<canvas>` element, or `undefined` before mount. */
  getCanvas: () => HTMLCanvasElement | undefined;
  /** @deprecated Use `resetCamera()`. */
  resetCameraPose: () => void;
};
