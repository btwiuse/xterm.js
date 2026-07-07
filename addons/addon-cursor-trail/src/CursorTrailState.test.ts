/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { strictEqual } from 'assert';
import { CursorTrailState } from './CursorTrailState';

describe('CursorTrailState', () => {
  let state: CursorTrailState;

  beforeEach(() => {
    state = new CursorTrailState();
  });

  describe('update', () => {
    it('should initialize corners to cursor position on first frame', () => {
      state.update(
        0.016,
        { left: 0, right: 10, top: 0, bottom: 20 },
        10,
        0.1,
        0.3,
        1,
        true,
        0.5
      );

      const { corners, opacity, needsRender } = state;
      strictEqual(corners.x[0], 0);   // TL
      strictEqual(corners.x[1], 10);  // TR
      strictEqual(corners.x[2], 10);  // BR
      strictEqual(corners.x[3], 0);   // BL
      strictEqual(corners.y[0], 0);   // TL
      strictEqual(corners.y[1], 0);   // TR
      strictEqual(corners.y[2], 20);  // BR
      strictEqual(corners.y[3], 20);  // BL
      strictEqual(opacity, 0.5);
      strictEqual(state.needsRender, false);
    });

    it('should snap corners when cursor moves below threshold', () => {
      // First frame: initialize
      state.update(0.016, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);

      // Move cursor by 0.5 cells (5px), which is below startThreshold of 1 cell (10px)
      state.update(0.016, { left: 5, right: 15, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);

      const { corners } = state;
      // Should have snapped to new cursor position
      strictEqual(corners.x[0], 5);
      strictEqual(corners.x[1], 15);
      strictEqual(corners.x[2], 15);
      strictEqual(corners.x[3], 5);
      strictEqual(state.needsRender, false);
    });

    it('should chase corners when cursor moves above threshold', () => {
      // First frame: initialize at origin
      state.update(0.016, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);

      // Move cursor by 2 cells (20px), above threshold
      state.update(0.016, { left: 20, right: 30, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);

      const { corners, needsRender } = state;
      // Corners should have moved toward new position but not fully reached
      strictEqual(corners.x[0] > 0 && corners.x[0] < 20, true, 'TL x should have moved');
      strictEqual(corners.x[1] > 10 && corners.x[1] < 30, true, 'TR x should have moved');
      strictEqual(needsRender, true);
    });

    it('should set needsRender to false when all corners reach target', () => {
      // First frame
      state.update(0.016, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);

      // Move and let corners settle
      for (let i = 0; i < 100; i++) {
        state.update(0.016, { left: 20, right: 30, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.5);
      }

      strictEqual(state.needsRender, false);
    });

    it('should fade opacity in when cursor is visible', () => {
      state.update(0.016, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, true, 0.8);
      strictEqual(state.opacity, 0.8);

      // Now hide cursor
      state.update(0.1, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 1, false, 0.8);
      strictEqual(state.opacity < 0.8, true, 'opacity should have decreased');
    });

    it('should snap corners to target when movement is below threshold', () => {
      // First frame
      state.update(0.016, { left: 0, right: 10, top: 0, bottom: 20 }, 10, 0.1, 0.3, 5, true, 0.5);

      // Tiny movement: 1px (0.1 cells), threshold is 5 cells (50px)
      state.update(0.016, { left: 1, right: 11, top: 0, bottom: 20 }, 10, 0.1, 0.3, 5, true, 0.5);

      const { corners } = state;
      strictEqual(corners.x[0], 1);
      strictEqual(corners.x[1], 11);
      strictEqual(corners.x[2], 11);
      strictEqual(corners.x[3], 1);
      strictEqual(state.needsRender, false);
    });
  });
});
