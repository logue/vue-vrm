import { describe, expect, test } from '@rstest/core';

import { validateVrm, validateVrma } from '@/utils/validateGlb';

function makeGlb(json: object): ArrayBuffer {
  const jsonString = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonString);
  // Pad JSON chunk to 4-byte alignment with spaces.
  const padding = (4 - (jsonBytes.length % 4)) % 4;
  const totalJsonLength = jsonBytes.length + padding;
  const buffer = new ArrayBuffer(12 + 8 + totalJsonLength);
  const view = new DataView(buffer);
  // Header
  view.setUint32(0, 0x46546c67, true); // "glTF"
  view.setUint32(4, 2, true); // version
  view.setUint32(8, buffer.byteLength, true);
  // JSON chunk
  view.setUint32(12, totalJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true); // "JSON"
  new Uint8Array(buffer, 20, jsonBytes.length).set(jsonBytes);
  // Pad with spaces.
  for (let index = 0; index < padding; index++) {
    view.setUint8(20 + jsonBytes.length + index, 0x20);
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
    expect(() => {
      validateVrm(new ArrayBuffer(4));
    }).toThrow(tooSmallRegex);
  });

  test('rejects bad magic', () => {
    const buffer = makeGlb({ extensions: { VRMC_vrm: {} } });
    new DataView(buffer).setUint32(0, 0xdeadbeef, true);
    expect(() => {
      validateVrm(buffer);
    }).toThrow(magicRegex);
  });

  test('rejects VRM 0.x', () => {
    const buffer = makeGlb({ extensions: { VRM: {} } });
    expect(() => {
      validateVrm(buffer);
    }).toThrow(vrm0xRegex);
  });

  test('rejects missing VRMC_vrm', () => {
    const buffer = makeGlb({ extensions: {} });
    expect(() => {
      validateVrm(buffer);
    }).toThrow(missingVrmcVrmRegex);
  });

  test('accepts valid VRM 1.0', () => {
    const buffer = makeGlb({ extensions: { VRMC_vrm: {} } });
    expect(() => {
      validateVrm(buffer);
    }).not.toThrow();
  });
});

describe('validateVrma', () => {
  test('rejects missing VRMC_vrm_animation', () => {
    const buffer = makeGlb({ extensions: {} });
    expect(() => {
      validateVrma(buffer);
    }).toThrow(missingVrmcVrmAnimationRegex);
  });

  test('accepts valid VRMA', () => {
    const buffer = makeGlb({ extensions: { VRMC_vrm_animation: {} } });
    expect(() => {
      validateVrma(buffer);
    }).not.toThrow();
  });
});
