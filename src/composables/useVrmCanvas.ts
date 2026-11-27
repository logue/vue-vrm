import {
  type ComputedRef,
  type EmitFn,
  type ExtractPropTypes,
  onMounted,
  onUnmounted,
  type PropType,
  type Ref,
  ref,
  watch
} from 'vue';

import type { CameraChangePayload } from '@/types/VrmCameraTypes';
import type { VrmCanvasExposed } from '@/types/VrmCanvasExposed';
import type {
  CameraInteractionOptions,
  CameraOptions,
  DirectionalLightOptions,
  LightOptions,
  Vec3
} from '@/types/VrmCanvasOptions';
import type { VrmAutoBlinkOptions, VrmExpressions } from '@/types/VrmExpressionTypes';
import type { AnimationData } from '@/types/VrmModelTypes';
import type { VrmRenderFunction, VrmRenderTargets, VrmResizePayload } from '@/types/VrmRenderTypes';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import type { Vector3 } from 'three';
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { useCanvasSize } from '@/composables/useCanvasSize';
import { useRenderLoop } from '@/composables/useRenderLoop';
import { useVrmCamera } from '@/composables/useVrmCamera';
import { useVrmExpressions } from '@/composables/useVrmExpressions';
import { useVrmModel } from '@/composables/useVrmModel';
import { useVrmScene } from '@/composables/useVrmScene';

/** `VrmCanvas` props definition (shared by the Vue component and the Web Component). */
export const vrmCanvasProps = {
  /** The VRM model data as an ArrayBuffer. */
  modelData: { type: ArrayBuffer as PropType<ArrayBuffer> },
  /** The VRM animation data as an ArrayBuffer or an array of ArrayBuffers. */
  animationData: { type: [ArrayBuffer, Array] as PropType<AnimationData> },
  /** The weights for each animation. */
  animationWeights: { type: Array as PropType<number[]> },
  /** Whether the animation should loop. */
  loop: { type: Boolean, default: true },
  /**
   * Expression weights (0–1) keyed by preset or custom expression name, e.g. `{ happy: 1 }`.
   * Applied every frame after the animation; expressions not listed are left untouched.
   */
  expressions: { type: Object as PropType<VrmExpressions> },
  /**
   * Blink automatically at random intervals. `true` uses the defaults; pass an object to tune them.
   * Ignored while `blink` is set through `expressions` or `setExpression()`.
   */
  autoBlink: {
    type: [Boolean, Object] as PropType<boolean | VrmAutoBlinkOptions>,
    default: false
  },
  /** Whether the background should be transparent. */
  bgTransparent: { type: Boolean, default: false },
  /** The background image URL. */
  bgImage: { type: String },
  /** Whether to show the grid helper. */
  showGrid: { type: Boolean, default: false },
  /** The width of the canvas in pixels. */
  width: { type: Number, default: 480 },
  /** The maximum width of the canvas in pixels. */
  maxWidth: { type: Number },
  /** The aspect ratio (width / height) to maintain. Height is derived from width and this ratio. */
  aspectRatio: { type: Number, default: 3 / 4 },
  /** Options for configuring the camera. */
  cameraOptions: {
    type: Object as PropType<CameraOptions>,
    default: (): CameraOptions => ({ fov: 30, near: 0.1, far: 100 })
  },
  /** The distance of the camera from the target. Defaults to a distance that fits the model. */
  cameraDistance: { type: Number },
  /** The Euler angles (X, Y, Z) for the camera rotation around the target. */
  cameraEuler: { type: Array as unknown as PropType<Vec3>, default: (): Vec3 => [0, 0, 0] },
  /** The offset of the camera from the target. */
  cameraOffset: { type: Array as unknown as PropType<Vec3>, default: (): Vec3 => [0, 0, 0] },
  /** The point the camera is looking at. */
  cameraLookAt: { type: Array as unknown as PropType<Vec3>, default: (): Vec3 => [0, 0.9, 0] },
  /** Options for the ambient light (color and intensity). */
  ambientLight: {
    type: Object as PropType<LightOptions>,
    default: (): LightOptions => ({ color: '#ffffff', intensity: 0.5 })
  },
  /** Options for the directional light (color, intensity, and position). */
  directionalLight: {
    type: Object as PropType<DirectionalLightOptions>,
    default: (): DirectionalLightOptions => ({
      color: '#ffffff',
      intensity: 1,
      position: [1, 1, 1]
    })
  },
  /** An optional postprocessing shader pass to apply. */
  shaderPass: { type: Object as PropType<ShaderPass> },
  /** Optional camera interaction controls. */
  cameraInteraction: { type: Object as PropType<CameraInteractionOptions> },
  /**
   * Custom per-frame render function. When set, it is called instead of the default
   * `renderer.render(scene, camera)` (and instead of the built-in `shaderPass` composer),
   * after the mixer and `vrm.update()` have run for the frame.
   */
  render: { type: Function as PropType<VrmRenderFunction> }
} as const;

/** Resolved prop types for {@link vrmCanvasProps}. */
export type VrmCanvasProps = ExtractPropTypes<typeof vrmCanvasProps>;

/** `VrmCanvas` emits definition. */
export const vrmCanvasEmits = {
  /** Emitted when the model starts loading. */
  'model:loading': () => true,
  /** Emitted when the model has successfully loaded. */
  'model:loaded': (_vrm: VRM) => true,
  /** Emitted when the model is unloaded. */
  'model:unloaded': () => true,
  /** Emitted when there is an error loading the model. */
  'model:error': (_error: Error) => true,
  /** Emitted when the animation starts loading. */
  'animation:loading': () => true,
  /** Emitted when the animation has successfully loaded. */
  'animation:loaded': (_animation: VRMAnimation | VRMAnimation[]) => true,
  /** Emitted when the animation starts playing. */
  'animation:start': () => true,
  /** Emitted when the animation is paused. */
  'animation:pause': () => true,
  /** Emitted when the animation is resumed. */
  'animation:resume': () => true,
  /** Emitted when the animation is stopped. */
  'animation:stop': () => true,
  /** Emitted when a non-looping animation ends. */
  'animation:end': () => true,
  /** Emitted when there is an error loading the animation. */
  'animation:error': (_error: Error) => true,
  /** Emitted when the camera position or target changes. */
  'camera:change': (_payload: CameraChangePayload) => true,
  /**
   * Emitted when the camera options change (fov, near, far).
   * Changes to cameraDistance, cameraEuler, cameraOffset, or cameraLookAt
   * only trigger 'camera:change'.
   */
  'camera:options-change': (_payload: Required<CameraOptions>) => true,
  /** Emitted when the ambient light changes. */
  'light:ambient-change': (_payload: LightOptions) => true,
  /** Emitted when the directional light changes. */
  'light:directional-change': (_payload: LightOptions & { position: Vector3 }) => true,
  /**
   * Emitted once the renderer, scene, and camera exist (on mount), before the first frame.
   * Create custom postprocessing (e.g. an `EffectComposer`) here.
   */
  'renderer:ready': (_targets: VrmRenderTargets) => true,
  /**
   * Emitted on unmount, before the renderer is disposed.
   * Dispose custom postprocessing here.
   */
  'renderer:dispose': () => true,
  /** Emitted after the renderer and camera have been resized (also once on mount). */
  resize: (_payload: VrmResizePayload) => true,
  /** Emitted on other errors (e.g. background image failed to load). */
  error: (_error: Error) => true
};

/** Typed `emit` function matching {@link vrmCanvasEmits}. */
export type VrmCanvasEmit = EmitFn<typeof vrmCanvasEmits>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Sets up a VRM viewer bound to `props` and reports state changes through `emit`.
 *
 * Wires the scene, camera, model, sizing, and render-loop composables together and
 * handles the mount / unmount lifecycle, so the `VrmCanvas` component and the Web
 * Component only need to render the markup.
 *
 * @param props - Resolved `VrmCanvas` props.
 * @param emit - Typed emit function.
 */
export function useVrmCanvas(
  props: VrmCanvasProps,
  emit: VrmCanvasEmit
): {
  /** `<figure>` wrapper element (template ref). */
  container: Ref<HTMLElement | undefined>;
  /** `<canvas>` element (template ref). */
  canvas: Ref<HTMLCanvasElement | undefined>;
  /** Inline size style for the container. */
  containerStyle: ComputedRef<Record<string, string>>;
  /** Keyboard handler for the canvas (camera roll). */
  handleCanvasKeydown: (event: KeyboardEvent) => void;
  /** Public API to expose from the component instance. */
  exposed: VrmCanvasExposed;
} {
  const container = ref<HTMLElement>();
  const canvas = ref<HTMLCanvasElement>();

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
      onError: error => {
        emit('error', toError(error));
      },
      onAmbientLightChange: payload => {
        emit('light:ambient-change', payload);
      },
      onDirectionalLightChange: payload => {
        emit('light:directional-change', payload);
      }
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
      onCameraChange: payload => {
        emit('camera:change', payload);
      },
      onCameraOptionsChange: payload => {
        sceneApi.rebuildComposer();
        emit('camera:options-change', payload);
      }
    }
  );

  const expressionsApi = useVrmExpressions(
    () => props.expressions,
    () => props.autoBlink
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
      onModelLoading: () => {
        emit('model:loading');
      },
      onModelLoaded: vrm => {
        expressionsApi.onModelChanged();
        emit('model:loaded', vrm);
      },
      onModelUnloaded: () => {
        expressionsApi.onModelChanged();
        emit('model:unloaded');
      },
      onModelError: error => {
        emit('model:error', toError(error));
      },
      onAnimationLoading: () => {
        emit('animation:loading');
      },
      onAnimationLoaded: animation => {
        emit('animation:loaded', animation);
      },
      onAnimationStart: () => {
        emit('animation:start');
      },
      onAnimationEnd: () => {
        emit('animation:end');
      },
      onAnimationError: error => {
        emit('animation:error', toError(error));
      },
      onAnimationPause: () => {
        emit('animation:pause');
      },
      onAnimationResume: () => {
        emit('animation:resume');
      },
      onAnimationStop: () => {
        emit('animation:stop');
      },
      afterModelLoaded: () => {
        cameraApi.resetCamera();
      }
    }
  );

  const canvasSizeApi = useCanvasSize(container, {
    width: () => props.width,
    maxWidth: () => props.maxWidth,
    aspectRatio: () => props.aspectRatio
  });

  const renderLoop = useRenderLoop(
    () => sceneApi.renderer.value,
    (deltaSeconds, elapsedSeconds) => {
      modelApi.update(deltaSeconds, expressionsApi.apply);
      cameraApi.update();
      renderFrame(deltaSeconds, elapsedSeconds);
    }
  );

  /** Seconds since the loop started, as of the last frame (used for screenshots). */
  let lastElapsed = 0;

  function getTargets(): VrmRenderTargets | undefined {
    const renderer = sceneApi.renderer.value;
    const scene = sceneApi.scene.value;
    const camera = cameraApi.camera.value;
    return renderer && scene && camera ? { renderer, scene, camera } : undefined;
  }

  /** Draw one frame, using the `render` prop when provided (read every frame). */
  function renderFrame(delta: number, elapsed: number): void {
    lastElapsed = elapsed;
    const customRender = props.render;
    if (!customRender) {
      sceneApi.render(delta, cameraApi.camera.value);
      return;
    }
    const targets = getTargets();
    if (targets) customRender({ ...targets, delta, elapsed });
  }

  function applySize(): void {
    const { width, height } = canvasSizeApi.size.value;
    sceneApi.setSize(width, height);
    cameraApi.updateAspect(width, height);
    const renderer = sceneApi.renderer.value;
    if (renderer) emit('resize', { width, height, pixelRatio: renderer.getPixelRatio() });
  }

  // ---------- Lifecycle ----------
  onMounted(async () => {
    try {
      sceneApi.init();
    } catch (error) {
      // e.g. WebGL is unavailable.
      emit('error', toError(error));
      return;
    }
    // The camera must exist before the composer's RenderPass is built.
    cameraApi.init();
    sceneApi.rebuildComposer();
    const targets = getTargets();
    if (targets) emit('renderer:ready', targets);
    canvasSizeApi.init();
    applySize();
    renderLoop.start();
    await modelApi.init();
  });

  onUnmounted(() => {
    renderLoop.stop();
    if (sceneApi.renderer.value) emit('renderer:dispose');
    canvasSizeApi.dispose();
    modelApi.dispose();
    cameraApi.dispose();
    sceneApi.dispose();
  });

  watch(canvasSizeApi.size, applySize);

  // ---------- Exposed API ----------
  function captureScreenshot(format = 'image/png'): string {
    const renderer = sceneApi.renderer.value;
    if (!(renderer && sceneApi.scene.value && cameraApi.camera.value)) {
      throw new Error('[VrmCanvas] Renderer is not initialized.');
    }
    // Render right before reading so the drawing buffer is up to date.
    renderFrame(0, lastElapsed);
    return renderer.domElement.toDataURL(format);
  }

  const exposed: VrmCanvasExposed = {
    playAnimation: (data, weights) => modelApi.loadAnimation(data, weights),
    pauseAnimation: modelApi.pauseAnimation,
    resumeAnimation: modelApi.resumeAnimation,
    stopAnimation: modelApi.stopAnimation,
    resetCamera: cameraApi.resetCamera,
    captureScreenshot,
    getScene: () => sceneApi.scene.value,
    getCamera: () => cameraApi.camera.value,
    getRenderer: () => sceneApi.renderer.value,
    getMixer: () => modelApi.mixer.value,
    getVrm: () => modelApi.vrm.value,
    getCanvas: () => canvas.value,
    getExpressionNames: () => expressionsApi.getExpressionNames(modelApi.vrm.value),
    setExpression: expressionsApi.setExpression,
    resetExpressions: expressionsApi.resetExpressions,
    resetCameraPose: cameraApi.resetCamera
  };

  return {
    container,
    canvas,
    containerStyle: canvasSizeApi.containerStyle,
    handleCanvasKeydown: cameraApi.handleCanvasKeydown,
    exposed
  };
}
