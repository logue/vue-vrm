import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Box3, Euler, MathUtils, type Object3D, PerspectiveCamera, Vector3 } from 'three/webgpu';
import { type Ref, type ShallowRef, shallowRef, watch } from 'vue';

import type {
  VrmCameraCallbacks,
  VrmCameraDependencies,
  VrmCameraOptions
} from '@/types/VrmCameraTypes';
import type { CameraOptions } from '@/types/VrmCanvasOptions';

const DEFAULT_CAMERA: Required<CameraOptions> = { fov: 30, near: 0.1, far: 100 };
const DEFAULT_DISTANCE = 3;
const DEFAULT_ROLL_SPEED = 0.03;
/** Padding applied to the fit distance so head/feet aren't clipped. */
const FIT_PADDING = 1.4;

/**
 * Manage the perspective camera and optional OrbitControls interaction.
 *
 * @param canvas The `<canvas>` element OrbitControls listens on.
 * @param options Reactive getters for camera-related props.
 * @param dependencies Getters for state owned by other composables (renderer, fit target).
 * @param callbacks Optional hooks invoked on camera or camera-options changes.
 */
export function useVrmCamera(
  canvas: Readonly<Ref<HTMLCanvasElement | undefined>>,
  options: VrmCameraOptions,
  dependencies: VrmCameraDependencies,
  callbacks: VrmCameraCallbacks = {}
): {
  camera: ShallowRef<PerspectiveCamera | undefined>;
  orbitControls: ShallowRef<OrbitControls | undefined>;
  init: () => void;
  dispose: () => void;
  resetCamera: () => void;
  updateAspect: (width: number, height: number) => void;
  update: () => void;
  handleCanvasKeydown: (event: KeyboardEvent) => void;
} {
  const camera = shallowRef<PerspectiveCamera>();
  const orbitControls = shallowRef<OrbitControls>();

  let fitDistance = DEFAULT_DISTANCE;
  const fitTarget = new Vector3();

  function resolveCameraOptions(): Required<CameraOptions> {
    return { ...DEFAULT_CAMERA, ...options.cameraOptions() };
  }

  function getCurrentLookAt(): Vector3 {
    return orbitControls.value
      ? orbitControls.value.target.clone()
      : new Vector3(...options.cameraLookAt());
  }

  function emitCameraChange(lookAt = getCurrentLookAt()): void {
    if (!camera.value) return;
    callbacks.onCameraChange?.({
      position: camera.value.position.clone(),
      lookAt: lookAt.clone(),
      distance: camera.value.position.distanceTo(lookAt)
    });
  }

  function handleControlsChange(): void {
    emitCameraChange();
  }

  function disposeOrbitControls(): void {
    if (!orbitControls.value) return;
    orbitControls.value.removeEventListener('change', handleControlsChange);
    orbitControls.value.dispose();
    orbitControls.value = undefined;
  }

  function setupOrbitControls(): void {
    disposeOrbitControls();
    const interaction = options.cameraInteraction();
    if (canvas.value) {
      // Only make the canvas focusable when Q/E roll keys are in use.
      canvas.value.tabIndex = interaction?.enabled && interaction.roll ? 0 : -1;
    }
    const renderer = dependencies.getRenderer();
    if (!(camera.value && renderer && interaction?.enabled)) return;

    const controls = new OrbitControls(camera.value, renderer.domElement);
    controls.enableRotate = interaction.rotate ?? true;
    controls.enablePan = interaction.pan ?? true;
    controls.enableZoom = interaction.zoom ?? true;
    controls.rotateSpeed = interaction.rotateSpeed ?? 1;
    controls.panSpeed = interaction.panSpeed ?? 1;
    controls.zoomSpeed = interaction.zoomSpeed ?? 1;
    controls.enableDamping = interaction.damping ?? true;
    controls.dampingFactor = interaction.dampingFactor ?? 0.08;
    controls.minDistance = interaction.minDistance ?? 0.1;
    controls.maxDistance = interaction.maxDistance ?? Infinity;
    controls.target.copy(fitTarget);
    controls.update();
    controls.addEventListener('change', handleControlsChange);
    orbitControls.value = controls;
  }

  function applyCameraTransform(): void {
    if (!camera.value) return;
    const target = fitTarget.clone().add(new Vector3(...options.cameraOffset()));

    // Camera position: target + (0, 0, distance) rotated by cameraEuler.
    const offset = new Vector3(0, 0, options.cameraDistance() ?? fitDistance).applyEuler(
      new Euler(...options.cameraEuler(), 'XYZ')
    );
    camera.value.position.copy(target).add(offset);

    const lookAt = orbitControls.value ? target : new Vector3(...options.cameraLookAt());
    camera.value.lookAt(lookAt);
    if (orbitControls.value) {
      orbitControls.value.target.copy(lookAt);
      orbitControls.value.update();
    }

    emitCameraChange(lookAt);
  }

  /**
   * Center the camera target on `object` and compute a distance that fits it in view.
   */
  function fitTo(object: Object3D, fovDeg: number): void {
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    box.getCenter(fitTarget);
    const maxDim = Math.max(size.x, size.y, size.z);
    fitDistance = (maxDim / 2 / Math.tan(MathUtils.degToRad(fovDeg) / 2)) * FIT_PADDING;
  }

  /**
   * Reset the camera so the fit target (if any) is framed in view.
   * Without a fit target, only the transform is reapplied.
   */
  function resetCamera(): void {
    if (!camera.value) return;
    const target = dependencies.getFitTarget();
    if (target) fitTo(target, camera.value.fov);
    camera.value.up.set(0, 1, 0);
    applyCameraTransform();
  }

  function rollCamera(direction: 1 | -1): void {
    const interaction = options.cameraInteraction();
    if (!(camera.value && orbitControls.value && interaction?.roll)) return;
    const forward = camera.value.getWorldDirection(new Vector3());
    camera.value.up
      .applyAxisAngle(forward, (interaction.rollSpeed ?? DEFAULT_ROLL_SPEED) * direction)
      .normalize();
    camera.value.lookAt(orbitControls.value.target);
    orbitControls.value.update();
    emitCameraChange();
  }

  function handleCanvasKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key !== 'q' && key !== 'e') return;
    event.preventDefault();
    rollCamera(key === 'q' ? -1 : 1);
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
    const { fov, near, far } = resolveCameraOptions();
    camera.value = new PerspectiveCamera(fov, 1, near, far);
    fitTarget.set(...options.cameraLookAt());
    fitDistance = DEFAULT_DISTANCE;
    applyCameraTransform();
    setupOrbitControls();
  }

  function dispose(): void {
    disposeOrbitControls();
    camera.value = undefined;
  }

  watch(
    () => [
      options.cameraDistance(),
      options.cameraEuler(),
      options.cameraOffset(),
      options.cameraLookAt()
    ],
    applyCameraTransform,
    { deep: true }
  );

  watch(
    options.cameraOptions,
    () => {
      if (!camera.value) return;
      const resolved = resolveCameraOptions();
      Object.assign(camera.value, resolved);
      camera.value.updateProjectionMatrix();
      resetCamera();
      callbacks.onCameraOptionsChange?.(resolved);
    },
    { deep: true }
  );

  watch(options.cameraInteraction, setupOrbitControls, { deep: true });

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
