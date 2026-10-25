import type { Realm } from '../game/types';

export interface TutorialLine {
  speaker: string;
  text: string;
  narration?: boolean;
}

export type TutorialPhase =
  | 'intro'
  | 'play'
  | 'attack1'
  | 'attack2'
  | 'end-turn'
  | 'enemy'
  | 'last-attack'
  | 'victory'
  | 'done';

export interface TutorialScript {
  enemyRealm: Realm;
  enemyLabel: string;
  attackCardId: string;
  attackCardName: string;
  handCardIds: string[];
  intro: TutorialLine[];
  afterPlay: TutorialLine[];
  afterFirstAttack: TutorialLine[];
  afterSecondAttack: TutorialLine[];
  enemyTurn: TutorialLine[];
  afterEnemy: TutorialLine[];
  victory: TutorialLine[];
}

export const TUTORIAL_SCRIPTS: Record<string, TutorialScript> = {
  musia: {
    enemyRealm: '地狱',
    enemyLabel: '地狱幻影',
    attackCardId: 'musia-wing',
    attackCardName: '羽翼',
    handCardIds: ['musia-wing', 'musia-smile', 'musia-trust'],
    intro: [
      { speaker: '旁白', text: '「长襟钟楼」的指针，又停在了 22:22。', narration: true },
      { speaker: '沐纱', text: '你选择了我……那，在回到日常之前，先陪我做一个梦吧。' },
      { speaker: '沐纱', text: '这是很久以前的事。「天堂」和「地狱」还没有和解的时候。' },
      { speaker: '沐纱', text: '看，地狱的幻影攻过来了！' },
    ],
    afterPlay: [
      { speaker: '沐纱', text: '卡牌右上角是「生力」，左下角是「牌型」。' },
      { speaker: '沐纱', text: '进攻牌可以攻击敌方的卡牌。防守牌和物品牌，之后的对局里也会遇到。' },
    ],
    afterFirstAttack: [
      { speaker: '沐纱', text: '拖过去就可以攻击了。每次攻击消耗 1 点行动值。' },
      { speaker: '沐纱', text: '伤害等于这张牌的生力值。' },
    ],
    afterSecondAttack: [
      { speaker: '沐纱', text: '行动值用完了……点击中间的 ⊙心，结束回合吧。' },
      { speaker: '沐纱', text: '没关系的，剩下的交给时间。' },
    ],
    enemyTurn: [
      { speaker: '旁白', text: '幻影反击了。', narration: true },
      { speaker: '沐纱', text: '敌方的进攻牌也会削减我方卡牌的生力。生力归零，卡牌就会消失。' },
    ],
    afterEnemy: [
      { speaker: '沐纱', text: '新的回合开始了。行动值每回合都会恢复 1 点。' },
      { speaker: '沐纱', text: '最后一击，拜托你了。' },
    ],
    victory: [
      { speaker: '旁白', text: '最后一个幻影消散了。', narration: true },
      { speaker: '沐纱', text: '……谢谢你。梦到这里，就该醒了。' },
    ],
  },
  yettia: {
    enemyRealm: '天堂',
    enemyLabel: '天堂审判者',
    attackCardId: 'yettia-moon',
    attackCardName: '月',
    handCardIds: ['yettia-moon', 'yettia-eaves', 'yettia-cake'],
    intro: [
      { speaker: '旁白', text: '「长襟钟楼」的指针，又停在了 22:22。', narration: true },
      { speaker: '夜棠', text: '哼，选了本小姐？那就让你见识一下「月之魔王」的厉害。' },
      { speaker: '夜棠', text: '这是过去的幻影——天堂那群家伙打过来了。' },
      { speaker: '夜棠', text: '别发呆，迎战！' },
    ],
    afterPlay: [
      { speaker: '夜棠', text: '卡牌右上角是「生力」，左下角是「牌型」。' },
      { speaker: '夜棠', text: '进攻牌才能攻击。防守牌和物品牌，之后你自己慢慢体会。' },
    ],
    afterFirstAttack: [
      { speaker: '夜棠', text: '攻击消耗 1 点行动值，伤害就是生力值。' },
      { speaker: '夜棠', text: '……看什么？本小姐的说明很难得吧。' },
    ],
    afterSecondAttack: [
      { speaker: '夜棠', text: '行动值见底了。点中间的 ⊙心，结束回合。' },
    ],
    enemyTurn: [
      { speaker: '旁白', text: '审判者的幻影反击了。', narration: true },
      { speaker: '夜棠', text: '敌方也会削减你的生力。生力归零，卡牌就没了。' },
    ],
    afterEnemy: [
      { speaker: '夜棠', text: '新回合，行动值恢复 1 点。' },
      { speaker: '夜棠', text: '最后一击。别拖本小姐的后腿。' },
    ],
    victory: [
      { speaker: '旁白', text: '最后的审判者幻影消散了。', narration: true },
      { speaker: '夜棠', text: '……喂。梦该醒了。' },
    ],
  },
};
