import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { REALM_COLORS, getCardDef, getCharacter } from '../data/cards';
import { TUTORIAL_SCRIPTS } from '../data/tutorial';
import type { TutorialLine, TutorialPhase } from '../data/tutorial';
import { loadSave, writeSave } from '../data/save';
import { CardView } from '../components/CardView';
import { ActionDots } from '../components/ActionDots';
import { RealmIcon } from '../components/RealmIcon';
import type { CardInstance } from '../game/types';
import './battle.css';
import './tutorial.css';

const STAGE_W = 1280;
const STAGE_H = 720;
const SLOT_W = 135;
const CARD_OFFSET = 12.5;
const SLOT_X = [320, 455, 690, 825];
const PHANTOM_X = [397.5, 572.5, 747.5];
const ENEMY_Y = 70;
const PLAYER_Y = 395;

interface Phantom {
  id: string;
  power: number;
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

type DropTarget = { kind: 'slot'; slot: number } | { kind: 'enemy'; index: number };

interface DragState {
  source: 'hand' | 'field';
  uid: string;
  x: number;
  y: number;
  target: DropTarget | null;
}

interface OpenDialogue {
  lines: TutorialLine[];
  next: TutorialPhase;
}

function makeCard(defId: string, uid: string): CardInstance {
  const def = getCardDef(defId);
  return { uid, defId, power: def.power, maxPower: def.power };
}

function resolveDropTarget(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]');
  if (!element) return null;
  const kind = element.dataset.drop;
  if (kind === 'slot') {
    const slot = Number(element.dataset.slot);
    return Number.isNaN(slot) ? null : { kind: 'slot', slot };
  }
  if (kind === 'enemy') {
    const index = Number(element.dataset.index);
    return Number.isNaN(index) ? null : { kind: 'enemy', index };
  }
  return null;
}

export function TutorialPage() {
  const navigate = useNavigate();
  const [save] = useState(loadSave);
  const character = getCharacter(save.selectedCharacter);
  const script = TUTORIAL_SCRIPTS[character.id] ?? TUTORIAL_SCRIPTS.musia;
  const scriptRef = useRef(script);
  scriptRef.current = script;

  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<TutorialPhase>('intro');
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [action, setAction] = useState(4);
  const [hand, setHand] = useState<CardInstance[]>(() =>
    script.handCardIds.map((id, index) => makeCard(id, `tut-hand-${index}-${id}`)),
  );
  const [field, setField] = useState<CardInstance | null>(null);
  const [fieldSlot, setFieldSlot] = useState(0);
  const [phantoms, setPhantoms] = useState<(Phantom | null)[]>(() =>
    [0, 1, 2].map((index) => ({ id: `tut-phantom-${index}`, power: 1 })),
  );
  const [dialogue, setDialogue] = useState<OpenDialogue | null>({
    lines: script.intro,
    next: 'play',
  });
  const [lineIndex, setLineIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [floats, setFloats] = useState<FloatFx[]>([]);
  const [veils, setVeils] = useState<VeilFx[]>([]);
  const fxSeed = useRef(0);

  const stateRef = useRef({ phase, action, hand, field, fieldSlot, phantoms });
  stateRef.current = { phase, action, hand, field, fieldSlot, phantoms };

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  function spawnFloat(x: number, y: number, damage: number) {
    fxSeed.current += 1;
    const id = fxSeed.current;
    setFloats((prev) => [...prev, { id, x, y, text: `-${damage}` }]);
    window.setTimeout(() => setFloats((prev) => prev.filter((item) => item.id !== id)), 900);
  }

  function spawnVeil(x: number, y: number) {
    fxSeed.current += 1;
    const id = fxSeed.current;
    setVeils((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => setVeils((prev) => prev.filter((item) => item.id !== id)), 340);
  }

  function openDialogue(lines: TutorialLine[], next: TutorialPhase) {
    setLineIndex(0);
    setDialogue({ lines, next });
  }

  function advance() {
    if (!dialogue) return;
    if (lineIndex < dialogue.lines.length - 1) {
      setLineIndex(lineIndex + 1);
      return;
    }
    const next = dialogue.next;
    setDialogue(null);
    setLineIndex(0);
    if (next === 'done') setFinished(true);
    else setPhase(next);
  }

  useEffect(() => {
    if (!dialogue) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // 敌方回合：幻影反击一次，然后进入最后一个回合
  useEffect(() => {
    if (phase !== 'enemy') return;
    const timer = window.setTimeout(() => {
      const current = stateRef.current;
      if (current.field) {
        const slotLeft = SLOT_X[current.fieldSlot];
        spawnFloat(slotLeft + SLOT_W / 2, PLAYER_Y + CARD_OFFSET, 1);
        spawnVeil(slotLeft + CARD_OFFSET, PLAYER_Y + CARD_OFFSET);
        setField((prev) =>
          prev ? { ...prev, power: Math.max(0, prev.power - 1) } : prev,
        );
      }
      setTurn('player');
      setAction(1);
      openDialogue(scriptRef.current.enemyTurn, 'last-attack');
    }, 950);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function validateDrop(
    snapshot: typeof stateRef.current,
    info: { source: 'hand' | 'field'; uid: string },
    target: DropTarget | null,
  ) {
    if (!target) return false;
    if (info.source === 'hand') {
      return (
        snapshot.phase === 'play' &&
        target.kind === 'slot' &&
        snapshot.field === null
      );
    }
    if (
      snapshot.phase !== 'attack1' &&
      snapshot.phase !== 'attack2' &&
      snapshot.phase !== 'last-attack'
    ) {
      return false;
    }
    if (snapshot.action < 1 || !snapshot.field) return false;
    if (target.kind !== 'enemy') return false;
    return snapshot.phantoms[target.index] !== null;
  }

  function performDrop(
    snapshot: typeof stateRef.current,
    info: { source: 'hand' | 'field'; uid: string },
    target: DropTarget,
  ) {
    if (info.source === 'hand' && target.kind === 'slot') {
      const card = snapshot.hand.find((item) => item.uid === info.uid);
      if (!card) return;
      setHand((prev) => prev.filter((item) => item.uid !== info.uid));
      setField(card);
      setFieldSlot(target.slot);
      setAction((prev) => Math.max(0, prev - 2));
      openDialogue(script.afterPlay, 'attack1');
      return;
    }

    if (info.source === 'field' && target.kind === 'enemy') {
      const attacker = snapshot.field;
      const victim = snapshot.phantoms[target.index];
      if (!attacker || !victim) return;

      const damage = attacker.power;
      const nextPhantoms = snapshot.phantoms.map((item, index) =>
        index === target.index ? null : item,
      );
      setPhantoms(nextPhantoms);
      setAction((prev) => Math.max(0, prev - 1));
      spawnFloat(PHANTOM_X[target.index] + SLOT_W / 2, ENEMY_Y + CARD_OFFSET, damage);
      spawnVeil(PHANTOM_X[target.index] + CARD_OFFSET, ENEMY_Y + CARD_OFFSET);

      if (nextPhantoms.every((item) => item === null)) {
        setPhase('victory');
        openDialogue(script.victory, 'done');
      } else if (snapshot.phase === 'attack1') {
        openDialogue(script.afterFirstAttack, 'attack2');
      } else if (snapshot.phase === 'attack2') {
        openDialogue(script.afterSecondAttack, 'end-turn');
      }
    }
  }

  useEffect(() => {
    if (!drag) return;
    const info = { source: drag.source, uid: drag.uid };

    const onMove = (event: PointerEvent) => {
      const target = resolveDropTarget(event.clientX, event.clientY);
      const valid = validateDrop(stateRef.current, info, target);
      setDrag((prev) =>
        prev
          ? { ...prev, x: event.clientX, y: event.clientY, target: valid ? target : null }
          : prev,
      );
    };

    const onUp = (event: PointerEvent) => {
      const target = resolveDropTarget(event.clientX, event.clientY);
      if (validateDrop(stateRef.current, info, target) && target) {
        performDrop(stateRef.current, info, target);
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
  }, [drag?.source, drag?.uid]);

  const startDrag = (event: ReactPointerEvent, uid: string, source: 'hand' | 'field') => {
    if (dialogue) return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({ source, uid, x: event.clientX, y: event.clientY, target: null });
  };

  const finish = () => {
    const current = loadSave();
    if (!current.tutorialDone) {
      writeSave({ ...current, tutorialDone: true, rings: current.rings + 1 });
    }
    navigate('/', { replace: true });
  };

  const enemyRemaining = phantoms.filter((item) => item !== null).length;
  const canPlayCard = phase === 'play' && !dialogue;
  const canAttack =
    !dialogue && snapshotAction(phase) && action >= 1 && field !== null;

  const objective = dialogue
    ? null
    : phase === 'play'
      ? `将【${script.attackCardName}】拖到我方对阵区`
      : phase === 'attack1' || phase === 'attack2'
        ? '拖动进攻牌攻击敌方幻影'
        : phase === 'end-turn'
          ? '点击中央的 ⊙心结束回合'
          : phase === 'last-attack'
            ? `击败最后的${script.enemyLabel}`
            : null;

  const currentLine = dialogue?.lines[lineIndex] ?? null;
  const arcRotation = (turn === 'player' ? 90 : -90) - 45;
  const stageStyle: CSSProperties = { transform: `translate(-50%, -50%) scale(${scale})` };
  const dragCard =
    drag?.source === 'hand'
      ? hand.find((item) => item.uid === drag.uid) ?? null
      : field;

  return (
    <div className="battle-root">
      <div className="battle-stage" style={stageStyle}>
        <div className="battle-top">
          <div className="battle-top-left">
            <span className="tut-kicker">序章 · 梦</span>
            <span className="battle-difficulty">教程</span>
            <span className="battle-count">敌方 {enemyRemaining} 张</span>
          </div>
          <span className={`battle-turn ${turn === 'player' ? 'is-player' : 'is-enemy'}`}>
            {turn === 'player' ? '⊙ 我方回合 ⊙' : '敌方回合'}
          </span>
        </div>

        {/* 敌方幻影 */}
        {phantoms.map((phantom, index) => {
          const isHover = drag?.target?.kind === 'enemy' && drag.target.index === index;
          return (
            <div
              key={index}
              className={`slot slot--enemy ${isHover ? 'slot--hover' : ''}`}
              style={{ left: PHANTOM_X[index], top: ENEMY_Y }}
              data-drop={phantom && canAttack ? 'enemy' : undefined}
              data-index={phantom ? index : undefined}
            >
              {phantom ? (
                <div
                  className="phantom"
                  style={{ '--phantom-color': REALM_COLORS[script.enemyRealm] } as CSSProperties}
                >
                  <span className="phantom__realm">
                    <RealmIcon realm={script.enemyRealm} size={18} />
                  </span>
                  <span className="phantom__glyph">
                    <RealmIcon realm={script.enemyRealm} size={34} />
                  </span>
                  <span className="phantom__name">{script.enemyLabel}</span>
                  <b className="phantom__power">{phantom.power}</b>
                </div>
              ) : null}
            </div>
          );
        })}

        {/* ⊙心：结束回合 */}
        <div
          className={`turn-core ${phase === 'end-turn' && !dialogue ? 'is-clickable' : ''}`}
          onClick={() => {
            if (phase !== 'end-turn' || dialogue) return;
            setTurn('enemy');
            setPhase('enemy');
          }}
          title={phase === 'end-turn' && !dialogue ? '点击结束回合' : undefined}
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
          <div className="core-dot" />
          {phase === 'end-turn' && !dialogue ? (
            <span className="tut-core-label">结束回合</span>
          ) : null}
        </div>

        {/* 我方对阵区 */}
        {[0, 1, 2, 3].map((slot) => {
          const isHover = drag?.target?.kind === 'slot' && drag.target.slot === slot;
          const droppable = canPlayCard && field === null;
          return (
            <div
              key={slot}
              className={`slot slot--player ${droppable ? 'slot--droppable' : ''} ${
                isHover ? 'slot--hover' : ''
              }`}
              style={{ left: SLOT_X[slot], top: PLAYER_Y }}
              data-drop={droppable ? 'slot' : undefined}
              data-slot={droppable ? slot : undefined}
            >
              {field && fieldSlot === slot ? (
                <div
                  className={`slot-card ${canAttack ? 'is-draggable' : ''}`}
                  onPointerDown={(event) => {
                    if (!canAttack) return;
                    startDrag(event, field.uid, 'field');
                  }}
                >
                  <CardView card={field} />
                </div>
              ) : null}
            </div>
          );
        })}

        {/* 手牌 */}
        <div className="hand">
          {hand.map((card, index) => {
            const draggable = canPlayCard && card.defId === script.attackCardId;
            return (
              <div
                key={card.uid}
                className={`hand-card ${drag?.uid === card.uid ? 'is-dragged' : ''} ${
                  draggable ? '' : 'tut-hand-static'
                }`}
                style={{ zIndex: index + 1 }}
                onPointerDown={(event) => {
                  if (!draggable) return;
                  startDrag(event, card.uid, 'hand');
                }}
              >
                <CardView card={card} variant="hand" />
              </div>
            );
          })}
        </div>

        <ActionDots value={action} />

        {objective ? <div className="tut-objective">{objective}</div> : null}

        {veils.map((veil) => (
          <div key={veil.id} className="damage-veil" style={{ left: veil.x, top: veil.y }} />
        ))}

        {floats.map((float) => (
          <div key={float.id} className="float-fx" style={{ left: float.x, top: float.y }}>
            {float.text}
          </div>
        ))}

        {dialogue && currentLine ? (
          <div className="tut-veil" onClick={advance}>
            <div
              className={`tut-dialogue ${currentLine.narration ? 'is-narration' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                advance();
              }}
            >
              {currentLine.narration ? null : (
                <div className="tut-portrait">
                  <img src={character.avatar} alt={character.name} draggable={false} />
                </div>
              )}
              <div className="tut-bubble">
                <span className="tut-speaker">{currentLine.speaker}</span>
                <p className="tut-text">{currentLine.text}</p>
                <i className="tut-next">点击继续</i>
              </div>
            </div>
          </div>
        ) : null}

        {finished ? (
          <div className="tut-end">
            <div className="tut-end-card">
              <p className="tut-end-kicker">序章 · 梦</p>
              <h2>梦醒了</h2>
              <p className="tut-end-text">
                睁开眼时，钟楼仍指向 22:22。刚才的战斗，好像从来没有发生过。
              </p>
              <p className="tut-end-reward">
                获得 记忆之环 <b>+1</b>
              </p>
              <button type="button" className="btn btn--primary" onClick={finish}>
                回到看板
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {finished ? null : (
        <button type="button" className="tut-skip" onClick={finish}>
          跳过教程
        </button>
      )}

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

function snapshotAction(phase: TutorialPhase): boolean {
  return phase === 'attack1' || phase === 'attack2' || phase === 'last-attack';
}
