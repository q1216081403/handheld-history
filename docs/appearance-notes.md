# 设备外观考据说明

本文件记录 `src/components/DeviceShell.tsx` 中每台设备外观示意图的**依据与绘制取舍**。

## 视觉语言：扁平矢量质感

所有造型共用一套绘制语言（实现在 `DeviceShell.tsx` 的 `Defs` / `Body` / `Screen` / `Btn` 等基础件中）：

| 部件 | 做法 |
|---|---|
| 机身 | 大圆角矩形 + 竖向线性渐变（上浅下深）+ 顶部内高光描边 + `feDropShadow` 外投影 |
| 斜面高光 | 沿机身顶部叠一层对角线性渐变，模拟受光面 |
| 屏幕 | 内凹槽：外框（黑色渐变）+ 屏面（深色双段渐变）+ 顶部内阴影 + 径向玻璃反光 |
| 圆形/方形按键 | 径向渐变（左上受光）+ 顶部高光弧 + 细白色描边 + `feDropShadow` |
| 十字键 | 哑光深色路径 + 顶部高光面 + 中心圆凹陷 |
| 摇杆 | 底座凹槽圆 + 杆帽 + 帽面高光 |
| 触摸板 | 微凹深色矩形 + 顶部投影线 |
| 丝印文字 | 小号低对比文字，不使用任何商标图形 |

每台设备的渐变 id 由`slug(deviceId)` 生成，避免同页多台设备时 id 冲突。

## 绘制原则

1. **原创绘制，非官方图片素材**：所有图形为手写 SVG，不使用厂商图片、照片或商标标识，页面统一标注「外观示意 · 原创绘制，非官方图片素材」。
2. **依据公开工业设计资料还原比例与布局**：机身长宽比取自各机型的公开外形尺寸；屏幕位置与占比、按键布局取自维修资料、官方沿革页与评测图解。
3. **不做像素级复刻**：不复制商标、丝印字体、原机配色渐变与散热鳍等细节；只保证「一眼能区分不同型号」。
4. **屏幕矩形由造型自己声明**：每个造型函数通过 `screen` 参数返回自己的屏幕矩形，`DeviceShell` 据此渲染「示意画面」占位文字与像素网格。这样修改造型后文字不会错位（原先的 `SCREEN_LABEL_POS` 硬编码坐标表已删除）。

## 各机型的关键还原点

下表列出**最容易被画错**的几处，以及本项目采用的画法。

| 机型 | 公开外形尺寸 | 本项目的还原要点 |
|---|---|---|
| Mattel Auto Race (1976) | 约 114 × 156 × 51 mm，横置 | LED 点阵窗在**机身右侧**（3 行 × 7 列）；**4 挡滑动开关在左侧**；转向拨杆在 LED 窗**正下方**；无方向盘 |
| Milton Bradley Microvision (1979) | 241 × 89 × 35 mm，横置 2.7:1 | LCD 窗在**机身左侧**；右侧为 **2 列 × 6 行**长条按键矩阵（非小键盘）；**右下角**为大号圆形方向轮 |
| Nintendo Game & Watch (1980, Ball) | 95 × 63 × 11.5 mm，竖置 | **无十字键**；GAME A / GAME B 斜键位于屏幕下方，TIME 在其下 |
| Epoch Game Pocket Computer (1984) | 横置，约为 Game Boy 的 2.5 倍 | 左十字键 — 中屏 — 右动作键的三段式布局 |
| Nintendo Game Boy DMG-01 (1989) | 148 × 90 × 32 mm，竖置 1.64:1 | **深灰色屏幕衬底**（DMG 两段式配色的标志）；十字键左下、A/B **近乎水平横排**在右下；**右下角 6 条右下倾斜的扬声器斜线**；丝印在正面左下 |
| Atari Lynx (1989) | 横置宽扁 | 屏幕居中，左十字键，右侧 **6 键 2 列 × 3 行** |
| Sega Game Gear (1990) | 210 × 113 × 38 mm，横置 1.86:1 | **屏幕在左、十字键在右**，6 键在十字键右方 2×3 排列；喇叭在左上角 |
| Watara Supervision (1992) | 约 140 × 78 mm，横置 | **方形屏居中**；左十字键、右 A/B 两颗斜键；SELECT/START 在下缘 |
| Tiger game.com (1997) | 190 × 108 × 19 mm，横置 | 左侧触控屏 + **可抽出式触控笔收纳槽**；右侧 A/B/C/D 四键弧形横排 |
| Neo Geo Pocket (1998) | 横置小掌机 | 超宽比例横屏居中，十字键与四键同在左侧 |
| WonderSwan (1999) | 横置小掌机 | 屏幕居中偏左，左十字键、右 B/A 竖排两键 |
| Pokémon mini (2001) | 极小横置机身 | 明显更宽更扁的比例，左十字键右 AB |
| Game Boy Pocket / Light (1996/1998) | 127.6 × 77.6 × 25.3 mm | **取消 DMG 的深色衬底**，屏幕区与机身同色；圆角更明显。Light 另有**背光开关** |
| Game Boy Color (1998) | 133 × 75 × 27 mm | 取消对比度旋钮；透明彩色外壳；**顶部新增红外口** |
| Game Boy Advance (2001) | 144.5 × 82 × 24.5 mm，横置 | **半梯形斜边机身**（两侧边向右下倾斜收窄），非矩形——这是与竖置 GB 系列最本质的差异 |
| Game Boy Advance SP (2003) | 闭合 84 × 82 mm，近方 | 翻盖造型，**铰链在后缘中央**；闭合上盖无外屏 |
| Sony PSP-1000 (2004) | 170 × 74 × 23 mm，横置 2.30:1 | 屏幕**偏左居中**，左右留按键区；**模拟 nub 在十字键正下方**（不在左侧外侧）；右侧 △○×□ 传统菱形 |
| Nintendo DS (2004) | 打开约 266 × 75 mm | **两屏左右并排**、铰链在机身中央（最容易画成上下堆叠）；左半上屏、右半下屏触摸 + 十字键 + 四键；电源拨钮在左上边缘 |
| Nintendo 3DS (2011) | 134 × 74 × 21 mm，竖置 | **上屏比下屏宽并向右滑出**（3D 滑轨），侧面剪影可见滑轨；上屏正上方居中一颗摄像头，外壳左右各一颗；十字键左上、其正下方新增圆形摇杆 |
| PS Vita (2011) | 182 × 83.6 × 18.6 mm，横置 | **Sony 菱形双摇杆**：左摇杆在左上、十字键其下；右摇杆在右下、四键其上；**正面无触摸板**（触摸板在背面） |
| Nintendo Switch (2017) | 239 × 102 × 13.9 mm，横置 | 屏幕居中；**首发配色左蓝右红**；**HOME 在左下、截图键在右下**（均在边框上） |
| Switch Lite (2019) | 208 × 91 × 14 mm | **一体式不可拆手柄**，屏幕缩至 5.5"，无底座 |
| Switch OLED (2021) | 176 × 102 × 14 mm | **7" OLED 白色边框**，仍可拆 Joy-Con 仍有底座，后部新增支架 |
| Steam Deck (2022) | 298 × 117 × 49 mm，横置 2.55:1 | 握把显著外扩；**十字键在最上、左摇杆在其下**（Xbox 布局）；**两块触摸板分置屏幕左右下方**，不在屏幕正下方居中 |
| Steam Deck OLED (2023) | 同上，7.4" HDR | 沿用 Steam Deck 布局，配色转浅 |
| PlayStation Portal (2023) | 355.6 × 152.4 × 98.6 mm | **DualSense 从中间劈开**接到两侧宽手柄区，屏幕居中；白色首发；PS 键在中缝左上 |
| Playdate (2022) | 76 × 74 × 9 mm，近方形 | **唯一非横置**的现代掌机；黄色机身；**曲柄在机身右侧** |
| ROG Ally (2023) | 280 × 111 × 32.4 mm | Xbox 布局；**无触摸板**——该位置改为 VIEW/MENU 与两颗功能键 |
| N-Gage / Tapwave Zodiac / Gizmondo / Evercade / Analogue Pocket / GP32 / GP2X / G Cloud / Xperia Play / OpenPandora | 见各条目 | 各自独立造型，按公开资料还原朝向与按键布局 |
| 安卓复古掌机（Anbernic 等家族） | — | 使用「家族示意」造型，**画面内明确标注「非单一型号」**，不冒充某具体型号 |

## 已知取舍与局限

- 未查证到可靠公开尺寸的**概念机与未上市设备**（Palmtex、Pingoo、3DO 掌机原型机、Playdate 概念设计）按同代工业设计语言绘制，并在图上标注「未上市 / 资料待核实」。
- 页面只显示**实际完成的条目数量**，造型覆盖率不作为完成度指标对外宣称。
- 互动体验（`src/experiences/index.tsx`）中的画面渲染在对应屏幕矩形内，依据的是各造型声明的 `screen` 参数。

## 主要参考来源

- 任天堂官方硬件沿革：<https://www.nintendo.com/hk/hardware/gamewatch/history.html>
- 世嘉官方硬件页（Game Gear）：<https://www.sega.jp/history/hard/gamegear/index.html>
- Valve Steam Deck 技术规格：<https://www.steamdeck.com/tech>
- Valve Steam Deck 按键图解：<https://www.techbloat.com/what-are-the-buttons-on-the-steam-deck-a-complete-control-guide.html>
- Nintendo Switch 官方家族对比：<https://www.nintendo.com/nl-nl/Hardware/Nintendo-Switch-familie/>
- Playdate 官网：<https://play.date/>
- iFixit 维修图解（Game Boy / PSP-1000）：<https://www.ifixit.com/Device/Game_Boy>、<https://it.ifixit.com/Device/PSP_1000>
- PCMag PS Vita 设计解析：<https://uk.pcmag.com/migrated-84555-gaming/52493/sony-playstation-vita-3gwi-fi>
- Laptop Mag ROG Ally 评测：<https://www.laptopmag.com/Asus-ROG-Ally>
- Bulbapedia（GBA / GBA SP / Game Boy）：<https://bulbapedia.bulbagarden.net/wiki/Game_Boy_Advance>
- Atari Lynx / Watara / Microvision 规格：<https://en.wikipedia.org/wiki/Atari_Lynx>、<https://en.wikipedia.org/wiki/Watara_Supervision>、<https://en.wikipedia.org/wiki/Milton_Bradley_Microvision>

以上来源用于核对**比例与布局**；所有图形本身为本项目原创绘制，未复制任何来源的图像内容。