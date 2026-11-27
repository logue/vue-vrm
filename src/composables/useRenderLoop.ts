import { Timer, type WebGLRenderer } from 'three';

/**
 * Drive the renderer's animation loop and report the elapsed time between
 * frames in seconds. Uses `renderer.setAnimationLoop()` so the loop also works
 * with WebXR and pauses correctly with the renderer.
 *
 * @param getRenderer Returns the renderer whose animation loop should be driven.
 * @param callback Invoked once per frame with the delta and elapsed time in seconds.
 */
export function useRenderLoop(
  getRenderer: () => WebGLRenderer | undefined,
  callback: (deltaSeconds: number, elapsedSeconds: number) => void
): {
  start: () => void;
  stop: () => void;
} {
  const timer = new Timer();

  function start(): void {
    const renderer = getRenderer();
    if (!renderer) return;
    timer.reset();
    renderer.setAnimationLoop(timestamp => {
      timer.update(timestamp);
      callback(timer.getDelta(), timer.getElapsed());
    });
  }

  function stop(): void {
    // eslint-disable-next-line unicorn/no-null -- three.js uses `null` to clear the loop.
    getRenderer()?.setAnimationLoop(null);
    timer.dispose();
  }

  return { start, stop };
}
