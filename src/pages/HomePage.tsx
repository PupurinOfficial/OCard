import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS, getCharacter } from '../data/cards';
import { loadSave, writeSave } from '../data/save';
import { effectiveDifficulty, levelFromWins } from '../game/progress';
import { ProgressDialog } from '../components/ProgressDialog';
import type { ProgressKind } from '../components/ProgressDialog';
import { RingIcon } from '../components/RingIcon';

export function HomePage() {
  const navigate = useNavigate();
  const [save, setSave] = useState(loadSave);
  const [dialog, setDialog] = useState<ProgressKind | null>(null);

  const selected = getCharacter(save.selectedCharacter);
  const opponent = CHARACTERS.find((item) => item.id !== selected.id) ?? CHARACTERS[0];
  const level = levelFromWins(save.wins);
  const difficulty = effectiveDifficulty(level, save.difficultyReduced);

  const toggleDifficulty = () => {
    const next = { ...save, difficultyReduced: !save.difficultyReduced };
    setSave(next);
    writeSave(next);
  };

  return (
    <div className="title-screen">
      <div className="title-portrait">
        <div className="title-emblem">
          <svg className="title-emblem-arc" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" />
          </svg>
          <div className="title-emblem-glyph">
            <img src={selected.avatar} alt={selected.name} draggable={false} />
          </div>
        </div>
        <p className="title-portrait-name">{selected.name}</p>
        <p className="title-portrait-title">{selected.title}</p>
      </div>

      <div className="title-panel">
        <p className="title-kicker">卡牌对战</p>
        <h1 className="title-logo">⊙牌</h1>
        <p className="title-lore">{selected.lore}</p>

        <nav className="title-menu">
          <button
            type="button"
            className="menu-button menu-button--primary"
            onClick={() => navigate('/deck')}
          >
            <span>进入对战</span>
            <i aria-hidden="true">→</i>
          </button>
          <button type="button" className="menu-button" onClick={() => navigate('/gacha')}>
            <span>光阴回转之间</span>
            <i aria-hidden="true">→</i>
          </button>
          <button type="button" className="menu-button" onClick={() => navigate('/collection')}>
            <span>卡牌收藏</span>
            <i aria-hidden="true">→</i>
          </button>
        </nav>

        <div className="title-status">
          <span className="status-chip is-static" title="每次复现消耗 1 枚">
            <RingIcon />
            记忆之环 <b>{save.rings}</b>
          </span>
          <button type="button" className="status-chip" onClick={() => setDialog('level')}>
            等级 <b>{level}</b>
            <i aria-hidden="true">?</i>
          </button>
          <button type="button" className="status-chip" onClick={() => setDialog('difficulty')}>
            难度 <b>{difficulty}</b>
            <i aria-hidden="true">?</i>
          </button>
        </div>

        <p className="title-footnote">
          命定 · {selected.name} · 对手 {opponent.name}（AI） · 卡组 {save.deck.length} 张 · 累计胜利{' '}
          {save.wins} 局
        </p>
      </div>

      {dialog ? (
        <ProgressDialog
          kind={dialog}
          save={save}
          onClose={() => setDialog(null)}
          onToggleDifficulty={toggleDifficulty}
        />
      ) : null}
    </div>
  );
}
