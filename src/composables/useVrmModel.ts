import { type AnimationMixer } from 'three';
import { type ShallowRef, shallowRef, watch } from 'vue';

import type {
  AnimationData,
  VrmModelCallbacks,
  VrmModelDependencies,
  VrmModelOptions
} from '@/types/VrmModelTypes';
import type { VRM } from '@pixiv/three-vrm';

import {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation
} from '@/composables/useVrmAnimation';
import { autoPositionY, disposeVrm, loadVrm } from '@/composables/useVrmLoader';

/**
 * Manage the loaded VRM model and its AnimationMixer: loading/unloading the
 * model, loading and blending VRMA animations, and playback control.
 *
 * @param options Reactive getters for model/animation-related props.
 * @param dependencies Getter for state owned by other composables (the scene).
 * @param callbacks Optional hooks invoked on load/playback lifecycle events.
 */
export function useVrmModel(
  options: VrmModelOptions,
  dependencies: VrmModelDependencies,
  callbacks: VrmModelCallbacks = {}
): {
  vrm: ShallowRef<VRM | undefined>;
  mixer: ShallowRef<AnimationMixer | undefined>;
  init: () => Promise<void>;
  dispose: () => void;
  loadAnimation: (data?: AnimationData, weights?: number[]) => Promise<void>;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  stopAnimation: () => void;
  update: (
    deltaSeconds: number,
    beforeVrmUpdate?: (vrm: VRM, deltaSeconds: number) => void
  ) => void;
} {
  const vrm = shallowRef<VRM>();
  const mixer = shallowRef<AnimationMixer>();

  // Incremented on every load request so that results of superseded
  // (out-of-order) async loads are discarded.
  let modelRequest = 0;
  let animationRequest = 0;

  function releaseMixer(): void {
    if (!mixer.value) return;
    disposeMixer(mixer.value);
    mixer.value = undefined;
  }

  async function loadAnimation(data?: AnimationData, weights?: number[]): Promise<void> {
    const request = ++animationRequest;
    releaseMixer();
    const target = vrm.value;
    if (!(data && target)) return;

    callbacks.onAnimationLoading?.();
    try {
      const buffers = Array.isArray(data) ? data : [data];
      const animations = await Promise.all(buffers.map(buffer => loadVRMAnimation(buffer)));
      if (request !== animationRequest || target !== vrm.value) return;

      const loop = options.loop();
      const newMixer = createMixerWithClips(target, animations, weights, { loop });
      newMixer.addEventListener('finished', () => {
        if (!options.loop()) callbacks.onAnimationEnd?.();
      });
      mixer.value = newMixer;

      callbacks.onAnimationLoaded?.(Array.isArray(data) ? animations : animations[0]);
      callbacks.onAnimationStart?.();
    } catch (error) {
      callbacks.onAnimationError?.(error);
    }
  }

  function unloadModel(): void {
    if (!vrm.value) return;
    releaseMixer();
    dependencies.getScene()?.remove(vrm.value.scene);
    disposeVrm(vrm.value);
    vrm.value = undefined;
    callbacks.onModelUnloaded?.();
  }

  async function loadModel(buffer?: ArrayBuffer): Promise<void> {
    const request = ++modelRequest;
    unloadModel();
    if (!buffer) return;

    callbacks.onModelLoading?.();
    try {
      const newVrm = await loadVrm(buffer);
      const scene = dependencies.getScene();
      if (request !== modelRequest || !scene) {
        disposeVrm(newVrm);
        return;
      }
      autoPositionY(newVrm);
      scene.add(newVrm.scene);
      vrm.value = newVrm;
      callbacks.afterModelLoaded?.(newVrm);
      callbacks.onModelLoaded?.(newVrm);
    } catch (error) {
      callbacks.onModelError?.(error);
      return;
    }

    // Re-apply the current animation to the new model.
    await loadAnimation(options.animationData(), options.animationWeights());
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

  /**
   * Advance the mixer, then the VRM.
   * @param beforeVrmUpdate Runs between the two, e.g. to override expression weights
   *   set by the animation before `vrm.update()` applies them.
   */
  function update(
    deltaSeconds: number,
    beforeVrmUpdate?: (vrm: VRM, deltaSeconds: number) => void
  ): void {
    mixer.value?.update(deltaSeconds);
    if (!vrm.value) return;
    beforeVrmUpdate?.(vrm.value, deltaSeconds);
    vrm.value.update(deltaSeconds);
  }

  async function init(): Promise<void> {
    await loadModel(options.modelData());
  }

  function dispose(): void {
    modelRequest++;
    animationRequest++;
    releaseMixer();
    if (vrm.value) {
      disposeVrm(vrm.value);
      vrm.value = undefined;
    }
  }

  watch(options.modelData, buffer => loadModel(buffer));
  watch(
    () => [options.animationData(), options.animationWeights()] as const,
    ([data, weights]) => loadAnimation(data, weights)
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
    update
  };
}
