import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import {
  createVRMAnimationClip,
  type VRMAnimation,
  VRMAnimationLoaderPlugin,
} from '@pixiv/three-vrm-animation';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer, type Object3D } from 'three/webgpu';
import { validateVrma } from '@/utils/validateGlb';

/**
 * Load a single VRMA animation from an ArrayBuffer.
 * Validates the GLB binary first, then parses with three-vrm-animation.
 *
 * @param buffer The GLB file as an ArrayBuffer.
 * @returns The loaded VRMAnimation instance.
 * @throws If the buffer is not a valid VRMA GLB or if parsing fails.
 */
export async function loadVRMAnimation(
  buffer: ArrayBuffer,
): Promise<VRMAnimation | undefined> {
  validateVrma(buffer);

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

  const gltf = await loader.parseAsync(buffer, '');
  const animations = (gltf.userData as { vrmAnimations?: VRMAnimation[] })
    .vrmAnimations;
  if (!animations || animations.length === 0) {
    throw new Error('[VrmCanvas] Failed to extract VRMAnimation from GLB.');
  }
  return animations[0];
}

/**
 * Replace the AnimationMixer with a new one created against `vrm.scene` and
 * register all clips with the given weights.
 *
 * @example
 * // Create a mixer with two animations, weighted 70% and 30%.
 * const mixer = createMixerWithClips(vrm, [anim1, anim2], [0.7, 0.3]);
 * // Create a mixer with three animations, with equal weights (1/3 each).
 * const mixer = createMixerWithClips(vrm, [anim1, anim2, anim3]);
 * // Create a mixer with two animations, with equal weights (1/2 each) even though weights are invalid.
 * const mixer = createMixerWithClips(vrm, [anim1, anim2], [10, 20]);
 *
 * Weight validation rules:
 * - Empty/undefined weights → equal split (1 / N).
 * - Length mismatch → equal split (1 / N).
 * - Sum > 1.0 (with epsilon) → throws.
 *
 * Does not dispose the old mixer or its actions; caller is responsible for that if needed.
 *
 * @param vrm The VRM instance to animate.
 * @param animations The VRMAnimation instances to create clips from.
 * @param weights Optional weights for each animation; if not provided or invalid, defaults to equal split.
 * @returns The new AnimationMixer instance.
 * @throws If the weights are invalid (sum exceeds 1.0).
 */
export function createMixerWithClips(
  vrm: VRM,
  animations: VRMAnimation[],
  weights?: number[] | null,
): AnimationMixer {
  const n = animations.length;
  const lengthOk = weights?.length === n;
  const allFinite = weights?.every((v) => Number.isFinite(v)) ?? false;
  const useEqual = !(lengthOk && allFinite);
  const w = useEqual
    ? animations.map(() => 1 / n)
    : (weights ?? []).slice(0, n);
  const total = w.reduce((sum, v) => sum + v, 0);
  if (total > 1 + Number.EPSILON) {
    throw new Error(
      `[VrmCanvas] The sum of animationWeights exceeds 1.0: ${total.toFixed(4)}`,
    );
  }

  const mixer = new AnimationMixer(vrm.scene);

  // Reduce the chance of T-pose by applying a neutral pose if there is no idle animation (i.e. only one animation with weight 1).
  if (!mixer) {
    applyNeutralPose(vrm);
  }
  animations.forEach((anim, i) => {
    const clip = createVRMAnimationClip(anim, vrm);
    const action = mixer.clipAction(clip);
    action.weight = w[i] ?? 0;
    action.play();
  });
  return mixer;
}

/**
 * Stop and dispose the given mixer.
 * Does not throw if the mixer is already stopped or has no root.
 *
 * @param mixer The AnimationMixer instance to dispose.
 */
export function disposeMixer(mixer: AnimationMixer): void {
  mixer.stopAllAction();
  const root = mixer.getRoot();
  if (root) mixer.uncacheRoot(root as Object3D);
}

/**
 * Apply a neutral pose to the given VRM instance.
 * This is useful to prevent the T-pose when there is no idle animation.
 *
 * @param vrm The VRM instance to apply the neutral pose to.
 */
export function applyNeutralPose(vrm: VRM) {
  const h = vrm.humanoid;
  const setRotZ = (bone: VRMHumanBoneName, z: number) => {
    const n = h?.getNormalizedBoneNode?.(bone);
    if (n) n.rotation.z = z;
  };
  const setRotX = (bone: VRMHumanBoneName, x: number) => {
    const n = h?.getNormalizedBoneNode?.(bone);
    if (n) n.rotation.x = x;
  };

  setRotZ('leftUpperArm', -0.6);
  setRotZ('rightUpperArm', 0.6);
  setRotZ('leftLowerArm', -0.15);
  setRotZ('rightLowerArm', 0.15);
  setRotX('leftLowerLeg', 0.06);
  setRotX('rightLowerLeg', 0.06);
  setRotX('neck', -0.05);
}
