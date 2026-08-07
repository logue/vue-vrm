import { describe, expect, test } from '@rstest/core';

import { loadVrm } from '@/composables/useVrmLoader';

describe('loadVrm - input validation', () => {
  test('rejects buffers that are too small to be GLB', async () => {
    await expect(loadVrm(new ArrayBuffer(4))).rejects.toThrow(/too small/);
  });

  test('rejects GLB with VRM 0.x extension only', async () => {
    const json = JSON.stringify({ extensions: { VRM: {} } });
    const jsonBytes = new TextEncoder().encode(json);
    const padding = (4 - (jsonBytes.length % 4)) % 4;
    const totalJsonLen = jsonBytes.length + padding;
    const buffer = new ArrayBuffer(12 + 8 + totalJsonLen);
    const view = new DataView(buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, buffer.byteLength, true);
    view.setUint32(12, totalJsonLen, true);
    view.setUint32(16, 0x4e4f534a, true);
    new Uint8Array(buffer, 20, jsonBytes.length).set(jsonBytes);
    for (let i = 0; i < padding; i++) {
      view.setUint8(20 + jsonBytes.length + i, 0x20);
    }
    await expect(loadVrm(buffer)).rejects.toThrow(/VRM 0\.x/);
  });

  test('rejects GLB with wrong magic bytes', async () => {
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    view.setUint32(0, 0xdeadbeef, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, 24, true);
    view.setUint32(12, 4, true);
    view.setUint32(16, 0x4e4f534a, true);
    await expect(loadVrm(buffer)).rejects.toThrow(/magic/);
  });
});
