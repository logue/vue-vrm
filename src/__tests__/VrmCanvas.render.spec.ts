/* eslint-disable @typescript-eslint/unbound-method -- `rs.fn()` mocks are asserted, not called. */
import { beforeEach, describe, expect, it, rs } from 'rstack/test';

import { render as mount } from '@testing-library/vue';
import * as actualThree from 'three' with { rstest: 'importActual' };
import { defineComponent, h, nextTick, ref } from 'vue';

import type { VrmCanvasExposed, VrmRenderContext, VrmResizePayload } from '@/index';

import VrmCanvas from '@/components/VrmCanvas';
import * as actualModel from '@/composables/useVrmModel' with { rstest: 'importActual' };

/**
 * Tests for the render-loop hooks (`render` prop, `resize` / `renderer:*` events).
 *
 * happy-dom has no WebGL, so `WebGLRenderer` is replaced with a fake that records
 * calls and lets the test drive the animation loop frame by frame.
 */

const { FakeRenderer, modelState } = rs.hoisted(() => {
  type Loop = (timestamp: number) => void;

  class FakeRenderer {
    static last: FakeRenderer | undefined;
    loop: Loop | undefined;
    pixelRatio = 1;
    domElement: HTMLCanvasElement;
    outputColorSpace = '';
    render = rs.fn();
    setSize = rs.fn();
    setClearColor = rs.fn();
    dispose = rs.fn();

    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      this.domElement = canvas;
      FakeRenderer.last = this;
    }

    setPixelRatio(value: number): void {
      this.pixelRatio = value;
    }

    getPixelRatio(): number {
      return this.pixelRatio;
    }

    setAnimationLoop(callback: Loop | null): void {
      this.loop = callback ?? undefined;
    }

    /** Run one frame of the animation loop at the given timestamp (ms). */
    frame(timestamp: number): void {
      this.loop?.(timestamp);
    }
  }

  /** Captures the model composable's API so tests can inject a fake mixer / VRM. */
  const modelState: { api?: { mixer: { value: unknown }; vrm: { value: unknown } } } = {};

  return { FakeRenderer, modelState };
});

rs.mock('three', () => ({ ...actualThree, WebGLRenderer: FakeRenderer }));

rs.mock('@/composables/useVrmModel', () => ({
  ...actualModel,
  useVrmModel: (...parameters: Parameters<typeof actualModel.useVrmModel>) => {
    const api = actualModel.useVrmModel(...parameters);
    modelState.api = api as never;
    return api;
  }
}));

type Targets = { renderer: unknown; scene: unknown; camera: unknown };

/** Mount `VrmCanvas` and wait for `onMounted` to finish. */
async function setup(props: Record<string, unknown> = {}) {
  const result = mount(VrmCanvas, { props });
  await nextTick();
  await Promise.resolve();
  const renderer = FakeRenderer.last;
  if (!renderer) throw new Error('renderer was not created');
  const ready = result.emitted<[Targets]>()['renderer:ready'] as [Targets][] | undefined;
  const targets = ready?.at(0)?.[0];
  if (!targets) throw new Error('renderer:ready was not emitted');
  // Animation-frame timestamps share the `performance.now()` clock.
  const start = performance.now();
  return {
    ...result,
    renderer,
    targets,
    frame: (ms: number) => {
      renderer.frame(start + ms);
    }
  };
}

describe('VrmCanvas render loop hooks', () => {
  beforeEach(() => {
    FakeRenderer.last = undefined;
    modelState.api = undefined;
  });

  it('should call the default renderer.render when no render prop is given', async () => {
    const { renderer, targets, frame } = await setup();
    frame(0);
    frame(16);

    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(renderer.render).toHaveBeenCalledWith(targets.scene, targets.camera);
  });

  it('should call the render prop every frame instead of the default render', async () => {
    const render = rs.fn<(context: VrmRenderContext) => void>();
    const { renderer, targets, frame } = await setup({ render });

    frame(1000);
    frame(1500);
    frame(2000);

    expect(renderer.render).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(3);
    const contexts = render.mock.calls.map(([context]) => context);
    const previous = contexts.at(1);
    const last = contexts.at(2);
    if (!(previous && last)) throw new Error('render was not called');
    expect(last.renderer).toBe(renderer);
    expect(last.scene).toBe(targets.scene);
    expect(last.camera).toBe(targets.camera);
    expect(last.delta).toBeCloseTo(0.5);
    expect(last.elapsed - previous.elapsed).toBeCloseTo(0.5);
    expect(last.elapsed).toBeGreaterThanOrEqual(2);
  });

  it('should update the mixer and VRM before calling the render prop', async () => {
    const order: string[] = [];
    const render = rs.fn((context: VrmRenderContext) => {
      order.push(`render:${String(context.delta)}`);
    });
    const { frame } = await setup({ render });

    const model = modelState.api;
    if (!model) throw new Error('model API was not captured');
    model.mixer.value = { update: (d: number) => order.push(`mixer:${String(d)}`) };
    model.vrm.value = { update: (d: number) => order.push(`vrm:${String(d)}`) };

    frame(0);
    frame(250);

    expect(order.map(entry => entry.split(':')[0])).toEqual([
      'mixer',
      'vrm',
      'render',
      'mixer',
      'vrm',
      'render'
    ]);
    // All three receive the same delta within a frame.
    const deltas = order.slice(3).map(entry => Number(entry.split(':')[1]));
    expect(deltas[0]).toBeCloseTo(0.25);
    expect(new Set(deltas).size).toBe(1);
    // Keep dispose() from tearing down the fakes.
    model.mixer.value = undefined;
    model.vrm.value = undefined;
  });

  it('should use a new render prop from the next frame', async () => {
    const first = rs.fn();
    const second = rs.fn();
    const { rerender, frame } = await setup({ render: first });
    frame(0);
    await rerender({ render: second });
    frame(16);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('should use the render prop for captureScreenshot', async () => {
    const render = rs.fn();
    const instance = ref<VrmCanvasExposed>();
    mount(
      defineComponent({
        setup: () => () => h(VrmCanvas, { ref: instance, render })
      })
    );
    await nextTick();
    await Promise.resolve();
    const renderer = FakeRenderer.last;
    if (!(renderer && instance.value)) throw new Error('not mounted');
    instance.value.captureScreenshot();

    expect(render).toHaveBeenCalledWith(expect.objectContaining({ delta: 0 }));
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('should emit resize with size and pixel ratio after resizing the renderer', async () => {
    const { renderer, emitted } = await setup({ width: 400, aspectRatio: 2 });
    const events = emitted<[VrmResizePayload]>().resize as [VrmResizePayload][] | undefined;

    expect(renderer.setSize).toHaveBeenCalledWith(400, 200, false);
    expect(events?.at(-1)?.[0]).toEqual({
      width: 400,
      height: 200,
      pixelRatio: renderer.pixelRatio
    });
  });

  it('should emit resize again when the size changes', async () => {
    const { emitted, rerender } = await setup({ width: 400, aspectRatio: 2 });
    await rerender({ width: 300, aspectRatio: 2 });

    const events = emitted<[VrmResizePayload]>().resize as [VrmResizePayload][] | undefined;
    expect(events?.at(-1)?.[0]).toMatchObject({
      width: 300,
      height: 150
    });
  });

  it('should emit renderer:ready on mount and renderer:dispose on unmount', async () => {
    const onDispose = rs.fn(() => {
      // Fired before the renderer is torn down, so custom passes can still use it.
      expect(disposeSpy).not.toHaveBeenCalled();
    });
    const { renderer, emitted, unmount } = await setup({ 'onRenderer:dispose': onDispose });
    const disposeSpy = renderer.dispose;
    const ready = emitted<[Targets]>()['renderer:ready'] as [Targets][] | undefined;
    expect(ready).toHaveLength(1);
    expect(ready?.[0][0].renderer).toBe(renderer);
    expect(ready?.[0][0].scene).toMatchObject({ isScene: true });
    expect(ready?.[0][0].camera).toMatchObject({ isPerspectiveCamera: true });
    expect(onDispose).not.toHaveBeenCalled();

    unmount();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(disposeSpy).toHaveBeenCalled();
  });
});
