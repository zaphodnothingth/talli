// Premium Web Audio API Sound Generator & TTS Engine for Talli

class SoundManager {
  private isSoundEnabled: boolean = true;
  private isSpeechEnabled: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Load preferences from localStorage
    const soundPref = localStorage.getItem('talli_sound_pref');
    this.isSoundEnabled = soundPref !== null ? soundPref === 'true' : true;

    const speechPref = localStorage.getItem('talli_speech_pref');
    this.isSpeechEnabled = speechPref !== null ? speechPref === 'true' : false;
  }

  private initAudio() {
    if (!this.audioCtx) {
      // Lazy initialize AudioContext on user interaction due to browser policies
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  // Setters and Getters
  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    localStorage.setItem('talli_sound_pref', String(enabled));
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  setSpeechEnabled(enabled: boolean) {
    this.isSpeechEnabled = enabled;
    localStorage.setItem('talli_speech_pref', String(enabled));
  }

  getSpeechEnabled(): boolean {
    return this.isSpeechEnabled;
  }

  // Dynamic Audio Synthesizer (Synth)
  private playOscillator(
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    volume: number = 0.1
  ) {
    this.initAudio();
    if (!this.isSoundEnabled || !this.audioCtx) return;

    try {
      // Resume if suspended
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      // Exponential decay
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play synth sound:', e);
    }
  }

  // Quick tactile tick sound
  playTick() {
    this.playOscillator(600, 'sine', 0.08, 0.15);
  }

  // Double-tap decrement sound
  playTickDown() {
    this.playOscillator(300, 'sine', 0.12, 0.15);
  }

  // Score added successfully
  playDing() {
    this.initAudio();
    if (!this.isSoundEnabled || !this.audioCtx) return;

    this.playOscillator(880, 'triangle', 0.15, 0.2);
    setTimeout(() => {
      this.playOscillator(1320, 'triangle', 0.25, 0.15);
    }, 80);
  }

  // Round completed or match point
  playMatchPoint() {
    this.playOscillator(987.77, 'sine', 0.25, 0.2); // B5
    setTimeout(() => {
      this.playOscillator(1318.51, 'sine', 0.4, 0.15); // E6
    }, 150);
  }

  // Victory game won fanfare
  playWinFanfare() {
    this.initAudio();
    if (!this.isSoundEnabled || !this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playOscillator(freq, 'sine', 0.4, 0.2);
      }, index * 120);
    });
  }

  // Undo button pressed
  playUndo() {
    this.playOscillator(440, 'sawtooth', 0.15, 0.05);
  }

  // Text-To-Speech Reader
  speak(text: string) {
    if (!this.isSpeechEnabled || !('speechSynthesis' in window)) return;

    try {
      // Cancel ongoing speeches
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly faster for responsiveness
      utterance.pitch = 1.0;
      
      // Select a English voice if possible
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(voice => voice.lang.startsWith('en-'));
      if (engVoice) utterance.voice = engVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
}

export const sound = new SoundManager();
