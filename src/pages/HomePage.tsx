import { useMemo, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCardDef, getCharacter } from '../data/cards';
import { loadSave, writeSave } from '../data/save';
import { effectiveDifficulty, levelFromWins } from '../game/progress';
import { MAX_GLORY, poweredPower } from '../game/glory';
import { ProgressDialog } from '../components/ProgressDialog';
import { CardView } from '../components/CardView';
import { RingIcon } from '../components/RingIcon';
import { OverflowIcon } from '../components/OverflowIcon';
import { FlowingBorder, makeFlowLines } from '../components/FlowingBorder';
import {
  BattleIcon,
  CollectionIcon,
  RecallIcon,
  ShopIcon,
} from '../components/MenuIcons';

/** 首页入口：悬停时各自沿自身轮廓流水 */
type HomeEntry = 'gacha' | 'shop' | 'collection' | 'battle';

export function HomePage() {
  const navigate = useNavigate();
  const [save, setSave] = useState(loadSave);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [boardIndex, setBoardIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<HomeEntry | null>(null);
  // 悬停期间水线保持不变；离开再回到同一个入口会重新生成一组
  const hoverLines = useMemo(() => makeFlowLines(4), [hovered]);

  const hoverProps = (key: HomeEntry) => ({
    onPointerEnter: () => setHovered(key),
    onPointerLeave: () => setHovered(null),
    onFocus: () => setHovered(key),
    onBlur: () => setHovered(null),
  });

  const selected = getCharacter(save.selectedCharacter);
  const level = levelFromWins(save.wins);
  const difficulty = effectiveDifficulty(level, save.difficultyReduced);

  const boardDefs = save.boardCards.map((id) => getCardDef(id));
  const activeIndex = Math.min(boardIndex, boardDefs.length);
  const activeCard = activeIndex > 0 ? boardDefs[activeIndex - 1] : null;
  const activeGlory = activeCard ? save.glory[activeCard.id] ?? 0 : 0;
  const activePower = activeCard ? poweredPower(activeCard.power, activeGlory) : 0;

  const toggleDifficulty = () => {
    const next = { ...save, difficultyReduced: !save.difficultyReduced };
    setSave(next);
    writeSave(next);
  };

  const handleBoardMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeCard || window.matchMedia('(hover: none)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 16, y: px * 20 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="title-screen">
      <button
        type="button"
        className="home-level"
        onClick={() => setDialogOpen(true)}
        title={`等级 ${level} · 难度 ${difficulty}`}
        aria-label={`等级 ${level}，难度 ${difficulty}`}
      >
        <span className="home-level-label">等级</span>
        <b>{level}</b>
        <span className="home-level-diff">难度 {difficulty}</span>
      </button>

      <div className="home-wallet">
        <span className="status-chip is-static" title="每次复现消耗 1 枚">
          <RingIcon />
          记忆之环 <b>{save.rings}</b>
        </span>
        <span
          className="status-chip is-static status-chip--overflow"
          title="复现到光辉已满的卡牌时获得；5 枚可补足 1 枚记忆之环"
        >
          <OverflowIcon />
          满溢之辉 <b>{save.overflow}</b>
        </span>
      </div>

      {boardDefs.length > 0 ? (
        <nav className="board-dots" aria-label="看板切换">
          <button
            type="button"
            className={`board-dot board-dot--mascot ${activeIndex === 0 ? 'is-active' : ''}`}
            style={{ '--dot-color': selected.color } as CSSProperties}
            onClick={() => setBoardIndex(0)}
            title={`看板娘 · ${selected.name}`}
            aria-label={`看板娘 ${selected.name}`}
          />
          {boardDefs.map((def, index) => {
            const color = getCharacter(def.character).color;
            const glory = save.glory[def.id] ?? 0;
            return (
              <button
                key={def.id}
                type="button"
                className={`board-dot ${activeIndex === index + 1 ? 'is-active' : ''}`}
                style={{ '--dot-color': color } as CSSProperties}
                onClick={() => setBoardIndex(index + 1)}
                title={`${def.name} · 光辉 ${glory}`}
                aria-label={`${def.name}，光辉 ${glory}`}
              />
            );
          })}
        </nav>
      ) : null}

      <h1 className="home-logo">⊙牌</h1>

      <div className="home-center">
        <div
          className={`title-portrait ${activeCard ? 'is-card' : ''}`}
          onPointerMove={handleBoardMove}
          onPointerLeave={resetTilt}
        >
          {activeCard ? (
            <div className="board-stage">
              <div
                className="board-tilt"
                style={{
                  transform: `perspective(900px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
                }}
              >
                <CardView
                  card={{
                    uid: activeCard.id,
                    defId: activeCard.id,
                    power: activePower,
                    maxPower: activePower,
                    glory: activeGlory,
                  }}
                  variant="board"
                />
              </div>
            </div>
          ) : (
            <div className="title-emblem">
              <svg className="title-emblem-arc" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="47" />
              </svg>
              <div className="title-emblem-glyph">
                <img src={selected.avatar} alt={selected.name} draggable={false} />
              </div>
            </div>
          )}

          {activeCard ? (
            <>
              <p className="title-portrait-name">{activeCard.name}</p>
              <p className="title-portrait-title">
                {activeCard.type} · {activeCard.realm} · 生力 {activePower} · 光辉 {activeGlory} /{' '}
                {MAX_GLORY}
              </p>
            </>
          ) : (
            <>
              <p className="title-portrait-name">{selected.name}</p>
              <p className="title-portrait-title">{selected.title}</p>
            </>
          )}
          <p className="home-lore">{selected.lore}</p>
        </div>
      </div>

      <nav className="home-dock" aria-label="页面入口">
        <button
          type="button"
          className="dock-button"
          onClick={() => navigate('/gacha')}
          {...hoverProps('gacha')}
        >
          <span className="dock-icon">
            <RecallIcon />
            {hovered === 'gacha' ? (
              <FlowingBorder lines={hoverLines} radius={999} color="var(--gold)" />
            ) : null}
          </span>
          <span className="dock-label">光阴回转之间</span>
        </button>
        <button
          type="button"
          className="dock-button"
          onClick={() => navigate('/shop')}
          {...hoverProps('shop')}
        >
          <span className="dock-icon">
            <ShopIcon />
            {hovered === 'shop' ? (
              <FlowingBorder lines={hoverLines} radius={999} color="var(--gold)" />
            ) : null}
          </span>
          <span className="dock-label">坠梦易物之所</span>
        </button>
        <button
          type="button"
          className="dock-button"
          onClick={() => navigate('/collection')}
          {...hoverProps('collection')}
        >
          <span className="dock-icon">
            <CollectionIcon />
            {hovered === 'collection' ? (
              <FlowingBorder lines={hoverLines} radius={999} color="var(--gold)" />
            ) : null}
          </span>
          <span className="dock-label">卡牌收藏</span>
        </button>
      </nav>

      <button
        type="button"
        className="home-battle"
        onClick={() => navigate('/deck')}
        {...hoverProps('battle')}
      >
        <span className="dock-icon">
          <BattleIcon />
        </span>
        <span className="dock-label">进入对战</span>
        <span className="home-battle-note">卡组 {save.deck.length} 张</span>
        {hovered === 'battle' ? (
          <FlowingBorder lines={hoverLines} inset={3} radius={23} color="var(--gold)" />
        ) : null}
      </button>

      {dialogOpen ? (
        <ProgressDialog
          save={save}
          onClose={() => setDialogOpen(false)}
          onToggleDifficulty={toggleDifficulty}
        />
      ) : null}
    </div>
  );
}
