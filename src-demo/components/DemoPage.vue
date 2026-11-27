<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';

  import VrmCanvas from '@/components/VrmCanvas';
  import type {
    AnimationData,
    CameraInteractionOptions,
    VrmCanvasExposed,
    VrmExpressionNames
  } from '@/index';

  import { selectedTab } from '../utils/carbonEvents';
  import CameraPanel, { type CameraInteractionState } from './panels/CameraPanel.vue';
  import ExpressionPanel from './panels/ExpressionPanel.vue';
  import GeneralPanel from './panels/GeneralPanel.vue';

  import Document from '@carbon/icons/es/document/16.js';
  import Video from '@carbon/icons/es/video/16.js';
  import FaceSatisfied from '@carbon/icons/es/face--satisfied/16.js';

  const sampleVrmUrl = new URL('../assets/AvatarSample_A.vrm', import.meta.url).href;

  const tabs = [
    { value: 'general', icon: Document, label: 'General' },
    { value: 'camera', icon: Video, label: 'Camera Control' },
    { value: 'expression', icon: FaceSatisfied, label: 'Expression' }
  ] as const;
  type Tab = (typeof tabs)[number]['value'];
  const activeTab = ref<Tab>('general');

  const modelData = ref<ArrayBuffer>();
  const animationData = ref<AnimationData>();
  const showGrid = ref(true);
  const bgTransparent = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string>();
  const vrmCanvas = ref<VrmCanvasExposed>();

  const expressionNames = ref<VrmExpressionNames>({ preset: [], custom: [] });
  const autoBlink = ref(true);

  const interaction = ref<CameraInteractionState>({
    enabled: true,
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

  function onModelLoaded(): void {
    isLoading.value = false;
    expressionNames.value = vrmCanvas.value?.getExpressionNames() ?? { preset: [], custom: [] };
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

  function onModelFile(buffer: ArrayBuffer): void {
    errorMessage.value = undefined;
    modelData.value = buffer;
  }

  function onAnimationFile(buffer: ArrayBuffer): void {
    errorMessage.value = undefined;
    animationData.value = buffer;
  }

  onMounted(loadAvatarSample);
</script>

<template>
  <div class="demo-page">
    <section class="demo-controls">
      <cds-tabs :value="activeTab" @cds-tabs-selected="activeTab = selectedTab($event) as Tab">
        <cds-tab v-for="tab in tabs" :key="tab.value" :value="tab.value"
          ><cds-icon :icon="tab.icon" />{{ tab.label }}</cds-tab
        >
      </cds-tabs>

      <div v-show="activeTab === 'general'" class="demo-panel" role="tabpanel">
        <GeneralPanel
          v-model:show-grid="showGrid"
          v-model:bg-transparent="bgTransparent"
          @model-file="onModelFile"
          @animation-file="onAnimationFile"
          @load-sample="loadAvatarSample"
        />
      </div>
      <div v-show="activeTab === 'camera'" class="demo-panel" role="tabpanel">
        <CameraPanel v-model="interaction" @reset="vrmCanvas?.resetCamera()" />
      </div>
      <div v-show="activeTab === 'expression'" class="demo-panel" role="tabpanel">
        <ExpressionPanel
          @change="(name, weight) => vrmCanvas?.setExpression(name, weight)"
          @reset="vrmCanvas?.resetExpressions()"
          v-model:auto-blink="autoBlink"
          :names="expressionNames"
        />
      </div>
    </section>

    <section class="demo-preview">
      <cds-inline-notification
        v-if="errorMessage"
        title="Error"
        kind="error"
        :subtitle="errorMessage"
        hide-close-button
      />
      <cds-inline-loading v-if="isLoading" status="active">Loading…</cds-inline-loading>
      <VrmCanvas
        ref="vrmCanvas"
        width="100%"
        :model-data="modelData"
        :animation-data="animationData"
        :show-grid="showGrid"
        :bg-transparent="bgTransparent"
        :camera-interaction="cameraInteraction"
        :auto-blink="autoBlink"
        @model:loading="isLoading = true"
        @model:loaded="onModelLoaded"
        @model:error="onError"
        @animation:error="onError"
        @error="onError"
      />
    </section>
  </div>
</template>

<style scoped>
  .demo-page {
    display: flex;
    flex-wrap: wrap;
    gap: var(--cds-spacing-07, 2rem);
    padding: var(--cds-spacing-05, 1rem);
  }

  .demo-controls {
    flex: 1 1 320px;
  }

  .demo-preview {
    flex: 1 1 480px;
  }

  .demo-panel {
    padding-block: var(--cds-spacing-05, 1rem);
  }
</style>
