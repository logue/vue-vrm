import type * as THREE from 'three';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import type { LightOptions, Vec3 } from '@/types/VrmCanvasOptions';

/**
 * Reactive getters for the scene-related props of VrmCanvas.
 */
export type VrmSceneOptions = {
  bgTransparent: () => boolean;
  bgImage: () => string | null;
  showGrid: () => boolean;
  ambientLight: () => LightOptions;
  directionalLight: () => LightOptions & { position: Vec3 };
  shaderPass: () => ShaderPass | null;
};

export type VrmSceneDeps = {
  /** Returns the current camera, used to (re)build the postprocessing composer. */
  getCamera: () => THREE.PerspectiveCamera | null;
};

export type VrmSceneCallbacks = {
  onError?: (err: unknown) => void;
  onAmbientLightChange?: (payload: LightOptions) => void;
  onDirectionalLightChange?: (payload: LightOptions & { position: THREE.Vector3 }) => void;
};
