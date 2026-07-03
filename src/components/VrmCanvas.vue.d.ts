import type { DefineComponent } from 'vue';

// biome-ignore lint/complexity/noBannedTypes: For Vue SFCs, we often don't have explicit prop types, so we allow empty interfaces here.
// biome-ignore lint/suspicious/noExplicitAny: For Vue SFCs, we often don't have explicit prop types, so we allow 'any' here.
// rslint-ignore @typescript-eslint/no-explicit-any
declare const _default: import('vue').DefineComponent<{}, {}, any>;
export default _default;
