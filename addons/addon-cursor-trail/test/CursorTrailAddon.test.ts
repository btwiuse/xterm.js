/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import test from '@playwright/test';
import { deepStrictEqual } from 'assert';
import { ITestContext, createTestContext, openTerminal } from '../../../test/playwright/TestUtils';

let ctx: ITestContext;

test.describe('CursorTrailAddon', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    ctx = await createTestContext(browser);
    await openTerminal(ctx);
  });

  test.afterAll(async () => {
    await ctx.page.evaluate(`
      window.cursorTrailAddon?.dispose();
    `);
    await ctx.page.close();
  });

  test.beforeEach(async () => {
    await ctx.page.evaluate(`
      window.term.reset();
      window.cursorTrailAddon?.dispose();
      window.cursorTrailAddon = new CursorTrailAddon({
        trailColor: '#ff0000',
        trailOpacity: 0.5,
        decayFast: 0.1,
        decaySlow: 0.3,
        startThreshold: 1
      });
      window.term.loadAddon(window.cursorTrailAddon);
    `);
  });

  test('should load without errors', async () => {
    const result = await ctx.page.evaluate(`
      typeof window.cursorTrailAddon
    `);
    deepStrictEqual(result, 'object');
  });

  test('should have default options', async () => {
    const result = await ctx.page.evaluate(`
      (() => {
        const addon = new CursorTrailAddon();
        return {
          enabled: addon.enabled,
          trailColor: addon._options.trailColor,
          trailOpacity: addon._options.trailOpacity,
          decayFast: addon._options.decayFast,
          decaySlow: addon._options.decaySlow,
          startThreshold: addon._options.startThreshold
        };
      })()
    `);
    deepStrictEqual(result, {
      enabled: true,
      trailColor: '#cccccc',
      trailOpacity: 0.5,
      decayFast: 0.1,
      decaySlow: 0.3,
      startThreshold: 1
    });
  });

  test('should allow custom options', async () => {
    const result = await ctx.page.evaluate(`
      (() => {
        const addon = new CursorTrailAddon({
          trailColor: '#00ff00',
          trailOpacity: 0.8,
          decayFast: 0.2,
          decaySlow: 0.5,
          startThreshold: 2,
          enabled: false
        });
        return {
          trailColor: addon._options.trailColor,
          trailOpacity: addon._options.trailOpacity,
          decayFast: addon._options.decayFast,
          decaySlow: addon._options.decaySlow,
          startThreshold: addon._options.startThreshold,
          enabled: addon.enabled
        };
      })()
    `);
    deepStrictEqual(result, {
      trailColor: '#00ff00',
      trailOpacity: 0.8,
      decayFast: 0.2,
      decaySlow: 0.5,
      startThreshold: 2,
      enabled: false
    });
  });

  test('should enable/disable dynamically', async () => {
    await ctx.page.evaluate(`
      window.cursorTrailAddon.enabled = false;
    `);
    let enabled = await ctx.page.evaluate(`
      window.cursorTrailAddon.enabled
    `);
    deepStrictEqual(enabled, false);

    await ctx.page.evaluate(`
      window.cursorTrailAddon.enabled = true;
    `);
    enabled = await ctx.page.evaluate(`
      window.cursorTrailAddon.enabled
    `);
    deepStrictEqual(enabled, true);
  });

  test('should dispose cleanly', async () => {
    await ctx.page.evaluate(`
      window.cursorTrailAddon.dispose();
    `);
    const exists = await ctx.page.evaluate(`
      // After dispose, verify no errors are thrown.
      true
    `);
    deepStrictEqual(exists, true);
  });
});
