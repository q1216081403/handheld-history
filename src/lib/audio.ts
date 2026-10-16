// 音频模块：全部使用 Web Audio 实时合成，不加载任何外部音频文件。
// 设计要点：
// 1. 必须在用户手势后初始化（浏览器自动播放策略）。
// 2. 音乐与音效音量独立可调。
// 3. 页面隐藏时暂停，恢复可见时由用户决定是否继续。
// 4. 所有声音标注为“教学音效 / 原创合成”。

import type { Era } from '../data/types';

type Mood = Era['musicMood'];

export type SfxName =
  | 'tap' // 按键
  | 'insert' // 插卡 / 合盖
  | 'menu' // 菜单
  | 'task' // 任务完成
  | 'error' // 失败
  | 'motor'; // 电机嗡鸣（教学模拟）

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterMusic: GainNode | null = null;
  private masterSfx: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private loopTimer: number | null = null;
  private step = 0;
  private mood: Mood = '8bit';
  private started = false;
  private blocked = false;
  private listeners = new Set<() => void>();
  private musicVol = 0.35;
  private sfxVol = 0.6;
  private muted = false;

  isStarted() {
    return this.started;
  }
  isBlocked() {
    return this.blocked;
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  /** 必须由用户手势触发 */
  async init() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) {
        this.blocked = true;
        this.emit();
        return false;
      }
      try {
        this.ctx = new Ctor();
      } catch {
        this.blocked = true;
        this.emit();
        return false;
      }
      this.masterMusic = this.ctx.createGain();
      this.masterSfx = this.ctx.createGain();
      this.masterMusic.gain.value = this.musicVol;
      this.masterSfx.gain.value = this.sfxVol;
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(this.masterMusic);
      this.sfxBus.connect(this.masterSfx);
      this.masterMusic.connect(this.ctx.destination);
      this.masterSfx.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        this.blocked = true;
        this.emit();
        return false;
      }
    }
    if (this.ctx.state === 'running') {
      this.blocked = false;
      this.started = true;
      this.emit();
      return true;
    }
    this.blocked = true;
    this.emit();
    return false;
  }

  setMusicVolume(v: number) {
    this.musicVol = v;
    if (this.masterMusic && this.ctx) {
      this.masterMusic.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.05);
    }
    this.emit();
  }
  setSfxVolume(v: number) {
    this.sfxVol = v;
    if (this.masterSfx && this.ctx) {
      this.masterSfx.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    this.emit();
  }
  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterMusic && this.ctx) {
      this.masterMusic.gain.setTargetAtTime(m ? 0 : this.musicVol, this.ctx.currentTime, 0.05);
    }
    this.emit();
  }
  getMuted() {
    return this.muted;
  }

  /** 依据章节切换背景音乐气质 */
  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.step = 0;
    if (this.started) this.stopLoop();
  }

  // ---------------- 短音效 ----------------
  sfx(name: SfxName) {
    if (!this.ctx || !this.sfxBus || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const beep = (
      freq: number,
      dur: number,
      type: OscillatorType = 'square',
      gain = 0.2,
      slideTo?: number
    ) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.sfxBus!);
      o.start(t);
      o.stop(t + dur + 0.02);
    };

    switch (name) {
      case 'tap':
        beep(660, 0.06, 'square', 0.16);
        break;
      case 'insert':
        beep(240, 0.05, 'square', 0.2);
        beep(180, 0.09, 'square', 0.16);
        beep(420, 0.05, 'triangle', 0.12);
        break;
      case 'menu':
        beep(880, 0.05, 'triangle', 0.12);
        break;
      case 'task':
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => beep(f, 0.16, 'square', 0.16), i * 90)
        );
        break;
      case 'error':
        beep(180, 0.18, 'sawtooth', 0.14, 110);
        break;
      case 'motor': {
        // 短促电机嗡鸣：教学用合成音，不代表任何具体原机录音
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 58;
        o2.type = 'square';
        o2.frequency.value = 116;
        lfo.frequency.value = 22;
        lfoGain.gain.value = 12;
        lfo.connect(lfoGain);
        lfoGain.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g);
        o2.connect(g);
        g.connect(this.sfxBus);
        o.start(t);
        o2.start(t);
        lfo.start(t);
        o.stop(t + 0.65);
        o2.stop(t + 0.65);
        lfo.stop(t + 0.65);
        break;
      }
    }
  }

  // ---------------- 背景音乐（循环） ----------------
  startLoop(mood?: Mood) {
    if (mood) this.mood = mood;
    if (!this.ctx || !this.musicBus || this.ctx.state !== 'running') return;
    this.stopLoop();
    const tick = () => {
      if (!this.ctx || !this.musicBus) return;
      this.playStep();
      this.loopTimer = window.setTimeout(tick, 420);
    };
    tick();
  }
  stopLoop() {
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }
  pauseAll() {
    this.stopLoop();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    this.started = false;
    this.emit();
  }
  resumeIfAllowed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.started = true;
        this.emit();
      });
    }
  }

  /** 每种气质用不同的音阶与音色，音量刻意压低，不盖过阅读 */
  private playStep() {
    if (!this.ctx || !this.musicBus) return;
    const t = this.ctx.currentTime;
    const i = this.step++;
    const soft = 0.055; // 教学背景音量上限
    const note = (freq: number, dur: number, type: OscillatorType, gain = soft) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.musicBus!);
      o.start(t);
      o.stop(t + dur + 0.02);
    };

    switch (this.mood) {
      case 'early-electronic': {
        // 早期：简单电子滴答（方波，无和声）
        const base = [220, 262, 330, 262, 196, 247, 294, 247][i % 8];
        note(base, 0.18, 'square', 0.045);
        if (i % 4 === 0) note(base / 2, 0.3, 'triangle', 0.035);
        break;
      }
      case '8bit': {
        const scale = [262, 294, 330, 392, 330, 294, 247, 294];
        const bass = [131, 131, 147, 110];
        note(scale[i % 8], 0.16, 'square', 0.04);
        if (i % 2 === 0) note(bass[(i / 2) % 4], 0.22, 'triangle', 0.05);
        break;
      }
      case '16bit': {
        const chords: number[][] = [
          [262, 330, 392],
          [247, 311, 370],
          [220, 277, 330],
          [196, 247, 294],
        ];
        const chord = chords[Math.floor(i / 4) % 4];
        chord.forEach((f, k) => note(f, 0.5, 'triangle', 0.028 + k * 0.006));
        if (i % 4 === 0) note(chord[0] / 2, 0.6, 'sine', 0.045);
        break;
      }
      case 'modern-ambient': {
        const roots = [110, 123, 98, 87];
        const r = roots[Math.floor(i / 6) % 4];
        note(r, 1.6, 'sine', 0.035);
        note(r * 1.5, 1.6, 'sine', 0.02);
        if (i % 6 === 2) note(r * 2, 1.0, 'sine', 0.012);
        break;
      }
    }
  }
}

export const audio = new AudioEngine();