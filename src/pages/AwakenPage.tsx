import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS, REALM_COLORS, cardsOfCharacter, getCharacter } from '../data/cards';
import { loadSave, writeSave } from '../data/save';
import { MAX_DECK } from '../game/deck';
import { RealmIcon } from '../components/RealmIcon';
import './awaken.css';

export function AwakenPage() {
  const navigate = useNavigate();
  const [save] = useState(loadSave);
  const [picked, setPicked] = useState<string | null>(null);

  const chosen = picked ? getCharacter(picked) : null;

  const confirm = () => {
    if (!picked) return;
    const ids = cardsOfCharacter(picked).map((def) => def.id);
    writeSave({
      ...save,
      initiated: true,
      selectedCharacter: picked,
      owned: ids,
      deck: ids.slice(0, MAX_DECK),
    });
    navigate('/tutorial', { replace: true });
  };

  return (
    <div className="awaken">
      <header className="awaken-head">
        <p className="awaken-kicker">初次相遇</p>
        <h1 className="awaken-title">命定</h1>
        <p className="awaken-sub">
          星轨在此分岔。选择一位角色，接受她的全部记忆与卡牌，此后与她一同出牌。
        </p>
      </header>

      <div className="awaken-choices">
        {CHARACTERS.map((character) => (
          <button
            key={character.id}
            type="button"
            className={`awaken-choice ${picked === character.id ? 'is-picked' : ''}`}
            style={{ '--realm-color': REALM_COLORS[character.realm] } as CSSProperties}
            onClick={() => setPicked(character.id)}
            aria-pressed={picked === character.id}
          >
            <span className="awaken-frame">
              <img src={character.avatar} alt={character.name} draggable={false} />
            </span>
            <span className="awaken-name-row">
              <RealmIcon realm={character.realm} size={18} />
              <strong>{character.name}</strong>
              <span className="awaken-title-small">{character.title}</span>
            </span>
            <span className="awaken-lore">{character.lore}</span>
            <span className="awaken-count">
              {character.realm} · {cardsOfCharacter(character.id).length} 张卡牌
            </span>
            {picked === character.id ? <span className="awaken-picked">已选定</span> : null}
          </button>
        ))}
      </div>

      <footer className="awaken-foot">
        <button
          type="button"
          className="btn btn--primary"
          onClick={confirm}
          disabled={!chosen}
        >
          确认命定
        </button>
        <p className="awaken-hint">
          {chosen ? `${chosen.name} · ${chosen.realm}` : '选定后不可更改，请谨慎决定'}
        </p>
      </footer>
    </div>
  );
}
