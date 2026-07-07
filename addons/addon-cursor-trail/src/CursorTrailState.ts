/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import type { ICursorEdges } from './types';

/**
 * CursorTrailState manages the four corner positions and opacity for the
 * cursor trail animation, implementing kitty's four-corner exponential
 * decay algorithm.
 *
 * The trail uses four corners that chase the cursor. Each corner's decay
 * speed is dynamically modulated: corners whose movement aligns with their
 * position relative to the cursor center chase faster (leading corners),
 * while corners moving against their position lag behind (trailing corners).
 * This creates an elastic "stretch" effect.
 */
export class CursorTrailState {
  // Four corners chasing the cursor: 0=TL, 1=TR, 2=BR, 3=BL
  private readonly _cornerX = new Float64Array(4);
  private readonly _cornerY = new Float64Array(4);

  // Current trail opacity
  private _opacity = 0;

  // Whether the trail needs to be rendered this frame (with hysteresis,
  // keeping rendering one extra frame after corners settle to avoid flicker)
  private _needsRender = false;

  // Whether this is the first update frame
  private _isFirstFrame = true;

  // Whether the trail was active in the previous frame (non-hysteresis).
  // Used for start threshold guard: once the trail starts, threshold no
  // longer applies until it fully settles.
  private _wasActive = false;

  /**
   * The current corner positions.
   */
  public get corners(): { x: Float64Array; y: Float64Array } {
    return { x: this._cornerX, y: this._cornerY };
  }

  /**
   * The current trail opacity.
   */
  public get opacity(): number {
    return this._opacity;
  }

  /**
   * Whether the trail needs rendering this frame.
   */
  public get needsRender(): boolean {
    return this._needsRender;
  }

  /**
   * Update the trail state for one animation frame.
   *
   * @param dt - Delta time in seconds since the last frame.
   * @param cursorEdges - The current cursor edges in pixel coordinates.
   * @param cellWidth - The width of a single cell in CSS pixels.
   * @param decayFast - Fast decay time in seconds (leading corners).
   * @param decaySlow - Slow decay time in seconds (trailing corners).
   * @param startThreshold - Minimum cursor movement in cells to activate the trail.
   * @param isCursorVisible - Whether the terminal cursor is currently visible.
   * @param maxOpacity - The maximum trail opacity.
   */
  public update(
    dt: number,
    cursorEdges: ICursorEdges,
    cellWidth: number,
    decayFast: number,
    decaySlow: number,
    startThreshold: number,
    isCursorVisible: boolean,
    maxOpacity: number
  ): void {
    // Target cursor corners: [TL, TR, BR, BL]
    const targetX = [cursorEdges.left, cursorEdges.right, cursorEdges.right, cursorEdges.left];
    const targetY = [cursorEdges.top, cursorEdges.top, cursorEdges.bottom, cursorEdges.bottom];

    // Cursor center
    const centerX = (cursorEdges.left + cursorEdges.right) / 2;
    const centerY = (cursorEdges.top + cursorEdges.bottom) / 2;

    if (this._isFirstFrame) {
      for (let i = 0; i < 4; i++) {
        this._cornerX[i] = targetX[i];
        this._cornerY[i] = targetY[i];
      }
      this._opacity = isCursorVisible ? maxOpacity : 0;
      this._isFirstFrame = false;
      this._needsRender = false;
      this._wasActive = false;
      return;
    }

    // Start threshold (kitty's should_skip_cursor_trail_update):
    // Only applies when the trail hasn't started yet (!_wasActive).
    // Checks corner[0] (TL in xterm order) distance to its target in cell units.
    if (!this._wasActive && startThreshold > 0) {
      const cellDx = Math.round(Math.abs(this._cornerX[0] - targetX[0]) / cellWidth);
      const cellDy = Math.round(Math.abs(this._cornerY[0] - targetY[0]) / cellWidth);
      if (cellDx + cellDy <= startThreshold) {
        for (let i = 0; i < 4; i++) {
          this._cornerX[i] = targetX[i];
          this._cornerY[i] = targetY[i];
        }
        this._needsRender = false;
        this._wasActive = false;
        this._updateOpacity(dt, isCursorVisible, maxOpacity);
        return;
      }
    }

    // Cursor diagonal half, used to normalize kitty-style dot product
    const cursorDiag2 = Math.sqrt(
      (cursorEdges.right - cursorEdges.left) ** 2 +
      (cursorEdges.bottom - cursorEdges.top) ** 2
    ) / 2;

    // Compute dx, dy, and kitty-style dot for each corner
    const dx: number[] = [0, 0, 0, 0];
    const dy: number[] = [0, 0, 0, 0];
    const dot: number[] = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      dx[i] = targetX[i] - this._cornerX[i];
      dy[i] = targetY[i] - this._cornerY[i];
      const dist = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);

      if (dist < 1e-6) {
        dx[i] = 0;
        dy[i] = 0;
        dot[i] = 0;
      } else {
        // Kitty-style dot product:
        //   (corner→target) · (center→target_corner) / cursor_diag_2 / |corner→target|
        // This measures how aligned each corner's movement is with its position
        // relative to the cursor center. Leading corners (ahead of movement) get
        // positive dot → fast decay. Trailing corners get negative dot → slow decay.
        dot[i] = (
          dx[i] * (targetX[i] - centerX) +
          dy[i] * (targetY[i] - centerY)
        ) / (cursorDiag2 * dist);
      }
    }

    // Find min/max dot across all corners (kitty cross-corner normalization)
    let minDot = Infinity;
    let maxDot = -Infinity;
    for (let i = 0; i < 4; i++) {
      if (dx[i] !== 0 || dy[i] !== 0) {
        minDot = Math.min(minDot, dot[i]);
        maxDot = Math.max(maxDot, dot[i]);
      }
    }

    // Apply decay per corner
    let allClose = true;
    const snapPx = 0.5;

    for (let i = 0; i < 4; i++) {
      if (dx[i] === 0 && dy[i] === 0) {
        continue;
      }

      const dist = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);
      if (dist < snapPx) {
        this._cornerX[i] = targetX[i];
        this._cornerY[i] = targetY[i];
        continue;
      }

      allClose = false;

      // Kitty-style decay: normalize dot relative to spread across all corners.
      // corner with max_dot → fastest decay (decay_fast)
      // corner with min_dot → slowest decay (decay_slow)
      let decay: number;
      if (minDot === maxDot) {
        decay = decaySlow;
      } else {
        decay = decaySlow + (decayFast - decaySlow) * (dot[i] - minDot) / (maxDot - minDot);
      }

      const step = 1.0 - Math.pow(2, -10.0 * dt / decay);
      this._cornerX[i] += dx[i] * step;
      this._cornerY[i] += dy[i] * step;
    }

    // Kitty-style needs_render hysteresis: keep rendering for one extra frame
    // after corners settle to prevent flickering at the threshold boundary
    this._needsRender = !allClose || this._wasActive;
    this._wasActive = !allClose;

    this._updateOpacity(dt, isCursorVisible, maxOpacity);
  }

  private _updateOpacity(dt: number, isCursorVisible: boolean, maxOpacity: number): void {
    const fadeSpeed = 10;
    const factor = 1 - Math.exp(-fadeSpeed * dt);
    const target = isCursorVisible ? maxOpacity : 0;
    this._opacity += (target - this._opacity) * factor;
  }
}
