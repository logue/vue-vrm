<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';

import { autoPositionY, disposeVrm, loadVrm } from '@/composables/useVrmLoader';
import {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation
} from '@/composables/useVrmAnimation';

type Vec3 = [number, number, number];

/**
 * Props for VrmCanvas component.
 */
type CameraOptions = {
  /** Field of view in degrees. */
  fov?: number;
  /** Near clipping plane distance. */
  near?: number;
  /** Far clipping plane distance. */
  far?: number;
};

type LightOptions = {
  /** The color of the light, as a CSS string. */
  color: string;
  /** The intensity of the light. */
  intensity: number;
};

type CameraInteractionOptions = {
  /** Enables camera orbit interaction when this option object is provided. */
  enabled?: boolean;
  /** Enables orbit rotation around the target. */
  rotate?: boolean;
  /** Enables panning. */
  pan?: boolean;
  /** Enables zooming (dolly). */
  zoom?: boolean;
  /** Enables roll interaction with Q/E keys while canvas is focused. */
  roll?: boolean;
  /** Orbit rotation speed. */
  rotateSpeed?: number;
  /** Pan speed. */
  panSpeed?: number;
  /** Zoom speed. */
  zoomSpeed?: number;
  /** Enables damping for smoother interaction. */
  damping?: boolean;
  /** Damping factor when damping is enabled. */
  dampingFactor?: number;
  /** Minimum camera distance from target. */
  minDistance?: number;
  /** Maximum camera distance from target. */
  maxDistance?: number;
  /** Roll speed in radians per key press. */
  rollSpeed?: number;
};

type Props = {
  /** The VRM model data as an ArrayBuffer. */
  modelData?: ArrayBuffer | null;
  /** The VRM animation data as an ArrayBuffer or an array of ArrayBuffers. */
  animationData?: ArrayBuffer | ArrayBuffer[] | null;
  /** The weights for each animation. */
  animationWeights?: number[] | null;
  /** Whether the animation should loop. */
  loop?: boolean;
  /** Whether the background should be transparent. */
  bgTransparent?: boolean;
  /** The background image URL. */
  bgImage?: string | null;
  /** Whether to show the grid helper. */
  showGrid?: boolean;
  /** The width of the canvas in pixels. */
  width?: number;
  /** The maximum width of the canvas in pixels. */
  maxWidth?: number | null;
  /** The aspect ratio (width / height) to maintain. Height is derived from width and this ratio. */
  aspectRatio?: number;
  /** Options for configuring the camera. */
  cameraOptions?: CameraOptions;
  /** The distance of the camera from the target. */
  cameraDistance?: number | null;
  /** The Euler angles (Yaw, Pitch, Roll) for the camera rotation. */
  cameraEuler?: Vec3;
  /** The offset of the camera from the target. */
  cameraOffset?: Vec3;
  /** The point the camera is looking at. */
  cameraLookAt?: Vec3;
  /** Options for the ambient light (color and intensity). */
  ambientLight?: LightOptions;
  /** Options for the directional light (color, intensity, and position). */
  directionalLight?: LightOptions & { position: Vec3 };
  /** An optional postprocessing shader pass to apply. */
  shaderPass?: ShaderPass | null;
  /** Optional camera interaction controls. */
  cameraInteraction?: CameraInteractionOptions | null;
};

const props = withDefaults(defineProps<Props>(), {
  modelData: null,
  animationData: null,
  animationWeights: null,
  loop: true,
  bgTransparent: false,
  bgImage: null,
  showGrid: false,
  width: 480,
  maxWidth: null,
  aspectRatio: 3 / 4,
  cameraOptions: () => ({ fov: 30, near: 0.1, far: 100 }),
  cameraDistance: null,
  cameraEuler: () => [0, 0, 0],
  cameraOffset: () => [0, 0, 0],
  cameraLookAt: () => [0, 0.9, 0],
  ambientLight: () => ({ color: '#ffffff', intensity: 0.5 }),
  directionalLight: () => ({ color: '#ffffff', intensity: 1, position: [1, 1, 1] as Vec3 }),
  shaderPass: null,
  cameraInteraction: null
});

const emit = defineEmits<{
  /** Emitted when the model starts loading. */
  'model:loading': [];
  /** Emitted when the model has successfully loaded. */
  'model:loaded': [vrm: VRM];
  /** Emitted when the model is unloaded. */
  'model:unloaded': [];
  /** Emitted when there is an error loading the model. */
  'model:error': [error: Error];
  /** Emitted when the animation starts loading. */
  'animation:loading': [];
  /** Emitted when the animation has successfully loaded. */
  'animation:loaded': [animation: VRMAnimation | VRMAnimation[]];
  /** Emitted when the animation starts playing. */
  'animation:start': [];
  /** Emitted when the animation is paused. */
  'animation:pause': [];
  /** Emitted when the animation is resumed. */
  'animation:resume': [];
  /** Emitted when the animation is stopped. */
  'animation:stop': [];
  /** Emitted when the animation ends. */
  'animation:end': [];
  /** Emitted when there is an error loading the animation. */
  'animation:error': [error: Error];
  /** Emitted when the camera changes. */
  'camera:change': [
    payload: {
      /* The new camera position. */
      position: THREE.Vector3;
      /* The new camera lookAt point. */
      lookAt: THREE.Vector3;
      /* The new camera distance. */
      distance: number;
    }
  ];
  /**
   * Emitted when the camera options change (fov, near, far).
   * Note that changes to cameraDistance, cameraEuler, cameraOffset, or cameraLookAt do not trigger this event, but do trigger 'camera:change'.
   */
  'camera:options-change': [payload: CameraOptions];
  'light:ambient-change': [payload: LightOptions];
  'light:directional-change': [payload: LightOptions & { position: THREE.Vector3 }];
  error: [error: Error];
}>();

// ---------- Refs ----------
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const ambientLightRef = shallowRef<THREE.AmbientLight | null>(null);
const directionalLightRef = shallowRef<THREE.DirectionalLight | null>(null);
const grid = shallowRef<THREE.GridHelper | null>(null);
const bgTexture = shallowRef<THREE.Texture | null>(null);
const composer = shallowRef<EffectComposer | null>(null);
const renderPass = shallowRef<RenderPass | null>(null);
const outputPass = shallowRef<OutputPass | null>(null);
const orbitControls = shallowRef<OrbitControls | null>(null);

const vrm = shallowRef<VRM | null>(null);
const mixer = shallowRef<THREE.AnimationMixer | null>(null);

const initialCameraDistance = ref<number>(0);
const initialCameraTarget = shallowRef<THREE.Vector3>(new THREE.Vector3(0, 0.9, 0));

const clock = new THREE.Timer();
let rafId = 0;
let resizeObserver: ResizeObserver | null = null;

// ---------- Helpers ----------
function emitError(scope: 'model' | 'animation' | 'system', err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  if (scope === 'model') emit('model:error', e);
  else if (scope === 'animation') emit('animation:error', e);
  else emit('error', e);
}

function getCurrentLookAt(): THREE.Vector3 {
  if (orbitControls.value) {
    return orbitControls.value.target.clone();
  }
  return new THREE.Vector3(...props.cameraLookAt);
}

function emitCameraChange(lookAt?: THREE.Vector3): void {
  if (!camera.value) return;
  const target = lookAt ?? getCurrentLookAt();
  emit('camera:change', {
    position: camera.value.position.clone(),
    lookAt: target.clone(),
    distance: camera.value.position.distanceTo(target)
  });
}

function handleControlsChange(): void {
  emitCameraChange();
}

function handleCanvasPointerDown(): void {
  if (!canvasRef.value) return;
  canvasRef.value.focus();
}

function rollCamera(direction: 1 | -1): void {
  if (!camera.value || !orbitControls.value) return;
  if (!(props.cameraInteraction?.roll ?? false)) return;
  const step = props.cameraInteraction?.rollSpeed ?? 0.03;
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
  if (!camera.value || !renderer.value) return;
  if (!props.cameraInteraction || props.cameraInteraction.enabled === false) return;

  const controls = new OrbitControls(camera.value, renderer.value.domElement);
  controls.enableRotate = props.cameraInteraction.rotate ?? true;
  controls.enablePan = props.cameraInteraction.pan ?? true;
  controls.enableZoom = props.cameraInteraction.zoom ?? true;
  controls.rotateSpeed = props.cameraInteraction.rotateSpeed ?? 1;
  controls.panSpeed = props.cameraInteraction.panSpeed ?? 1;
  controls.zoomSpeed = props.cameraInteraction.zoomSpeed ?? 1;
  controls.enableDamping = props.cameraInteraction.damping ?? true;
  controls.dampingFactor = props.cameraInteraction.dampingFactor ?? 0.08;
  controls.minDistance = props.cameraInteraction.minDistance ?? 0.1;
  controls.maxDistance = props.cameraInteraction.maxDistance ?? Number.POSITIVE_INFINITY;
  controls.target.copy(initialCameraTarget.value);
  controls.update();
  controls.addEventListener('change', handleControlsChange);
  orbitControls.value = controls;

  if (canvasRef.value) {
    canvasRef.value.tabIndex = props.cameraInteraction.roll ? 0 : -1;
  }
}

function applyCameraTransform(): void {
  if (!camera.value) return;
  const dist = props.cameraDistance ?? initialCameraDistance.value;
  const target = new THREE.Vector3(
    initialCameraTarget.value.x + props.cameraOffset[0],
    initialCameraTarget.value.y + props.cameraOffset[1],
    initialCameraTarget.value.z + props.cameraOffset[2]
  );

  // Camera position: target + (0, 0, dist) rotated by cameraEuler.
  const euler = new THREE.Euler(
    props.cameraEuler[0],
    props.cameraEuler[1],
    props.cameraEuler[2],
    'XYZ'
  );
  const offset = new THREE.Vector3(0, 0, dist).applyEuler(euler);
  camera.value.position.copy(target).add(offset);

  const lookAt = orbitControls.value ? target.clone() : new THREE.Vector3(...props.cameraLookAt);
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
 * Resets the camera to its initial position calculated to fit the loaded VRM
 * model in view. If no model is loaded, only the transform is reapplied.
 */
function resetCamera(): void {
  if (!camera.value) return;
  if (vrm.value) {
    const fov = camera.value.fov;
    initialCameraDistance.value = computeFitDistance(vrm.value.scene, fov);
  }
  camera.value.up.set(0, 1, 0);
  applyCameraTransform();
}

// ---------- Sizing ----------
function computeCanvasSize(): { width: number; height: number } {
  const container = containerRef.value;
  let width = container?.clientWidth ?? 0;

  if (width <= 0) {
    width = props.width;
  }
  if (props.maxWidth != null) width = Math.min(width, props.maxWidth);

  // Derive height from width and aspect ratio.
  const ratio = props.aspectRatio > 0 ? props.aspectRatio : 9 / 16;
  const height = width / ratio;

  return { width: Math.max(1, Math.floor(width)), height: Math.max(1, Math.floor(height)) };
}

function updateSize(): void {
  if (!renderer.value || !camera.value) return;
  const { width, height } = computeCanvasSize();
  renderer.value.setSize(width, height, false);
  if (composer.value) composer.value.setSize(width, height);
  camera.value.aspect = width / height;
  camera.value.updateProjectionMatrix();
  orbitControls.value?.update();
}

// ---------- Background / Grid ----------
function applyBackground(): void {
  if (!scene.value || !renderer.value) return;
  if (props.bgTransparent) {
    renderer.value.setClearColor(0x000000, 0);
    scene.value.background = null;
    if (bgTexture.value) {
      bgTexture.value.dispose();
      bgTexture.value = null;
    }
    return;
  }

  renderer.value.setClearColor(0x000000, 1);
  if (props.bgImage) {
    const loader = new THREE.TextureLoader();
    loader.load(
      props.bgImage,
      tex => {
        if (bgTexture.value) bgTexture.value.dispose();
        bgTexture.value = tex;
        if (scene.value) scene.value.background = tex;
      },
      undefined,
      err => emitError('system', err)
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
  if (props.showGrid && !grid.value) {
    grid.value = new THREE.GridHelper(10, 10);
    scene.value.add(grid.value);
  } else if (!props.showGrid && grid.value) {
    scene.value.remove(grid.value);
    grid.value.dispose();
    grid.value = null;
  }
}

// ---------- Composer ----------
function rebuildComposer(): void {
  if (!renderer.value || !scene.value || !camera.value) return;

  // Tear down existing composer.
  if (composer.value) {
    composer.value.dispose();
    composer.value = null;
    renderPass.value = null;
    outputPass.value = null;
  }

  if (!props.shaderPass) return;

  const c = new EffectComposer(renderer.value);
  const rp = new RenderPass(scene.value, camera.value);
  const op = new OutputPass();
  c.addPass(rp);
  c.addPass(props.shaderPass);
  c.addPass(op);
  composer.value = c;
  renderPass.value = rp;
  outputPass.value = op;

  const { width, height } = computeCanvasSize();
  c.setSize(width, height);
}

// ---------- Loaders ----------
async function handleModelData(buffer: ArrayBuffer | null): Promise<void> {
  if (!scene.value) return;

  // Unload previous.
  if (vrm.value) {
    scene.value.remove(vrm.value.scene);
    disposeVrm(vrm.value);
    vrm.value = null;
    if (mixer.value) {
      disposeMixer(mixer.value);
      mixer.value = null;
    }
    emit('model:unloaded');
  }

  if (!buffer) return;

  emit('model:loading');
  try {
    const newVrm = await loadVrm(buffer);
    autoPositionY(newVrm);
    scene.value.add(newVrm.scene);
    vrm.value = newVrm;
    resetCamera();
    emit('model:loaded', newVrm);

    // Re-apply animation if we already have animationData.
    if (props.animationData) {
      await handleAnimationData(props.animationData, props.animationWeights);
    }
  } catch (err) {
    emitError('model', err);
  }
}

async function handleAnimationData(
  data: ArrayBuffer | ArrayBuffer[] | null,
  weights: number[] | null
): Promise<void> {
  if (mixer.value) {
    disposeMixer(mixer.value);
    mixer.value = null;
  }
  if (!data || !vrm.value) return;

  emit('animation:loading');
  try {
    const buffers = Array.isArray(data) ? data : [data];
    const animations = await Promise.all(buffers.map(b => loadVRMAnimation(b)));
    mixer.value = createMixerWithClips(vrm.value, animations, weights);
    if (!mixer.value) {
      throw new Error('[VrmCanvas] Failed to create AnimationMixer.');
    }
    mixer.value.addEventListener('finished', () => {
      if (!props.loop) emit('animation:end');
    });
    // Honor loop flag on actions.
    mixer.value.timeScale = 1;
    // Apply loop mode to all registered actions via the (undocumented)
    // `_actions` array exposed by AnimationMixer.
    const actions = (mixer.value as unknown as { _actions: THREE.AnimationAction[] })._actions;
    for (const a of actions) {
      a.setLoop(
        props.loop ? THREE.LoopRepeat : THREE.LoopOnce,
        props.loop ? Number.POSITIVE_INFINITY : 1
      );
      a.clampWhenFinished = !props.loop;
    }
    emit('animation:loaded', Array.isArray(data) ? animations : animations[0]);
    emit('animation:start');
  } catch (err) {
    emitError('animation', err);
  }
}

// ---------- Animation Loop ----------
function tick(timestamp: number): void {
  rafId = requestAnimationFrame(tick);
  clock.update(timestamp);
  const dt = clock.getDelta();
  if (mixer.value) mixer.value.update(dt);
  if (vrm.value) vrm.value.update(dt);
  orbitControls.value?.update();
  if (composer.value) {
    composer.value.render(dt);
  } else if (renderer.value && scene.value && camera.value) {
    renderer.value.render(scene.value, camera.value);
  }
}

// ---------- Lifecycle ----------
onMounted(() => {
  if (!canvasRef.value) return;

  // Renderer.
  const r = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  r.setPixelRatio(window.devicePixelRatio);
  r.outputColorSpace = THREE.SRGBColorSpace;
  renderer.value = r;

  // Scene.
  const s = new THREE.Scene();
  scene.value = s;

  // Camera.
  const opts = props.cameraOptions ?? {};
  const cam = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, opts.near ?? 0.1, opts.far ?? 100);
  camera.value = cam;
  initialCameraTarget.value = new THREE.Vector3(...props.cameraLookAt);
  initialCameraDistance.value = 3;
  applyCameraTransform();

  // Lights.
  const al = new THREE.AmbientLight(
    new THREE.Color(props.ambientLight.color),
    props.ambientLight.intensity
  );
  ambientLightRef.value = al;
  s.add(al);

  const dl = new THREE.DirectionalLight(
    new THREE.Color(props.directionalLight.color),
    props.directionalLight.intensity
  );
  dl.position.set(...props.directionalLight.position);
  directionalLightRef.value = dl;
  s.add(dl);

  // Background / grid.
  applyBackground();
  applyGrid();

  // Composer (if shaderPass provided).
  rebuildComposer();

  // Optional camera interaction controls.
  setupOrbitControls();

  // Sizing.
  updateSize();
  resizeObserver = new ResizeObserver(() => updateSize());
  if (containerRef.value) resizeObserver.observe(containerRef.value);

  // Initial model load.
  if (props.modelData) {
    void handleModelData(props.modelData);
  }

  // Start loop.
  tick(performance.now());
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (mixer.value) {
    disposeMixer(mixer.value);
    mixer.value = null;
  }
  if (vrm.value) {
    disposeVrm(vrm.value);
    vrm.value = null;
  }
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
  disposeOrbitControls();
  if (renderer.value) {
    renderer.value.dispose();
    renderer.value = null;
  }
  clock.dispose();
  scene.value = null;
  camera.value = null;
  ambientLightRef.value = null;
  directionalLightRef.value = null;
});

// ---------- Watchers ----------
watch(
  () => props.modelData,
  buf => {
    void handleModelData(buf ?? null);
  }
);

watch(
  () => [props.animationData, props.animationWeights] as const,
  ([data, weights]) => {
    void handleAnimationData(data ?? null, weights ?? null);
  }
);

watch(
  () => [props.bgTransparent, props.bgImage],
  () => applyBackground()
);

watch(
  () => props.showGrid,
  () => applyGrid()
);

watch(
  () => props.ambientLight,
  () => {
    if (!ambientLightRef.value) return;
    ambientLightRef.value.color.set(props.ambientLight.color);
    ambientLightRef.value.intensity = props.ambientLight.intensity;
    emit('light:ambient-change', { ...props.ambientLight });
  },
  { deep: true }
);

watch(
  () => props.directionalLight,
  () => {
    if (!directionalLightRef.value) return;
    directionalLightRef.value.color.set(props.directionalLight.color);
    directionalLightRef.value.intensity = props.directionalLight.intensity;
    directionalLightRef.value.position.set(...props.directionalLight.position);
    emit('light:directional-change', {
      ...props.directionalLight,
      position: directionalLightRef.value.position.clone()
    });
  },
  { deep: true }
);

watch(
  () => [props.cameraDistance, props.cameraEuler, props.cameraOffset, props.cameraLookAt],
  () => applyCameraTransform(),
  { deep: true }
);

watch(
  () => props.cameraOptions,
  opts => {
    if (!camera.value || !renderer.value) return;
    const fov = opts?.fov ?? 30;
    const near = opts?.near ?? 0.1;
    const far = opts?.far ?? 100;
    camera.value.fov = fov;
    camera.value.near = near;
    camera.value.far = far;
    camera.value.updateProjectionMatrix();
    resetCamera();
    rebuildComposer();
    emit('camera:options-change', { fov, near, far });
  },
  { deep: true }
);

watch(
  () => props.shaderPass,
  () => rebuildComposer()
);

watch(
  () => props.cameraInteraction,
  () => setupOrbitControls(),
  { deep: true }
);

watch(
  () => [props.maxWidth, props.aspectRatio, props.width],
  () => updateSize()
);

// ---------- Exposed API ----------

/**
 * Loads and plays a VRMA animation.
 * When an array is provided, all clips are blended simultaneously using the
 * supplied `weights` (or equal weights when omitted / length-mismatched).
 * Replaces any currently active animation.
 * @param buf - A single VRMA `ArrayBuffer` or an array of them.
 * @param weights - Optional per-clip blend weights. Must sum to ≤ 1.0.
 */
async function playAnimation(buf: ArrayBuffer | ArrayBuffer[], weights?: number[]): Promise<void> {
  await handleAnimationData(buf, weights ?? null);
}

/**
 * Pauses the active animation by setting `mixer.timeScale` to `0`.
 * The current pose is preserved. Emits `animation:pause`.
 */
function pauseAnimation(): void {
  if (!mixer.value) return;
  mixer.value.timeScale = 0;
  emit('animation:pause');
}

/**
 * Resumes a paused animation by restoring `mixer.timeScale` to `1`.
 * Emits `animation:resume`.
 */
function resumeAnimation(): void {
  if (!mixer.value) return;
  mixer.value.timeScale = 1;
  emit('animation:resume');
}

/**
 * Stops all animation actions and rewinds the mixer to time `0`,
 * resetting the pose to the bind pose. Emits `animation:stop`.
 */
function stopAnimation(): void {
  if (!mixer.value) return;
  mixer.value.stopAllAction();
  mixer.value.setTime(0);
  emit('animation:stop');
}

/**
 * Captures the current frame as a data URL.
 * Forces a render before reading the drawing buffer so the result is always
 * up-to-date even when `requestAnimationFrame` has not fired yet.
 * @param format - MIME type of the output image (default: `'image/png'`).
 * @returns A data URL string of the captured frame.
 */
async function captureScreenshot(format = 'image/png'): Promise<string> {
  if (!renderer.value || !scene.value || !camera.value) {
    throw new Error('[VrmCanvas] Renderer is not initialized.');
  }
  // Force a render so the drawing buffer is fresh.
  if (composer.value) composer.value.render(0);
  else renderer.value.render(scene.value, camera.value);
  const canvas = renderer.value.domElement;
  return canvas.toDataURL(format);
}

const containerStyle = computed(() => {
  const style: Record<string, string> = {};
  const width = props.width;
  const ratio = props.aspectRatio > 0 ? props.aspectRatio : 9 / 16;
  const height = width / ratio;
  style.width = `${width}px`;
  style.height = `${height}px`;
  if (props.maxWidth != null) style.maxWidth = `${props.maxWidth}px`;
  return style;
});

defineExpose({
  playAnimation,
  pauseAnimation,
  resumeAnimation,
  stopAnimation,
  resetCamera,
  captureScreenshot,
  /** Returns the Three.js `Scene` instance, or `null` before mount. */
  getScene: (): THREE.Scene | null => scene.value,
  /** Returns the `PerspectiveCamera` instance, or `null` before mount. */
  getCamera: (): THREE.PerspectiveCamera | null => camera.value,
  /** Returns the `WebGLRenderer` instance, or `null` before mount. */
  getRenderer: (): THREE.WebGLRenderer | null => renderer.value,
  /** Returns the `AnimationMixer` instance, or `null` when no animation is active. */
  getMixer: (): THREE.AnimationMixer | null => mixer.value,
  /** Returns the currently loaded `VRM` instance, or `null` when no model is loaded. */
  getVrm: (): VRM | null => vrm.value,
  /** Returns the internal `<canvas>` element, or `null` before mount. */
  getCanvas: (): HTMLCanvasElement | null => canvasRef.value,
  /** Resets camera position and orientation. */
  resetCameraPose: (): void => resetCamera()
});
</script>

<template>
  <figure ref="containerRef" class="vrm-canvas-container" :style="containerStyle">
    <canvas
      ref="canvasRef"
      class="vrm-canvas"
      @keydown="handleCanvasKeydown"
      @pointerdown="handleCanvasPointerDown"
    />
  </figure>
</template>

<style scoped>
.vrm-canvas-container {
  position: relative;
  margin: 0;
  overflow: hidden;
}

.vrm-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
