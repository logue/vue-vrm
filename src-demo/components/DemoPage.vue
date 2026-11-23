<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';

  import Pedestrian16 from '@carbon/icons/es/pedestrian/16';
  import ModelAlt16 from '@carbon/icons/es/model--alt/16';

  import VrmCanvas from '@/components/VrmCanvas';
  import type { AnimationData, CameraInteractionOptions, VrmCanvasExposed } from '@/index';

  const sampleVrmUrl = new URL('../assets/AvatarSample_A.vrm', import.meta.url).href;

  const modelData = ref<ArrayBuffer>();
  const animationData = ref<AnimationData>();
  const showGrid = ref(true);
  const bgTransparent = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string>();
  const vrmCanvas = ref<VrmCanvasExposed>();

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

  /** Read the new state from a `cds-toggle-changed` event. */
  function checked(event: Event): boolean {
    return (event as CustomEvent<{ checked: boolean }>).detail.checked;
  }

  /** Read the first file from a `cds-file-uploader-drop-container-changed` event. */
  async function readDroppedFile(event: Event): Promise<ArrayBuffer | undefined> {
    errorMessage.value = undefined;
    const { addedFiles } = (event as CustomEvent<{ addedFiles: File[] }>).detail;
    return addedFiles[0]?.arrayBuffer();
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

  async function onModelFile(event: Event): Promise<void> {
    const buffer = await readDroppedFile(event);
    if (buffer) modelData.value = buffer;
  }

  async function onAnimationFile(event: Event): Promise<void> {
    const buffer = await readDroppedFile(event);
    if (buffer) animationData.value = buffer;
  }

  onMounted(loadAvatarSample);
</script>

<template>
  <div class="demo-page">
    <section class="demo-controls">
      <cds-stack gap="5">
        <p>
          Load your own VRM file, or use the sample VRM provided by clicking the "Sample VRM"
          button.
        </p>

        <div>
          <cds-file-uploader>
            <span slot="label-title" class="label-with-icon">
              <cds-icon :icon="ModelAlt16" />
              VRM file
            </span>
            <cds-file-uploader-drop-container
              slot="drop-container"
              accept=".vrm .glb"
              @cds-file-uploader-drop-container-changed="onModelFile"
            >
              Drag and drop a VRM file here or click to upload
            </cds-file-uploader-drop-container>
          </cds-file-uploader>
          <cds-button kind="secondary" size="sm" @click="loadAvatarSample">Sample VRM</cds-button>
        </div>
        <cds-file-uploader>
          <span slot="label-title" class="label-with-icon">
            <cds-icon :icon="Pedestrian16" />
            VRMA (VRM Animation) file
          </span>
          <span slot="label-description">
            Due to licensing restrictions, a VRMA file is not bundled. Download one from
            <a
              href="https://vroid.booth.pm/items/5512385"
              target="_blank"
              rel="noopener noreferrer"
            >
              BOOTH
            </a>
            and load it yourself.
          </span>
          <cds-file-uploader-drop-container
            slot="drop-container"
            accept=".vrma .glb"
            @cds-file-uploader-drop-container-changed="onAnimationFile"
          >
            Drag and drop a VRMA file here or click to upload
          </cds-file-uploader-drop-container>
        </cds-file-uploader>

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

        <fieldset class="demo-fieldset">
          <legend>Camera control</legend>
          <cds-stack gap="3">
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
          </cds-stack>
        </fieldset>
      </cds-stack>
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
        :model-data="modelData"
        :animation-data="animationData"
        :show-grid="showGrid"
        :bg-transparent="bgTransparent"
        :camera-interaction="cameraInteraction"
        :max-width="640"
        @model:loading="isLoading = true"
        @model:loaded="isLoading = false"
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

  .demo-fieldset {
    padding: var(--cds-spacing-05, 1rem);
    border: 1px solid var(--cds-border-subtle-01, #e0e0e0);
  }
</style>
