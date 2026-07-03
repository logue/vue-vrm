import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { type Ref, type ShallowRef, shallowRef, watch } from 'vue';

import type {
  CameraChangePayload,
  CameraOptionsChangePayload,
  VrmCameraDeps,
  VrmCameraOptions
} from '@/types/VrmCameraTypes';

export type VrmCameraCallbacks = {
  onCameraChange?: (payload: CameraChangePayload) => void;
  onCameraOptionsChange?: (payload: CameraOptionsChangePayload) => void;
};

/**
 * Manage the perspective camera and optional OrbitControls interaction.
 *
 * @param canvasRef The `<canvas>` element OrbitControls listens on.
 * @param options Reactive getters for camera-related props.
 * @param deps Getters for state owned by other composables (renderer, fit target).
 * @param callbacks Optional hooks invoked on camera or camera-options changes.
 */
export function useVrmCamera(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: VrmCameraOptions,
  deps: VrmCameraDeps,
  callbacks: VrmCameraCallbacks = {}
): {
  camera: ShallowRef<THREE.PerspectiveCamera | null>;
  orbitControls: ShallowRef<OrbitControls | null>;
  init: () => void;
  dispose: () => void;
  resetCamera: () => void;
  updateAspect: (width: number, height: number) => void;
  update: () => void;
  handleCanvasKeydown: (event: KeyboardEvent) => void;
} {
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const orbitControls = shallowRef<OrbitControls | null>(null);

  const initialCameraDistance = shallowRef<number>(0);
  const initialCameraTarget = shallowRef<THREE.Vector3>(new THREE.Vector3());

  function getCurrentLookAt(): THREE.Vector3 {
    if (orbitControls.value) {
      return orbitControls.value.target.clone();
    }
    return new THREE.Vector3(...options.cameraLookAt());
  }

  function emitCameraChange(lookAt?: THREE.Vector3): void {
    if (!camera.value) return;
    const target = lookAt ?? getCurrentLookAt();
    callbacks.onCameraChange?.({
      position: camera.value.position.clone(),
      lookAt: target.clone(),
      distance: camera.value.position.distanceTo(target)
    });
  }

  function handleControlsChange(): void {
    emitCameraChange();
  }

  function disposeOrbitControls(): void {
    if (!orbitControls.value) return;
    orbitControls.value.removeEventListener('change', handleControlsChange);
    orbitControls.value.dispose();
    orbitControls.value = null;
  }

  function setupOrbitControls(): void {
    disposeOrbitControls();
    if (canvasRef.value) {
      canvasRef.value.tabIndex = -1;
    }
    const renderer = deps.getRenderer();
    const cameraInteraction = options.cameraInteraction();
    if (!camera.value || !renderer) return;
    if (!cameraInteraction || cameraInteraction.enabled === false) return;

    const controls = new OrbitControls(camera.value, renderer.domElement);
    controls.enableRotate = cameraInteraction.rotate ?? true;
    controls.enablePan = cameraInteraction.pan ?? true;
    controls.enableZoom = cameraInteraction.zoom ?? true;
    controls.rotateSpeed = cameraInteraction.rotateSpeed ?? 1;
    controls.panSpeed = cameraInteraction.panSpeed ?? 1;
    controls.zoomSpeed = cameraInteraction.zoomSpeed ?? 1;
    controls.enableDamping = cameraInteraction.damping ?? true;
    controls.dampingFactor = cameraInteraction.dampingFactor ?? 0.08;
    controls.minDistance = cameraInteraction.minDistance ?? 0.1;
    controls.maxDistance = cameraInteraction.maxDistance ?? Number.POSITIVE_INFINITY;
    controls.target.copy(initialCameraTarget.value);
    controls.update();
    controls.addEventListener('change', handleControlsChange);
    orbitControls.value = controls;

    if (canvasRef.value) {
      canvasRef.value.tabIndex = cameraInteraction.roll ? 0 : -1;
    }
  }

  function applyCameraTransform(): void {
    if (!camera.value) return;
    const dist = options.cameraDistance() ?? initialCameraDistance.value;
    const cameraOffset = options.cameraOffset();
    const target = new THREE.Vector3(
      initialCameraTarget.value.x + cameraOffset[0],
      initialCameraTarget.value.y + cameraOffset[1],
      initialCameraTarget.value.z + cameraOffset[2]
    );

    // Camera position: target + (0, 0, dist) rotated by cameraEuler.
    const cameraEuler = options.cameraEuler();
    const euler = new THREE.Euler(cameraEuler[0], cameraEuler[1], cameraEuler[2], 'XYZ');
    const offset = new THREE.Vector3(0, 0, dist).applyEuler(euler);
    camera.value.position.copy(target).add(offset);

    const lookAt = orbitControls.value
      ? target.clone()
      : new THREE.Vector3(...options.cameraLookAt());
    camera.value.lookAt(lookAt);
    if (orbitControls.value) {
      orbitControls.value.target.copy(lookAt);
      orbitControls.value.update();
    }

    emitCameraChange(lookAt);
  }

  function computeFitDistance(target: THREE.Object3D, fovDeg: number): number {
    const box = new THREE.Box3().setFromObject(target);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    initialCameraTarget.value.copy(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (fovDeg * Math.PI) / 180;
    const dist = maxDim / 2 / Math.tan(fov / 2);
    // Add some padding so head/feet aren't clipped.
    return dist * 1.4;
  }

  /**
   * Resets the camera to its initial position calculated to fit the fit
   * target (if any) in view. If there is no fit target, only the transform
   * is reapplied.
   */
  function resetCamera(): void {
    if (!camera.value) return;
    const fitTarget = deps.getFitTarget();
    if (fitTarget) {
      const fov = camera.value.fov;
      initialCameraDistance.value = computeFitDistance(fitTarget, fov);
    }
    camera.value.up.set(0, 1, 0);
    applyCameraTransform();
  }

  function rollCamera(direction: 1 | -1): void {
    if (!camera.value || !orbitControls.value) return;
    const cameraInteraction = options.cameraInteraction();
    if (!(cameraInteraction?.roll ?? false)) return;
    const step = cameraInteraction?.rollSpeed ?? 0.03;
    const forward = new THREE.Vector3();
    camera.value.getWorldDirection(forward);
    camera.value.up.applyAxisAngle(forward, step * direction).normalize();
    camera.value.lookAt(orbitControls.value.target);
    orbitControls.value.update();
    emitCameraChange();
  }

  function handleCanvasKeydown(event: KeyboardEvent): void {
    if (event.key === 'q' || event.key === 'Q') {
      event.preventDefault();
      rollCamera(-1);
    }
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
      rollCamera(1);
    }
  }

  function updateAspect(width: number, height: number): void {
    if (!camera.value) return;
    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    orbitControls.value?.update();
  }

  function update(): void {
    orbitControls.value?.update();
  }

  function init(): void {
    const opts = options.cameraOptions();
    const cam = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, opts.near ?? 0.1, opts.far ?? 100);
    camera.value = cam;
    initialCameraTarget.value = new THREE.Vector3(...options.cameraLookAt());
    initialCameraDistance.value = 3;
    applyCameraTransform();
    setupOrbitControls();
  }

  function dispose(): void {
    disposeOrbitControls();
    camera.value = null;
  }

  watch(
    () => [
      options.cameraDistance(),
      options.cameraEuler(),
      options.cameraOffset(),
      options.cameraLookAt()
    ],
    () => applyCameraTransform(),
    { deep: true }
  );

  watch(
    () => options.cameraOptions(),
    opts => {
      if (!camera.value) return;
      const fov = opts?.fov ?? 30;
      const near = opts?.near ?? 0.1;
      const far = opts?.far ?? 100;
      camera.value.fov = fov;
      camera.value.near = near;
      camera.value.far = far;
      camera.value.updateProjectionMatrix();
      resetCamera();
      callbacks.onCameraOptionsChange?.({ fov, near, far });
    },
    { deep: true }
  );

  watch(
    () => options.cameraInteraction(),
    () => setupOrbitControls(),
    { deep: true }
  );

  return {
    camera,
    orbitControls,
    init,
    dispose,
    resetCamera,
    updateAspect,
    update,
    handleCanvasKeydown
  };
}
