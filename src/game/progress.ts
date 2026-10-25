/** 等级 / 对战难度 / 记忆之环 相关的纯计算 */

export const REWARD_BASE = 10;
export const EFFECT_DOUBLING_FROM = 5;
export const DIFFICULTY_REDUCE_MIN_LEVEL = 6;

/** 升到下一级所需的累计胜场：1、2、4、8、16、32… */
export function winsForLevel(level: number): number {
  if (level <= 1) return 1;
  return 2 ** (level - 1);
}

export function levelFromWins(wins: number): number {
  if (wins <= 0) return 1;
  return Math.floor(Math.log2(wins)) + 2;
}

export function effectiveDifficulty(level: number, reduced: boolean): number {
  if (level >= DIFFICULTY_REDUCE_MIN_LEVEL && reduced) return level - 1;
  return level;
}

/** 难度 1/2/3 分别 3/4/6 张，之后 7–10 张随机 */
export function enemyDeckSize(difficulty: number): number {
  if (difficulty <= 1) return 3;
  if (difficulty === 2) return 4;
  if (difficulty === 3) return 6;
  return 7 + Math.floor(Math.random() * 4);
}

/** 难度 5 起，每高 1 级敌方卡牌效果翻倍 */
export function enemyEffectMultiplier(difficulty: number): number {
  if (difficulty < EFFECT_DOUBLING_FROM) return 1;
  return 2 ** (difficulty - EFFECT_DOUBLING_FROM + 1);
}

/** (10 - 我方失去的卡牌数) × 难度 ÷ 2，向下取整 */
export function victoryRings(difficulty: number, lostCards: number): number {
  return Math.max(0, Math.floor(((REWARD_BASE - lostCards) * difficulty) / 2));
}
