import React from 'react';
import { DEVICES, SERIES, SCOPE, ASSETS, SOURCE_INDEX } from './data/devices';
import { ERAS, CATEGORY_LABELS, STATUS_LABELS } from './data/eras';
import type { Device, ClaimKind } from './data/types';
import { audio } from './lib/audio';
import { haptics } from './lib/haptics';
import { loadProgress, saveProgress, resetProgress, type Progress, type Settings } from './lib/progress';
import { DeviceShell, type ScreenTone } from './components/DeviceShell';
import { ExperienceRenderer, ExpHotspot } from './experiences';

type Route =
  | { p: 'home' }
  | { p: 'map' }
  | { p: 'chapter'; id: string }
  | { p: 'dex' }
  | { p: 'compare'; ids: string[] }
  | { p: 'collection' }
  | { p: 'sources' };

/* ============================ 通用小组件 ============================ */

function ClaimBadge({ kind }: { kind: ClaimKind }) {
  const label = kind === 'fact' ? '史实' : kind === 'opinion' ? '主观评价' : '教学简化';
  const cls = kind === 'fact' ? 'fact' : kind === 'opinion' ? 'opinion' : 'simplification';
  return <span className={`badge badge--${cls}`}>{label}</span>;
}

function SettingsPanel({
  s,
  set,
  onReset,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  onReset: () => void;
}) {
  const [haptic, setHaptic] = React.useState(haptics.describe());
  const [testMsg, setTestMsg] = React.useState('');
  React.useEffect(() => {
    const off = haptics.onChange(() => setHaptic(haptics.describe()));
    return () => {
      off();
    };
  }, []);

  const tone: ScreenTone = s.pixelZoom ? 'lcd-green' : 'lcd-gray';

  return (
    <div className="settings">
      <fieldset>
        <legend>声音</legend>
        <label>
          音乐音量：{Math.round(s.musicVolume * 100)}%
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(s.musicVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              audio.setMusicVolume(v);
              set({ musicVolume: v });
            }}
          />
        </label>
        <label>
          音效音量：{Math.round(s.sfxVolume * 100)}%
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(s.sfxVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              audio.setSfxVolume(v);
              set({ sfxVolume: v });
            }}
          />
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={!s.muted}
            onChange={(e) => {
              audio.setMuted(!e.target.checked);
              set({ muted: !e.target.checked });
            }}
          />
          允许播放声音
        </label>
        <p className="tiny">
          全部音乐与音效由本项目实时合成（教学音效），未使用任何商业游戏 BGM 或录音素材。
        </p>
      </fieldset>

      <fieldset>
        <legend>触觉反馈</legend>
        <label className="checkline">
          <input
            type="checkbox"
            checked={s.hapticsEnabled}
            onChange={(e) => {
              haptics.setEnabled(e.target.checked);
              set({ hapticsEnabled: e.target.checked });
            }}
          />
          启用触觉反馈（默认关闭）
        </label>
        <label>
          强度：
          <select
            value={s.hapticStrength}
            onChange={(e) => {
              const v = e.target.value as Settings['hapticStrength'];
              haptics.setStrength(v);
              set({ hapticStrength: v });
            }}
          >
            <option value="off">关闭</option>
            <option value="weak">弱</option>
            <option value="medium">中</option>
            <option value="strong">强</option>
          </select>
        </label>
        <button
          className="btn btn--small"
          onClick={async () => {
            const mode = await haptics.fire();
            setTestMsg(
              mode === 'vibrate'
                ? '已向系统发送振动请求（不代表已确认硬件震动）'
                : mode === 'gamepad'
                  ? '已尝试通过手柄震动接口发送'
                  : mode === 'simulated'
                    ? '仅视听模拟：无可用振动接口'
                    : '反馈被关闭或处于频率限制中'
            );
          }}
        >
          测试反馈
        </button>
        <button className="btn btn--small" onClick={() => { haptics.stop(); setTestMsg('已停止'); }}>
          立即停止
        </button>
        <p className="tiny">{haptic}</p>
        {testMsg && <p className="tiny">测试结果：{testMsg}</p>}
        <p className="tiny">
          说明：网页无法精确复现原机按键手感、HD 震动或自适应扳机。本课本的触觉反馈是教学用途的简化提示，
          与原机震动马达功能无关，也不代表这些历史掌机原本都带震动。
        </p>
      </fieldset>

      <fieldset>
        <legend>显示与可读性</legend>
        <label className="checkline">
          <input
            type="checkbox"
            checked={s.reducedMotion}
            onChange={(e) => {
              haptics.setReducedMotion(e.target.checked);
              set({ reducedMotion: e.target.checked });
            }}
          />
          减少动态效果（关闭位移、抖动与弹跳动画）
        </label>
        <label className="checkline">
          <input type="checkbox" checked={s.noFlashing} onChange={(e) => set({ noFlashing: e.target.checked })} />
          关闭屏幕闪烁效果
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={s.pixelZoom}
            onChange={(e) => set({ pixelZoom: e.target.checked })}
          />
          教学放大（原始低分辨率 / 放大阅读）
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={s.gridOverlay}
            onChange={(e) => set({ gridOverlay: e.target.checked })}
          />
          显示像素网格（说明低分辨率原理）
        </label>
        <p className="tiny">
          当前示意色调：{tone}。复古效果永远不会以牺牲文字可读性为代价。
        </p>
      </fieldset>

      <fieldset>
        <legend>学习进度</legend>
        <p className="tiny">进度保存在本机浏览器（localStorage），第一版不强制注册登录。</p>
        <button
          className="btn btn--small"
          onClick={() => {
            if (confirm('确定清空本机学习进度？')) {
              onReset();
              alert('已清空进度。');
            }
          }}
        >
          清空进度
        </button>
      </fieldset>
    </div>
  );
}

/* ============================ 应用主体 ============================ */

export default function App() {
  const [route, setRoute] = React.useState<Route>({ p: 'home' });
  const [progress, setProgress] = React.useState<Progress>(() => loadProgress());
  const [showSettings, setShowSettings] = React.useState(false);
  const [audioBlocked, setAudioBlocked] = React.useState(false);
  const [stamp, setStamp] = React.useState<string | null>(null);

  const chapterDevices = DEVICES.filter((d) => d.chapterId);
  const fullCount = DEVICES.filter((d) => d.completeness === 'full').length;
  const pendingCount = DEVICES.filter((d) => d.completeness === 'pending').length;

  const set = React.useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => {
      const next = { ...prev, settings: { ...prev.settings, ...patch } };
      saveProgress(next);
      return next;
    });
  }, []);

  const navigate = React.useCallback((r: Route) => {
    setRoute(r);
    audio.sfx('menu');
    window.scrollTo({ top: 0 });
  }, []);

  // 恢复音频与进度
  React.useEffect(() => {
    audio.setMusicVolume(progress.settings.musicVolume);
    audio.setSfxVolume(progress.settings.sfxVolume);
    audio.setMuted(progress.settings.muted);
    haptics.setEnabled(progress.settings.hapticsEnabled);
    haptics.setStrength(progress.settings.hapticStrength);
    haptics.setReducedMotion(progress.settings.reducedMotion);
    const off = haptics.watchGamepads();
    return () => {
      off();
    };
  }, []);

  React.useEffect(() => {
    const off = audio.onChange(() => setAudioBlocked(audio.isBlocked()));
    return () => {
      off();
    };
  }, []);

  // 页面隐藏时暂停声音
  React.useEffect(() => {
    const onVis = () => {
      if (document.hidden) audio.pauseAll();
      else if (progress.settings.audioStarted) void audio.resumeIfAllowed();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [progress.settings.audioStarted]);

  // 章节音乐气质
  React.useEffect(() => {
    const era = ERAS.find((e) => e.id === (route.p === 'chapter' ? deviceById(route.id)?.era : undefined));
    if (era) audio.setMood(era.musicMood);
  }, [route]);

  // 记录已发生真实用户手势（振动接口需要手势后才被浏览器允许）
  const markGesture = () => haptics.markUserGesture();
  const startAudio = async () => {
    markGesture();
    const ok = await audio.init();
    if (ok) {
      const era =
        ERAS.find((e) => e.id === (route.p === 'chapter' ? deviceById(route.id)?.era : undefined)) ?? ERAS[0];
      audio.setMood(era.musicMood);
      audio.startLoop(era.musicMood);
      set({ audioStarted: true });
    }
  };

  const completeDevice = (device: Device) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        completed: prev.completed.includes(device.id) ? prev.completed : [...prev.completed, device.id],
        stamps: prev.stamps.includes(device.id) ? prev.stamps : [...prev.stamps, device.id],
        collected: prev.collected.includes(device.id) ? prev.collected : [...prev.collected, device.id],
        read: prev.read.includes(device.id) ? prev.read : [...prev.read, device.id],
        lastDevice: device.id,
      };
      saveProgress(next);
      return next;
    });
    setStamp(device.id);
  };

  const markRead = (id: string) => {
    setProgress((prev) => {
      if (prev.read.includes(id)) return prev;
      const next = { ...prev, read: [...prev.read, id] };
      saveProgress(next);
      return next;
    });
  };

  const unlockNext = (device: Device) => {
    // 解锁条件：自由探索模式在完成任意一台后开启
    setProgress((prev) => {
      if (prev.settings.freeExploreUnlocked) return prev;
      const next = {
        ...prev,
        settings: { ...prev.settings, freeExploreUnlocked: true },
      };
      saveProgress(next);
      return next;
    });
  };

  const canRead = (d: Device) =>
    progress.settings.freeExploreUnlocked ||
    progress.completed.length === 0 ||
    progress.read.includes(d.id) ||
    progress.completed.includes(d.id) ||
    chapterDevices[0]?.id === d.id;

  return (
    <div className={`app ${progress.settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <header className="topbar">
        <button className="topbar__brand" onClick={() => navigate({ p: 'home' })}>
          <span className="topbar__mark">掌机时光机</span>
          <span className="topbar__sub">一本可以玩的游戏史</span>
        </button>
        <nav className="topbar__nav">
          <button onClick={() => navigate({ p: 'map' })}>历史地图</button>
          <button onClick={() => navigate({ p: 'dex' })}>掌机图鉴</button>
          <button onClick={() => navigate({ p: 'compare', ids: [] })}>对比实验室</button>
          <button onClick={() => navigate({ p: 'collection' })}>收藏册</button>
          <button onClick={() => navigate({ p: 'sources' })}>来源说明</button>
        </nav>
        <button className="btn btn--small" onClick={() => setShowSettings((v) => !v)}>
          设置
        </button>
      </header>

      {audioBlocked && (
        <div className="banner banner--audio">
          浏览器阻止了自动播放。
          <button className="btn btn--small" onClick={startAudio}>
            点击恢复播放
          </button>
        </div>
      )}

      {showSettings && (
        <div className="settings-wrap">
          <SettingsPanel
            s={progress.settings}
            set={set}
            onReset={() => {
              resetProgress();
              setProgress(loadProgress());
            }}
          />
        </div>
      )}

      <main>
        {route.p === 'home' && (
          <Home
            onStart={startAudio}
            onBegin={() => {
              void startAudio();
              navigate({ p: 'map' });
            }}
            onContinue={() => {
              if (progress.lastDevice) navigate({ p: 'chapter', id: progress.lastDevice });
              else navigate({ p: 'map' });
            }}
            onExplore={() => navigate({ p: 'map' })}
            progress={progress}
            chapterDevices={chapterDevices}
          />
        )}

        {route.p === 'map' && (
          <EraMap
            onPick={(id) => {
              markRead(id);
              navigate({ p: 'chapter', id });
            }}
            progress={progress}
            canRead={canRead}
          />
        )}

        {route.p === 'chapter' && (
          <ChapterPage
            device={deviceById(route.id)!}
            progress={progress}
            onComplete={completeDevice}
            onUnlock={unlockNext}
            onNavigate={navigate}
            onRead={() => markRead(route.id)}
            showStamp={stamp === route.id}
          />
        )}

        {route.p === 'dex' && (
          <Dex
            progress={progress}
            onOpen={(id) => {
              markRead(id);
              navigate({ p: 'chapter', id });
            }}
            onCompare={(ids) => navigate({ p: 'compare', ids })}
          />
        )}

        {route.p === 'compare' && <Compare initial={route.ids} onNavigate={navigate} />}

        {route.p === 'collection' && (
          <Collection
            progress={progress}
            onOpen={(id) => navigate({ p: 'chapter', id })}
            onExplore={() => navigate({ p: 'map' })}
          />
        )}

        {route.p === 'sources' && <Sources />}
      </main>

      <footer className="footer">
        <p>
          {SCOPE.version} · 资料核查截止日期：{SCOPE.verifyCutoff} ·
          已收录 {DEVICES.length} 条（完整资料 {fullCount} 条 / 待核实 {pendingCount} 条）· 本版本为
          <strong>第一阶段样例</strong>，不是完整课本
        </p>
      </footer>
    </div>
  );
}

/** 各设备示意图上「示意画面」文字的定位（对应 DeviceShell 中的屏幕矩形） */
function deviceById(id: string) {
  return DEVICES.find((d) => d.id === id);
}

/* ============================ 首页 ============================ */
function Home({
  onStart,
  onBegin,
  onContinue,
  onExplore,
  progress,
  chapterDevices,
}: {
  onStart: () => void;
  onBegin: () => void;
  onContinue: () => void;
  onExplore: () => void;
  progress: Progress;
  chapterDevices: Device[];
}) {
  const started = progress.completed.length > 0 || progress.read.length > 0;
  return (
    <div className="home">
      <section className="home__hero paper">
        <p className="stamp-label">电子课本 · 可操作的掌机博物馆</p>
        <h1>掌机时光机</h1>
        <p className="sub">一本可以玩的游戏史</p>
        <p className="lead">
          这里不是参数表。你会读到一段历史，操作一台虚拟掌机，玩一个几十秒的小体验，
          然后回答三个问题：它是什么？它和其他掌机有什么不同？它为什么值得在历史里被提到？
        </p>
        <div className="home__actions">
          {!progress.settings.audioStarted && (
            <button
              className="btn btn--primary"
              onClick={() => {
                onStart();
                onBegin();
              }}
            >
              开始时光旅行（同时启用声音）
            </button>
          )}
          <button className="btn btn--primary" onClick={onBegin}>
            开始体验
          </button>
          <button className="btn" onClick={onContinue} disabled={!started}>
            继续学习{progress.lastDevice ? `：${deviceById(progress.lastDevice)?.shortName}` : ''}
          </button>
          <button className="btn" onClick={onExplore}>
            自由浏览（不需要闯关）
          </button>
        </div>
        <p className="tiny">
          {chapterDevices.length} 个互动章节已开放，共 {DEVICES.length} 条图鉴资料。
          声音默认柔和，可在设置中单独调节音乐与音效。
        </p>
      </section>

      <section className="home__cards">
        <div className="paper card">
          <h3>怎么用</h3>
          <ol>
            <li>选一段历史章节</li>
            <li>打开一台虚拟掌机</li>
            <li>完成 30 秒到 2 分钟的互动</li>
            <li>回答检验问题，拿到收藏印章</li>
            <li>解锁下一段历史</li>
          </ol>
        </div>
        <div className="paper card">
          <h3>不想玩小游戏？</h3>
          <p>
            自由探索模式不需要闯关就能阅读全部已完成内容。想查资料就直接查，不必先玩一遍。
          </p>
          <button className="btn btn--small" onClick={onExplore}>
            去历史地图
          </button>
        </div>
        <div className="paper card">
          <h3>关于真实性</h3>
          <p>
            文案区分「史实」「教学简化」「主观评价」三类；每条重要事实都指向具体来源；
            无法核实的条目会标为「待核实」，不会编造。
          </p>
        </div>
      </section>
    </div>
  );
}

/* ============================ 历史地图 ============================ */
function EraMap({
  onPick,
  progress,
  canRead,
}: {
  onPick: (id: string) => void;
  progress: Progress;
  canRead: (d: Device) => boolean;
}) {
  return (
    <div className="map">
      <h1>历史地图</h1>
      <p className="lead">
        历史不只有一条线。这里按年代分章，同时显示不同厂商的发展路线与同期产品的竞争关系。
      </p>
      <p className="tiny">
        厂商标记：N=任天堂 S=索尼 SE=世嘉 SNK=SNK BA=万代 AT=雅达利 NEC= NEC ｜
        EP=Epoch MB=Milton Bradley ｜ VA=Valve AS=华硕
      </p>
      {ERAS.map((era) => {
        const list = DEVICES.filter((d) => d.era === era.id).sort((a, b) => a.year - b.year);
        return (
          <section key={era.id} className="era paper" style={{ ['--screen' as string]: era.palette.screen }}>
            <header>
              <h2>{era.title}</h2>
              <p className="era__range">{era.range}</p>
            </header>
            <p className="era__intro">{era.intro}</p>
            <div className="era__lane">
              {list.map((d) => {
                const locked = !canRead(d);
                return (
                  <button
                    key={d.id}
                    className={`node ${locked ? 'is-locked' : ''} ${
                      progress.completed.includes(d.id) ? 'is-done' : ''
                    }`}
                    onClick={() => onPick(d.id)}
                  >
                    <span className="node__year">{d.year}</span>
                    <span className="node__name">{d.shortName}</span>
                    <span className="node__maker">{d.maker.split(/[（(]/)[0]}</span>
                    {d.chapterId ? <span className="node__tag">互动章节</span> : <span className="node__tag node__tag--muted">资料页</span>}
                    {progress.completed.includes(d.id) && <span className="node__stamp">已得印章</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ============================ 章节页 ============================ */
function ChapterPage({
  device,
  progress,
  onComplete,
  onUnlock,
  onNavigate,
  onRead,
  showStamp,
}: {
  device: Device;
  progress: Progress;
  onComplete: (d: Device) => void;
  onUnlock: (d: Device) => void;
  onNavigate: (r: Route) => void;
  onRead: () => void;
  showStamp: boolean;
}) {
  React.useEffect(() => {
    onRead();
  }, [device.id]);

  const era = ERAS.find((e) => e.id === device.era)!;
  const done = progress.completed.includes(device.id);
  const series = SERIES.find((s) => s.memberIds.includes(device.id));
  const toneMap: Record<string, 'lcd-green' | 'lcd-gray' | 'color' | 'oled' | 'wide'> = {
    'early-fixed': 'lcd-green',
    cartridge: 'lcd-green',
    hybrid: 'color',
    'android-retro': 'color',
    'pc-handheld': 'wide',
    streaming: 'color',
    boundary: 'lcd-gray',
    prototype: 'lcd-gray',
  };
  const tone: ScreenTone = device.id === 'psp' ? 'wide' : device.id === 'steam-deck' ? 'wide' : toneMap[device.category];

  const answers = ['它是什么？', '它和其他掌机有什么不同？', '它为什么值得在历史里被提到？'];

  return (
    <article className="chapter" style={{ ['--paper' as string]: era.palette.paper }}>
      <div className="chapter__head">
        <p className="chapter__era">
          {era.title} · {era.range}
        </p>
        <h1>{device.name}</h1>
        <p className="chapter__one">{device.oneLiner}</p>
        <p className="chapter__meta">
          {device.maker} · {device.year} · {CATEGORY_LABELS[device.category]} · {STATUS_LABELS[device.status]}
        </p>
      </div>

      <div className="chapter__grid">
        <section className="paper">
          <h3>这段历史是怎么开始的</h3>
          {device.story?.map((p, i) => <p key={i}>{p}</p>)}
        </section>
        <aside className="paper chapter__device">
          {/* 不传 children：造型自行在屏幕矩形内渲染「示意画面」占位文字 */}
          <DeviceShell deviceId={device.id} tone={tone} grid={progress.settings.gridOverlay} />
          <p className="tiny">{device.artNote}</p>
        </aside>
      </div>

      <section className="paper">
        <h3>它解决了什么问题</h3>
        <p>{device.problemSolved}</p>
        <h3>当时它有什么新意</h3>
        <p>{device.novelty}</p>
        <h3>它牺牲了什么</h3>
        <p>{device.tradeoffs}</p>
        <h3>与同期产品的差别</h3>
        <p>{device.contemporaries}</p>
      </section>

      <section className="paper">
        <h3>关键信息</h3>
        <table className="spec">
          <tbody>
            <tr>
              <th>首次上市</th>
              <td>{device.releaseDate.map((r) => `${r.region}：${r.date}`).join('；')}</td>
            </tr>
            {device.discontinued && (
              <tr>
                <th>停产</th>
                <td>{device.discontinued}</td>
              </tr>
            )}
            {device.introPrice && (
              <tr>
                <th>首发价格</th>
                <td>
                  {device.introPrice.region}：{device.introPrice.value}
                  {device.introPrice.note && <span className="tiny">（{device.introPrice.note}）</span>}
                </td>
              </tr>
            )}
            <tr>
              <th>屏幕</th>
              <td>{device.specs.screen}</td>
            </tr>
            <tr>
              <th>按键 / 操作</th>
              <td>{device.specs.controls}</td>
            </tr>
            <tr>
              <th>供电</th>
              <td>{device.specs.power}</td>
            </tr>
            <tr>
              <th>游戏媒介</th>
              <td>{device.specs.mediaLabel}</td>
            </tr>
            {device.specs.cpu && (
              <tr>
                <th>处理器</th>
                <td>{device.specs.cpu}</td>
              </tr>
            )}
            {device.specs.extra &&
              Object.entries(device.specs.extra).map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            <tr>
              <th>震动</th>
              <td>{device.rumble?.note ?? '资料未核实'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="paper">
        <h3>经核实的代表游戏（仅文字引用）</h3>
        {device.notableGames.length ? (
          <ul>
            {device.notableGames.map((g) => (
              <li key={g.title}>
                {g.title}
                {g.note && <span className="tiny"> — {g.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="tiny">该条目暂无已核实的代表游戏资料。</p>
        )}
        <p className="tiny">
          本课本不运行 ROM，也不嵌入任何商业游戏的图像或音乐资产；这里只讨论作品名称与历史位置。
        </p>
      </section>

      <section className="paper chapter__exp">
        <h3>动手体验</h3>
        {device.experience ? (
          device.experience.id === 'exp-hotspot' ? (
            <ExpHotspot
              deviceId={device.id}
              mediaLabel={device.specs.mediaLabel}
              onDone={() => {
                onComplete(device);
                onUnlock(device);
              }}
            />
          ) : (
            <ExperienceRenderer
              id={device.experience.id}
              reducedMotion={progress.settings.reducedMotion}
              grid={progress.settings.gridOverlay}
              onDone={() => {
                onComplete(device);
                onUnlock(device);
              }}
            />
          )
        ) : (
          <p className="tiny">
            该机型目前只有图鉴资料页，互动体验正在制作中（已列入后续补全计划）。
          </p>
        )}
        {showStamp && (
          <div className="stamp-pop" role="status">
            <span>已获得收藏印章：{device.shortName}</span>
            <button className="btn btn--small" onClick={() => onNavigate({ p: 'map' })}>
              回到历史地图，解锁下一段
            </button>
          </div>
        )}
        {done && !showStamp && (
          <p className="tiny">你已完成这台设备的体验，可在收藏册中查看印章。</p>
        )}
      </section>

      <section className="paper">
        <h3>用你自己的话回答</h3>
        <ol className="answers">
          {answers.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className="tiny">如果三句话都能说清楚，说明你真的理解了这台机器在历史里的位置。</p>
      </section>

      {series && (
        <section className="paper">
          <h3>系列：{series.name}</h3>
          <p>{series.intro}</p>
          <div className="series-list">
            {series.memberIds.map((mid) => {
              const m = deviceById(mid);
              if (!m) return null;
              return (
                <button key={mid} className="btn btn--small" onClick={() => onNavigate({ p: 'chapter', id: mid })}>
                  {m.shortName} · {m.year}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="paper">
        <h3>事实分层</h3>
        <ul className="claims">
          {device.claims.map((c, i) => (
            <li key={i}>
              <ClaimBadge kind={c.kind} />
              <span>{c.text}</span>
              {c.sourceIds?.map((sid) => {
                const src = SOURCE_INDEX[sid];
                if (!src) return null;
                return (
                  <a key={sid} className="srcref" href={src.url} target="_blank" rel="noreferrer noopener">
                    {src.publisher}
                  </a>
                );
              })}
            </li>
          ))}
        </ul>
        <h3>资料来源与最后核查时间</h3>
        <ul className="srclist">
          {device.sources.map((s, i) => (
            <li key={i}>
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.title}
              </a>
              <span className="tiny">
                {' '}
                — {s.publisher}（{s.kind === 'official' ? '官方' : s.kind === 'museum' ? '博物馆' : s.kind === 'media' ? '媒体' : '资料库'}）
                ，核查于 {s.accessed}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

/* ============================ 图鉴 ============================ */
function Dex({
  progress,
  onOpen,
  onCompare,
}: {
  progress: Progress;
  onOpen: (id: string) => void;
  onCompare: (ids: string[]) => void;
}) {
  const [q, setQ] = React.useState('');
  const [maker, setMaker] = React.useState('all');
  const [cat, setCat] = React.useState('all');
  const [screen, setScreen] = React.useState('all');
  const [media, setMedia] = React.useState('all');
  const [sel, setSel] = React.useState<string[]>([]);

  const makers = Array.from(new Set(DEVICES.map((d) => d.maker))).sort();
  const screens = Array.from(new Set(DEVICES.map((d) => d.specs.screen.includes('彩色') || d.specs.screen.includes('OLED') ? '彩色 / OLED' : '单色 / 无色')));
  const mediaKinds = Array.from(new Set(DEVICES.map((d) => d.specs.media)));

  const list = DEVICES.filter((d) => {
    const hay = [d.name, d.shortName, ...d.aliases, d.maker, d.year.toString()].join(' ').toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (maker !== 'all' && d.maker !== maker) return false;
    if (cat !== 'all' && d.category !== cat) return false;
    if (media !== 'all' && d.specs.media !== media) return false;
    if (screen !== 'all') {
      const isColor = d.specs.screen.includes('彩色') || d.specs.screen.includes('OLED') || d.specs.screen.includes('color');
      if ((screen === '彩色 / OLED') !== isColor) return false;
    }
    return true;
  }).sort((a, b) => a.year - b.year);

  const toggleSel = (id: string) => {
    audio.sfx('tap');
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? [...s.slice(1), id] : [...s, id]));
  };

  return (
    <div className="dex">
      <h1>掌机图鉴</h1>
      <p className="lead">
        当前资料库共 <strong>{DEVICES.length}</strong> 条，其中完整资料 {DEVICES.filter((d) => d.completeness === 'full').length} 条、
        部分资料 {DEVICES.filter((d) => d.completeness === 'partial').length} 条、待核实 {DEVICES.filter((d) => d.completeness === 'pending').length} 条。
        本书<strong>不声称已收录全部掌机</strong>。
      </p>

      <div className="filters paper">
        <label>
          搜索（名称 / 缩写 / 厂商 / 年份）：
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="例如 GB、DMG、1989、掌机" />
        </label>
        <label>
          厂商
          <select value={maker} onChange={(e) => setMaker(e.target.value)}>
            <option value="all">全部</option>
            {makers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          类别
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">全部</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          屏幕
          <select value={screen} onChange={(e) => setScreen(e.target.value)}>
            <option value="all">全部</option>
            {screens.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          游戏媒介
          <select value={media} onChange={(e) => setMedia(e.target.value)}>
            <option value="all">全部</option>
            {mediaKinds.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="dex__toolbar">
        <span>已选 {sel.length}/3 台用于对比</span>
        <button className="btn btn--small" disabled={sel.length < 2} onClick={() => onCompare(sel)}>
          送到对比实验室
        </button>
      </div>

      <div className="dex__grid">
        {list.map((d) => (
          <article key={d.id} className={`paper dexcard ${sel.includes(d.id) ? 'is-sel' : ''}`}>
            <button className="dexcard__title" onClick={() => onOpen(d.id)}>
              {d.shortName}
            </button>
            <p className="dexcard__meta">
              {d.maker.split(/[（(]/)[0]} · {d.year} · {CATEGORY_LABELS[d.category]}
            </p>
            <p className="dexcard__line">{d.oneLiner}</p>
            <p className="dexcard__media">媒介：{d.specs.mediaLabel}</p>
            <div className="dexcard__foot">
              <span className={`status status--${d.completeness}`}>
                {d.completeness === 'full' ? '资料完整' : d.completeness === 'partial' ? '部分资料' : '待核实'}
              </span>
              {d.status !== 'released' && <span className="status status--warn">{STATUS_LABELS[d.status]}</span>}
              {d.chapterId && <span className="status status--chapter">互动章节</span>}
              <button className="btn btn--tiny" onClick={() => toggleSel(d.id)}>
                {sel.includes(d.id) ? '取消选择' : '加入对比'}
              </button>
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="tiny">没有匹配的条目。试试更宽的关键词。</p>}
      </div>
    </div>
  );
}

/* ============================ 对比实验室 ============================ */
function Compare({ initial, onNavigate }: { initial: string[]; onNavigate: (r: Route) => void }) {
  const [ids, setIds] = React.useState<string[]>(initial);
  const chosen = ids.map(deviceById).filter(Boolean) as Device[];

  const rows: { label: string; get: (d: Device) => string; objective?: boolean }[] = [
    { label: '厂商 / 年份', get: (d) => `${d.maker} · ${d.year}`, objective: true },
    { label: '类别', get: (d) => CATEGORY_LABELS[d.category], objective: true },
    { label: '上市状态', get: (d) => STATUS_LABELS[d.status], objective: true },
    { label: '屏幕', get: (d) => d.specs.screen, objective: true },
    { label: '按键 / 操作', get: (d) => d.specs.controls, objective: true },
    { label: '供电方式', get: (d) => d.specs.power, objective: true },
    { label: '游戏媒介', get: (d) => d.specs.mediaLabel, objective: true },
    { label: '便携性（主观）', get: (d) => (d.category === 'pc-handheld' ? '机身较大，需双手握持' : '单手可持'), objective: false },
    { label: '生态（主观）', get: (d) => `${d.notableGames.length} 款已核实代表作品（仅本页收录量，不代表实际库大小）`, objective: false },
  ];

  return (
    <div className="compare">
      <h1>对比实验室</h1>
      <p className="lead">同时选择 2 至 3 款掌机来比较。参数相似不等于体验相同。</p>

      <div className="compare__picker paper">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value && ids.length < 3) setIds((s) => [...s, e.target.value]);
          }}
        >
          <option value="">+ 添加设备</option>
          {DEVICES.filter((d) => !ids.includes(d.id)).map((d) => (
            <option key={d.id} value={d.id}>{d.shortName}（{d.year}）</option>
          ))}
        </select>
        {ids.map((id) => (
          <button key={id} className="btn btn--small" onClick={() => setIds((s) => s.filter((x) => x !== id))}>
            移除 {deviceById(id)?.shortName}
          </button>
        ))}
      </div>

      {chosen.length < 2 ? (
        <p className="tiny">至少选择 2 台设备才能开始对比。</p>
      ) : (
        <table className="cmptable paper">
          <thead>
            <tr>
              <th>项目</th>
              {chosen.map((d) => (
                <th key={d.id}>{d.shortName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th>
                  {r.label}
                  {!r.objective && <span className="badge badge--opinion">主观</span>}
                </th>
                {chosen.map((d) => (
                  <td key={d.id}>{r.get(d)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>一句话定位</th>
              {chosen.map((d) => (
                <td key={d.id}>{d.oneLiner}</td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      <p className="tiny">
        标有「主观」的行是体验层面的判断，不是测量结果；标为客观的项目来自各条目已标注来源的资料。
        不同地区同名产品请见「掌机图鉴」中的系列与地区版说明，不要重复计入两台设备。
      </p>

      <div className="compare__links">
        <button className="btn btn--small" onClick={() => onNavigate({ p: 'dex' })}>
          去图鉴选择
        </button>
      </div>
    </div>
  );
}

/* ============================ 收藏册 ============================ */
function Collection({
  progress,
  onOpen,
  onExplore,
}: {
  progress: Progress;
  onOpen: (id: string) => void;
  onExplore: () => void;
}) {
  const unlocked = progress.settings.freeExploreUnlocked;
  return (
    <div className="collection">
      <h1>收藏册</h1>
      {!unlocked && (
        <div className="banner">
          自由探索模式尚未开启：完成任意一台设备的互动体验后即可解锁。在此之前，你仍然可以自由阅读已开放的章节内容。
        </div>
      )}
      <p className="lead">已完成体验：{progress.completed.length} 台 · 印章：{progress.stamps.length} 枚</p>

      <div className="collection__grid">
        {DEVICES.map((d) => {
          const done = progress.completed.includes(d.id);
          return (
            <div key={d.id} className={`paper stamp-card ${done ? 'is-done' : ''}`}>
              <DeviceShell deviceId={d.id} showLabel={false} tone="lcd-gray" />
              <div className="stamp-card__body">
                <strong>{d.shortName}</strong>
                <span className="tiny">{d.maker.split(/[（(]/)[0]} · {d.year}</span>
                {done ? (
                  <span className="stamp-card__stamp">印章已收集</span>
                ) : (
                  <button className="btn btn--tiny" onClick={() => onOpen(d.id)}>
                    {d.chapterId ? '去做互动体验' : '阅读资料页'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="tiny">
        进度保存在本机浏览器。清除浏览器数据或更换设备后进度会丢失，第一版没有云端同步。
      </p>
      <button className="btn" onClick={onExplore}>
        回到历史地图
      </button>
    </div>
  );
}

/* ============================ 来源说明 ============================ */
function Sources() {
  return (
    <div className="sources">
      <h1>来源与素材说明</h1>

      <section className="paper">
        <h2>收录范围与三层结构</h2>
        <ul>
          {SCOPE.layers.map((l) => (
            <li key={l.name}>
              <strong>{l.name}</strong>：{l.desc}
            </li>
          ))}
        </ul>
        <p className="tiny">
          版本：{SCOPE.version} · 资料核查截止日期：{SCOPE.verifyCutoff}。
          本书只显示实际完成的条目数量，不写「已收录全部掌机」。
        </p>
      </section>

      <section className="paper">
        <h2>资料来源规范</h2>
        <ol>
          <li>优先使用厂商官网、官方说明书与官方历史资料。</li>
          <li>其次参考可信媒体、博物馆与有引用的资料库。</li>
          <li>首次发售时间必须同时记录地区。</li>
          <li>参数、销量、价格注明口径；历史价格与当前二手价格分开。</li>
          <li>不确定或矛盾的资料会说明争议，不给所有产品编造销量、失败原因或研发故事。</li>
          <li>每个重要事实关联具体来源，而不是在页尾放几个无关链接。</li>
        </ol>
      </section>

      <section className="paper">
        <h2>素材与授权</h2>
        <table className="spec">
          <thead>
            <tr>
              <th>素材</th>
              <th>作者 / 来源</th>
              <th>授权</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.author}</td>
                <td>{a.license}</td>
                <td className="tiny">{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tiny">
          本项目不使用任何商业游戏的 ROM、贴图或音乐，也不运行模拟器。网上找到不等于允许公开再使用，
          因此所有外观图均为原创 SVG 示意图。
        </p>
      </section>

      <section className="paper">
        <h2>已知遗漏（待补全）</h2>
        <ul>
          {SCOPE.knownGaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="paper">
        <h2>存在争议的资料</h2>
        <ul>
          {SCOPE.controversies.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="paper">
        <h2>来源索引</h2>
        <ul className="srclist">
          {Object.entries(SOURCE_INDEX).map(([id, s]) => (
            <li key={id}>
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.title}
              </a>
              <span className="tiny">
                {' '}
                — {s.publisher}，核查于 {s.accessed}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}