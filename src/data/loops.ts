import { CARD_DEFS } from './cards';

export interface LoopDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cardIds: string[];
}

const idsOf = (characters: string[]) =>
  CARD_DEFS.filter((def) => characters.includes(def.character)).map((def) => def.id);

export const LOOPS: LoopDef[] = [
  {
    id: 'starward',
    name: '星之所向',
    subtitle: '沐纱 · 夜棠',
    description: '被星光牵引的两段记忆，在此回环中反复重演。',
    cardIds: idsOf(['musia', 'yettia']),
  },
  {
    id: 'harvest',
    name: '麦穗之约',
    subtitle: '沐花',
    description: '丰收与日常的祈愿，在零食与周边之间轻轻回响。',
    cardIds: idsOf(['hamuna']),
  },
  {
    id: 'talent',
    name: '湛蓝回声',
    subtitle: '妈妈',
    description: '人才俱乐部的灯光下，社恐研究员与虚拟偶像交替登场。',
    cardIds: idsOf(['mama']),
  },
];
