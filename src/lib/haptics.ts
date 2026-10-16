// 触觉模块：A 真实反馈（navigator.vibrate） / B 手柄反馈（Gamepad） / C 模拟反馈（视觉 + 音效）
// 原则：
// - 默认关闭，用户主动开启。
// - 不因为 API 存在就断言硬件真的震了：状态显示为「已请求 / 未确认」。
// - 调用失败不影响阅读与游戏。
// - 限制持续时间与触发频率。

export type HapticStrength = 'off' | 'weak' | 'medium' | 'strong';

export interface HapticStatus {
  /** 设备是否声明支持 navigator.vibrate */
  vibrateApi: boolean;
  /** 上一次调用是否成功返回（不代表硬件真的震动） */
  lastRequested: boolean;
  lastMode: 'none' | 'vibrate' | 'gamepad' | 'simulated';
  lastAt: number;
  gamepadConnected: boolean;
}

const PRESETS: Record<Exclude<HapticStrength, 'off'>, number[]> = {
  weak: [12],
  medium: [24],
  strong: [40],
};

type Listener = (s: HapticStatus) => void;

class Haptics {
  enabled = false;
  /** 尚未发生过真实用户手势时，不调用 vibrate（浏览器会拦截并报错） */
  private userGesture = false;
  strength: HapticStrength = 'medium';
  /** 减少动态效果模式下禁用视觉位移与抖动 */
  reducedMotion = false;
  private lastFire = 0;
  private minInterval = 90; // ms，限制触发频率
  private status: HapticStatus = {
    vibrateApi: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
    lastRequested: false,
    lastMode: 'none',
    lastAt: 0,
    gamepadConnected: false,
  };
  private listeners = new Set<Listener>();
  /** 视觉模拟回调，由页面注册（按钮弹性动画） */
  private visualHandlers = new Set<(s: HapticStrength) => void>();

  onChange(fn: Listener) {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }
  getStatus() {
    return this.status;
  }
  onVisual(fn: (s: HapticStrength) => void) {
    this.visualHandlers.add(fn);
    return () => this.visualHandlers.delete(fn);
  }

  private update(patch: Partial<HapticStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((f) => f(this.status));
  }

  /** 由用户点击等手势调用一次，之后才允许尝试真实振动 */
  markUserGesture() {
    this.userGesture = true;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.stop();
    else this.update({ lastMode: this.status.lastMode, lastAt: this.status.lastAt });
  }
  setStrength(s: HapticStrength) {
    this.strength = s;
    this.update({ lastMode: this.status.lastMode, lastAt: this.status.lastAt });
  }
  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  stop() {
    if (this.status.vibrateApi && this.userGesture) {
      try {
        navigator.vibrate(0);
      } catch {
        /* 忽略：不支持就算了 */
      }
    }
    void this.gamepadPulse(0).catch(() => undefined);
    this.update({ lastMode: 'none' });
  }

  private async gamepadPulse(intensity: number, duration = 60) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const pad of Array.from(pads)) {
      const anyPad = pad as unknown as {
        vibrationActuator?: {
          playEffect: (
            type: string,
            params: Record<string, number>
          ) => Promise<unknown>;
        };
      };
      if (anyPad?.vibrationActuator) {
        try {
          await anyPad.vibrationActuator.playEffect('dual-rumble', {
            duration,
            strongMagnitude: intensity,
            weakMagnitude: intensity * 0.6,
          });
        } catch {
          /* 不支持就算了 */
        }
      }
    }
  }

  /** 触发一次教学反馈。返回实际使用的通道。 */
  async fire(): Promise<'none' | 'vibrate' | 'gamepad' | 'simulated'> {
    if (!this.enabled || this.strength === 'off') return 'none';
    const now = performance.now();
    if (typeof window !== 'undefined' && !this.userGesture) {
      // 没有用户手势时浏览器会拒绝振动，直接走模拟通道
      if (!this.reducedMotion) this.visualHandlers.forEach((h) => h(this.strength));
      this.update({ lastMode: 'simulated', lastRequested: false, lastAt: now });
      return 'simulated';
    }
    if (now - this.lastFire < this.minInterval) return 'none';
    this.lastFire = now;

    // B. 手柄反馈优先尝试
    try {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = Array.from(navigator.getGamepads()).filter(Boolean) as unknown as {
          vibrationActuator?: unknown;
        }[];
        if (pads.some((p) => p?.vibrationActuator)) {
          const intensity = this.strength === 'weak' ? 0.3 : this.strength === 'medium' ? 0.6 : 1;
          await this.gamepadPulse(intensity);
          this.update({ lastMode: 'gamepad', lastRequested: true, lastAt: now, gamepadConnected: true });
          return 'gamepad';
        }
      }
    } catch {
      /* 继续尝试其他通道 */
    }

    // A. 真实反馈（失败或被浏览器拒绝时静默降级，不影响阅读与游戏）
    if (this.status.vibrateApi && this.userGesture) {
      try {
        const pattern = PRESETS[this.strength];
        const ok = navigator.vibrate(pattern);
        this.update({ lastMode: ok ? 'vibrate' : 'simulated', lastRequested: !!ok, lastAt: now });
        if (ok) return 'vibrate';
      } catch {
        /* 继续 */
      }
    }

    // C. 模拟反馈
    if (!this.reducedMotion) {
      this.visualHandlers.forEach((h) => h(this.strength));
    }
    this.update({ lastMode: 'simulated', lastRequested: false, lastAt: now });
    return 'simulated';
  }

  /** 手柄连接状态轮询 */
  watchGamepads() {
    if (typeof window === 'undefined') return () => undefined;
    const on = () => this.update({ gamepadConnected: true });
    const onOff = () => this.update({ gamepadConnected: false });
    window.addEventListener('gamepadconnected', on);
    window.addEventListener('gamepaddisconnected', onOff);
    return () => {
      window.removeEventListener('gamepadconnected', on);
      window.removeEventListener('gamepaddisconnected', onOff);
    };
  }

  /** 状态文案：明确区分「已请求」与「确认震动」 */
  describe() {
    if (!this.enabled || this.strength === 'off') return '触觉反馈：已关闭';
    if (!this.status.vibrateApi && !this.status.gamepadConnected) {
      return '触觉反馈：仅视听模拟（此设备未提供可用振动接口）';
    }
    const via = this.status.vibrateApi ? '真实振动可尝试' : '真实振动不可用';
    const pad = this.status.gamepadConnected ? '，检测到手柄' : '';
    return `触觉反馈：${via}（已发送请求，不等同于已确认硬件震动）${pad}`;
  }
}

export const haptics = new Haptics();