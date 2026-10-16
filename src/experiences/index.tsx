import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';
import { DeviceShell } from '../components/DeviceShell';

/** 所有互动体验的统一契约：完成时调用 onDone()，失败可重试 */
export interface ExperienceProps {
  onDone: () => void;
  reducedMotion: boolean;
  grid: boolean;
}

interface WrapProps {
  children: React.ReactNode;
  goal: string;
  checkpoint: string;
  done: boolean;
  onDone: () => void;
  childrenStatus?: React.ReactNode;
}

/** 体验外壳：目标说明 + 检验问题 + 完成按钮 */
function ExpWrap({ children, goal, checkpoint, done, onDone, childrenStatus }: WrapProps) {
  return (
    <div className="exp">
      <div className="exp__goal">
        <h4>体验目标</h4>
        <p>{goal}</p>
      </div>
      <div className="exp__stage">{children}</div>
      <div className="exp__foot">
        <p className="exp__checkpoint">
          <strong>检验问题：</strong>
          {checkpoint}
        </p>
        {childrenStatus}
        <button
          className={`btn btn--primary ${done ? 'is-done' : ''}`}
          disabled={!done}
          onClick={() => {
            audio.sfx('task');
            void haptics.fire();
            onDone();
          }}
        >
          {done ? '完成，领取印章' : '完成条件未达成'}
        </button>
      </div>
    </div>
  );
}

/* ==================================================================
 * 1. Auto Race：只有灯的躲避游戏
 * ================================================================== */
export function ExpAutoRace({ onDone, reducedMotion }: ExperienceProps) {
  const COLS = 3;
  const ROWS = 5;
  const [player, setPlayer] = useState(1);
  const [traffic, setTraffic] = useState<number[][]>(() => [
    [ROWS - 2],
    [],
    [ROWS - 2],
  ]);
  const [score, setScore] = useState(0);
  const [gear, setGear] = useState(1);
  const [hit, setHit] = useState(false);
  const [over, setOver] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (over) return;
    const interval = 760 - gear * 110;
    timer.current = window.setTimeout(() => {
      setTraffic((prev) => {
        // 每辆车向下移动一格，超出屏幕则移除
        const next = prev.map((col) =>
          col.map((row) => row + 1).filter((row) => row < ROWS)
        );
        // 以一定概率在最上方生成新车（同一车道最多两辆）
        if (Math.random() < 0.5) {
          const lane = Math.floor(Math.random() * COLS);
          if (next[lane].length < 2) next[lane] = [0, ...next[lane]];
        }
        return next;
      });
      setScore((s) => s + gear);
    }, interval);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [gear, over]);

  // 碰撞检测：玩家固定在最底下一行
  useEffect(() => {
    if (over) return;
    const collided = traffic.some((col) => col.includes(ROWS - 1)) && traffic[player].includes(ROWS - 1);
    if (collided) {
      setHit(true);
      setOver(true);
      audio.sfx('error');
      void haptics.fire();
    }
  }, [traffic, player, over]);

  const cells = useMemo(() => {
    const grid: { lit: boolean; isPlayer: boolean }[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ lit: false, isPlayer: false }))
    );
    grid[ROWS - 1][player] = { lit: true, isPlayer: true };
    traffic.forEach((col, lane) => {
      col.forEach((row) => {
        if (row >= 0 && row < ROWS) grid[row][lane] = { lit: true, isPlayer: false };
      });
    });
    return grid;
  }, [traffic, player]);

  const steer = useCallback(
    (dir: -1 | 1) => {
      audio.sfx('tap');
      void haptics.fire();
      setPlayer((p) => Math.min(COLS - 1, Math.max(0, p + dir)));
    },
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') steer(-1);
      if (e.key === 'ArrowRight') steer(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steer]);

  const restart = () => {
    setTraffic([
      [ROWS - 2],
      [],
      [ROWS - 2],
    ]);
    setPlayer(1);
    setScore(0);
    setGear(1);
    setOver(false);
    setHit(false);
  };

  const cleared = score >= 30;

  return (
    <ExpWrap
      goal="这台机器只有一排红色小灯。用左右拨杆躲避迎面而来的车，跑够一段距离。"
      checkpoint="为什么这台机器用换挡开关控制速度，而不是给玩家一个油门？"
      done={cleared && !over}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>距离分：{score} / 30</span>
          <span>挡位：{gear}</span>
          <span>
            {over
              ? hit
                ? '被撞了 —— 原机上你会被推回起点，然后继续。'
                : '结束'
              : '行驶中'}
          </span>
          {(over || score > 0) && (
            <button
              className="btn btn--small"
              onClick={() => {
                audio.sfx('menu');
                restart();
              }}
            >
              重新开始
            </button>
          )}
        </div>
      }
    >
      <div className="autorace">
        <div className="autorace__left">
          <p className="hint">
            换挡开关决定速度。挡位越高，车来得越快 —— 但距离分也涨得更快。
          </p>
          <div className="autorace__gears">
            {[1, 2, 3, 4].map((g) => (
              <button
                key={g}
                className={`btn btn--gear ${gear === g ? 'is-on' : ''}`}
                onClick={() => {
                  audio.sfx('tap');
                  setGear(g);
                }}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="autorace__steer">
            <button className="btn" onClick={() => steer(-1)} aria-label="向左换道">
              ◀ 左
            </button>
            <button className="btn" onClick={() => steer(1)} aria-label="向右换道">
              右 ▶
            </button>
          </div>
        </div>
        <DeviceShell deviceId="mattel-auto-race" showLabel={false} tone="led">
          <g>
            {cells.map((row, r) =>
              row.map((c, col) =>
                c.lit ? (
                  <rect
                    key={`${r}-${col}`}
                    x={178 + col * 32}
                    y={100 + r * 12}
                    width={16}
                    height={8}
                    fill={c.isPlayer ? '#fff3c4' : '#ff5a24'}
                    opacity={c.isPlayer ? 1 : 0.85}
                  />
                ) : null
              )
            )}
          </g>
        </DeviceShell>
      </div>
      {!reducedMotion && <p className="tiny">提示：本体验不使用闪烁画面。</p>}
    </ExpWrap>
  );
}

/* ==================================================================
 * 2. Game Boy：插卡 + 同画面色彩对比 + 取舍教学模型
 * ================================================================== */
const CARTS = [
  { id: 'a', name: '原创卡带 A：滚球', tone: 'lcd-green' as const, note: '同一段画面，四阶灰度。' },
  { id: 'b', name: '原创卡带 B：滚球（彩色版）', tone: 'color' as const, note: '同期彩色掌机的效果示意。' },
];

interface Rect { x: number; y: number; w: number; h: number }

/** 在给定屏幕矩形内绘制同一段原创画面，用于不同设备间的显示对比 */
function RollingScene({ tone, rect }: { tone: 'lcd-green' | 'color'; rect: Rect }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), 220);
    return () => clearInterval(id);
  }, []);
  const mono = tone === 'lcd-green';
  const bg = mono ? '#9cae72' : '#1d3f5e';
  const hill = mono ? '#556b3a' : '#2e6f4e';
  const ball = mono ? '#c3cf7a' : '#ffd166';
  const ink = mono ? '#31422a' : '#9ad7ff';
  const cx = rect.x + rect.w / 2;
  const bx = rect.x + rect.w * 0.2 + ((t * 0.14) % 0.6) * rect.w;
  const by = rect.y + rect.h * 0.45 + Math.sin(t / 3) * rect.h * 0.16;
  const r = Math.max(3, rect.h * 0.08);
  return (
    <g>
      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill={bg} />
      <path
        d={`M${rect.x} ${rect.y + rect.h} L${cx} ${rect.y + rect.h * 0.3} L${rect.x + rect.w} ${rect.y + rect.h} Z`}
        fill={hill}
      />
      <circle cx={bx} cy={by} r={r} fill={ball} />
      <text
        x={cx}
        y={rect.y + rect.h - 3}
        fontSize={Math.max(4, rect.h * 0.09)}
        fill={ink}
        textAnchor="middle"
      >
        原创画面
      </text>
    </g>
  );
}

export function ExpGameBoy({ onDone, grid }: ExperienceProps) {
  const [cart, setCart] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [screenPower, setScreenPower] = useState(4); // 4 = 无背光
  const [speed, setSpeed] = useState(1);

  const segments = useMemo(() => {
    const base = 4;
    const saved = screenPower < 2 ? 0 : screenPower === 2 ? 1 : 2;
    const maxAh = [10, 20, 30][saved];
    const drain = base * speed * (screenPower >= 3 ? 1.5 : 1);
    const hours = Math.max(1, Math.round(maxAh / (drain / 2)));
    const brightness = screenPower === 3 ? '无背光，靠环境光' : screenPower === 2 ? '弱背光' : '强背光';
    const size = screenPower >= 3 ? '2.45 英寸' : '2.45 英寸（同尺寸）';
    return { hours, brightness, size, saved };
  }, [screenPower, speed]);

  const ready = cart !== null && compare && segments.saved >= 0;

  return (
    <ExpWrap
      goal="先把一张虚拟卡带插进机器，再对比同一段画面在灰度与彩色掌机上的差别，最后调整参数看看便携与续航怎么取舍。"
      checkpoint="如果把屏幕换成彩色背光，你觉得这台机器会失去什么？"
      done={ready}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>
            {cart ? `已插入：${CARTS.find((c) => c.id === cart)?.name}` : '尚未插入卡带'}
          </span>
          <label className="checkline">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => {
                audio.sfx('menu');
                setCompare(e.target.checked);
              }}
            />
            我已对比两种显示方式
          </label>
          <span>教学模型估算续航：约 {segments.hours} 小时</span>
        </div>
      }
    >
      <div className="gbexp">
        <div className="gbexp__cart-tray">
          <p className="hint">把卡带拖到下方插槽里。</p>
          <div className="gbexp__carts">
            {CARTS.map((c) => (
              <div
                key={c.id}
                draggable
                className={`cart ${cart === c.id ? 'is-in' : ''}`}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                onClick={() => {
                  audio.sfx('insert');
                  void haptics.fire();
                  setCart(c.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    audio.sfx('insert');
                    setCart(c.id);
                  }
                }}
              >
                <span className="cart__label">{c.name}</span>
                <span className="cart__note">{c.note}</span>
              </div>
            ))}
          </div>
          <div
            className={`gbexp__slot ${cart ? 'is-filled' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) {
                audio.sfx('insert');
                void haptics.fire();
                setCart(id);
              }
            }}
          >
            卡带插槽{cart ? '（已插入）' : '（空）'}
          </div>
          {cart && (
            <button
              className="btn btn--small"
              onClick={() => {
                audio.sfx('tap');
                setCart(null);
              }}
            >
              拔出卡带
            </button>
          )}
        </div>

        <div className="gbexp__devices">
          <DeviceShell deviceId="game-boy" tone="lcd-green" grid={grid} label="Game Boy">
            {cart ? (
              <RollingScene tone="lcd-green" rect={{ x: 120, y: 54, w: 80, h: 62 }} />
            ) : (
              <text x={160} y={86} fontSize={7} fill="#31422a" textAnchor="middle">无卡带 · 无法启动</text>
            )}
          </DeviceShell>
          {compare && (
            <DeviceShell deviceId="lynx" tone="color" grid={grid} label="彩色掌机对照">
              <RollingScene tone="color" rect={{ x: 156, y: 84, w: 132, h: 88 }} />
            </DeviceShell>
          )}
        </div>

        <div className="gbexp__model">
          <h4>取舍教学模型（不是实测数据）</h4>
          <label>
            屏幕方案：
            <select value={screenPower} onChange={(e) => setScreenPower(Number(e.target.value))}>
              <option value={3}>无背光反射式（Game Boy 方案）</option>
              <option value={2}>弱背光</option>
              <option value={1}>强背光（同期彩色掌机方案）</option>
            </select>
          </label>
          <label>
            运算负载（相对值）：
            <input
              type="range"
              min={1}
              max={3}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span>{speed}</span>
          </label>
          <p className="tiny">
            说明：屏幕：{segments.size} / {segments.brightness}；电池配置可省 {segments.saved} 节。
            这是用来理解取舍关系的教学模型，<strong>不是任何实机续航测试</strong>。
          </p>
        </div>
      </div>
    </ExpWrap>
  );
}

/* ==================================================================
 * 3. Nintendo DS：上下屏分工谜题
 * ================================================================== */
const DS_TILES = ['▲', '●', '■'];
export function ExpDS({ onDone }: ExperienceProps) {
  const [bottom, setBottom] = useState<number[]>([0, 1, 2]);
  const [topMsg, setTopMsg] = useState('上屏：请在下面按顺序点亮三个形状');
  const [target] = useState([0, 1, 2]);
  const [step, setStep] = useState(0);
  const [shake, setShake] = useState(false);

  const press = (i: number) => {
    audio.sfx('tap');
    void haptics.fire();
    setBottom((b) => b.map((v, idx) => (idx === i ? v : v)));
    if (i === target[step]) {
      const next = step + 1;
      setStep(next);
      if (next >= target.length) {
        setTopMsg('上屏：同步完成！注意两条信息线如何分工。');
        audio.sfx('task');
      } else {
        setTopMsg(`上屏：正确 ${next}/3，继续。`);
      }
    } else {
      setTopMsg('上屏：顺序不对。下屏负责输入，上屏负责反馈 —— 试试重置。');
      setShake(true);
      audio.sfx('error');
      window.setTimeout(() => setShake(false), 320);
    }
  };

  const reset = () => {
    setStep(0);
    setTopMsg('上屏：请在下面按顺序点亮三个形状');
    audio.sfx('menu');
  };

  return (
    <ExpWrap
      goal="下屏触摸操作、上屏显示结果。只靠这种分工才能解开的小谜题 —— 想想为什么要两块屏。"
      checkpoint="为什么要把信息拆到两块屏上，而不是把一块屏做得更大？"
      done={step >= 3}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>进度：{Math.min(step, 3)}/3</span>
          <button className="btn btn--small" onClick={reset}>
            重置
          </button>
        </div>
      }
    >
      <DeviceShell deviceId="nintendo-ds" tone="color" showLabel>
        <text x={160} y={78} fontSize={8} fill="#d8f0ff" textAnchor="middle">
          {topMsg}
        </text>
        <text x={160} y={94} fontSize={8} fill="#9ad7ff" textAnchor="middle">
          {step >= 3 ? '完成' : `第 ${step + 1} 步：${DS_TILES[target[step]]}`}
        </text>
      </DeviceShell>
      <div className={`dstouch ${shake ? 'is-shake' : ''}`}>
        <p className="hint">下屏 · 触摸区域（点形状）</p>
        <div className="dstouch__row">
          {bottom.map((v, i) => (
            <button key={i} className="btn btn--tile" onClick={() => press(i)}>
              {DS_TILES[v]}
            </button>
          ))}
        </div>
        <p className="tiny">顺序：▲ → ● → ■</p>
      </div>
    </ExpWrap>
  );
}

/* ==================================================================
 * 4. PSP：宽屏 + 模拟块导航
 * ================================================================== */
export function ExpPSP({ onDone }: ExperienceProps) {
  const [pos, setPos] = useState({ x: 6, y: 4 });
  const [pad, setPad] = useState('nav');
  const [visited, setVisited] = useState<Set<string>>(new Set(['6,4']));
  const goal = useMemo(() => new Set(['2,2', '12,4', '6,10']), []);

  const move = (dx: number, dy: number) => {
    audio.sfx('tap');
    void haptics.fire();
    setPos((p) => {
      const nx = Math.max(0, Math.min(15, p.x + dx));
      const ny = Math.max(0, Math.min(9, p.y + dy));
      setVisited((v) => new Set(v).add(`${nx},${ny}`));
      return { x: nx, y: ny };
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move(0, -1);
      if (e.key === 'ArrowDown') move(0, 1);
      if (e.key === 'ArrowLeft') move(-1, 0);
      if (e.key === 'ArrowRight') move(1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const done = [...goal].every((g) => visited.has(g));
  const ratio = 16 / 9;

  return (
    <ExpWrap
      goal="用「模拟控制块」在 16:9 宽屏里导航，依次经过三个标记点。体验一下滑块式输入和方向键的区别。"
      checkpoint="16:9 宽屏给了游戏什么机会？又带来了什么麻烦？"
      done={done}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>标记点：{[...goal].filter((g) => visited.has(g)).length} / 3</span>
          <span>坐标：{pos.x},{pos.y}</span>
        </div>
      }
    >
      <div className="pspexp">
        <DeviceShell deviceId="psp" tone="wide" showLabel>
          <g>
            <rect x={44} y={72} width={232} height={104} fill="#0d1b2a" />
            <rect x={44} y={72} width={232} height={104} fill="url(#none)" opacity={0} />
            {/* 走廊网格，宽度按 16:9 排布 */}
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={48 + i * 14} y1={76} x2={48 + i * 14} y2={172} stroke="#12314a" strokeWidth={1} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h${i}`} x1={48} y1={76 + i * 10.6} x2={272} y2={76 + i * 10.6} stroke="#12314a" strokeWidth={1} />
            ))}
            {[...goal].map((g) => {
              const [gx, gy] = g.split(',').map(Number);
              const filled = visited.has(g);
              return (
                <g key={g}>
                  <circle cx={48 + gx * 14} cy={76 + gy * 10.6} r={7} fill={filled ? '#3fd0c9' : 'none'} stroke="#3fd0c9" strokeWidth={1.5} />
                  {!filled && <text x={48 + gx * 14} y={79 + gy * 10.6} fontSize={7} fill="#3fd0c9" textAnchor="middle">?</text>}
                </g>
              );
            })}
            <circle cx={48 + pos.x * 14} cy={76 + pos.y * 10.6} r={5} fill="#ffd166" />
          </g>
        </DeviceShell>
        <div className="pspexp__controls">
          <p className="hint">
            PSP 的输入不是普通摇杆，而是一块可以「滑动切换模式」的模拟块（模拟滑杆）。
          </p>
          <div className="pspexp__modes">
            {[
              { id: 'nav', label: '导航模式' },
              { id: 'game', label: '游戏模式' },
            ].map((m) => (
              <button
                key={m.id}
                className={`btn ${pad === m.id ? 'is-on' : ''}`}
                onClick={() => {
                  audio.sfx('tap');
                  setPad(m.id);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="pspexp__dpad">
            <button className="btn" onClick={() => move(0, -1)} aria-label="上">↑</button>
            <button className="btn" onClick={() => move(-1, 0)} aria-label="左">←</button>
            <button className="btn" onClick={() => move(1, 0)} aria-label="右">→</button>
            <button className="btn" onClick={() => move(0, 1)} aria-label="下">↓</button>
          </div>
          <p className="tiny">
            当前模式：{pad === 'nav' ? '导航（方向输入）' : '游戏（角色输入）'}。
            屏幕比例 {ratio.toFixed(2)}:1，为原创示意画面，不复制任何官方系统界面或启动动画。
          </p>
        </div>
      </div>
    </ExpWrap>
  );
}

/* ==================================================================
 * 5. Switch：三种使用方式
 * ================================================================== */
export function ExpSwitch({ onDone }: ExperienceProps) {
  const [mode, setMode] = useState<'handheld' | 'tabletop' | 'tv'>('handheld');
  const [dragging, setDragging] = useState(false);

  const text =
    mode === 'handheld'
      ? '掌上：720p / 60fps 掌机屏，续航官方标称约 2.5–6.5 小时'
      : mode === 'tabletop'
        ? '桌面：撑起支架，双手用分离手柄玩，屏幕上移到更高位置'
        : '电视：插入底座输出 1080p，主机性能解锁，掌机屏不再工作';

  const done = mode === 'tv';

  return (
    <ExpWrap
      goal="把掌机拖进底座，看它如何变成一台家用机。顺便对比三种模式下的差别。"
      checkpoint="同一台机器在三种模式下，有什么是完全一样的？又有什么被牺牲了？"
      done={done}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>当前模式：{mode === 'handheld' ? '掌上' : mode === 'tabletop' ? '桌面' : '电视'}</span>
        </div>
      }
    >
      <div className="switchexp">
        <div
          className={`dockzone ${mode === 'tv' ? 'is-docked' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            setMode('tv');
            audio.sfx('insert');
            void haptics.fire();
          }}
        >
          <p className="hint">{mode === 'tv' ? '已插入底座' : '把上面的掌机拖到这里（也可以点击按钮）'}</p>
          <div className="dockzone__slot" />
        </div>

        <div className={`switchexp__device ${dragging ? 'is-dragging' : ''}`} draggable onDragStart={() => setDragging(true)}>
          <DeviceShell deviceId="switch" tone="color" showLabel={false}>
            <text x={160} y={104} fontSize={8} fill="#9ad7ff" textAnchor="middle">
              {mode === 'tv' ? '→ 输出至电视' : mode === 'tabletop' ? '桌面模式' : '掌上模式'}
            </text>
          </DeviceShell>
        </div>

        <div className="switchexp__modes">
          {([
            ['handheld', '掌上模式'],
            ['tabletop', '桌面模式'],
            ['tv', '电视模式（拖入底座）'],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              className={`btn ${mode === m ? 'is-on' : ''}`}
              onClick={() => {
                audio.sfx(m === 'tv' ? 'insert' : 'tap');
                if (m === 'tv') void haptics.fire();
                setMode(m);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="exp__modetext">{text}</p>
      </div>
    </ExpWrap>
  );
}

/* ==================================================================
 * 6. Steam Deck：性能 / 画质 / 功耗取舍实验
 * ================================================================== */
export function ExpSteamDeck({ onDone }: ExperienceProps) {
  const [power, setPower] = useState(6); // 相对功耗
  const [res, setRes] = useState(800);
  const [fpsCap, setFpsCap] = useState(60);

  const model = useMemo(() => {
    // 教学模型：仅表达取舍方向，不预测任何具体游戏的帧率
    const headroom = Math.max(0, Math.min(1.6, (power * 8.4) / (res / 800) / 12));
    const batteryIndex = 40 / Math.max(1, power * 0.85);
    const quiet = power <= 5;
    const verdict =
      headroom > 1.1
        ? '留有余量，可选更高画质设置'
        : headroom > 0.85
          ? '刚好够用，需要在画质与帧率之间取舍'
          : '余量不足，必须降低分辨率或帧率';
    return { headroom, batteryHours: Math.round(batteryIndex * 10) / 10, quiet, verdict };
  }, [power, res]);

  return (
    <ExpWrap
      goal="拖动功耗与分辨率，观察同一台机器如何同时影响性能余量、噪音与续航。这是一个教学模型，不是实测。"
      checkpoint="为什么厂商公布的续航总是“取决于游戏”？"
      done={power !== 6 || res !== 800}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>性能余量指数（模型）：{model.headroom.toFixed(2)}</span>
          <span>噪音倾向：{model.quiet ? '较安静（教学判断）' : '风扇需高速（教学判断）'}</span>
          <span>模型续航：约 {model.batteryHours} 小时</span>
        </div>
      }
    >
      <div className="deckexp">
        <div className="deckexp__screen">
          <DeviceShell deviceId="steam-deck" tone="wide" showLabel>
            <g>
              <rect x={84} y={66} width={152} height={96} fill="#0d1b2a" />
              {Array.from({ length: Math.round(res / 50) }).map((_, i) => (
                <rect key={i} x={90} y={72 + i * 8} width={140 - i * 4} height={5} fill="#1c3d55" />
              ))}
              <text x={160} y={158} fontSize={8} fill="#8fd6ff" textAnchor="middle">
                {res}p · 上限 {fpsCap}fps · 功耗档 {power}
              </text>
            </g>
          </DeviceShell>
        </div>
        <div className="deckexp__panel">
          <label>
            功耗档（相对值）：<strong>{power}</strong>
            <input type="range" min={3} max={15} value={power} onChange={(e) => setPower(Number(e.target.value))} />
          </label>
          <label>
            渲染分辨率：<strong>{res}p</strong>
            <input type="range" min={400} max={1600} step={100} value={res} onChange={(e) => setRes(Number(e.target.value))} />
          </label>
          <label>
            帧率上限：<strong>{fpsCap}</strong>
            <input type="range" min={30} max={120} step={30} value={fpsCap} onChange={(e) => setFpsCap(Number(e.target.value))} />
          </label>
          <p className="deckexp__verdict">{model.verdict}</p>
          <p className="tiny">
            <strong>重要说明：</strong>以上数字全部来自本课本构造的
            <strong>教学模型</strong>，用于说明取舍关系。本书<strong>不提供任何具体游戏的帧率或实测性能数据</strong>，
            也未在任何设备上实测。
          </p>
        </div>
      </div>
    </ExpWrap>
  );
}

/* ==================================================================
 * 7. 冷门机型的基础互动（外观热点 + 媒介操作）
 * ================================================================== */
export function ExpHotspot({
  deviceId,
  mediaLabel,
  onDone,
}: {
  deviceId: string;
  mediaLabel: string;
  onDone: () => void;
}) {
  const [found, setFound] = useState<string[]>([]);
  const spots: Record<string, { x: number; y: number; label: string; note: string }[]> = {
    microvision: [
      { x: 179, y: 83, label: '16×16 屏幕', note: '在当时非常小，几乎只能靠方块形状而不是细节表达。' },
      { x: 60, y: 140, label: '方向盘', note: '与街机赛车方向盘同源的输入方式。' },
    ],
    'game-and-watch': [
      { x: 160, y: 100, label: '固定段码 LCD', note: '图案是画上去的，机器只能做几种预设动画。' },
      { x: 160, y: 175, label: 'LCD 按键', note: '按压面板本身，取代传统机械键。' },
    ],
  };
  const list = spots[deviceId] ?? [
    { x: 160, y: 96, label: '屏幕', note: '这是该机的主要显示区域。' },
    { x: 130, y: 190, label: '输入区', note: '按键布局反映了这台机器的操作思路。' },
  ];

  return (
    <ExpWrap
      goal="点出这台设备上最值得注意的两个部件，说说它们说明了什么。"
      checkpoint="这台设备当年解决了什么问题？又牺牲了什么？"
      done={found.length >= 2}
      onDone={onDone}
      childrenStatus={
        <div className="exp__status">
          <span>已找到：{found.length}/2</span>
          <span>游戏媒介：{mediaLabel}</span>
        </div>
      }
    >
      <div className="hotspot">
        <div className="hotspot__art">
          <DeviceShell deviceId={deviceId} showLabel={false} tone="lcd-gray">
            {found.map((f) => {
              const s = list.find((l) => l.label === f)!;
              return <circle key={f} cx={s.x} cy={s.y} r={5} fill="none" stroke="#c0392b" strokeWidth={1.5} />;
            })}
          </DeviceShell>
          {list.map((s, i) => (
            <button
              key={s.label}
              className={`hotspot__pin ${found.includes(s.label) ? 'is-found' : ''}`}
              style={{ left: `${(s.x / 320) * 100}%`, top: `${(s.y / 260) * 100}%` }}
              onClick={() => {
                audio.sfx('tap');
                void haptics.fire();
                if (!found.includes(s.label)) setFound((f) => [...f, s.label]);
              }}
              aria-label={`标记：${s.label}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="hotspot__notes">
          {found.length === 0 && <p className="hint">点击图上的编号标记。</p>}
          {found.map((f) => {
            const s = list.find((l) => l.label === f)!;
            return (
              <p key={f}>
                <strong>{s.label}：</strong>
                {s.note}
              </p>
            );
          })}
        </div>
      </div>
    </ExpWrap>
  );
}

export const EXPERIENCES: Record<string, React.FC<ExperienceProps>> = {
  'exp-autorace': ExpAutoRace,
  'exp-gameboy': ExpGameBoy,
  'exp-ds': ExpDS,
  'exp-psp': ExpPSP,
  'exp-switch': ExpSwitch,
  'exp-steamdeck': ExpSteamDeck,
};

export function ExperienceRenderer({
  id,
  ...rest
}: ExperienceProps & { id: string }) {
  const C = EXPERIENCES[id] ?? ExpHotspot;
  return <C {...rest} />;
}