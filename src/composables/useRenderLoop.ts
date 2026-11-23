import { Timer, type WebGPURenderer } from 'three/webgpu';

/**
 * Drive the renderer's animation loop and report the elapsed time between
 * frames in seconds. Uses `renderer.setAnimationLoop()` so the loop also works
 * with WebXR and pauses correctly with the renderer.
 *
 * @param getRenderer Returns the renderer whose animation loop should be driven.
 * @param callback Invoked once per frame with the delta time in seconds.
 */
export function useRenderLoop(
  getRenderer: () => WebGPURenderer | undefined,
  callback: (deltaSeconds: number) => void
): {
  start: () => void;
  stop: () => void;
} {
  const timer = new Timer();

  function start(): void {
    const renderer = getRenderer();
    if (!renderer) return;
    timer.reset();
    void renderer.setAnimationLoop(timestamp => {
      timer.update(timestamp);
      callback(timer.getDelta());
    });
  }

  function stop(): void {
    // eslint-disable-next-line unicorn/no-null -- three.js uses `null` to clear the loop.
    void getRenderer()?.setAnimationLoop(null);
    timer.dispose();
  }

  return { start, stop };
}
