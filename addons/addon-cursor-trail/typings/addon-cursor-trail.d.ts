/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon } from '@xterm/xterm';

declare module 'xterm-addon-cursor-trail' {
  /**
   * Configuration options for the cursor trail addon.
   */
  export interface ICursorTrailAddonOptions {
    enabled?: boolean;
    trailColor?: string;
    trailOpacity?: number;
    decayFast?: number;
    decaySlow?: number;
    startThreshold?: number;
  }

  /**
   * The cursor trail addon API.
   */
  export interface ICursorTrailAddonApi {
    readonly enabled: boolean;
    trailColor: string;
    trailOpacity: number;
    decayFast: number;
    decaySlow: number;
    startThreshold: number;
  }

  /**
   * CursorTrailAddon implements a kitty-style cursor trail effect for xterm.js.
   */
  export class CursorTrailAddon implements ITerminalAddon, ICursorTrailAddonApi {
    constructor(options?: ICursorTrailAddonOptions);
    activate(terminal: Terminal): void;
    dispose(): void;
    get enabled(): boolean;
    set enabled(value: boolean);
    get trailColor(): string;
    set trailColor(value: string);
    get trailOpacity(): number;
    set trailOpacity(value: number);
    get decayFast(): number;
    set decayFast(value: number);
    get decaySlow(): number;
    set decaySlow(value: number);
    get startThreshold(): number;
    set startThreshold(value: number);
  }
}
