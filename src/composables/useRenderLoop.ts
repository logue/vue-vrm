import { Timer } from 'three';

/**
 * Drive a `requestAnimationFrame` loop and report the elapsed time between
 * frames in seconds. Carries no rendering or domain knowledge of its own.
 *
 * @param callback Invoked once per frame with the delta time in seconds.
 */
export function useRenderLoop(callback: (deltaSeconds: number) => void): {
  start: () => void;
  stop: () => void;
} {
  const clock = new Timer();
  let rafId = 0;

  function tick(timestamp: number): void {
    rafId = requestAnimationFrame(tick);
    clock.update(timestamp);
    callback(clock.getDelta());
  }

  function start(): void {
    tick(performance.now());
  }

  function stop(): void {
    cancelAnimationFrame(rafId);
    clock.dispose();
  }

  return { start, stop };
}
