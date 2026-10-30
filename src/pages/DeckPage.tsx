import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS, cardsOfCharacter, getCharacter, getOpponent } from '../data/cards';
import { loadSave, writeSave } from '../data/save';
import { MAX_DECK, MIN_DECK, isValidDeck } from '../game/deck';
import { CardView } from '../components/CardView';
import './deck.css';

export function DeckPage() {
  const navigate = useNavigate();
  const [save, setSave] = useState(loadSave);
  const [selected, setSelected] = useState<string[]>(save.deck);

  const character = getCharacter(save.selectedCharacter);
  const opponent = getOpponent(character.id);
  const owned = new Set(save.owned);
  const remaining = MIN_DECK - selected.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_DECK) return prev;
      return [...prev, id];
    });
  };

  const start = () => {
    if (!isValidDeck(selected)) return;
    const next = { ...save, deck: selected };
    writeSave(next);
    setSave(next);
    navigate('/battle');
  };

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="page-kicker">出战准备</p>
          <h1 className="page-title">构筑卡组</h1>
        </div>
        <div className="currency">
          已选 {selected.length} / {MAX_DECK}
        </div>
      </header>

      <div className="page-banner">
        从已拥有的卡牌中选择 {MIN_DECK}–{MAX_DECK} 张组成卡组，对手为 {opponent.name}（AI）。
      </div>

      {CHARACTERS.map((owner) => {
        const defs = cardsOfCharacter(owner.id);
        return (
          <div key={owner.id} className="pool-group">
            <h2>
              {owner.name} · {owner.realm}
            </h2>
            <div className="card-grid">
              {defs.map((def) => {
                const isOwned = owned.has(def.id);
                const order = selected.indexOf(def.id);
                return (
                  <button
                    key={def.id}
                    type="button"
                    className={`deck-card ${order >= 0 ? 'is-selected' : ''} ${
                      isOwned ? '' : 'is-locked'
                    }`}
                    onClick={() => isOwned && toggle(def.id)}
                    disabled={!isOwned}
                    aria-pressed={order >= 0}
                  >
                    {order >= 0 ? <span className="deck-card-order">{order + 1}</span> : null}
                    <CardView
                      card={{ uid: def.id, defId: def.id, power: def.power, maxPower: def.power }}
                      variant="grid"
                    />
                    <span className="deck-card-caption" title={def.name}>
                      {isOwned ? def.name : '未拥有'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="deck-bar">
        <div className="deck-bar-info">
          <span className="deck-bar-count">
            <b>{selected.length}</b> 张
          </span>
          <span className="deck-bar-hint">
            {remaining > 0 ? `还需 ${remaining} 张` : '可以出战'}
          </span>
        </div>
        <div className="deck-bar-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
          >
            清空
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={start}
            disabled={!isValidDeck(selected)}
          >
            开始对战
          </button>
        </div>
      </div>
    </section>
  );
}
