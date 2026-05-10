/// <reference types="@rsbuild/core/types" />

import type {} from 'vue';

declare const __DEMO_BUILD__: boolean;
declare global {
  var __APP_VERSION__: string;
  var __BUILD_DATE__: string;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: For Vue SFCs, we often don't have explicit prop types, so we allow empty interfaces here.
  // biome-ignore lint/suspicious/noExplicitAny: For Vue SFCs, we often don't have explicit prop types, so we allow 'any' here.
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
