import { useEffect, useRef, useState } from 'react';
import { loadSave, writeSave } from '../data/save';
import { OVERFLOW_PER_RING } from '../game/glory';
import { RingIcon } from '../components/RingIcon';
import { OverflowIcon } from '../components/OverflowIcon';
import './shop.css';

interface Toast {
  id: number;
  text: string;
}

export function ShopPage() {
  const [save, setSave] = useState(loadSave);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastSeed = useRef(0);
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const canTrade = save.overflow >= OVERFLOW_PER_RING;
  const missing = Math.max(0, OVERFLOW_PER_RING - save.overflow);
  const tradeable = Math.floor(save.overflow / OVERFLOW_PER_RING);

  const trade = () => {
    if (!canTrade) return;
    const next = {
      ...save,
      overflow: save.overflow - OVERFLOW_PER_RING,
      rings: save.rings + 1,
    };
    setSave(next);
    writeSave(next);

    toastSeed.current += 1;
    const id = toastSeed.current;
    setToast({ id, text: `记忆之环 +1 · 满溢之辉 −${OVERFLOW_PER_RING}` });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 2000);
  };

  return (
    <section className="page shop-page">
      <header className="page-head">
        <div>
          <p className="page-kicker">坠梦 · 易物</p>
          <h1 className="page-title">坠梦易物之所</h1>
        </div>
        <div className="shop-wallet">
          <span className="shop-wallet-item">
            <RingIcon />
            记忆之环 <b>{save.rings}</b>
          </span>
          <span className="shop-wallet-sep" aria-hidden="true" />
          <span className="shop-wallet-item">
            <OverflowIcon />
            满溢之辉 <b>{save.overflow}</b>
          </span>
        </div>
      </header>

      <p className="page-banner">
        梦境深处的小小摊位。摊主说，溢出的光辉若无处安放，不如换一次重回梦中的机会。
      </p>

      <div className="shop-shelf">
        <article className="shop-item">
          <div className="shop-item-art" aria-hidden="true">
            <span className="shop-item-halo" />
            <RingIcon size={64} />
          </div>
          <p className="shop-item-kind">易物 · 货币</p>
          <h2 className="shop-item-name">记忆之环</h2>
          <p className="shop-item-desc">
            一次「复现」所需的环。由记忆与光阴凝成，也可用溢出的光辉换取。
          </p>

          <div className="shop-item-price">
            <OverflowIcon size={16} />
            <b>{OVERFLOW_PER_RING}</b>
            <span>满溢之辉</span>
            <i aria-hidden="true">→</i>
            <RingIcon size={16} />
            <b>1</b>
            <span>记忆之环</span>
          </div>

          <button
            type="button"
            className="btn shop-item-buy"
            onClick={trade}
            disabled={!canTrade}
          >
            兑换 1 枚
          </button>
          <p className="shop-item-hint">
            {canTrade
              ? `当前满溢之辉可兑换 ${tradeable} 枚记忆之环`
              : `满溢之辉不足，还需 ${missing} 枚`}
          </p>
        </article>
      </div>

      <p className="shop-foot">
        兑换比例：5 枚「满溢之辉」= 1 枚「记忆之环」。满溢之辉会在复现到光辉已满的卡牌时获得。
      </p>

      {toast ? (
        <div key={toast.id} className="shop-toast" role="status">
          <RingIcon size={14} />
          {toast.text}
        </div>
      ) : null}
    </section>
  );
}
