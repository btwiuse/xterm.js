/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import type { Terminal, ITerminalAddon, IDisposable } from '@xterm/xterm';
import type { ICursorTrailAddonOptions, ICursorTrailAddonApi, ICursorEdges, CursorShape } from './types';
import { CursorTrailState } from './CursorTrailState';
import { CursorTrailRenderer } from './CursorTrailRenderer';
import { Disposable, MutableDisposable, toDisposable } from 'common/Lifecycle';

/**
 * CursorTrailAddon implements a kitty-style cursor trail effect for xterm.js.
 *
 * The trail uses a four-corner exponential decay animation where each corner
 * chases its corresponding cursor edge. The decay speed is dynamically modulated
 * by a dot product of the movement direction so leading corners chase faster
 * and trailing corners lag behind, creating a smooth elastic trail.
 */
export class CursorTrailAddon extends Disposable implements ITerminalAddon, ICursorTrailAddonApi {
  private _terminal: Terminal | undefined;
  private _renderer: CursorTrailRenderer | undefined;
  private _state: CursorTrailState | undefined;
  private _animationFrame: number | undefined;
  private _lastTime = 0;
  private _options: Required<ICursorTrailAddonOptions>;

  constructor(options?: ICursorTrailAddonOptions) {
    super();
    this._options = {
      enabled: options?.enabled ?? true,
      trailColor: options?.trailColor ?? '#cccccc',
      trailOpacity: options?.trailOpacity ?? 0.5,
      decayFast: options?.decayFast ?? 0.1,
      decaySlow: options?.decaySlow ?? 0.3,
      startThreshold: options?.startThreshold ?? 1
    };
  }

  public get enabled(): boolean {
    return this._options.enabled;
  }

  public set enabled(value: boolean) {
    this._options.enabled = value;
    if (value) {
      this._startAnimation();
    } else {
      this._cancelAnimation();
      this._renderer?.clear();
    }
  }

  public activate(terminal: Terminal): void {
    this._terminal = terminal;
    this._renderer = new CursorTrailRenderer(terminal);
    this._state = new CursorTrailState();
    this._lastTime = performance.now();

    this._register(this._terminal.onResize(() => {
      this._renderer?.resize();
    }));

    this._register(toDisposable(() => {
      this._cancelAnimation();
      this._renderer?.dispose();
    }));

    if (this._options.enabled) {
      this._startAnimation();
    }
  }

  public dispose(): void {
    this._cancelAnimation();
    super.dispose();
  }

  private _cancelAnimation(): void {
    if (this._animationFrame !== undefined) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = undefined;
    }
  }

  private _startAnimation(): void {
    if (this._animationFrame !== undefined) {
      return;
    }

    const loop = (time: number): void => {
      const dt = (time - this._lastTime) / 1000;
      this._lastTime = time;

      // Skip if tab was backgrounded (dt > 1s) or dt is zero
      if (dt > 0 && dt < 1) {
        this._update(dt);
      }

      this._animationFrame = requestAnimationFrame(loop);
    };

    this._animationFrame = requestAnimationFrame(loop);
  }

  private _update(dt: number): void {
    if (!this._terminal || !this._state || !this._renderer) {
      return;
    }

    const dims = this._terminal.dimensions;
    if (!dims || dims.css.cell.width <= 0 || dims.css.cell.height <= 0) {
      return;
    }

    const cellW = dims.css.cell.width;
    const cellH = dims.css.cell.height;

    // Ensure canvas exists (terminal may not have been open yet)
    this._renderer.resize();

    const cursorX = this._terminal.buffer.active.cursorX;
    const cursorY = this._terminal.buffer.active.cursorY;

    const cursorStyle = this._getCursorStyle();
    if (cursorStyle === 'none' || cursorStyle === 'outline') {
      this._renderer.clear();
      return;
    }

    const edges = this._computeCursorEdges(cursorX, cursorY, cursorStyle, cellW, cellH);
    const isCursorVisible = this._getIsCursorVisible();

    this._state.update(
      dt,
      edges,
      cellW,
      this._options.decayFast,
      this._options.decaySlow,
      this._options.startThreshold,
      isCursorVisible,
      this._options.trailOpacity
    );

    if (this._state.needsRender) {
      this._renderer.draw(
        this._state.corners,
        edges,
        this._options.trailColor,
        this._state.opacity
      );
    } else {
      this._renderer.clear();
    }
  }

  private _getCursorStyle(): CursorShape {
    // Try to get the active cursor style from the core service first.
    // DEC private mode cursorStyle can override the options cursorStyle.
    try {
      const coreService = (this._terminal as any)._core?._coreService;
      if (coreService?.decPrivateModes?.cursorStyle) {
        return coreService.decPrivateModes.cursorStyle;
      }
    } catch {
      // fall through
    }
    return (this._terminal!.options.cursorStyle as CursorShape) ?? 'block';
  }

  private _getIsCursorVisible(): boolean {
    try {
      const coreService = (this._terminal as any)._core?._coreService;
      if (coreService?.isCursorHidden !== undefined) {
        return !coreService.isCursorHidden;
      }
    } catch {
      // fall through
    }
    return true;
  }

  private _computeCursorEdges(
    cursorX: number,
    cursorY: number,
    style: string,
    cellW: number,
    cellH: number
  ): ICursorEdges {
    const left = cursorX * cellW;
    const right = (cursorX + 1) * cellW;
    const top = cursorY * cellH;
    const bottom = (cursorY + 1) * cellH;

    switch (style) {
      case 'bar': {
        const cursorWidth = this._terminal!.options.cursorWidth ?? 1;
        return { left, right: left + cursorWidth, top, bottom };
      }
      case 'underline': {
        // The underline cursor occupies a thin line at the bottom of the cell.
        // We use 2px to match typical terminal underline cursor thickness.
        const underlineHeight = 2;
        return { left, right, top: bottom - underlineHeight, bottom };
      }
      default:
        // block, outline: fill the entire cell
        return { left, right, top, bottom };
    }
  }
}
