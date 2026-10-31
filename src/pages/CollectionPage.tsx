import { useState } from 'react';
import { CARD_DEFS, CHARACTERS, cardsOfCharacter } from '../data/cards';
import { loadSave, writeSave } from '../data/save';
import { BOARD_CARD_LIMIT, BOARD_MIN_GLORY, MAX_GLORY, poweredPower } from '../game/glory';
import { CardView } from '../components/CardView';

export function CollectionPage() {
  const [save, setSave] = useState(loadSave);
  const owned = new Set(save.owned);
  const boardFull = save.boardCards.length >= BOARD_CARD_LIMIT;

  const toggleBoard = (id: string) => {
    const inBoard = save.boardCards.includes(id);
    if (!inBoard && boardFull) return;
    const boardCards = inBoard
      ? save.boardCards.filter((item) => item !== id)
      : [...save.boardCards, id];
    const next = { ...save, boardCards };
    setSave(next);
    writeSave(next);
  };

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="page-kicker">收藏</p>
          <h1 className="page-title">卡牌图鉴</h1>
        </div>
        <div className="currency">
          已拥有 {save.owned.length} / {CARD_DEFS.length} 张 · 看板 {save.boardCards.length} /{' '}
          {BOARD_CARD_LIMIT}
        </div>
      </header>

      {CHARACTERS.map((character) => (
        <div key={character.id} className="pool-group">
          <h2>
            {character.name} · {character.realm}
          </h2>
          <div className="card-grid">
            {cardsOfCharacter(character.id).map((def) => {
              const isOwned = owned.has(def.id);
              const glory = save.glory[def.id] ?? 0;
              const power = poweredPower(def.power, glory);
              const inBoard = save.boardCards.includes(def.id);
              const canToggle = isOwned && (inBoard || (glory >= BOARD_MIN_GLORY && !boardFull));
              const hint = !isOwned
                ? '尚未获得'
                : inBoard
                  ? '从首页看板撤下'
                  : glory < BOARD_MIN_GLORY
                    ? `光辉达到 ${BOARD_MIN_GLORY} 后可设为看板`
                    : boardFull
                      ? `看板最多 ${BOARD_CARD_LIMIT} 张`
                      : '设为首页看板';

              return (
                <div
                  key={def.id}
                  className={`card-grid-item ${isOwned ? '' : 'is-locked'}`}
                >
                  <CardView
                    card={{
                      uid: def.id,
                      defId: def.id,
                      power,
                      maxPower: power,
                      glory,
                    }}
                    variant="grid"
                  />
                  <div className="card-grid-caption" title={def.name}>
                    <span className="card-grid-name">{def.name}</span>
                    <span className="card-grid-rarity">{def.rarity}</span>
                    <span className="card-grid-glory" title="重复获得可提升光辉">
                      <span className="card-grid-glory-pips" aria-hidden="true">
                        {Array.from({ length: MAX_GLORY }, (_, index) => (
                          <i key={index} className={index < glory ? 'is-on' : ''} />
                        ))}
                      </span>
                      光辉 {glory} · 生力 {power}
                    </span>
                  </div>
                  {isOwned ? (
                    <button
                      type="button"
                      className={`board-toggle ${inBoard ? 'is-on' : ''}`}
                      onClick={() => toggleBoard(def.id)}
                      disabled={!canToggle}
                      title={hint}
                    >
                      {inBoard ? '撤下看板' : '设为看板'}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
