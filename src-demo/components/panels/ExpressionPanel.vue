<script setup lang="ts">
  import { computed, ref } from 'vue';

  import type { VrmExpressionNames } from '@/index';

  import { sliderValue, toggled } from '../../utils/carbonEvents';

  /**
   * Expression sliders for the loaded model, grouped by category in an accordion.
   *
   * The sliders are uncontrolled: while dragging, weights only flow upward through
   * the `change` event (the parent forwards them to `setExpression()`), so nothing
   * is written back to the slider being dragged and no reactive state is replaced
   * on every pointer move.
   */
  const props = defineProps<{ names: VrmExpressionNames }>();

  const emit = defineEmits<{ change: [name: string, weight: number]; reset: [] }>();

  const autoBlink = defineModel<boolean>('autoBlink', { required: true });

  type CategoryId = 'emotion' | 'lipSync' | 'blink' | 'lookAt' | 'custom';

  /** Preset expressions per category (VRM 1.0 preset names). */
  const PRESET_CATEGORIES: { id: Exclude<CategoryId, 'custom'>; title: string; names: string[] }[] =
    [
      {
        id: 'emotion',
        title: '🙂 Basic / Emotion',
        names: ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised']
      },
      { id: 'lipSync', title: '👄 Lip sync', names: ['aa', 'ih', 'ou', 'ee', 'oh'] },
      { id: 'blink', title: '👁️ Blink', names: ['blink', 'blinkLeft', 'blinkRight'] },
      { id: 'lookAt', title: '👀 Look at', names: ['lookUp', 'lookDown', 'lookLeft', 'lookRight'] }
    ];

  /** Categories with only the expressions the model actually defines. */
  const categories = computed(() => {
    const available = new Set<string>(props.names.preset);
    const known = new Set(PRESET_CATEGORIES.flatMap(category => category.names));
    const groups = PRESET_CATEGORIES.map(category => ({
      ...category,
      names: category.names.filter(name => available.has(name))
    }));
    // Presets not listed above (e.g. from a newer VRM spec) fall back to the first category.
    const others = props.names.preset.filter(name => !known.has(name));
    groups[0]?.names.push(...others);
    return [
      ...groups,
      { id: 'custom' as const, title: 'Custom', names: [...props.names.custom] }
    ].filter(group => group.names.length > 0 || group.id === 'blink');
  });

  const hasModel = computed(() => props.names.preset.length > 0 || props.names.custom.length > 0);

  /** Bumped on reset to remount the sliders back at 0. */
  const resetKey = ref(0);

  function reset(): void {
    resetKey.value++;
    emit('reset');
  }
</script>

<template>
  <cds-stack gap="5">
    <p v-if="!hasModel">Load a VRM model to control its expressions.</p>
    <template v-else>
      <cds-callout-notification
        kind="info"
        title="How these sliders work"
        status-icon-description="notification"
      >
        These sliders call <code>setExpression()</code> on the component instance. It bypasses Vue
        reactivity and applies the weight on the next frame, so it suits values that change
        frequently, such as sliders or lip sync. The <code>expressions</code> prop is intended for
        declarative use, such as occasionally switching facial expressions.
      </cds-callout-notification>
      <cds-accordion>
        <cds-accordion-item
          v-for="(category, index) in categories"
          :key="category.id"
          :title="category.title"
        >
          <cds-stack gap="3">
            <cds-toggle
              v-if="category.id === 'blink'"
              label-text="Auto blink (paused while the blink slider is set)"
              :toggled="autoBlink"
              @cds-toggle-changed="autoBlink = toggled($event)"
            />
            <cds-inline-notification
              v-if="category.id === 'lookAt'"
              kind="info"
              title="Note"
              subtitle="On models whose look-at uses expressions, the eyes are driven by look-at every frame, so these sliders may have no visible effect."
              low-contrast
              hide-close-button
            />
            <cds-slider
              v-for="name in category.names"
              :key="`${name}-${resetKey}`"
              :class="[`slider--${category.id}`, `slider-${name}`]"
              :label-text="name"
              min="0"
              max="1"
              step="0.01"
              value="0"
              @cds-slider-changed="emit('change', name, sliderValue($event))"
            >
              <cds-slider-input aria-label="Slider value" :name="name" type="number" />
            </cds-slider>
          </cds-stack>
        </cds-accordion-item>
      </cds-accordion>
      <cds-button kind="tertiary" size="sm" @click="reset">Reset expressions</cds-button>
    </template>
  </cds-stack>
</template>

<style lang="scss" scoped>
  @use '@carbon/colors';
  /*
   * Per-category slider color. Carbon's slider reads these tokens for the filled
   * track and thumb (idle and focused). Carbon palette 50 grades read on both
   * light and dark themes.
   */
  cds-slider {
    --cds-layer-selected-inverse: var(--slider-color);
    --cds-interactive: var(--slider-color);
    --cds-border-interactive: var(--slider-color);
  }

  // Color palette: https://www.carbondesignsystem.com/building-blocks/data-visualization/color-palettes

  .slider--emotion {
    --slider-color: #{colors.$blue-50};
  }

  .slider--lipSync {
    --slider-color: #{colors.$red-50};
  }

  .slider--blink {
    --slider-color: #{colors.$cyan-50};
  }

  .slider--lookAt {
    --slider-color: #{colors.$teal-50};
  }

  .slider--custom {
    --slider-color: #{colors.$purple-50};
  }
</style>
