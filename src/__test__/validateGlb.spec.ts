import { describe, expect, test } from '@rstest/core';

import { validateVrm, validateVrma } from '@/utils/validateGlb';

function makeGlb(json: object): ArrayBuffer {
  const jsonStr = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  // Pad JSON chunk to 4-byte alignment with spaces.
  const padding = (4 - (jsonBytes.length % 4)) % 4;
  const totalJsonLen = jsonBytes.length + padding;
  const buffer = new ArrayBuffer(12 + 8 + totalJsonLen);
  const view = new DataView(buffer);
  // Header
  view.setUint32(0, 0x46546c67, true); // "glTF"
  view.setUint32(4, 2, true); // version
  view.setUint32(8, buffer.byteLength, true);
  // JSON chunk
  view.setUint32(12, totalJsonLen, true);
  view.setUint32(16, 0x4e4f534a, true); // "JSON"
  new Uint8Array(buffer, 20, jsonBytes.length).set(jsonBytes);
  // Pad with spaces.
  for (let i = 0; i < padding; i++) {
    view.setUint8(20 + jsonBytes.length + i, 0x20);
  }
  return buffer;
}

const tooSmallRegex = /too small/;
const magicRegex = /magic/;
const vrm0xRegex = /VRM 0\.x/;
const missingVrmcVrmRegex = /VRMC_vrm/;
const missingVrmcVrmAnimationRegex = /VRMC_vrm_animation/;

describe('validateVrm', () => {
  test('rejects too-small buffers', () => {
    expect(() => validateVrm(new ArrayBuffer(4))).toThrow(tooSmallRegex);
  });

  test('rejects bad magic', () => {
    const buf = makeGlb({ extensions: { VRMC_vrm: {} } });
    new DataView(buf).setUint32(0, 0xdeadbeef, true);
    expect(() => validateVrm(buf)).toThrow(magicRegex);
  });

  test('rejects VRM 0.x', () => {
    const buf = makeGlb({ extensions: { VRM: {} } });
    expect(() => validateVrm(buf)).toThrow(vrm0xRegex);
  });

  test('rejects missing VRMC_vrm', () => {
    const buf = makeGlb({ extensions: {} });
    expect(() => validateVrm(buf)).toThrow(missingVrmcVrmRegex);
  });

  test('accepts valid VRM 1.0', () => {
    const buf = makeGlb({ extensions: { VRMC_vrm: {} } });
    expect(() => validateVrm(buf)).not.toThrow();
  });
});

describe('validateVrma', () => {
  test('rejects missing VRMC_vrm_animation', () => {
    const buf = makeGlb({ extensions: {} });
    expect(() => validateVrma(buf)).toThrow(missingVrmcVrmAnimationRegex);
  });

  test('accepts valid VRMA', () => {
    const buf = makeGlb({ extensions: { VRMC_vrm_animation: {} } });
    expect(() => validateVrma(buf)).not.toThrow();
  });
});
