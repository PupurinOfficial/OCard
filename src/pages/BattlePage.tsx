import { useEffect, useReducer, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { REALM_COLORS, effectText, getCardDef, getCharacter, getRandomOpponent } from '../data/cards';
import { pickDialogueLine } from '../data/dialogue';
import type { DialogueTrigger } from '../data/dialogue';
import { loadSave, writeSave } from '../data/save';
import { CardView } from '../components/CardView';
import { ActionDots } from '../components/ActionDots';
import { RealmIcon } from '../components/RealmIcon';
import {
  COST_ACTION,
  COST_PLAY_CARD,
  battleReducer,
  computeDamage,
  createBattle,
  guardPower,
  totalCards,
} from '../game/engine';
import { chooseAiAction } from '../game/ai';
import { MAX_DECK, buildEnemyDeck, isValidDeck } from '../game/deck';
import {
  effectiveDifficulty,
  enemyDeckSize,
  enemyEffectMultiplier,
  levelFromWins,
  victoryRings,
} from '../game/progress';
import type { BattleAction, BattleState, CardInstance, Side } from '../game/types';
import './battle.css';

const STAGE_W = 1280;
const STAGE_H = 720;
const SLOT_W = 135;
const CARD_OFFSET = 12.5;
const SLOT_X = [320, 455, 690, 825];
const ENEMY_Y = 70;
const PLAYER_Y = 395;

type DropTarget =
  | { kind: 'slot'; slot: number }
  | { kind: 'enemy'; uid: string }
  | { kind: 'center' };

interface DragState {
  uid: string;
  from: 'hand' | 'field';
  x: number;
  y: number;
  target: DropTarget | null;
}

interface FloatFx {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface VeilFx {
  id: number;
  x: number;
  y: number;
}

interface DialogueMessage {
  id: number;
  name: string;
  avatar: string;
  color: string;
  text: string;
}

const fieldCards = (side: Side, state: BattleState): CardInstance[] =>
  state[side].field.filter((card): card is CardInstance => card !== null);

/** 上场卡牌与其附着的防守牌（护盾）一起参与受击 / 击破判定 */
const unitsOf = (cards: CardInstance[]): CardInstance[] =>
  cards.flatMap((card) => [card, ...(card.guards ?? [])]);

function resolveDropTarget(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]');
  if (!element) return null;
  const kind = element.dataset.drop;
  if (kind === 'slot') {
    const slot = Number(element.dataset.slot);
    return Number.isNaN(slot) ? null : { kind: 'slot', slot };
  }
  if (kind === 'enemy' && element.dataset.uid) {
    return { kind: 'enemy', uid: element.dataset.uid };
  }
  if (kind === 'center') return { kind: 'center' };
  return null;
}

function validateDrop(
  state: BattleState,
  drag: { uid: string; from: 'hand' | 'field' },
  target: DropTarget | null,
): boolean {
  if (!target || state.winner || state.turn !== 'player') return false;

  if (drag.from === 'hand') {
    const card = state.player.hand.find((item) => item.uid === drag.uid);
    if (!card) return false;
    if (state.player.action < COST_PLAY_CARD || target.kind !== 'slot') return false;
    const def = getCardDef(card.defId);
    // 防守牌可放在已有卡牌上成为护盾，也可正常放在空槽位
    if (def.type === '防守牌') return true;
    return state.player.field[target.slot] === null;
  }

  const attacker = state.player.field.find((item) => item?.uid === drag.uid);
  if (!attacker || state.player.action < COST_ACTION) return false;
  const def = getCardDef(attacker.defId);
  if (def.type !== '进攻牌') return false;

  if (target.kind === 'enemy') {
    if (state.domain && def.realm !== state.domain.realm) return false;
    return state.enemy.field.some((item) => item?.uid === target.uid);
  }
  if (target.kind === 'center') {
    return state.domain !== null && def.realm !== state.domain.realm;
  }
  return false;
}

export function BattlePage() {
  const navigate = useNavigate();
  const [settings] = useState(loadSave);
  const playerCharacter = getCharacter(settings.selectedCharacter);
  const [enemyCharacter] = useState(() => getRandomOpponent(playerCharacter.id));

  const [playerDeck] = useState(() => {
    const owned = new Set(settings.owned);
    const ids = settings.deck.filter((id) => owned.has(id));
    return isValidDeck(ids) ? ids : settings.owned.slice(0, MAX_DECK);
  });
  const [difficulty] = useState(() =>
    effectiveDifficulty(levelFromWins(settings.wins), settings.difficultyReduced),
  );
  const [enemyDeck] = useState(() => buildEnemyDeck(enemyCharacter.id, enemyDeckSize(difficulty)));
  const [effectMultiplier] = useState(() => enemyEffectMultiplier(difficulty));

  const [state, dispatch] = useReducer(battleReducer, undefined, () =>
    createBattle(playerDeck, enemyDeck, effectMultiplier, settings.glory),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [floats, setFloats] = useState<FloatFx[]>([]);
  const [veils, setVeils] = useState<VeilFx[]>([]);
  const [reward, setReward] = useState<{ rings: number; leveledUp: boolean } | null>(null);
  const [dialogue, setDialogue] = useState<DialogueMessage | null>(null);
  const rewardedRef = useRef(false);
  const fxSeed = useRef(0);
  const dialogueSeed = useRef(0);
  const dialogueTimer = useRef<number | null>(null);
  const prevBattleRef = useRef(state);
  const pendingActionRef = useRef<BattleAction | null>(null);

  const showDialogue = (characterId: string, trigger: DialogueTrigger): boolean => {
    const text = pickDialogueLine(characterId, trigger);
    if (!text) return false;
    const speaker = getCharacter(characterId);
    dialogueSeed.current += 1;
    const id = dialogueSeed.current;
    setDialogue({ id, name: speaker.name, avatar: speaker.avatar, color: speaker.color, text });
    if (dialogueTimer.current) window.clearTimeout(dialogueTimer.current);
    dialogueTimer.current = window.setTimeout(() => {
      setDialogue((prev) => (prev && prev.id === id ? null : prev));
    }, 4600);
    return true;
  };

  const send = (action: BattleAction) => {
    pendingActionRef.current = action;
    dispatch(action);
  };

  // 开场台词（每次进入对战 100% 触发）
  useEffect(() => {
    const timer = window.setTimeout(() => showDialogue(enemyCharacter.id, 'start'), 450);
    return () => {
      window.clearTimeout(timer);
      if (dialogueTimer.current) window.clearTimeout(dialogueTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemyCharacter.id]);

  // 根据战况变化触发角色对话
  useEffect(() => {
    const prev = prevBattleRef.current;
    prevBattleRef.current = state;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (prev === state) return;

    const enemyId = enemyCharacter.id;

    if (!prev.winner && state.winner) {
      showDialogue(enemyId, state.winner === 'enemy' ? 'win' : 'lose');
      return;
    }

    if (action?.type === 'RESTART') {
      if (dialogueTimer.current) window.clearTimeout(dialogueTimer.current);
      setDialogue(null);
      window.setTimeout(() => showDialogue(enemyId, 'start'), 450);
      return;
    }

    const prevEnemy = unitsOf(fieldCards('enemy', prev));
    const nextEnemy = unitsOf(fieldCards('enemy', state));
    const prevPlayer = unitsOf(fieldCards('player', prev));
    const nextPlayer = unitsOf(fieldCards('player', state));

    const destroyedEnemy = prevEnemy.filter(
      (card) => !nextEnemy.some((item) => item.uid === card.uid),
    );
    const destroyedPlayer = prevPlayer.filter(
      (card) => !nextPlayer.some((item) => item.uid === card.uid),
    );
    const damagedEnemy = prevEnemy.filter((card) => {
      const now = nextEnemy.find((item) => item.uid === card.uid);
      return now !== undefined && now.power < card.power;
    });
    const damagedPlayer = prevPlayer.filter((card) => {
      const now = nextPlayer.find((item) => item.uid === card.uid);
      return now !== undefined && now.power < card.power;
    });

    const relivedEnemy = nextEnemy.some(
      (card) => card.relive && !prevEnemy.some((item) => item.uid === card.uid && item.relive),
    );
    const enemyDomainStarted = !prev.domain && state.domain?.owner === 'enemy';
    const enemyDomainBroken =
      prev.domain?.owner === 'enemy' && !state.domain && action?.type === 'BREAK_DOMAIN';
    const actionEmptied =
      !state.winner && prev.turn === 'player' && prev.player.action > 0 && state.player.action === 0;
    const playerAttacked = action?.type === 'ATTACK' && prev.turn === 'player';

    // 受击 / 击破按“卡牌所属角色”播报，而非当前对战双方的命定角色
    const firstDestroyedEnemy = destroyedEnemy[0];
    const firstDestroyedPlayer = destroyedPlayer[0];
    const firstDamagedEnemy = damagedEnemy[0];
    const firstDamagedPlayer = damagedPlayer[0];

    const speak = () => {
      if (firstDestroyedEnemy) {
        if (showDialogue(getCardDef(firstDestroyedEnemy.defId).character, 'break')) return;
        if (showDialogue(enemyId, 'egg')) return;
      }
      if (
        firstDestroyedPlayer &&
        showDialogue(getCardDef(firstDestroyedPlayer.defId).character, 'break')
      ) {
        return;
      }
      if (enemyDomainBroken && showDialogue(enemyId, 'domainBreak')) return;
      if (enemyDomainStarted && showDialogue(enemyId, 'domain')) return;
      if (relivedEnemy && showDialogue(enemyId, 'relive')) return;
      if (playerAttacked && showDialogue(enemyId, 'attack')) return;
      if (firstDamagedEnemy && showDialogue(getCardDef(firstDamagedEnemy.defId).character, 'hit')) {
        return;
      }
      if (
        firstDamagedPlayer &&
        showDialogue(getCardDef(firstDamagedPlayer.defId).character, 'hit')
      ) {
        return;
      }
      if (actionEmptied && showDialogue(enemyId, 'actionEmpty')) return;
      if (action?.type === 'PLAY_CARD' && prev.turn === 'player') {
        showDialogue(enemyId, 'play');
      }
    };
    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!state.winner || rewardedRef.current) return;
    rewardedRef.current = true;
    if (state.winner !== 'player') return;

    const current = loadSave();
    const lost = Math.max(0, playerDeck.length - totalCards(state.player));
    const gained = victoryRings(difficulty, lost);
    const beforeLevel = levelFromWins(current.wins);
    const nextWins = current.wins + 1;
    writeSave({ ...current, wins: nextWins, rings: current.rings + gained });
    setReward({ rings: gained, leveledUp: levelFromWins(nextWins) > beforeLevel });
  }, [state, difficulty, playerDeck.length]);

  const spawnFloat = (x: number, y: number, damage: number) => {
    fxSeed.current += 1;
    const id = fxSeed.current;
    setFloats((prev) => [...prev, { id, x, y, text: `-${damage}` }]);
    window.setTimeout(() => setFloats((prev) => prev.filter((item) => item.id !== id)), 900);
  };

  const spawnVeil = (x: number, y: number) => {
    fxSeed.current += 1;
    const id = fxSeed.current;
    setVeils((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => setVeils((prev) => prev.filter((item) => item.id !== id)), 340);
  };

  const performDrop = (info: { uid: string; from: 'hand' | 'field' }, target: DropTarget) => {
    const current = stateRef.current;

    if (info.from === 'hand' && target.kind === 'slot') {
      send({ type: 'PLAY_CARD', uid: info.uid, slot: target.slot });
      return;
    }

    if (info.from !== 'field') return;

    if (target.kind === 'enemy') {
      const attacker = current.player.field.find((item) => item?.uid === info.uid);
      const targetIndex = current.enemy.field.findIndex((item) => item?.uid === target.uid);
      const targetCard = current.enemy.field[targetIndex];
      if (!attacker || !targetCard) return;
      const damage = computeDamage(attacker, targetCard);
      spawnFloat(SLOT_X[targetIndex] + SLOT_W / 2, ENEMY_Y + CARD_OFFSET, damage);
      spawnVeil(SLOT_X[targetIndex] + CARD_OFFSET, ENEMY_Y + CARD_OFFSET);
      send({ type: 'ATTACK', attackerUid: info.uid, targetUid: target.uid });
      return;
    }

    if (target.kind === 'center') {
      send({ type: 'BREAK_DOMAIN', attackerUid: info.uid });
    }
  };

  useEffect(() => {
    if (!drag) return;
    const info = { uid: drag.uid, from: drag.from };

    const onMove = (event: PointerEvent) => {
      const target = resolveDropTarget(event.clientX, event.clientY);
      const valid = validateDrop(stateRef.current, info, target);
      setDrag((prev) =>
        prev ? { ...prev, x: event.clientX, y: event.clientY, target: valid ? target : null } : prev,
      );
    };

    const onUp = (event: PointerEvent) => {
      const target = resolveDropTarget(event.clientX, event.clientY);
      if (validateDrop(stateRef.current, info, target) && target) {
        performDrop(info, target);
      }
      setDrag(null);
    };

    const onCancel = () => setDrag(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.uid, drag?.from]);

  // 敌方回合：按节奏逐步执行 AI 行动
  useEffect(() => {
    if (state.winner || state.turn !== 'enemy') return;
    const timer = window.setTimeout(() => {
      const current = stateRef.current;
      const action = chooseAiAction(current);
      if (action.type === 'ATTACK') {
        const attacker = current.enemy.field.find((card) => card?.uid === action.attackerUid);
        const targetIndex = current.player.field.findIndex((card) => card?.uid === action.targetUid);
        const target = current.player.field[targetIndex];
        if (attacker && target) {
          const damage = computeDamage(attacker, target);
          spawnFloat(SLOT_X[targetIndex] + SLOT_W / 2, PLAYER_Y + CARD_OFFSET, damage);
          spawnVeil(SLOT_X[targetIndex] + CARD_OFFSET, PLAYER_Y + CARD_OFFSET);
        }
      }
      send(action);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // 行动值归零自动结束回合
  useEffect(() => {
    if (state.winner || state.turn !== 'player' || state.player.action > 0) return;
    const timer = window.setTimeout(() => send({ type: 'END_TURN' }), 420);
    return () => window.clearTimeout(timer);
  }, [state]);

  const startDrag = (event: ReactPointerEvent, uid: string, from: 'hand' | 'field') => {
    if (state.winner || state.turn !== 'player') return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({ uid, from, x: event.clientX, y: event.clientY, target: null });
  };

  const restart = () => {
    setFloats([]);
    setVeils([]);
    setDrag(null);
    setReward(null);
    rewardedRef.current = false;
    send({
      type: 'RESTART',
      playerDeck,
      enemyDeck,
      enemyEffectMultiplier: effectMultiplier,
      playerGlory: settings.glory,
    });
  };

  const centerClickable = state.turn === 'player' && !state.winner && state.domain === null;
  const arcRotation = (state.turn === 'player' ? 90 : -90) - 45;
  const domainColor = state.domain ? REALM_COLORS[state.domain.realm] : '#ffffff';
  const hoveredSlot = drag?.target?.kind === 'slot' ? drag.target.slot : -1;
  const hoveredEnemyUid = drag?.target?.kind === 'enemy' ? drag.target.uid : null;
  const centerHover = drag?.target?.kind === 'center';
  const dragHandCard =
    drag?.from === 'hand' ? state.player.hand.find((card) => card.uid === drag.uid) ?? null : null;
  const dragHandIsDefense = dragHandCard
    ? getCardDef(dragHandCard.defId).type === '防守牌'
    : false;

  const dragAttacker =
    drag?.from === 'field'
      ? state.player.field.find((card) => card?.uid === drag.uid) ?? null
      : null;
  const dragAttackerDef = dragAttacker ? getCardDef(dragAttacker.defId) : null;
  // 拖拽进攻牌时，可攻击的敌方卡牌 / 可击碎的领域一起高亮
  const attackDragActive =
    drag?.from === 'field' && dragAttacker !== null && dragAttackerDef?.type === '进攻牌';
  const attackRealmAllowed =
    dragAttackerDef !== null && (!state.domain || dragAttackerDef.realm === state.domain.realm);
  const centerBreakable =
    attackDragActive && state.domain !== null && !attackRealmAllowed;

  // 拖到有效目标上方（未松手）时提示这一步的作用
  const dragHint = (() => {
    if (!drag) return null;
    const target = drag.target;
    if (!target) return null;

    if (drag.from === 'hand' && dragHandCard && target.kind === 'slot') {
      const def = getCardDef(dragHandCard.defId);
      const occupant = state.player.field[target.slot];
      if (def.type === '防守牌') {
        return occupant
          ? `为该卡牌提供 ${dragHandCard.power} 点护盾`
          : `作为防守牌上场（生力 ${dragHandCard.power}）`;
      }
      if (def.type === '物品牌') {
        const effect = effectText(def);
        return effect
          ? `上场并触发：${effect.replace(/^使用：/, '')}`
          : `作为物品牌上场（生力 ${dragHandCard.power}）`;
      }
      return `作为${def.type}上场（生力 ${dragHandCard.power}）`;
    }

    if (drag.from === 'field' && dragAttacker) {
      if (target.kind === 'enemy') {
        const enemyCard = state.enemy.field.find((card) => card?.uid === target.uid);
        if (!enemyCard) return null;
        const damage = computeDamage(dragAttacker, enemyCard);
        const shields = guardPower(enemyCard);
        return shields > 0
          ? `造成 ${damage} 点伤害（先扣护盾 ${shields} 点）`
          : `造成 ${damage} 点伤害`;
      }
      if (target.kind === 'center') return '击碎当前领域';
    }
    return null;
  })();

  // 提示气泡跟随指针：默认显示在指针右侧，靠近窗口右缘时翻到左侧
  const hintFlipped = drag ? drag.x + 320 > window.innerWidth : false;

  let dragCard: CardInstance | null = null;
  if (drag) {
    dragCard =
      drag.from === 'hand'
        ? state.player.hand.find((card) => card.uid === drag.uid) ?? null
        : state.player.field.find((card) => card?.uid === drag.uid) ?? null;
  }

  const stageStyle: CSSProperties = {
    transform: `translate(-50%, -50%) scale(${scale})`,
  };

  return (
    <div className="battle-root">
      <div className="battle-stage" style={stageStyle}>
        <div
          className="domain-tint"
          style={{ background: domainColor, opacity: state.domain ? 0.16 : 0 }}
        />

        <div className="battle-top">
          <div className="battle-top-left">
            <button type="button" className="battle-exit" onClick={() => navigate('/')} aria-label="退出对战">
              ←
            </button>
            <span className="battle-count">我方 {totalCards(state.player)} 张</span>
            <span
              className="battle-difficulty"
              title={
                effectMultiplier > 1
                  ? `敌方卡牌使用效果 ×${effectMultiplier}`
                  : '敌方无效果加成'
              }
            >
              难度 {difficulty}
            </span>
          </div>
          <span className={`battle-turn ${state.turn === 'player' ? 'is-player' : 'is-enemy'}`}>
            {state.turn === 'player' ? '⊙ 我方回合 ⊙' : '敌方回合'}
          </span>
          <span className="battle-count">
            敌方 · {enemyCharacter.name} · {totalCards(state.enemy)} 张
          </span>
        </div>

        {dialogue ? (
          <div
            key={dialogue.id}
            className="battle-dialogue"
            style={{ '--speaker-color': dialogue.color } as CSSProperties}
            onClick={() => setDialogue(null)}
            title="点击关闭"
          >
            <img
              className="battle-dialogue-avatar"
              src={dialogue.avatar}
              alt=""
              draggable={false}
            />
            <div className="battle-dialogue-body">
              <span className="battle-dialogue-name">{dialogue.name}</span>
              <p className="battle-dialogue-text">{dialogue.text}</p>
            </div>
          </div>
        ) : null}

        {state.domain ? (
          <div className="domain-banner">
            <span className="domain-banner-title">
              <i style={{ background: REALM_COLORS[state.domain.realm] }} />
              领域 · {state.domain.realm}
            </span>
            <span className="domain-banner-hint">
              仅「{state.domain.realm}」可攻击；拖拽其他属界进攻牌到 ⊙心 可击碎
            </span>
          </div>
        ) : null}

        {/* 敌方对阵区 */}
        {state.enemy.field.map((card, index) => {
          const isHover = hoveredEnemyUid === card?.uid;
          const previewDamage =
            isHover && dragAttacker && card ? computeDamage(dragAttacker, card) : 0;
          const targetable = attackDragActive && card !== null && attackRealmAllowed;
          return (
            <div
              key={index}
              className={`slot slot--enemy ${targetable ? 'slot--targetable' : ''} ${
                isHover ? 'slot--hover' : ''
              }`}
              style={{ left: SLOT_X[index], top: ENEMY_Y }}
              data-drop={card ? 'enemy' : undefined}
              data-uid={card?.uid}
            >
              {card ? (
                <div className="slot-card">
                  <CardView card={card} />
                </div>
              ) : null}
              {card?.guards?.length ? (
                <div className="slot-guards">
                  {card.guards.map((guard, guardIndex) => (
                    <div
                      key={guard.uid}
                      className="slot-guard"
                      style={{ zIndex: guardIndex + 1 }}
                    >
                      <CardView card={guard} variant="guard" />
                    </div>
                  ))}
                </div>
              ) : null}
              {isHover && previewDamage > 0 ? (
                <>
                  <div className="preview-veil" />
                  <div className="preview-damage">-{previewDamage}</div>
                </>
              ) : null}
            </div>
          );
        })}

        {/* ⊙心 */}
        <div
          className={`turn-core ${centerClickable ? 'is-clickable' : ''} ${
            centerHover ? 'is-drop-hover' : ''
          } ${centerBreakable ? 'is-breakable' : ''}`}
          data-drop="center"
          onClick={() => {
            if (centerClickable) send({ type: 'END_TURN' });
          }}
          title={centerClickable ? '点击结束回合' : undefined}
        >
          <svg className="core-layer core-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="45" />
          </svg>
          <svg
            className="core-layer core-arc"
            viewBox="0 0 120 120"
            style={{ transform: `rotate(${arcRotation}deg)` }}
            aria-hidden="true"
          >
            <circle cx="60" cy="60" r="45" strokeDasharray="70.7 212.1" strokeLinecap="round" />
          </svg>
          {state.domain ? (
            <div className="core-realm">
              <RealmIcon realm={state.domain.realm} size={44} />
            </div>
          ) : (
            <div className="core-dot" />
          )}
        </div>

        {/* 我方对阵区 */}
        {state.player.field.map((card, index) => {
          const isHover = hoveredSlot === index;
          const droppable = drag?.from === 'hand' && (dragHandIsDefense || card === null);
          return (
            <div
              key={index}
              className={`slot slot--player ${droppable ? 'slot--droppable' : ''} ${
                isHover ? 'slot--hover' : ''
              }`}
              style={{ left: SLOT_X[index], top: PLAYER_Y }}
              data-drop={card && !dragHandIsDefense ? undefined : 'slot'}
              data-slot={card && !dragHandIsDefense ? undefined : index}
            >
              {card ? (
                <div
                  className="slot-card is-draggable"
                  onPointerDown={(event) => startDrag(event, card.uid, 'field')}
                >
                  <CardView card={card} />
                </div>
              ) : null}
              {card?.guards?.length ? (
                <div className="slot-guards">
                  {card.guards.map((guard, guardIndex) => (
                    <div
                      key={guard.uid}
                      className="slot-guard"
                      style={{ zIndex: guardIndex + 1 }}
                    >
                      <CardView card={guard} variant="guard" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* 手牌（卡牌组） */}
        <div className="hand">
          {state.player.hand.map((card, index) => (
            <div
              key={card.uid}
              className={`hand-card ${drag?.uid === card.uid ? 'is-dragged' : ''}`}
              style={{ zIndex: index + 1 }}
              onPointerDown={(event) => startDrag(event, card.uid, 'hand')}
            >
              <CardView card={card} variant="hand" />
            </div>
          ))}
        </div>

        <ActionDots value={state.player.action} />

        {veils.map((veil) => (
          <div key={veil.id} className="damage-veil" style={{ left: veil.x, top: veil.y }} />
        ))}

        {floats.map((float) => (
          <div key={float.id} className="float-fx" style={{ left: float.x, top: float.y }}>
            {float.text}
          </div>
        ))}

        {state.winner ? (
          <div className="battle-over">
            <div className="battle-over-card">
              <p className="over-eyebrow">对决结束</p>
              <h2>{state.winner === 'player' ? '我方获胜' : '敌方获胜'}</h2>
              <p className="over-detail">
                我方剩余 {totalCards(state.player)} 张 · 敌方剩余 {totalCards(state.enemy)} 张
              </p>
              {state.winner === 'player' && reward ? (
                <p className="over-reward">
                  记忆之环 <b>+{reward.rings}</b>
                  {reward.leveledUp ? <span>等级提升</span> : null}
                </p>
              ) : null}
              <div className="over-actions">
                <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
                  返回看板
                </button>
                <button type="button" className="btn" onClick={restart}>
                  再来一局
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {drag && dragCard
        ? createPortal(
            <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
              <CardView card={dragCard} variant="hand" />
            </div>,
            document.body,
          )
        : null}

      {/* 悬停在有效目标上但还没松手：文字说明这一步的作用 */}
      {drag && dragHint
        ? createPortal(
            <div
              className={`drag-hint ${hintFlipped ? 'is-flipped' : ''}`}
              style={{ left: hintFlipped ? drag.x - 78 : drag.x + 78, top: drag.y }}
            >
              {dragHint}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
