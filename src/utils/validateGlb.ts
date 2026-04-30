/**
 * GLB (glTF Binary) validation utilities for VRM 1.0 / VRMA buffers.
 */

const GLB_MAGIC = 0x46546c67; // "glTF" in little-endian
const GLB_VERSION = 2;
const CHUNK_TYPE_JSON = 0x4e4f534a; // "JSON"

/** GLB ヘッダーとバージョンを検証し、JSON チャンクの内容をパースして返す */
function parseGlbJson(buffer: ArrayBuffer): Record<string, unknown> {
  if (buffer.byteLength < 20) {
    throw new Error('Invalid GLB: buffer too small');
  }
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('Invalid GLB: wrong magic bytes (not a glTF binary)');
  }
  const version = view.getUint32(4, true);
  if (version !== GLB_VERSION) {
    throw new Error(`Invalid GLB: unsupported version ${version}`);
  }
  const jsonChunkLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_TYPE_JSON) {
    throw new Error('Invalid GLB: first chunk is not JSON');
  }
  if (20 + jsonChunkLength > buffer.byteLength) {
    throw new Error('Invalid GLB: JSON chunk length exceeds buffer');
  }
  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);
  const text = new TextDecoder().decode(jsonBytes);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid GLB: JSON chunk could not be parsed');
  }
}

/** VRM 1.0 として有効かを検証する */
export function validateVrm(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if ('VRM' in ext && !('VRMC_vrm' in ext)) {
    throw new Error('VRM 0.x is not supported. Please use a VRM 1.0 model.');
  }
  if (!('VRMC_vrm' in ext)) {
    throw new Error('Invalid VRM: VRMC_vrm extension not found.');
  }
}

/** VRMA として有効かを検証する */
export function validateVrma(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if (!('VRMC_vrm_animation' in ext)) {
    throw new Error('Invalid VRMA: VRMC_vrm_animation extension not found.');
  }
}
