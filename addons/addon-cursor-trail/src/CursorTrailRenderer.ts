/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import type { Terminal } from '@xterm/xterm';
import type { ICursorEdges } from './types';

/**
 * CursorTrailRenderer manages the canvas overlay and draws the cursor trail.
 */
export class CursorTrailRenderer {
  private _canvas: HTMLCanvasElement | undefined;
  private _ctx: CanvasRenderingContext2D | undefined;
  private _document: Document;
  private _terminal: Terminal;

  constructor(terminal: Terminal) {
    this._terminal = terminal;
    this._document = this._getDocument();
    this._ensureCanvas();
  }

  /**
   * Resize the canvas to match the terminal dimensions.
   */
  public resize(): void {
    if (!this._terminal.dimensions) {
      return;
    }
    this._ensureCanvas();
    if (this._canvas) {
      this._canvas.width = this._terminal.dimensions.css.canvas.width;
      this._canvas.height = this._terminal.dimensions.css.canvas.height;
    }
  }

  /**
   * Draw the cursor trail for the current frame.
   */
  public draw(
    corners: { x: Float64Array; y: Float64Array },
    cursorEdges: ICursorEdges,
    color: string,
    opacity: number
  ): void {
    if (!this._ctx || opacity < 0.005) {
      return;
    }

    const ctx = this._ctx;
    const canvas = this._canvas;
    if (!canvas) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rgba = this._parseColor(color);

    ctx.beginPath();

    // Outer trail quad (clockwise winding)
    ctx.moveTo(corners.x[0], corners.y[0]);
    ctx.lineTo(corners.x[1], corners.y[1]);
    ctx.lineTo(corners.x[2], corners.y[2]);
    ctx.lineTo(corners.x[3], corners.y[3]);
    ctx.closePath();

    // Inner cursor cutout (reverse winding for evenodd hole)
    ctx.moveTo(cursorEdges.right, cursorEdges.top);
    ctx.lineTo(cursorEdges.left, cursorEdges.top);
    ctx.lineTo(cursorEdges.left, cursorEdges.bottom);
    ctx.lineTo(cursorEdges.right, cursorEdges.bottom);
    ctx.closePath();

    ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${opacity})`;
    ctx.fill('evenodd');
  }

  /**
   * Clear the trail canvas.
   */
  public clear(): void {
    if (!this._ctx || !this._canvas) {
      return;
    }
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  /**
   * Remove the canvas and dispose resources.
   */
  public dispose(): void {
    this._canvas?.remove();
    this._canvas = undefined;
    this._ctx = undefined;
  }

  private _ensureCanvas(): void {
    if (this._canvas) {
      return;
    }

    const screenElement = (this._terminal as any)._core?.screenElement;
    if (!screenElement || !this._terminal.dimensions) {
      return;
    }

    const canvas = this._document.createElement('canvas');
    canvas.width = this._terminal.dimensions.css.canvas.width;
    canvas.height = this._terminal.dimensions.css.canvas.height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    // Use isolation on the screen element to create a stacking context,
    // matching the pattern used by the image addon.
    screenElement.style.isolation = 'isolate';
    screenElement.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      canvas.remove();
      return;
    }

    this._canvas = canvas;
    this._ctx = ctx;
  }

  private _getDocument(): Document {
    try {
      return (this._terminal as any)._core?.document ?? document;
    } catch {
      return document;
    }
  }

  private _parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
      }
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
    }
    // Fallback: light gray
    return { r: 204, g: 204, b: 204 };
  }
}
