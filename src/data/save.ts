import { CARD_DEFS } from './cards';
import { MAX_DECK, MIN_DECK } from '../game/deck';

const STORAGE_KEY = 'ocard.save.v2';

export interface SaveData {
  version: 2;
  initiated: boolean;
  owned: string[];
  rings: number;
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
  rings: 10,
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

  return {
    ...DEFAULT_SAVE,
    ...parsed,
    initiated: Boolean(parsed.initiated),
    owned,
    rings: Number.isFinite(parsed.rings) ? Math.max(0, Math.floor(parsed.rings!)) : DEFAULT_SAVE.rings,
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
