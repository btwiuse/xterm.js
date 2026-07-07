/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import type { ICursorEdges } from './types';

/**
 * CursorTrailState manages the four corner positions and opacity for the
 * cursor trail animation, faithfully implementing kitty's four-corner
 * exponential decay algorithm.
 */
export class CursorTrailState {
  // Four corners chasing the cursor: 0=TL, 1=TR, 2=BR, 3=BL
  private readonly _cornerX = new Float64Array(4);
  private readonly _cornerY = new Float64Array(4);

  // Previous cursor center, used to compute movement direction
  private _prevCenterX = 0;
  private _prevCenterY = 0;

  // Current trail opacity
  private _opacity = 0;

  // Whether the trail needs to be rendered this frame
  private _needsRender = false;

  // Whether this is the first update frame
  private _isFirstFrame = true;

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
    // Target cursor corners
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
      this._prevCenterX = centerX;
      this._prevCenterY = centerY;
      this._opacity = isCursorVisible ? maxOpacity : 0;
      this._isFirstFrame = false;
      this._needsRender = false;
      return;
    }

    // Movement direction and distance
    const moveDx = centerX - this._prevCenterX;
    const moveDy = centerY - this._prevCenterY;
    const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

    // Start threshold: snap corners to cursor if movement is too small
    if (moveDist < startThreshold * cellWidth) {
      for (let i = 0; i < 4; i++) {
        this._cornerX[i] = targetX[i];
        this._cornerY[i] = targetY[i];
      }
      this._prevCenterX = centerX;
      this._prevCenterY = centerY;
      this._needsRender = false;
      this._updateOpacity(dt, isCursorVisible, maxOpacity);
      return;
    }

    // Normalized movement direction
    const normMoveDx = moveDx / moveDist;
    const normMoveDy = moveDy / moveDist;

    let allClose = true;
    const snapDist = 0.5;

    for (let i = 0; i < 4; i++) {
      const dx = targetX[i] - this._cornerX[i];
      const dy = targetY[i] - this._cornerY[i];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < snapDist) {
        this._cornerX[i] = targetX[i];
        this._cornerY[i] = targetY[i];
        continue;
      }

      allClose = false;

      // Direction from corner to target (normalized)
      const ndx = dx / dist;
      const ndy = dy / dist;

      // Dot product with movement direction
      // dot > 0: corner is in the direction of movement → fast decay
      // dot < 0: corner is against the movement → slow decay
      const dot = normMoveDx * ndx + normMoveDy * ndy;

      // Map dot from [-1, 1] to [0, 1]
      const t = (dot + 1) / 2;
      const decay = decaySlow + (decayFast - decaySlow) * t;

      // Exponential ease-out step
      const step = 1.0 - Math.pow(2, -10.0 * dt / decay);

      this._cornerX[i] += dx * step;
      this._cornerY[i] += dy * step;
    }

    this._needsRender = !allClose;
    this._prevCenterX = centerX;
    this._prevCenterY = centerY;
    this._updateOpacity(dt, isCursorVisible, maxOpacity);
  }

  private _updateOpacity(dt: number, isCursorVisible: boolean, maxOpacity: number): void {
    const fadeSpeed = 10;
    const factor = 1 - Math.exp(-fadeSpeed * dt);
    const target = isCursorVisible ? maxOpacity : 0;
    this._opacity += (target - this._opacity) * factor;
  }
}
