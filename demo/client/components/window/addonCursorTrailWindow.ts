/**
 * Copyright (c) 2024 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { BaseWindow } from './baseWindow';
import type { IControlWindow } from '../controlBar';

export class AddonCursorTrailWindow extends BaseWindow implements IControlWindow {
  public readonly id = 'addon-cursor-trail';
  public readonly label = 'cursor trail';

  private _trail: any;
  private _enabledCheckbox!: HTMLInputElement;
  private _colorInput!: HTMLInputElement;
  private _opacityInput!: HTMLInputElement;
  private _opacityValue!: HTMLElement;
  private _decayFastInput!: HTMLInputElement;
  private _decayFastValue!: HTMLElement;
  private _decaySlowInput!: HTMLInputElement;
  private _decaySlowValue!: HTMLElement;
  private _thresholdInput!: HTMLInputElement;
  private _thresholdValue!: HTMLElement;

  public build(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';

    this._enabledCheckbox = document.createElement('input');
    this._enabledCheckbox.type = 'checkbox';
    this._enabledCheckbox.checked = true;
    const enabledLabel = document.createElement('label');
    enabledLabel.appendChild(this._enabledCheckbox);
    enabledLabel.appendChild(document.createTextNode('Enable trail'));
    wrapper.appendChild(enabledLabel);

    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Trail color';
    this._colorInput = document.createElement('input');
    this._colorInput.type = 'color';
    this._colorInput.value = '#cccccc';
    colorLabel.appendChild(this._colorInput);
    wrapper.appendChild(colorLabel);

    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = 'Trail opacity';
    this._opacityInput = document.createElement('input');
    this._opacityInput.type = 'range';
    this._opacityInput.min = '0.05';
    this._opacityInput.max = '1';
    this._opacityInput.step = '0.05';
    this._opacityInput.value = '0.5';
    this._opacityValue = document.createElement('span');
    this._opacityValue.textContent = '0.5';
    opacityLabel.appendChild(this._opacityInput);
    opacityLabel.appendChild(this._opacityValue);
    wrapper.appendChild(opacityLabel);

    const decayFastLabel = document.createElement('label');
    decayFastLabel.textContent = 'Decay fast (leading corners)';
    this._decayFastInput = document.createElement('input');
    this._decayFastInput.type = 'range';
    this._decayFastInput.min = '0.05';
    this._decayFastInput.max = '1';
    this._decayFastInput.step = '0.05';
    this._decayFastInput.value = '0.1';
    this._decayFastValue = document.createElement('span');
    this._decayFastValue.textContent = '0.1';
    decayFastLabel.appendChild(this._decayFastInput);
    decayFastLabel.appendChild(this._decayFastValue);
    wrapper.appendChild(decayFastLabel);

    const decaySlowLabel = document.createElement('label');
    decaySlowLabel.textContent = 'Decay slow (trailing corners)';
    this._decaySlowInput = document.createElement('input');
    this._decaySlowInput.type = 'range';
    this._decaySlowInput.min = '0.05';
    this._decaySlowInput.max = '1';
    this._decaySlowInput.step = '0.05';
    this._decaySlowInput.value = '0.3';
    this._decaySlowValue = document.createElement('span');
    this._decaySlowValue.textContent = '0.3';
    decaySlowLabel.appendChild(this._decaySlowInput);
    decaySlowLabel.appendChild(this._decaySlowValue);
    wrapper.appendChild(decaySlowLabel);

    const thresholdLabel = document.createElement('label');
    thresholdLabel.textContent = 'Start threshold (cells)';
    this._thresholdInput = document.createElement('input');
    this._thresholdInput.type = 'range';
    this._thresholdInput.min = '0';
    this._thresholdInput.max = '5';
    this._thresholdInput.step = '1';
    this._thresholdInput.value = '1';
    this._thresholdValue = document.createElement('span');
    this._thresholdValue.textContent = '1';
    thresholdLabel.appendChild(this._thresholdInput);
    thresholdLabel.appendChild(this._thresholdValue);
    wrapper.appendChild(thresholdLabel);

    container.appendChild(wrapper);
  }

  public setTrail(trail: any): void {
    this._trail = trail;
    if (!trail) { return; }

    this._enabledCheckbox.checked = trail.enabled;
    this._colorInput.value = trail.trailColor;
    this._opacityInput.value = String(trail.trailOpacity);
    this._opacityValue.textContent = String(trail.trailOpacity);
    this._decayFastInput.value = String(trail.decayFast);
    this._decayFastValue.textContent = String(trail.decayFast);
    this._decaySlowInput.value = String(trail.decaySlow);
    this._decaySlowValue.textContent = String(trail.decaySlow);
    this._thresholdInput.value = String(trail.startThreshold);
    this._thresholdValue.textContent = String(trail.startThreshold);

    const update = () => {
      if (!this._trail) { return; }
      this._trail.enabled = this._enabledCheckbox.checked;
      this._trail.trailColor = this._colorInput.value;
      this._trail.trailOpacity = parseFloat(this._opacityInput.value);
      this._opacityValue.textContent = this._opacityInput.value;
      this._trail.decayFast = parseFloat(this._decayFastInput.value);
      this._decayFastValue.textContent = this._decayFastInput.value;
      this._trail.decaySlow = parseFloat(this._decaySlowInput.value);
      this._decaySlowValue.textContent = this._decaySlowInput.value;
      this._trail.startThreshold = parseFloat(this._thresholdInput.value);
      this._thresholdValue.textContent = this._thresholdInput.value;
    };

    this._enabledCheckbox.addEventListener('change', update);
    this._colorInput.addEventListener('input', update);
    this._opacityInput.addEventListener('input', update);
    this._decayFastInput.addEventListener('input', update);
    this._decaySlowInput.addEventListener('input', update);
    this._thresholdInput.addEventListener('input', update);
  }
}
