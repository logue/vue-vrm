import type { VrmExpressionNames } from '@/types/VrmExpressionTypes';
import type { AnimationData } from '@/types/VrmModelTypes';
import type { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
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
  /**
   * Preset and custom expression names defined by the loaded model.
   * Empty arrays when no model is loaded. Call after `model:loaded`.
   */
  getExpressionNames: () => VrmExpressionNames;
  /**
   * Set an expression weight (clamped to 0–1) without going through Vue reactivity.
   * Applied right before the next frame's `vrm.update()`, so it suits per-frame
   * input such as lip sync. Keys also given in the `expressions` prop are overridden by the prop.
   * Values persist until changed, `resetExpressions()` is called, or the component unmounts.
   * @param name - Preset or custom expression name.
   * @param weight - Weight between 0 and 1.
   */
  setExpression: (name: VRMExpressionPresetName | (string & {}), weight: number) => void;
  /** Clear all values set with `setExpression()`; those expressions return to 0 on the next frame. */
  resetExpressions: () => void;
  /** @deprecated Use `resetCamera()`. */
  resetCameraPose: () => void;
};
