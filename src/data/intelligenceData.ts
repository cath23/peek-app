/**
 * Deterministic mock "AI" for the Intelligence prototype: rule-based Fix and
 * Tighten transforms, a fact-check trigger table grounded in the example
 * conversations, and a word-level diff for the preview cards. No model calls.
 */

// ── Fix (spelling & grammar) - genuinely rule-based ──

const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\bteh\b/gi, 'the'],
  [/\brecieve\b/gi, 'receive'],
  [/\bseperate\b/gi, 'separate'],
  [/\bdefinately\b/gi, 'definitely'],
  [/\boccured\b/gi, 'occurred'],
  [/\badress\b/gi, 'address'],
  [/\balot\b/gi, 'a lot'],
  [/\bdont\b/g, "don't"],
  [/\bwont\b/g, "won't"],
  [/\bim\b/g, "I'm"],
  [/\bi\b/g, 'I'],
]

export function applyFix(text: string): string {
  let out = text
  for (const [re, replacement] of TYPO_FIXES) out = out.replace(re, replacement)
  // Capitalize sentence starts; collapse runs of spaces (not newlines).
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
  out = out.replace(/ {2,}/g, ' ')
  return out
}

// ── Tighten - filler removal + one scripted showcase pair ──

const TIGHTEN_SHOWCASE: Array<{ input: string; output: string }> = [
  {
    input:
      "I was testing the new build with the upgraded SDK and it's definitely better than what we had before. But I realized that the screen with the guidelines how to do the face scan might be a bit abstract for people since it's only text.",
    output:
      'The new SDK build is a clear improvement. But the face-scan guidance screen may be too abstract for people - it is text-only.',
  },
]

const FILLER_RULES: Array<[RegExp, string]> = [
  [/\b(?:definitely|basically|actually|literally|honestly)\s+/gi, ''],
  [/\b(?:really|very|just|quite)\s+/gi, ''],
  [/\bin order to\b/gi, 'to'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bthe thing is that\s+/gi, ''],
  [/\bI think that\b/g, 'I think'],
  [/\bneedless to say,?\s+/gi, ''],
]

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function applyTighten(text: string): string {
  const showcase = TIGHTEN_SHOWCASE.find((p) => normalize(p.input) === normalize(text))
  if (showcase) return showcase.output
  let out = text
  for (const [re, replacement] of FILLER_RULES) out = out.replace(re, replacement)
  out = out.replace(/ {2,}/g, ' ').replace(/\s+([.,!?])/g, '$1')
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
  return out
}

// ── Check facts - trigger table grounded in the example conversations ──

export interface FactCheckFlag {
  id: string
  /** Fires when the draft/selection matches. */
  trigger: RegExp
  /** The correction, phrased with its evidence. */
  flag: string
  /** Where the evidence lives - "View source" opens this thread. */
  topicId: string
  anchorConvId: string
  sourceLabel: string
}

export const FACT_CHECKS: FactCheckFlag[] = [
  {
    id: 'android-not-iphone',
    trigger: /iphone/i,
    flag: "Greg's funnel data attributes degraded performance to older Android devices, not iPhones.",
    topicId: '3',
    anchorConvId: 't3_c2',
    sourceLabel: 'Greg Bothman · Today, 10:22 AM',
  },
  {
    id: 'option-a-chosen',
    trigger: /option\s*b\b|looping animation/i,
    flag: "The team converged on Option A (static illustrations) in Alice's design thread.",
    topicId: '3',
    anchorConvId: 't3_c4',
    sourceLabel: 'Alice Johnson · Today, 2:20 PM',
  },
  {
    id: 'liveness-not-ratelimit',
    trigger: /\b429\b|rate.?limit/i,
    flag: "Greg's analysis points to the liveness check UX, not rate limiting.",
    topicId: '3',
    anchorConvId: 't3_c2',
    sourceLabel: 'Greg Bothman · Today, 10:22 AM',
  },
  {
    id: 'sdk-342',
    trigger: /\b3\.4\.1\b/,
    flag: 'The comparison Greg ran was against SDK 3.4.2.',
    topicId: '3',
    anchorConvId: 't3_c3',
    sourceLabel: 'Greg Bothman · Today, 11:15 AM',
  },
]

export function checkFacts(text: string): FactCheckFlag[] {
  return FACT_CHECKS.filter((f) => f.trigger.test(text))
}

// ── Word-level diff (LCS) for the preview cards ──

export interface DiffSegment {
  text: string
  kind: 'same' | 'removed' | 'added'
}

export function diffWords(oldText: string, newText: string): DiffSegment[] {
  const a = oldText.split(/\s+/).filter(Boolean)
  const b = newText.split(/\s+/).filter(Boolean)
  // LCS table
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const segments: DiffSegment[] = []
  const push = (text: string, kind: DiffSegment['kind']) => {
    const last = segments[segments.length - 1]
    if (last && last.kind === kind) last.text += ` ${text}`
    else segments.push({ text, kind })
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i], 'same')
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(a[i], 'removed')
      i++
    } else {
      push(b[j], 'added')
      j++
    }
  }
  while (i < a.length) push(a[i++], 'removed')
  while (j < b.length) push(b[j++], 'added')
  return segments
}
