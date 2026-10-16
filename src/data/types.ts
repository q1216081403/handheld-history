// 数据类型定义：设备、章节、来源、互动体验
// 所有字段为纯数据，便于后续新增机型而不改动页面逻辑。

export type DeviceCategory =
  | 'early-fixed' // 早期固定游戏电子掌机
  | 'cartridge' // 可更换游戏媒介的传统掌机
  | 'hybrid' // 混合型主机
  | 'android-retro' // 安卓与复古游戏掌机
  | 'pc-handheld' // PC 掌机
  | 'streaming' // 串流设备
  | 'boundary' // 边界产品
  | 'prototype'; // 原型机 / 取消上市 / 概念设备

export type ReleaseStatus =
  | 'released' // 已上市
  | 'cancelled' // 已取消 / 未上市
  | 'prototype' // 原型 / 概念
  | 'rumored'; // 传闻，未证实

export type Media =
  | 'LED'
  | 'LCD-fixed'
  | 'ROM-cartridge'
  | 'GameCard'
  | 'proprietary-cart'
  | 'CD'
  | 'UMD'
  | 'mini-disc'
  | 'digital'
  | 'none';

export type EraId = 'era-1' | 'era-2' | 'era-3' | 'era-4' | 'era-5';

export type ClaimKind = 'fact' | 'simplification' | 'opinion';

export interface SourceRef {
  title: string;
  publisher: string;
  url: string;
  /** 官方 / 博物馆 / 媒体 / 数据库 等 */
  kind: 'official' | 'museum' | 'media' | 'database' | 'community';
  accessed: string; // YYYY-MM-DD 最后核查日期
}

export interface ExperienceRef {
  /** 对应 experiences/ 下的互动组件 key */
  id: string;
  title: string;
  /** 预计耗时（秒） */
  seconds: number;
  /** 体验完成后要回答的检验问题 */
  checkpoint: string;
  goal: string;
}

export interface DeviceVariant {
  name: string;
  regionNote: string;
  year: number;
  diff: string;
}

export interface Specs {
  screen: string;
  controls: string;
  power: string;
  media: Media;
  mediaLabel: string;
  cpu?: string;
  extra?: Record<string, string>;
}

export interface Claim {
  kind: ClaimKind;
  text: string;
  sourceIds?: string[];
}

export interface Device {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  maker: string;
  category: DeviceCategory;
  status: ReleaseStatus;
  era: EraId;
  /** 首次上市年份（用于排序与筛选） */
  year: number;
  releaseDate: { region: string; date: string }[];
  discontinued?: string;
  introPrice?: { region: string; value: string; note?: string };
  oneLiner: string;
  problemSolved: string;
  novelty: string;
  tradeoffs: string;
  contemporaries: string;
  specs: Specs;
  /** 经核实的代表游戏名称（仅文字，不嵌入任何 ROM 或美术资源） */
  notableGames: { title: string; note?: string }[];
  story?: string[]; // 短故事段落
  claims: Claim[];
  sources: SourceRef[];
  /** 是否已有独立互动章节 */
  chapterId?: string;
  experience?: ExperienceRef;
  variants?: DeviceVariant[];
  seriesId?: string;
  /** 资料完成度 */
  completeness: 'full' | 'partial' | 'pending';
  artNote: string; // 外观图说明（原创 SVG 示意图等）
  rumble?: { builtin: boolean; note: string };
}

export interface Era {
  id: EraId;
  title: string;
  range: string;
  intro: string;
  /** 该年代的视觉气质：屏幕色彩与界面配色 */
  palette: { screen: string; glow: string; paper: string };
  musicMood: 'early-electronic' | '8bit' | '16bit' | 'modern-ambient';
}

export interface AssetLicense {
  id: string;
  kind: 'art' | 'audio' | 'font' | 'data';
  name: string;
  author: string;
  license: string;
  source: string;
  attributionRequired: boolean;
  note: string;
}