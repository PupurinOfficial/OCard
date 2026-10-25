import { CARD_DEFS, cardsOfCharacter } from '../data/cards';

export const MIN_DECK = 5;
export const MAX_DECK = 10;

export function isValidDeck(ids: string[]): boolean {
  return (
    ids.length >= MIN_DECK &&
    ids.length <= MAX_DECK &&
    new Set(ids).size === ids.length
  );
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 敌方卡组：优先使用该角色的卡牌，数量不足时从其余卡牌补齐，最终与玩家卡组张数一致。 */
export function buildEnemyDeck(characterId: string, size: number): string[] {
  const own = shuffle(cardsOfCharacter(characterId).map((def) => def.id));
  const rest = shuffle(
    CARD_DEFS.map((def) => def.id).filter((id) => !own.includes(id)),
  );
  return [...own, ...rest].slice(0, Math.min(size, CARD_DEFS.length));
}
