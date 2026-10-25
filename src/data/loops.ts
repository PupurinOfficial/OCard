import { CARD_DEFS } from './cards';

export interface LoopDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cardIds: string[];
}

export const LOOPS: LoopDef[] = [
  {
    id: 'starward',
    name: '星之所向',
    subtitle: '沐纱 · 夜棠',
    description: '被星光牵引的两段记忆，在此回环中反复重演。',
    cardIds: CARD_DEFS.map((def) => def.id),
  },
];
