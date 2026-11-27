import type { VrmExpressionNames, VrmExpressions } from '@/types/VrmExpressionTypes';
import type { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Apply expression weights to the loaded VRM once per frame.
 *
 * Two sources are merged every frame, right before `vrm.update()`:
 * - the `expressions` prop (declarative; wins on conflicting keys), and
 * - values set with `setExpression()` (imperative; stored in a plain `Map`
 *   without Vue reactivity, so per-frame callers such as lip sync add no
 *   scheduling latency — the value is visible in the very next rendered frame).
 *
 * Expressions that are not mentioned by either source are left untouched (so
 * VRMA animations and the model's own settings keep control of them). A name
 * that stops being mentioned is reset to `0` once.
 *
 * @param getExpressions Returns the current `expressions` prop.
 */
export function useVrmExpressions(getExpressions: () => VrmExpressions | undefined): {
  apply: (vrm: VRM) => void;
  onModelChanged: () => void;
  getExpressionNames: (vrm?: VRM) => VrmExpressionNames;
  setExpression: (name: string, weight: number) => void;
  resetExpressions: () => void;
} {
  const manual: Map<string, number> = new Map();
  /** Names written in the previous frame, so they can be reset when dropped. */
  let applied: Set<string> = new Set();
  /** Unknown names already reported, to warn only once per model. */
  const warned: Set<string> = new Set();

  function apply(vrm: VRM): void {
    const manager = vrm.expressionManager;
    if (!manager) return;

    const targets = new Map(manual);
    const expressions = getExpressions();
    if (expressions) {
      for (const [name, weight] of Object.entries(expressions)) {
        if (Number.isFinite(weight)) targets.set(name, clamp01(weight));
      }
    }

    const next: Set<string> = new Set();
    for (const [name, weight] of targets) {
      if (!manager.getExpression(name)) {
        if (!warned.has(name)) {
          warned.add(name);
          console.warn(`[VrmCanvas] The model has no expression named "${name}".`);
        }
        continue;
      }
      manager.setValue(name, weight);
      next.add(name);
    }
    for (const name of applied) {
      if (!next.has(name)) manager.setValue(name, 0);
    }
    applied = next;
  }

  /** Forget per-model state. Manual values are kept and applied to the new model. */
  function onModelChanged(): void {
    applied = new Set();
    warned.clear();
  }

  function getExpressionNames(vrm?: VRM): VrmExpressionNames {
    const manager = vrm?.expressionManager;
    if (!manager) return { preset: [], custom: [] };
    return {
      preset: Object.keys(manager.presetExpressionMap) as VRMExpressionPresetName[],
      custom: Object.keys(manager.customExpressionMap)
    };
  }

  function setExpression(name: string, weight: number): void {
    if (!Number.isFinite(weight)) return;
    manual.set(name, clamp01(weight));
  }

  function resetExpressions(): void {
    manual.clear();
  }

  return { apply, onModelChanged, getExpressionNames, setExpression, resetExpressions };
}
