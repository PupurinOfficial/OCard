import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { REALM_COLORS, effectText, getCardDef, getCharacter } from '../data/cards';
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

export type CardVariant = 'field' | 'hand' | 'grid' | 'board' | 'guard';

export function CardView({ card, variant = 'field' }: { card: CardInstance; variant?: CardVariant }) {
  const def = getCardDef(card.defId);
  const glory = card.glory ?? 0;
  const supportColor = getCharacter(def.character).color;
  const iconSize = variant === 'board' ? 34 : 22;
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
  if (glory >= 2) classes.push(`card--glory-${glory}`);

  const effect = effectText(def);
  const gloryStyle = { '--glory-color': supportColor } as CSSProperties;

  return (
    <>
      <div
        ref={cardRef}
        className={classes.join(' ')}
        style={glory >= 2 ? gloryStyle : undefined}
        aria-label={`${def.name}，${def.type}，生力 ${card.power}${
          glory > 0 ? `，光辉 ${glory}` : ''
        }`}
        onPointerEnter={() => {
          if (window.matchMedia('(hover: none)').matches) return;
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
        {def.art ? (
          <img className="card__art" src={def.art} alt="" draggable={false} />
        ) : (
          <div
            className="card__fallback"
            style={{ '--fallback-color': REALM_COLORS[def.realm] } as CSSProperties}
            aria-hidden="true"
          >
            <span className="card__fallback-glyph">⊙</span>
            <span className="card__fallback-name">{def.name}</span>
          </div>
        )}
        <div className="card__scrim" aria-hidden="true" />
        {glory >= 3
          ? [0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`card__shard card__shard--${index + 1}`}
                aria-hidden="true"
              />
            ))
          : null}
        <div className="card__realm">
          <RealmIcon realm={def.realm} size={iconSize} />
        </div>
        <div className="card__power">{card.power}</div>
        <div className="card__type">
          <TypeIcon type={def.type} size={iconSize} />
        </div>
        {card.relive ? <div className="card__relive">Relive</div> : null}
      </div>

      {hovered && info
        ? createPortal(
            <div
              className={`card-info ${info.below ? 'card-info--below' : ''} ${
                glory >= 3 ? 'card-info--glory-3' : ''
              }`}
              style={{
                left: info.left,
                top: info.top,
                ...(glory >= 3 ? gloryStyle : {}),
              }}
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
              {glory > 0 ? (
                <div className="card-info__row">
                  <span className="card-info__label">光辉</span>
                  <span className="card-info__glory">
                    <b>
                      {'◆'.repeat(glory)}
                      {'◇'.repeat(3 - glory)}
                    </b>
                    <em>
                      {glory} / 3 · 生力 +{glory * 25}%
                    </em>
                  </span>
                </div>
              ) : null}
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
