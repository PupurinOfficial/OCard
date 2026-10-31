import { CARD_DEFS } from './cards';
import { MAX_DECK, MIN_DECK } from '../game/deck';
import { BOARD_CARD_LIMIT, BOARD_MIN_GLORY, clampGlory } from '../game/glory';
import type { GloryMap } from '../game/glory';

const STORAGE_KEY = 'ocard.save.v2';

export interface SaveData {
  version: 2;
  initiated: boolean;
  owned: string[];
  /** 每张卡牌的光辉等级（0–3），未记录的卡视为 0 */
  glory: GloryMap;
  /** 首页看板选中的卡牌（最多 3 张，按设置顺序轮换） */
  boardCards: string[];
  rings: number;
  /** 满溢之辉：复现到光辉已满的卡牌时获得，5 枚可补足 1 枚记忆之环 */
  overflow: number;
  wins: number;
  difficultyReduced: boolean;
  tutorialDone: boolean;
  selectedCharacter: string;
  deck: string[];
}

const DEFAULT_SAVE: SaveData = {
  version: 2,
  initiated: false,
  owned: [],
  glory: {},
  boardCards: [],
  rings: 10,
  overflow: 0,
  wins: 0,
  difficultyReduced: false,
  tutorialDone: false,
  selectedCharacter: 'musia',
  deck: [],
};

const KNOWN_IDS = new Set(CARD_DEFS.map((def) => def.id));

function sanitizeDeck(value: unknown, owned: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const ownedSet = new Set(owned);
  const ids = value.filter(
    (id): id is string => typeof id === 'string' && KNOWN_IDS.has(id) && ownedSet.has(id),
  );
  const unique = [...new Set(ids)].slice(0, MAX_DECK);
  return unique.length >= MIN_DECK ? unique : [];
}

function sanitizeGlory(value: unknown): GloryMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: GloryMap = {};
  for (const [id, level] of Object.entries(value as Record<string, unknown>)) {
    if (!KNOWN_IDS.has(id)) continue;
    const clamped = clampGlory(level);
    if (clamped > 0) result[id] = clamped;
  }
  return result;
}

function sanitizeBoardCards(value: unknown, owned: string[], glory: GloryMap): string[] {
  if (!Array.isArray(value)) return [];
  const ownedSet = new Set(owned);
  const ids = value.filter(
    (id): id is string =>
      typeof id === 'string' &&
      KNOWN_IDS.has(id) &&
      ownedSet.has(id) &&
      (glory[id] ?? 0) >= BOARD_MIN_GLORY,
  );
  return [...new Set(ids)].slice(0, BOARD_CARD_LIMIT);
}

export function loadSave(): SaveData {
  let parsed: Partial<SaveData> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw) as Partial<SaveData>;
  } catch {
    parsed = {};
  }

  if (parsed.version !== 2) return { ...DEFAULT_SAVE };

  const owned = Array.isArray(parsed.owned)
    ? parsed.owned.filter((id) => typeof id === 'string' && KNOWN_IDS.has(id))
    : [];
  const glory = sanitizeGlory(parsed.glory);

  return {
    ...DEFAULT_SAVE,
    ...parsed,
    initiated: Boolean(parsed.initiated),
    owned,
    glory,
    boardCards: sanitizeBoardCards(parsed.boardCards, owned, glory),
    rings: Number.isFinite(parsed.rings) ? Math.max(0, Math.floor(parsed.rings!)) : DEFAULT_SAVE.rings,
    overflow: Number.isFinite(parsed.overflow)
      ? Math.max(0, Math.floor(parsed.overflow!))
      : DEFAULT_SAVE.overflow,
    wins: Number.isFinite(parsed.wins) ? Math.max(0, Math.floor(parsed.wins!)) : 0,
    difficultyReduced: Boolean(parsed.difficultyReduced),
    tutorialDone: Boolean(parsed.tutorialDone),
    deck: sanitizeDeck(parsed.deck, owned),
  };
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 隐私模式下 localStorage 可能不可用，原型阶段静默失败即可
  }
}
