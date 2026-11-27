<script setup lang="ts">
  import { toggled } from '../../utils/carbonEvents';

  /** Switches for the orbit-control features. */
  export type CameraInteractionState = {
    enabled: boolean;
    rotate: boolean;
    pan: boolean;
    zoom: boolean;
    roll: boolean;
  };

  const interaction = defineModel<CameraInteractionState>({ required: true });

  const emit = defineEmits<{ reset: [] }>();

  const options: { key: Exclude<keyof CameraInteractionState, 'enabled'>; label: string }[] = [
    { key: 'rotate', label: 'Orbit rotate (drag)' },
    { key: 'pan', label: 'Pan (right drag / Ctrl + drag)' },
    { key: 'zoom', label: 'Zoom (mouse wheel)' },
    { key: 'roll', label: 'Roll (focus canvas, then Q / E)' }
  ];

  function set(key: keyof CameraInteractionState, event: Event): void {
    interaction.value = { ...interaction.value, [key]: toggled(event) };
  }
</script>

<template>
  <cds-stack gap="3">
    <cds-toggle
      label-text="Enable interaction"
      :toggled="interaction.enabled"
      @cds-toggle-changed="set('enabled', $event)"
    />
    <cds-toggle
      v-for="option in options"
      :key="option.key"
      :label-text="option.label"
      :disabled="!interaction.enabled"
      :toggled="interaction[option.key]"
      @cds-toggle-changed="set(option.key, $event)"
    />
    <cds-button kind="tertiary" size="sm" @click="emit('reset')">Reset camera</cds-button>
  </cds-stack>
</template>
