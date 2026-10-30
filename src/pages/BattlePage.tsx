import { useEffect, useReducer, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { REALM_COLORS, getCardDef, getCharacter, getOpponent } from '../data/cards';
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
import type { BattleState, CardInstance } from '../game/types';
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
    return (
      state.player.action >= COST_PLAY_CARD &&
      target.kind === 'slot' &&
      state.player.field[target.slot] === null
    );
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
  const enemyCharacter = getOpponent(playerCharacter.id);

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
    createBattle(playerDeck, enemyDeck, effectMultiplier),
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
  const rewardedRef = useRef(false);
  const fxSeed = useRef(0);

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
      dispatch({ type: 'PLAY_CARD', uid: info.uid, slot: target.slot });
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
      dispatch({ type: 'ATTACK', attackerUid: info.uid, targetUid: target.uid });
      return;
    }

    if (target.kind === 'center') {
      dispatch({ type: 'BREAK_DOMAIN', attackerUid: info.uid });
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
      dispatch(action);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // 行动值归零自动结束回合
  useEffect(() => {
    if (state.winner || state.turn !== 'player' || state.player.action > 0) return;
    const timer = window.setTimeout(() => dispatch({ type: 'END_TURN' }), 420);
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
    dispatch({
      type: 'RESTART',
      playerDeck,
      enemyDeck,
      enemyEffectMultiplier: effectMultiplier,
    });
  };

  const centerClickable = state.turn === 'player' && !state.winner && state.domain === null;
  const arcRotation = (state.turn === 'player' ? 90 : -90) - 45;
  const domainColor = state.domain ? REALM_COLORS[state.domain.realm] : '#ffffff';
  const hoveredSlot = drag?.target?.kind === 'slot' ? drag.target.slot : -1;
  const hoveredEnemyUid = drag?.target?.kind === 'enemy' ? drag.target.uid : null;
  const centerHover = drag?.target?.kind === 'center';

  const dragAttacker =
    drag?.from === 'field'
      ? state.player.field.find((card) => card?.uid === drag.uid) ?? null
      : null;

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
          <span className="battle-count">敌方 {totalCards(state.enemy)} 张</span>
        </div>

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
          return (
            <div
              key={index}
              className={`slot slot--enemy ${isHover ? 'slot--hover' : ''}`}
              style={{ left: SLOT_X[index], top: ENEMY_Y }}
              data-drop={card ? 'enemy' : undefined}
              data-uid={card?.uid}
            >
              {card ? (
                <div className="slot-card">
                  <CardView card={card} />
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
          }`}
          data-drop="center"
          onClick={() => {
            if (centerClickable) dispatch({ type: 'END_TURN' });
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
          const droppable = drag?.from === 'hand' && card === null;
          return (
            <div
              key={index}
              className={`slot slot--player ${droppable ? 'slot--droppable' : ''} ${
                isHover ? 'slot--hover' : ''
              }`}
              style={{ left: SLOT_X[index], top: PLAYER_Y }}
              data-drop={card ? undefined : 'slot'}
              data-slot={card ? undefined : index}
            >
              {card ? (
                <div
                  className="slot-card is-draggable"
                  onPointerDown={(event) => startDrag(event, card.uid, 'field')}
                >
                  <CardView card={card} />
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
    </div>
  );
}
