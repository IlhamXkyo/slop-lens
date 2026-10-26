/**
 * SlopLens Application Controller
 * Handles user input, synchronized backdrop rendering, canvas waveform,
 * quick actions, and real-time stylometrics updates.
 */

import { SlopAnalyzer } from './analyzer.js';
import { SAMPLE_TEXTS } from './samples.js';

class SlopLensApp {
  constructor() {
    this.analyzer = new SlopAnalyzer();
    this.debounceTimer = null;
    this.currentAnalysis = null;

    // DOM Elements
    this.editorInput = document.getElementById('editorInput');
    this.backdrop = document.getElementById('backdrop');
    this.highlights = document.getElementById('highlights');
    this.lineGutter = document.getElementById('lineGutter');
    this.sampleSelect = document.getElementById('sampleSelect');
    this.stripDashesBtn = document.getElementById('stripDashesBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.cadenceCanvas = document.getElementById('cadenceCanvas');

    // Statusbar Elements
    this.wordCountStat = document.getElementById('wordCountStat');
    this.sentenceCountStat = document.getElementById('sentenceCountStat');
    this.paragraphCountStat = document.getElementById('paragraphCountStat');
    this.charCountStat = document.getElementById('charCountStat');

    // Telemetry Elements
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.tierDisplay = document.getElementById('tierDisplay');
    this.tierDesc = document.getElementById('tierDesc');
    this.burstinessVal = document.getElementById('burstinessVal');
    this.burstinessStatus = document.getElementById('burstinessStatus');
    this.cadenceTrapVal = document.getElementById('cadenceTrapVal');
    this.cadenceTrapStatus = document.getElementById('cadenceTrapStatus');
    this.dashCountVal = document.getElementById('dashCountVal');
    this.dashStatus = document.getElementById('dashStatus');
    this.colonDensityVal = document.getElementById('colonDensityVal');
    this.colonStatus = document.getElementById('colonStatus');
    this.violationCountBadge = document.getElementById('violationCountBadge');

    // Tabs & Panels
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.violationsList = document.getElementById('violationsList');
    this.structureDetails = document.getElementById('structureDetails');
    this.deductionsList = document.getElementById('deductionsList');

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateGutter();

    // Load initial sample
    this.loadSample('corporate_slop');
  }

  bindEvents() {
    // Editor input & debounced analysis
    this.editorInput.addEventListener('input', () => {
      this.handleInput();
    });

    // Synchronized scrolling
    this.editorInput.addEventListener('scroll', () => {
      this.syncScroll();
    });

    // Sample selection
    this.sampleSelect.addEventListener('change', (e) => {
      this.loadSample(e.target.value);
    });

    // Quick Actions
    this.stripDashesBtn.addEventListener('click', () => {
      this.stripAllDashes();
    });

    this.copyBtn.addEventListener('click', () => {
      this.copyToClipboard();
    });

    this.exportBtn.addEventListener('click', () => {
      this.exportReport();
    });

    this.clearBtn.addEventListener('click', () => {
      this.editorInput.value = '';
      this.handleInput();
    });

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Tab Switching
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab, btn);
      });
    });

    // Window resize -> redraw canvas
    window.addEventListener('resize', () => {
      if (this.currentAnalysis) {
        this.renderCanvasWaveform(this.currentAnalysis.cadence.sentences);
      }
    });
  }

  handleInput() {
    this.updateGutter();

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.runAnalysis();
    }, 120);
  }

  syncScroll() {
    this.backdrop.scrollTop = this.editorInput.scrollTop;
    this.backdrop.scrollLeft = this.editorInput.scrollLeft;
    this.lineGutter.scrollTop = this.editorInput.scrollTop;
  }

  updateGutter() {
    const lines = this.editorInput.value.split('\n').length;
    let gutterHtml = '';
    for (let i = 1; i <= lines; i++) {
      gutterHtml += `${i}<br>`;
    }
    this.lineGutter.innerHTML = gutterHtml;
  }

  updateStatusbarCounts(stats) {
    this.wordCountStat.textContent = stats.wordCount;
    this.sentenceCountStat.textContent = stats.sentenceCount;
    this.paragraphCountStat.textContent = stats.paragraphCount;
    this.charCountStat.textContent = stats.charCount;
  }

  loadSample(key) {
    const sample = SAMPLE_TEXTS[key];
    if (sample) {
      this.editorInput.value = sample.text;
      this.sampleSelect.value = key;
      this.handleInput();
    }
  }

  runAnalysis() {
    const text = this.editorInput.value;
    const result = this.analyzer.analyze(text);
    this.currentAnalysis = result;

    this.updateStatusbarCounts(result.stats);
    this.renderTelemetry(result);
    this.renderHighlights(text, result.violations);
    this.renderCanvasWaveform(result.cadence.sentences);
    this.renderViolationsTab(result.violations);
    this.renderStructureTab(result);
    this.renderDeductionsTab(result.score.deductions);
  }

  renderTelemetry(result) {
    const { stats, punctuation, cadence, score } = result;

    // Score
    this.scoreDisplay.textContent = score.total;
    this.scoreDisplay.style.color = score.color;
    this.tierDisplay.textContent = score.tier;

    if (score.total >= 85) {
      this.tierDesc.textContent = 'High natural burstiness and zero formulaic crutches detected.';
    } else if (score.total >= 60) {
      this.tierDesc.textContent = 'Contains borderline tells or repetitive phrasing that benefit from human editing.';
    } else {
      this.tierDesc.textContent = 'Matches high-probability LLM generation patterns (dashes, uniform rhythm, filler phrases).';
    }

    // Burstiness
    this.burstinessVal.textContent = stats.burstinessCv.toFixed(2);
    this.burstinessStatus.textContent = stats.burstinessGrade;

    // Cadence Traps
    const trapRuns = cadence.traps.length;
    this.cadenceTrapVal.textContent = `${trapRuns} run${trapRuns === 1 ? '' : 's'}`;
    this.cadenceTrapStatus.textContent = trapRuns > 0 ? 'AI Uniform Cadence Flag' : 'Healthy Variation';
    this.cadenceTrapStatus.style.color = trapRuns > 0 ? 'var(--color-danger)' : 'var(--text-muted)';

    // Dashes
    const dashes = punctuation.emDashCount + punctuation.enDashCount;
    this.dashCountVal.textContent = dashes;
    this.dashStatus.textContent = dashes === 0 ? 'Zero Compliant (Strict)' : 'Non-compliant (AI Tell)';
    this.dashStatus.style.color = dashes === 0 ? 'var(--color-success-bright)' : 'var(--color-danger)';

    // Colon Density
    this.colonDensityVal.textContent = punctuation.colonDensityPer300.toFixed(1);
    this.colonStatus.textContent = punctuation.colonDensityPer300 > 2.5 ? 'High (Claude tell)' : 'Normal (<2.5/300w)';

    // Violations badge
    this.violationCountBadge.textContent = result.violations.length;
  }

  renderHighlights(text, violations) {
    if (!text || violations.length === 0) {
      this.highlights.innerHTML = this.escapeHtml(text) + '\n';
      return;
    }

    let html = '';
    let lastIndex = 0;

    violations.forEach(v => {
      if (v.index < lastIndex) return; // avoid overlapping conflicts

      // Append text before violation
      const unflagged = text.substring(lastIndex, v.index);
      html += this.escapeHtml(unflagged);

      // Append highlighted violation
      const violationSnippet = text.substring(v.index, v.index + v.length);
      let markClass = 'violation-puffer';
      if (v.type === 'phrase') markClass = 'violation-phrase';
      else if (v.type === 'punctuation') markClass = 'violation-dash';

      html += `<mark class="${markClass}" data-index="${v.index}">${this.escapeHtml(violationSnippet)}</mark>`;
      lastIndex = v.index + v.length;
    });

    html += this.escapeHtml(text.substring(lastIndex)) + '\n';
    this.highlights.innerHTML = html;
  }

  renderCanvasWaveform(sentences) {
    const canvas = this.cadenceCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth - 16;
    const height = 90;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (sentences.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px ui-monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No sentences to visualize', width / 2, height / 2);
      return;
    }

    const padding = 6;
    const maxBarHeight = height - padding * 2;
    const maxWords = Math.max(...sentences.map(s => s.wordCount), 30);
    const barWidth = Math.max(3, Math.min(24, Math.floor((width - (sentences.length * 3)) / sentences.length)));
    const totalSpacing = (width - (barWidth * sentences.length)) / (sentences.length + 1);

    sentences.forEach((s, i) => {
      const x = totalSpacing + i * (barWidth + totalSpacing);
      const barHeight = Math.max(4, (s.wordCount / maxWords) * maxBarHeight);
      const y = height - padding - barHeight;

      // Color coding based on cadence classification
      if (s.isTrap) {
        ctx.fillStyle = '#f87171'; // Red: in consecutive 17-23w trap run
      } else if (s.wordCount <= 6) {
        ctx.fillStyle = '#38bdf8'; // Cyan: short punchy
      } else if (s.wordCount >= 17 && s.wordCount <= 23) {
        ctx.fillStyle = '#fb923c'; // Orange: in trap zone, but not 3 in a row
      } else if (s.wordCount >= 26) {
        ctx.fillStyle = '#fbbf24'; // Yellow: long sustained
      } else {
        ctx.fillStyle = '#34d399'; // Emerald: normal human length
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    });

    // Draw reference line for the 17-23 word band
    const yTrapTop = height - padding - (23 / maxWords) * maxBarHeight;
    const yTrapBottom = height - padding - (17 / maxWords) * maxBarHeight;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, yTrapTop, width, Math.max(1, yTrapBottom - yTrapTop));
  }

  renderViolationsTab(violations) {
    if (violations.length === 0) {
      this.violationsList.innerHTML = `
        <div class="empty-state">
          No flagged vocabulary or formulaic phrases found. Your prose is clean of known AI patterns.
        </div>
      `;
      return;
    }

    let html = '';
    violations.forEach(v => {
      html += `
        <div class="violation-card severity-${v.severity}">
          <div class="violation-header">
            <span class="violation-target">"${this.escapeHtml(v.matchedText)}"</span>
            <span class="violation-badge">${v.category}</span>
          </div>
          <div class="violation-msg">${this.escapeHtml(v.message)}</div>
          <div class="violation-actions">
            <span class="control-label">Suggested:</span>
            <button class="replace-chip" data-index="${v.index}" data-len="${v.length}" data-suggest="${this.escapeHtml(v.suggest.split(',')[0].trim())}">
              Use "${this.escapeHtml(v.suggest.split(',')[0].trim())}"
            </button>
          </div>
        </div>
      `;
    });

    this.violationsList.innerHTML = html;

    // Attach click listener for suggestion chips
    this.violationsList.querySelectorAll('.replace-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        const len = parseInt(e.target.getAttribute('data-len'), 10);
        const replacement = e.target.getAttribute('data-suggest');
        this.replaceSlice(idx, len, replacement);
      });
    });
  }

  renderStructureTab(result) {
    const { cadence, paragraphs } = result;
    let html = '';

    // Cadence Trap Section
    html += `<div class="section-title">Cadence Uniformity Analysis</div>`;
    if (cadence.traps.length > 0) {
      cadence.traps.forEach((trap, i) => {
        html += `
          <div class="cadence-run-box">
            <strong>Cadence Trap Run #${i + 1} (${trap.length} sentences):</strong>
            <p style="margin-top: 4px; color: var(--text-muted);">
              Sentences clustered at 17-23 words in sequence:
            </p>
            <ul style="margin: 6px 0 0 18px; font-size: 0.8rem;">
              ${trap.map(s => `<li>[${s.length} words] "${this.escapeHtml(s.text.substring(0, 70))}..."</li>`).join('')}
            </ul>
          </div>
        `;
      });
    } else {
      html += `<div class="empty-state" style="padding: 12px;">No 17-23 word cadence trap runs detected. Sentence length variance is healthy.</div>`;
    }

    // Monotonous Paragraph Openers Section
    html += `<div class="section-title" style="margin-top: 14px;">Paragraph Opener Monotony (>50% The/This/It/In)</div>`;
    const openerFlags = paragraphs.filter(p => p.openerFlag !== null);
    if (openerFlags.length > 0) {
      openerFlags.forEach(p => {
        html += `
          <div class="opener-flag-box">
            <strong>Paragraph #${p.index + 1} Flagged:</strong>
            <p style="margin-top: 4px; color: var(--text-muted);">
              ${p.openerFlag.flaggedCount} of ${p.openerFlag.totalSentences} sentences (${p.openerFlag.percentage}%) start with formulaic demonstratives or prepositions (The/This/It/In).
            </p>
          </div>
        `;
      });
    } else {
      html += `<div class="empty-state" style="padding: 12px;">All paragraph sentence openers are diverse.</div>`;
    }

    this.structureDetails.innerHTML = html;
  }

  renderDeductionsTab(deductions) {
    if (deductions.length === 0) {
      this.deductionsList.innerHTML = `
        <div class="empty-state">
          Zero point deductions. Perfect score!
        </div>
      `;
      return;
    }

    let html = '';
    deductions.forEach(d => {
      html += `
        <div class="deduction-item">
          <span>${this.escapeHtml(d.label)}</span>
          <span class="deduction-penalty">-${d.penalty} pts</span>
        </div>
      `;
    });

    this.deductionsList.innerHTML = html;
  }

  replaceSlice(start, length, replacement) {
    const val = this.editorInput.value;
    const newVal = val.substring(0, start) + replacement + val.substring(start + length);
    this.editorInput.value = newVal;
    this.handleInput();
  }

  stripAllDashes() {
    const original = this.editorInput.value;
    // Replace em dash and en dash with comma or period
    const cleaned = original.replace(/\s*[—–]\s*/g, ', ');
    if (cleaned !== original) {
      this.editorInput.value = cleaned;
      this.handleInput();
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.editorInput.value).then(() => {
      const origText = this.copyBtn.innerHTML;
      this.copyBtn.innerHTML = `<span>Copied!</span>`;
      setTimeout(() => {
        this.copyBtn.innerHTML = origText;
      }, 1500);
    });
  }

  exportReport() {
    if (!this.currentAnalysis) return;
    const blob = new Blob([JSON.stringify(this.currentAnalysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sloplens-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleTheme() {
    document.body.classList.toggle('theme-light');
  }

  switchTab(targetTabId, activeBtn) {
    this.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    activeBtn.classList.add('active');
    const targetEl = document.getElementById(targetTabId);
    if (targetEl) targetEl.classList.add('active');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new SlopLensApp();
});
