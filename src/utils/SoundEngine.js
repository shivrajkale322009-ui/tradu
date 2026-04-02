/**
 * Futuristic Sci-Fi Sound Engine using Web Audio API
 * Synthesizes HUD sound effects without needing external assets.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.2; // Keep it subtle and premium
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  // Soft digital "tap"
  playTap() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    env.gain.setValueAtTime(0.3, this.ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(env);
    env.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Rising digital "whoosh"
  playWhoosh() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(5000, this.ctx.currentTime + 0.4);

    env.gain.setValueAtTime(0, this.ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
    env.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // Processing hum/blip loop
  playProcessing() {
    this.init();
    if (!this.ctx) return;
    
    const noise = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    noise.type = 'sine';
    noise.frequency.value = 50; // Low hum
    
    noiseGain.gain.value = 0.05;
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start();
    
    // Random blips
    const blipInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const blip = this.ctx.createOscillator();
        const blipGain = this.ctx.createGain();
        blip.frequency.value = 2000 + Math.random() * 2000;
        blipGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        blipGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        blip.connect(blipGain);
        blipGain.connect(this.masterGain);
        blip.start();
        blip.stop(this.ctx.currentTime + 0.05);
      }
    }, 100);

    return {
      stop: () => {
        noise.stop();
        clearInterval(blipInterval);
      }
    };
  }

  // Charge rise
  playCharge() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.5);
    
    env.gain.setValueAtTime(0, this.ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.4);
    env.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    
    osc.connect(env);
    env.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Impact + Chime (Success)
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    
    // Impact
    const impact = this.ctx.createOscillator();
    const impactEnv = this.ctx.createGain();
    impact.type = 'square';
    impact.frequency.setValueAtTime(150, this.ctx.currentTime);
    impact.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
    impactEnv.gain.setValueAtTime(0.4, this.ctx.currentTime);
    impactEnv.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    impact.connect(impactEnv);
    impactEnv.connect(this.masterGain);
    impact.start();
    impact.stop(this.ctx.currentTime + 0.3);

    // Chime
    const notes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
    notes.forEach((freq, i) => {
      const chime = this.ctx.createOscillator();
      const chimeEnv = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.value = freq;
      chimeEnv.gain.setValueAtTime(0, this.ctx.currentTime + (i * 0.05));
      chimeEnv.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + (i * 0.05) + 0.05);
      chimeEnv.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
      chime.connect(chimeEnv);
      chimeEnv.connect(this.masterGain);
      chime.start(this.ctx.currentTime + (i * 0.05));
      chime.stop(this.ctx.currentTime + 0.8);
    });
  }
}

export const soundEngine = new SoundEngine();
