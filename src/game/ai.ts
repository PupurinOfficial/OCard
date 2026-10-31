import { getCardDef } from '../data/cards';
import { COST_ACTION, COST_PLAY_CARD, computeDamage, guardPower } from './engine';
import type { BattleAction, BattleState, CardInstance } from './types';

/** 规则型 AI：能攻击就攻击，否则出牌（防守牌优先附到己方卡牌上），都不行则结束回合。 */
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
      const remainA = a.power + guardPower(a) - computeDamage(attacker, a);
      const remainB = b.power + guardPower(b) - computeDamage(attacker, b);
      return remainA - remainB;
    })[0];
    return { type: 'ATTACK', attackerUid: attacker.uid, targetUid: target.uid };
  }

  if (me.action >= COST_PLAY_CARD && me.hand.length > 0) {
    const emptySlot = me.field.findIndex((card) => card === null);
    const occupied = me.field
      .map((card, slot) => ({ card, slot }))
      .filter((item): item is { card: CardInstance; slot: number } => item.card !== null);
    const handByType = (type: string) => me.hand.find((card) => getCardDef(card.defId).type === type);

    // 物品牌 / 进攻牌优先上场，保证 AI 的进攻节奏
    const item = handByType('物品牌');
    if (item && emptySlot >= 0) {
      return { type: 'PLAY_CARD', uid: item.uid, slot: emptySlot };
    }
    const attackerInHand = handByType('进攻牌');
    if (attackerInHand && emptySlot >= 0) {
      return { type: 'PLAY_CARD', uid: attackerInHand.uid, slot: emptySlot };
    }

    // 没有更好的上场选择时，防守牌附到己方进攻牌 / 生力最高的卡牌上作为护盾
    const guardCard = handByType('防守牌');
    if (guardCard && occupied.length > 0) {
      const host = [...occupied].sort((a, b) => {
        const attackA = getCardDef(a.card.defId).type === '进攻牌' ? 1 : 0;
        const attackB = getCardDef(b.card.defId).type === '进攻牌' ? 1 : 0;
        if (attackA !== attackB) return attackB - attackA;
        return b.card.power + guardPower(b.card) - (a.card.power + guardPower(a.card));
      })[0];
      return { type: 'PLAY_CARD', uid: guardCard.uid, slot: host.slot };
    }

    if (emptySlot >= 0) {
      return { type: 'PLAY_CARD', uid: me.hand[0].uid, slot: emptySlot };
    }
  }

  return { type: 'END_TURN' };
}
