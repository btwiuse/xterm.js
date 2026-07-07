/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { BaseWindow } from './baseWindow';
import type { IControlWindow } from '../controlBar';

export class AddonCursorTrailWindow extends BaseWindow implements IControlWindow {
  public readonly id = 'addon-cursor-trail';
  public readonly label = 'cursor trail';

  public build(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '8px';

    const desc = document.createElement('p');
    desc.textContent = 'Move the cursor to see the trail effect.';
    wrapper.appendChild(desc);

    const info = document.createElement('p');
    info.style.fontSize = '12px';
    info.style.color = '#888';
    info.textContent = 'Trail works with both DOM and WebGL renderers. Use the cursor trail demo page for full controls.';
    wrapper.appendChild(info);

    container.appendChild(wrapper);
  }
}
