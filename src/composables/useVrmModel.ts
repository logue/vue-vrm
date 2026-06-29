import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';
import { type ShallowRef, shallowRef, watch } from 'vue';

import {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation,
} from '@/composables/useVrmAnimation';
import { autoPositionY, disposeVrm, loadVrm } from '@/composables/useVrmLoader';

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

/**
 * Manage the loaded VRM model and its AnimationMixer: loading/unloading the
 * model, loading and blending VRMA animations, and playback control.
 *
 * @param options Reactive getters for model/animation-related props.
 * @param deps Getter for state owned by other composables (the scene).
 * @param callbacks Optional hooks invoked on load/playback lifecycle events.
 */
export function useVrmModel(
  options: VrmModelOptions,
  deps: VrmModelDeps,
  callbacks: VrmModelCallbacks = {},
): {
  vrm: ShallowRef<VRM | null>;
  mixer: ShallowRef<THREE.AnimationMixer | null>;
  init: () => void;
  dispose: () => void;
  loadAnimation: (
    data: ArrayBuffer | ArrayBuffer[] | null,
    weights: number[] | null,
  ) => Promise<void>;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  stopAnimation: () => void;
  update: (dt: number) => void;
} {
  const vrm = shallowRef<VRM | null>(null);
  const mixer = shallowRef<THREE.AnimationMixer | null>(null);

  async function loadAnimation(
    data: ArrayBuffer | ArrayBuffer[] | null,
    weights: number[] | null,
  ): Promise<void> {
    if (mixer.value) {
      disposeMixer(mixer.value);
      mixer.value = null;
    }
    if (!data || !vrm.value) return;

    callbacks.onAnimationLoading?.();
    try {
      const buffers = Array.isArray(data) ? data : [data];
      const animations = await Promise.all(
        buffers.map((b) => loadVRMAnimation(b)),
      );
      mixer.value = createMixerWithClips(vrm.value, animations, weights);
      if (!mixer.value) {
        throw new Error('[VrmCanvas] Failed to create AnimationMixer.');
      }
      mixer.value.addEventListener('finished', () => {
        if (!options.loop()) callbacks.onAnimationEnd?.();
      });
      mixer.value.timeScale = 1;
      // Apply loop mode to all registered actions via the (undocumented)
      // `_actions` array exposed by AnimationMixer.
      const actions = (
        mixer.value as unknown as { _actions: THREE.AnimationAction[] }
      )._actions;
      for (const a of actions) {
        a.setLoop(
          options.loop() ? THREE.LoopRepeat : THREE.LoopOnce,
          options.loop() ? Number.POSITIVE_INFINITY : 1,
        );
        a.clampWhenFinished = !options.loop();
      }
      callbacks.onAnimationLoaded?.(
        Array.isArray(data) ? animations : animations[0],
      );
      callbacks.onAnimationStart?.();
    } catch (err) {
      callbacks.onAnimationError?.(err);
    }
  }

  async function loadModel(buffer: ArrayBuffer | null): Promise<void> {
    const scene = deps.getScene();
    if (!scene) return;

    // Unload previous.
    if (vrm.value) {
      scene.remove(vrm.value.scene);
      disposeVrm(vrm.value);
      vrm.value = null;
      if (mixer.value) {
        disposeMixer(mixer.value);
        mixer.value = null;
      }
      callbacks.onModelUnloaded?.();
    }

    if (!buffer) return;

    callbacks.onModelLoading?.();
    try {
      const newVrm = await loadVrm(buffer);
      autoPositionY(newVrm);
      scene.add(newVrm.scene);
      vrm.value = newVrm;
      callbacks.afterModelLoaded?.(newVrm);
      callbacks.onModelLoaded?.(newVrm);

      // Re-apply animation if we already have animationData.
      const animationData = options.animationData();
      if (animationData) {
        await loadAnimation(animationData, options.animationWeights());
      }
    } catch (err) {
      callbacks.onModelError?.(err);
    }
  }

  function pauseAnimation(): void {
    if (!mixer.value) return;
    mixer.value.timeScale = 0;
    callbacks.onAnimationPause?.();
  }

  function resumeAnimation(): void {
    if (!mixer.value) return;
    mixer.value.timeScale = 1;
    callbacks.onAnimationResume?.();
  }

  function stopAnimation(): void {
    if (!mixer.value) return;
    mixer.value.stopAllAction();
    mixer.value.setTime(0);
    callbacks.onAnimationStop?.();
  }

  function update(dt: number): void {
    mixer.value?.update(dt);
    vrm.value?.update(dt);
  }

  function init(): void {
    const modelData = options.modelData();
    if (modelData) {
      void loadModel(modelData);
    }
  }

  function dispose(): void {
    if (mixer.value) {
      disposeMixer(mixer.value);
      mixer.value = null;
    }
    if (vrm.value) {
      disposeVrm(vrm.value);
      vrm.value = null;
    }
  }

  watch(
    () => options.modelData(),
    (buf) => {
      void loadModel(buf ?? null);
    },
  );

  watch(
    () => [options.animationData(), options.animationWeights()] as const,
    ([data, weights]) => {
      void loadAnimation(data ?? null, weights ?? null);
    },
  );

  return {
    vrm,
    mixer,
    init,
    dispose,
    loadAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation,
    update,
  };
}
