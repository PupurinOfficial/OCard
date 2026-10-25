import { useEffect, useState } from 'react';
import { CARD_DEFS, getCardDef } from '../data/cards';
import { LOOPS } from '../data/loops';
import { loadSave, writeSave } from '../data/save';
import { CardView } from '../components/CardView';
import { GachaRite } from '../components/GachaRite';
import type { PullResult } from '../components/GachaRite';
import { RingIcon } from '../components/RingIcon';
import './gacha.css';

const RITE_MS = 3800;
const COST_PER_PULL = 1;

interface Pull {
  results: PullResult[];
  revealed: boolean;
}

export function GachaPage() {
  const [save, setSave] = useState(loadSave);
  const [loopId, setLoopId] = useState(LOOPS[0].id);
  const [pull, setPull] = useState<Pull | null>(null);

  const loop = LOOPS.find((item) => item.id === loopId) ?? LOOPS[0];
  const pool = loop.cardIds.length > 0 ? loop.cardIds : CARD_DEFS.map((def) => def.id);
  const ownedCount = new Set(save.owned).size;

  useEffect(() => {
    if (!pull || pull.revealed) return;
    const timer = window.setTimeout(() => {
      setPull((prev) => (prev ? { ...prev, revealed: true } : prev));
    }, RITE_MS);
    return () => window.clearTimeout(timer);
  }, [pull]);

  const draw = (times: number) => {
    if (pull) return;
    const cost = times * COST_PER_PULL;
    if (save.rings < cost) return;

    const owned = new Set(save.owned);
    const nextOwned = [...save.owned];
    const results: PullResult[] = [];

    for (let i = 0; i < times; i += 1) {
      const id = pool[Math.floor(Math.random() * pool.length)];
      const dup = owned.has(id);
      if (!dup) {
        owned.add(id);
        nextOwned.push(id);
      }
      results.push({ defId: id, dup });
    }

    const next = { ...save, owned: nextOwned, rings: save.rings - cost };
    setSave(next);
    writeSave(next);
    setPull({ results, revealed: false });
  };

  return (
    <section className="gacha">
      <div className="gacha-wallet" title="每次复现消耗 1 枚记忆之环">
        <RingIcon />
        记忆之环 <b>{save.rings}</b>
      </div>

      <aside className="loop-rail">
        <p className="loop-rail-kicker">回环</p>
        {LOOPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`loop-item ${item.id === loop.id ? 'is-active' : ''}`}
            onClick={() => {
              if (!pull) setLoopId(item.id);
            }}
          >
            <span className="loop-item-name">{item.name}</span>
            <span className="loop-item-meta">
              {item.subtitle} · {item.cardIds.length} 张
            </span>
          </button>
        ))}
      </aside>

      <div className="gacha-main">
        <p className="page-kicker">光阴回转之间</p>
        <h1 className="gacha-name">{loop.name}</h1>
        <p className="gacha-desc">{loop.description}</p>

        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div className="marquee-group" key={copy} aria-hidden={copy === 1}>
                {pool.map((id) => {
                  const def = getCardDef(id);
                  return (
                    <div className="marquee-card" key={`${copy}-${id}`}>
                      <CardView
                        card={{
                          uid: `${copy}-${id}`,
                          defId: id,
                          power: def.power,
                          maxPower: def.power,
                        }}
                        variant="grid"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="gacha-owned">
          已拥有 {ownedCount} / {CARD_DEFS.length} 张
          {save.rings < COST_PER_PULL * 10 ? ' · 记忆之环不足 10 时只能单次复现' : ''}
        </p>
      </div>

      <div className="gacha-actions">
        <button
          type="button"
          className="pull-btn"
          onClick={() => draw(1)}
          disabled={!!pull || save.rings < COST_PER_PULL}
        >
          <span>复现</span>
          <b>×1</b>
          <small>{COST_PER_PULL} 环</small>
        </button>
        <button
          type="button"
          className="pull-btn pull-btn--primary"
          onClick={() => draw(10)}
          disabled={!!pull || save.rings < COST_PER_PULL * 10}
        >
          <span>复现</span>
          <b>×10</b>
          <small>{COST_PER_PULL * 10} 环</small>
        </button>
      </div>

      {pull ? (
        <GachaRite
          loopName={loop.name}
          results={pull.results}
          revealed={pull.revealed}
          onClose={() => setPull(null)}
        />
      ) : null}
    </section>
  );
}
