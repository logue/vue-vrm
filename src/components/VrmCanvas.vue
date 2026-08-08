<script setup lang="ts">
import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type * as THREE from 'three/webgpu';
import { onMounted, onUnmounted, ref, watch } from 'vue';

import { useCanvasSize } from '@/composables/useCanvasSize';
import { useRenderLoop } from '@/composables/useRenderLoop';
import { useVrmCamera } from '@/composables/useVrmCamera';
import { useVrmModel } from '@/composables/useVrmModel';
import { useVrmScene } from '@/composables/useVrmScene';
import type {
  CameraInteractionOptions,
  CameraOptions,
  LightOptions,
  Vec3
} from '@/types/VrmCanvasOptions';

/**
 * Props for VrmCanvas component.
 */
type Props = {
  /** The VRM model data as an ArrayBuffer. */
  modelData: ArrayBuffer;
  /** The VRM animation data as an ArrayBuffer or an array of ArrayBuffers. */
  animationData: ArrayBuffer | ArrayBuffer[];
  /** The weights for each animation. */
  animationWeights: number[];
  /** Whether the animation should loop. */
  loop: boolean;
  /** Whether the background should be transparent. */
  bgTransparent: boolean;
  /** The background image URL. */
  bgImage: string;
  /** Whether to show the grid helper. */
  showGrid: boolean;
  /** The width of the canvas in pixels. */
  width: number;
  /** The maximum width of the canvas in pixels. */
  maxWidth: number;
  /** The aspect ratio (width / height) to maintain. Height is derived from width and this ratio. */
  aspectRatio: number;
  /** Options for configuring the camera. */
  cameraOptions: CameraOptions;
  /** The distance of the camera from the target. */
  cameraDistance: number;
  /** The Euler angles (Yaw, Pitch, Roll) for the camera rotation. */
  cameraEuler: Vec3;
  /** The offset of the camera from the target. */
  cameraOffset: Vec3;
  /** The point the camera is looking at. */
  cameraLookAt: Vec3;
  /** Options for the ambient light (color and intensity). */
  ambientLight: LightOptions;
  /** Options for the directional light (color, intensity, and position). */
  directionalLight: LightOptions & { position: Vec3 };
  /** An optional postprocessing shader pass to apply. */
  shaderPass: ShaderPass;
  /** Optional camera interaction controls. */
  cameraInteraction: CameraInteractionOptions;
};

const props = withDefaults(defineProps<Partial<Props>>(), {
  loop: true,
  bgTransparent: false,
  showGrid: false,
  width: 480,
  aspectRatio: 3 / 4,
  cameraOptions: () => ({ fov: 30, near: 0.1, far: 100 }),
  cameraEuler: () => [0, 0, 0],
  cameraOffset: () => [0, 0, 0],
  cameraLookAt: () => [0, 0.9, 0],
  ambientLight: () => ({ color: '#ffffff', intensity: 0.5 }),
  directionalLight: () => ({
    color: '#ffffff',
    intensity: 1,
    position: [1, 1, 1] as Vec3
  })
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

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

// ---------- Refs ----------
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// ---------- Composables ----------
const sceneApi = useVrmScene(
  canvasRef,
  {
    bgTransparent: () => props.bgTransparent,
    bgImage: () => props.bgImage ?? null,
    showGrid: () => props.showGrid,
    ambientLight: () => props.ambientLight,
    directionalLight: () => props.directionalLight,
    shaderPass: () => props.shaderPass ?? null
  },
  { getCamera: () => cameraApi.camera.value },
  {
    onError: err => emit('error', toError(err)),
    onAmbientLightChange: payload => emit('light:ambient-change', payload),
    onDirectionalLightChange: payload => emit('light:directional-change', payload)
  }
);

const cameraApi = useVrmCamera(
  canvasRef,
  {
    cameraOptions: () => props.cameraOptions,
    cameraDistance: () => props.cameraDistance ?? null,
    cameraEuler: () => props.cameraEuler,
    cameraOffset: () => props.cameraOffset,
    cameraLookAt: () => props.cameraLookAt,
    cameraInteraction: () => props.cameraInteraction ?? null
  },
  {
    getRenderer: () => sceneApi.renderer.value,
    getFitTarget: () => modelApi.vrm.value?.scene ?? null
  },
  {
    onCameraChange: payload => emit('camera:change', payload),
    onCameraOptionsChange: payload => {
      sceneApi.rebuildComposer();
      emit('camera:options-change', payload);
    }
  }
);

const modelApi = useVrmModel(
  {
    modelData: () => props.modelData ?? null,
    animationData: () => props.animationData ?? null,
    animationWeights: () => props.animationWeights ?? null,
    loop: () => props.loop
  },
  { getScene: () => sceneApi.scene.value },
  {
    onModelLoading: () => emit('model:loading'),
    onModelLoaded: vrm => emit('model:loaded', vrm),
    onModelUnloaded: () => emit('model:unloaded'),
    onModelError: err => emit('model:error', toError(err)),
    onAnimationLoading: () => emit('animation:loading'),
    onAnimationLoaded: animation => emit('animation:loaded', animation),
    onAnimationStart: () => emit('animation:start'),
    onAnimationEnd: () => emit('animation:end'),
    onAnimationError: err => emit('animation:error', toError(err)),
    onAnimationPause: () => emit('animation:pause'),
    onAnimationResume: () => emit('animation:resume'),
    onAnimationStop: () => emit('animation:stop'),
    afterModelLoaded: () => cameraApi.resetCamera()
  }
);

const canvasSizeApi = useCanvasSize(containerRef, {
  width: () => props.width,
  maxWidth: () => props.maxWidth ?? null,
  aspectRatio: () => props.aspectRatio
});

const renderLoop = useRenderLoop(dt => {
  modelApi.update(dt);
  cameraApi.update();
  sceneApi.render(dt, cameraApi.camera.value);
});

// ---------- Canvas event handlers ----------
function handleCanvasPointerDown(): void {
  canvasRef.value?.focus();
}

// ---------- Lifecycle ----------
onMounted(async () => {
  // WebGPURenderer requires an async init before the first render.
  await sceneApi.init();
  // The camera must exist before the composer's RenderPass is built.
  cameraApi.init();
  sceneApi.rebuildComposer();

  canvasSizeApi.init();
  const { width, height } = canvasSizeApi.size.value;
  sceneApi.setSize(width, height);
  cameraApi.updateAspect(width, height);

  modelApi.init();

  renderLoop.start();
});

onUnmounted(() => {
  renderLoop.stop();
  canvasSizeApi.dispose();
  modelApi.dispose();
  cameraApi.dispose();
  sceneApi.dispose();
});

// ---------- Push measured size to the renderer/camera ----------
watch(canvasSizeApi.size, ({ width, height }) => {
  sceneApi.setSize(width, height);
  cameraApi.updateAspect(width, height);
});

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
  await modelApi.loadAnimation(buf, weights ?? null);
}

/**
 * Captures the current frame as a data URL.
 * Forces a render before reading the drawing buffer so the result is always
 * up-to-date even when `requestAnimationFrame` has not fired yet.
 * @param format - MIME type of the output image (default: `'image/png'`).
 * @returns A data URL string of the captured frame.
 */
async function captureScreenshot(format = 'image/png'): Promise<string> {
  if (!((sceneApi.renderer.value && sceneApi.scene.value) && cameraApi.camera.value)) {
    throw new Error('[VrmCanvas] Renderer is not initialized.');
  }
  // Force a render so the drawing buffer is fresh.
  await sceneApi.render(0, cameraApi.camera.value);
  return sceneApi.renderer.value.domElement.toDataURL(format);
}

defineExpose({
  playAnimation,
  pauseAnimation: modelApi.pauseAnimation,
  resumeAnimation: modelApi.resumeAnimation,
  stopAnimation: modelApi.stopAnimation,
  resetCamera: cameraApi.resetCamera,
  captureScreenshot,
  /** Returns the Three.js `Scene` instance, or `null` before mount. */
  getScene: (): THREE.Scene | null => sceneApi.scene.value,
  /** Returns the `PerspectiveCamera` instance, or `null` before mount. */
  getCamera: (): THREE.PerspectiveCamera | null => cameraApi.camera.value,
  /** Returns the `WebGPURenderer` instance, or `null` before mount. */
  getRenderer: (): THREE.WebGPURenderer | null => sceneApi.renderer.value,
  /** Returns the `AnimationMixer` instance, or `null` when no animation is active. */
  getMixer: (): THREE.AnimationMixer | null => modelApi.mixer.value,
  /** Returns the currently loaded `VRM` instance, or `null` when no model is loaded. */
  getVrm: (): VRM | null => modelApi.vrm.value,
  /** Returns the internal `<canvas>` element, or `null` before mount. */
  getCanvas: (): HTMLCanvasElement | null => canvasRef.value,
  /** Resets camera position and orientation. */
  resetCameraPose: (): void => cameraApi.resetCamera()
});
</script>

<template>
  <figure ref="containerRef" style="position: relative; margin: 0; overflow: hidden"
    :style="canvasSizeApi.containerStyle.value">
    <canvas ref="canvasRef" style="display: block; width: 100%; height: 100%" @keydown="cameraApi.handleCanvasKeydown"
      @pointerdown="handleCanvasPointerDown" />
  </figure>
</template>
