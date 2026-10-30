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
  hamuna: {
    enemyRealm: '地狱',
    enemyLabel: '地狱幻影',
    attackCardId: 'hamuna-offline',
    attackCardName: '线下真实',
    handCardIds: ['hamuna-offline', 'hamuna-harvest', 'hamuna-sacred'],
    intro: [
      { speaker: '旁白', text: '「长襟钟楼」的指针，又停在了 22:22。', narration: true },
      { speaker: '沐花', text: '唔——你选了我呀？那沐花先带你做一个梦捏。' },
      { speaker: '沐花', text: '这是很久以前，天堂和地狱还在吵架的时候。' },
      { speaker: '沐花', text: '看，地狱的幻影打过来了！' },
    ],
    afterPlay: [
      { speaker: '沐花', text: '卡牌右上角是「生力」，左下角是「牌型」捏。' },
      { speaker: '沐花', text: '进攻牌可以攻击。防守牌和物品牌，以后慢慢学就好啦。' },
    ],
    afterFirstAttack: [
      { speaker: '沐花', text: '拖过去就能攻击，每次消耗 1 点行动值。' },
      { speaker: '沐花', text: '伤害就是这张牌的生力值哦。' },
    ],
    afterSecondAttack: [
      { speaker: '沐花', text: '行动值用完啦。点中间的 ⊙心，结束回合捏。' },
      { speaker: '沐花', text: '没关系，沐花在呢。' },
    ],
    enemyTurn: [
      { speaker: '旁白', text: '幻影反击了。', narration: true },
      { speaker: '沐花', text: '敌方的进攻牌会削减生力。归零的话，卡牌就消失啦。' },
    ],
    afterEnemy: [
      { speaker: '沐花', text: '新回合开始，行动值恢复 1 点。' },
      { speaker: '沐花', text: '最后一击，交给孩子们啦！' },
    ],
    victory: [
      { speaker: '旁白', text: '最后一个幻影消散了。', narration: true },
      { speaker: '沐花', text: '梦到这里就结束啦。醒过来以后，要好好吃饭捏。' },
    ],
  },
  mama: {
    enemyRealm: '天堂',
    enemyLabel: '天堂审判者',
    attackCardId: 'mama-super',
    attackCardName: '私是超人才哒！',
    handCardIds: ['mama-super', 'mama-listen', 'mama-friend'],
    intro: [
      { speaker: '旁白', text: '「长襟钟楼」的指针，又停在了 22:22。', narration: true },
      { speaker: '妈妈', text: '诶？你、你选了我……那、那就先做个梦吧。' },
      { speaker: '妈妈', text: '人才俱乐部还乱糟糟的时候……天堂的审判者来了。' },
      { speaker: '妈妈', text: '我帮你搞定啦，别问太多~' },
    ],
    afterPlay: [
      { speaker: '妈妈', text: '右上角是「生力」，左下角是「牌型」。' },
      { speaker: '妈妈', text: '进攻牌才能攻击，别、别记错了。' },
    ],
    afterFirstAttack: [
      { speaker: '妈妈', text: '攻击消耗 1 点行动值，伤害等于生力值。' },
      { speaker: '妈妈', text: '……我居然在教人打牌。' },
    ],
    afterSecondAttack: [
      { speaker: '妈妈', text: '行动值没了。点中间的 ⊙心，结束回合。' },
    ],
    enemyTurn: [
      { speaker: '旁白', text: '审判者的幻影反击了。', narration: true },
      { speaker: '妈妈', text: '敌方也会削生力。归零的话，卡牌就没了。' },
    ],
    afterEnemy: [
      { speaker: '妈妈', text: '新回合，行动值恢复 1 点。' },
      { speaker: '妈妈', text: '最后一下，麻烦你了。' },
    ],
    victory: [
      { speaker: '旁白', text: '最后的审判者幻影消散了。', narration: true },
      { speaker: '妈妈', text: '……呼。梦醒了。刚才的事，别、别问太多。' },
    ],
  },
};
