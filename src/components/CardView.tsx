import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { effectText, getCardDef } from '../data/cards';
import type { CardInstance } from '../game/types';
import { RealmIcon } from './RealmIcon';
import { TypeIcon } from './TypeIcon';
import './card.css';

const RELIVE_CLASS: Record<string, string> = {
  天堂: 'card--relive-heaven',
  地狱: 'card--relive-hell',
  人界: 'card--relive-human',
};

const PANEL_HALF = 134;

interface InfoPos {
  left: number;
  top: number;
  below: boolean;
}

export type CardVariant = 'field' | 'hand' | 'grid';

export function CardView({ card, variant = 'field' }: { card: CardInstance; variant?: CardVariant }) {
  const def = getCardDef(card.defId);
  const cardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<InfoPos | null>(null);
  const [hovered, setHovered] = useState(false);
  const [info, setInfo] = useState<InfoPos | null>(null);

  useEffect(() => {
    if (!hovered) {
      setInfo(null);
      posRef.current = null;
      return;
    }

    let raf = 0;
    const tick = () => {
      const el = cardRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const left = Math.min(
          Math.max(rect.left + rect.width / 2, PANEL_HALF + 12),
          window.innerWidth - PANEL_HALF - 12,
        );
        const below = rect.top < 224;
        const top = below ? rect.bottom + 12 : rect.top - 12;
        const prev = posRef.current;
        if (
          !prev ||
          Math.abs(prev.left - left) > 0.5 ||
          Math.abs(prev.top - top) > 0.5 ||
          prev.below !== below
        ) {
          const next = { left, top, below };
          posRef.current = next;
          setInfo(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  const classes = ['card', `card--${variant}`];
  if (card.power < card.maxPower) classes.push('card--hurt');
  if (card.relive) classes.push('card--relive', RELIVE_CLASS[card.relive.realm]);

  const effect = effectText(def);

  return (
    <>
      <div
        ref={cardRef}
        className={classes.join(' ')}
        aria-label={`${def.name}，${def.type}，生力 ${card.power}`}
        onPointerEnter={() => {
          if (window.matchMedia('(hover: none)').matches) return;
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
        <img className="card__art" src={def.art} alt="" draggable={false} />
        <div className="card__scrim" aria-hidden="true" />
        <div className="card__realm">
          <RealmIcon realm={def.realm} size={22} />
        </div>
        <div className="card__power">{card.power}</div>
        <div className="card__type">
          <TypeIcon type={def.type} size={22} />
        </div>
        {card.relive ? <div className="card__relive">Relive</div> : null}
      </div>

      {hovered && info
        ? createPortal(
            <div
              className={`card-info ${info.below ? 'card-info--below' : ''}`}
              style={{ left: info.left, top: info.top }}
            >
              <div className="card-info__head">
                <strong>{def.name}</strong>
                <span>{def.rarity}</span>
              </div>
              <div className="card-info__meta">
                {def.type} · {def.realm}
              </div>
              <div className="card-info__power">
                生力
                <b>{card.power}</b>
                {card.power < card.maxPower ? <small>/ {card.maxPower}</small> : null}
              </div>
              <div className="card-info__row">
                <span className="card-info__label">使用效果</span>
                <span className={effect ? 'card-info__effect' : 'card-info__muted'}>
                  {effect ?? '无'}
                </span>
              </div>
              <div className="card-info__row">
                <span className="card-info__label">描述</span>
                <span className="card-info__lore">{def.lore}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
