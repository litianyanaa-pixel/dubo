/**
 * Simple sound system using Web Audio API.
 * No external audio files needed — all sounds are synthesized.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {
    // Audio not available, silently skip
  }
}

function playChord(freqs: number[], duration: number, volume = 0.1) {
  for (const f of freqs) playTone(f, duration, 'sine', volume)
}

export const SFX = {
  /** Trade executed successfully */
  tradeSuccess() { playTone(880, 0.12, 'sine', 0.1) },

  /** Trade failed */
  tradeFail() { playTone(220, 0.2, 'square', 0.08) },

  /** Fake news published */
  fakeNews() { playChord([440, 554, 659], 0.25, 0.08) },

  /** KOL posted */
  kolPost() { playTone(660, 0.15, 'triangle', 0.1) },

  /** Major event triggered */
  event() { playChord([523, 659, 784], 0.3, 0.08) },

  /** Black swan event */
  blackSwan() { playTone(180, 0.5, 'sawtooth', 0.1) },

  /** Debunked */
  debunked() { playTone(350, 0.3, 'square', 0.08) },

  /** Achievement / unlock */
  unlock() { playChord([523, 659, 784, 1047], 0.4, 0.1) },

  /** Bankruptcy */
  bankruptcy() {
    playTone(200, 0.4, 'sawtooth', 0.12)
    setTimeout(() => playTone(150, 0.6, 'sawtooth', 0.1), 300)
  },

  /** Settlement */
  settlement() { playChord([440, 554, 659, 880], 0.5, 0.08) },

  /** Rug pull */
  rugPull() {
    playTone(800, 0.1, 'sine', 0.1)
    setTimeout(() => playTone(400, 0.15, 'sine', 0.08), 80)
    setTimeout(() => playTone(200, 0.3, 'sine', 0.06), 160)
  },

  /** War started */
  warStart() { playTone(150, 0.5, 'sawtooth', 0.1) },

  /** Circuit breaker triggered */
  circuitBreaker() {
    playTone(900, 0.1, 'square', 0.1)
    setTimeout(() => playTone(900, 0.1, 'square', 0.1), 200)
  },

  /** Button click */
  click() { playTone(1200, 0.04, 'sine', 0.05) },
}
