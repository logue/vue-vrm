import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import * as THREE from 'three/webgpu';

import { type Ref, type ShallowRef, shallowRef, watch } from 'vue';

import type { VrmSceneCallbacks, VrmSceneDeps, VrmSceneOptions } from '@/types/VrmSceneTypes';
/**
 * Manage the Three.js scene: renderer, scene graph, lights, background,
 * grid helper, and the optional postprocessing composer.
 *
 * @param canvasRef The `<canvas>` element to render into.
 * @param options Reactive getters for scene-related props.
 * @param deps Getters for state owned by other composables (e.g. the camera).
 * @param callbacks Optional hooks invoked on error or reactive light changes.
 */
export function useVrmScene(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: VrmSceneOptions,
  deps: VrmSceneDeps,
  callbacks: VrmSceneCallbacks = {}
): {
  renderer: ShallowRef<THREE.WebGPURenderer | null>;
  scene: ShallowRef<THREE.Scene | null>;
  composer: ShallowRef<EffectComposer | null>;
  init: () => Promise<void>;
  dispose: () => void;
  setSize: (width: number, height: number) => void;
  rebuildComposer: () => void;
  render: (dt: number, camera: THREE.PerspectiveCamera | null) => void;
} {
  const renderer = shallowRef<THREE.WebGPURenderer | null>(null);
  const scene = shallowRef<THREE.Scene | null>(null);
  const ambientLightRef = shallowRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = shallowRef<THREE.DirectionalLight | null>(null);
  const grid = shallowRef<THREE.GridHelper | null>(null);
  const bgTexture = shallowRef<THREE.Texture | null>(null);
  const composer = shallowRef<EffectComposer | null>(null);
  const renderPass = shallowRef<RenderPass | null>(null);
  const outputPass = shallowRef<OutputPass | null>(null);

  function applyBackground(): void {
    if (!scene.value || !renderer.value) return;
    if (options.bgTransparent()) {
      renderer.value.setClearColor(0x000000, 0);
      scene.value.background = null;
      if (bgTexture.value) {
        bgTexture.value.dispose();
        bgTexture.value = null;
      }
      return;
    }

    renderer.value.setClearColor(0x000000, 1);
    const bgImage = options.bgImage();
    if (bgImage) {
      const loader = new THREE.TextureLoader();
      loader.load(
        bgImage,
        tex => {
          if (bgTexture.value) bgTexture.value.dispose();
          bgTexture.value = tex;
          if (scene.value) scene.value.background = tex;
        },
        undefined,
        err => callbacks.onError?.(err)
      );
    } else {
      if (bgTexture.value) {
        bgTexture.value.dispose();
        bgTexture.value = null;
      }
      scene.value.background = null;
    }
  }

  function applyGrid(): void {
    if (!scene.value) return;
    if (options.showGrid() && !grid.value) {
      grid.value = new THREE.GridHelper(10, 10);
      scene.value.add(grid.value);
    } else if (!options.showGrid() && grid.value) {
      scene.value.remove(grid.value);
      grid.value.dispose();
      grid.value = null;
    }
  }

  function rebuildComposer(): void {
    const camera = deps.getCamera();
    if (!renderer.value || !scene.value || !camera) return;

    if (composer.value) {
      composer.value.dispose();
      composer.value = null;
      renderPass.value = null;
      outputPass.value = null;
    }

    const shaderPass = options.shaderPass();
    if (!shaderPass) return;

    // EffectComposer's types still assume the legacy WebGLRenderer, but at
    // runtime it only calls methods also present on the unified WebGPURenderer.
    const c = new EffectComposer(
      renderer.value as unknown as ConstructorParameters<typeof EffectComposer>[0]
    );
    const rp = new RenderPass(scene.value, camera);
    const op = new OutputPass();
    c.addPass(rp);
    c.addPass(shaderPass);
    c.addPass(op);
    composer.value = c;
    renderPass.value = rp;
    outputPass.value = op;
  }

  function setSize(width: number, height: number): void {
    renderer.value?.setSize(width, height, false);
    composer.value?.setSize(width, height);
  }

  function render(dt: number, camera: THREE.PerspectiveCamera | null): void {
    if (composer.value) {
      composer.value.render(dt);
    } else if (renderer.value && scene.value && camera) {
      renderer.value.render(scene.value, camera);
    }
  }

  /**
   * Creates the renderer, scene, lights, background, and grid.
   * Does not build the composer — call `rebuildComposer()` once the camera
   * (owned by the caller) exists, since the composer's RenderPass needs it.
   */
  async function init(): Promise<void> {
    if (!canvasRef.value) return;

    const r = new THREE.WebGPURenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true
    });
    // MToonNodeMaterial is a Node material; it can only be rendered by the
    // unified WebGPURenderer (WebGPU with automatic WebGL2 fallback), which
    // requires an async init before the first render.
    await r.init();
    r.setPixelRatio(window.devicePixelRatio);
    r.outputColorSpace = THREE.SRGBColorSpace;
    renderer.value = r;

    const s = new THREE.Scene();
    scene.value = s;

    const ambientLight = options.ambientLight();
    const al = new THREE.AmbientLight(new THREE.Color(ambientLight.color), ambientLight.intensity);
    ambientLightRef.value = al;
    s.add(al);

    const directionalLight = options.directionalLight();
    const dl = new THREE.DirectionalLight(
      new THREE.Color(directionalLight.color),
      directionalLight.intensity
    );
    dl.position.set(...directionalLight.position);
    directionalLightRef.value = dl;
    s.add(dl);

    applyBackground();
    applyGrid();
  }

  function dispose(): void {
    if (grid.value) {
      grid.value.dispose();
      grid.value = null;
    }
    if (bgTexture.value) {
      bgTexture.value.dispose();
      bgTexture.value = null;
    }
    if (composer.value) {
      composer.value.dispose();
      composer.value = null;
    }
    renderPass.value = null;
    outputPass.value = null;
    if (renderer.value) {
      renderer.value.dispose();
      renderer.value = null;
    }
    scene.value = null;
    ambientLightRef.value = null;
    directionalLightRef.value = null;
  }

  watch(
    () => [options.bgTransparent(), options.bgImage()],
    () => applyBackground()
  );

  watch(
    () => options.showGrid(),
    () => applyGrid()
  );

  watch(
    () => options.ambientLight(),
    () => {
      if (!ambientLightRef.value) return;
      const ambientLight = options.ambientLight();
      ambientLightRef.value.color.set(ambientLight.color);
      ambientLightRef.value.intensity = ambientLight.intensity;
      callbacks.onAmbientLightChange?.({ ...ambientLight });
    },
    { deep: true }
  );

  watch(
    () => options.directionalLight(),
    () => {
      if (!directionalLightRef.value) return;
      const directionalLight = options.directionalLight();
      directionalLightRef.value.color.set(directionalLight.color);
      directionalLightRef.value.intensity = directionalLight.intensity;
      directionalLightRef.value.position.set(...directionalLight.position);
      callbacks.onDirectionalLightChange?.({
        ...directionalLight,
        position: directionalLightRef.value.position.clone()
      });
    },
    { deep: true }
  );

  watch(
    () => options.shaderPass(),
    () => rebuildComposer()
  );

  return {
    renderer,
    scene,
    composer,
    init,
    dispose,
    setSize,
    rebuildComposer,
    render
  };
}
