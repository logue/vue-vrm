export { default as VrmCanvas } from './components/VrmCanvas.vue';

export type VrmCanvasExposed = {
  resetCamera: () => void;
  resetCameraPose?: () => void;
};

export function resetVrmCanvasCamera(instance: VrmCanvasExposed | null | undefined): void {
  if (!instance) return;
  if (instance.resetCameraPose) {
    instance.resetCameraPose();
    return;
  }
  instance.resetCamera();
}

export { loadVrm, autoPositionY, disposeVrm } from './composables/useVrmLoader';
export {
  loadVRMAnimation,
  createMixerWithClips,
  disposeMixer
} from './composables/useVrmAnimation';
export { validateVrm, validateVrma } from './utils/validateGlb';
