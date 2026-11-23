import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import {
  AmbientLight,
  DirectionalLight,
  GridHelper,
  type PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  WebGPURenderer
} from 'three/webgpu';
import { type Ref, type ShallowRef, shallowRef, watch } from 'vue';

import type {
  VrmSceneCallbacks,
  VrmSceneDependencies,
  VrmSceneOptions
} from '@/types/VrmSceneTypes';

/**
 * Manage the Three.js scene: renderer, scene graph, lights, background,
 * grid helper, and the optional postprocessing composer.
 *
 * @param canvas The `<canvas>` element to render into.
 * @param options Reactive getters for scene-related props.
 * @param dependencies Getters for state owned by other composables (e.g. the camera).
 * @param callbacks Optional hooks invoked on error or reactive light changes.
 */
export function useVrmScene(
  canvas: Readonly<Ref<HTMLCanvasElement | undefined>>,
  options: VrmSceneOptions,
  dependencies: VrmSceneDependencies,
  callbacks: VrmSceneCallbacks = {}
): {
  renderer: ShallowRef<WebGPURenderer | undefined>;
  scene: ShallowRef<Scene | undefined>;
  composer: ShallowRef<EffectComposer | undefined>;
  init: () => Promise<void>;
  dispose: () => void;
  setSize: (width: number, height: number) => void;
  rebuildComposer: () => void;
  render: (deltaSeconds: number, camera?: PerspectiveCamera) => void;
} {
  const renderer = shallowRef<WebGPURenderer>();
  const scene = shallowRef<Scene>();
  const composer = shallowRef<EffectComposer>();

  // Non-reactive internals.
  let ambientLight: AmbientLight | undefined;
  let directionalLight: DirectionalLight | undefined;
  let grid: GridHelper | undefined;
  let bgTexture: Texture | undefined;
  /** Incremented per background request so stale texture loads are discarded. */
  let bgRequest = 0;

  function setBackground(texture?: Texture): void {
    if (bgTexture !== texture) bgTexture?.dispose();
    bgTexture = texture;
    // eslint-disable-next-line unicorn/no-null -- three.js uses `null` for "no background".
    if (scene.value) scene.value.background = texture ?? null;
  }

  function applyBackground(): void {
    if (!(scene.value && renderer.value)) return;
    const request = ++bgRequest;
    const transparent = options.bgTransparent();
    renderer.value.setClearColor(0x00_00_00, transparent ? 0 : 1);

    const bgImage = options.bgImage();
    if (transparent || !bgImage) {
      setBackground();
      return;
    }
    new TextureLoader().load(
      bgImage,
      texture => {
        if (request === bgRequest) {
          texture.colorSpace = SRGBColorSpace;
          setBackground(texture);
        } else {
          texture.dispose();
        }
      },
      undefined,
      error => callbacks.onError?.(error)
    );
  }

  function applyGrid(): void {
    if (!scene.value) return;
    const show = options.showGrid();
    if (show && !grid) {
      grid = new GridHelper(10, 10);
      scene.value.add(grid);
    } else if (!show && grid) {
      scene.value.remove(grid);
      grid.dispose();
      grid = undefined;
    }
  }

  function disposeComposer(): void {
    composer.value?.dispose();
    composer.value = undefined;
  }

  function rebuildComposer(): void {
    const camera = dependencies.getCamera();
    if (!(renderer.value && scene.value && camera)) return;

    disposeComposer();
    const shaderPass = options.shaderPass();
    if (!shaderPass) return;

    // EffectComposer's types still assume the legacy WebGLRenderer, but at
    // runtime it only calls methods also present on the unified WebGPURenderer.
    const c = new EffectComposer(
      renderer.value as unknown as ConstructorParameters<typeof EffectComposer>[0]
    );
    c.addPass(new RenderPass(scene.value, camera));
    c.addPass(shaderPass);
    c.addPass(new OutputPass());
    composer.value = c;
  }

  function setSize(width: number, height: number): void {
    renderer.value?.setSize(width, height, false);
    composer.value?.setSize(width, height);
  }

  function render(deltaSeconds: number, camera?: PerspectiveCamera): void {
    if (composer.value) {
      composer.value.render(deltaSeconds);
    } else if (renderer.value && scene.value && camera) {
      renderer.value.render(scene.value, camera);
    }
  }

  function applyAmbientLight(): void {
    if (!ambientLight) return;
    const { color, intensity } = options.ambientLight();
    ambientLight.color.set(color);
    ambientLight.intensity = intensity;
  }

  function applyDirectionalLight(): void {
    if (!directionalLight) return;
    const { color, intensity, position } = options.directionalLight();
    directionalLight.color.set(color);
    directionalLight.intensity = intensity;
    directionalLight.position.set(...position);
  }

  /**
   * Create the renderer, scene, lights, background, and grid.
   * Does not build the composer — call `rebuildComposer()` once the camera
   * (owned by the caller) exists, since the composer's RenderPass needs it.
   */
  async function init(): Promise<void> {
    if (!canvas.value) return;

    // MToonNodeMaterial is a Node material; it can only be rendered by the
    // unified WebGPURenderer (WebGPU with automatic WebGL2 fallback), which
    // requires an async init before the first render.
    const r = new WebGPURenderer({ canvas: canvas.value, antialias: true, alpha: true });
    await r.init();
    r.setPixelRatio(globalThis.devicePixelRatio);
    r.outputColorSpace = SRGBColorSpace;
    renderer.value = r;

    const s = new Scene();
    ambientLight = new AmbientLight();
    directionalLight = new DirectionalLight();
    s.add(ambientLight, directionalLight);
    scene.value = s;

    applyAmbientLight();
    applyDirectionalLight();
    applyBackground();
    applyGrid();
  }

  function dispose(): void {
    bgRequest++;
    grid?.dispose();
    grid = undefined;
    setBackground();
    disposeComposer();
    void renderer.value?.dispose();
    renderer.value = undefined;
    scene.value = undefined;
    ambientLight = undefined;
    directionalLight = undefined;
  }

  watch(() => [options.bgTransparent(), options.bgImage()], applyBackground);
  watch(options.showGrid, applyGrid);
  watch(
    options.ambientLight,
    () => {
      if (!ambientLight) return;
      applyAmbientLight();
      callbacks.onAmbientLightChange?.({ ...options.ambientLight() });
    },
    { deep: true }
  );
  watch(
    options.directionalLight,
    () => {
      if (!directionalLight) return;
      applyDirectionalLight();
      callbacks.onDirectionalLightChange?.({
        ...options.directionalLight(),
        position: directionalLight.position.clone()
      });
    },
    { deep: true }
  );
  watch(options.shaderPass, rebuildComposer);

  return { renderer, scene, composer, init, dispose, setSize, rebuildComposer, render };
}
