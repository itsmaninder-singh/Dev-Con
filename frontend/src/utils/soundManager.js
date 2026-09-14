/**
 * soundManager.js
 * Centralized Web Audio API sound manager for DevConnect.
 * 
 * Features:
 * - Ambient, fluid scroll sound synthesized in real-time (no cracks, no mechanical ticks, no external audio files).
 * - Modulates filter frequency & volume based on smoothed scroll velocity using continuous lerp.
 * - Tactile, crisp, short (60-80ms) digital click sound for interactive elements.
 * - Subtle modal open / close sounds.
 * - Global enable/disable and volume control with localStorage persistence.
 * - Fails silently if AudioContext is blocked or unsupported.
 */

const STORAGE_KEY_ENABLED = 'devconnect_sound_enabled';
const STORAGE_KEY_VOLUME = 'devconnect_sound_volume';

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.12;

    // Scroll synthesizer nodes
    this.scrollNodes = null;
    this.scrollVelocity = 0;
    this.smoothedVelocity = 0;
    this.scrollTargetGain = 0;
    this.currentScrollGain = 0;
    this.rafId = null;
    this.lastScrollTime = 0;
    this.isScrolling = false;

    // Load persisted settings
    if (typeof window !== 'undefined') {
      const storedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (storedEnabled !== null) {
        this.enabled = storedEnabled === 'true';
      }
      const storedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.masterVolume = parsed;
        }
      }
    }

    // Listeners for UI state changes
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const cb of this.subscribers) {
      try { cb({ enabled: this.enabled, volume: this.masterVolume }); } catch (_) {}
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(this.enabled));
    }
    if (!this.enabled && this.scrollNodes) {
      this.fadeScrollToZero();
    }
    this.notify();
  }

  getVolume() {
    return this.masterVolume;
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(this.masterVolume));
    }
    this.notify();
  }

  /**
   * Lazily initializes and resumes the Web Audio context on user gesture.
   */
  getContext() {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /* ============================================================
     1. FLUID, AMBIENT SCROLL SYNTHESIZER
     ============================================================ */

  /**
   * Initializes persistent nodes for the scroll sound generator:
   * Dual smooth oscillators (sine + soft triangle) through a gentle bandpass
   * and lowpass filter into a master scroll gain.
   */
  initScrollNodes() {
    if (this.scrollNodes) return this.scrollNodes;
    const ctx = this.getContext();
    if (!ctx) return null;

    try {
      // 1. Dual tone oscillators for an ethereal, velvety acoustic air movement
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(140, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, ctx.currentTime);

      // 2. Soft bandpass filter to remove harshness and create a warm air resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      // 3. Lowpass filter to ensure smooth, non-piercing high frequencies
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(450, ctx.currentTime);
      lowpass.Q.setValueAtTime(0.7, ctx.currentTime);

      // 4. Scroll gain controller
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.00001, ctx.currentTime);

      // Connections: (osc1 + osc2) -> bandpass -> lowpass -> gain -> destination
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.scrollNodes = { osc1, osc2, filter, lowpass, gain };
      this.startScrollLoop();
      return this.scrollNodes;
    } catch {
      return null;
    }
  }

  /**
   * Continuous requestAnimationFrame loop that smoothly interpolates
   * scroll velocity into audio filter frequency and gain.
   */
  startScrollLoop() {
    if (this.rafId) return;

    const loop = () => {
      if (!this.enabled || !this.scrollNodes || !this.ctx) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const timeSinceLastScroll = now - this.lastScrollTime;

      // When scrolling stops, decay velocity down to 0
      if (timeSinceLastScroll > 45) {
        this.scrollVelocity *= 0.82;
        if (this.scrollVelocity < 0.1) {
          this.scrollVelocity = 0;
          this.isScrolling = false;
        }
      }

      // Smooth the velocity using lerp
      this.smoothedVelocity += (this.scrollVelocity - this.smoothedVelocity) * 0.16;

      // Target gain mapped to velocity (kept very subtle: max 0.045 * masterVolume)
      const maxScrollIntensity = 0.045 * (this.masterVolume / 0.12);
      const normalizedVel = Math.min(1, this.smoothedVelocity / 55);
      
      this.scrollTargetGain = this.isScrolling && this.smoothedVelocity > 0.4
        ? normalizedVel * maxScrollIntensity
        : 0.00001;

      // Smooth gain transitions without clicks or pops
      this.currentScrollGain += (this.scrollTargetGain - this.currentScrollGain) * 0.14;

      try {
        const audioNow = this.ctx.currentTime;
        const gainNode = this.scrollNodes.gain.gain;
        gainNode.setValueAtTime(Math.max(0.00001, this.currentScrollGain), audioNow);

        // Modulate resonant frequency slightly with velocity (200Hz - 420Hz)
        const targetFreq = 200 + normalizedVel * 220;
        this.scrollNodes.filter.frequency.setValueAtTime(targetFreq, audioNow);
        this.scrollNodes.lowpass.frequency.setValueAtTime(targetFreq * 1.6, audioNow);

        // Very subtle pitch shift (120Hz - 165Hz)
        const targetPitch = 120 + normalizedVel * 45;
        this.scrollNodes.osc1.frequency.setValueAtTime(targetPitch, audioNow);
        this.scrollNodes.osc2.frequency.setValueAtTime(targetPitch * 1.5, audioNow);
      } catch (_) {}

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  updateScrollVelocity(vel) {
    if (!this.enabled) return;
    this.lastScrollTime = performance.now();
    this.isScrolling = true;
    this.scrollVelocity = Math.max(this.scrollVelocity * 0.4, Math.abs(vel));

    if (!this.scrollNodes) {
      this.initScrollNodes();
    }
  }

  fadeScrollToZero() {
    if (!this.scrollNodes || !this.ctx) return;
    try {
      this.scrollTargetGain = 0.00001;
      this.currentScrollGain = 0.00001;
      this.scrollNodes.gain.gain.setValueAtTime(0.00001, this.ctx.currentTime);
    } catch (_) {}
  }

  /* ============================================================
     2. TACTILE CLICK SOUND (Haptic digital snap ~65ms)
     ============================================================ */

  /**
   * Plays a crisp, subtle, haptic digital click for buttons/cards.
   * Completely distinct from scrolling: short, punchy, pleasant, and premium.
   */
  playClick(options = {}) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = (options.volume || 0.10) * (this.masterVolume / 0.12);

      // Oscillator: clean short sine with exponential pitch dive for tactile weight
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Highpass/Bandpass filter to ensure it sounds like a crisp haptic tap
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.035);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

      // Snappy micro-envelope: 1.5ms attack, 55ms rapid decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {}
  }

  /* ============================================================
     3. OPTIONAL SOUNDS: MODAL OPEN / CLOSE & TOGGLE
     ============================================================ */

  playToggle(active = true) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = 0.07 * (this.masterVolume / 0.12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = active ? 440 : 580;
      const endFreq = active ? 660 : 380;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch (_) {}
  }

  playModalOpen() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = 0.045 * (this.masterVolume / 0.12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (_) {}
  }

  playModalClose() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = 0.035 * (this.masterVolume / 0.12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.10);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  /* ============================================================
     4. PAPER FLIP SOUND (Organic sketchbook page turn)
     ============================================================ */
  playPageFlip() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = 0.14 * (this.masterVolume / 0.12);

      // Create filtered white noise burst for the crisp paper rustle / whoosh
      const bufferSize = Math.floor(ctx.sampleRate * 0.28); // 280ms
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Pinkish noise curve for natural organic texture
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Bandpass filter to capture paper sliding frequency (900Hz down to 400Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(380, now + 0.24);
      filter.Q.setValueAtTime(1.8, now);

      // Gain envelope for page slide & landing snap
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(vol * 0.8, now + 0.18); // subtle page landing snap
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

      // Add a subtle low-end body thud for the page resting
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(120, now + 0.16);
      thud.frequency.exponentialRampToValueAtTime(50, now + 0.26);

      thudGain.gain.setValueAtTime(0.0001, now);
      thudGain.gain.setValueAtTime(0.0001, now + 0.16);
      thudGain.gain.linearRampToValueAtTime(vol * 0.55, now + 0.19);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.28);

      thud.start(now + 0.16);
      thud.stop(now + 0.28);
    } catch (_) {}
  }

  /* ============================================================
     5. SUCCESS CHIME SOUND (Harmonic chime for actions/submissions)
     ============================================================ */
  playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const vol = 0.12 * (this.masterVolume / 0.12);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.08);
      osc1.frequency.setValueAtTime(783.99, now + 0.16);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.35);
    } catch (_) {}
  }
}

// Singleton export
export const soundManager = new SoundManager();
export default soundManager;
