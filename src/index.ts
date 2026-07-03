export { default as VrmCanvas } from '@/components/VrmCanvas.vue';

export type VrmCanvasExposed = {
  resetCamera: () => void;
  resetCameraPose?: () => void;
};

export function resetVrmCanvasCamera(instance?: VrmCanvasExposed): void {
  if (!instance) return;
  if (instance.resetCameraPose) {
    instance.resetCameraPose();
    return;
  }
  instance.resetCamera();
}

export {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation
} from '@/composables/useVrmAnimation';
export { autoPositionY, disposeVrm, loadVrm } from '@/composables/useVrmLoader';
export { default as meta } from '@/Meta';
export { validateVrm, validateVrma } from '@/utils/validateGlb';
