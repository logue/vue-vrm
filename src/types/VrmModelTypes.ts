import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import type { Scene } from 'three';

/** One or more VRMA buffers. */
export type AnimationData = ArrayBuffer | ArrayBuffer[];

/**
 * Reactive getters for the model/animation-related props of VrmCanvas.
 */
export type VrmModelOptions = {
  modelData: () => ArrayBuffer | undefined;
  animationData: () => AnimationData | undefined;
  animationWeights: () => number[] | undefined;
  loop: () => boolean;
};

export type VrmModelDependencies = {
  /** Returns the scene to add/remove the VRM's root object from. */
  getScene: () => Scene | undefined;
};

export type VrmModelCallbacks = {
  onModelLoading?: () => void;
  onModelLoaded?: (vrm: VRM) => void;
  onModelUnloaded?: () => void;
  onModelError?: (error: unknown) => void;
  onAnimationLoading?: () => void;
  onAnimationLoaded?: (animation: VRMAnimation | VRMAnimation[]) => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onAnimationError?: (error: unknown) => void;
  onAnimationPause?: () => void;
  onAnimationResume?: () => void;
  onAnimationStop?: () => void;
  /** Invoked right after a new model has been added to the scene, before `onModelLoaded`. */
  afterModelLoaded?: (vrm: VRM) => void;
};
