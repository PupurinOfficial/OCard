import type { CardDef, CharacterDef, Realm } from '../game/types';

export const REALM_COLORS: Record<Realm, string> = {
  天堂: '#ADD8E6',
  地狱: '#BA55D3',
  人界: '#00008B',
};

// GitHub Pages 子路径部署时，静态资源必须相对 base 解析
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'musia',
    name: '沐纱',
    realm: '天堂',
    title: '流浪的天使',
    lore: '遭「天堂」排挤，在「人界」流浪的「天使」。',
    avatar: asset('characters/musia.png'),
  },
  {
    id: 'yettia',
    name: '夜棠',
    realm: '地狱',
    title: '守护的魔女',
    lore: '假装监视，实则守护的「魔女」。',
    avatar: asset('characters/yettia.png'),
  },
];

/**
 * 网页版卡牌数值目前为占位值，等待正式数值表替换。
 * 牌型 / 生力值 / 特效均集中在这里，改数值不需要动规则代码。
 */
export const CARD_DEFS: CardDef[] = [
  {
    id: 'musia-wander',
    art: asset('cards/musia-wander.jpg'),
    name: '流浪',
    character: 'musia',
    realm: '天堂',
    type: '防守牌',
    power: 3,
    rarity: 'N',
    lore: '我曾被天使们排挤，在「人界」流浪…',
  },
  {
    id: 'musia-trust',
    art: asset('cards/musia-trust.jpg'),
    name: '信任',
    character: 'musia',
    realm: '天堂',
    type: '物品牌',
    power: 2,
    rarity: 'R',
    effect: { kind: 'heal', amount: 1 },
    lore: '我曾遇见一位好心人，TA给了我「信任」…',
  },
  {
    id: 'musia-smile',
    art: asset('cards/musia-smile.jpg'),
    name: '笑脸',
    character: 'musia',
    realm: '天堂',
    type: '防守牌',
    power: 2,
    rarity: 'N',
    lore: '我曾给人以「笑脸」，来顺应他人的『真言』…',
  },
  {
    id: 'musia-flower',
    art: asset('cards/musia-flower.jpg'),
    name: '花',
    character: 'musia',
    realm: '天堂',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'reliveAlly', turns: 2 },
    lore: '我曾遇见一位「神明」，她教我如何长大…',
  },
  {
    id: 'musia-pure',
    art: asset('cards/musia-pure.jpg'),
    name: '单纯',
    character: 'musia',
    realm: '天堂',
    type: '防守牌',
    power: 4,
    rarity: 'R',
    lore: '我曾以「无知」伤人，却被安慰以『单纯』…',
  },
  {
    id: 'musia-wing',
    art: asset('cards/musia-wing.jpg'),
    name: '羽翼',
    character: 'musia',
    realm: '天堂',
    type: '进攻牌',
    power: 2,
    rarity: 'N',
    lore: '沐浴朝阳 若能与你一道改变世界…',
  },
  {
    id: 'musia-broom',
    art: asset('cards/musia-broom.jpg'),
    name: '扫帚',
    character: 'musia',
    realm: '天堂',
    type: '进攻牌',
    power: 3,
    rarity: 'N',
    lore: '凝聚散沙 未来，我们将一同前行！',
  },
  {
    id: 'yettia-eaves',
    art: asset('cards/yettia-eaves.jpg'),
    name: '屋檐',
    character: 'yettia',
    realm: '地狱',
    type: '防守牌',
    power: 3,
    rarity: 'N',
    lore: '监视她的地方。',
  },
  {
    id: 'yettia-deceive',
    art: asset('cards/yettia-deceive.jpg'),
    name: '欺骗',
    character: 'yettia',
    realm: '地狱',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'reliveEnemy', turns: 2 },
    lore: '为了更好地保护她。',
  },
  {
    id: 'yettia-cake',
    art: asset('cards/yettia-cake.jpg'),
    name: '蛋糕',
    character: 'yettia',
    realm: '地狱',
    type: '物品牌',
    power: 2,
    rarity: 'R',
    effect: { kind: 'gainAction', amount: 1 },
    lore: '好吃…才没有呢！',
  },
  {
    id: 'yettia-moon',
    art: asset('cards/yettia-moon.jpg'),
    name: '月',
    character: 'yettia',
    realm: '地狱',
    type: '进攻牌',
    power: 2,
    rarity: 'N',
    lore: '师傅，亦为朋友。',
  },
  {
    id: 'yettia-door',
    art: asset('cards/yettia-door.jpg'),
    name: '门扉',
    character: 'yettia',
    realm: '地狱',
    type: '进攻牌',
    power: 3,
    rarity: 'R',
    lore: '迈入不可能。',
  },
];

const DEF_MAP = new Map(CARD_DEFS.map((def) => [def.id, def]));

export function getCardDef(id: string): CardDef {
  const def = DEF_MAP.get(id);
  if (!def) throw new Error(`未知卡牌: ${id}`);
  return def;
}

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function cardsOfCharacter(characterId: string): CardDef[] {
  return CARD_DEFS.filter((def) => def.character === characterId);
}

export function effectText(def: CardDef): string | null {
  const effect = def.effect;
  if (!effect) return null;
  switch (effect.kind) {
    case 'heal':
      return `使用：回复一名友方 ${effect.amount} 点生力`;
    case 'gainAction':
      return `使用：回复自身 ${effect.amount} 点行动值`;
    case 'reliveAlly':
      return `使用：使一名友方获得${def.realm}赋生 ${effect.turns} 回合`;
    case 'reliveEnemy':
      return `使用：使一名敌方获得${def.realm}赋生 ${effect.turns} 回合`;
  }
}
