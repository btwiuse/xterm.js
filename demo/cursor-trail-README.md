# CursorTrail Addon Demo

This demo showcases the `@xterm/addon-cursor-trail` plugin — a kitty-inspired cursor trail effect for xterm.js.

## What it does

When the cursor moves, a translucent quad smoothly chases the cursor position using a four-corner exponential decay animation. Leading corners (in the direction of movement) chase fast, while trailing corners lag behind, creating a smooth elastic trail. The cursor area is cut out so the trail never obscures the cursor itself.

## Starting the demo

1. Build everything:
   ```bash
   npm run build && npm run esbuild
   ```

2. Start the demo server:
   ```bash
   npm start
   ```

3. Open in your browser:
   - Main demo: <http://localhost:3000>
   - CursorTrail demo: <http://localhost:3000/cursor-trail>

## Using the demo

The demo has two parts:

- **Main demo** (`/`) — the full xterm.js demo with all addons. The CursorTrail addon is loaded by default. Look for the banner link "CursorTrail Demo →" to jump to the dedicated demo page.

- **CursorTrail demo** (`/cursor-trail`) — a focused demo page with:
  - A live terminal connected to a shell (move the cursor to see the trail)
  - A control panel on the right to adjust trail settings in real time
  - A code snippet that updates with your current settings

### Controls

| Control | Description |
|---------|-------------|
| **Enable Trail** | Toggle the trail on/off |
| **Trail Color** | Choose the trail color (any CSS color) |
| **Trail Opacity** | Maximum opacity of the trail (0.05 – 1.0) |
| **Decay Fast** | Fast decay time in seconds for leading corners |
| **Decay Slow** | Slow decay time in seconds for trailing corners |
| **Start Threshold** | Minimum cursor movement in cells before the trail activates |

## Using the addon in your project

```bash
bun add @xterm/addon-cursor-trail
```

```typescript
import { Terminal } from '@xterm/xterm';
import { CursorTrailAddon } from '@xterm/addon-cursor-trail';

const term = new Terminal();
term.open(document.getElementById('terminal')!);

const trail = new CursorTrailAddon({
  trailColor: '#cccccc',
  trailOpacity: 0.5,
  decayFast: 0.1,
  decaySlow: 0.3,
  startThreshold: 1
});
term.loadAddon(trail);
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable the trail |
| `trailColor` | `string` | `#cccccc` | CSS color for the trail |
| `trailOpacity` | `number` | `0.5` | Maximum opacity (0 to 1) |
| `decayFast` | `number` | `0.1` | Fast decay time in seconds (leading corners) |
| `decaySlow` | `number` | `0.3` | Slow decay time in seconds (trailing corners) |
| `startThreshold` | `number` | `1` | Minimum cursor movement in cells to activate |

### API

- `trail.enabled` — get/set whether the trail is enabled at runtime

## Supported cursor shapes

- **block** — full cell trail (default)
- **bar** — vertical bar trail matching cursor width
- **underline** — bottom-of-cell trail
- **outline** / **none** — no trail

## Algorithm

The trail uses a four-corner exponential decay animation matching kitty's implementation:

1. Each corner chases its corresponding cursor edge with `step = 1.0 - exp2(-10.0 * dt / decay)`
2. Decay speed is modulated by the dot product of the movement direction and the corner-to-target direction
3. Opacity fades in when visible, out when hidden
4. The cursor region is cut out using evenodd fill
