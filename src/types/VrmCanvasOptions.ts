/** A 3-component vector, e.g. for position or Euler angles. */
export type Vec3 = [number, number, number];

/** Options for configuring the camera. */
export type CameraOptions = {
  /** Field of view in degrees. */
  fov?: number;
  /** Near clipping plane distance. */
  near?: number;
  /** Far clipping plane distance. */
  far?: number;
};

/** Options for configuring a light (color and intensity). */
export type LightOptions = {
  /** The color of the light, as a CSS string. */
  color: string;
  /** The intensity of the light. */
  intensity: number;
};

/** Options for configuring camera orbit interaction (OrbitControls). */
export type CameraInteractionOptions = {
  /** Enables camera orbit interaction when this option object is provided. */
  enabled?: boolean;
  /** Enables orbit rotation around the target. */
  rotate?: boolean;
  /** Enables panning. */
  pan?: boolean;
  /** Enables zooming (dolly). */
  zoom?: boolean;
  /** Enables roll interaction with Q/E keys while canvas is focused. */
  roll?: boolean;
  /** Orbit rotation speed. */
  rotateSpeed?: number;
  /** Pan speed. */
  panSpeed?: number;
  /** Zoom speed. */
  zoomSpeed?: number;
  /** Enables damping for smoother interaction. */
  damping?: boolean;
  /** Damping factor when damping is enabled. */
  dampingFactor?: number;
  /** Minimum camera distance from target. */
  minDistance?: number;
  /** Maximum camera distance from target. */
  maxDistance?: number;
  /** Roll speed in radians per key press. */
  rollSpeed?: number;
};
