export type Realm = '人界' | '天堂' | '地狱';

export type CardType = '进攻牌' | '防守牌' | '物品牌';

export type Side = 'player' | 'enemy';

export type Rarity = 'N' | 'R' | 'SR';

export type CardEffect =
  | { kind: 'heal'; amount: number }
  | { kind: 'gainAction'; amount: number }
  | { kind: 'reliveAlly'; turns: number }
  | { kind: 'reliveEnemy'; turns: number };

export interface CardDef {
  id: string;
  name: string;
  character: string;
  realm: Realm;
  type: CardType;
  power: number;
  rarity: Rarity;
  effect?: CardEffect;
  lore: string;
  /** 卡面插画；尚未绘制卡面的角色可省略，由 UI 渲染占位卡面 */
  art?: string;
}

export interface ReliveState {
  realm: Realm;
  turnsLeft: number;
}

export interface CardInstance {
  uid: string;
  defId: string;
  power: number;
  maxPower: number;
  relive?: ReliveState;
}

export interface PlayerState {
  hand: CardInstance[];
  field: (CardInstance | null)[];
  action: number;
}

export interface DomainState {
  realm: Realm;
  owner: Side;
  turnsLeft: number;
}

export interface BattleState {
  player: PlayerState;
  enemy: PlayerState;
  turn: Side;
  round: number;
  domain: DomainState | null;
  attackCounts: Record<Realm, number>;
  winner: Side | null;
  /** 敌方卡牌使用效果的倍率（难度 5 起翻倍） */
  enemyEffectMultiplier: number;
}

export type BattleAction =
  | { type: 'PLAY_CARD'; uid: string; slot: number }
  | { type: 'ATTACK'; attackerUid: string; targetUid: string }
  | { type: 'BREAK_DOMAIN'; attackerUid: string }
  | { type: 'END_TURN' }
  | { type: 'RESTART'; playerDeck: string[]; enemyDeck: string[]; enemyEffectMultiplier: number };

export interface CharacterDef {
  id: string;
  name: string;
  realm: Realm;
  title: string;
  lore: string;
  avatar: string;
}
