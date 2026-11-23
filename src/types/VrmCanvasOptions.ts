/** A 3-component vector, e.g. for position or Euler angles. */
export type Vec3 = [number, number, number];

/** Options for configuring the camera. Omitted fields use their defaults. */
export type CameraOptions = {
  /** Field of view in degrees (default: `30`). */
  fov?: number;
  /** Near clipping plane distance (default: `0.1`). */
  near?: number;
  /** Far clipping plane distance (default: `100`). */
  far?: number;
};

/** Options for configuring a light (color and intensity). */
export type LightOptions = {
  /** The color of the light, as a CSS string. */
  color: string;
  /** The intensity of the light. */
  intensity: number;
};

/** Options for a directional light. */
export type DirectionalLightOptions = LightOptions & {
  /** Position of the light. */
  position: Vec3;
};

/** Options for configuring camera orbit interaction (OrbitControls). Omitted fields use their defaults. */
export type CameraInteractionOptions = {
  /** Enables camera orbit interaction. */
  enabled: boolean;
  /** Enables orbit rotation around the target (default: `true`). */
  rotate?: boolean;
  /** Enables panning (default: `true`). */
  pan?: boolean;
  /** Enables zooming (dolly) (default: `true`). */
  zoom?: boolean;
  /** Enables roll interaction with Q/E keys while canvas is focused (default: `false`). */
  roll?: boolean;
  /** Orbit rotation speed (default: `1`). */
  rotateSpeed?: number;
  /** Pan speed (default: `1`). */
  panSpeed?: number;
  /** Zoom speed (default: `1`). */
  zoomSpeed?: number;
  /** Enables damping for smoother interaction (default: `true`). */
  damping?: boolean;
  /** Damping factor when damping is enabled (default: `0.08`). */
  dampingFactor?: number;
  /** Minimum camera distance from target (default: `0.1`). */
  minDistance?: number;
  /** Maximum camera distance from target (default: `Infinity`). */
  maxDistance?: number;
  /** Roll speed in radians per key press (default: `0.03`). */
  rollSpeed?: number;
};
