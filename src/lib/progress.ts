// 学习进度：使用浏览器本地存储，第一版不强制注册登录。

const KEY = 'handheld-history-progress-v1';

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  audioStarted: boolean;
  hapticsEnabled: boolean;
  hapticStrength: 'off' | 'weak' | 'medium' | 'strong';
  reducedMotion: boolean;
  noFlashing: boolean;
  pixelZoom: boolean; // true = 教学放大；false = 原始低分辨率
  gridOverlay: boolean; // 显示像素网格
  freeExploreUnlocked: boolean;
}

export interface Progress {
  settings: Settings;
  /** 已完成体验的设备 id */
  completed: string[];
  /** 已获得的印章 */
  stamps: string[];
  /** 已阅读的章节（不要求完成互动） */
  read: string[];
  /** 收藏的设备 id */
  collected: string[];
  lastDevice?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.3,
  sfxVolume: 0.55,
  muted: false,
  audioStarted: false,
  hapticsEnabled: false,
  hapticStrength: 'medium',
  reducedMotion: false,
  noFlashing: true,
  pixelZoom: true,
  gridOverlay: false,
  freeExploreUnlocked: false,
};

const DEFAULT_PROGRESS: Progress = {
  settings: DEFAULT_SETTINGS,
  completed: [],
  stamps: [],
  read: [],
  collected: [],
};

function safeParse(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      ...DEFAULT_PROGRESS,
      ...p,
      settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
      completed: p.completed ?? [],
      stamps: p.stamps ?? [],
      read: p.read ?? [],
      collected: p.collected ?? [],
    };
  } catch {
    return null;
  }
}

export function loadProgress(): Progress {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_PROGRESS };
    return safeParse(localStorage.getItem(KEY)) ?? { ...DEFAULT_PROGRESS };
  } catch {
    // 隐私模式、存储被策略禁用等情况下仍要能正常阅读
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(p: Progress) {
  // 注意：typeof 也会触发 getter，因此整段都要放在 try 内
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 存储不可用时静默失败，不影响使用 */
  }
}

export function resetProgress() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}