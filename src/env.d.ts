/// <reference types="@rsbuild/core/types" />
/// <reference types="@rslib/core/types" />

/** Build-time constants injected via `source.define` in rsbuild.config.ts / rslib.config.ts */
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<{}, {}, any>;
  export default component;
}
