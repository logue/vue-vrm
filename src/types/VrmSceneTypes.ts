import type { DirectionalLightOptions, LightOptions } from '@/types/VrmCanvasOptions';
import type { PerspectiveCamera, Vector3 } from 'three';
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * Reactive getters for the scene-related props of VrmCanvas.
 */
export type VrmSceneOptions = {
  bgTransparent: () => boolean;
  bgImage: () => string | undefined;
  showGrid: () => boolean;
  ambientLight: () => LightOptions;
  directionalLight: () => DirectionalLightOptions;
  shaderPass: () => ShaderPass | undefined;
};

export type VrmSceneDependencies = {
  /** Returns the current camera, used to (re)build the postprocessing composer. */
  getCamera: () => PerspectiveCamera | undefined;
};

export type VrmSceneCallbacks = {
  onError?: (error: unknown) => void;
  onAmbientLightChange?: (payload: LightOptions) => void;
  onDirectionalLightChange?: (payload: LightOptions & { position: Vector3 }) => void;
};
