# SlopLens Design System Specification

## 1. Vision & Core Philosophy

SlopLens is an editorial instrument designed for writers, editors, and researchers to audit prose for statistical tells characteristic of LLM generation (2025-2026 models).

The aesthetic departs from generic AI dashboards. It adopts the visual language of an analytical workbench:
- Monospaced numeric telemetry paired with readable serif prose.
- High contrast status signaling with minimal decorative noise.
- Deterministic, client-side execution with instantaneous visual feedback.

---

## 2. Color Palette & Semantics

| Token | Hex (Dark) | Hex (Light) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#0d1117` | `#f6f8fa` | Canvas foundation |
| `--bg-surface` | `#161b22` | `#ffffff` | Editor panels and toolbars |
| `--bg-surface-elevated`| `#21262d` | `#eaeef2` | Cards, buttons, inputs |
| `--border-color` | `#30363d` | `#d0d7de` | Structural grids and boundaries |
| `--text-bright` | `#f0f6fc` | `#1f2328` | Primary headings and metrics |
| `--text-main` | `#c9d1d9` | `#24292f` | Body prose and active text |
| `--text-muted` | `#8b949e` | `#57606a` | Labels and secondary context |
| `--color-success-bright`| `#3fb950` | `#1a7f37` | Human burstiness score (85-100) |
| `--color-warning` | `#d29922` | `#9a6700` | Borderline tells (60-84) |
| `--color-danger` | `#f85149` | `#cf222e` | High-probability AI tells (0-59) |
| `--color-info` | `#58a6ff` | `#0969da` | Focus highlights and actions |

---

## 3. Typography Architecture

- **Prose Reading Area**: System Serif stack (`"Charter", "Bitstream Charter", "Sitka Text", "Cambria", serif`) to maximize human readability and rhythm inspection.
- **Data & Telemetry**: Monospaced font stack (`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`) for sentence counts, standard deviations, and coefficients of variation.
- **Control Interface**: Neutral sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`).

---

## 4. Architectural Components

### 4.1 Synchronized Dual-Layer Editor
- Base layer (`.backdrop`): Contains `<mark>` tokens reflecting flagged violations in exact string coordinates.
- Top layer (`#editorInput`): Transparent `textarea` with caret synchronization and identical typographic metrics (`line-height: 1.6`, font size, padding).
- Line Gutter (`#lineGutter`): Dynamically computed line numbering synchronized on scroll.

### 4.2 Burstiness Waveform Canvas
- Visualizes sentence length variations across the text.
- Renders each sentence as a distinct vertical bar.
- Color codes sentence classes:
  - Punchy short sentences (≤ 6 words): Cyan.
  - Normal human variation (7-16 words, 24-25 words): Emerald green.
  - The AI Cadence Trap (17-23 words): Highlighted in red if 3 or more occur in sequence.
  - Extended sentences (≥ 26 words): Amber.

---

## 5. Responsiveness & Performance

- **Zero External Runtime Dependencies**: Pure vanilla JavaScript (ES modules) and native Canvas API.
- **Low-Latency Input Loop**: 120ms debounce on input analysis to guarantee 60fps responsive typing.
- **Zero Dash Rule Compliance**: Complete ban on em dashes (`—`) and en dashes (`–`) across all user interfaces and text displays.
