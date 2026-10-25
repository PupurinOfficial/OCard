import { useState } from 'react';
import { CARD_DEFS, CHARACTERS, cardsOfCharacter } from '../data/cards';
import { loadSave } from '../data/save';
import { CardView } from '../components/CardView';

export function CollectionPage() {
  const [save] = useState(loadSave);
  const owned = new Set(save.owned);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="page-kicker">收藏</p>
          <h1 className="page-title">卡牌图鉴</h1>
        </div>
        <div className="currency">
          已拥有 {save.owned.length} / {CARD_DEFS.length} 张
        </div>
      </header>

      {CHARACTERS.map((character) => (
        <div key={character.id} className="pool-group">
          <h2>
            {character.name} · {character.realm}
          </h2>
          <div className="card-grid">
            {cardsOfCharacter(character.id).map((def) => (
              <div
                key={def.id}
                className={`card-grid-item ${owned.has(def.id) ? '' : 'is-locked'}`}
              >
                <CardView
                  card={{ uid: def.id, defId: def.id, power: def.power, maxPower: def.power }}
                  variant="grid"
                />
                <div className="card-grid-caption">
                  {def.name}
                  <span>{def.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
