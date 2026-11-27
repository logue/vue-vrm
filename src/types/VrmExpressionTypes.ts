import type { VRMExpressionPresetName } from '@pixiv/three-vrm';

/**
 * Expression weights keyed by name (0–1).
 * Preset names are auto-completed; custom expression names defined in the VRM are accepted too.
 */
export type VrmExpressions = Partial<Record<VRMExpressionPresetName, number>> &
  Record<string, number>;

/** Expression names available on the loaded model. */
export type VrmExpressionNames = {
  /** Preset expressions the model defines (e.g. `happy`, `aa`, `blink`). */
  preset: VRMExpressionPresetName[];
  /** Custom expressions the model defines, in file order. */
  custom: string[];
};
