import { beforeEach, describe, expect, it, rs } from 'rstack/test';

import type { VrmExpressions } from '@/types/VrmExpressionTypes';
import type { VRM } from '@pixiv/three-vrm';

import { useVrmExpressions } from '@/composables/useVrmExpressions';

/** Minimal stand-in for `VRMExpressionManager`. */
function createVrm(preset: string[], custom: string[] = []) {
  const values: Map<string, number> = new Map();
  const toMap = (names: string[]) => Object.fromEntries(names.map(name => [name, { name }]));
  const presetExpressionMap = toMap(preset);
  const customExpressionMap = toMap(custom);
  const setValue = rs.fn((name: string, weight: number) => {
    values.set(name, weight);
  });
  const vrm = {
    expressionManager: {
      presetExpressionMap,
      customExpressionMap,
      getExpression: (name: string) =>
        name in presetExpressionMap || name in customExpressionMap ? { name } : undefined,
      setValue
    }
  } as unknown as VRM;
  return { vrm, values, setValue };
}

describe('useVrmExpressions', () => {
  let expressions: VrmExpressions | undefined;
  const getExpressions = () => expressions;

  beforeEach(() => {
    expressions = undefined;
    rs.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  describe('expressions expressions', () => {
    it('should apply preset and custom weights', () => {
      const { vrm, values } = createVrm(['happy', 'aa'], ['wink']);
      expressions = { happy: 1, wink: 0.5 };
      useVrmExpressions(getExpressions).apply(vrm);

      expect(values.get('happy')).toBe(1);
      expect(values.get('wink')).toBe(0.5);
      expect(values.has('aa')).toBe(false);
    });

    it('should clamp weights to 0–1 and ignore non-finite values', () => {
      const { vrm, values } = createVrm(['happy', 'sad', 'angry']);
      expressions = { happy: 2, sad: -1, angry: NaN };
      useVrmExpressions(getExpressions).apply(vrm);

      expect(values.get('happy')).toBe(1);
      expect(values.get('sad')).toBe(0);
      expect(values.has('angry')).toBe(false);
    });

    it('should reset a key to 0 once when it is removed', () => {
      const { vrm, values, setValue } = createVrm(['happy', 'sad']);
      const api = useVrmExpressions(getExpressions);
      expressions = { happy: 1, sad: 1 };
      api.apply(vrm);
      expressions = { sad: 1 };
      api.apply(vrm);

      expect(values.get('happy')).toBe(0);
      setValue.mockClear();
      api.apply(vrm);
      expect(setValue).not.toHaveBeenCalledWith('happy', expect.anything());
    });

    it('should warn once about unknown names and skip them', () => {
      const { vrm, setValue } = createVrm(['happy']);
      const api = useVrmExpressions(getExpressions);
      expressions = { missing: 1 };
      api.apply(vrm);
      api.apply(vrm);

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(setValue).not.toHaveBeenCalled();
    });

    it('should do nothing when the model has no expression manager', () => {
      expressions = { happy: 1 };
      expect(() => {
        useVrmExpressions(getExpressions).apply({} as VRM);
      }).not.toThrow();
    });
  });

  describe('setExpression', () => {
    it('should apply manual values on the next apply', () => {
      const { vrm, values } = createVrm(['aa']);
      const api = useVrmExpressions(getExpressions);
      api.setExpression('aa', 0.7);
      api.apply(vrm);

      expect(values.get('aa')).toBe(0.7);
    });

    it('should let the expressions prop override manual values for the same key', () => {
      const { vrm, values } = createVrm(['aa']);
      const api = useVrmExpressions(getExpressions);
      api.setExpression('aa', 0.7);
      expressions = { aa: 0.2 };
      api.apply(vrm);

      expect(values.get('aa')).toBe(0.2);
    });

    it('should reset manual values to 0 after resetExpressions', () => {
      const { vrm, values } = createVrm(['aa', 'oh']);
      const api = useVrmExpressions(getExpressions);
      api.setExpression('aa', 1);
      api.setExpression('oh', 1);
      api.apply(vrm);
      api.resetExpressions();
      api.apply(vrm);

      expect(values.get('aa')).toBe(0);
      expect(values.get('oh')).toBe(0);
    });

    it('should keep manual values across model changes', () => {
      const first = createVrm(['aa']);
      const second = createVrm(['aa']);
      const api = useVrmExpressions(getExpressions);
      api.setExpression('aa', 0.4);
      api.apply(first.vrm);
      api.onModelChanged();
      api.apply(second.vrm);

      expect(second.values.get('aa')).toBe(0.4);
    });
  });

  describe('getExpressionNames', () => {
    it('should list preset and custom names of the model', () => {
      const { vrm } = createVrm(['happy', 'blink'], ['wink', 'tongue']);
      expect(useVrmExpressions(getExpressions).getExpressionNames(vrm)).toEqual({
        preset: ['happy', 'blink'],
        custom: ['wink', 'tongue']
      });
    });

    it('should return empty lists without a model', () => {
      expect(useVrmExpressions(getExpressions).getExpressionNames()).toEqual({
        preset: [],
        custom: []
      });
    });
  });
});
