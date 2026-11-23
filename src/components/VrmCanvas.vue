<script setup lang="ts">
  import type { VRM } from '@pixiv/three-vrm';
  import type { VRMAnimation } from '@pixiv/three-vrm-animation';
  import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import type {
    AnimationMixer,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGPURenderer
  } from 'three/webgpu';
  import { onMounted, onUnmounted, ref, watch } from 'vue';

  import { useCanvasSize } from '@/composables/useCanvasSize';
  import { useRenderLoop } from '@/composables/useRenderLoop';
  import { useVrmCamera } from '@/composables/useVrmCamera';
  import { useVrmModel } from '@/composables/useVrmModel';
  import { useVrmScene } from '@/composables/useVrmScene';
  import type { CameraChangePayload } from '@/types/VrmCameraTypes';
  import type {
    CameraInteractionOptions,
    CameraOptions,
    DirectionalLightOptions,
    LightOptions,
    Vec3
  } from '@/types/VrmCanvasOptions';
  import type { AnimationData } from '@/types/VrmModelTypes';

  /**
   * Props for VrmCanvas component.
   */
  type Props = {
    /** The VRM model data as an ArrayBuffer. */
    modelData?: ArrayBuffer;
    /** The VRM animation data as an ArrayBuffer or an array of ArrayBuffers. */
    animationData?: AnimationData;
    /** The weights for each animation. */
    animationWeights?: number[];
    /** Whether the animation should loop. */
    loop?: boolean;
    /** Whether the background should be transparent. */
    bgTransparent?: boolean;
    /** The background image URL. */
    bgImage?: string;
    /** Whether to show the grid helper. */
    showGrid?: boolean;
    /** The width of the canvas in pixels. */
    width?: number;
    /** The maximum width of the canvas in pixels. */
    maxWidth?: number;
    /** The aspect ratio (width / height) to maintain. Height is derived from width and this ratio. */
    aspectRatio?: number;
    /** Options for configuring the camera. */
    cameraOptions?: CameraOptions;
    /** The distance of the camera from the target. Defaults to a distance that fits the model. */
    cameraDistance?: number;
    /** The Euler angles (X, Y, Z) for the camera rotation around the target. */
    cameraEuler?: Vec3;
    /** The offset of the camera from the target. */
    cameraOffset?: Vec3;
    /** The point the camera is looking at. */
    cameraLookAt?: Vec3;
    /** Options for the ambient light (color and intensity). */
    ambientLight?: LightOptions;
    /** Options for the directional light (color, intensity, and position). */
    directionalLight?: DirectionalLightOptions;
    /** An optional postprocessing shader pass to apply. */
    shaderPass?: ShaderPass;
    /** Optional camera interaction controls. */
    cameraInteraction?: CameraInteractionOptions;
  };

  const props = withDefaults(defineProps<Props>(), {
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
    directionalLight: () => ({ color: '#ffffff', intensity: 1, position: [1, 1, 1] })
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
    /** Emitted when a non-looping animation ends. */
    'animation:end': [];
    /** Emitted when there is an error loading the animation. */
    'animation:error': [error: Error];
    /** Emitted when the camera position or target changes. */
    'camera:change': [payload: CameraChangePayload];
    /**
     * Emitted when the camera options change (fov, near, far).
     * Changes to cameraDistance, cameraEuler, cameraOffset, or cameraLookAt
     * only trigger 'camera:change'.
     */
    'camera:options-change': [payload: Required<CameraOptions>];
    /** Emitted when the ambient light changes. */
    'light:ambient-change': [payload: LightOptions];
    /** Emitted when the directional light changes. */
    'light:directional-change': [payload: LightOptions & { position: Vector3 }];
    /** Emitted on other errors (e.g. background image failed to load). */
    error: [error: Error];
  }>();

  function toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  // ---------- Template refs ----------
  const container = ref<HTMLElement>();
  const canvas = ref<HTMLCanvasElement>();

  // ---------- Composables ----------
  const sceneApi = useVrmScene(
    canvas,
    {
      bgTransparent: () => props.bgTransparent,
      bgImage: () => props.bgImage,
      showGrid: () => props.showGrid,
      ambientLight: () => props.ambientLight,
      directionalLight: () => props.directionalLight,
      shaderPass: () => props.shaderPass
    },
    { getCamera: () => cameraApi.camera.value },
    {
      onError: error => emit('error', toError(error)),
      onAmbientLightChange: payload => emit('light:ambient-change', payload),
      onDirectionalLightChange: payload => emit('light:directional-change', payload)
    }
  );

  const cameraApi = useVrmCamera(
    canvas,
    {
      cameraOptions: () => props.cameraOptions,
      cameraDistance: () => props.cameraDistance,
      cameraEuler: () => props.cameraEuler,
      cameraOffset: () => props.cameraOffset,
      cameraLookAt: () => props.cameraLookAt,
      cameraInteraction: () => props.cameraInteraction
    },
    {
      getRenderer: () => sceneApi.renderer.value,
      getFitTarget: () => modelApi.vrm.value?.scene
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
      modelData: () => props.modelData,
      animationData: () => props.animationData,
      animationWeights: () => props.animationWeights,
      loop: () => props.loop
    },
    { getScene: () => sceneApi.scene.value },
    {
      onModelLoading: () => emit('model:loading'),
      onModelLoaded: vrm => emit('model:loaded', vrm),
      onModelUnloaded: () => emit('model:unloaded'),
      onModelError: error => emit('model:error', toError(error)),
      onAnimationLoading: () => emit('animation:loading'),
      onAnimationLoaded: animation => emit('animation:loaded', animation),
      onAnimationStart: () => emit('animation:start'),
      onAnimationEnd: () => emit('animation:end'),
      onAnimationError: error => emit('animation:error', toError(error)),
      onAnimationPause: () => emit('animation:pause'),
      onAnimationResume: () => emit('animation:resume'),
      onAnimationStop: () => emit('animation:stop'),
      afterModelLoaded: () => cameraApi.resetCamera()
    }
  );

  const canvasSizeApi = useCanvasSize(container, {
    width: () => props.width,
    maxWidth: () => props.maxWidth,
    aspectRatio: () => props.aspectRatio
  });

  const renderLoop = useRenderLoop(
    () => sceneApi.renderer.value,
    deltaSeconds => {
      modelApi.update(deltaSeconds);
      cameraApi.update();
      sceneApi.render(deltaSeconds, cameraApi.camera.value);
    }
  );

  function applySize(): void {
    const { width, height } = canvasSizeApi.size.value;
    sceneApi.setSize(width, height);
    cameraApi.updateAspect(width, height);
  }

  // ---------- Lifecycle ----------
  let unmounted = false;

  onMounted(async () => {
    try {
      // WebGPURenderer requires an async init before the first render.
      await sceneApi.init();
    } catch (error) {
      emit('error', toError(error));
      return;
    }
    if (unmounted) {
      sceneApi.dispose();
      return;
    }
    // The camera must exist before the composer's RenderPass is built.
    cameraApi.init();
    sceneApi.rebuildComposer();
    canvasSizeApi.init();
    applySize();
    renderLoop.start();
    await modelApi.init();
  });

  onUnmounted(() => {
    unmounted = true;
    renderLoop.stop();
    canvasSizeApi.dispose();
    modelApi.dispose();
    cameraApi.dispose();
    sceneApi.dispose();
  });

  watch(canvasSizeApi.size, applySize);

  // ---------- Exposed API ----------

  /**
   * Load and play a VRMA animation, replacing any active animation.
   * When an array is provided, all clips are blended simultaneously using the
   * supplied `weights` (or equal weights when omitted / length-mismatched).
   * @param data - A single VRMA `ArrayBuffer` or an array of them.
   * @param weights - Optional per-clip blend weights. Must sum to ≤ 1.0.
   */
  async function playAnimation(data: AnimationData, weights?: number[]): Promise<void> {
    await modelApi.loadAnimation(data, weights);
  }

  /**
   * Capture the current frame as a data URL.
   * Forces a render before reading the drawing buffer so the result is up to date.
   * @param format - MIME type of the output image (default: `'image/png'`).
   * @returns A data URL string of the captured frame.
   */
  function captureScreenshot(format = 'image/png'): string {
    const renderer = sceneApi.renderer.value;
    if (!(renderer && sceneApi.scene.value && cameraApi.camera.value)) {
      throw new Error('[VrmCanvas] Renderer is not initialized.');
    }
    sceneApi.render(0, cameraApi.camera.value);
    return renderer.domElement.toDataURL(format);
  }

  defineExpose({
    playAnimation,
    pauseAnimation: modelApi.pauseAnimation,
    resumeAnimation: modelApi.resumeAnimation,
    stopAnimation: modelApi.stopAnimation,
    /** Resets camera position and orientation to frame the model. */
    resetCamera: cameraApi.resetCamera,
    captureScreenshot,
    /** Returns the Three.js `Scene` instance, or `undefined` before mount. */
    getScene: (): Scene | undefined => sceneApi.scene.value,
    /** Returns the `PerspectiveCamera` instance, or `undefined` before mount. */
    getCamera: (): PerspectiveCamera | undefined => cameraApi.camera.value,
    /** Returns the `WebGPURenderer` instance, or `undefined` before mount. */
    getRenderer: (): WebGPURenderer | undefined => sceneApi.renderer.value,
    /** Returns the `AnimationMixer` instance, or `undefined` when no animation is active. */
    getMixer: (): AnimationMixer | undefined => modelApi.mixer.value,
    /** Returns the currently loaded `VRM` instance, or `undefined` when no model is loaded. */
    getVrm: (): VRM | undefined => modelApi.vrm.value,
    /** Returns the internal `<canvas>` element, or `undefined` before mount. */
    getCanvas: (): HTMLCanvasElement | undefined => canvas.value,
    /** @deprecated Use `resetCamera()`. */
    resetCameraPose: cameraApi.resetCamera
  });
</script>

<template>
  <figure
    ref="container"
    style="position: relative; margin: 0; overflow: hidden"
    :style="canvasSizeApi.containerStyle.value"
  >
    <canvas
      ref="canvas"
      style="display: block; width: 100%; height: 100%"
      @keydown="cameraApi.handleCanvasKeydown"
      @pointerdown="canvas?.focus()"
    />
  </figure>
</template>
