/**
 * Web Audio API Heartbeat Synthesizer
 * Synthesizes realistic thudding heartbeat sound effects on-the-fly.
 */
export class HeartbeatSynth {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private bpm: number = 60;
  private isMuted: boolean = false;

  constructor() {}

  /**
   * Start the heartbeat rhythm
   */
  start(initialBpm: number = 60) {
    this.bpm = initialBpm;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
    
    this.playBeat();
    this.scheduleNextBeat();
  }

  /**
   * Dynamically adjust the heartbeat speed (beats per minute)
   */
  setBpm(newBpm: number) {
    this.bpm = newBpm;
  }

  /**
   * Toggle mute state
   */
  setMute(mute: boolean) {
    this.isMuted = mute;
  }

  private scheduleNextBeat() {
    // Standard heartbeat interval in milliseconds based on BPM
    const delay = (60 / this.bpm) * 1000;
    this.intervalId = setTimeout(() => {
      this.playBeat();
      this.scheduleNextBeat();
    }, delay);
  }

  private playBeat() {
    if (this.isMuted) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // 1. "Lub" - First deep thud (lower pitch, slightly longer duration)
      this.triggerThud({
        time: now,
        gainValue: 0.9,
        startFreq: 58,
        endFreq: 0.01,
        duration: 0.16,
      });
      
      // 2. "Dub" - Second thud (slightly higher pitch, slightly quieter, starts 140ms later)
      this.triggerThud({
        time: now + 0.14,
        gainValue: 0.6,
        startFreq: 62,
        endFreq: 0.01,
        duration: 0.12,
      });
    } catch (error) {
      console.warn("Heartbeat synthesizer failed to play beat:", error);
    }
  }

  private triggerThud(config: {
    time: number;
    gainValue: number;
    startFreq: number;
    endFreq: number;
    duration: number;
  }) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const lowpass = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.ctx.destination);

    // Deep sine wave
    osc.type = "sine";
    
    // Low pass filter to remove harsh clicking and create a muffled body thud
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(120, config.time);

    // Pitch envelope (sweep down to create the physical impact thud)
    osc.frequency.setValueAtTime(config.startFreq, config.time);
    osc.frequency.exponentialRampToValueAtTime(config.endFreq, config.time + config.duration);

    // Gain envelope (smooth fade-in and exponential fade-out)
    gain.gain.setValueAtTime(0, config.time);
    gain.gain.linearRampToValueAtTime(config.gainValue * 0.7, config.time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, config.time + config.duration);

    osc.start(config.time);
    osc.stop(config.time + config.duration);
  }

  /**
   * Plays a faint, eerie, atmospheric horror sound effect (slow-building dissonant pad and shivering wind).
   */
  playSpookySound() {
    if (this.isMuted) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const duration = 6.0; // Total duration of the atmospheric sound (seconds)

      // Master gain for the spooky sound (keep it faint / weak as requested by the user: "약하게 나오게 해줘")
      const masterGain = this.ctx.createGain();
      masterGain.connect(this.ctx.destination);
      
      // Gentle fade in (1.5s attack) and very long slow fade out (4.5s release)
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.12, now + 1.5); // Faint volume level
      masterGain.gain.setValueAtTime(0.12, now + 2.5);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Low pass filter to keep the sound dark, mysterious, and warm
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(1.0, now);
      // Sweep the filter frequency down slightly to mimic shifting wind/shadows
      filter.frequency.exponentialRampToValueAtTime(200, now + duration);
      filter.connect(masterGain);

      // --- 1. Low, deep rumbling sub-drone (Tension root: A2 at 110Hz) ---
      const droneOsc = this.ctx.createOscillator();
      droneOsc.type = "sawtooth"; // Rich in harmonics, but muffled by the low-pass filter
      droneOsc.frequency.setValueAtTime(110, now); // A2
      
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.4, now);
      droneOsc.connect(droneGain);
      droneGain.connect(filter);

      // --- 2. Dissonant minor-second cluster (E4 and F4 creating an eerie pulsing beat) ---
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      
      osc1.type = "triangle"; // Smooth but dark
      osc2.type = "sine";     // Pure tone to mix in
      
      osc1.frequency.setValueAtTime(329.63, now); // E4
      osc2.frequency.setValueAtTime(349.23, now); // F4 (Dissonant minor second above E4)

      // Add slight detuning to create a natural, slow-beating chorusing horror effect
      osc1.detune.setValueAtTime(-6, now);
      osc2.detune.setValueAtTime(6, now);

      const clusterGain = this.ctx.createGain();
      clusterGain.gain.setValueAtTime(0.35, now);
      
      osc1.connect(clusterGain);
      osc2.connect(clusterGain);
      clusterGain.connect(filter);

      // --- 3. Shivering high ghost whistle (A5 at 880Hz with pitch vibrato LFO) ---
      const highOsc = this.ctx.createOscillator();
      highOsc.type = "sine";
      highOsc.frequency.setValueAtTime(880, now); // A5

      // LFO to modulate the high frequency to create a shivering, trembling ghost effect
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(5.5, now); // 5.5Hz vibrato speed
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(15, now); // Modulate pitch up and down by 15Hz

      lfo.connect(lfoGain);
      lfoGain.connect(highOsc.frequency);

      const highGain = this.ctx.createGain();
      // Fade in the high shivering whistle slightly later for progressive dread
      highGain.gain.setValueAtTime(0, now);
      highGain.gain.linearRampToValueAtTime(0.2, now + 1.2);
      highGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.5);

      lfo.start(now);
      highOsc.connect(highGain);
      highGain.connect(filter);

      // Start all sound generators
      droneOsc.start(now);
      osc1.start(now);
      osc2.start(now);
      highOsc.start(now);

      // Clean up nodes after completion
      droneOsc.stop(now + duration);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      highOsc.stop(now + duration);
      lfo.stop(now + duration);
    } catch (e) {
      console.warn("Eerie synthesizer failed to play sound:", e);
    }
  }

  /**
   * Stop the heartbeat synthesis entirely
   */
  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}
