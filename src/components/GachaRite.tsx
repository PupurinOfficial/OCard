import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getCardDef } from '../data/cards';
import { poweredPower } from '../game/glory';
import { CardView } from './CardView';
import { OverflowIcon } from './OverflowIcon';

export interface PullResult {
  defId: string;
  dup: boolean;
  /** 本次复现后的光辉等级 */
  glory: number;
  /** 该卡牌光辉已满，本次复现转化为 1 枚「满溢之辉」 */
  overflow?: boolean;
}

interface Props {
  loopName: string;
  results: PullResult[];
  revealed: boolean;
  onClose: () => void;
}

const TICKS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  const inner = index % 3 === 0 ? 70 : 76;
  return {
    x1: 100 + inner * Math.sin(angle),
    y1: 100 - inner * Math.cos(angle),
    x2: 100 + 84 * Math.sin(angle),
    y2: 100 - 84 * Math.cos(angle),
    major: index % 3 === 0,
  };
});

export function GachaRite({ loopName, results, revealed, onClose }: Props) {
  const n = results.length;
  const multi = n > 1;
  const overflowGained = results.filter((result) => result.overflow).length;

  return createPortal(
    <div className={`rite ${revealed ? 'is-revealed' : ''}`}>
      <div className="rite-anim" aria-hidden={revealed}>
        <svg className="rite-dial" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="dial-arc" cx="100" cy="100" r="88" />
          <circle className="dial-ring" cx="100" cy="100" r="88" />
          <g className="dial-ticks">
            {TICKS.map((tick, index) => (
              <line
                key={index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                className={tick.major ? 'is-major' : ''}
              />
            ))}
          </g>
        </svg>

        <div className="rite-hands">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <g className="hand-hour">
              <line x1="100" y1="100" x2="100" y2="58" />
            </g>
            <g className="hand-minute">
              <line x1="100" y1="100" x2="100" y2="34" />
            </g>
            <circle className="hand-pin" cx="100" cy="100" r="4.4" />
          </svg>
        </div>

        <div className="rite-cards">
          {results.map((result, index) => {
            const angle = n === 1 ? -360 : -90 - (index / n) * 360;
            const radius = n === 1 ? 0 : 150;
            return (
              <div
                key={`${result.defId}-${index}`}
                className="rite-card"
                style={
                  {
                    '--a': `${angle}deg`,
                    '--r': `${radius}px`,
                    '--d': `${index * 40}ms`,
                  } as CSSProperties
                }
              >
                <div className="rite-card-face">
                  <span>⊙</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="rite-status">复现中</p>
      </div>

      {revealed ? (
        <div className="rite-result">
          <p className="rite-kicker">回环 · {loopName}</p>
          <h2 className="rite-title">{multi ? '十次复现' : '一次复现'}</h2>
          <div className={`rite-gains ${multi ? 'is-multi' : ''}`}>
            {results.map((result, index) => {
              const def = getCardDef(result.defId);
              const power = poweredPower(def.power, result.glory);
              return (
                <div
                  key={`gain-${result.defId}-${index}`}
                  className="rite-gain"
                  style={{ '--i': index } as CSSProperties}
                >
                  <CardView
                    card={{
                      uid: `gain-${index}`,
                      defId: result.defId,
                      power,
                      maxPower: power,
                      glory: result.glory,
                    }}
                    variant="grid"
                  />
                  <span className="rite-gain-name">{def.name}</span>
                  <span className={`rite-gain-tag ${result.dup ? 'is-dup' : ''} ${result.overflow ? 'is-overflow' : ''}`}>
                    {result.overflow
                      ? '满溢之辉 +1'
                      : result.dup
                        ? `光辉 ${result.glory}`
                        : '新卡牌'}
                  </span>
                </div>
              );
            })}
          </div>
          {overflowGained > 0 ? (
            <p className="rite-overflow">
              <OverflowIcon size={14} />
              满溢之辉 <b>+{overflowGained}</b>
              <span>光辉已满，溢出的光辉凝成了满溢之辉</span>
            </p>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={onClose}>
            收下
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
