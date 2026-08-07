/**
 * GLB (glTF Binary) validation utilities for VRM 1.0 / VRMA buffers.
 */

const GLB_MAGIC = 0x46546c67; // "glTF" in little-endian
const GLB_VERSION = 2;
const CHUNK_TYPE_JSON = 0x4e4f534a; // "JSON"

/**
 * Validate the GLB header and version, then parse and return the contents of the JSON chunk.
 * @param buffer The GLB file as an ArrayBuffer.
 * @returns The parsed JSON content of the GLB.
 * @throws If the GLB is invalid or the JSON chunk cannot be parsed.
 */
function parseGlbJson(buffer: ArrayBuffer): Record<string, unknown> {
  if (buffer.byteLength < 20) {
    throw new Error('[VrmCanvas] Invalid GLB: buffer too small');
  }
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error(
      '[VrmCanvas] Invalid GLB: wrong magic bytes (not a glTF binary)',
    );
  }
  const version = view.getUint32(4, true);
  if (version !== GLB_VERSION) {
    throw new Error(`[VrmCanvas] Invalid GLB: unsupported version ${version}`);
  }
  const jsonChunkLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_TYPE_JSON) {
    throw new Error('[VrmCanvas] Invalid GLB: first chunk is not JSON');
  }
  if (20 + jsonChunkLength > buffer.byteLength) {
    throw new Error(
      '[VrmCanvas] Invalid GLB: JSON chunk length exceeds buffer',
    );
  }
  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);
  const text = new TextDecoder().decode(jsonBytes);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('[VrmCanvas] Invalid GLB: JSON chunk could not be parsed');
  }
}

/**
 * Validate if the buffer is a valid VRM 1.0 model
 * Checks for the presence of the VRMC_vrm extension and absence of the older VRM extension.
 * @param buffer The GLB file as an ArrayBuffer.
 * @throws If the buffer is not a valid VRM 1.0 GLB.
 */
export function validateVrm(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if ('VRM' in ext && !('VRMC_vrm' in ext)) {
    throw new Error(
      '[VrmCanvas] VRM 0.x is not supported. Please use a VRM 1.0 model.',
    );
  }
  if (!('VRMC_vrm' in ext)) {
    throw new Error('[VrmCanvas] Invalid VRM: VRMC_vrm extension not found.');
  }
}

/**
 * Validate if the buffer is a valid VRMA (VRM Animation) model
 * Checks for the presence of the VRMC_vrm_animation extension.
 * @param buffer The GLB file as an ArrayBuffer.
 * @throws If the buffer is not a valid VRMA GLB.
 */
export function validateVrma(buffer: ArrayBuffer): void {
  const json = parseGlbJson(buffer);
  const ext = (json.extensions ?? {}) as Record<string, unknown>;
  if (!('VRMC_vrm_animation' in ext)) {
    throw new Error(
      '[VrmCanvas] Invalid VRMA: VRMC_vrm_animation extension not found.',
    );
  }
}
