import {
  createVRMAnimationClip,
  type VRMAnimation,
  VRMAnimationLoaderPlugin
} from '@pixiv/three-vrm-animation';
import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import type { VRM } from '@pixiv/three-vrm';

import { validateVrma } from '@/utils/validateGlb';

/** Options for {@link createMixerWithClips}. */
export type MixerOptions = {
  /** Whether the clips should loop forever (default: `true`). */
  loop?: boolean;
};

/**
 * Load a single VRMA animation from an ArrayBuffer.
 * Validates the GLB binary first, then parses with three-vrm-animation.
 *
 * @param buffer The GLB file as an ArrayBuffer.
 * @returns The first VRMAnimation contained in the file.
 * @throws If the buffer is not a valid VRMA GLB or if parsing fails.
 */
export async function loadVRMAnimation(buffer: ArrayBuffer): Promise<VRMAnimation> {
  validateVrma(buffer);

  const loader = new GLTFLoader();
  loader.register(parser => new VRMAnimationLoaderPlugin(parser));

  const gltf = await loader.parseAsync(buffer, '');
  const animation = (gltf.userData as { vrmAnimations?: VRMAnimation[] }).vrmAnimations?.[0];
  if (!animation) {
    throw new Error('[VrmCanvas] Failed to extract VRMAnimation from GLB.');
  }
  return animation;
}

/**
 * Resolve per-clip blend weights.
 * - Missing weights, a length mismatch, or non-finite values → equal split (1 / N).
 * - A sum greater than 1.0 → throws.
 *
 * @param count Number of clips.
 * @param weights Requested weights.
 * @returns One weight per clip.
 */
function resolveWeights(count: number, weights?: number[]): number[] {
  const valid = weights?.length === count && weights.every(v => Number.isFinite(v));
  const resolved = valid ? weights : Array.from({ length: count }, () => 1 / count);
  const total = resolved.reduce((sum, v) => sum + v, 0);
  if (total > 1 + Number.EPSILON) {
    throw new Error(`[VrmCanvas] The sum of animationWeights exceeds 1.0: ${total.toFixed(4)}`);
  }
  return resolved;
}

/**
 * Create an AnimationMixer for `vrm.scene`, register all clips with the given
 * weights and start playing them.
 *
 * @example
 * // Two animations, weighted 70% and 30%.
 * createMixerWithClips(vrm, [anim1, anim2], [0.7, 0.3]);
 * // Three animations with equal weights (1/3 each).
 * createMixerWithClips(vrm, [anim1, anim2, anim3]);
 *
 * @param vrm The VRM instance to animate.
 * @param animations The VRMAnimation instances to create clips from.
 * @param weights Optional weights for each animation; defaults to an equal split.
 * @param options Playback options.
 * @returns The new AnimationMixer instance.
 * @throws If the weights sum exceeds 1.0.
 */
export function createMixerWithClips(
  vrm: VRM,
  animations: VRMAnimation[],
  weights?: number[],
  options: MixerOptions = {}
): AnimationMixer {
  const resolved = resolveWeights(animations.length, weights);
  const loop = options.loop ?? true;

  const mixer = new AnimationMixer(vrm.scene);
  for (const [index, animation] of animations.entries()) {
    const action = mixer.clipAction(createVRMAnimationClip(animation, vrm));
    action.weight = resolved[index] ?? 0;
    action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.play();
  }
  return mixer;
}

/**
 * Stop all actions of the given mixer and release its cached resources.
 *
 * @param mixer The AnimationMixer instance to dispose.
 */
export function disposeMixer(mixer: AnimationMixer): void {
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}
