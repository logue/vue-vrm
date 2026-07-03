declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: For Vue SFCs, we often don't have explicit prop types, so we allow empty interfaces here.
  // biome-ignore lint/suspicious/noExplicitAny: For Vue SFCs, we often don't have explicit prop types, so we allow 'any' here.
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
