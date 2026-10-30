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
  {
    id: 'hamuna',
    name: '沐花',
    realm: '天堂',
    title: '麦穗之神',
    lore: '掌管丰收与日常，却被零食和偶像收买的「麦穗之神」。',
    avatar: asset('characters/hamuna.png'),
  },
  {
    id: 'mama',
    name: '妈妈',
    realm: '人界',
    title: '社恐研究员',
    lore: '在「人才俱乐部」工作，因故变成矮小一只的社恐研究员。',
    avatar: asset('characters/mama.png'),
  },
];

/** 对战时优先选择属界相反的角色，避免同界互斗 */
export function getOpponent(characterId: string): CharacterDef {
  const self = getCharacter(characterId);
  return (
    CHARACTERS.find((item) => item.id !== characterId && item.realm !== self.realm) ??
    CHARACTERS.find((item) => item.id !== characterId) ??
    CHARACTERS[0]
  );
}

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
  {
    id: 'yettia-whisper',
    art: asset('cards/yettia-whisper.jpg'),
    name: '密语',
    character: 'yettia',
    realm: '地狱',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'reliveAlly', turns: 2 },
    lore: '两人的秘密总是藏不住，因为有第三个人在窃听。',
  },
  {
    id: 'yettia-light',
    art: asset('cards/yettia-light.jpg'),
    name: '光',
    character: 'yettia',
    realm: '地狱',
    type: '进攻牌',
    power: 4,
    rarity: 'SR',
    lore: '愿荣耀的逝者终获安息。',
  },

  // 沐花：麦穗之神
  {
    id: 'hamuna-sacred',
    art: asset('cards/hamuna-sacred.jpg'),
    name: '可是沐花觉得很神圣欸（x',
    character: 'hamuna',
    realm: '天堂',
    type: '防守牌',
    power: 2,
    rarity: 'N',
    lore: '因为喜欢露露纱，沐花的家里挂满了周边。',
  },
  {
    id: 'hamuna-harvest',
    art: asset('cards/hamuna-harvest.jpg'),
    name: '我的天呐，花大人！',
    character: 'hamuna',
    realm: '天堂',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'heal', amount: 1 },
    lore: '相信沐花，今年一定会是大丰收哦！',
  },
  {
    id: 'hamuna-electric',
    art: asset('cards/hamuna-electric.jpg'),
    name: '这得挨不少电，女士',
    character: 'hamuna',
    realm: '天堂',
    type: '防守牌',
    power: 3,
    rarity: 'N',
    lore: '感觉她很可怜，所以顺便把幼小的她留下了。',
  },
  {
    id: 'hamuna-offline',
    art: asset('cards/hamuna-offline.jpg'),
    name: '线下真实',
    character: 'hamuna',
    realm: '天堂',
    type: '进攻牌',
    power: 2,
    rarity: 'N',
    lore: '去见了露露纱本人！现实中的她也很卡哇伊OVO',
  },
  {
    id: 'hamuna-sea',
    art: asset('cards/hamuna-sea.jpg'),
    name: '放了整片大海',
    character: 'hamuna',
    realm: '天堂',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'reliveAlly', turns: 2 },
    lore: '为了让她们两个出风头，沐花就放啦一点水ww',
  },
  {
    id: 'hamuna-loli',
    art: asset('cards/hamuna-loli.jpg'),
    name: '合法萝莉',
    character: 'hamuna',
    realm: '天堂',
    type: '防守牌',
    power: 4,
    rarity: 'SR',
    lore: '300岁的沐花，什嘛世面都见过啦！',
  },
  {
    id: 'hamuna-snack',
    art: asset('cards/hamuna-snack.jpg'),
    name: '吃不完这里的零食，沐花就不走啦！',
    character: 'hamuna',
    realm: '天堂',
    type: '进攻牌',
    power: 3,
    rarity: 'R',
    lore: '再来一份！生命的价值就在于好吃哒~',
  },

  // 妈妈：人才俱乐部研究员
  {
    id: 'mama-listen',
    art: asset('cards/mama-listen.jpg'),
    name: '听妈妈的话',
    character: 'mama',
    realm: '人界',
    type: '物品牌',
    power: 1,
    rarity: 'N',
    effect: { kind: 'heal', amount: 1 },
    lore: '要好好吃饭哦，来，张嘴——',
  },
  {
    id: 'mama-friend',
    art: asset('cards/mama-friend.jpg'),
    name: '我们不可以成为朋友，不行不行',
    character: 'mama',
    realm: '人界',
    type: '防守牌',
    power: 3,
    rarity: 'N',
    lore: '『网恋』不能奔现aaa',
  },
  {
    id: 'mama-super',
    art: asset('cards/mama-super.jpg'),
    name: '私是超人才哒！',
    character: 'mama',
    realm: '人界',
    type: '进攻牌',
    power: 2,
    rarity: 'N',
    lore: '为和平作出贡献，是一件很有意义的事情。',
  },
  {
    id: 'mama-masterpiece',
    art: asset('cards/mama-masterpiece.jpg'),
    name: '最伟大的作品',
    character: 'mama',
    realm: '人界',
    type: '物品牌',
    power: 1,
    rarity: 'R',
    effect: { kind: 'reliveAlly', turns: 2 },
    lore: '将过去的经验与对未来的期许融合，那就是最伟大的作品。',
  },
  {
    id: 'mama-talent',
    art: asset('cards/mama-talent.jpg'),
    name: '天赋萝',
    character: 'mama',
    realm: '人界',
    type: '防守牌',
    power: 4,
    rarity: 'R',
    lore: '虽然别人会用特异的眼光，但我也愿探索「规则」之外的世界。',
  },
  {
    id: 'mama-study',
    art: asset('cards/mama-study.jpg'),
    name: '与你相约到学海尽头',
    character: 'mama',
    realm: '人界',
    type: '进攻牌',
    power: 3,
    rarity: 'R',
    lore: '想你的风还是吹到了人才俱乐部。',
  },
  {
    id: 'mama-blue',
    art: asset('cards/mama-blue.jpg'),
    name: '湛蓝依旧',
    character: 'mama',
    realm: '人界',
    type: '进攻牌',
    power: 4,
    rarity: 'SR',
    lore: '一步，五十步，百步，青春依旧，步履不息。',
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
