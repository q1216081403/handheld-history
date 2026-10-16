import React from 'react';

/**
 * 设备外观示意图（全部为原创 SVG，标注「外观示意」）。
 *
 * 视觉语言：扁平矢量质感
 * - 机身：圆角矩形 + 竖向线性渐变（上浅下深）+ 顶部内高光 + 外投影
 * - 屏幕：内凹槽（外框 + 深色屏面 + 顶部内阴影 + 斜向玻璃反光）
 * - 按键：径向渐变 + 顶部高光弧 + 底部暗边，形成轻微立体感
 * - 丝印：小号低对比文字，不使用任何商标图形
 *
 * 结构约定：
 * 每台机器使用独立造型，机身比例、朝向、屏幕位置与占比、按键布局均按公开
 * 工业设计资料还原（见 docs/appearance-notes.md）。造型函数通过 ctx.screen
 * 声明自己的屏幕矩形，DeviceShell 据此渲染「示意画面」占位文字与像素网格。
 */

export type ScreenTone = 'led' | 'lcd-green' | 'lcd-gray' | 'color' | 'oled' | 'wide';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  deviceId: string;
  /** 屏幕内渲染的内容 */
  children?: React.ReactNode;
  tone?: ScreenTone;
  /** 显示机身下方的说明文字 */
  showLabel?: boolean;
  label?: string;
  /** 像素网格叠加（仅用于低分辨率模式教学说明） */
  grid?: boolean;
  className?: string;
}

/* ---------------- 屏幕色调 ---------------- */

const toneBg: Record<ScreenTone, [string, string]> = {
  led: ['#2a1608', '#140a03'],
  'lcd-green': ['#a8bb7c', '#8ea363'],
  'lcd-gray': ['#9ba093', '#848a7c'],
  color: ['#2c4c68', '#1b3149'],
  oled: ['#0a0d14', '#04060a'],
  wide: ['#152838', '#0a1520'],
};

const toneGlow: Record<ScreenTone, string> = {
  led: '#ff8a3d',
  'lcd-green': '#2f4027',
  'lcd-gray': '#2b2e26',
  color: '#a8e0ff',
  oled: '#e8f0ff',
  wide: '#96dcff',
};

/** 屏幕玻璃反光文字颜色 */
const toneInk: Record<ScreenTone, string> = {
  led: '#ffb070',
  'lcd-green': '#31422a',
  'lcd-gray': '#2c2f26',
  color: '#a8e0ff',
  oled: '#e8f0ff',
  wide: '#96dcff',
};

/* ---------------- 质感基础件 ---------------- */

interface DefsProps {
  uid: string;
}

/** 每台设备的渐变与滤镜定义 */
function Defs({ uid }: DefsProps) {
  return (
    <defs>
      <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="42%" stopColor="#ffffff" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
      </linearGradient>
      <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="46%" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`bezel-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.34" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
      </linearGradient>
      <radialGradient id={`glass-${uid}`} cx="0.32" cy="0.22" r="0.85">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`drop-${uid}`} x="-12%" y="-12%" width="124%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.20" />
      </filter>
      <filter id={`soft-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.28" />
      </filter>
    </defs>
  );
}

interface BodyProps {
  uid: string;
  x: number;
  y: number;
  width: number;
  height: number;
  r?: number;
  fill: string;
  /** 机身顶部的独立色带 */
  band?: { h: number; fill: string };
  shadow?: boolean;
}

/** 机身主体：底色 + 渐变 + 顶部高光 + 外投影 */
function Body({ uid, x, y, width: w, height: h, r = 14, fill, band, shadow = true }: BodyProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={fill}
        filter={shadow ? `url(#drop-${uid})` : undefined}
      />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#body-${uid})`} />
      <rect
        x={x + 0.75}
        y={y + 0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={r - 0.75}
        fill="none"
        stroke={`url(#rim-${uid})`}
        strokeWidth="1.5"
      />
      {band && (
        <>
          <rect x={x} y={y} width={w} height={band.h} rx={r} fill={band.fill} />
          <rect x={x} y={y + band.h - r} width={w} height={r} fill={band.fill} />
          <rect x={x} y={y} width={w} height={band.h * 0.5} rx={r / 2} fill="#ffffff" opacity="0.10" />
        </>
      )}
    </g>
  );
}

/** 机身斜切面高光（如 GBA 的半梯形、Playdate 的圆角边） */
function Sheen({ uid, d }: { uid: string; d: string }) {
  return <path d={d} fill={`url(#sheen-${uid})`} />;
}

interface ScreenProps extends Rect {
  uid: string;
  tone: ScreenTone;
  children?: React.ReactNode;
  grid?: boolean;
  /** 圆角 */
  r?: number;
  /** 屏幕外框宽度（内凹槽） */
  bezel?: number;
  /** 关闭玻璃反光（LED 点阵窗等） */
  noGlass?: boolean;
}

/** 屏幕：外框内凹槽 + 屏面 + 顶部内阴影 + 斜向反光 */
function Screen({ x, y, w, h, uid, tone, children, grid, r = 6, bezel = 0, noGlass }: ScreenProps) {
  const [c0, c1] = toneBg[tone];
  const gid = `sg-${uid}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={c0} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      {bezel > 0 && (
        <rect
          x={x - bezel}
          y={y - bezel}
          width={w + bezel * 2}
          height={h + bezel * 2}
          rx={r + bezel * 0.7}
          fill={`url(#bezel-${uid})`}
        />
      )}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${gid})`} />
      {/* 顶部内阴影，制造凹入感 */}
      <path
        d={`M${x + r} ${y}h${w - r * 2}a${r} ${r} 0 0 1 ${r} ${r}v${Math.min(5, h * 0.2)}H${x}V${y + r}a${r} ${r} 0 0 1 ${r}-${r}z`}
        fill="#000000"
        opacity="0.26"
      />
      {!noGlass && <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#glass-${uid})`} />}
      {children}
      {grid && (
        <g opacity="0.2" stroke={toneGlow[tone]}>
          {Array.from({ length: Math.floor(w / 6) }).map((_, i) => (
            <line key={`v${i}`} x1={x + i * 6} y1={y} x2={x + i * 6} y2={y + h} strokeWidth="0.5" />
          ))}
          {Array.from({ length: Math.floor(h / 6) }).map((_, i) => (
            <line key={`h${i}`} x1={x} y1={y + i * 6} x2={x + w} y2={y + i * 6} strokeWidth="0.5" />
          ))}
        </g>
      )}
    </g>
  );
}

interface BtnProps {
  uid: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  label?: string;
  ink?: string;
  /** 正方形按键（截图键、HOME 键等） */
  square?: boolean;
}

/** 圆形/方形按键：径向渐变 + 顶部高光 + 细描边 */
function Btn({ uid, cx, cy, r, fill, label, ink = '#ffffff', square }: BtnProps) {
  const gid = `bt-${uid}-${Math.round(cx)}-${Math.round(cy)}-${square ? 's' : 'c'}`;
  const rr = square ? r * 0.75 : r;
  return (
    <g>
      <defs>
        <radialGradient id={gid} cx="0.34" cy="0.26" r="0.9">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.20" />
        </radialGradient>
      </defs>
      <rect
        x={cx - rr}
        y={cy - rr}
        width={rr * 2}
        height={rr * 2}
        rx={square ? rr * 0.4 : rr}
        fill={fill}
        filter={`url(#soft-${uid})`}
      />
      <rect
        x={cx - rr}
        y={cy - rr}
        width={rr * 2}
        height={rr * 2}
        rx={square ? rr * 0.4 : rr}
        fill={`url(#${gid})`}
      />
      <rect
        x={cx - rr + 0.6}
        y={cy - rr + 0.6}
        width={rr * 2 - 1.2}
        height={rr * 2 - 1.2}
        rx={square ? rr * 0.32 : rr - 0.6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {label && (
        <text
          x={cx}
          y={cy + r * 0.36}
          fontSize={r * 0.82}
          fill={ink}
          textAnchor="middle"
          style={{ fontWeight: 600 }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

interface DpadProps {
  uid: string;
  x: number;
  y: number;
  s?: number;
  fill?: string;
}

/** 十字键：哑光深色 + 顶部高光 + 中心圆 */
function DpadKey({ uid, x, y, s = 1, fill = '#33343a' }: DpadProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-4-17h8v13h13v8H4v13h-8V4h-13v-8h13z"
        fill={fill}
        filter={`url(#soft-${uid})`}
        strokeLinejoin="round"
      />
      <path
        d="M-4-17h8v13h13v2H4v13h-8V4h-13v-2h13z"
        fill="#ffffff"
        opacity="0.13"
      />
      <circle cx="0" cy="0" r="3.4" fill="#000000" opacity="0.22" />
    </g>
  );
}

/** 摇杆：底座凹槽 + 杆帽 */
function Stick({ uid, x, y, r = 13, cap = 7 }: { uid: string; x: number; y: number; r?: number; cap?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#0d0e11" opacity="0.55" />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx={x} cy={y - 0.8} r={cap} fill="#3c4048" filter={`url(#soft-${uid})`} />
      <circle cx={x} cy={y - 1.6} r={cap * 0.62} fill="#ffffff" opacity="0.16" />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffffff" strokeOpacity="0.10" strokeWidth="1" />
    </g>
  );
}

/** 触摸板：微凹矩形 */
function Trackpad({ uid, x, y, w, h }: { uid: string; x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#0e0f12" opacity="0.42" />
      <rect
        x={x + 0.6}
        y={y + 0.6}
        width={w - 1.2}
        height={h - 1.2}
        rx={3.6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.10"
        strokeWidth="1"
      />
      <path d={`M${x + 3} ${y + 1}h${w - 6}`} stroke="#000000" strokeOpacity="0.3" strokeWidth="1.4" />
    </g>
  );
}

/** PlayStation 菱形键 △○×□ */
function Diamond4({ uid, x, y, r = 6, g = 10, fill = '#4a4c54' }: {
  uid: string; x: number; y: number; r?: number; g?: number; fill?: string;
}) {
  return (
    <g>
      <Btn uid={uid} cx={x} cy={y - g} r={r} fill={fill} label="△" />
      <Btn uid={uid} cx={x + g} cy={y} r={r} fill={fill} label="○" />
      <Btn uid={uid} cx={x} cy={y + g} r={r} fill={fill} label="×" />
      <Btn uid={uid} cx={x - g} cy={y} r={r} fill={fill} label="□" />
    </g>
  );
}

/** Xbox 式 ABXY 菱形 */
function Abxy({ uid, x, y, r = 5.6, g = 9.4 }: { uid: string; x: number; y: number; r?: number; g?: number }) {
  return (
    <g>
      <Btn uid={uid} cx={x} cy={y - g} r={r} fill="#3a3d44" label="Y" />
      <Btn uid={uid} cx={x + g} cy={y} r={r} fill="#4a7a44" label="B" />
      <Btn uid={uid} cx={x} cy={y + g} r={r} fill="#8a4048" label="A" />
      <Btn uid={uid} cx={x - g} cy={y} r={r} fill="#3a6088" label="X" />
    </g>
  );
}

/** 两颗并排斜键（B 在左 A 在右，Game Boy 式） */
function Ba2({ uid, x, y, r = 8, gap = 19, fill = '#8e2b32' }: {
  uid: string; x: number; y: number; r?: number; gap?: number; fill?: string;
}) {
  return (
    <g>
      <Btn uid={uid} cx={x} cy={y} r={r} fill={fill} label="B" />
      <Btn uid={uid} cx={x + gap} cy={y - gap * 0.42} r={r} fill={fill} label="A" />
    </g>
  );
}

/** 两颗小功能键（SELECT / START） */
function TwoTaps({ uid, x, y, w = 22, h = 8, fill = '#8e9298', gap = 10 }: {
  uid: string; x: number; y: number; w?: number; h?: number; fill?: string; gap?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} filter={`url(#soft-${uid})`} />
      <rect x={x} y={y} width={w} height={h / 2.4} rx={h / 4} fill="#ffffff" opacity="0.16" />
      <rect x={x + gap} y={y} width={w} height={h} rx={h / 2} fill={fill} filter={`url(#soft-${uid})`} />
      <rect x={x + gap} y={y} width={w} height={h / 2.4} rx={h / 4} fill="#ffffff" opacity="0.16" />
    </g>
  );
}

/** 扬声器斜线格栅（DMG 风格：右下倾斜平行线） */
function SpeakerSlants({ x, y, n = 6, len = 20, gap = 4.4, c = '#5c584c', sw = 1.7 }: {
  x: number; y: number; n?: number; len?: number; gap?: number; c?: string; sw?: number;
}) {
  return (
  <g stroke={c} strokeWidth={sw} strokeLinecap="round" opacity="0.85">
    {Array.from({ length: n }).map((_, i) => (
      <line key={i} x1={x} y1={y + i * gap} x2={x + len} y2={y + i * gap + len * 0.4} />
    ))}
  </g>
  );
}

/** 圆点喇叭栅格 */
function SpeakerDots({ x, y, cols, rows, gap = 8, r = 1.5, c = '#000000' }: {
  x: number; y: number; cols: number; rows: number; gap?: number; r?: number; c?: string;
}) {
  return (
  <g fill={c} opacity="0.4">
    {Array.from({ length: cols * rows }).map((_, i) => (
      <circle key={i} cx={x + (i % cols) * gap} cy={y + Math.floor(i / cols) * gap} r={r} />
    ))}
  </g>
  );
}

/** 顶部/侧边细槽（卡带口、散热口等） */
function Slot({ x, y, width: w, h = 4, r = 2, fill = '#000000', o = 0.3 }: {
  x: number; y: number; width: number; h?: number; r?: number; fill?: string; o?: number;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} opacity={o} />;
}

/** 电源拨钮 */
function PowerSlider({ uid, x, y, w = 20, fill = '#5a5c62', knob = '#d8d4c4' }: {
  uid: string; x: number; y: number; w?: number; fill?: string; knob?: string;
}) {
  return (
  <g>
    <rect x={x} y={y} width={w} height={6} rx={3} fill={fill} opacity="0.55" />
    <rect x={x + 1.5} y={y + 0.8} width={w / 2.6} height={4.4} rx={2.2} fill={knob} filter={`url(#soft-${uid})`} />
  </g>
  );
}

/** 机身丝印小字 */
function Silk({ x, y, children, size = 6, fill = '#000000', o = 0.42, anchor = 'middle', weight = 500 }: {
  x: number; y: number; children: React.ReactNode; size?: number; fill?: string;
  o?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      opacity={o}
      textAnchor={anchor}
      letterSpacing={0.4}
      style={{ fontWeight: weight }}
    >
      {children}
    </text>
  );
}

/* ---------------- 造型上下文 ---------------- */

export interface ArtCtx {
  uid: string;
  tone: ScreenTone;
  grid?: boolean;
  inner?: React.ReactNode;
  /** 屏幕矩形，造型函数必须填写 */
  screen: Rect;
}

type ArtFn = (ctx: ArtCtx) => React.ReactNode;

const D = {
  green: '#a8bb7c',
  silver: '#c9ccd2',
  warm: '#dedad0',
  cream: '#e6e2d6',
  dark: '#2c2e33',
  darker: '#1e2024',
  black: '#26282d',
  slate: '#3c4048',
  blue: '#2a7ec4',
  red: '#c42a30',
  yellow: '#e8c84c',
  gold: '#d8c878',
  purple: '#7a5abc',
  magenta: '#b05898',
  white: '#f2f2f4',
  green2: '#4a5a4a',
  olive: '#7a8a5a',
  navy: '#2c3a4c',
  teal: '#2a4a4c',
  pink: '#d8a0b8',
  orange: '#d0703c',
  slate2: '#4a4e56',
  sand: '#cfc9b8',
};

/* ---------------- 造型注册表 ---------------- */

const ART: Record<string, ArtFn> = {
  /* ============ 1970s 早期固定游戏机 ============ */

  /** Mattel Auto Race (1976)：横置红壳，右侧 LED 点阵窗，左侧 4 挡开关，屏下转向拨杆 */
  'mattel-auto-race': ({ uid, grid, inner, screen }) => {
    screen.x = 158; screen.y = 92; screen.w = 122; screen.h = 66;
    return (
      <g>
        <Body uid={uid} x={16} y={68} width={288} height={124} r={16} fill={D.red} />
        <Sheen uid={uid} d="M32 70h256a14 14 0 0 1 14 14v22H18V84a14 14 0 0 1 14-14z" />
        {/* 正面黑色赛道覆膜 */}
        <rect x={148} y={80} width={142} height={92} rx={8} fill="#26221f" />
        <rect x={148} y={80} width={142} height={92} rx={8} fill={`url(#body-${uid})`} />
        <Screen {...screen} uid={uid} tone="led" grid={grid} r={3} noGlass>
          {inner}
        </Screen>
        {/* 左侧 4 挡滑动开关 */}
        <rect x={26} y={86} width={30} height={88} rx={7} fill="#3a1a12" opacity="0.85" />
        <rect x={30} y={92} width={22} height={11} rx={5.5} fill="#e0d2b0" filter={`url(#soft-${uid})`} />
        <Silk x={68} y={99} size={8} fill="#f3e2c6" o={0.92}>1</Silk>
        <Silk x={68} y={121} size={8} fill="#f3e2c6" o={0.92}>2</Silk>
        <Silk x={68} y={143} size={8} fill="#f3e2c6" o={0.92}>3</Silk>
        <Silk x={68} y={165} size={8} fill="#f3e2c6" o={0.92}>4</Silk>
        <Silk x={68} y={186} size={6} fill="#f0d8b8" o={0.62}>GEAR</Silk>
        {/* LED 窗正下方的转向拨杆 */}
        <rect x={192} y={164} width={52} height={14} rx={7} fill="#4a1c14" opacity="0.85" />
        <circle cx={218} cy={171} r={5.6} fill="#e8dcc0" filter={`url(#soft-${uid})`} />
        <Silk x={262} y={176} size={6.5} fill="#f0d8b8" o={0.6}>STEER</Silk>
        <Silk x={160} y={214} size={8} fill="#f6e6ca" o={0.6}>Auto Race · 1976 · 3×7 LED</Silk>
      </g>
    );
  },

  /** Milton Bradley Microvision (1979)：横置扁长，LCD 在左，右侧 2 列 × 6 行按键，右下大方向轮 */
  microvision: ({ uid, grid, inner, screen }) => {
    screen.x = 28; screen.y = 106; screen.w = 100; screen.h = 64;
    return (
      <g>
        <Body uid={uid} x={12} y={88} width={296} height={86} r={12} fill={D.slate} />
        <Slot x={12} y={92} width={296} h={3} o={0.16} />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={2} bezel={4}>
          {inner}
        </Screen>
        {/* 右侧 2 列 × 6 行按键矩阵 */}
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <Btn
              key={i}
              uid={uid}
              cx={154 + (i % 2) * 24}
              cy={100 + Math.floor(i / 2) * 11}
              r={5}
              fill="#6e727a"
            />
          ))}
        </g>
        {/* 右下角大方向轮 */}
        <g>
          <circle cx={254} cy={150} r={25} fill="#2a2c30" filter={`url(#soft-${uid})`} />
          <circle cx={254} cy={150} r={25} fill={`url(#body-${uid})`} />
          <circle cx={254} cy={150} r={25} fill="none" stroke="#ffffff" strokeOpacity="0.18" />
          {/* 方向轮的四向刻度 */}
          <g stroke="#a8adb6" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
            <line x1={254} y1={131} x2={254} y2={136} />
            <line x1={254} y1={164} x2={254} y2={169} />
            <line x1={235} y1={150} x2={240} y2={150} />
            <line x1={268} y1={150} x2={273} y2={150} />
          </g>
          <circle cx={254} cy={150} r={7.5} fill="#878c94" filter={`url(#soft-${uid})`} />
          <circle cx={254} cy={148.6} r={4} fill="#ffffff" opacity="0.2" />
        </g>
        <Silk x={160} y={196} size={8} fill="#d8dce2" o={0.5}>Microvision · 1979 · 16×16</Silk>
      </g>
    );
  },

  /* ============ 1980s 液晶与早期掌机 ============ */

  /** 任天堂 Game & Watch (1980 Ball)：竖置银壳，LCD 居中偏上，无十字键，GAME A/B 在屏下 */
  'game-and-watch': ({ uid, grid, inner, screen }) => {
    screen.x = 116; screen.y = 62; screen.w = 88; screen.h = 84;
    return (
      <g>
        <Body uid={uid} x={92} y={24} width={136} height={212} r={12} fill={D.silver} />
        <Sheen uid={uid} d="M104 26h112a10 10 0 0 1 10 10v34H94V36a10 10 0 0 1 10-10z" />
        <rect x={110} y={56} width={100} height={96} rx={6} fill="#e8e6df" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={2} bezel={3}>
          {inner}
        </Screen>
        {/* 左右两枚红色功能键 */}
        <Btn uid={uid} cx={106} cy={168} r={6} fill="#c0392f" />
        <Btn uid={uid} cx={214} cy={168} r={6} fill="#c0392f" />
        {/* GAME A / GAME B / TIME */}
        <g transform="rotate(-14 140 192)">
          <Btn uid={uid} cx={122} cy={186} r={6} fill="#8e9298" square />
          <Btn uid={uid} cx={150} cy={186} r={6} fill="#8e9298" square />
          <Btn uid={uid} cx={136} cy={214} r={5.4} fill="#a8acb2" square />
        </g>
        <Silk x={122} y={187} size={5} fill="#ffffff" o={0.75}>A</Silk>
        <Silk x={150} y={187} size={5} fill="#ffffff" o={0.75}>B</Silk>
        <Silk x={160} y={244} size={6.5} fill="#3a3e46" o={0.5}>GAME &amp; WATCH · 1980</Silk>
      </g>
    );
  },

  /** Epoch Game Pocket Computer (1984)：横置，左十字键-中屏-右动作键三段式 */
  'epoch-gpc': ({ uid, grid, inner, screen }) => {
    screen.x = 116; screen.y = 78; screen.w = 92; screen.h = 74;
    return (
      <g>
        <Body uid={uid} x={14} y={66} width={292} height={128} r={14} fill={D.warm} />
        <Sheen uid={uid} d="M28 68h264a12 12 0 0 1 12 12v20H16V80a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={62} y={112} s={1.15} fill="#3f4a52" />
        <Abxy uid={uid} x={252} y={104} r={5.4} g={9} />
        <TwoTaps uid={uid} x={238} y={146} w={18} h={7} fill="#8a8574" gap={8} />
        <Silk x={160} y={212} size={8} fill="#3a362c" o={0.45}>Game Pocket Computer · 1984</Silk>
      </g>
    );
  },

  /** 任天堂 Game Boy DMG-01 (1989)：竖置 1.64:1，深色屏幕衬底，左下十字键，右下 A/B 横排 */
  'game-boy': ({ uid, grid, inner, screen }) => {
    screen.x = 126; screen.y = 60; screen.w = 68; screen.h = 56;
    return (
      <g>
        <Body uid={uid} x={110} y={14} width={100} height={232} r={12} fill="#c9c7b6" />
        <Sheen uid={uid} d="M122 16h76a10 10 0 0 1 10 10v18H112V26a10 10 0 0 1 10-10z" />
        {/* DMG 标志性的深色屏幕衬底 */}
        <rect x={116} y={48} width={88} height={80} rx={6} fill="#4a4a52" />
        <rect x={116} y={48} width={88} height={80} rx={6} fill={`url(#body-${uid})`} />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={2} bezel={3}>
          {inner}
        </Screen>
        <Silk x={160} y={138} size={5} fill="#3a382e" o={0.55}>DOT MATRIX WITH STEREO SOUND</Silk>
        <DpadKey uid={uid} x={132} y={178} s={1.18} fill="#3f3d48" />
        <Ba2 uid={uid} x={166} y={176} r={10} gap={24} />
        <SpeakerSlants x={190} y={210} n={4} len={16} gap={4.6} />
        <g transform="rotate(-20 160 210)">
          <TwoTaps uid={uid} x={140} y={206} w={19} h={7.5} fill="#9c9888" gap={7} />
        </g>
        <Silk x={116} y={228} size={5} fill="#4a4638" o={0.6} anchor="start">Nintendo</Silk>
        <Silk x={116} y={238} size={7.4} fill="#2a4a8a" o={0.8} anchor="start" weight={700}>GAME BOY</Silk>
        <PowerSlider uid={uid} x={120} y={18} />
      </g>
    );
  },

  /** Atari Lynx (1989)：横置宽扁，屏幕居中，左十字键，右侧 6 键 2 列 × 3 行 */
  lynx: ({ uid, grid, inner, screen }) => {
    screen.x = 108; screen.y = 80; screen.w = 104; screen.h = 78;
    return (
      <g>
        <Body uid={uid} x={12} y={66} width={296} height={128} r={24} fill={D.slate} />
        <Sheen uid={uid} d="M36 68h248a22 22 0 0 1 22 22v16H14V90a22 22 0 0 1 22-22z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={50} y={112} s={1.05} fill="#26262b" />
        <g>
          {Array.from({ length: 6 }).map((_, i) => (
            <Btn
              key={i}
              uid={uid}
              cx={244 + (i % 2) * 20}
              cy={96 + Math.floor(i / 2) * 17}
              r={6.4}
              fill="#8d919c"
            />
          ))}
        </g>
        <TwoTaps uid={uid} x={134} y={174} w={22} h={8} fill="#2c2c32" gap={12} />
        <Silk x={160} y={214} size={8} fill="#d0d4dc" o={0.5}>Atari Lynx · 3.5" 彩色背光</Silk>
      </g>
    );
  },

  /* ============ 1990s 横向掌机与街机移植 ============ */

  /** 世嘉 Game Gear (1990)：横置 1.86:1，屏幕在左，十字键在右，6 键 2×3 */
  'game-gear': ({ uid, grid, inner, screen }) => {
    screen.x = 34; screen.y = 78; screen.w = 132; screen.h = 100;
    return (
      <g>
        <Body uid={uid} x={14} y={62} width={292} height={136} r={16} fill={D.darker} />
        <Sheen uid={uid} d="M30 64h260a14 14 0 0 1 14 14v22H16V78a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={226} y={104} s={1.1} fill="#24242a" />
        <g>
          {Array.from({ length: 6 }).map((_, i) => (
            <Btn
              key={i}
              uid={uid}
              cx={256 + (i % 2) * 19}
              cy={150 + Math.floor(i / 2) * 16}
              r={5.6}
              fill="#b8bcc4"
              label={['1', '2', '3', '4', '5', '6'][i]}
              ink="#2c2e34"
            />
          ))}
        </g>
        <TwoTaps uid={uid} x={92} y={186} w={18} h={7} fill="#6e727a" gap={8} />
        <SpeakerDots x={26} y={188} cols={4} rows={1} gap={7} r={2.2} />
        <Silk x={160} y={220} size={8} fill="#c8ccd4" o={0.5}>Game Gear · 1990</Silk>
      </g>
    );
  },

  /** Watara Supervision (1992)：横置，方形屏居中，左十字键、右 A/B 斜键 */
  'watara-supervision': ({ uid, grid, inner, screen }) => {
    screen.x = 116; screen.y = 68; screen.w = 88; screen.h = 88;
    return (
      <g>
        <Body uid={uid} x={18} y={60} width={284} height={140} r={12} fill={D.warm} />
        <Sheen uid={uid} d="M32 62h256a12 12 0 0 1 12 12v18H20V74a12 12 0 0 1 12-12z" />
        <SpeakerDots x={132} y={65} cols={7} rows={1} gap={9} r={1.6} />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={62} y={112} s={1.05} fill="#3c4048" />
        <Btn uid={uid} cx={240} cy={100} r={8} fill="#8a3a44" label="A" />
        <Btn uid={uid} cx={256} cy={124} r={8} fill="#8a3a44" label="B" />
        <TwoTaps uid={uid} x={138} y={178} w={26} h={8} fill="#8e8a7c" gap={10} />
        <Silk x={151} y={176} size={5} fill="#ffffff" o={0.7}>SELECT</Silk>
        <Silk x={187} y={176} size={5} fill="#ffffff" o={0.7}>START</Silk>
        <Silk x={160} y={218} size={8} fill="#3a362c" o={0.45}>Watara Supervision · 1992</Silk>
      </g>
    );
  },

  /** Tiger game.com (1997)：横置，左触摸屏+触控笔槽，左十字键，右 A/B/C/D 弧形横排 */
  'game.com': ({ uid, grid, inner, screen }) => {
    screen.x = 28; screen.y = 84; screen.w = 128; screen.h = 92;
    return (
      <g>
        <Body uid={uid} x={12} y={70} width={296} height={124} r={13} fill={D.silver} />
        <Sheen uid={uid} d="M26 72h268a12 12 0 0 1 12 12v18H14V84a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        {/* 触控笔收纳槽 */}
        <rect x={166} y={82} width={9} height={98} rx={4.5} fill="#c2c0b8" />
        <path d="M168 86v90" stroke="#000000" strokeOpacity="0.18" strokeWidth="2" />
        <DpadKey uid={uid} x={44} y={180} s={0.85} fill="#3a3a42" />
        <g>
          <Btn uid={uid} cx={216} cy={172} r={7} fill="#5a6470" label="A" ink="#eef0f2" />
          <Btn uid={uid} cx={236} cy={166} r={7} fill="#5a6470" label="B" ink="#eef0f2" />
          <Btn uid={uid} cx={256} cy={166} r={7} fill="#5a6470" label="C" ink="#eef0f2" />
          <Btn uid={uid} cx={276} cy={172} r={7} fill="#5a6470" label="D" ink="#eef0f2" />
        </g>
        <TwoTaps uid={uid} x={212} y={146} w={22} h={7} fill="#9a9890" gap={6} />
        <Silk x={160} y={214} size={8} fill="#2e3038" o={0.45}>game.com · 1997 · 触控笔</Silk>
      </g>
    );
  },

  /* ============ 1990s 掌机争霸 ============ */

  /** Neo Geo Pocket (1998)：横置小掌机，超宽横屏居中，十字键在左 */
  'neo-geo-pocket': ({ uid, grid, inner, screen }) => {
    screen.x = 92; screen.y = 76; screen.w = 136; screen.h = 80;
    return (
      <g>
        <Body uid={uid} x={16} y={66} width={288} height={128} r={18} fill={D.slate} />
        <Sheen uid={uid} d="M34 68h252a16 16 0 0 1 16 16v20H18V84a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={50} y={118} s={0.95} fill="#262a33" />
        <Abxy uid={uid} x={50} y={164} r={5} g={8.4} />
        <TwoTaps uid={uid} x={258} y={126} w={20} h={7} fill="#5a5f6c" gap={8} />
        <Silk x={160} y={214} size={8} fill="#c4c8d2" o={0.5}>Neo Geo Pocket · 1998</Silk>
      </g>
    );
  },

  /** SNK Neo Geo X (1999)：横置，屏在左，十字键右上，动作键右下 */
  'neo-geo-x': ({ uid, grid, inner, screen }) => {
    screen.x = 26; screen.y = 80; screen.w = 128; screen.h = 88;
    return (
      <g>
        <Body uid={uid} x={12} y={68} width={296} height={128} r={16} fill={D.darker} />
        <Sheen uid={uid} d="M28 70h264a14 14 0 0 1 14 14v20H14V84a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={200} y={102} s={1} fill="#22242a" />
        <Abxy uid={uid} x={254} y={152} r={5.4} g={9} />
        <Silk x={186} y={146} size={6} fill="#9aa0ac" o={0.6}>A</Silk>
        <Silk x={186} y={160} size={6} fill="#9aa0ac" o={0.6}>B</Silk>
        <Silk x={160} y={216} size={8} fill="#b8bcc6" o={0.5}>Neo Geo X · 1999</Silk>
      </g>
    );
  },

  /** 世嘉 Game Gear Nomad (1995)：横置改装机，暗红机身 */
  'sega-nomad': ({ uid, grid, inner, screen }) => {
    screen.x = 88; screen.y = 78; screen.w = 144; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={10} y={64} width={300} height={136} r={16} fill="#7a3038" />
        <Sheen uid={uid} d="M26 66h268a14 14 0 0 1 14 14v20H12V80a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={52} y={106} s={1} fill="#2a2226" />
        <g>
          {Array.from({ length: 6 }).map((_, i) => (
            <Btn
              key={i}
              uid={uid}
              cx={248 + (i % 2) * 19}
              cy={98 + Math.floor(i / 2) * 17}
              r={6}
              fill="#c8b0b4"
            />
          ))}
        </g>
        <Silk x={160} y={220} size={8} fill="#e0c8cc" o={0.5}>Game Gear Nomad · 1995</Silk>
      </g>
    );
  },

  /** 世嘉 Mega Duck (1992)：横置，屏在左，十字键右上 */
  'mega-duck': ({ uid, grid, inner, screen }) => {
    screen.x = 30; screen.y = 80; screen.w = 124; screen.h = 88;
    return (
      <g>
        <Body uid={uid} x={16} y={70} width={288} height={124} r={13} fill={D.sand} />
        <Sheen uid={uid} d="M30 72h260a12 12 0 0 1 12 12v18H18V84a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={210} y={100} s={1} fill="#3c3a34" />
        <Ba2 uid={uid} x={236} y={150} r={7} gap={17} fill="#6a6470" />
        <Silk x={160} y={214} size={8} fill="#3a362c" o={0.45}>Mega Duck · 1992</Silk>
      </g>
    );
  },

  /** 世嘉 PC Engine GT (1990)：横置大掌机，屏偏左，右侧十字键与动作键 */
  'pc-engine-gt': ({ uid, grid, inner, screen }) => {
    screen.x = 40; screen.y = 76; screen.w = 132; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={12} y={64} width={296} height={136} r={16} fill={D.cream} />
        <Sheen uid={uid} d="M28 66h264a14 14 0 0 1 14 14v20H14V80a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={224} y={100} s={1.05} fill="#33342e" />
        <Abxy uid={uid} x={256} y={156} r={5.4} g={9} />
        <TwoTaps uid={uid} x={198} y={164} w={20} h={7} fill="#8e8a7c" gap={8} />
        <Silk x={160} y={220} size={8} fill="#3a362c" o={0.45}>PC Engine GT · 1990</Silk>
      </g>
    );
  },

  /** 世嘉 WonderSwan (1999)：横置小掌机，屏偏左，左十字键，右 B/A 竖排 */
  wonderswan: ({ uid, grid, inner, screen }) => {
    screen.x = 74; screen.y = 78; screen.w = 128; screen.h = 80;
    return (
      <g>
        <Body uid={uid} x={20} y={68} width={280} height={124} r={20} fill="#e4e0ea" />
        <Sheen uid={uid} d="M40 70h240a18 18 0 0 1 18 18v18H22V88a18 18 0 0 1 18-18z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={52} y={108} s={0.9} fill="#3a3844" />
        <Btn uid={uid} cx={234} cy={96} r={7.4} fill="#8e2b32" label="B" />
        <Btn uid={uid} cx={234} cy={118} r={7.4} fill="#8e2b32" label="A" />
        <TwoTaps uid={uid} x={248} y={150} w={16} h={7} fill="#6a6474" gap={7} />
        <Silk x={160} y={214} size={8} fill="#3a3644" o={0.45}>WonderSwan · 1999</Silk>
      </g>
    );
  },

  /** 宝丽翠 Pokemon mini (2001)：极小横置机身，超宽比例 */
  'pokemon-mini': ({ uid, grid, inner, screen }) => {
    screen.x = 92; screen.y = 90; screen.w = 136; screen.h = 60;
    return (
      <g>
        <Body uid={uid} x={30} y={82} width={260} height={92} r={13} fill={D.yellow} />
        <Sheen uid={uid} d="M44 84h232a12 12 0 0 1 12 12v14H32V96a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={3} bezel={3}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={60} y={124} s={0.8} fill="#4a4428" />
        <Btn uid={uid} cx={252} cy={116} r={6.6} fill="#5a6470" />
        <Btn uid={uid} cx={252} cy={138} r={6.6} fill="#5a6470" />
        <Silk x={160} y={198} size={8} fill="#4a3c10" o={0.5}>Pokémon mini · 2001</Silk>
      </g>
    );
  },

  /* ============ 2000s 掌机新世代 ============ */

  /** Game Boy Pocket (1996)：取消 DMG 深色衬底，机身更薄更方 */
  'game-boy-pocket': ({ uid, grid, inner, screen }) => {
    screen.x = 128; screen.y = 58; screen.w = 64; screen.h = 52;
    return (
      <g>
        <Body uid={uid} x={106} y={16} width={108} height={228} r={16} fill="#bcbace" />
        <Sheen uid={uid} d="M122 18h76a14 14 0 0 1 14 14v20H108V32a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={3} bezel={3}>
          {inner}
        </Screen>
        <PowerSlider uid={uid} x={118} y={20} />
        <DpadKey uid={uid} x={134} y={170} s={0.9} fill="#42405a" />
        <Ba2 uid={uid} x={172} y={174} r={8} gap={19} />
        <g transform="rotate(-20 160 208)">
          <TwoTaps uid={uid} x={140} y={204} w={19} h={7.5} fill="#9c9ab0" gap={7} />
        </g>
        <SpeakerSlants x={184} y={194} n={5} len={16} gap={4} c="#86849a" />
        <Silk x={160} y={238} size={6.4} fill="#3a3648" o={0.5}>Game Boy Pocket · 1996</Silk>
      </g>
    );
  },

  /** Game Boy Light (1998)：Pocket 基础上加电致发光背光开关 */
  'game-boy-light': ({ uid, grid, inner, screen }) => {
    screen.x = 128; screen.y = 58; screen.w = 64; screen.h = 52;
    return (
      <g>
        <Body uid={uid} x={106} y={16} width={108} height={228} r={16} fill={D.gold} />
        <Sheen uid={uid} d="M122 18h76a14 14 0 0 1 14 14v20H108V32a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={3} bezel={3}>
          {inner}
        </Screen>
        {/* 背光开关（Pocket 无此件，为 Light 的外观差异） */}
        <rect x={188} y={24} width={9} height={13} rx={3} fill="#8e8250" filter={`url(#soft-${uid})`} />
        <PowerSlider uid={uid} x={118} y={20} />
        <DpadKey uid={uid} x={134} y={170} s={0.9} fill="#4a4428" />
        <Ba2 uid={uid} x={172} y={174} r={8} gap={19} />
        <g transform="rotate(-20 160 208)">
          <TwoTaps uid={uid} x={140} y={204} w={19} h={7.5} fill="#a89c60" gap={7} />
        </g>
        <SpeakerSlants x={184} y={194} n={5} len={16} gap={4} c="#9a8c54" />
        <Silk x={160} y={238} size={6} fill="#4a3c10" o={0.55}>Game Boy Light · 1998 · 电致发光背光</Silk>
      </g>
    );
  },

  /** Game Boy Color (1998)：透明彩色外壳，顶部红外口，无对比度旋钮 */
  'game-boy-color': ({ uid, grid, inner, screen }) => {
    screen.x = 130; screen.y = 56; screen.w = 62; screen.h = 50;
    return (
      <g>
        <Body uid={uid} x={108} y={14} width={104} height={232} r={16} fill={D.magenta} />
        <Sheen uid={uid} d="M124 16h72a14 14 0 0 1 14 14v20H110V30a14 14 0 0 1 14-14z" />
        <rect x={122} y={48} width={78} height={68} rx={5} fill="#ffffff" opacity="0.14" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={3} bezel={3}>
          {inner}
        </Screen>
        {/* 顶部红外口（Color 新增） */}
        <rect x={182} y={18} width={11} height={6} rx={3} fill="#5a2050" />
        <PowerSlider uid={uid} x={120} y={18} />
        <DpadKey uid={uid} x={134} y={170} s={0.9} fill="#5a2a48" />
        <Ba2 uid={uid} x={172} y={174} r={8} gap={19} fill="#c02a5a" />
        <g transform="rotate(-20 160 208)">
          <TwoTaps uid={uid} x={140} y={204} w={19} h={7.5} fill="#a04080" gap={7} />
        </g>
        <SpeakerSlants x={184} y={194} n={5} len={16} gap={4} c="#7c2c60" />
        <Silk x={160} y={238} size={6.4} fill="#ffffff" o={0.7}>Game Boy Color · 1998</Silk>
      </g>
    );
  },

  /** Game Boy Advance (2001)：横置半梯形斜边机身 */
  gba: ({ uid, grid, inner, screen }) => {
    screen.x = 92; screen.y = 76; screen.w = 136; screen.h = 92;
    return (
      <g>
        {/* 半梯形：两侧边向右下倾斜收窄 */}
        <path d="M42 62h236l14 132H28z" fill={D.purple} filter={`url(#drop-${uid})`} />
        <path d="M42 62h236l14 132H28z" fill={`url(#body-${uid})`} />
        <path d="M42 62h236l3 12H39z" fill="#ffffff" opacity="0.18" />
        <path
          d="M42.8 62.8h234.4l13.6 130.4H29.2z"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={54} y={114} s={1} fill="#3a2a5a" />
        <Ba2 uid={uid} x={252} y={110} r={8} gap={19} fill="#c04a6a" />
        {/* L/R 肩键斜面 */}
        <path d="M46 62l-8-8h34l4 8z" fill="#4a3480" />
        <path d="M274 62l8-8h-34l-4 8z" fill="#4a3480" />
        <TwoTaps uid={uid} x={136} y={170} w={22} h={8} fill="#4a3480" gap={12} />
        <Silk x={160} y={222} size={8} fill="#eae2f8" o={0.7}>Game Boy Advance · 2001</Silk>
      </g>
    );
  },

  /** Game Boy Advance SP (2003)：方形翻盖，铰链在后缘中央，闭合上盖无外屏 */
  'gbc-variant-pocket': ({ uid, grid, inner, screen }) => {
    screen.x = 100; screen.y = 92; screen.w = 120; screen.h = 82;
    return (
      <g>
        {/* 铰链在后缘中央 */}
        <rect x={124} y={54} width={72} height={13} rx={6.5} fill="#3e3e4a" filter={`url(#soft-${uid})`} />
        <rect x={124} y={54} width={72} height={5} rx={2.5} fill="#ffffff" opacity="0.14" />
        <Body uid={uid} x={84} y={62} width={152} height={160} r={16} fill={D.slate} />
        <Sheen uid={uid} d="M100 64h120a14 14 0 0 1 14 14v18H86V78a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={112} y={188} s={0.82} fill="#2e2e38" />
        <Ba2 uid={uid} x={196} y={192} r={6.4} gap={15} fill="#7a4a6a" />
        <TwoTaps uid={uid} x={144} y={198} w={20} h={7} fill="#3e3e4a" gap={10} />
        <Silk x={160} y={240} size={7.4} fill="#d8dce4" o={0.55}>GBA SP · 2003 · 翻盖式</Silk>
      </g>
    );
  },

  /** 索尼 PSP-1000 (2004)：横置条形，屏偏左，nub 在十字键下方，右 △○×□ 菱形 */
  psp: ({ uid, grid, inner, screen }) => {
    screen.x = 46; screen.y = 64; screen.w = 196; screen.h = 100;
    return (
      <g>
        <Body uid={uid} x={14} y={44} width={292} height={172} r={16} fill={D.black} />
        <Sheen uid={uid} d="M30 46h260a14 14 0 0 1 14 14v24H16V60a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="wide" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        {/* 屏幕正下方辅助键行 */}
        <TwoTaps uid={uid} x={60} y={170} w={17} h={6} fill="#4a4c54" gap={8} />
        <TwoTaps uid={uid} x={224} y={170} w={17} h={6} fill="#4a4c54" gap={8} />
        <Btn uid={uid} cx={272} cy={173} r={4.4} fill="#4a4c54" />
        {/* 左：十字键在上，模拟 nub 在其正下方 */}
        <DpadKey uid={uid} x={36} y={196} s={0.6} fill="#4e5058" />
        <Stick uid={uid} x={36} y={211} r={5.4} cap={3.2} />
        {/* 右：PlayStation 传统菱形 */}
        <Diamond4 uid={uid} x={272} y={194} r={6} g={10} />
        <Silk x={64} y={196} size={6} fill="#a8aab2" o={0.6} anchor="start">PSP</Silk>
        <Silk x={160} y={236} size={7} fill="#a8aab2" o={0.5}>PSP-1000 · 2004 · 模拟 nub 在十字键下方</Silk>
      </g>
    );
  },

  /** 任天堂 DS (2004)：打开后左右并排双屏，铰链在机身中央 */
  'nintendo-ds': ({ uid, grid, inner, screen }) => {
    screen.x = 24; screen.y = 76; screen.w = 128; screen.h = 104;
    return (
      <g>
        {/* 铰链在机身中央 */}
        <rect x={157} y={62} width={14} height={132} rx={5} fill="#9ea2aa" />
        <rect x={157} y={62} width={14} height={132} rx={5} fill={`url(#body-${uid})`} />
        {/* 左半：上屏 */}
        <Body uid={uid} x={12} y={62} width={148} height={132} r={14} fill={D.silver} />
        <Sheen uid={uid} d="M26 64h120a12 12 0 0 1 12 12v16H14V76a12 12 0 0 1 12-12z" />
        <Screen x={24} y={76} w={128} h={104} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <Silk x={86} y={192} size={5.6} fill="#3a3e46" o={0.5}>上屏 · 显示结果</Silk>
        {/* 右半：下屏触摸 + 十字键 + 四键 */}
        <Body uid={uid} x={168} y={62} width={140} height={132} r={14} fill="#c9ccd3" />
        <Sheen uid={uid} d="M182 64h112a12 12 0 0 1 12 12v16H170V76a12 12 0 0 1 12-12z" />
        <Screen x={178} y={80} w={120} h={76} uid={uid} tone="color" grid={grid} r={4} bezel={3}>
          <Silk x={238} y={122} size={7} fill="#a8e0ff" o={0.85}>下屏 · 触摸操作区</Silk>
        </Screen>
        <DpadKey uid={uid} x={188} y={176} s={0.72} fill="#6f747e" />
        <Abxy uid={uid} x={284} y={170} r={5} g={8} />
        <TwoTaps uid={uid} x={222} y={186} w={12} h={6} fill="#9ea2aa" gap={7} />
        {/* 左上边缘电源拨钮 */}
        <PowerSlider uid={uid} x={22} y={56} w={22} />
        <Silk x={238} y={212} size={6.4} fill="#3a3e46" o={0.5}>Nintendo DS · 2004 · 双屏左右并排</Silk>
      </g>
    );
  },

  /** Nintendo 3DS (2011)：竖置，上屏比下屏宽并向右滑出（3D 滑轨） */
  '3ds': ({ uid, grid, inner, screen }) => {
    screen.x = 92; screen.y = 54; screen.w = 132; screen.h = 66;
    return (
      <g>
        {/* 下壳（较窄） */}
        <Body uid={uid} x={62} y={116} width={164} height={128} r={16} fill={D.slate} />
        {/* 上壳（更宽，向右滑出） */}
        <Body uid={uid} x={52} y={20} width={204} height={98} r={16} fill="#3c3c44" />
        <Sheen uid={uid} d="M68 22h172a14 14 0 0 1 14 14v18H54V36a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        {/* 上屏正上方居中摄像头 */}
        <circle cx={154} cy={31} r={3.6} fill="#14161a" />
        <circle cx={154} cy={31} r={1.4} fill="#4a5560" />
        {/* 外壳左右两颗立体摄像头 */}
        <circle cx={62} cy={110} r={3.4} fill="#14161a" />
        <circle cx={246} cy={110} r={3.4} fill="#14161a" />
        {/* 下屏（触摸） */}
        <Screen x={78} y={126} w={132} h={70} uid={uid} tone="color" grid={grid} r={4} bezel={3}>
          <Silk x={144} y={166} size={7} fill="#a8e0ff" o={0.85}>下屏 · 触摸操作区</Silk>
        </Screen>
        {/* 十字键左上，C-Pad 在其正下方 */}
        <DpadKey uid={uid} x={82} y={208} s={0.5} fill="#6e727c" />
        <Stick uid={uid} x={82} y={232} r={7} cap={4} />
        {/* ABXY 右上菱形，HOME 在其下 */}
        <Abxy uid={uid} x={212} y={204} r={5.6} g={9.4} />
        <Btn uid={uid} cx={212} cy={236} r={4.6} fill="#5a5e68" />
        <TwoTaps uid={uid} x={132} y={210} w={16} h={6} fill="#b4b8c2" gap={8} />
        {/* 右侧 3D 滑钮：位于上下壳之间的机身右缘内 */}
        <rect x={246} y={112} width={10} height={16} rx={4} fill="#6e727c" filter={`url(#soft-${uid})`} />
        <rect x={244} y={108} width={14} height={24} rx={5} fill="#2a2c32" opacity="0.35" />
      </g>
    );
  },

  /** 索尼 PS Vita (2011)：Sony 菱形双摇杆，正面无触摸板 */
  'ps-vita': ({ uid, grid, inner, screen }) => {
    screen.x = 76; screen.y = 66; screen.w = 168; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={14} y={44} width={292} height={172} r={22} fill={D.darker} />
        <Sheen uid={uid} d="M36 46h248a20 20 0 0 1 20 20v20H16V66a20 20 0 0 1 20-20z" />
        <Screen {...screen} uid={uid} tone="wide" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        {/* 左摇杆在左上外侧，十字键在其正下方 */}
        <Stick uid={uid} x={48} y={76} r={11} cap={6} />
        <DpadKey uid={uid} x={48} y={122} s={0.62} fill="#3c3e46" />
        {/* 右摇杆在右下，四键在其正上方 */}
        <Diamond4 uid={uid} x={272} y={98} r={6} g={10} />
        <Stick uid={uid} x={272} y={148} r={11} cap={6} />
        <TwoTaps uid={uid} x={124} y={174} w={16} h={6} fill="#4a4c54" gap={8} />
        <Btn uid={uid} cx={176} cy={177} r={4} fill="#4a4c54" />
        <Silk x={160} y={236} size={7} fill="#a8aab2" o={0.5}>PS Vita · 2011 · 双摇杆菱形，触摸板在背面</Silk>
      </g>
    );
  },

  /** 任天堂 Switch (2017)：横向机身 + 左右可拆 Joy-Con（首发左蓝右红） */
  switch: ({ uid, grid, inner, screen, tone }) => {
    screen.x = 82; screen.y = 58; screen.w = 156; screen.h = 88;
    return (
      <g>
        {/* 左 Joy-Con */}
        <Body uid={uid} x={14} y={42} width={52} height={120} r={14} fill={D.blue} />
        <Sheen uid={uid} d="M26 44h28a12 12 0 0 1 12 12v16H14V56a12 12 0 0 1 12-12z" />
        <Btn uid={uid} cx={40} cy={68} r={5.4} fill="#1c5c94" />
        <rect x={27} y={86} width={8} height={22} rx={4} fill="#1c5c94" filter={`url(#soft-${uid})`} />
        <Btn uid={uid} cx={50} cy={90} r={7.4} fill="#1c5c94" />
        <TwoTaps uid={uid} x={28} y={132} w={24} h={6} fill="#1c5c94" gap={8} />
        {/* 机身本体 */}
        <Body uid={uid} x={62} y={42} width={196} height={120} r={10} fill={D.dark} />
        <Screen
          {...screen}
          uid={uid}
          tone={tone === 'lcd-green' || tone === 'lcd-gray' || tone === 'led' ? 'color' : tone}
          grid={grid}
          r={4}
          bezel={4}
        >
          {inner}
        </Screen>
        {/* 右 Joy-Con */}
        <Body uid={uid} x={254} y={42} width={52} height={120} r={14} fill={D.red} />
        <Sheen uid={uid} d="M266 44h28a12 12 0 0 1 12 12v16H254V56a12 12 0 0 1 12-12z" />
        <Btn uid={uid} cx={280} cy={68} r={5.4} fill="#941c22" />
        <Btn uid={uid} cx={270} cy={90} r={7.4} fill="#941c22" />
        <rect x={285} y={86} width={8} height={22} rx={4} fill="#941c22" filter={`url(#soft-${uid})`} />
        <TwoTaps uid={uid} x={268} y={132} w={24} h={6} fill="#941c22" gap={8} />
        {/* HOME 在左下、截图键在右下 */}
        <Btn uid={uid} cx={74} cy={155} r={4.6} fill="#585b62" />
        <Btn uid={uid} cx={246} cy={152} r={4.6} fill="#585b62" square />
        {/* 底座：紧贴机身下沿，中间为插入的机身导轨 */}
        <Body uid={uid} x={56} y={176} width={208} height={42} r={10} fill="#33353b" />
        <rect x={108} y={170} width={104} height={16} rx={5} fill={D.dark} filter={`url(#soft-${uid})`} />
        <path d="M112 176h96v4h-96z" fill="#ffffff" opacity="0.12" />
        <rect x={64} y={190} width={8} height={20} rx={4} fill="#5b8fd0" />
        <Silk x={160} y={238} size={7} fill="#6a6c74" o={0.75}>Switch · 2017 · 底座输出至电视</Silk>
      </g>
    );
  },

  /** Switch Lite (2019)：一体式不可拆手柄，5.5 吋屏，无底座 */
  'switch-lite': ({ uid, grid, inner, screen }) => {
    screen.x = 86; screen.y = 56; screen.w = 148; screen.h = 90;
    return (
      <g>
        <Body uid={uid} x={22} y={48} width={276} height={122} r={22} fill="#8e8e96" />
        <Sheen uid={uid} d="M44 50h232a20 20 0 0 1 20 20v16H24V70a20 20 0 0 1 20-20z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={6} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={48} y={72} s={0.62} fill="#4a4d54" />
        <Abxy uid={uid} x={272} y={72} r={5.4} g={9} />
        <Stick uid={uid} x={48} y={128} r={11} cap={6} />
        <Stick uid={uid} x={272} y={128} r={11} cap={6} />
        <TwoTaps uid={uid} x={132} y={160} w={16} h={6} fill="#6e727a" gap={8} />
        <Silk x={160} y={198} size={7.4} fill="#e8eaee" o={0.7}>Switch Lite · 2019 · 一体手柄 · 无底座</Silk>
      </g>
    );
  },

  /** Switch OLED (2021)：7 吋 OLED 白边框，仍可拆 Joy-Con 仍有底座，后部支架 */
  'switch-oled': ({ uid, grid, inner, screen }) => {
    screen.x = 76; screen.y = 54; screen.w = 168; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={16} y={38} width={52} height={124} r={14} fill={D.white} />
        <Btn uid={uid} cx={42} cy={64} r={5.4} fill="#d4d6da" />
        <rect x={29} y={82} width={8} height={22} rx={4} fill="#d4d6da" filter={`url(#soft-${uid})`} />
        <Btn uid={uid} cx={52} cy={86} r={7.4} fill="#d4d6da" />
        <Body uid={uid} x={66} y={38} width={188} height={124} r={10} fill={D.white} />
        <Screen {...screen} uid={uid} tone="oled" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <Body uid={uid} x={252} y={38} width={52} height={124} r={14} fill={D.white} />
        <Btn uid={uid} cx={280} cy={64} r={5.4} fill="#d4d6da" />
        <Btn uid={uid} cx={270} cy={86} r={7.4} fill="#d4d6da" />
        <rect x={283} y={82} width={8} height={22} rx={4} fill="#d4d6da" filter={`url(#soft-${uid})`} />
        <Btn uid={uid} cx={78} cy={155} r={4.6} fill="#d4d6da" />
        <Btn uid={uid} cx={238} cy={152} r={4.6} fill="#d4d6da" square />
        {/* 后部支架 */}
        <rect x={132} y={166} width={56} height={11} rx={5} fill="#c8cace" filter={`url(#soft-${uid})`} />
        <Body uid={uid} x={52} y={188} width={216} height={36} r={10} fill="#33353b" />
        <Silk x={160} y={240} size={7} fill="#a8aab2" o={0.5}>Switch OLED · 2021 · 7" OLED · 白色边框</Silk>
      </g>
    );
  },

  /** Steam Deck (2022)：握把外扩，十字键在上摇杆在下，触摸板分置屏幕左右下方 */
  'steam-deck': ({ uid, grid, inner, screen }) => {
    screen.x = 90; screen.y = 62; screen.w = 140; screen.h = 100;
    return (
      <g>
        <Body uid={uid} x={20} y={40} width={280} height={128} r={16} fill={D.darker} />
        <Sheen uid={uid} d="M40 42h240a16 16 0 0 1 16 16v18H24V58a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="wide" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        {/* 左：十字键最靠上 → 左摇杆 → 左触摸板 → Steam 键 */}
        <DpadKey uid={uid} x={56} y={70} s={0.62} fill="#4a4d54" />
        <Stick uid={uid} x={56} y={110} r={13} cap={7} />
        <Trackpad uid={uid} x={40} y={130} w={32} h={28} />
        <Btn uid={uid} cx={56} cy={172} r={5} fill="#3a3d44" />
        {/* 右：ABXY 最靠上 → 右摇杆 → 右触摸板 → ⋯ 键 */}
        <Abxy uid={uid} x={264} y={70} r={5.6} g={9.4} />
        <Stick uid={uid} x={264} y={110} r={13} cap={7} />
        <Trackpad uid={uid} x={248} y={130} w={32} h={28} />
        <Btn uid={uid} cx={264} cy={172} r={5} fill="#3a3d44" />
        {/* VIEW / MENU 靠屏幕两侧 */}
        <Btn uid={uid} cx={78} cy={172} r={4.4} fill="#3a3d44" />
        <Btn uid={uid} cx={242} cy={172} r={4.4} fill="#3a3d44" />
        <Silk x={160} y={198} size={6.8} fill="#a8aab2" o={0.5}>Steam Deck · 2022 · 触摸板在左右下方</Silk>
      </g>
    );
  },

  /** Steam Deck OLED (2023)：同布局，配色转浅 */
  'steam-deck-oled': ({ uid, grid, inner, screen }) => {
    screen.x = 90; screen.y = 62; screen.w = 140; screen.h = 100;
    return (
      <g>
        <Body uid={uid} x={20} y={40} width={280} height={128} r={16} fill="#3a3d44" />
        <Sheen uid={uid} d="M40 42h240a16 16 0 0 1 16 16v18H24V58a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="oled" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={56} y={70} s={0.62} fill="#8b8f98" />
        <Stick uid={uid} x={56} y={110} r={13} cap={7} />
        <Trackpad uid={uid} x={40} y={130} w={32} h={28} />
        <Btn uid={uid} cx={56} cy={172} r={5} fill="#5a5e66" />
        <Abxy uid={uid} x={264} y={70} r={5.6} g={9.4} />
        <Stick uid={uid} x={264} y={110} r={13} cap={7} />
        <Trackpad uid={uid} x={248} y={130} w={32} h={28} />
        <Btn uid={uid} cx={264} cy={172} r={5} fill="#5a5e66" />
        <Btn uid={uid} cx={78} cy={172} r={4.4} fill="#5a5e66" />
        <Btn uid={uid} cx={242} cy={172} r={4.4} fill="#5a5e66" />
        <Silk x={160} y={198} size={6.8} fill="#e0e4ec" o={0.6}>Steam Deck OLED · 2023 · 7.4" HDR</Silk>
      </g>
    );
  },

  /** PlayStation Portal (2023)：DualSense 从中间劈开接到两侧，8" 屏，白色首发 */
  'playstation-portal': ({ uid, grid, inner, screen }) => {
    screen.x = 76; screen.y = 54; screen.w = 168; screen.h = 104;
    return (
      <g>
        <Body uid={uid} x={10} y={40} width={300} height={136} r={20} fill="#f0f0f2" />
        <Sheen uid={uid} d="M32 42h256a18 18 0 0 1 18 18v18H14V60a18 18 0 0 1 18-18z" />
        <Screen {...screen} uid={uid} tone="oled" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <Stick uid={uid} x={44} y={74} r={11} cap={6} />
        <DpadKey uid={uid} x={44} y={124} s={0.62} fill="#b8b8be" />
        <Abxy uid={uid} x={276} y={74} r={5.6} g={9.4} />
        <Stick uid={uid} x={276} y={124} r={11} cap={6} />
        {/* PS 键在中缝左上，麦克风静音键右上 */}
        <Btn uid={uid} cx={68} cy={50} r={4} fill="#c8c8ce" />
        <Btn uid={uid} cx={252} cy={50} r={4.4} fill="#c8c8ce" square />
        <Silk x={160} y={198} size={7.4} fill="#3a3a42" o={0.5}>PlayStation Portal · 2023 · 8" 屏</Silk>
      </g>
    );
  },

  /** Playdate (2022)：唯一非横置，近方形黄色机身，右侧银色曲柄 */
  playdate: ({ uid, grid, inner, screen }) => {
    screen.x = 116; screen.y = 44; screen.w = 88; screen.h = 76;
    return (
      <g>
        <Body uid={uid} x={96} y={22} width={128} height={216} r={22} fill={D.yellow} />
        <Sheen uid={uid} d="M118 24h84a20 20 0 0 1 20 20v18H98V44a20 20 0 0 1 20-20z" />
        <Screen {...screen} uid={uid} tone="oled" grid={grid} r={3} bezel={5}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={134} y={164} s={0.8} fill="#3a3524" />
        <Btn uid={uid} cx={178} cy={158} r={7} fill="#3a3524" label="B" ink="#f0e6c0" />
        <Btn uid={uid} cx={195} cy={174} r={7} fill="#3a3524" label="A" ink="#f0e6c0" />
        {/* 右侧竖条扬声器 */}
        <SpeakerDots x={208} y={148} cols={1} rows={5} gap={7} r={1.9} c="#8a7420" />
        {/* 右侧银色曲柄 */}
        <path d="M226 92h18v16h-18z" fill="#c8ccd4" filter={`url(#soft-${uid})`} />
        <rect x={235} y={74} width={8} height={26} rx={4} fill="#dcdfe6" filter={`url(#soft-${uid})`} />
        <circle cx={239} cy={70} r={7.4} fill="#e8ebf0" stroke="#a8acb4" strokeWidth="1" filter={`url(#soft-${uid})`} />
        <circle cx={237.6} cy={68.6} r={3.6} fill="#ffffff" opacity="0.5" />
        {/* 前面板磁吸螺丝 */}
        <g fill="#c8a828" opacity="0.7">
          <circle cx={108} cy={33} r={2.6} /><circle cx={212} cy={33} r={2.6} />
          <circle cx={108} cy={228} r={2.6} /><circle cx={212} cy={228} r={2.6} />
        </g>
        <Silk x={160} y={252} size={7} fill="#6a5210" o={0.6}>Playdate · 2022 · 曲柄在右</Silk>
      </g>
    );
  },

  /* ============ 其他 / 边界产品 ============ */

  /** Nokia N-Gage (2003)：横置，屏在左，右侧斜置游戏按键区 */
  'n-gage': ({ uid, grid, inner, screen }) => {
    screen.x = 26; screen.y = 82; screen.w = 116; screen.h = 84;
    return (
      <g>
        <Body uid={uid} x={14} y={68} width={292} height={128} r={18} fill={D.navy} />
        <Sheen uid={uid} d="M32 70h256a16 16 0 0 1 16 16v18H16V86a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={186} y={92} s={0.66} fill="#242c36" />
        <Btn uid={uid} cx={252} cy={94} r={6.4} fill="#5c7086" />
        <Btn uid={uid} cx={268} cy={108} r={6.4} fill="#5c7086" />
        <Btn uid={uid} cx={240} cy={114} r={6.4} fill="#5c7086" />
        <Silk x={160} y={216} size={8} fill="#c0ccd8" o={0.55}>N-Gage · 2003</Silk>
      </g>
    );
  },

  /** Tapwave Zodiac (2003)：横置 PDA 形态，金属拉丝，右侧圆形方向轮 */
  'tapwave-zodiac': ({ uid, grid, inner, screen }) => {
    screen.x = 24; screen.y = 78; screen.w = 136; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={10} y={66} width={300} height={132} r={18} fill="#8e939c" />
        <Sheen uid={uid} d="M30 68h260a16 16 0 0 1 16 16v18H14V84a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <g>
          <circle cx={244} cy={112} r={30} fill="#5e636c" filter={`url(#soft-${uid})`} />
          <circle cx={244} cy={112} r={30} fill={`url(#body-${uid})`} />
          <circle cx={244} cy={112} r={30} fill="none" stroke="#c8ccd4" strokeOpacity="0.5" strokeWidth="1.4" />
          <g stroke="#aeb4bd" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
            <line x1={244} y1={88} x2={244} y2={94} />
            <line x1={244} y1={130} x2={244} y2={136} />
            <line x1={220} y1={112} x2={226} y2={112} />
            <line x1={262} y1={112} x2={268} y2={112} />
          </g>
          <circle cx={244} cy={112} r={9} fill="#c8ccd4" filter={`url(#soft-${uid})`} />
          <circle cx={242} cy={110} r={4} fill="#ffffff" opacity="0.45" />
        </g>
        <TwoTaps uid={uid} x={196} y={80} w={14} h={6} fill="#6e737a" gap={7} />
        <TwoTaps uid={uid} x={196} y={152} w={14} h={6} fill="#6e737a" gap={7} />
        <Silk x={160} y={218} size={8} fill="#e8ecf0" o={0.6}>Tapwave Zodiac · 2003</Silk>
      </g>
    );
  },

  /** Gizmondo (2005)：横置银色，屏偏右，左侧圆形四向方向键 */
  gizmondo: ({ uid, grid, inner, screen }) => {
    screen.x = 128; screen.y = 78; screen.w = 128; screen.h = 88;
    return (
      <g>
        <Body uid={uid} x={40} y={66} width={240} height={120} r={20} fill={D.silver} />
        <Sheen uid={uid} d="M60 68h200a18 18 0 0 1 18 18v16H42V86a18 18 0 0 1 18-18z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <g>
          <circle cx={86} cy={118} r={23} fill="#8a8f96" filter={`url(#soft-${uid})`} />
          <circle cx={86} cy={118} r={23} fill={`url(#body-${uid})`} />
          <circle cx={86} cy={118} r={23} fill="none" stroke="#ffffff" strokeOpacity="0.2" />
          <Btn uid={uid} cx={86} cy={102} r={7} fill="#5e636a" />
          <Btn uid={uid} cx={86} cy={134} r={7} fill="#5e636a" />
          <Btn uid={uid} cx={70} cy={118} r={7} fill="#5e636a" />
          <Btn uid={uid} cx={102} cy={118} r={7} fill="#5e636a" />
        </g>
        <Abxy uid={uid} x={266} y={158} r={4.6} g={7.6} />
        <Silk x={160} y={206} size={8} fill="#3a3f46" o={0.5}>Gizmondo · 2005</Silk>
      </g>
    );
  },

  /** Evercade (2019)：横置厚机身，屏幕在左，右侧方向键 */
  evercade: ({ uid, grid, inner, screen }) => {
    screen.x = 28; screen.y = 76; screen.w = 116; screen.h = 84;
    return (
      <g>
        <Body uid={uid} x={12} y={62} width={296} height={144} r={13} fill={D.darker} />
        <Sheen uid={uid} d="M26 64h268a12 12 0 0 1 12 12v20H14V76a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={196} y={104} s={0.8} fill="#4a4d54" />
        <Ba2 uid={uid} x={248} y={150} r={6.4} gap={15} fill="#5a5e66" />
        <Silk x={160} y={226} size={8} fill="#a8aab2" o={0.5}>Evercade · 2019 · 复古主机卡带</Silk>
      </g>
    );
  },

  /** Analogue Pocket (2022)：横置黑色，屏幕在左，右侧大圆 D-pad 与 ABXY */
  'analogue-pocket': ({ uid, grid, inner, screen }) => {
    screen.x = 28; screen.y = 78; screen.w = 136; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={12} y={66} width={296} height={128} r={15} fill={D.darker} />
        <Sheen uid={uid} d="M28 68h264a14 14 0 0 1 14 14v20H14V82a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <g>
          <circle cx={216} cy={110} r={27} fill="#0e0f12" filter={`url(#soft-${uid})`} />
          <circle cx={216} cy={110} r={27} fill="none" stroke="#3a3d44" strokeWidth="1.6" />
          <circle cx={216} cy={110} r={27} fill="none" stroke="#ffffff" strokeOpacity="0.08" />
          <Btn uid={uid} cx={216} cy={94} r={8} fill="#33363d" />
          <Btn uid={uid} cx={216} cy={126} r={8} fill="#33363d" />
          <Btn uid={uid} cx={200} cy={110} r={8} fill="#33363d" />
          <Btn uid={uid} cx={232} cy={110} r={8} fill="#33363d" />
        </g>
        <Abxy uid={uid} x={278} y={170} r={5} g={8.2} />
        <Silk x={160} y={216} size={7.4} fill="#a8aab2" o={0.5}>Analogue Pocket · 2022</Silk>
      </g>
    );
  },

  /** GP32 (2003)：横置，屏幕在左，右侧十字键与动作键 */
  gp32: ({ uid, grid, inner, screen }) => {
    screen.x = 24; screen.y = 80; screen.w = 130; screen.h = 88;
    return (
      <g>
        <Body uid={uid} x={14} y={68} width={292} height={124} r={13} fill={D.sand} />
        <Sheen uid={uid} d="M28 70h264a12 12 0 0 1 12 12v18H16V82a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={202} y={98} s={0.86} fill="#3c3a34" />
        <Abxy uid={uid} x={252} y={152} r={5.4} g={9} />
        <Silk x={160} y={214} size={8} fill="#3a362c" o={0.45}>GamePark 32 · 2003</Silk>
      </g>
    );
  },

  /** GP2X (2005)：横置，屏幕在左，右侧十字键与 ABXY */
  gp2x: ({ uid, grid, inner, screen }) => {
    screen.x = 26; screen.y = 78; screen.w = 136; screen.h = 92;
    return (
      <g>
        <Body uid={uid} x={12} y={64} width={296} height={132} r={13} fill={D.slate} />
        <Sheen uid={uid} d="M26 66h268a12 12 0 0 1 12 12v20H14V78a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={216} y={98} s={0.9} fill="#22242a" />
        <Abxy uid={uid} x={264} y={154} r={5.4} g={9} />
        <TwoTaps uid={uid} x={136} y={186} w={22} h={8} fill="#2a2c32" gap={12} />
        <Silk x={160} y={216} size={8} fill="#c0c4ce" o={0.5}>GP2X · 2005 · Linux</Silk>
      </g>
    );
  },

  /** Logitech G Cloud (2012)：横置白色，屏幕在左，右侧十字键与动作键 */
  'logitech-g-cloud': ({ uid, grid, inner, screen }) => {
    screen.x = 26; screen.y = 78; screen.w = 132; screen.h = 90;
    return (
      <g>
        <Body uid={uid} x={12} y={66} width={296} height={128} r={15} fill="#f0f0f2" />
        <Sheen uid={uid} d="M28 68h264a14 14 0 0 1 14 14v18H14V82a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={212} y={100} s={0.88} fill="#b8b8be" />
        <Abxy uid={uid} x={262} y={156} r={5.4} g={9} />
        <Silk x={160} y={214} size={7.4} fill="#3a3a42" o={0.5}>G Cloud · 2012 · 白色机身</Silk>
      </g>
    );
  },

  /** Xperia Play (2011)：横置滑盖手机，屏幕在左，右侧游戏按键区 */
  'xperia-play': ({ uid, grid, inner, screen }) => {
    screen.x = 24; screen.y = 78; screen.w = 128; screen.h = 92;
    return (
      <g>
        <Body uid={uid} x={10} y={64} width={300} height={132} r={15} fill={D.dark} />
        <Sheen uid={uid} d="M26 66h268a14 14 0 0 1 14 14v20H12V80a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={200} y={100} s={0.72} fill="#1c1f24" />
        <Abxy uid={uid} x={256} y={152} r={5.4} g={9} />
        <Slot x={276} y={186} width={26} h={8} r={4} o={0.34} />
        <Silk x={160} y={218} size={7.4} fill="#b0b8c4" o={0.55}>Xperia Play · 2011 · 滑盖手机形态</Silk>
      </g>
    );
  },

  /** 安卓复古掌机：以「家族示意」明确标注，不冒充单一型号 */
  'android-anbernic': ({ uid, grid, inner, screen }) => {
    screen.x = 26; screen.y = 76; screen.w = 136; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={10} y={62} width={246} height={136} r={14} fill={D.darker} />
        <Sheen uid={uid} d="M26 64h214a14 14 0 0 1 14 14v20H12V78a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="wide" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <Body uid={uid} x={256} y={62} width={54} height={136} r={14} fill="#34373f" />
        <DpadKey uid={uid} x={278} y={100} s={0.7} fill="#4a4d56" />
        <Abxy uid={uid} x={278} y={158} r={5.2} g={8.6} />
        <Silk x={160} y={218} size={7.4} fill="#a8aab2" o={0.5}>安卓复古掌机 · 家族示意，非单一型号</Silk>
      </g>
    );
  },

  /** Playdate 概念设计：未上市 */
  'prototype-playdate-x': ({ uid, grid, inner, screen }) => {
    screen.x = 116; screen.y = 44; screen.w = 88; screen.h = 76;
    return (
      <g>
        <Body uid={uid} x={96} y={22} width={128} height={216} r={22} fill="#c8ccd4" />
        <Sheen uid={uid} d="M118 24h84a20 20 0 0 1 20 20v18H98V44a20 20 0 0 1 20-20z" />
        <Screen {...screen} uid={uid} tone="oled" grid={grid} r={3} bezel={5}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={134} y={162} s={0.8} fill="#3a3f48" />
        <Btn uid={uid} cx={178} cy={158} r={7} fill="#3a3f48" label="B" ink="#eef0f4" />
        <Btn uid={uid} cx={195} cy={174} r={7} fill="#3a3f48" label="A" ink="#eef0f4" />
        <Silk x={160} y={252} size={7} fill="#3a3f48" o={0.5}>概念设计 · 未上市</Silk>
      </g>
    );
  },

  /** ASUS ROG Ally (2023)：Xbox 布局但无触摸板，该位置改为功能键 */
  'rog-ally': ({ uid, grid, inner, screen }) => {
    screen.x = 88; screen.y = 62; screen.w = 144; screen.h = 100;
    return (
      <g>
        <Body uid={uid} x={18} y={42} width={284} height={140} r={17} fill="#ececee" />
        <Sheen uid={uid} d="M36 44h248a16 16 0 0 1 16 16v20H20V60a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="color" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        {/* 左摇杆在最上（带 RGB 灯环），十字键在其下 */}
        <circle cx={54} cy={72} r={14} fill="#2a2d33" stroke="#c04a8a" strokeWidth="1.8" />
        <circle cx={54} cy={72} r={8} fill="#4a4d54" filter={`url(#soft-${uid})`} />
        <circle cx={52} cy={70} r={3.4} fill="#ffffff" opacity="0.22" />
        <DpadKey uid={uid} x={54} y={130} s={0.6} fill="#3a3d44" />
        {/* 右 ABXY 在最上，右摇杆在其下 */}
        <Abxy uid={uid} x={266} y={72} r={5.6} g={9.4} />
        <Stick uid={uid} x={266} y={130} r={14} cap={8} />
        {/* 无触摸板：改为 VIEW / MENU 与两颗功能键 */}
        <Btn uid={uid} cx={54} cy={168} r={5.4} fill="#5a5e66" />
        <Btn uid={uid} cx={266} cy={168} r={5.4} fill="#5a5e66" />
        <Btn uid={uid} cx={140} cy={164} r={5} fill="#5a5e66" />
        <Btn uid={uid} cx={180} cy={164} r={5} fill="#5a5e66" />
        <Silk x={160} y={204} size={7.4} fill="#3a3a42" o={0.5}>ROG Ally · 2023 · 无触摸板</Silk>
      </g>
    );
  },

  /** OpenPandora (2009)：横置 Linux 掌机，机身左侧屏幕，右侧控制区 */
  pandora: ({ uid, grid, inner, screen }) => {
    screen.x = 28; screen.y = 76; screen.w = 140; screen.h = 96;
    return (
      <g>
        <Body uid={uid} x={12} y={62} width={296} height={140} r={13} fill={D.darker} />
        <Sheen uid={uid} d="M26 64h268a12 12 0 0 1 12 12v20H14V76a12 12 0 0 1 12-12z" />
        <Screen {...screen} uid={uid} tone="wide" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={216} y={98} s={0.82} fill="#22242a" />
        <Abxy uid={uid} x={262} y={150} r={5.4} g={9} />
        <TwoTaps uid={uid} x={198} y={176} w={20} h={7} fill="#2a2c32" gap={9} />
        <Silk x={160} y={222} size={7.4} fill="#b0b4be" o={0.5}>OpenPandora · 2009 · Linux 掌机</Silk>
      </g>
    );
  },

  /** 3DO prototype：未上市的横置掌机概念机 */
  'prototype-3do': ({ uid, grid, inner, screen }) => {
    screen.x = 40; screen.y = 78; screen.w = 132; screen.h = 90;
    return (
      <g>
        <Body uid={uid} x={18} y={66} width={284} height={132} r={17} fill="#7a7a84" />
        <Sheen uid={uid} d="M36 68h248a16 16 0 0 1 16 16v18H20V84a16 16 0 0 1 16-16z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={230} y={100} s={0.9} fill="#33343a" />
        <Ba2 uid={uid} x={256} y={152} r={6.6} gap={16} fill="#7a4a5a" />
        <Silk x={160} y={218} size={7.4} fill="#d8d8e0" o={0.55}>3DO 掌机原型机 · 未上市</Silk>
      </g>
    );
  },

  /** Palmtex：未上市概念掌机，竖置砖体 */
  palmtex: ({ uid, grid, inner, screen }) => {
    screen.x = 122; screen.y = 58; screen.w = 76; screen.h = 62;
    return (
      <g>
        <Body uid={uid} x={104} y={20} width={112} height={220} r={16} fill="#5a6470" />
        <Sheen uid={uid} d="M120 22h80a14 14 0 0 1 14 14v18H106V36a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-gray" grid={grid} r={4} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={134} y={168} s={0.9} fill="#2e343c" />
        <Ba2 uid={uid} x={180} y={172} r={7.4} gap={17} fill="#8a5a4a" />
        <Silk x={160} y={234} size={7} fill="#d0d8e0" o={0.55}>概念设备 · 资料待核实</Silk>
      </g>
    );
  },

  /** Pingoo：未上市概念掌机，小型横置机身 */
  pingoo: ({ uid, grid, inner, screen }) => {
    screen.x = 76; screen.y = 82; screen.w = 116; screen.h = 84;
    return (
      <g>
        <Body uid={uid} x={34} y={70} width={252} height={112} r={15} fill={D.green2} />
        <Sheen uid={uid} d="M50 72h220a14 14 0 0 1 14 14v18H36V86a14 14 0 0 1 14-14z" />
        <Screen {...screen} uid={uid} tone="lcd-green" grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={222} y={100} s={0.78} fill="#2a322a" />
        <Ba2 uid={uid} x={252} y={146} r={6} gap={14} fill="#6a7a5a" />
        <Silk x={160} y={204} size={7.4} fill="#c8d8c8" o={0.6}>概念设备 · 未上市</Silk>
      </g>
    );
  },

  /** 兜底：仅在确实没有专属造型时使用，画面内明确标注 */
  generic: ({ uid, grid, inner, screen, tone }) => {
    screen.x = 112; screen.y = 58; screen.w = 96; screen.h = 84;
    return (
      <g>
        <Body uid={uid} x={94} y={38} width={132} height={184} r={17} fill="#8a8a92" />
        <Sheen uid={uid} d="M112 40h96a15 15 0 0 1 15 15v18H97V55a15 15 0 0 1 15-15z" />
        <Screen {...screen} uid={uid} tone={tone} grid={grid} r={5} bezel={4}>
          {inner}
        </Screen>
        <DpadKey uid={uid} x={126} y={184} s={0.8} fill="#3a3a42" />
        <Btn uid={uid} cx={194} cy={176} r={7} fill="#5e5e68" />
        <Btn uid={uid} cx={194} cy={194} r={7} fill="#5e5e68" />
        <Silk x={160} y={240} size={7} fill="#1e1e24" o={0.55}>通用占位造型 · 非该机真实外观</Silk>
      </g>
    );
  },
};

/**
 * 造型别名表：把同系列 / 改款的设备 id 指向已有造型，
 * 差异（尺寸、屏幕、按键、背光等）在图鉴文字中单独说明。
 */
export const ART_ALIAS: Record<string, string> = {
  gb: 'game-boy',
  'gbc-variant-pocket': 'game-boy-pocket',
  'game-com': 'game.com',
  ds: 'nintendo-ds',
  psv: 'ps-vita',
  'art-svg': 'generic',
  'game-boy-advance': 'gba',
};

export function resolveArt(deviceId: string): ArtFn {
  const key = ART_ALIAS[deviceId] ?? deviceId;
  return ART[key] ?? ART['generic'];
}

export function hasDedicatedArt(deviceId: string): boolean {
  const key = ART_ALIAS[deviceId] ?? deviceId;
  return key !== 'generic' && key in ART;
}

/** 供 React key 与渐变 id 使用：把设备 id 转为合法标识符 */
function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function DeviceShell({
  deviceId,
  children,
  tone = 'lcd-green',
  showLabel = true,
  label,
  grid,
  className,
}: Props) {
  const art = resolveArt(deviceId);
  const uid = slug(deviceId);
  const screen: Rect = { x: 0, y: 0, w: 0, h: 0 };
  const body = art({ uid, tone, grid, inner: children, screen });

  // 依据造型声明的屏幕矩形渲染占位文字，避免坐标与屏幕错位
  const placeholder =
    children == null && screen.w > 0 && screen.h > 0 ? (
      <text
        x={screen.x + screen.w / 2}
        y={screen.y + screen.h / 2 + 3}
        fontSize={Math.min(9, screen.h / 6)}
        fill={toneInk[tone]}
        opacity="0.75"
        textAnchor="middle"
      >
        示意画面
      </text>
    ) : null;

  return (
    <figure className={`device-shell ${className ?? ''}`}>
      <svg
        viewBox="0 0 320 260"
        role="img"
        aria-label={label ?? '设备外观示意图'}
        className="device-shell__svg"
      >
        <Defs uid={uid} />
        {body}
        {placeholder}
      </svg>
      {showLabel && (
        <figcaption className="device-shell__caption">
          外观示意 · 原创绘制，非官方图片素材
        </figcaption>
      )}
    </figure>
  );
}

export function DeviceShellPreview({ deviceId, tone }: { deviceId: string; tone?: ScreenTone }) {
  return <DeviceShell deviceId={deviceId} tone={tone ?? 'lcd-green'} showLabel />;
}