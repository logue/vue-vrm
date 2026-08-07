import {
  MToonMaterialLoaderPlugin,
  type VRM,
  VRMLoaderPlugin,
  VRMUtils,
} from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';
import { validateVrm } from '@/utils/validateGlb';

/**
 * Load a VRM 1.0 model from an ArrayBuffer.
 * Validates the GLB binary first, then parses with three-vrm.
 *
 * @param buffer The GLB file as an ArrayBuffer.
 * @returns The loaded VRM instance.
 * @throws If the buffer is not a valid VRM 1.0 GLB or if parsing fails.
 */
export async function loadVrm(buffer: ArrayBuffer): Promise<VRM> {
  validateVrm(buffer);

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  // Register a VRMLoaderPlugin
  loader.register((parser) => {
    // create a WebGPU compatible MToonMaterialLoaderPlugin
    const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
      // set the material type to MToonNodeMaterial
      materialType: MToonNodeMaterial,
    });

    return new VRMLoaderPlugin(parser, {
      // Specify the MToonMaterialLoaderPlugin to use in the VRMLoaderPlugin instance
      mtoonMaterialPlugin,
    });
  });
  const gltf = await loader.parseAsync(buffer, '');
  const vrm = (gltf.userData as { vrm?: VRM }).vrm;
  if (!vrm) {
    throw new Error('[VrmCanvas] Failed to extract VRM from GLB.');
  }

  // Optimize for performance.
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);

  // Disable frustum culling to keep skinned meshes visible.
  vrm.scene.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return vrm;
}

/**
 * Position a freshly loaded VRM so that its feet rest on y=0.
 * Assumes the VRM's root is at the model origin and that the model is properly centered.
 * Modifies the VRM's scene position in-place.
 * Does not throw if the VRM has no scene or if bounding box calculation fails; in that case, the VRM is left unmodified.
 *
 * @param vrm The VRM instance to adjust.
 */
export function autoPositionY(vrm: VRM): void {
  vrm.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(vrm.scene);
  const minY = box.min.y;
  vrm.scene.position.y -= minY;
}

/**
 * Dispose a VRM instance and free its GPU resources.
 * Does not throw if the VRM is already disposed or has no scene.
 *
 * @param vrm The VRM instance to dispose.
 */
export function disposeVrm(vrm: VRM): void {
  VRMUtils.deepDispose(vrm.scene);
}
