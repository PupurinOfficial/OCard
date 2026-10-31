import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CARD_DEFS, getCardDef } from '../data/cards';
import { LOOPS } from '../data/loops';
import { loadSave, writeSave } from '../data/save';
import { MAX_GLORY, OVERFLOW_PER_RING, poweredPower } from '../game/glory';
import { CardView } from '../components/CardView';
import { GachaRite } from '../components/GachaRite';
import type { PullResult } from '../components/GachaRite';
import { RingIcon } from '../components/RingIcon';
import { OverflowIcon } from '../components/OverflowIcon';
import './gacha.css';

const RITE_MS = 3800;
const COST_PER_PULL = 1;

interface Pull {
  results: PullResult[];
  revealed: boolean;
}

/** 记忆之环不足时，等待玩家确认用满溢之辉补足的复现 */
interface PendingPull {
  times: number;
  cost: number;
  deficit: number;
  overflow: number;
}

export function GachaPage() {
  const [save, setSave] = useState(loadSave);
  const [loopId, setLoopId] = useState(LOOPS[0].id);
  const [pull, setPull] = useState<Pull | null>(null);
  const [pending, setPending] = useState<PendingPull | null>(null);

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

  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  /** 记忆之环不足时，满溢之辉是否足以补足（5 枚 = 1 环） */
  const canAfford = (times: number) => {
    const cost = times * COST_PER_PULL;
    const deficit = Math.max(0, cost - save.rings);
    return deficit === 0 || save.overflow >= deficit * OVERFLOW_PER_RING;
  };

  const runPull = (times: number, ringsUsed: number, overflowUsed: number) => {
    const owned = new Set(save.owned);
    const nextOwned = [...save.owned];
    const glory = { ...save.glory };
    const results: PullResult[] = [];
    let overflowGained = 0;

    for (let i = 0; i < times; i += 1) {
      const id = pool[Math.floor(Math.random() * pool.length)];
      const dup = owned.has(id);
      if (!dup) {
        owned.add(id);
        nextOwned.push(id);
        results.push({ defId: id, dup, glory: glory[id] ?? 0 });
        continue;
      }
      const level = glory[id] ?? 0;
      if (level >= MAX_GLORY) {
        // 光辉已满，本次复现转化为 1 枚满溢之辉
        overflowGained += 1;
        results.push({ defId: id, dup, glory: level, overflow: true });
        continue;
      }
      // 重复获得解锁一重光辉，上限 3
      glory[id] = Math.min(MAX_GLORY, level + 1);
      results.push({ defId: id, dup, glory: glory[id] });
    }

    const next = {
      ...save,
      owned: nextOwned,
      glory,
      rings: save.rings - ringsUsed,
      overflow: save.overflow - overflowUsed + overflowGained,
    };
    setSave(next);
    writeSave(next);
    setPull({ results, revealed: false });
  };

  const requestPull = (times: number) => {
    if (pull || pending) return;
    const cost = times * COST_PER_PULL;
    const deficit = Math.max(0, cost - save.rings);
    if (deficit === 0) {
      runPull(times, cost, 0);
      return;
    }
    const overflow = deficit * OVERFLOW_PER_RING;
    if (save.overflow >= overflow) setPending({ times, cost, deficit, overflow });
  };

  const confirmPending = () => {
    if (!pending) return;
    runPull(pending.times, pending.cost - pending.deficit, pending.overflow);
    setPending(null);
  };

  return (
    <section className="gacha">
      <div
        className="gacha-wallet"
        title="每次复现消耗 1 枚记忆之环；记忆之环不足时，可用 5 枚满溢之辉补足 1 枚"
      >
        <span className="gacha-wallet-item">
          <RingIcon />
          记忆之环 <b>{save.rings}</b>
        </span>
        <span className="gacha-wallet-sep" aria-hidden="true" />
        <span className="gacha-wallet-item">
          <OverflowIcon />
          满溢之辉 <b>{save.overflow}</b>
        </span>
      </div>

      <Link to="/shop" className="gacha-shop-link">
        <OverflowIcon size={13} />
        坠梦易物之所 →
      </Link>

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
                  const glory = save.glory[id] ?? 0;
                  const power = poweredPower(def.power, glory);
                  return (
                    <div className="marquee-card" key={`${copy}-${id}`}>
                      <CardView
                        card={{
                          uid: `${copy}-${id}`,
                          defId: id,
                          power,
                          maxPower: power,
                          glory,
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
          {save.rings < COST_PER_PULL * 10
            ? ' · 记忆之环不足 10 时只能单次复现，或用满溢之辉补足'
            : ''}
        </p>
      </div>

      <div className="gacha-actions">
        <button
          type="button"
          className="pull-btn"
          onClick={() => requestPull(1)}
          disabled={!!pull || !!pending || !canAfford(1)}
        >
          <span>复现</span>
          <b>×1</b>
          <small>{COST_PER_PULL} 环</small>
        </button>
        <button
          type="button"
          className="pull-btn pull-btn--primary"
          onClick={() => requestPull(10)}
          disabled={!!pull || !!pending || !canAfford(10)}
        >
          <span>复现</span>
          <b>×10</b>
          <small>{COST_PER_PULL * 10} 环</small>
        </button>
      </div>

      {pending ? (
        <div className="gacha-confirm-mask" onClick={() => setPending(null)}>
          <div
            className="gacha-confirm"
            role="dialog"
            aria-modal="true"
            aria-label="满溢之辉补足记忆之环"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="gacha-confirm-kicker">记忆之环不足</p>
            <h2 className="gacha-confirm-title">
              使用 {pending.overflow} 枚满溢之辉
              <br />
              补足 {pending.deficit} 枚记忆之环？
            </h2>
            <div className="gacha-confirm-rows">
              <div>
                <span>本次复现</span>
                <b>×{pending.times}</b>
              </div>
              <div>
                <span>需要记忆之环</span>
                <b>{pending.cost} 枚</b>
              </div>
              <div>
                <span>现有记忆之环</span>
                <b>{save.rings} 枚</b>
              </div>
              <div className="is-highlight">
                <span>将消耗满溢之辉</span>
                <b>{pending.overflow} 枚</b>
              </div>
            </div>
            <p className="gacha-confirm-note">
              5 枚「满溢之辉」= 1 枚「记忆之环」。使用后剩余{' '}
              {save.overflow - pending.overflow} 枚满溢之辉。
            </p>
            <div className="gacha-confirm-actions">
              <button type="button" className="btn" onClick={() => setPending(null)}>
                取消
              </button>
              <button type="button" className="btn btn--primary" onClick={confirmPending}>
                使用满溢之辉
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
