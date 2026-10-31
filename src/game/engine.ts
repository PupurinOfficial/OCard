import { getCardDef } from '../data/cards';
import { clampGlory, poweredPower } from './glory';
import type {
  BattleAction,
  BattleState,
  CardInstance,
  PlayerState,
  Realm,
  Side,
} from './types';

export const SLOT_COUNT = 4;
export const MAX_ACTION = 5;
export const COST_PLAY_CARD = 2;
export const COST_ACTION = 1;

const START_ACTION = 1;
const DOMAIN_TURNS = 2;
const DOMAIN_ATTACK_THRESHOLD = 2;

let uidSeed = 0;

const emptyField = (): (CardInstance | null)[] => Array.from({ length: SLOT_COUNT }, () => null);

const emptyCounts = (): Record<Realm, number> => ({ 人界: 0, 天堂: 0, 地狱: 0 });

const otherSide = (side: Side): Side => (side === 'player' ? 'enemy' : 'player');

const shuffle = <T,>(input: T[]): T[] => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const makeCard = (defId: string, glory = 0): CardInstance => {
  const def = getCardDef(defId);
  const level = clampGlory(glory);
  const power = poweredPower(def.power, level);
  uidSeed += 1;
  return {
    uid: `${defId}#${uidSeed}`,
    defId,
    power,
    maxPower: power,
    glory: level,
  };
};

export function totalCards(player: PlayerState): number {
  let count = player.hand.length;
  for (const card of player.field) {
    if (!card) continue;
    count += 1 + (card.guards?.length ?? 0);
  }
  return count;
}

/** 一张上场卡牌附着的全部护盾生力之和 */
export function guardPower(card: CardInstance): number {
  return (card.guards ?? []).reduce((sum, guard) => sum + guard.power, 0);
}

export function computeDamage(attacker: CardInstance, target: CardInstance): number {
  const def = getCardDef(attacker.defId);
  const doubled = target.relive !== undefined && target.relive.realm === def.realm;
  return doubled ? attacker.power * 2 : attacker.power;
}

export function createBattle(
  playerDeck: string[],
  enemyDeck: string[],
  enemyEffectMultiplier = 1,
  playerGlory: Record<string, number> = {},
): BattleState {
  const state: BattleState = {
    player: {
      hand: shuffle(playerDeck).map((defId) => makeCard(defId, playerGlory[defId] ?? 0)),
      field: emptyField(),
      action: START_ACTION,
    },
    enemy: {
      hand: shuffle(enemyDeck).map((defId) => makeCard(defId)),
      field: emptyField(),
      action: START_ACTION,
    },
    turn: 'player',
    round: 1,
    domain: null,
    attackCounts: emptyCounts(),
    winner: null,
    enemyEffectMultiplier,
  };
  startTurn(state, 'player');
  return state;
}

function startTurn(state: BattleState, side: Side): void {
  state.turn = side;
  state.attackCounts = emptyCounts();
  const player = state[side];
  player.action = Math.min(MAX_ACTION, player.action + 1);

  // 赋生按“持有者的回合”计时
  for (const card of player.field) {
    if (!card?.relive) continue;
    card.relive.turnsLeft -= 1;
    if (card.relive.turnsLeft <= 0) card.relive = undefined;
  }

  // 领域按“触发者的回合”计时
  if (state.domain && state.domain.owner === side) {
    state.domain.turnsLeft -= 1;
    if (state.domain.turnsLeft <= 0) state.domain = null;
  }
}

function endTurn(state: BattleState): BattleState {
  if (state.winner) return state;
  const next = otherSide(state.turn);
  if (next === 'player') state.round += 1;
  startTurn(state, next);
  return state;
}

function checkWinner(state: BattleState): void {
  if (state.winner) return;
  if (totalCards(state.player) === 0) state.winner = 'enemy';
  else if (totalCards(state.enemy) === 0) state.winner = 'player';
}

function applyPlayEffect(state: BattleState, side: Side, card: CardInstance): void {
  const def = getCardDef(card.defId);
  const effect = def.effect;
  if (!effect) return;

  const scale = side === 'enemy' ? state.enemyEffectMultiplier : 1;
  const amount = (value: number) => value * scale;
  const self = state[side];
  const foe = state[otherSide(side)];
  const randomFieldCard = (cards: (CardInstance | null)[]): CardInstance | null => {
    const list = cards.filter((item): item is CardInstance => item !== null);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  };

  switch (effect.kind) {
    case 'heal': {
      const wounded = self.field
        .filter((item): item is CardInstance => item !== null && item.power < item.maxPower)
        .sort((a, b) => a.power - b.power);
      if (wounded[0]) {
        wounded[0].power = Math.min(wounded[0].maxPower, wounded[0].power + amount(effect.amount));
      }
      break;
    }
    case 'gainAction': {
      self.action = Math.min(MAX_ACTION, self.action + amount(effect.amount));
      break;
    }
    case 'reliveAlly': {
      const target = randomFieldCard(self.field);
      if (target) target.relive = { realm: def.realm, turnsLeft: amount(effect.turns) };
      break;
    }
    case 'reliveEnemy': {
      const target = randomFieldCard(foe.field);
      if (target) target.relive = { realm: def.realm, turnsLeft: amount(effect.turns) };
      break;
    }
  }
}

function playCard(state: BattleState, uid: string, slot: number): BattleState {
  if (state.winner) return state;
  const side = state.turn;
  const player = state[side];
  if (player.action < COST_PLAY_CARD) return state;
  if (slot < 0 || slot >= SLOT_COUNT) return state;

  const handIndex = player.hand.findIndex((card) => card.uid === uid);
  if (handIndex < 0) return state;

  const card = player.hand[handIndex];
  const def = getCardDef(card.defId);
  const occupant = player.field[slot];

  // 防守牌：放在已有卡牌上时，缩小成为它的护盾
  if (def.type === '防守牌' && occupant) {
    player.hand.splice(handIndex, 1);
    occupant.guards = [
      ...(occupant.guards ?? []),
      {
        uid: card.uid,
        defId: card.defId,
        power: card.power,
        maxPower: card.maxPower,
        glory: card.glory,
      },
    ];
    player.action -= COST_PLAY_CARD;
    return state;
  }

  if (occupant) return state;

  player.hand.splice(handIndex, 1);
  player.field[slot] = card;
  player.action -= COST_PLAY_CARD;
  applyPlayEffect(state, side, card);
  return state;
}

function attackCard(state: BattleState, attackerUid: string, targetUid: string): BattleState {
  if (state.winner) return state;
  const side = state.turn;
  const player = state[side];
  const foe = state[otherSide(side)];
  if (player.action < COST_ACTION) return state;

  const attacker = player.field.find((card) => card?.uid === attackerUid);
  if (!attacker) return state;
  const attackerDef = getCardDef(attacker.defId);
  if (attackerDef.type !== '进攻牌') return state;
  if (state.domain && attackerDef.realm !== state.domain.realm) return state;

  const targetIndex = foe.field.findIndex((card) => card?.uid === targetUid);
  const target = foe.field[targetIndex];
  if (!target) return state;

  const damage = computeDamage(attacker, target);
  let remaining = damage;

  // 优先扣除附着的防守牌生力，溢出的伤害才会落到卡牌本身
  const guards = target.guards ?? [];
  while (remaining > 0 && guards.length > 0) {
    const guard = guards[guards.length - 1];
    const absorbed = Math.min(guard.power, remaining);
    guard.power -= absorbed;
    remaining -= absorbed;
    if (guard.power <= 0) guards.pop();
  }
  if (target.guards && target.guards.length === 0) target.guards = undefined;

  if (remaining > 0) target.power -= remaining;
  player.action -= COST_ACTION;
  state.attackCounts[attackerDef.realm] += 1;

  if (!state.domain && state.attackCounts[attackerDef.realm] >= DOMAIN_ATTACK_THRESHOLD) {
    state.domain = { realm: attackerDef.realm, owner: side, turnsLeft: DOMAIN_TURNS };
  }

  if (target.power <= 0) foe.field[targetIndex] = null;
  checkWinner(state);
  return state;
}

function breakDomain(state: BattleState, attackerUid: string): BattleState {
  if (state.winner || !state.domain) return state;
  const player = state[state.turn];
  if (player.action < COST_ACTION) return state;

  const attacker = player.field.find((card) => card?.uid === attackerUid);
  if (!attacker) return state;
  const def = getCardDef(attacker.defId);
  if (def.type !== '进攻牌') return state;
  if (def.realm === state.domain.realm) return state;

  player.action -= COST_ACTION;
  state.domain = null;
  // 防止击碎领域后同回合立刻重新触发
  state.attackCounts = emptyCounts();
  return state;
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  const next = structuredClone(state);
  switch (action.type) {
    case 'PLAY_CARD':
      return playCard(next, action.uid, action.slot);
    case 'ATTACK':
      return attackCard(next, action.attackerUid, action.targetUid);
    case 'BREAK_DOMAIN':
      return breakDomain(next, action.attackerUid);
    case 'END_TURN':
      return endTurn(next);
    case 'RESTART':
      return createBattle(
        action.playerDeck,
        action.enemyDeck,
        action.enemyEffectMultiplier,
        action.playerGlory,
      );
  }
}

export function findFieldCard(
  player: PlayerState,
  uid: string,
): { card: CardInstance; index: number } | null {
  const index = player.field.findIndex((card) => card?.uid === uid);
  if (index < 0) return null;
  const card = player.field[index];
  return card ? { card, index } : null;
}
