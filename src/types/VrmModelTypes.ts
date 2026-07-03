import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import type * as THREE from 'three';

/**
 * Reactive getters for the model/animation-related props of VrmCanvas.
 */
export type VrmModelOptions = {
  modelData: () => ArrayBuffer | null;
  animationData: () => ArrayBuffer | ArrayBuffer[] | null;
  animationWeights: () => number[] | null;
  loop: () => boolean;
};

export type VrmModelDeps = {
  /** Returns the scene to add/remove the VRM's root object from. */
  getScene: () => THREE.Scene | null;
};

export type VrmModelCallbacks = {
  onModelLoading?: () => void;
  onModelLoaded?: (vrm: VRM) => void;
  onModelUnloaded?: () => void;
  onModelError?: (err: unknown) => void;
  onAnimationLoading?: () => void;
  onAnimationLoaded?: (animation: VRMAnimation | VRMAnimation[]) => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onAnimationError?: (err: unknown) => void;
  onAnimationPause?: () => void;
  onAnimationResume?: () => void;
  onAnimationStop?: () => void;
  /** Invoked right after a new model has been added to the scene, before `onModelLoaded`. */
  afterModelLoaded?: (vrm: VRM) => void;
};
