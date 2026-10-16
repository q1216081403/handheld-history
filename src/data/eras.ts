import type { Era } from './types';

export const ERAS: Era[] = [
  {
    id: 'era-1',
    title: '第一章 · 点亮第一盏灯',
    range: '1976 — 1980',
    intro:
      '在晶体管和集成电路刚刚便宜下来的年代，人们第一次把“可以编程的游戏”装进了口袋。这一章的机器大多只能玩一个游戏，屏幕是一排小灯或一块固定的液晶片，但它们确立了一个问题：游戏为什么不能像口琴一样随身携带？',
    palette: { screen: '#1a1008', glow: '#ff8b3d', paper: '#f3e7d0' },
    musicMood: 'early-electronic',
  },
  {
    id: 'era-2',
    title: '第二章 · 可换的想象力',
    range: '1980 — 1996',
    intro:
      '把游戏装进卡带，意味着一台机器可以玩成千上万个游戏。这一章里，掌机开始分化：有的走低价长续航路线，有的堆屏幕和算力，有的干脆做成能插在电视上的“混血机”。',
    palette: { screen: '#12281f', glow: '#63d17a', paper: '#efe6d2' },
    musicMood: '8bit',
  },
  {
    id: 'era-3',
    title: '第三章 · 口袋里的屏幕革命',
    range: '1997 — 2004',
    intro:
      '液晶屏、彩色与背光技术同时成熟，掌机第一次有了和家用机竞争的显示能力。厂商不再只谈“便携”，而是谈软件阵容、谈和主机联动、谈多媒体。',
    palette: { screen: '#101a2e', glow: '#5b8cff', paper: '#f0eadb' },
    musicMood: '16bit',
  },
  {
    id: 'era-4',
    title: '第四章 · 触屏、双屏与 3D',
    range: '2004 — 2012',
    intro:
      '输入方式成为新的战场。触摸笔、双屏、裸眼 3D、类平板的大屏幕，掌机开始不再是“缩水的主机”，而是另一种形态的电子设备。',
    palette: { screen: '#1b1030', glow: '#b98bff', paper: '#f2ecdf' },
    musicMood: '16bit',
  },
  {
    id: 'era-5',
    title: '第五章 · 掌机成为个人电脑',
    range: '2017 — 至今',
    intro:
      'Switch 用“同一台机器两种形态”改变了行业的想象；PC 掌机则把掌机直接做成一台小型电脑。与此同时，手机和平板也在蚕食“便携游戏”这块地。',
    palette: { screen: '#0e1b1f', glow: '#3fd0c9', paper: '#ece7dc' },
    musicMood: 'modern-ambient',
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  'early-fixed': '早期固定游戏掌机',
  cartridge: '可换卡带掌机',
  hybrid: '混合型主机',
  'android-retro': '安卓与复古掌机',
  'pc-handheld': 'PC 掌机',
  streaming: '串流设备',
  boundary: '边界产品',
  prototype: '原型与未上市',
};

export const STATUS_LABELS: Record<string, string> = {
  released: '已上市',
  cancelled: '取消 / 未上市',
  prototype: '原型 / 概念',
  rumored: '传闻（未证实）',
};