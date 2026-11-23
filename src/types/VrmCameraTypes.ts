import type { CameraInteractionOptions, CameraOptions, Vec3 } from '@/types/VrmCanvasOptions';
import type { Object3D, Vector3, WebGPURenderer } from 'three/webgpu';

/**
 * Reactive getters for the camera-related props of VrmCanvas.
 */
export type VrmCameraOptions = {
  cameraOptions: () => CameraOptions;
  cameraDistance: () => number | undefined;
  cameraEuler: () => Vec3;
  cameraOffset: () => Vec3;
  cameraLookAt: () => Vec3;
  cameraInteraction: () => CameraInteractionOptions | undefined;
};

export type VrmCameraDependencies = {
  /** Returns the current renderer, used to construct OrbitControls. */
  getRenderer: () => WebGPURenderer | undefined;
  /** Returns the object the camera should fit to when resetting. */
  getFitTarget: () => Object3D | undefined;
};

export type VrmCameraCallbacks = {
  onCameraChange?: (payload: CameraChangePayload) => void;
  onCameraOptionsChange?: (payload: Required<CameraOptions>) => void;
};

export type CameraChangePayload = {
  /** The new camera position. */
  position: Vector3;
  /** The new camera lookAt point. */
  lookAt: Vector3;
  /** The distance between position and lookAt. */
  distance: number;
};
