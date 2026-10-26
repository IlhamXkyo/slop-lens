/**
 * Stylometric and Linguistic Analysis Engine
 * Calculates burstiness, sentence length distribution, cadence traps,
 * lexical diversity, dash/colon density, and rule violations.
 */

import { VOCABULARY_RULES, PHRASE_PATTERNS, INDONESIAN_RULES } from './dictionary.js';

export class SlopAnalyzer {
  constructor() {
    this.cachedResult = null;
  }

  analyze(text) {
    if (!text || text.trim().length === 0) {
      return this.getEmptyResult();
    }

    const cleanedText = text.trim();
    const paragraphs = this.extractParagraphs(cleanedText);
    const sentences = this.extractSentences(cleanedText);
    const words = this.extractWords(cleanedText);

    const lengthStats = this.calculateSentenceLengthStats(sentences);
    const burstiness = this.calculateBurstiness(lengthStats);
    const cadenceTraps = this.findCadenceTraps(sentences);
    const bimodalRisk = this.checkBimodalRhythm(sentences);
    const openerFlags = this.checkParagraphOpeners(paragraphs);
    const punctuationStats = this.analyzePunctuation(cleanedText, words.length);
    const lexicalStats = this.calculateLexicalDiversity(words);
    const violations = this.detectViolations(cleanedText);

    const score = this.calculateCompositeScore({
      lengthStats,
      burstiness,
      cadenceTraps,
      bimodalRisk,
      openerFlags,
      punctuationStats,
      lexicalStats,
      violations,
      wordCount: words.length
    });

    return {
      text: cleanedText,
      stats: {
        paragraphCount: paragraphs.length,
        sentenceCount: sentences.length,
        wordCount: words.length,
        charCount: cleanedText.length,
        meanSentenceLength: lengthStats.mean,
        sentenceLengthStdDev: lengthStats.stdDev,
        burstinessCv: burstiness.coefficientOfVariation,
        burstinessGrade: burstiness.grade,
        ttr: lexicalStats.ttr,
        hapaxLegomenaCount: lexicalStats.hapaxCount
      },
      punctuation: punctuationStats,
      cadence: {
        sentences: sentences.map((s, idx) => ({
          index: idx,
          text: s,
          wordCount: this.extractWords(s).length,
          isTrap: cadenceTraps.indices.has(idx),
          isVeryShort: this.extractWords(s).length <= 6,
          isLong: this.extractWords(s).length >= 26
        })),
        traps: cadenceTraps.runs,
        bimodalDetected: bimodalRisk.detected,
        bimodalRatio: bimodalRisk.ratio
      },
      paragraphs: paragraphs.map((p, idx) => ({
        index: idx,
        text: p,
        sentenceCount: this.extractSentences(p).length,
        openerFlag: openerFlags.find(f => f.paragraphIndex === idx) || null
      })),
      violations,
      score
    };
  }

  getEmptyResult() {
    return {
      text: '',
      stats: {
        paragraphCount: 0,
        sentenceCount: 0,
        wordCount: 0,
        charCount: 0,
        meanSentenceLength: 0,
        sentenceLengthStdDev: 0,
        burstinessCv: 0,
        burstinessGrade: 'N/A',
        ttr: 0,
        hapaxLegomenaCount: 0
      },
      punctuation: {
        emDashCount: 0,
        enDashCount: 0,
        colonCount: 0,
        semicolonCount: 0,
        colonDensityPer300: 0
      },
      cadence: {
        sentences: [],
        traps: [],
        bimodalDetected: false,
        bimodalRatio: 0
      },
      paragraphs: [],
      violations: [],
      score: {
        total: 100,
        tier: 'Clean',
        color: '#10b981',
        deductions: []
      }
    };
  }

  extractParagraphs(text) {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }

  extractSentences(text) {
    // Regex matches sentence boundaries while respecting common initials/abbreviations
    const raw = text.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g) || [];
    return raw.map(s => s.trim()).filter(s => s.length > 0);
  }

  extractWords(text) {
    const tokens = text.match(/[\p{L}\p{N}'-]+/gu) || [];
    return tokens.map(t => t.toLowerCase());
  }

  calculateSentenceLengthStats(sentences) {
    if (sentences.length === 0) return { lengths: [], mean: 0, stdDev: 0 };

    const lengths = sentences.map(s => this.extractWords(s).length);
    const sum = lengths.reduce((acc, l) => acc + l, 0);
    const mean = sum / lengths.length;

    const variance = lengths.reduce((acc, l) => acc + Math.pow(l - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    return { lengths, mean: parseFloat(mean.toFixed(1)), stdDev: parseFloat(stdDev.toFixed(2)) };
  }

  calculateBurstiness(stats) {
    if (stats.mean === 0) {
      return { coefficientOfVariation: 0, grade: 'Uniform' };
    }
    const cv = stats.stdDev / stats.mean;
    let grade = 'Moderate';
    if (cv >= 0.55) grade = 'High (Human)';
    else if (cv >= 0.38) grade = 'Natural';
    else if (cv >= 0.25) grade = 'Monotonous';
    else grade = 'Extremely Flat (AI tell)';

    return { coefficientOfVariation: parseFloat(cv.toFixed(3)), grade };
  }

  findCadenceTraps(sentences) {
    // AI Cadence Trap: 3 or more consecutive sentences inside 17-23 words band
    const runs = [];
    const indices = new Set();
    let currentRun = [];

    sentences.forEach((sentence, idx) => {
      const len = this.extractWords(sentence).length;
      if (len >= 17 && len <= 23) {
        currentRun.push({ index: idx, length: len, text: sentence });
      } else {
        if (currentRun.length >= 3) {
          runs.push([...currentRun]);
          currentRun.forEach(item => indices.add(item.index));
        }
        currentRun = [];
      }
    });

    if (currentRun.length >= 3) {
      runs.push([...currentRun]);
      currentRun.forEach(item => indices.add(item.index));
    }

    return { runs, indices };
  }

  checkBimodalRhythm(sentences) {
    // 2026 Claude pattern: mechanical alternation of very short with very long
    if (sentences.length < 6) return { detected: false, ratio: 0 };

    const lengths = sentences.map(s => this.extractWords(s).length);
    let alternations = 0;

    for (let i = 0; i < lengths.length - 1; i++) {
      const isShortFirst = lengths[i] <= 7 && lengths[i + 1] >= 24;
      const isLongFirst = lengths[i] >= 24 && lengths[i + 1] <= 7;
      if (isShortFirst || isLongFirst) {
        alternations++;
      }
    }

    const ratio = alternations / (lengths.length - 1);
    return {
      detected: ratio >= 0.45 && lengths.length >= 8,
      ratio: parseFloat(ratio.toFixed(2))
    };
  }

  checkParagraphOpeners(paragraphs) {
    const flags = [];
    const forbiddenStarters = /^(the|this|it|in|namun|dengan|oleh karena itu)\b/i;

    paragraphs.forEach((p, idx) => {
      const sentences = this.extractSentences(p);
      if (sentences.length < 2) return;

      let flaggedCount = 0;
      sentences.forEach(s => {
        const firstWordMatch = s.trim().match(/^([a-zA-Z\u00C0-\u017F]+)/);
        if (firstWordMatch && forbiddenStarters.test(firstWordMatch[1])) {
          flaggedCount++;
        }
      });

      const percentage = (flaggedCount / sentences.length) * 100;
      if (percentage >= 50 && flaggedCount >= 2) {
        flags.push({
          paragraphIndex: idx,
          flaggedCount,
          totalSentences: sentences.length,
          percentage: Math.round(percentage)
        });
      }
    });

    return flags;
  }

  analyzePunctuation(text, totalWords) {
    const emDashMatches = text.match(/—/g) || [];
    const enDashMatches = text.match(/–/g) || [];
    const colonMatches = text.match(/:/g) || [];
    const semicolonMatches = text.match(/;/g) || [];

    const colonDensity = totalWords > 0 ? (colonMatches.length / totalWords) * 300 : 0;

    return {
      emDashCount: emDashMatches.length,
      enDashCount: enDashMatches.length,
      colonCount: colonMatches.length,
      semicolonCount: semicolonMatches.length,
      colonDensityPer300: parseFloat(colonDensity.toFixed(2))
    };
  }

  calculateLexicalDiversity(words) {
    if (words.length === 0) return { ttr: 0, hapaxCount: 0 };

    const freqMap = new Map();
    words.forEach(w => {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    });

    let hapaxCount = 0;
    freqMap.forEach(count => {
      if (count === 1) hapaxCount++;
    });

    const uniqueCount = freqMap.size;
    const ttr = uniqueCount / words.length;

    return {
      ttr: parseFloat(ttr.toFixed(3)),
      hapaxCount,
      uniqueWords: uniqueCount
    };
  }

  detectViolations(text) {
    const violations = [];

    // 1. Vocabulary Rules
    VOCABULARY_RULES.forEach(group => {
      group.terms.forEach(termObj => {
        const regex = new RegExp(`\\b${termObj.word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          violations.push({
            type: 'vocabulary',
            category: group.category,
            severity: group.severity,
            matchedText: match[0],
            index: match.index,
            length: match[0].length,
            suggest: termObj.suggest,
            message: `${group.description} Suggestion: "${termObj.suggest}".`
          });
        }
      });
    });

    // 2. Phrase Patterns
    PHRASE_PATTERNS.forEach(pattern => {
      let match;
      pattern.regex.lastIndex = 0;
      while ((match = pattern.regex.exec(text)) !== null) {
        violations.push({
          type: 'phrase',
          category: pattern.name,
          severity: pattern.severity,
          matchedText: match[0],
          index: match.index,
          length: match[0].length,
          suggest: pattern.suggest,
          message: pattern.message
        });
      }
    });

    // 3. Indonesian Specific Rules
    INDONESIAN_RULES.forEach(ruleItem => {
      if (ruleItem.terms) {
        ruleItem.terms.forEach(termObj => {
          const regex = new RegExp(`\\b${termObj.word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'vocabulary',
              category: ruleItem.category,
              severity: ruleItem.severity,
              matchedText: match[0],
              index: match.index,
              length: match[0].length,
              suggest: termObj.suggest,
              message: `Kata slop AI Bahasa Indonesia. Saran pengganti: "${termObj.suggest}".`
            });
          }
        });
      } else if (ruleItem.regex) {
        let match;
        ruleItem.regex.lastIndex = 0;
        while ((match = ruleItem.regex.exec(text)) !== null) {
          violations.push({
            type: 'phrase',
            category: ruleItem.name,
            severity: ruleItem.severity,
            matchedText: match[0],
            index: match.index,
            length: match[0].length,
            suggest: ruleItem.suggest,
            message: ruleItem.message
          });
        }
      }
    });

    // 4. Em and En Dashes
    const dashRegex = /[—–]/g;
    let dashMatch;
    while ((dashMatch = dashRegex.exec(text)) !== null) {
      const isEm = dashMatch[0] === '—';
      violations.push({
        type: 'punctuation',
        category: isEm ? 'Em Dash (—)' : 'En Dash (–)',
        severity: 'high',
        matchedText: dashMatch[0],
        index: dashMatch.index,
        length: 1,
        suggest: 'Use period (split sentence), comma, parentheses, or colon.',
        message: `Strict zero-dash rule violated. Remove '${dashMatch[0]}' and replace with natural punctuation.`
      });
    }

    // Sort violations in order of appearance
    violations.sort((a, b) => a.index - b.index);

    return violations;
  }

  calculateCompositeScore({
    burstiness,
    cadenceTraps,
    bimodalRisk,
    openerFlags,
    punctuationStats,
    lexicalStats,
    violations,
    wordCount
  }) {
    if (wordCount < 15) {
      return {
        total: 100,
        tier: 'Insufficient Text',
        color: '#6b7280',
        deductions: []
      };
    }

    let score = 100;
    const deductions = [];

    // Dashes penalty (-10 each up to -35)
    const totalDashes = punctuationStats.emDashCount + punctuationStats.enDashCount;
    if (totalDashes > 0) {
      const dashPenalty = Math.min(35, totalDashes * 10);
      score -= dashPenalty;
      deductions.push({
        label: `${totalDashes} Em/En Dash(es) Found`,
        penalty: dashPenalty,
        severity: 'high'
      });
    }

    // AI Cadence Trap runs (-15 per run up to -30)
    if (cadenceTraps.runs.length > 0) {
      const trapPenalty = Math.min(30, cadenceTraps.runs.length * 15);
      score -= trapPenalty;
      deductions.push({
        label: `${cadenceTraps.runs.length} AI Cadence Trap Run(s) (17-23 words streak)`,
        penalty: trapPenalty,
        severity: 'high'
      });
    }

    // Bimodal rhythm penalty
    if (bimodalRisk.detected) {
      score -= 15;
      deductions.push({
        label: 'Mechanical Bimodal Rhythm (Seesaw alternation)',
        penalty: 15,
        severity: 'medium'
      });
    }

    // Low burstiness penalty
    if (burstiness.coefficientOfVariation < 0.22) {
      score -= 20;
      deductions.push({
        label: `Flat Burstiness (CV: ${burstiness.coefficientOfVariation})`,
        penalty: 20,
        severity: 'high'
      });
    } else if (burstiness.coefficientOfVariation < 0.35) {
      score -= 10;
      deductions.push({
        label: `Low Burstiness Variation (CV: ${burstiness.coefficientOfVariation})`,
        penalty: 10,
        severity: 'medium'
      });
    }

    // Colon density penalty (> 2.5 per 300 words)
    if (punctuationStats.colonDensityPer300 > 2.5 && punctuationStats.colonCount >= 3) {
      score -= 12;
      deductions.push({
        label: `Elevated Colon Density (${punctuationStats.colonDensityPer300} / 300 words)`,
        penalty: 12,
        severity: 'medium'
      });
    }

    // Monotonous sentence openers (-8 per flagged paragraph)
    if (openerFlags.length > 0) {
      const openerPenalty = Math.min(24, openerFlags.length * 8);
      score -= openerPenalty;
      deductions.push({
        label: `${openerFlags.length} Paragraph(s) with Monotonous Openers (>50% The/This/It/In)`,
        penalty: openerPenalty,
        severity: 'medium'
      });
    }

    // Lexical / Phrase violations
    let highViolations = 0;
    let medViolations = 0;

    violations.forEach(v => {
      if (v.type !== 'punctuation') {
        if (v.severity === 'high') highViolations++;
        else medViolations++;
      }
    });

    if (highViolations > 0) {
      const highPenalty = Math.min(30, highViolations * 5);
      score -= highPenalty;
      deductions.push({
        label: `${highViolations} High-Severity Slop Term(s)/Phrase(s)`,
        penalty: highPenalty,
        severity: 'high'
      });
    }

    if (medViolations > 0) {
      const medPenalty = Math.min(15, medViolations * 2);
      score -= medPenalty;
      deductions.push({
        label: `${medViolations} Medium Slop Term(s)`,
        penalty: medPenalty,
        severity: 'low'
      });
    }

    // Ensure within 0 - 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    let tier = 'Authentic Human Voice';
    let color = '#10b981'; // emerald green

    if (score < 50) {
      tier = 'Heavy LLM Slop Signature';
      color = '#ef4444'; // red
    } else if (score < 75) {
      tier = 'Borderline / AI-Assisted Tell';
      color = '#f59e0b'; // amber
    } else if (score < 88) {
      tier = 'Acceptable (Minor Refinements Needed)';
      color = '#3b82f6'; // blue
    }

    return {
      total: score,
      tier,
      color,
      deductions
    };
  }
}
