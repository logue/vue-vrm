/** Helpers for reading the `detail` of Carbon Web Components events. */

/** Read the new state from a `cds-toggle-changed` event. */
export function toggled(event: Event): boolean {
  return (event as CustomEvent<{ checked: boolean }>).detail.checked;
}

/** Read the value from a `cds-slider-changed` event. */
export function sliderValue(event: Event): number {
  return Number((event as CustomEvent<{ value: number | string }>).detail.value);
}

/** Read the `value` of the selected tab from a `cds-tabs-selected` event. */
export function selectedTab(event: Event): string {
  return (event as CustomEvent<{ item: HTMLElement & { value: string } }>).detail.item.value;
}

/** Read the first file from a `cds-file-uploader-drop-container-changed` event. */
export async function droppedFile(event: Event): Promise<ArrayBuffer | undefined> {
  const { addedFiles } = (event as CustomEvent<{ addedFiles: File[] }>).detail;
  return addedFiles[0]?.arrayBuffer();
}
