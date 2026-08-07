import type * as THREE from 'three/webgpu';
import type {
  CameraInteractionOptions,
  CameraOptions,
  Vec3,
} from './VrmCanvasOptions';

/**
 * Reactive getters for the camera-related props of VrmCanvas.
 */
export type VrmCameraOptions = {
  cameraOptions: () => CameraOptions;
  cameraDistance: () => number | null;
  cameraEuler: () => Vec3;
  cameraOffset: () => Vec3;
  cameraLookAt: () => Vec3;
  cameraInteraction: () => CameraInteractionOptions | null;
};

export type VrmCameraDeps = {
  /** Returns the current renderer, used to construct OrbitControls. */
  getRenderer: () => THREE.WebGPURenderer | null;
  /** Returns the object the camera should fit to when resetting, or null. */
  getFitTarget: () => THREE.Object3D | null;
};

export type CameraChangePayload = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  distance: number;
};

export type CameraOptionsChangePayload = {
  fov: number;
  near: number;
  far: number;
};
