# @xterm/addon-cursor-trail

A kitty-inspired cursor trail addon for xterm.js. When the cursor moves, a
translucent quad with rounded corners smoothly chases the cursor position,
fading out behind it.

## Features

- Four-corner exponential decay animation matching kitty's cursor trail
- Dynamic decay speed based on movement direction (leading corners chase fast,
  trailing corners lag)
- Opacity fades in when the cursor is visible and out when hidden
- Cursor area is cut out so the trail never obscures the cursor itself
- Supports `block`, `bar`, and `underline` cursor shapes
- Configurable trail color, opacity, decay times, and activation threshold
- Canvas 2D overlay that works with both DOM and WebGL renderers

## Installation

```bash
bun add @xterm/addon-cursor-trail
```

## Usage

```typescript
import { Terminal } from '@xterm/xterm';
import { CursorTrailAddon } from '@xterm/addon-cursor-trail';

const terminal = new Terminal();
terminal.open(document.getElementById('terminal')!);

const trail = new CursorTrailAddon({
  trailColor: '#888888',
  trailOpacity: 0.4,
  decayFast: 0.1,
  decaySlow: 0.3,
  startThreshold: 1
});
terminal.loadAddon(trail);
```

## API

### `new CursorTrailAddon(options?: ICursorTrailAddonOptions)`

| Option             | Type      | Default | Description                                                  |
|--------------------|-----------|---------|--------------------------------------------------------------|
| `enabled`          | `boolean` | `true`  | Enable or disable the trail                                  |
| `trailColor`       | `string`  | `#cccccc` | CSS color for the trail                                    |
| `trailOpacity`     | `number`  | `0.5`   | Maximum opacity of the trail (0 to 1)                        |
| `decayFast`        | `number`  | `0.1`   | Fast decay time in seconds (leading corners)                 |
| `decaySlow`        | `number`  | `0.3`   | Slow decay time in seconds (trailing corners)                |
| `startThreshold`   | `number`  | `1`     | Minimum cursor movement in cells before the trail activates  |

### `trail.enabled`

Enable or disable the trail at runtime.

## License

MIT
