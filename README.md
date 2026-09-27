# SlopLens

Real-time stylometric inspector and heuristic AI writing linter. Detects structural patterns, low burstiness, formulaic transitions, and vocabulary tells characteristic of LLM output.

Zero dependencies. Runs in any modern web browser directly from disk or GitHub Pages.

---

## What SlopLens Checks

Statistical AI detectors rely on stylometrics, perplexity, and sentence length variance. SlopLens runs these audits directly in your browser:

### 1. The 17-23 Word Cadence Trap
LLM text frequently clusters in uniform 18-24 word sentences. SlopLens monitors sentence runs and flags any sequence where three or more consecutive sentences land inside the 17-23 word band.

### 2. Burstiness & Length Variance
Human writing mixes brief fragments with winding compound thoughts. The analyzer measures the sentence length standard deviation and coefficient of variation (CV):
- **CV ≥ 0.50**: Natural human rhythm.
- **CV < 0.35**: Monotonous distribution common in unedited model drafts.
- **Bimodal Alternation**: Detects mechanical alternating between very short (<7 words) and long (>25 words) clauses.

### 3. Sentence Opener Monotony
Checks whether more than half of the sentences in a paragraph open with "The", "This", "It", or "In".

### 4. Dash & Colon Density
- **Em Dash and En Dash**: Zero-dash rule enforcement. Highlights em dashes (`—`) and en dashes (`–`) with instant conversion tools.
- **Colon Density**: Flags elevated colon frequencies (over 2.5 per 300 words).

### 5. High-Frequency Lexicon Tells
- **Significance Puffers**: pivotal, crucial, vital, transformative, profound, testament, enduring, paramount.
- **Analytical Verbs**: underscore, showcase, foster, delve, embark, leverage, facilitate, utilize.
- **Poetic Abstractions**: tapestry, landscape, realm, paradigm, nexus, interplay, mosaic.
- **Promotional Adverbs & Adjectives**: vibrant, seamless, innovative, dynamic, cutting-edge, meticulous.
- **2026 Model Signatures**: "ensuring" as structural padding, "plays a crucial role in", "inherent tensions", and "in essence".
- **Bahasa Indonesia AI Slop**: menelisik, lanskap, fondasi krusial, merupakan bukti nyata, di tengah pesatnya perkembangan.

---

## Getting Started

No build steps, bundlers, or package managers required.

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/IlhamXkyo/slop-lens.git
   cd slop-lens
   ```

2. Open `index.html` in your web browser:
   - On Windows: double click `index.html` or run `start index.html` in PowerShell.
   - On macOS: `open index.html`.
   - On Linux: `xdg-open index.html`.

Or serve it with any static server:
```bash
python -m http.server 8000
# or
npx serve .
```

---

## File Structure

```
slop-lens/
├── index.html        # Interactive workbench markup and dual-layer layout
├── styles.css        # CSS variables, dark/light theme, typography
├── app.js            # Controller, canvas visualizer, quick fixes
├── analyzer.js       # Statistical engine (burstiness, CV, traps, scoring)
├── dictionary.js     # Categorized lexicons, regex rules, suggestions
├── samples.js        # Benchmark sample texts (GPT-5, Claude, Human, ID)
├── DESIGN.md         # Design system specification
├── LICENSE           # MIT License
└── README.md         # Documentation
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
