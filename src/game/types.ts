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

/** 附在我方上场卡牌上的防守牌（护盾），被攻击时优先扣除其生力 */
export interface GuardInstance {
  uid: string;
  defId: string;
  power: number;
  maxPower: number;
  glory?: number;
}

export interface CardInstance {
  uid: string;
  defId: string;
  power: number;
  maxPower: number;
  /** 卡牌的光辉等级（0–3），仅用于展示与生力计算 */
  glory?: number;
  relive?: ReliveState;
  /** 附在这张卡牌上的防守牌 */
  guards?: GuardInstance[];
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
  | {
      type: 'RESTART';
      playerDeck: string[];
      enemyDeck: string[];
      enemyEffectMultiplier: number;
      playerGlory?: Record<string, number>;
    };

export interface CharacterDef {
  id: string;
  name: string;
  realm: Realm;
  title: string;
  lore: string;
  avatar: string;
  /** 角色应援色：光辉 2 起的卡牌边框与标识、光辉 3 的卡名与碎片使用 */
  color: string;
}
