<script setup lang="ts">
  import { computed, onMounted, ref, watchEffect } from 'vue';

  import VrmCanvas from '@/components/VrmCanvas.vue';
  import type { AnimationData, CameraInteractionOptions, VrmCanvasExposed } from '@/index';

  import ToggleTheme from './components/ToggleTheme.vue';

  const sampleVrmUrl = new URL('./assets/AvatarSample_A.vrm', import.meta.url).href;

  const modelData = ref<ArrayBuffer>();
  const animationData = ref<AnimationData>();
  const showGrid = ref(true);
  const bgTransparent = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string>();
  const vrmCanvas = ref<VrmCanvasExposed>();
  const dark = ref(globalThis.matchMedia('(prefers-color-scheme: dark)').matches);

  const interaction = ref({
    enabled: false,
    rotate: true,
    pan: true,
    zoom: true,
    roll: true
  });

  const cameraInteraction = computed<CameraInteractionOptions | undefined>(() =>
    interaction.value.enabled
      ? { ...interaction.value, minDistance: 0.5, maxDistance: 20 }
      : undefined
  );

  watchEffect(() => {
    document.documentElement.dataset.carbonTheme = dark.value ? 'g100' : 'white';
  });

  /** Read the new state from a `cds-toggle-changed` event. */
  function checked(event: Event): boolean {
    return (event as CustomEvent<{ checked: boolean }>).detail.checked;
  }

  function onError(error: Error): void {
    isLoading.value = false;
    errorMessage.value = error.message;
  }

  async function loadAvatarSample(): Promise<void> {
    errorMessage.value = undefined;
    isLoading.value = true;
    try {
      const response = await fetch(sampleVrmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load sample VRM: ${String(response.status)}`);
      }
      modelData.value = await response.arrayBuffer();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async function readFile(event: Event): Promise<ArrayBuffer | undefined> {
    errorMessage.value = undefined;
    return (event.target as HTMLInputElement).files?.[0]?.arrayBuffer();
  }

  async function onModelFile(event: Event): Promise<void> {
    const buffer = await readFile(event);
    if (buffer) modelData.value = buffer;
  }

  async function onAnimationFile(event: Event): Promise<void> {
    const buffer = await readFile(event);
    if (buffer) animationData.value = buffer;
  }

  onMounted(loadAvatarSample);
</script>

<template>
  <header class="demo-header">
    <strong>Vue VRM Demo</strong>
    <a href="https://github.com/logue/vue-vrm">GitHub</a>
    <ToggleTheme v-model="dark" />
  </header>

  <main class="demo-main">
    <section class="demo-controls">
      <p>
        Load your own VRM file, or use the sample VRM provided by clicking the "Sample VRM" button.
      </p>

      <label for="fileVrm">VRM file</label>
      <input id="fileVrm" type="file" accept=".vrm,.glb" @change="onModelFile" />
      <cds-button kind="secondary" size="sm" @click="loadAvatarSample">Sample VRM</cds-button>

      <label for="fileVrma">VRMA (VRM Animation) file</label>
      <input id="fileVrma" type="file" accept=".vrma,.glb" @change="onAnimationFile" />
      <p class="demo-helper">
        Due to licensing restrictions, a VRMA file is not bundled. Download one from
        <a href="https://vroid.booth.pm/items/5512385" target="_blank" rel="noopener noreferrer">
          BOOTH
        </a>
        and load it yourself.
      </p>

      <cds-toggle
        label-text="Show grid"
        :toggled="showGrid"
        @cds-toggle-changed="showGrid = checked($event)"
      />
      <cds-toggle
        label-text="Transparent background"
        :toggled="bgTransparent"
        @cds-toggle-changed="bgTransparent = checked($event)"
      />

      <fieldset>
        <legend>Camera control</legend>
        <cds-toggle
          label-text="Enable interaction"
          :toggled="interaction.enabled"
          @cds-toggle-changed="interaction.enabled = checked($event)"
        />
        <cds-toggle
          label-text="Orbit rotate (drag)"
          :disabled="!interaction.enabled"
          :toggled="interaction.rotate"
          @cds-toggle-changed="interaction.rotate = checked($event)"
        />
        <cds-toggle
          label-text="Pan (right drag / Ctrl + drag)"
          :disabled="!interaction.enabled"
          :toggled="interaction.pan"
          @cds-toggle-changed="interaction.pan = checked($event)"
        />
        <cds-toggle
          label-text="Zoom (mouse wheel)"
          :disabled="!interaction.enabled"
          :toggled="interaction.zoom"
          @cds-toggle-changed="interaction.zoom = checked($event)"
        />
        <cds-toggle
          label-text="Roll (focus canvas, then Q / E)"
          :disabled="!interaction.enabled"
          :toggled="interaction.roll"
          @cds-toggle-changed="interaction.roll = checked($event)"
        />
        <cds-button kind="tertiary" size="sm" @click="vrmCanvas?.resetCamera()">
          Reset camera
        </cds-button>
      </fieldset>
    </section>

    <section class="demo-preview">
      <cds-inline-notification
        v-if="errorMessage"
        kind="error"
        title="Error"
        :subtitle="errorMessage"
        hide-close-button
      />
      <p v-if="isLoading">Loading…</p>
      <VrmCanvas
        ref="vrmCanvas"
        :model-data="modelData"
        :animation-data="animationData"
        :show-grid="showGrid"
        :bg-transparent="bgTransparent"
        :camera-interaction="cameraInteraction"
        @model:loading="isLoading = true"
        @model:loaded="isLoading = false"
        @model:error="onError"
        @animation:error="onError"
        @error="onError"
      />
    </section>
  </main>

  <footer class="demo-footer">
    &copy; 2026 by <a href="https://logue.dev/">Logue</a>. Licensed under the
    <a href="https://opensource.org/licenses/mit-license.php">MIT License</a>.
  </footer>
</template>

<style scoped>
  .demo-header,
  .demo-footer {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .demo-main {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 1rem;
  }

  .demo-controls {
    display: flex;
    flex: 1 1 320px;
    flex-direction: column;
    gap: 0.5rem;
  }

  .demo-preview {
    flex: 1 1 480px;
  }

  .demo-helper {
    font-size: 0.75rem;
  }
</style>
