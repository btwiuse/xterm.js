/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

/**
 * Configuration options for the cursor trail addon.
 */
export interface ICursorTrailAddonOptions {
  /**
   * Whether the cursor trail is enabled. Default is true.
   */
  enabled?: boolean;

  /**
   * The color of the cursor trail in any CSS color format. Default is '#cccccc'.
   */
  trailColor?: string;

  /**
   * The maximum opacity of the cursor trail (0 to 1). Default is 0.5.
   */
  trailOpacity?: number;

  /**
   * The fast decay time in seconds. Corners chasing in the direction of cursor
   * movement will use this decay. Lower means faster chasing. Default is 0.1.
   */
  decayFast?: number;

  /**
   * The slow decay time in seconds. Corners chasing against the direction of
   * cursor movement will use this decay. Higher means slower chasing. Default is 0.3.
   */
  decaySlow?: number;

  /**
   * The minimum cursor movement in cells before the trail activates. Smaller
   * movements snap the trail corners directly to the cursor. Default is 1.
   */
  startThreshold?: number;
}

export interface ICursorTrailAddonApi {
  readonly enabled: boolean;
}

/**
 * Represents the edges of the cursor in pixel coordinates.
 */
export interface ICursorEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Supported cursor shapes for the trail effect.
 */
export type CursorShape = 'block' | 'bar' | 'underline' | 'outline' | 'none';
