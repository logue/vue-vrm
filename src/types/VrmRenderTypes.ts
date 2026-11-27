import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/** The Three.js objects owned by a `VrmCanvas`, available from mount until unmount. */
export type VrmRenderTargets = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
};

/** Argument passed to the `render` prop once per frame. */
export type VrmRenderContext = VrmRenderTargets & {
  /** Seconds since the previous frame (the same value passed to the mixer and `vrm.update()`). */
  delta: number;
  /** Seconds since the render loop started. */
  elapsed: number;
};

/** Replaces the default `renderer.render(scene, camera)` call. */
export type VrmRenderFunction = (context: VrmRenderContext) => void;

/** Payload of the `resize` event. */
export type VrmResizePayload = {
  /** Drawing-buffer width in CSS pixels. */
  width: number;
  /** Drawing-buffer height in CSS pixels. */
  height: number;
  /** The renderer's device pixel ratio. */
  pixelRatio: number;
};
