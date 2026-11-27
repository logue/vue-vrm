<script setup lang="ts">
  import Pedestrian16 from '@carbon/icons/es/pedestrian/16';
  import ModelAlt16 from '@carbon/icons/es/model--alt/16';

  import { droppedFile, toggled } from '../../utils/carbonEvents';

  /** Model / animation files and canvas display options. */
  const showGrid = defineModel<boolean>('showGrid', { required: true });
  const bgTransparent = defineModel<boolean>('bgTransparent', { required: true });

  const emit = defineEmits<{
    'model-file': [buffer: ArrayBuffer];
    'animation-file': [buffer: ArrayBuffer];
    'load-sample': [];
  }>();

  async function onModelFile(event: Event): Promise<void> {
    const buffer = await droppedFile(event);
    if (buffer) emit('model-file', buffer);
  }

  async function onAnimationFile(event: Event): Promise<void> {
    const buffer = await droppedFile(event);
    if (buffer) emit('animation-file', buffer);
  }
</script>

<template>
  <cds-stack gap="5">
    <p>
      Load your own VRM file, or use the sample VRM provided by clicking the "Sample VRM" button.
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
      <cds-button kind="secondary" size="sm" @click="emit('load-sample')">Sample VRM</cds-button>
    </div>

    <cds-file-uploader>
      <span slot="label-title" class="label-with-icon">
        <cds-icon :icon="Pedestrian16" />
        VRMA (VRM Animation) file
      </span>
      <span slot="label-description">
        Due to licensing restrictions, a VRMA file is not bundled. Download one from
        <a href="https://vroid.booth.pm/items/5512385" target="_blank" rel="noopener noreferrer">
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
      @cds-toggle-changed="showGrid = toggled($event)"
    />
    <cds-toggle
      label-text="Transparent background"
      :toggled="bgTransparent"
      @cds-toggle-changed="bgTransparent = toggled($event)"
    />
  </cds-stack>
</template>
