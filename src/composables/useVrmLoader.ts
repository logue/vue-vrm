import { MToonMaterialLoaderPlugin, type VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3 } from 'three/webgpu';

import { validateVrm } from '@/utils/validateGlb';

/**
 * Load a VRM 1.0 model from an ArrayBuffer.
 * Validates the GLB binary first, then parses with three-vrm using
 * WebGPU-compatible MToon node materials.
 *
 * @param buffer The GLB file as an ArrayBuffer.
 * @returns The loaded VRM instance.
 * @throws If the buffer is not a valid VRM 1.0 GLB or if parsing fails.
 */
export async function loadVrm(buffer: ArrayBuffer): Promise<VRM> {
  validateVrm(buffer);

  const loader = new GLTFLoader();
  loader.register(
    parser =>
      new VRMLoaderPlugin(parser, {
        mtoonMaterialPlugin: new MToonMaterialLoaderPlugin(parser, {
          materialType: MToonNodeMaterial
        })
      })
  );

  const gltf = await loader.parseAsync(buffer, '');
  const vrm = (gltf.userData as { vrm?: VRM }).vrm;
  if (!vrm) {
    throw new Error('[VrmCanvas] Failed to extract VRM from GLB.');
  }

  // Optimize for performance.
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);

  // Disable frustum culling to keep skinned meshes visible.
  vrm.scene.traverse(object => {
    object.frustumCulled = false;
  });

  return vrm;
}

/**
 * Move a VRM vertically so that its lowest point rests on y=0.
 * Modifies the VRM's scene position in-place.
 *
 * @param vrm The VRM instance to adjust.
 */
export function autoPositionY(vrm: VRM): void {
  vrm.scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(vrm.scene);
  vrm.scene.position.y -= box.min.y;
}

/**
 * Dispose a VRM instance and free its GPU resources.
 *
 * @param vrm The VRM instance to dispose.
 */
export function disposeVrm(vrm: VRM): void {
  VRMUtils.deepDispose(vrm.scene);
}
