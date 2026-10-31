/** 卡牌「光辉」：首次获得为 0，每次重复获得提升 1 重，上限 3 重。 */
export const MAX_GLORY = 3;

/** 每重光辉让生力值增加基础值的 25%。 */
export const GLORY_POWER_STEP = 0.25;

/** 5 枚「满溢之辉」可补足 / 兑换 1 枚「记忆之环」 */
export const OVERFLOW_PER_RING = 5;

/** 首页看板最多可设置的卡牌数。 */
export const BOARD_CARD_LIMIT = 3;

/** 卡牌可被设置为看板的最低光辉（光辉 1 解锁看板展示）。 */
export const BOARD_MIN_GLORY = 1;

export type GloryMap = Record<string, number>;

export function clampGlory(value: unknown): number {
  const level = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(MAX_GLORY, Math.floor(level)));
}

/** 按光辉换算后的生力值：基础值 + 基础值 × 0.25 × 光辉。 */
export function poweredPower(base: number, glory: number): number {
  const scaled = base * (1 + GLORY_POWER_STEP * clampGlory(glory));
  return Number(scaled.toFixed(2));
}
