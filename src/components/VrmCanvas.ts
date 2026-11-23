import { defineComponent } from 'vue';

import { useVrmCanvas, vrmCanvasEmits, vrmCanvasProps } from '@/composables/useVrmCanvas';
import { renderVrmCanvas } from '@/helpers/renderVrmCanvas';

/** VRM viewer component. All logic lives in {@link useVrmCanvas}. */
export default defineComponent({
  name: 'VrmCanvas',
  props: vrmCanvasProps,
  emits: vrmCanvasEmits,
  setup(props, { emit, expose }) {
    const api = useVrmCanvas(props, emit);
    expose(api.exposed);
    return () => renderVrmCanvas(api);
  }
});
