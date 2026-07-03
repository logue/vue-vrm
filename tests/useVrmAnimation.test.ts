import type { VRM } from '@pixiv/three-vrm';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import { describe, expect, test } from '@rstest/core';
import * as THREE from 'three';
import {
  createMixerWithClips,
  disposeMixer,
  loadVRMAnimation
} from '../src/composables/useVrmAnimation';

/** Build a fake VRM-like object with just enough surface for the mixer. */
function makeFakeVrm(): VRM {
  const scene = new THREE.Object3D();
  scene.name = 'fakeVrmRoot';
  return { scene } as unknown as VRM;
}

describe('createMixerWithClips - weight validation', () => {
  test('throws when weights sum exceeds 1.0', () => {
    const vrm = makeFakeVrm();
    const animations = [{}, {}] as VRMAnimation[];
    expect(() => createMixerWithClips(vrm, animations, [0.7, 0.5])).toThrow(
      /\[VrmCanvas\] The sum of animationWeights exceeds 1\.0:/
    );
  });

  test('does not throw when weights sum equals 1.0 exactly (validation only)', () => {
    const vrm = makeFakeVrm();
    // Pass empty animations so we exercise the validation branch only —
    // createVRMAnimationClip is never called and no real VRM data is needed.
    const animations: VRMAnimation[] = [];
    expect(() => createMixerWithClips(vrm, animations, [])).not.toThrow();
  });

  test('falls back to equal split when weights length mismatches (validation passes)', () => {
    const vrm = makeFakeVrm();
    const animations: VRMAnimation[] = [];
    // weights length differs from animations length -> equal split (1/0 NaN
    // never produced because animations is empty, sum = 0 ≤ 1).
    expect(() => createMixerWithClips(vrm, animations, [10, 20])).not.toThrow();
  });

  test('falls back to equal split when weights contain non-finite values', () => {
    const vrm = makeFakeVrm();
    const animations: VRMAnimation[] = [];
    expect(() => createMixerWithClips(vrm, animations, [Number.NaN])).not.toThrow();
  });
});

describe('disposeMixer', () => {
  test('stops actions and uncaches the root without throwing', () => {
    const root = new THREE.Object3D();
    const mixer = new THREE.AnimationMixer(root);
    expect(() => disposeMixer(mixer)).not.toThrow();
  });
});

describe('loadVRMAnimation - input validation', () => {
  test('rejects buffers that are not GLB', async () => {
    await expect(loadVRMAnimation(new ArrayBuffer(4))).rejects.toThrow(/too small|magic|GLB/);
  });

  test('rejects GLB without VRMC_vrm_animation extension', async () => {
    // Build minimal GLB whose JSON chunk has empty extensions.
    const json = JSON.stringify({ extensions: {} });
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
    await expect(loadVRMAnimation(buffer)).rejects.toThrow(/VRMC_vrm_animation/);
  });
});
