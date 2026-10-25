import { getCardDef } from '../data/cards';
import { COST_ACTION, COST_PLAY_CARD, computeDamage } from './engine';
import type { BattleAction, BattleState, CardInstance } from './types';

/** 规则型 AI：能攻击就攻击，否则出牌，都不行则结束回合。 */
export function chooseAiAction(state: BattleState): BattleAction {
  if (state.winner || state.turn !== 'enemy') return { type: 'END_TURN' };

  const me = state.enemy;
  const foe = state.player;
  const domainRealm = state.domain?.realm;

  const attackers = me.field.filter((card): card is CardInstance => {
    if (!card) return false;
    const def = getCardDef(card.defId);
    if (def.type !== '进攻牌') return false;
    if (domainRealm && def.realm !== domainRealm) return false;
    return true;
  });
  const targets = foe.field.filter((card): card is CardInstance => card !== null);

  if (me.action >= COST_ACTION && attackers.length > 0 && targets.length > 0) {
    const attacker = attackers[0];
    const target = [...targets].sort((a, b) => {
      const remainA = a.power - computeDamage(attacker, a);
      const remainB = b.power - computeDamage(attacker, b);
      return remainA - remainB;
    })[0];
    return { type: 'ATTACK', attackerUid: attacker.uid, targetUid: target.uid };
  }

  if (me.action >= COST_PLAY_CARD && me.hand.length > 0) {
    const slot = me.field.findIndex((card) => card === null);
    if (slot >= 0) {
      const item = me.hand.find((card) => getCardDef(card.defId).type === '物品牌');
      const card = item ?? me.hand[0];
      return { type: 'PLAY_CARD', uid: card.uid, slot };
    }
  }

  return { type: 'END_TURN' };
}
