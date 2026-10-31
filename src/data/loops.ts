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
    subtitle: '沐纱 · 夜棠 · 沐花 · 妈妈',
    description: '被星光牵引的四段记忆，在此回环中反复重演。',
    cardIds: idsOf(['musia', 'yettia', 'hamuna', 'mama']),
  },
];
