import VrmCanvas from '@/components/VrmCanvas';

export { VrmCanvas };
export {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation,
  type MixerOptions
} from '@/composables/useVrmAnimation';
export {
  useVrmCanvas,
  type VrmCanvasEmit,
  vrmCanvasEmits,
  type VrmCanvasProps,
  vrmCanvasProps
} from '@/composables/useVrmCanvas';
export { autoPositionY, disposeVrm, loadVrm } from '@/composables/useVrmLoader';
export { Meta } from '@/types/Meta';
export type { CameraChangePayload } from '@/types/VrmCameraTypes';
export type {
  CameraInteractionOptions,
  CameraOptions,
  DirectionalLightOptions,
  LightOptions,
  Vec3
} from '@/types/VrmCanvasOptions';
export type { VrmCanvasExposed } from '@/types/VrmCanvasExposed';
export type { AnimationData } from '@/types/VrmModelTypes';
export { validateVrm, validateVrma } from '@/utils/validateGlb';

/**
 * Reset the camera of a `<VrmCanvas>` instance.
 * @deprecated Call `instance.resetCamera()` directly.
 */
export function resetVrmCanvasCamera(instance?: { resetCamera: () => void }): void {
  instance?.resetCamera();
}
